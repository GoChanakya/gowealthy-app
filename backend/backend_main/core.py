"""Shared plumbing: settings, file access, NAV loading + jump cleaning, Scheme Master, dataset writer."""
import io
import json
import logging
import os
import re
from datetime import date, datetime, time, timedelta, timezone

import numpy as np
import pandas as pd
import pyarrow as pa
import pyarrow.compute as pc
import pyarrow.dataset as ds
import pyarrow.parquet as pq
from pyarrow import fs as pafs

SRC_URI = os.getenv("SRC_URI", "gs://mf-data-public/nav_history.parquet")
SCHEME_MASTER_URI = os.getenv("SCHEME_MASTER_URI", "gs://mf-data-public/Scheme Master.csv")
MONTHLY_RETURNS_URI = os.getenv("MONTHLY_RETURNS_URI", "gs://mf-data-public/monthly_returns/monthly_returns_latest.parquet")
MOMENTUM_UNIVERSE_URI = os.getenv("MOMENTUM_UNIVERSE_URI", "gs://mf-data-public/momentum-rank/latest_rank_momentum.csv")
RESILIENCE_URI = os.getenv("RESILIENCE_URI", "gs://mf-data-public/resilience-score-v2/latest_scores.parquet")
DST_ROOT = os.getenv("DST_ROOT", "gs://mf-data-public/backend_main_kartik")

LOOKBACK_DAYS = int(os.getenv("LOOKBACK_DAYS", "400"))  # returns window (all plans)
HISTORY_START = date.fromisoformat(os.getenv("HISTORY_START", "2015-08-01"))  # primaries: covers the 2015 event
TOLERANCE_DAYS = int(os.getenv("TOLERANCE_DAYS", "7"))  # max gap back to a base / event-start NAV
STALE_DAYS = int(os.getenv("STALE_DAYS", "10"))  # no NAV this recent = inactive scheme
JUMP_RATIO = float(os.getenv("JUMP_RATIO", "2"))  # one-day move beyond x2 or /2 gets classified
FV_TOLERANCE = 0.05  # within 5% of an exact power of 10 = face-value change
REVERT_DAYS, REVERT_TOLERANCE = 3, 0.02  # back within 2% of the pre-jump NAV inside 3 days = bad data
RESET_NAVS = np.array([10.0, 100.0, 1000.0])  # NAV landing exactly here after a jump = payout/plan reset
DAYS_PER_MONTH = 30.44  # same conversion as resilience-score-v2
IST = timezone(timedelta(hours=5, minutes=30))

log = logging.getLogger("backend_main")
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")


def open_fs(uri: str):
    """(filesystem, path) for gs:// or local; unlike FileSystem.from_uri it allows spaces in names."""
    return (pafs.GcsFileSystem(), uri[5:]) if uri.startswith("gs://") else pafs.FileSystem.from_uri(uri)


def now_ist() -> datetime:
    return datetime.now(IST)


# ---------------------------------------------------------------- Scheme Master
def load_scheme_master() -> pd.DataFrame:
    """All plans with the fields the datasets need; scheme codes as stripped strings."""
    fs, path = open_fs(SCHEME_MASTER_URI)
    with fs.open_input_file(path) as f:
        sm = pd.read_csv(f, dtype=str, encoding_errors="replace")
    sm.columns = sm.columns.str.strip()
    sm = sm.apply(lambda c: c.str.strip())
    sm["Code"] = sm["Code"].str.removesuffix(".0")
    sm["rootPrimary_v1"] = sm["rootPrimary_v1"].str.removesuffix(".0")
    sm["category_label"] = sm["GOC_sub_category"].fillna(sm["Sub-Category"]).fillna(sm["Scheme Category"])
    sm["launch_date"] = pd.to_datetime(sm["Launch Date"], format="%d-%b-%Y", errors="coerce")
    return sm.drop_duplicates("Code").set_index("Code")


def amc_short_name(name: str) -> str:
    """'Aditya Birla Sun Life AMC Limited' -> 'Aditya Birla Sun Life'."""
    pat = r"\s*\b(Asset (Management|Managers|Mgmt\.?)|AMC|Investment (Managers|Management)|Funds Management|Money Managers|Mutual Fund)\b.*$"
    return re.sub(pat, "", name or "", flags=re.I).strip() or (name or "")


# ---------------------------------------------------------------- NAV
def load_nav(today: date, primary_codes) -> tuple[pd.DataFrame, pd.DataFrame]:
    """One scan of nav_history: (all plans for the returns window, primary plans since HISTORY_START)."""
    fs, path = open_fs(SRC_URI)
    recent = pc.field("date") >= pa.scalar(today - timedelta(days=LOOKBACK_DAYS), pa.date32())
    primary = pc.field("scheme_code").isin(pa.array(sorted(map(int, primary_codes)), pa.int32())) & (
        pc.field("date") >= pa.scalar(HISTORY_START, pa.date32())
    )
    df = ds.dataset(path, filesystem=fs, format="parquet").to_table(
        columns=["scheme_code", "date", "nav"], filter=recent | primary
    ).to_pandas(date_as_object=False)
    df = df.rename(columns={"date": "nav_date"})
    df["nav_date"] = pd.to_datetime(df["nav_date"])
    df["scheme_code"] = df["scheme_code"].astype(str)
    df = (
        df[df["nav"].gt(0)]
        .drop_duplicates(["scheme_code", "nav_date"], keep="last")
        .sort_values(["scheme_code", "nav_date"], kind="stable", ignore_index=True)
    )
    is_primary = df["scheme_code"].isin(set(map(str, primary_codes)))
    cutoff = pd.Timestamp(today - timedelta(days=LOOKBACK_DAYS))
    return df[df["nav_date"].ge(cutoff)].reset_index(drop=True), df[is_primary].reset_index(drop=True)


def clean_jumps(df: pd.DataFrame):
    """Classify one-day NAV jumps beyond JUMP_RATIO.

    1. Back within 2% of the pre-jump NAV inside 3 days -> bad data: those days are dropped.
    2. Within 5% of x10 / x100 (or /10, /100)         -> face-value change: earlier NAVs are rescaled
       by exactly that power of 10 (nav_adj), so any return across it stays correct.
    3. Lands on exactly 10 / 100 / 1,000               -> payout / plan reset: starts a new segment
       (seg); nothing may be compared across segments.
    4. Anything else                                   -> kept as a real gain or loss.
    Returns (df with nav_adj + seg + fv_power, last face-value change per scheme, last reset per scheme, days dropped).
    """
    sc = df["scheme_code"]
    g = df.groupby(sc, sort=False)["nav"]
    prev = g.shift()
    ratio = df["nav"] / prev
    jump = ratio.gt(JUMP_RATIO) | ratio.lt(1 / JUMP_RATIO)

    bad = found = pd.Series(False, index=df.index)
    for j in range(1, REVERT_DAYS + 1):
        back = jump & ~found & (g.shift(-j) / prev - 1).abs().lt(REVERT_TOLERANCE)
        for k in range(j):
            bad = bad | back.groupby(sc).shift(k, fill_value=False)
        found = found | back
    df = df[~bad].reset_index(drop=True)

    sc = df["scheme_code"]
    ratio = df["nav"] / df.groupby(sc, sort=False)["nav"].shift()
    jump = ratio.gt(JUMP_RATIO) | ratio.lt(1 / JUMP_RATIO)
    power = np.log10(ratio).round()

    fv = jump & (ratio / 10.0**power - 1).abs().le(FV_TOLERANCE)
    steps = power.where(fv, 0.0)
    later = steps[::-1].groupby(sc[::-1]).cumsum()[::-1] - steps
    df["nav_adj"] = df["nav"] * 10.0**later
    df["fv_power"] = steps.astype("int8")  # e.g. -1 on the day NAV was divided by 10

    reset = jump & ~fv & np.isclose(df["nav"].to_numpy()[:, None], RESET_NAVS, atol=0.005).any(axis=1)
    df["seg"] = reset.astype("int32").groupby(sc).cumsum()
    last = lambda mask: df.loc[mask].groupby("scheme_code")["nav_date"].max()
    return df, last(fv), last(reset), int(bad.sum())


# ---------------------------------------------------------------- writing
def ensure_folders(folders) -> None:
    """Create one empty marker per dataset folder under DST_ROOT on first run; no-op afterwards."""
    if not DST_ROOT.startswith("gs://"):
        return
    from google.cloud import storage

    bucket_name, _, prefix = DST_ROOT[5:].partition("/")
    bucket = storage.Client().bucket(bucket_name)
    for folder in folders:
        marker = bucket.blob(f"{prefix}/{folder}/.keep".lstrip("/"))
        if not marker.exists():
            marker.upload_from_string(b"")


def envelope(dataset: str, as_of: str, funds: dict, method: dict | None = None, **extra) -> dict:
    return {
        "schema_version": "1.0",
        "dataset": dataset,
        "as_of_date": as_of,
        "generated_at": now_ist().isoformat(timespec="seconds"),
        **({"method": method} if method else {}),
        **extra,
        "count": len(funds),
        "funds": funds,
    }


def _json_default(o):
    if isinstance(o, (pd.Timestamp, datetime, date)):
        return o.strftime("%Y-%m-%d")
    if isinstance(o, np.integer):
        return int(o)
    if isinstance(o, np.floating):
        return None if np.isnan(o) else float(o)
    if isinstance(o, np.bool_):
        return bool(o)
    raise TypeError(type(o))


def _no_nan(o):
    """NaN/NaT anywhere in the payload -> null (JSON has no NaN)."""
    if isinstance(o, dict):
        return {k: _no_nan(v) for k, v in o.items()}
    if isinstance(o, list):
        return [_no_nan(v) for v in o]
    if o is pd.NaT or (isinstance(o, float) and o != o):
        return None
    return o


def to_json_bytes(payload: dict) -> bytes:
    return json.dumps(_no_nan(payload), separators=(",", ":"), allow_nan=False, default=_json_default).encode()


def _excel_cells(col: pd.Series) -> list:
    """Column -> plain Python values for xlsxwriter: dates as datetime, NaN/NaT as blank, nested values as text."""
    if pd.api.types.is_datetime64_any_dtype(col):
        col = col.dt.tz_localize(None) if isinstance(col.dtype, pd.DatetimeTZDtype) else col
        return [None if pd.isna(v) else v.to_pydatetime() for v in col]
    vals = col.astype(object).where(col.notna(), None).tolist()
    return [str(v) if isinstance(v, (dict, list, tuple, set)) else v.to_pydatetime() if isinstance(v, pd.Timestamp) else v
            for v in vals]


def to_excel_bytes(sheets: list, about: dict) -> bytes:
    """sheets: [(name, DataFrame, {column: excel_number_format})]. Adds an 'About' sheet.
    Written column by column with xlsxwriter (much faster than pandas' cell-by-cell writer): bold header,
    frozen first row and two columns, a filter on every column, widths from the data, dates dd-mmm-yyyy."""
    import xlsxwriter

    buf = io.BytesIO()
    book = xlsxwriter.Workbook(buf, {"in_memory": True, "default_date_format": "dd-mmm-yyyy", "nan_inf_to_errors": True})
    bold, fmts = book.add_format({"bold": True}), {}
    for name, df, formats in [*sheets, ("About", pd.DataFrame({"Item": list(about), "Detail": [str(v) for v in about.values()]}), {})]:
        ws = book.add_worksheet(name[:31])
        ws.write_row(0, 0, [str(c) for c in df.columns], bold)
        for i, c in enumerate(df.columns):
            ws.write_column(1, i, _excel_cells(df[c]))
            sample = df[c].head(500).astype(str).str.len()
            width = min(max(len(str(c)), int(sample.max()) if len(sample) else 0) + 2, 120 if name == "About" else 70)
            f = formats.get(c)
            if f and f not in fmts:
                fmts[f] = book.add_format({"num_format": f})
            ws.set_column(i, i, width, fmts.get(f))
        if name != "About":
            ws.freeze_panes(1, 2)
            ws.autofilter(0, 0, len(df), max(len(df.columns) - 1, 0))
    book.close()
    return buf.getvalue()


XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


def history_subpath(as_of: str) -> str:
    """History layout: history/YYYY-MM/YYYY-MM-DD, derived from the dataset's as-of date."""
    d = date.fromisoformat(as_of)
    return f"history/{d:%Y-%m}/{d:%Y-%m-%d}"


def write_dataset(
    name: str,
    as_of: str,
    payload: dict,
    table: pd.DataFrame,
    excel: bytes | None,
    *,
    keep_history: bool = True,
) -> None:
    """Write latest output, plus history/YYYY-MM/YYYY-MM-DD unless keep_history=False."""
    fs, root = open_fs(f"{DST_ROOT}/{name}")
    blobs = [(f"{name}.json", to_json_bytes(payload), "application/json")]
    if excel is not None:
        blobs.append((f"{name}.xlsx", excel, XLSX))
    arrow = pa.Table.from_pandas(table, preserve_index=False)
    targets = [("latest", "public, max-age=300")]
    if keep_history:
        targets.append((history_subpath(as_of), "public, max-age=86400"))
    for sub, cache in targets:
        folder = f"{root}/{sub}"
        if fs.type_name == "local":
            fs.create_dir(folder, recursive=True)
        pq.write_table(arrow, f"{folder}/{name}.parquet", filesystem=fs, compression="zstd")
        for fname, data, ctype in blobs:
            with fs.open_output_stream(f"{folder}/{fname}", metadata={"Content-Type": ctype, "Cache-Control": cache}) as f:
                f.write(data)
    log.info("wrote %s (%d funds) to %s/latest%s", name, payload["count"], root,
             " + history" if keep_history else " (latest only)")
