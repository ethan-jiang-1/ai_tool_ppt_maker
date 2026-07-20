import { describe, expect, it } from "vitest";
import { parseHtmlSourceAstV1 } from "../../PPTMAKER_FRAMEWORK/scripts/contracts/html_source_ast.mjs";
import {
  buildHtmlReviewPlan,
  htmlContentReviewProjectionV1,
  htmlPageVisualDependenciesV1,
  projectHtmlSlideBodyV1,
} from "../../PPTMAKER_FRAMEWORK/scripts/contracts/html_review_projection.mjs";
import { buildHtmlReviewPlan as buildPhase3ReviewPlan } from "../../PPTMAKER_FRAMEWORK/scripts/03-html-production/internal/html_preview.mjs";

const slide = {
  slide_id: "HeroGo",
  position: 1,
  header: { kicker: null, title: "Hello", subtitle: null },
  visual_type: "Content",
  concept: { must_communicate: "One clear idea", must_not: "Visual noise" },
  family: "hero",
  body: {},
  callout: null,
  primary_visual: null,
  geometry: { variant: "hero--statement0", boxes: {}, overlays: [] },
  visual_contract_fingerprint: "a".repeat(64),
  visual_resolution: null,
};
const plan = {
  schema: "pptmaker-html-slide-plan-v1",
  source_sha256: "b".repeat(64),
  input_receipts: [],
  ordered_plan_digest: "c".repeat(64),
  style_reference_contract_fingerprint: "d".repeat(64),
  slides: [slide],
};
const source = (title, note) => Buffer.from(`---
production:
  pipeline: html-first-v1
---

## Slide 01: \`HeroGo\`

**VISUAL TYPE**: Content
**TITLE**: ${title}
**CONCEPT**:
- **MUST communicate**: One clear idea
- **MUST NOT**: Visual noise

**SLIDE BODY**:
\`\`\`yaml
schema_version: 1
family: hero
\`\`\`
> **SPEAKER NOTE**: ${note}
`);

describe("HTML source AST and review projections", () => {
  it("keeps notes-only edits out of content and isolates copy edits", () => {
    const bytes = Buffer.from(JSON.stringify(plan));
    const first = parseHtmlSourceAstV1({ sourceBytes: source("Hello", "First note"), planBytes: bytes }).plan;
    const notesOnly = parseHtmlSourceAstV1({ sourceBytes: source("Hello", "Second note"), planBytes: bytes }).plan;
    const copy = parseHtmlSourceAstV1({ sourceBytes: source("Changed copy", "Second note"), planBytes: bytes }).plan;
    expect(htmlContentReviewProjectionV1(notesOnly)).toEqual(htmlContentReviewProjectionV1(first));
    expect(htmlContentReviewProjectionV1(copy)).not.toEqual(htmlContentReviewProjectionV1(first));
  });

  it("separates visual-system, recipe, and page dependency changes", () => {
    const baseline = buildHtmlReviewPlan({ plan, kind: "visual", logicalRunVersion: "v1" });
    const system = buildHtmlReviewPlan({ plan: { ...plan, style_reference_contract_fingerprint: "e".repeat(64) }, kind: "visual", logicalRunVersion: "v1" });
    const recipePlan = { ...plan, slides: [{ ...slide, geometry: { ...slide.geometry, variant: "hero--statement1" } }] };
    const pagePlan = { ...plan, slides: [{ ...slide, visual_contract_fingerprint: "f".repeat(64) }] };
    expect(system.visual_system_fingerprint).not.toBe(baseline.visual_system_fingerprint);
    expect(htmlPageVisualDependenciesV1(recipePlan)[0].component_recipe_hash).not.toBe(baseline.page_visual_dependencies[0].component_recipe_hash);
    expect(htmlPageVisualDependenciesV1(pagePlan)[0].visual_contract_fingerprint).not.toBe(baseline.page_visual_dependencies[0].visual_contract_fingerprint);
  });

  it("keeps the Phase 3 publisher byte-contract on the pure implementation", () => {
    const options = { plan, kind: "content", logicalRunVersion: "v1" };
    expect(buildPhase3ReviewPlan(options)).toEqual(buildHtmlReviewPlan(options));
  });

  it("uses one canonical body projection for callout and primary-visual slides (BUG-018)", () => {
    const rawBody = {
      schema_version: 1,
      family: "data",
      chart: {
        kind: "bar",
        legend: "auto",
        series: [{ name: "Actual", values: [1, 2] }, { name: "Plan", values: [2, 3] }],
      },
      callout: "Keep this separate from body.",
      primary_visual: { placement: "right", brief: "Not part of the body." },
    };

    expect(projectHtmlSlideBodyV1(rawBody)).toEqual({
      chart: {
        kind: "bar",
        legend: "show",
        series: [{ name: "Actual", values: [1, 2] }, { name: "Plan", values: [2, 3] }],
      },
    });

    const rawPlan = buildHtmlReviewPlan({
      plan: { ...plan, slides: [{ ...slide, family: "data", body: rawBody, callout: rawBody.callout, primary_visual: rawBody.primary_visual }] },
      kind: "content",
      logicalRunVersion: "v1",
    });
    const normalizedPlan = buildHtmlReviewPlan({
      plan: {
        ...plan,
        slides: [{
          ...slide,
          family: "data",
          body: projectHtmlSlideBodyV1(rawBody),
          callout: rawBody.callout,
          primary_visual: rawBody.primary_visual,
        }],
      },
      kind: "content",
      logicalRunVersion: "v1",
    });
    expect(rawPlan.content_fingerprint).toBe(normalizedPlan.content_fingerprint);
  });
});
