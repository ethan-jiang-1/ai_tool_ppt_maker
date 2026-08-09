import path from "node:path";

// This dependency leaf lets state evidence resolve current derived artifacts
// without initializing the run-bundle writer or its state dependencies.
export const VERSIONS_DIR = "3_versions";
export const SLIDE_SPECS_NAME = "slide-specifications.md";
export const GENERATED_SUBDIR = "_generated";
export const GEN_PAGE_IMAGE_WORKFLOW_SUBDIR = "page_image_workflow";
export const GEN_PAGE_IMAGE_RECEIPTS_SUBDIR = "receipts";
export const GEN_PAGE_IMAGE_RAW_SUBDIR = "raw";
export const GEN_PAGE_IMAGE_REVIEW_SUBDIR = "review";
export const GEN_PAGE_IMAGE_FINAL_SUBDIR = "final";
export const GEN_PAGE_IMAGE_NAV_SUBDIR = "nav";
export const GEN_PAGE_IMAGE_NAV_ARTIFACTS_SUBDIR = "art";

// This retired leaf is retained only so an explicit artifact-view rebuild can
// remove the old derived document after publishing the short navigation tree.
// It is never a current human navigation location.
const RETIRED_HUMAN_ARTIFACT_REFERENCE_RELATIVE_PATH = `${GENERATED_SUBDIR}/${GEN_PAGE_IMAGE_WORKFLOW_SUBDIR}/reference/human-artifact-reference-v1.md`;

// Style Master candidate history is append-mostly source evidence, not a
// version-generated artifact. The small per-scope head is its sole mutable
// current-plan pointer; selection remains in schema-v5 state.
export const STYLE_MASTER_ITERATIONS_RELATIVE_PATH = "1_upstream_raw_material/page-image-style-master-iterations";
export const STYLE_MASTER_STAGING_SUBDIR = "_staging";
export const STYLE_MASTER_PLANS_SUBDIR = "plans";
export const STYLE_MASTER_SCOPES_SUBDIR = "scopes";

// Progressive page production retains irreversible provider facts outside the
// rebuildable version `_generated` leaf. Its scoped head is the only mutable
// pointer; all plan container records remain append-mostly history.
export const PAGE_PRODUCTION_ITERATIONS_RELATIVE_PATH = "1_upstream_raw_material/page-image-workflow-iterations";
export const PAGE_PRODUCTION_STAGING_SUBDIR = "_staging";
export const PAGE_PRODUCTION_PLANS_SUBDIR = "plans";
export const PAGE_PRODUCTION_SCOPES_SUBDIR = "scopes";

export const PAGE_IMAGE_WORKFLOW_PATHS = Object.freeze({
  generated_root: GENERATED_SUBDIR,
  human_navigation_root: `${GENERATED_SUBDIR}/${GEN_PAGE_IMAGE_NAV_SUBDIR}`,
  human_navigation_index: `${GENERATED_SUBDIR}/${GEN_PAGE_IMAGE_NAV_SUBDIR}/index.md`,
  human_navigation_artifacts_root: `${GENERATED_SUBDIR}/${GEN_PAGE_IMAGE_NAV_SUBDIR}/${GEN_PAGE_IMAGE_NAV_ARTIFACTS_SUBDIR}`,
  retired_human_artifact_reference: RETIRED_HUMAN_ARTIFACT_REFERENCE_RELATIVE_PATH,
  root: `${GENERATED_SUBDIR}/${GEN_PAGE_IMAGE_WORKFLOW_SUBDIR}`,
  receipt: `${GENERATED_SUBDIR}/${GEN_PAGE_IMAGE_WORKFLOW_SUBDIR}/${GEN_PAGE_IMAGE_RECEIPTS_SUBDIR}/source-receipt.json`,
  target_source_receipt: `${GENERATED_SUBDIR}/${GEN_PAGE_IMAGE_WORKFLOW_SUBDIR}/${GEN_PAGE_IMAGE_RECEIPTS_SUBDIR}/source-receipt-v1.json`,
  transition_receipt: `${GENERATED_SUBDIR}/${GEN_PAGE_IMAGE_WORKFLOW_SUBDIR}/${GEN_PAGE_IMAGE_RECEIPTS_SUBDIR}/workflow-transition-v1.json`,
  raw_root: `${GENERATED_SUBDIR}/${GEN_PAGE_IMAGE_WORKFLOW_SUBDIR}/${GEN_PAGE_IMAGE_RAW_SUBDIR}`,
  raw_manifest: `${GENERATED_SUBDIR}/${GEN_PAGE_IMAGE_WORKFLOW_SUBDIR}/${GEN_PAGE_IMAGE_RAW_SUBDIR}/plan-manifest-v1.json`,
  target_raw_plan: `${GENERATED_SUBDIR}/${GEN_PAGE_IMAGE_WORKFLOW_SUBDIR}/${GEN_PAGE_IMAGE_RAW_SUBDIR}/work-plan-v1.json`,
  target_provider_request_inspection: `${GENERATED_SUBDIR}/${GEN_PAGE_IMAGE_WORKFLOW_SUBDIR}/${GEN_PAGE_IMAGE_RAW_SUBDIR}/provider-input-inspection-v1.json`,
  target_raw_evidence: `${GENERATED_SUBDIR}/${GEN_PAGE_IMAGE_WORKFLOW_SUBDIR}/${GEN_PAGE_IMAGE_RAW_SUBDIR}/accepted-evidence-v1.json`,
  review_root: `${GENERATED_SUBDIR}/${GEN_PAGE_IMAGE_WORKFLOW_SUBDIR}/${GEN_PAGE_IMAGE_REVIEW_SUBDIR}`,
  raw_review_projection: `${GENERATED_SUBDIR}/${GEN_PAGE_IMAGE_WORKFLOW_SUBDIR}/${GEN_PAGE_IMAGE_REVIEW_SUBDIR}/complete-page-review.png`,
  raw_review_coverage: `${GENERATED_SUBDIR}/${GEN_PAGE_IMAGE_WORKFLOW_SUBDIR}/${GEN_PAGE_IMAGE_REVIEW_SUBDIR}/complete-page-coverage-v1.json`,
  target_raw_review_projection: `${GENERATED_SUBDIR}/${GEN_PAGE_IMAGE_WORKFLOW_SUBDIR}/${GEN_PAGE_IMAGE_REVIEW_SUBDIR}/complete-page-review-v1.png`,
  target_raw_review: `${GENERATED_SUBDIR}/${GEN_PAGE_IMAGE_WORKFLOW_SUBDIR}/${GEN_PAGE_IMAGE_REVIEW_SUBDIR}/complete-page-review-v1.json`,
  final_root: `${GENERATED_SUBDIR}/${GEN_PAGE_IMAGE_WORKFLOW_SUBDIR}/${GEN_PAGE_IMAGE_FINAL_SUBDIR}`,
  final_manifest: `${GENERATED_SUBDIR}/${GEN_PAGE_IMAGE_WORKFLOW_SUBDIR}/${GEN_PAGE_IMAGE_FINAL_SUBDIR}/manifest-v1.json`,
  target_final_manifest: `${GENERATED_SUBDIR}/${GEN_PAGE_IMAGE_WORKFLOW_SUBDIR}/${GEN_PAGE_IMAGE_FINAL_SUBDIR}/final-slide-manifest-v1.json`,
  final_projection: `${GENERATED_SUBDIR}/${GEN_PAGE_IMAGE_WORKFLOW_SUBDIR}/${GEN_PAGE_IMAGE_FINAL_SUBDIR}/projection.png`,
  delivery_media_root: `${GENERATED_SUBDIR}/${GEN_PAGE_IMAGE_WORKFLOW_SUBDIR}/${GEN_PAGE_IMAGE_FINAL_SUBDIR}/delivery-media`,
  delivery_media_manifest: `${GENERATED_SUBDIR}/${GEN_PAGE_IMAGE_WORKFLOW_SUBDIR}/${GEN_PAGE_IMAGE_FINAL_SUBDIR}/delivery-media-manifest-v1.json`,
});

export function isPageImageVersionDir(runDir) {
  const root = path.resolve(runDir);
  const parentName = path.basename(path.dirname(root));
  const deckRoot = path.dirname(path.dirname(root));
  return parentName === VERSIONS_DIR && /^v\d+$/.test(path.basename(root)) && path.basename(deckRoot).startsWith("deck_");
}

/** Canonical rebuildable Page Image derived-artifact locations. */
export function pageImageWorkflowPaths(runDir) {
  const root = path.resolve(runDir);
  if (!isPageImageVersionDir(root)) throw new Error(`Page Image paths require a version directory (got ${root})`);
  return Object.freeze(Object.fromEntries(
    Object.entries(PAGE_IMAGE_WORKFLOW_PATHS).map(([key, relativePath]) => [key, path.join(root, ...relativePath.split("/"))]),
  ));
}

/** Canonical Style Master candidate-history paths for one current run. */
export function pageImageStyleMasterPaths(runDir) {
  const root = path.resolve(runDir);
  if (!isPageImageVersionDir(root)) throw new Error(`Style Master paths require a version directory (got ${root})`);
  const deckRoot = path.dirname(path.dirname(root));
  const historyRoot = path.join(deckRoot, ...STYLE_MASTER_ITERATIONS_RELATIVE_PATH.split("/"));
  return Object.freeze({
    deck_root: deckRoot,
    run_dir: root,
    run_version: path.basename(root),
    history_root: historyRoot,
    staging_root: path.join(historyRoot, STYLE_MASTER_STAGING_SUBDIR),
    plans_root: path.join(historyRoot, STYLE_MASTER_PLANS_SUBDIR),
    scopes_root: path.join(historyRoot, STYLE_MASTER_SCOPES_SUBDIR),
  });
}

/** Canonical append-mostly progressive raw-production owner paths for one current run. */
export function pageImageProgressiveRawPaths(runDir) {
  const root = path.resolve(runDir);
  if (!isPageImageVersionDir(root)) throw new Error(`Progressive Page Image paths require a version directory (got ${root})`);
  const deckRoot = path.dirname(path.dirname(root));
  const historyRoot = path.join(deckRoot, ...PAGE_PRODUCTION_ITERATIONS_RELATIVE_PATH.split("/"));
  return Object.freeze({
    deck_root: deckRoot,
    run_dir: root,
    run_version: path.basename(root),
    history_root: historyRoot,
    staging_root: path.join(historyRoot, PAGE_PRODUCTION_STAGING_SUBDIR),
    plans_root: path.join(historyRoot, PAGE_PRODUCTION_PLANS_SUBDIR),
    scopes_root: path.join(historyRoot, PAGE_PRODUCTION_SCOPES_SUBDIR),
  });
}
