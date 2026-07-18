export const HTML_TYPOGRAPHY_SPEC = Object.freeze({
  kicker: [600, 16, 1.2, "muted_text"],
  title: [700, 30, 1.1, "text"],
  subtitle: [400, 18, 1.2, "muted_text"],
  body: [400, 20, 1.25, "text"],
  label: [600, 16, 1.2, "muted_text"],
  card_value: [700, 28, 1, "accent"],
  metric: [700, 36, 1, "accent"],
  quote: [600, 26, 1.2, "text"],
  caption: [400, 16, 1.25, "muted_text"],
  callout: [600, 18, 1.2, "text"],
});

export const HTML_SPACING_SPEC = Object.freeze({
  xs: 8, sm: 12, md: 20, lg: 32, xl: 48,
  page_x: 48, content_top: 150,
  content_bottom_no_callout: 74.5,
  page_bottom_with_callout: 46.5,
});

export const HTML_COMPONENTS_SPEC = Object.freeze({
  text_block: { field_gap: 12, bullet_gap: 8 },
  card: { radius: 16, padding: 20, field_gap: 12, border_width: 1, background: "palette.surface", border: "palette.divider" },
  metric: { padding: 20, field_gap: 10 },
  step: { padding: 12, field_gap: 10, connector_width: 2, connector: "palette.divider" },
  quote: { field_gap: 12 },
  chart: {
    axis: "palette.muted_text",
    grid: "palette.divider",
    series: ["palette.accent", "palette.accent_secondary", "palette.accent_tertiary", "palette.muted_text"],
    stroke_width: 3,
    plot_padding: { top: 20, right: 20, bottom: 44, left: 52 },
    legend_position: "top",
    legend_gap: 12,
    bar_orientation: "vertical",
    bar_mode: "grouped",
    line_curve: "linear",
    area_stacked: false,
  },
  icon: { size: 32, stroke_width: 2, color: "palette.accent" },
  icon_composition: { inset_ratio: 0.12, gap: 16, max_cell_ratio: 0.62 },
  callout: { padding_x: 24, padding_y: 8, radius: 12, background: "palette.surface", border: "palette.divider" },
  abstract_pattern: {
    "gradient-field": { colors: ["palette.background", "palette.accent", "palette.accent_secondary"], angle_degrees: 135, softness: 0.7 },
    "line-grid": { line: "palette.divider", accent: "palette.accent", spacing: 32, stroke_width: 1 },
    "soft-orbs": { colors: ["palette.accent", "palette.accent_secondary"], count: 3, blur: 48, opacity: 0.35 },
  },
});

export function htmlTypographySource() {
  return Object.fromEntries(Object.entries(HTML_TYPOGRAPHY_SPEC).map(
    ([role, [weight, size, line_height, color]]) => [role, {
      families: ["Source Sans 3", "Noto Sans SC"],
      weight,
      size,
      line_height,
      color: `palette.${color}`,
    }]
  ));
}

