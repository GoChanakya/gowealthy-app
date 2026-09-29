"""Configuration loading and fail-fast validation for personality matching."""

from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Any

import yaml


DEFAULT_CONFIG = Path(__file__).with_name("scheme_config_master.yaml")
VALID_ROLES = {"core", "growth", "satellite"}


class ConfigError(ValueError):
    """Raised when the engine configuration is internally inconsistent."""


def _read_text(uri: str | os.PathLike[str]) -> str:
    value = str(uri)
    if value.startswith("gs://"):
        from google.cloud import storage

        bucket_name, blob_name = value[5:].split("/", 1)
        return storage.Client().bucket(bucket_name).blob(blob_name).download_as_text()
    return Path(value).read_text(encoding="utf-8")


def load_config(uri: str | os.PathLike[str] | None = None) -> dict[str, Any]:
    """Load, validate, and return the configured matching rules."""
    source = uri or os.getenv("PM_CONFIG_URI") or DEFAULT_CONFIG
    cfg = yaml.safe_load(_read_text(source))
    if not isinstance(cfg, dict):
        raise ConfigError("configuration root must be a mapping")
    _materialize_formula_constants(cfg)
    validate_config(cfg)
    return cfg


def _capture(text: str, pattern: str, path: str, group: int = 1) -> float:
    match = re.search(pattern, text)
    if not match:
        raise ConfigError(f"could not read machine constant from {path}")
    return float(match.group(group))


def _materialize_formula_constants(cfg: dict[str, Any]) -> None:
    """Make constants embedded in the original master YAML formulas machine-readable.

    The shipped source file documents a few values inside formula strings rather than
    separate keys. Newer configs can provide explicit keys; this compatibility layer
    extracts them without changing their configured values.
    """
    features = cfg["features"]
    recovery = features["recovery_ratio"]
    if "intercept" not in recovery:
        recovery["intercept"] = _capture(
            recovery["formula"], r"clip\(\s*([0-9.]+)\s*-\s*ratio", "features.recovery_ratio.formula"
        )
    batting = features["batting_average"]
    batting_formula = batting.get("formula", "")
    if "prior_mean" not in batting:
        batting["prior_mean"] = _capture(batting_formula, r"prior_k\s*\*\s*([0-9.]+)", "features.batting_average.formula")
    if "score_floor" not in batting:
        batting["score_floor"] = _capture(batting_formula, r"\(p\s*-\s*([0-9.]+)\)\s*/", "features.batting_average.formula")
    if "score_range" not in batting:
        batting["score_range"] = _capture(batting_formula, r"\(p\s*-\s*[0-9.]+\)\s*/\s*([0-9.]+)", "features.batting_average.formula")

    stability = features["rank_stability"]
    if "max_mean_move" not in stability:
        stability["max_mean_move"] = _capture(stability["formula"], r"/\s*([0-9.]+)", "features.rank_stability.formula")
    trend = features["rank_trend"]
    if "neutral" not in trend or "slope_scale" not in trend:
        match = re.search(r"clip\(\s*([0-9.]+)\s*\+\s*slope\s*/\s*([0-9.]+)", trend["formula"])
        if not match:
            raise ConfigError("could not read machine constants from features.rank_trend.formula")
        trend.setdefault("neutral", float(match.group(1)))
        trend.setdefault("slope_scale", float(match.group(2)))
    track = features["track_record"]
    if "full_years" not in track:
        track["full_years"] = _capture(track["formula"], r"years_since_inception\s*/\s*([0-9.]+)", "features.track_record.formula")
    turnaround = features["turnaround"]
    if "climb_scale" not in turnaround:
        turnaround["climb_scale"] = _capture(turnaround["formula"], r"\(now\s*-\s*trough\)\s*/\s*([0-9.]+)", "features.turnaround.formula")

    missing = cfg["missing_data"]
    if "history_full_confidence_months" not in missing:
        missing["history_full_confidence_months"] = int(_capture(
            missing["history_confidence"], r"history_months\s*/\s*([0-9.]+)", "missing_data.history_confidence"
        ))
    persona_gates = cfg["gates"]["persona_level"]
    if "history_under_months" not in persona_gates:
        key = next((name for name in persona_gates if re.fullmatch(r"history_under_\d+m_cap", name)), None)
        if key is None:
            raise ConfigError("persona history gate threshold is missing")
        persona_gates["history_under_months"] = int(re.search(r"(\d+)", key).group(1))

    calibration = cfg["calibration"]
    if "max_great_share" not in calibration:
        calibration["max_great_share"] = _capture(
            calibration["guard"], r"Great share\s*>\s*([0-9.]+)%", "calibration.guard"
        ) / 100.0
    composition = cfg["composition"]
    if "style_grade_span" not in composition:
        composition["style_grade_span"] = _capture(
            composition["style_fit"], r"/\s*([0-9.]+)", "composition.style_fit"
        )
    if "score_scale" not in composition:
        composition["score_scale"] = _capture(
            composition["base"], r"^\s*([0-9.]+)\s*\*", "composition.base"
        )

    basket_rules = cfg["basket_rules"]
    rising = basket_rules["rising_star"]
    definition = rising.get("definition", "")
    extraction = {
        "max_aum_pct": r"aum_pct\s*<=\s*([0-9.]+)",
        "min_track_record_years": r"track_record_years\s*>=\s*([0-9.]+)",
        "min_rank_level": r"rank_level\s*>=\s*([0-9.]+)",
        "min_rank_trend": r"rank_trend(?:_score)?\s*>=\s*([0-9.]+)",
    }
    for key, pattern in extraction.items():
        if key not in rising:
            rising[key] = _capture(definition, pattern, "basket_rules.rising_star.definition")
    if "amount_rounding" not in basket_rules:
        basket_rules["amount_rounding"] = int(_capture(
            basket_rules["amount_split"], r"rounded to\s*[^0-9]*([0-9]+)", "basket_rules.amount_split"
        ))


def _require_close_one(value: float, path: str) -> None:
    if abs(value - 1.0) > 1e-9:
        raise ConfigError(f"{path} must sum to 1; got {value}")


def _strictly_increasing(values: list[float], path: str) -> None:
    if any(right <= left for left, right in zip(values, values[1:])):
        raise ConfigError(f"{path} must be strictly increasing")


def validate_config(cfg: dict[str, Any]) -> None:
    required = {
        "meta", "universe", "categories", "peer_groups", "features",
        "pillar_features", "growth_mixes", "personas", "persona_rules",
        "fund_persona_affinity", "composition", "calibration", "gates",
        "user_adjustment", "bands", "amount_bands", "basket_rules", "reasons",
    }
    missing = sorted(required - cfg.keys())
    if missing:
        raise ConfigError(f"missing configuration sections: {', '.join(missing)}")

    floor = float(cfg["persona_rules"]["resilience_floor"])
    mixes = cfg["growth_mixes"]
    for code, persona in cfg["personas"].items():
        weights = persona["weights"]
        _require_close_one(sum(map(float, weights.values())), f"personas.{code}.weights")
        if float(weights.get("resilience", 0)) < floor:
            raise ConfigError(f"personas.{code}.weights.resilience is below {floor}")
        basket = persona["basket"]
        _require_close_one(
            sum(float(basket[role]) for role in VALID_ROLES),
            f"personas.{code}.basket",
        )
        if persona["growth_mix"] not in mixes:
            raise ConfigError(f"personas.{code}.growth_mix does not exist")
        if not 4 <= float(persona["ideal_grade"]) <= 7:
            raise ConfigError(f"personas.{code}.ideal_grade must be in [4, 7]")
        if not 4 <= int(persona["willingness_grade"]) <= 7:
            raise ConfigError(f"personas.{code}.willingness_grade must be in [4, 7]")

    for name, weights in mixes.items():
        _require_close_one(sum(map(float, weights.values())), f"growth_mixes.{name}")
    for name, weights in cfg["pillar_features"].items():
        if weights != "persona_specific":
            _require_close_one(sum(map(float, weights.values())), f"pillar_features.{name}")

    composition = cfg["composition"]
    _require_close_one(
        sum(float(composition[key]) for key in ("fit_weight", "affinity_weight", "style_weight")),
        "composition",
    )

    calibration = cfg["calibration"]
    display = list(map(float, calibration["anchors_display"]))
    _strictly_increasing(display, "calibration.anchors_display")
    defaults = list(map(float, calibration["default_anchors_base"]))
    if len(defaults) != len(display):
        raise ConfigError("default base and display anchors must have the same length")
    _strictly_increasing(defaults, "calibration.default_anchors_base")
    for code, anchors in calibration.get("per_persona_anchors_base", {}).items():
        if code not in cfg["personas"] or len(anchors) != len(display):
            raise ConfigError(f"invalid calibration anchors for {code}")
        _strictly_increasing(list(map(float, anchors)), f"calibration.per_persona_anchors_base.{code}")

    for code, category in cfg["categories"].items():
        if not 4 <= int(category["grade"]) <= 7:
            raise ConfigError(f"categories.{code}.grade must be in [4, 7]")
        if category["role"] not in VALID_ROLES:
            raise ConfigError(f"categories.{code}.role is invalid")
        if not category.get("parent"):
            raise ConfigError(f"categories.{code}.parent is required")

    bands = cfg["bands"]
    if not bands or int(bands[-1]["min"]) != 0:
        raise ConfigError("bands must cover zero")
    if any(int(a["min"]) <= int(b["min"]) for a, b in zip(bands, bands[1:])):
        raise ConfigError("bands must be in descending minimum-score order")

    amount_bands = cfg["amount_bands"]["bands"]
    for left, right in zip(amount_bands, amount_bands[1:]):
        if int(left["max"]) + 1 != int(right["min"]):
            raise ConfigError("amount bands must be contiguous and non-overlapping")
    for band in amount_bands:
        if not set(band["roles"]).issubset(VALID_ROLES):
            raise ConfigError(f"amount band {band['code']} contains an invalid role")
