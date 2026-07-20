import {
  inspectHtmlReviewReadiness as inspectCore,
  publishHtmlDeliveryDecision as publishDeliveryCore,
  publishHtmlGateDecision as publishGateCore,
  recoverHtmlGatePublication as recoverCore,
  resetHtmlProduction as resetCore,
} from "./internal/html_review_evidence_core.mjs";
import { join, resolve } from "node:path";
import {
  GENERATED_SUBDIR,
  GEN_HTML_FINAL_SLIDES_SUBDIR,
  GEN_HTML_PAGES_SUBDIR,
  GEN_HTML_PREVIEW_SUBDIR,
  GEN_HTML_PRODUCTION_SUBDIR,
  GEN_SLIDE_PLAN,
  METADATA_FILE,
  deckRoot,
} from "../run-bundle/bundle_layout.mjs";

export {
  GATE_JOURNAL_AUTO_RECOVERY_MIN_AGE_MS,
  GATE_JOURNAL_EXPLICIT_RECOVERY_MIN_AGE_MS,
  RESET_AUTO_RECOVERY_MIN_AGE_MS,
  RESET_EXPLICIT_RECOVERY_MIN_AGE_MS,
  normalizeHumanReason,
} from "./internal/html_review_evidence_core.mjs";

function trustedContext(runDir) {
  const run = resolve(runDir);
  const root = deckRoot(run);
  const production = join(run, GENERATED_SUBDIR, GEN_HTML_PRODUCTION_SUBDIR);
  const names = { "html-pages": GEN_HTML_PAGES_SUBDIR, "final-slides": GEN_HTML_FINAL_SLIDES_SUBDIR, preview: GEN_HTML_PREVIEW_SUBDIR };
  return Object.freeze({
    schema: "pptmaker-html-review-trusted-context-v1",
    run,
    root,
    metadataFile: join(root, METADATA_FILE),
    planPath: join(run, GENERATED_SUBDIR, GEN_SLIDE_PLAN),
    htmlProductionRoot: production,
    htmlOwnerRoot(ownerKind) {
      if (!names[ownerKind]) throw new Error(`unsupported HTML owner kind ${ownerKind}`);
      return join(production, names[ownerKind]);
    },
  });
}

export function inspectHtmlReviewReadiness(runDir) {
  return inspectCore(trustedContext(runDir));
}

export function recoverHtmlGatePublication(runDir, options = {}) {
  return recoverCore(trustedContext(runDir), options);
}

export function publishHtmlGateDecision(runDir, options) {
  return publishGateCore(trustedContext(runDir), options);
}

export function publishHtmlDeliveryDecision(runDir, options) {
  return publishDeliveryCore(trustedContext(runDir), options);
}

export function resetHtmlProduction(runDir, options) {
  return resetCore(trustedContext(runDir), options);
}
