"""Configuration loading and fail-fast validation for personality matching."""

from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Any

import yaml


DEFAULT_CONFIG = Path(__file__).with_name("scheme_config_master.yaml")
VALID_ROLES = {"core", "growth", "satellite", "buffer"}
SUITABILITY_COMPONENTS = {"consistency", "rank_momentum", "resilience", "aum", "age"}


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
    validate_config(cfg)
    return cfg


def _require_close_one(value: float, path: str) -> None:
    if abs(value - 1.0) > 1e-9:
        raise ConfigError(f"{path} must sum to 1; got {value}")


def _strictly_increasing(values: list[float], path: str) -> None:
    if any(right <= left for left, right in zip(values, values[1:])):
        raise ConfigError(f"{path} must be strictly increasing")


def validate_config(cfg: dict[str, Any]) -> None:
    required = {
        "meta", "universe", "categories", "peer_groups", "features", "pillar_features",
        "suitability_components", "personas", "gates", "user_adjustment", "bands", "reasons",
        "momentum_filter", "basket", "sources", "outputs",
    }
    missing = sorted(required - cfg.keys())
    if missing:
        raise ConfigError(f"missing configuration sections: {', '.join(missing)}")

    components = list(cfg["suitability_components"])
    if set(components) != SUITABILITY_COMPONENTS:
        raise ConfigError(f"suitability_components must be {sorted(SUITABILITY_COMPONENTS)}")
    for code, persona in cfg["personas"].items():
        weights = persona["suitability"]
        if not set(weights) <= SUITABILITY_COMPONENTS:
            raise ConfigError(f"personas.{code}.suitability uses unknown components")
        _require_close_one(sum(map(float, weights.values())), f"personas.{code}.suitability")
        if not 4 <= int(persona["willingness_grade"]) <= 7:
            raise ConfigError(f"personas.{code}.willingness_grade must be in [4, 7]")
    for group in ("positive", "negative"):
        if set(cfg["reasons"][group]) != SUITABILITY_COMPONENTS:
            raise ConfigError(f"reasons.{group} needs one reason per suitability component")

    for name, weights in cfg["pillar_features"].items():
        _require_close_one(sum(map(float, weights.values())), f"pillar_features.{name}")
    momentum = cfg["features"]["rank_momentum"]
    _require_close_one(float(momentum["level_weight"]) + float(momentum["change_weight"]), "features.rank_momentum")

    universe = cfg["universe"]
    prefixes = tuple(universe["include_prefixes"])
    allowed_codes = set(universe["include_codes"]) | set(universe["buffer_codes"])
    excluded = set(universe["exclude_codes"])
    for code, category in cfg["categories"].items():
        if code in excluded or not (code.startswith(prefixes) or code in allowed_codes):
            raise ConfigError(f"categories.{code} is outside the configured universe")
        if (category["role"] == "buffer") != (code in universe["buffer_codes"]):
            raise ConfigError(f"categories.{code}: only buffer_codes may use role 'buffer'")
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

    _validate_basket(cfg)


def _validate_basket(cfg: dict[str, Any]) -> None:
    basket = cfg["basket"]
    categories = cfg["categories"]
    scoreable = {code for code, item in categories.items() if item["role"] != "buffer"}
    if set(basket["risk_order"]) != set(basket["slots"]) or len(basket["risk_order"]) != len(basket["slots"]):
        raise ConfigError("basket.risk_order must list every slot exactly once")
    for code, category in categories.items():
        if category.get("min_age_months") is not None:
            int(category["min_age_months"])
    for name, slot in basket["slots"].items():
        codes = set(slot.get("codes", []))
        prefixes = slot.get("prefixes", [])
        if not codes and not prefixes:
            raise ConfigError(f"basket.slots.{name} needs codes or prefixes")
        if not codes <= scoreable:
            raise ConfigError(f"basket.slots.{name} uses codes missing from categories: {sorted(codes - scoreable)}")
        if prefixes and not any(c == p or c.startswith(f"{p}-") for c in scoreable for p in prefixes):
            raise ConfigError(f"basket.slots.{name} prefixes match no category")
        for key in ("name_include", "name_exclude"):
            if slot.get(key) is not None:
                try:
                    re.compile(slot[key])
                except re.error as error:
                    raise ConfigError(f"basket.slots.{name}.{key} is not a valid regex: {error}") from error

    bands = basket["amount_bands"]
    for left, right in zip(bands, bands[1:]):
        if int(left["max"]) + 1 != int(right["min"]):
            raise ConfigError("basket amount bands must be contiguous and non-overlapping")
    fund_counts = {int(band["funds"]) for band in bands}

    if set(basket["personas"]) != set(cfg["personas"]):
        raise ConfigError("basket.personas must define every persona")
    for code, persona in basket["personas"].items():
        templates = {int(size): slots for size, slots in persona["templates"].items()}
        smallest = min(templates)
        for size, slots in templates.items():
            if len(slots) != size or not set(slots) <= set(basket["slots"]):
                raise ConfigError(f"basket.personas.{code}.templates.{size} is invalid")
        if any(count not in templates and count > smallest for count in fund_counts):
            raise ConfigError(f"basket.personas.{code} lacks a template for a configured fund count")
        int(persona["min_age_months"])

    buffer = basket["buffer"]
    if not set(buffer["codes"]) <= set(cfg["universe"]["buffer_codes"]) or not set(buffer["weights"]) <= {"consistency", "aum"}:
        raise ConfigError("basket.buffer is invalid")
    _require_close_one(sum(map(float, buffer["weights"].values())), "basket.buffer.weights")
