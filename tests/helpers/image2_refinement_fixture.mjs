import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { createHtmlFirstRun, htmlFirstSlide, htmlFirstSource } from "./html_first_fixture.mjs";

const visualBody = (brief) => `schema_version: 1
family: hero
primary_visual:
  placement: full-bleed
  brief: ${brief}
  fit: cover
  focal_point: [0.5, 0.5]
  fallback:
    kind: abstract-pattern
    recipe: line-grid
  selection: null
`;

export async function createCurrentHtmlDelivery(prefix = "image2-current-delivery-") {
  const fixture = createHtmlFirstRun(prefix);
  writeFileSync(join(fixture.runDir, "slide-specifications.md"), htmlFirstSource([
    htmlFirstSlide({ number: 1, id: "AlphaGo", title: "Alpha", note: "Alpha note", body: visualBody("Alpha visual") }),
    htmlFirstSlide({ number: 2, id: "BravoGo", title: "Bravo", note: "Bravo note", body: visualBody("Bravo visual") }),
  ]));

  const pipeline = await import("../../PPTMAKER_FRAMEWORK/scripts/03-html-production/unified_pipeline.mjs");
  const renderer = await import("../../PPTMAKER_FRAMEWORK/scripts/03-html-production/internal/html_slide_renderer.mjs");
  const production = await import("../../PPTMAKER_FRAMEWORK/scripts/03-html-production/index.mjs");
  const review = await import("../../PPTMAKER_FRAMEWORK/scripts/shared/state/html_review_evidence.mjs");
  const stateApi = await import("../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs");

  if (await pipeline.stage1(fixture.runDir, false) !== true) throw new Error("fixture Stage 1 failed");
  await renderer.publishHtmlComposition(renderer.createCanonicalHtmlValidatedRunContext({ runDir: fixture.runDir }), {});
  const pending = review.inspectHtmlReviewReadiness(fixture.runDir);
  review.publishHtmlGateDecision(fixture.runDir, { gate: "content", planHash: pending.gates.content.plan.plan_hash, status: "approved" });
  review.publishHtmlGateDecision(fixture.runDir, { gate: "visual", planHash: pending.gates.visual.plan.plan_hash, status: "approved" });
  await production.buildPresentation(fixture.runDir);
  await production.injectSpeakerNotes(fixture.runDir);

  const state = stateApi.readState(fixture.deck);
  state.playbook = "create-deck";
  state.current_node = "checkpoint-final-review";
  state.nodes["checkpoint-final-review"] = { status: "in_progress", execution_id: state.execution_id, evidence: {} };
  stateApi.writeState(fixture.deck, state);
  review.publishHtmlDeliveryDecision(fixture.runDir, { decision: "proceed" });
  return fixture;
}
