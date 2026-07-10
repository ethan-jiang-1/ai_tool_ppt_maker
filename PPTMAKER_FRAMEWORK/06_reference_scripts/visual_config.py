#!/usr/bin/env python3
"""Shared executable visual configuration for Stage 1 and Stage 3.

`color_palette.json` is the human-editable source. This module is the only place
that defines fallback canvas, body-layout, header geometry, and header-font
defaults, so prompt layout and deterministic header rendering cannot drift.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any


class VisualConfigError(ValueError):
    """Raised when an existing visual configuration contains invalid values."""


@dataclass(frozen=True)
class CanvasConfig:
    width_px: int
    height_px: int


@dataclass(frozen=True)
class BodyLayoutConfig:
    content_top_gap_px: int
    content_bottom_px: int
    callout_top_px: int
    callout_bottom_px: int
    no_callout_bottom_px: int


@dataclass(frozen=True)
class HeaderPositionConfig:
    left_px: int
    right_margin_px: int
    kicker_y_px: int
    title_y_px: int
    subtitle_gap_px: int
    title_line_height_px: int
    subtitle_line_height_px: int


@dataclass(frozen=True)
class FontConfig:
    family: str
    weight: str
    size_px: int
    color: str


@dataclass(frozen=True)
class HeaderLockConfig:
    body_header_safe_zone: int
    opener_safe_zone: int
    position: HeaderPositionConfig
    kicker: FontConfig
    title: FontConfig
    subtitle: FontConfig


@dataclass(frozen=True)
class VisualConfig:
    background: str
    canvas: CanvasConfig
    body_layout: BodyLayoutConfig
    header_lock: HeaderLockConfig


DEFAULT_CONFIG = VisualConfig(
    background="#0a1628",
    canvas=CanvasConfig(width_px=1672, height_px=941),
    body_layout=BodyLayoutConfig(
        content_top_gap_px=30,
        content_bottom_px=780,
        callout_top_px=805,
        callout_bottom_px=900,
        no_callout_bottom_px=890,
    ),
    header_lock=HeaderLockConfig(
        body_header_safe_zone=260,
        opener_safe_zone=390,
        position=HeaderPositionConfig(
            left_px=46,
            right_margin_px=58,
            kicker_y_px=24,
            title_y_px=58,
            subtitle_gap_px=8,
            title_line_height_px=52,
            subtitle_line_height_px=31,
        ),
        kicker=FontConfig(
            family="Source Sans Pro", weight="Semibold", size_px=22, color="#becbda"),
        title=FontConfig(
            family="Source Sans Pro", weight="Bold", size_px=46, color="#f4f8fc"),
        subtitle=FontConfig(
            family="Source Sans Pro", weight="Regular", size_px=27, color="#a4b8cc"),
    ),
)


def _mapping(value: Any, context: str) -> dict[str, Any]:
    if value is None:
        return {}
    if not isinstance(value, dict):
        raise VisualConfigError(f"{context} must be an object")
    return value


def _positive_int(mapping: dict[str, Any], key: str, default: int, context: str,
                  *, allow_zero: bool = False) -> int:
    value = mapping.get(key, default)
    minimum = 0 if allow_zero else 1
    if not isinstance(value, int) or isinstance(value, bool) or value < minimum:
        rule = "a non-negative integer" if allow_zero else "a positive integer"
        raise VisualConfigError(f"{context}.{key} must be {rule}")
    return value


def _text(mapping: dict[str, Any], key: str, default: str, context: str) -> str:
    value = mapping.get(key, default)
    if not isinstance(value, str) or not value.strip():
        raise VisualConfigError(f"{context}.{key} must be a non-empty string")
    return value.strip()


def _color(mapping: dict[str, Any], key: str, default: str, context: str) -> str:
    value = _text(mapping, key, default, context)
    if not re.fullmatch(r"#[0-9a-fA-F]{6}", value):
        raise VisualConfigError(f"{context}.{key} must be a #RRGGBB color")
    return value.lower()


def _font(mapping: dict[str, Any], default: FontConfig, context: str) -> FontConfig:
    return FontConfig(
        family=_text(mapping, "family", default.family, context),
        weight=_text(mapping, "weight", default.weight, context),
        size_px=_positive_int(mapping, "size_px", default.size_px, context),
        color=_color(mapping, "color", default.color, context),
    )


def parse_visual_config(data: dict[str, Any]) -> VisualConfig:
    """Parse a palette mapping, applying shared defaults for omitted fields."""
    if not isinstance(data, dict):
        raise VisualConfigError("color_palette.json root must be an object")

    canvas_data = _mapping(data.get("canvas"), "canvas")
    body_data = _mapping(data.get("body_layout"), "body_layout")
    header_data = _mapping(data.get("header_lock"), "header_lock")
    position_data = _mapping(header_data.get("position"), "header_lock.position")
    fonts_data = _mapping(header_data.get("fonts"), "header_lock.fonts")

    canvas = CanvasConfig(
        width_px=_positive_int(
            canvas_data, "width_px", DEFAULT_CONFIG.canvas.width_px, "canvas"),
        height_px=_positive_int(
            canvas_data, "height_px", DEFAULT_CONFIG.canvas.height_px, "canvas"),
    )
    body = BodyLayoutConfig(
        content_top_gap_px=_positive_int(
            body_data, "content_top_gap_px",
            DEFAULT_CONFIG.body_layout.content_top_gap_px, "body_layout", allow_zero=True),
        content_bottom_px=_positive_int(
            body_data, "content_bottom_px",
            DEFAULT_CONFIG.body_layout.content_bottom_px, "body_layout"),
        callout_top_px=_positive_int(
            body_data, "callout_top_px",
            DEFAULT_CONFIG.body_layout.callout_top_px, "body_layout"),
        callout_bottom_px=_positive_int(
            body_data, "callout_bottom_px",
            DEFAULT_CONFIG.body_layout.callout_bottom_px, "body_layout"),
        no_callout_bottom_px=_positive_int(
            body_data, "no_callout_bottom_px",
            DEFAULT_CONFIG.body_layout.no_callout_bottom_px, "body_layout"),
    )
    position = HeaderPositionConfig(
        left_px=_positive_int(
            position_data, "left_px", DEFAULT_CONFIG.header_lock.position.left_px,
            "header_lock.position", allow_zero=True),
        right_margin_px=_positive_int(
            position_data, "right_margin_px",
            DEFAULT_CONFIG.header_lock.position.right_margin_px,
            "header_lock.position", allow_zero=True),
        kicker_y_px=_positive_int(
            position_data, "kicker_y_px", DEFAULT_CONFIG.header_lock.position.kicker_y_px,
            "header_lock.position", allow_zero=True),
        title_y_px=_positive_int(
            position_data, "title_y_px", DEFAULT_CONFIG.header_lock.position.title_y_px,
            "header_lock.position", allow_zero=True),
        subtitle_gap_px=_positive_int(
            position_data, "subtitle_gap_px",
            DEFAULT_CONFIG.header_lock.position.subtitle_gap_px,
            "header_lock.position", allow_zero=True),
        title_line_height_px=_positive_int(
            position_data, "title_line_height_px",
            DEFAULT_CONFIG.header_lock.position.title_line_height_px,
            "header_lock.position"),
        subtitle_line_height_px=_positive_int(
            position_data, "subtitle_line_height_px",
            DEFAULT_CONFIG.header_lock.position.subtitle_line_height_px,
            "header_lock.position"),
    )

    fonts = DEFAULT_CONFIG.header_lock
    header = HeaderLockConfig(
        body_header_safe_zone=_positive_int(
            header_data, "body_header_safe_zone", fonts.body_header_safe_zone, "header_lock"),
        opener_safe_zone=_positive_int(
            header_data, "opener_safe_zone", fonts.opener_safe_zone, "header_lock"),
        position=position,
        kicker=_font(
            _mapping(fonts_data.get("kicker"), "header_lock.fonts.kicker"),
            fonts.kicker, "header_lock.fonts.kicker"),
        title=_font(
            _mapping(fonts_data.get("title"), "header_lock.fonts.title"),
            fonts.title, "header_lock.fonts.title"),
        subtitle=_font(
            _mapping(fonts_data.get("subtitle"), "header_lock.fonts.subtitle"),
            fonts.subtitle, "header_lock.fonts.subtitle"),
    )

    if body.content_bottom_px >= canvas.height_px:
        raise VisualConfigError("body_layout.content_bottom_px must be inside the canvas")
    if body.no_callout_bottom_px >= canvas.height_px:
        raise VisualConfigError("body_layout.no_callout_bottom_px must be inside the canvas")
    if not body.content_bottom_px < body.callout_top_px < body.callout_bottom_px < canvas.height_px:
        raise VisualConfigError(
            "body_layout must satisfy content_bottom_px < callout_top_px < "
            "callout_bottom_px < canvas.height_px")
    if header.body_header_safe_zone >= body.no_callout_bottom_px:
        raise VisualConfigError(
            "header_lock.body_header_safe_zone must leave room for body content")
    if position.left_px + position.right_margin_px >= canvas.width_px:
        raise VisualConfigError("header_lock.position margins consume the canvas width")

    background_data = {"background": data.get("background", DEFAULT_CONFIG.background)}
    return VisualConfig(
        background=_color(
            background_data, "background", DEFAULT_CONFIG.background, "color_palette"),
        canvas=canvas,
        body_layout=body,
        header_lock=header,
    )


def load_visual_config(path: Path) -> VisualConfig:
    """Load an existing palette, or return shared defaults when it is absent."""
    if not path.is_file():
        return DEFAULT_CONFIG
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise VisualConfigError(f"could not read {path}: {exc}") from exc
    return parse_visual_config(data)


def hex_to_rgba(value: str) -> tuple[int, int, int, int]:
    """Convert a validated #RRGGBB color to an opaque Pillow RGBA tuple."""
    color = value.lstrip("#")
    return tuple(int(color[index:index + 2], 16) for index in (0, 2, 4)) + (255,)
