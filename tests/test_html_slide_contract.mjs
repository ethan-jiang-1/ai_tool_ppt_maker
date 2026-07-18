import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { canonicalJson } from "../PPTMAKER_FRAMEWORK/scripts/lib/canonical_json.mjs";
import { stableJson } from "../PPTMAKER_FRAMEWORK/scripts/lib/image_provenance.mjs";
import { canonicalSlideEditJson, parseSlideDocument } from "../PPTMAKER_FRAMEWORK/scripts/lib/slide_document.mjs";
import {
  buildHtmlSourcePreflight,
  canonicalStructuredYaml,
  formatHtmlChartValue,
  graphemes,
  orderedPlanDigest,
  orderStructuredBody,
  parseHtmlFirstSource,
  probeProductionMarker,
  resolveHtmlChartLegend,
  serializeStructuredBodyEdit,
  validateAndBuildHtmlFirstPlan,
  validateHtmlFirstRun,
  validateStructuredBody,
  verifyInputReceipts,
} from "../PPTMAKER_FRAMEWORK/scripts/lib/html_slide_contract.mjs";
import {
  buildHtmlFamilyGeometryRegistry,
  htmlFamilyGeometrySemanticSha256,
  loadHtmlFamilyGeometryRegistry,
} from "../PPTMAKER_FRAMEWORK/scripts/lib/html_family_geometry.mjs";

function source(body = "schema_version: 1\nfamily: hero\n") {
  return `---
production:
  pipeline: html-first-v1
---

## Slide 01: \`HeroGo\`

**VISUAL TYPE**: Title / Opener
**TITLE**: Hello
**CONCEPT**:
- **MUST communicate**: One clear idea
- **MUST NOT**: Visual noise

**SLIDE BODY**:
\`\`\`yaml
${body}\`\`\`
`;
}

describe("canonical JSON authority", () => {
  it("keeps existing compatibility exports byte-identical", () => {
    const value = { z: [3, { b: true, a: "é" }], a: null };
    expect(stableJson(value)).toBe(canonicalJson(value));
    expect(canonicalSlideEditJson(value)).toBe(canonicalJson(value));
  });

  it("rejects non-JSON values", () => {
    expect(() => canonicalJson({ bad: undefined })).toThrow(/undefined/);
    expect(() => canonicalJson({ bad: Number.NaN })).toThrow(/finite/);
  });
});

describe("HTML-first marker and source grammar", () => {
  it("selects only the direct supported marker", () => {
    expect(probeProductionMarker(source()).branch).toBe("html-first-v1");
    expect(probeProductionMarker("## Slide 01: `Legacy`\n").branch).toBe("legacy");
    const aliased = `---
branch: &branch
  pipeline: html-first-v1
production: *branch
---
`;
    expect(probeProductionMarker(aliased).branch).toBe("invalid");
    expect(probeProductionMarker("---\n!!str production:\n  pipeline: html-first-v1\n---\n").branch).toBe("invalid");
    expect(probeProductionMarker("---\nmarker_key: &marker_key production\n*marker_key:\n  pipeline: html-first-v1\n---\n").branch).toBe("invalid");
  });

  it("retains unrelated legacy aliases when production is absent", () => {
    const text = `---
shared: &shared
  value: 1
copy: *shared
---
`;
    expect(probeProductionMarker(text).branch).toBe("legacy");
  });

  it("records exact owned fence ranges in the shared document", () => {
    const text = source();
    const document = parseSlideDocument(text);
    expect(document.slides[0].structured_body_fields).toHaveLength(1);
    const field = document.slides[0].structured_body_fields[0];
    expect(text.slice(field.yaml_range.start, field.yaml_range.end)).toBe("schema_version: 1\nfamily: hero\n");
  });

  it("rejects a near-miss fence without guessing", () => {
    const variants = [
      source().replace("```yaml", "```YAML"),
      source().replace("```yaml", "```json"),
      source().replace("**SLIDE BODY**:\n```yaml", "**SLIDE BODY**:\n\n```yaml"),
      source().replace("**SLIDE BODY**:", " **SLIDE BODY**:"),
      source().replace("```yaml", "```yaml "),
      source().replace("\n```\n", "\n``` \n"),
    ];
    for (const text of variants) expect(() => parseHtmlFirstSource(text)).toThrow(/validation failed/i);
  });

  it("rejects comments, aliases, unknown fields and legacy controls", () => {
    expect(() => parseHtmlFirstSource(source("schema_version: 1\nfamily: hero # no\n"))).toThrow();
    expect(() => parseHtmlFirstSource(source("# no\nschema_version: 1\nfamily: hero\n"))).toThrow();
    expect(() => parseHtmlFirstSource(source("---\nschema_version: 1\nfamily: hero\n"))).toThrow();
    expect(() => parseHtmlFirstSource(source("schema_version: 1\nfamily: !!str hero\n"))).toThrow();
    expect(() => parseHtmlFirstSource(source("schema_version: 1\nfamily: hero\ncallout: 2026-07-18\n"))).toThrow();
    expect(() => parseHtmlFirstSource(source("schema_version: 1\nfamily: hero\nfamily: hero\n"))).toThrow();
    expect(() => parseHtmlFirstSource(source("schema_version: 1\nfamily: hero\nunknown: 1\n"))).toThrow();
    expect(() => parseHtmlFirstSource(source().replace("**TITLE**: Hello", "**TITLE**: Hello\n**IMAGE PROMPT**: legacy"))).toThrow();
  });

  it("parses the minimal hero and resolves its geometry variant", () => {
    const parsed = parseHtmlFirstSource(source());
    expect(parsed.slides[0].variant).toBe("hero--statement0--support0--visual0--callout0");
    expect(parsed.slides[0].geometry.boxes.title).toEqual([48, 48, 904, 70]);
  });
});

describe("structured YAML round trip", () => {
  it("is byte-identical when no edit is requested", () => {
    const text = source();
    const parsed = parseHtmlFirstSource(text);
    expect(parsed.document.source_text).toBe(text);
  });

  it("rewrites only the owned YAML content", () => {
    const text = source();
    const edited = serializeStructuredBodyEdit(text, "HeroGo", {
      schema_version: 1,
      family: "hero",
      hero_statement: "A\nB",
      callout: "2026-07-18",
    });
    expect(edited).toContain("hero_statement: |-\n  A\n  B\ncallout: \"2026-07-18\"");
    expect(edited.replace(/hero_statement:[\s\S]*?```/, "```yaml\n```"))
      .toContain("**SLIDE BODY**:\n```yaml");
    expect(parseHtmlFirstSource(edited).slides[0].source_body.callout).toBe("2026-07-18");
  });

  it("retains CRLF convention while changing only the owned fence bytes", () => {
    const text = source().replace(/\n/g, "\r\n");
    const edited = serializeStructuredBodyEdit(text, "HeroGo", { schema_version: 1, family: "hero", hero_statement: "A\nB" });
    expect(edited).toContain("hero_statement: |-\r\n  A\r\n  B\r\n");
    expect(edited.replace(/\r\n/g, "")).not.toContain("\n");
  });

  it("rejects NUL and invalid UTF-8 source bytes", () => {
    expect(() => parseHtmlFirstSource(`${source()}\0`)).toThrow(/NUL/);
    const temp = mkdtempSync(join(tmpdir(), "html-invalid-utf8-"));
    try {
      const runDir = join(temp, "deck_contract", "3_versions", "v1");
      mkdirSync(runDir, { recursive: true });
      writeFileSync(join(runDir, "slide-specifications.md"), source());
      expect(() => validateHtmlFirstRun({ runDir, sourceBytes: Buffer.from([0xff]) })).toThrow(/UTF-8/);
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  });

  it("uses schema order", () => {
    expect(canonicalStructuredYaml({ family: "hero", callout: "x", schema_version: 1 }))
      .toBe("schema_version: 1\nfamily: hero\ncallout: x\n");
    const ordered = orderStructuredBody({ family: "cards", callout: "x", cards: [{ icon: "icon_a", body: "body", label: "label" }], schema_version: 1 });
    expect(Object.keys(ordered)).toEqual(["schema_version", "family", "cards", "callout"]);
    expect(Object.keys(ordered.cards[0])).toEqual(["label", "body", "icon"]);
  });
});

describe("family geometry registry", () => {
  it("contains exactly the formula-derived immutable 68 variants", () => {
    const checkedIn = loadHtmlFamilyGeometryRegistry();
    const raw = readFileSync(resolve("PPTMAKER_FRAMEWORK/scripts/contracts/html-family-geometry-v1.json"));
    expect(Object.keys(checkedIn.variants)).toHaveLength(68);
    expect(checkedIn).toEqual(buildHtmlFamilyGeometryRegistry());
    expect(raw.toString("utf8")).toBe(JSON.stringify(buildHtmlFamilyGeometryRegistry(), null, 2) + "\n");
    expect(createHash("sha256").update(raw).digest("hex"))
      .toBe("1bb55dc1149ec7d79fc48d5a75cc919c9f94b0b324d698e31deaf64bfe28f79f");
    expect(htmlFamilyGeometrySemanticSha256(checkedIn))
      .toBe("6f2b2c33acae05165cc0d5746ff4d1caa10d5108f4d02494e39a67a8724aa825");
  });
});

function primaryVisual(placement, fallback) {
  return {
    placement,
    brief: "A text-free local visual",
    fit: "cover",
    focal_point: [0.5, 0.5],
    fallback,
    selection: null,
  };
}

const repeat = (character, count) => character.repeat(count);

const FAMILY_FIXTURES = {
  hero: {
    min: { schema_version: 1, family: "hero" },
    max: {
      schema_version: 1, family: "hero", hero_statement: `${repeat("A", 60)}\n${repeat("B", 60)}`,
      supporting_line: repeat("C", 160), callout: repeat("D", 80),
      primary_visual: primaryVisual("full-bleed", { kind: "abstract-pattern", recipe: "soft-orbs" }),
    },
  },
  split: {
    min: { schema_version: 1, family: "split", mode: "text-text", left: { bullets: ["a", "b"] }, right: { bullets: ["c", "d"] } },
    max: {
      schema_version: 1, family: "split", mode: "text-visual",
      text: { heading: repeat("H", 40), bullets: Array.from({ length: 4 }, () => repeat("B", 40)) },
      primary_visual: primaryVisual("right", { kind: "icon-composition", asset_ids: ["icon_a", "icon_b", "icon_c"] }), callout: repeat("C", 80),
    },
  },
  cards: {
    min: { schema_version: 1, family: "cards", cards: [{ label: "a" }, { label: "b" }] },
    max: { schema_version: 1, family: "cards", cards: Array.from({ length: 4 }, (_, index) => ({ label: repeat(String(index), 20), value: repeat("V", 24), icon: `icon_${index}` })), callout: repeat("C", 80) },
  },
  kpi: {
    min: { schema_version: 1, family: "kpi", metrics: [{ value: "1", label: "a" }] },
    max: { schema_version: 1, family: "kpi", metrics: Array.from({ length: 3 }, () => ({ value: repeat("1", 12), label: repeat("L", 20), detail: repeat("D", 30) })), callout: repeat("C", 80) },
  },
  comparison: {
    min: { schema_version: 1, family: "comparison", left: { bullets: ["a", "b"] }, right: { bullets: ["c", "d"] } },
    max: { schema_version: 1, family: "comparison", left: { heading: repeat("H", 40), bullets: Array.from({ length: 5 }, () => repeat("L", 20)) }, right: { heading: repeat("H", 40), bullets: Array.from({ length: 5 }, () => repeat("R", 20)) }, callout: repeat("C", 80) },
  },
  flow: {
    min: { schema_version: 1, family: "flow", steps: Array.from({ length: 3 }, (_, index) => ({ label: `s${index}` })) },
    max: { schema_version: 1, family: "flow", steps: Array.from({ length: 5 }, (_, index) => ({ label: repeat(String(index), 20), body: repeat("B", 40), icon: `icon_${index}` })), callout: repeat("C", 80) },
  },
  timeline: {
    min: { schema_version: 1, family: "timeline", steps: Array.from({ length: 3 }, (_, index) => ({ label: `s${index}` })) },
    max: { schema_version: 1, family: "timeline", steps: Array.from({ length: 5 }, (_, index) => ({ label: repeat(String(index), 20), body: repeat("B", 40), icon: `icon_${index}` })), callout: repeat("C", 80) },
  },
  data: {
    min: { schema_version: 1, family: "data", chart: { kind: "bar", categories: ["A"], series: [{ name: "S", values: [1] }], value_format: { kind: "number", decimals: 0 }, legend: "auto" } },
    max: {
      schema_version: 1, family: "data",
      chart: {
        kind: "area", categories: Array.from({ length: 12 }, (_, index) => `C${index}`),
        series: Array.from({ length: 4 }, (_, index) => ({ name: repeat(String(index), 20), values: Array.from({ length: 12 }, (_, valueIndex) => valueIndex - 6) })),
        value_format: { kind: "currency", decimals: 2, currency: "USD" }, legend: "show",
      },
      insight: { bullets: Array.from({ length: 4 }, () => repeat("I", 14)) }, callout: repeat("C", 80),
    },
  },
  quote: {
    min: { schema_version: 1, family: "quote", quote: { quote: "A" } },
    max: {
      schema_version: 1, family: "quote", quote: { quote: repeat("Q", 50), attribution: repeat("A", 20), context: repeat("C", 20) },
      supporting: { bullets: [repeat("S", 16), repeat("T", 16)] },
      primary_visual: primaryVisual("left", { kind: "asset", asset_id: "visual_main" }), callout: repeat("C", 80),
    },
  },
  "visual-focus": {
    min: { schema_version: 1, family: "visual-focus", primary_visual: primaryVisual("body", { kind: "abstract-pattern", recipe: "line-grid" }) },
    max: { schema_version: 1, family: "visual-focus", caption: { bullets: Array.from({ length: 3 }, () => repeat("C", 30)) }, primary_visual: primaryVisual("body", { kind: "icon-composition", asset_ids: ["icon_a", "icon_b", "icon_c"] }), callout: repeat("C", 80) },
  },
};

function bodyForGeometryVariant(key) {
  const callout = key.endsWith("--callout1") ? "callout" : undefined;
  const withCallout = (body) => callout ? { ...body, callout } : body;
  if (key.startsWith("hero--")) {
    return withCallout({
      schema_version: 1,
      family: "hero",
      ...(key.includes("--statement1--") ? { hero_statement: "statement" } : {}),
      ...(key.includes("--support1--") ? { supporting_line: "support" } : {}),
      ...(key.includes("--visual1--") ? { primary_visual: primaryVisual("full-bleed", { kind: "abstract-pattern", recipe: "line-grid" }) } : {}),
    });
  }
  if (key.startsWith("split--text-text")) return withCallout({ schema_version: 1, family: "split", mode: "text-text", left: { bullets: ["a", "b"] }, right: { bullets: ["c", "d"] } });
  if (key.startsWith("split--text-visual-")) {
    const placement = key.includes("text-visual-left") ? "left" : "right";
    return withCallout({ schema_version: 1, family: "split", mode: "text-visual", text: { bullets: ["a", "b"] }, primary_visual: primaryVisual(placement, { kind: "icon-composition", asset_ids: ["icon_a"] }) });
  }
  for (const family of ["cards", "kpi", "flow", "timeline"]) {
    if (!key.startsWith(`${family}--`)) continue;
    const count = Number(/--n(\d+)--/.exec(key)[1]);
    if (family === "cards") return withCallout({ schema_version: 1, family, cards: Array.from({ length: count }, (_, index) => ({ label: `c${index}` })) });
    if (family === "kpi") return withCallout({ schema_version: 1, family, metrics: Array.from({ length: count }, (_, index) => ({ value: String(index), label: `m${index}` })) });
    return withCallout({ schema_version: 1, family, steps: Array.from({ length: count }, (_, index) => ({ label: `s${index}` })) });
  }
  if (key.startsWith("comparison--")) return withCallout({ schema_version: 1, family: "comparison", left: { bullets: ["a", "b"] }, right: { bullets: ["c", "d"] } });
  if (key.startsWith("data--")) return withCallout({
    schema_version: 1, family: "data",
    chart: { kind: "bar", categories: ["A"], series: [{ name: "S", values: [1] }], value_format: { kind: "number", decimals: 0 }, legend: "auto" },
    ...(key.includes("--insight1--") ? { insight: { heading: "insight" } } : {}),
  });
  if (key.startsWith("quote--")) {
    const visualToken = /--visual-(none|left|right)--/.exec(key)[1];
    return withCallout({
      schema_version: 1, family: "quote", quote: { quote: "quote" },
      ...(key.includes("--support1--") ? { supporting: { heading: "support" } } : {}),
      ...(visualToken === "none" ? {} : { primary_visual: primaryVisual(visualToken, { kind: "asset", asset_id: "visual_main" }) }),
    });
  }
  if (key.startsWith("visual-focus--")) return withCallout({
    schema_version: 1, family: "visual-focus",
    ...(key.includes("--caption1--") ? { caption: { heading: "caption" } } : {}),
    primary_visual: primaryVisual("body", { kind: "abstract-pattern", recipe: "soft-orbs" }),
  });
  throw new Error(`unsupported fixture variant ${key}`);
}

describe("closed family validation", () => {
  it("maps every schema-valid geometry dimension to exactly one of the 68 checked-in variants", () => {
    const keys = Object.keys(loadHtmlFamilyGeometryRegistry().variants);
    const resolved = keys.map((key) => {
      const validation = validateStructuredBody(bodyForGeometryVariant(key));
      expect(validation.issues, key).toEqual([]);
      return validation.variant;
    });
    expect(resolved).toEqual(keys);
    expect(new Set(resolved).size).toBe(68);
  });

  it.each(Object.entries(FAMILY_FIXTURES))("accepts %s minimum and maximum fixtures and rejects unknown fields", (_family, fixture) => {
    expect(validateStructuredBody(fixture.min).issues).toEqual([]);
    expect(validateStructuredBody(fixture.max).issues).toEqual([]);
    expect(validateStructuredBody({ ...fixture.min, rogue: true }).issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: "unknown_field" })]));
  });

  it("enforces family cross-field and fallback compatibility rules", () => {
    const invalid = [
      { schema_version: 1, family: "split", mode: "text-text", left: { body: "x", bullets: ["a", "b"] }, right: { bullets: ["a", "b"] } },
      { schema_version: 1, family: "comparison", left: { heading: "only" }, right: { bullets: ["a", "b"] } },
      { ...FAMILY_FIXTURES.data.min, chart: { ...FAMILY_FIXTURES.data.min.chart, value_format: { kind: "percent", decimals: 0 }, series: [{ name: "S", values: [10001] }] } },
      { schema_version: 1, family: "quote", quote: { quote: repeat("Q", 60), attribution: repeat("A", 20), context: repeat("C", 20) } },
      { schema_version: 1, family: "visual-focus", caption: { heading: "h", body: "b" }, primary_visual: primaryVisual("body", { kind: "asset", asset_id: "visual_main" }) },
      { schema_version: 1, family: "hero", primary_visual: primaryVisual("full-bleed", { kind: "icon-composition", asset_ids: ["icon_a", "icon_a"] }) },
    ];
    for (const body of invalid) expect(validateStructuredBody(body).issues.length).toBeGreaterThan(0);
  });

  it("uses the exact locale-independent chart formatter and legend resolution", () => {
    expect(formatHtmlChartValue(-0, { kind: "number", decimals: 2 })).toBe("0.00");
    expect(formatHtmlChartValue(0.125, { kind: "percent", decimals: 1 })).toBe("12.5%");
    expect(formatHtmlChartValue(-1500, { kind: "compact", decimals: 1 })).toBe("-1.5K");
    expect(formatHtmlChartValue(12, { kind: "currency", decimals: 2, currency: "USD" })).toBe("USD 12.00");
    expect(resolveHtmlChartLegend("auto", 1)).toBe("hide");
    expect(resolveHtmlChartLegend("auto", 2)).toBe("show");
    expect(resolveHtmlChartLegend("hide", 4)).toBe("hide");
  });
});

describe("source grapheme and Unicode preflight", () => {
  it("matches the checked-in cross-major grapheme corpus", () => {
    const corpus = JSON.parse(readFileSync(resolve("tests/fixtures/html-first-v1/grapheme-corpus.json"), "utf8"));
    for (const entry of corpus.cases) expect(graphemes(entry.value), entry.name).toBe(entry.graphemes);
  });

  it("keeps canonical scalar sequences distinct and counts grapheme clusters", () => {
    expect(graphemes("e\u0301")).toBe(1);
    expect(graphemes("é")).toBe(1);
    const parsed = parseHtmlFirstSource(source("schema_version: 1\nfamily: hero\nhero_statement: é，简体中文 ¥ 123\n"));
    const preflight = buildHtmlSourcePreflight(parsed.slides);
    expect(preflight.results[0].font_ranges.status).toBe("passed");
    expect(preflight.results[0].font_ranges.unique_code_points).toContain(0x0301);
    const chartAlphabet = parseHtmlFirstSource(source("schema_version: 1\nfamily: hero\nhero_statement: 0123456789-.% ABCDEFGHIJKLMNOPQRSTUVWXYZ KMBT\n"));
    expect(buildHtmlSourcePreflight(chartAlphabet.slides).results[0].font_ranges.status).toBe("passed");
  });

  it.each(["\r", "\t", "\u0001", "\u0085", "\u2028", "\u2029", "\ud800"])("rejects forbidden visible scalar %j", (character) => {
    const parsed = parseHtmlFirstSource(source());
    parsed.slides[0].header.title = `bad${character}`;
    expect(() => buildHtmlSourcePreflight(parsed.slides)).toThrow(/preflight|visible|surrogate/i);
  });

  it("does not publish passed evidence for an over-capacity Markdown header", () => {
    const parsed = parseHtmlFirstSource(source().replace("**TITLE**: Hello", `**KICKER**: ${"K".repeat(41)}\n**TITLE**: Hello`));
    try {
      buildHtmlSourcePreflight(parsed.slides);
      throw new Error("expected capacity failure");
    } catch (error) {
      expect(error.issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: "capacity_exceeded", subject: expect.objectContaining({ field: "header.kicker" }) })]));
    }
  });
});

describe("resolved HTML-first plan", () => {
  it("validates the checked-in authoring source and catalog fixture", () => {
    const temp = mkdtempSync(join(tmpdir(), "html-authoring-fixture-"));
    try {
      const deck = join(temp, "deck_fixture"); const runDir = join(deck, "3_versions", "v1");
      const styleDir = join(deck, "2_backbone", "visual-style"); const assetsDir = join(styleDir, "assets");
      mkdirSync(join(assetsDir, "icons"), { recursive: true }); mkdirSync(runDir, { recursive: true });
      copyFileSync(resolve("PPTMAKER_FRAMEWORK/workflow/01-visual/presets/dark-executive/color_palette.json"), join(styleDir, "color_palette.json"));
      copyFileSync(resolve("tests/fixtures/html-first-v1/source/slide-specifications.md"), join(runDir, "slide-specifications.md"));
      copyFileSync(resolve("tests/fixtures/html-first-v1/catalog/asset-manifest.yaml"), join(assetsDir, "asset-manifest.yaml"));
      copyFileSync(resolve("tests/fixtures/html-first-v1/catalog/icons/system-layers.svg"), join(assetsDir, "icons", "system-layers.svg"));
      const { validated, plan } = validateAndBuildHtmlFirstPlan({ runDir });
      expect(plan.slides[0].visual_resolution).toMatchObject({ state: "fallback", fallback: { kind: "icon-composition" } });
      const layout = plan.slides[0].visual_resolution.fallback.layout;
      expect(layout.inner_box).toEqual([573.6, 197.6, 326.8, 250.8]);
      expect(layout.items[0].asset_id).toBe("system-layers");
      [659.252, 245.252, 155.496, 155.496].forEach((value, index) => expect(layout.items[0].box[index]).toBeCloseTo(value, 12));
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  });

  it("builds the explicit renderer-neutral envelope without assets", () => {
    const temp = mkdtempSync(join(tmpdir(), "html-plan-"));
    try {
      const deck = join(temp, "deck_contract");
      const runDir = join(deck, "3_versions", "v1");
      const styleDir = join(deck, "2_backbone", "visual-style");
      mkdirSync(runDir, { recursive: true });
      mkdirSync(styleDir, { recursive: true });
      writeFileSync(join(runDir, "slide-specifications.md"), source());
      copyFileSync(
        resolve("PPTMAKER_FRAMEWORK/workflow/01-visual/presets/dark-executive/color_palette.json"),
        join(styleDir, "color_palette.json")
      );
      const { validated, plan } = validateAndBuildHtmlFirstPlan({ runDir });
      expect(Object.keys(plan)).toEqual([
        "schema", "contract_version", "source_sha256", "input_receipts", "production",
        "theme", "asset_catalog", "style_reference_contract_fingerprint", "slides", "ordered_plan_digest",
      ]);
      expect(plan.schema).toBe("pptmaker-html-slide-plan-v1");
      expect(Object.keys(plan.slides[0])).toEqual([
        "slide_id", "spoken_key", "position", "header", "visual_type", "concept", "family", "body",
        "callout", "primary_visual", "geometry", "preflight", "semantic_content_fingerprint",
        "visual_contract_fingerprint", "visual_resolution", "source",
      ]);
      expect(Object.keys(plan.slides[0].preflight)).toEqual(["source_capacity", "font_ranges"]);
      expect(Object.keys(plan.slides[0].preflight.font_ranges)).toEqual([
        "status", "profile", "inventory_sha256", "checked_scalar_count", "unique_code_points",
      ]);
      expect(plan.slides[0].preflight.font_ranges.status).toBe("passed");
      expect(plan.slides[0].visual_resolution).toBeNull();
      expect(JSON.stringify(plan)).not.toContain(temp);
      expect(JSON.stringify(plan)).not.toContain(process.cwd());
      expect(plan.input_receipts.length).toBeGreaterThan(100);
      expect(plan.input_receipts).toEqual([...plan.input_receipts].sort((left, right) =>
        left.scope < right.scope ? -1 : left.scope > right.scope ? 1 : left.path < right.path ? -1 : left.path > right.path ? 1 : 0
      ));
      expect(verifyInputReceipts(validated.receipts, { runDir, assetCatalog: validated.assetCatalog })).toBe(true);
      expect(() => verifyInputReceipts([...validated.receipts, validated.receipts.at(-1)], { runDir })).toThrow(/duplicate/i);
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  });

  it("keeps per-slide fingerprints stable across reorder and isolates body copy edits", () => {
    const temp = mkdtempSync(join(tmpdir(), "html-fingerprints-"));
    try {
      const deck = join(temp, "deck_contract");
      const runDir = join(deck, "3_versions", "v1");
      const styleDir = join(deck, "2_backbone", "visual-style");
      mkdirSync(runDir, { recursive: true }); mkdirSync(styleDir, { recursive: true });
      copyFileSync(resolve("PPTMAKER_FRAMEWORK/workflow/01-visual/presets/dark-executive/color_palette.json"), join(styleDir, "color_palette.json"));
      const block = (position, id, statement) => `## Slide ${String(position).padStart(2, "0")}: \`${id}\`
**VISUAL TYPE**: Content
**TITLE**: ${id}
**CONCEPT**:
- **MUST communicate**: Stable concept
- **MUST NOT**: Noise
**SLIDE BODY**:
\`\`\`yaml
schema_version: 1
family: hero
hero_statement: ${statement}
\`\`\`
`;
      const front = "---\nproduction:\n  pipeline: html-first-v1\n---\n";
      const path = join(runDir, "slide-specifications.md");
      writeFileSync(path, `${front}${block(1, "FirstGo", "Alpha")}${block(2, "SecondGo", "Beta")}`);
      const first = validateAndBuildHtmlFirstPlan({ runDir }).plan;
      writeFileSync(path, `${front}${block(1, "SecondGo", "Beta")}${block(2, "FirstGo", "Alpha changed")}`);
      const second = validateAndBuildHtmlFirstPlan({ runDir }).plan;
      const byId = (plan, id) => plan.slides.find((slide) => slide.slide_id === id);
      expect(byId(first, "SecondGo").semantic_content_fingerprint).toBe(byId(second, "SecondGo").semantic_content_fingerprint);
      expect(byId(first, "SecondGo").visual_contract_fingerprint).toBe(byId(second, "SecondGo").visual_contract_fingerprint);
      expect(byId(first, "FirstGo").semantic_content_fingerprint).not.toBe(byId(second, "FirstGo").semantic_content_fingerprint);
      expect(byId(first, "FirstGo").visual_contract_fingerprint).toBe(byId(second, "FirstGo").visual_contract_fingerprint);
      expect(first.ordered_plan_digest).not.toBe(second.ordered_plan_digest);
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  });

  it("resolves fallback, selected and stale evidence in the fixed order", () => {
    const temp = mkdtempSync(join(tmpdir(), "html-resolution-"));
    try {
      const deck = join(temp, "deck_contract"); const runDir = join(deck, "3_versions", "v1");
      const styleDir = join(deck, "2_backbone", "visual-style"); const assetsDir = join(styleDir, "assets");
      mkdirSync(runDir, { recursive: true }); mkdirSync(assetsDir, { recursive: true });
      copyFileSync(resolve("PPTMAKER_FRAMEWORK/workflow/01-visual/presets/dark-executive/color_palette.json"), join(styleDir, "color_palette.json"));
      const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0h10v10z"/></svg>');
      const digest = createHash("sha256").update(svg).digest("hex");
      mkdirSync(join(assetsDir, "svg"), { recursive: true });
      writeFileSync(join(assetsDir, "svg", "visual.svg"), svg);
      writeFileSync(join(assetsDir, "asset-manifest.yaml"), `version: 2
assets:
  visual_main:
    path: svg/visual.svg
    type: svg
    label: visual
    description: passive fixture
    usage_guidance: use locally
    sha256: ${digest}
`);
      const makeSource = (selection) => source(`schema_version: 1
family: hero
primary_visual:
  placement: full-bleed
  brief: A text-free field
  fit: cover
  focal_point: [0.5, 0.5]
  fallback:
    kind: asset
    asset_id: visual_main
  selection: ${selection}
`);
      const path = join(runDir, "slide-specifications.md");
      writeFileSync(path, makeSource("null"));
      const fallback = validateAndBuildHtmlFirstPlan({ runDir }).plan;
      expect(fallback.slides[0].visual_resolution.state).toBe("fallback");
      const fingerprint = fallback.slides[0].visual_contract_fingerprint;
      writeFileSync(path, makeSource(`\n    asset_id: visual_main\n    accepted_for: ${fingerprint}\n    output_sha256: ${digest}`));
      const selected = validateAndBuildHtmlFirstPlan({ runDir }).plan;
      expect(selected.slides[0].visual_resolution.state).toBe("selected");
      writeFileSync(path, makeSource(`\n    asset_id: visual_main\n    accepted_for: ${"a".repeat(64)}\n    output_sha256: ${digest}`));
      const stale = validateAndBuildHtmlFirstPlan({ runDir }).plan;
      expect(stale.slides[0].visual_resolution).toMatchObject({ state: "stale", effective: "fallback", selected: { applicability: "stale" } });

      writeFileSync(path, source(`schema_version: 1
family: hero
primary_visual:
  placement: full-bleed
  brief: A text-free field
  fit: cover
  focal_point: [0.5, 0.5]
  fallback:
    kind: asset
    asset_id: missing_z
  selection:
    asset_id: missing_a
    accepted_for: ${"a".repeat(64)}
    output_sha256: ${"b".repeat(64)}
`));
      expect(() => validateAndBuildHtmlFirstPlan({ runDir })).toThrow(/missing_z/);
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  });

  it("classifies global style, renderer-only, fallback, visual-semantic, and source-locator changes", () => {
    const temp = mkdtempSync(join(tmpdir(), "html-classification-"));
    try {
      const deck = join(temp, "deck_contract"); const runDir = join(deck, "3_versions", "v1");
      const styleDir = join(deck, "2_backbone", "visual-style"); const palettePath = join(styleDir, "color_palette.json");
      mkdirSync(runDir, { recursive: true }); mkdirSync(styleDir, { recursive: true });
      copyFileSync(resolve("PPTMAKER_FRAMEWORK/workflow/01-visual/presets/dark-executive/color_palette.json"), palettePath);
      const specPath = join(runDir, "slide-specifications.md");
      const withVisual = (brief = "A text-free field", recipe = "line-grid") => source(`schema_version: 1
family: hero
primary_visual:
  placement: full-bleed
  brief: ${brief}
  fit: cover
  focal_point: [0.5, 0.5]
  fallback:
    kind: abstract-pattern
    recipe: ${recipe}
  selection: null
`);
      writeFileSync(specPath, withVisual());
      const baseline = validateAndBuildHtmlFirstPlan({ runDir }).plan;
      const baselineSlide = baseline.slides[0];

      writeFileSync(specPath, withVisual().replace("\n## Slide", "\nHuman-only planning prose.\n\n## Slide"));
      const locatorOnly = validateAndBuildHtmlFirstPlan({ runDir }).plan;
      expect(locatorOnly.source_sha256).not.toBe(baseline.source_sha256);
      expect(locatorOnly.ordered_plan_digest).toBe(baseline.ordered_plan_digest);

      writeFileSync(specPath, withVisual("A different text-free field"));
      const visualSemantic = validateAndBuildHtmlFirstPlan({ runDir }).plan;
      expect(visualSemantic.slides[0].semantic_content_fingerprint).toBe(baselineSlide.semantic_content_fingerprint);
      expect(visualSemantic.slides[0].visual_contract_fingerprint).not.toBe(baselineSlide.visual_contract_fingerprint);

      writeFileSync(specPath, withVisual("A text-free field", "soft-orbs"));
      const fallbackOnly = validateAndBuildHtmlFirstPlan({ runDir }).plan;
      expect(fallbackOnly.slides[0].visual_contract_fingerprint).toBe(baselineSlide.visual_contract_fingerprint);
      expect(fallbackOnly.ordered_plan_digest).not.toBe(baseline.ordered_plan_digest);

      writeFileSync(specPath, withVisual());
      const palette = JSON.parse(readFileSync(palettePath, "utf8"));
      palette.html_first.image_language.medium += " refined";
      writeFileSync(palettePath, JSON.stringify(palette, null, 2) + "\n");
      const styleChanged = validateAndBuildHtmlFirstPlan({ runDir }).plan;
      expect(styleChanged.style_reference_contract_fingerprint).not.toBe(baseline.style_reference_contract_fingerprint);
      expect(styleChanged.slides[0].visual_contract_fingerprint).toBe(baselineSlide.visual_contract_fingerprint);

      const rendererTheme = structuredClone(baseline.theme);
      rendererTheme.typography.body.size = 19;
      const rendererOnlyDigest = orderedPlanDigest({
        identity: baseline.identity ?? null,
        theme: rendererTheme,
        styleReferenceFingerprint: baseline.style_reference_contract_fingerprint,
        referencedCatalog: {},
        slides: baseline.slides,
      });
      expect(rendererOnlyDigest).not.toBe(baseline.ordered_plan_digest);
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  });
});
