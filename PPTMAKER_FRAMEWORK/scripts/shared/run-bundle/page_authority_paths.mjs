import path from "node:path";

// This dependency leaf lets state evidence resolve current derived artifacts
// without initializing the run-bundle writer or its state dependencies.
export const VERSIONS_DIR = "3_versions";
export const SLIDE_SPECS_NAME = "slide-specifications.md";
export const GENERATED_SUBDIR = "_generated";
export const GEN_PAGE_AUTHORITY_IMAGE2_SUBDIR = "page_authority_image2";
export const GEN_PAGE_AUTHORITY_RECEIPTS_SUBDIR = "receipts";
export const GEN_PAGE_AUTHORITY_RAW_SUBDIR = "raw";
export const GEN_PAGE_AUTHORITY_REVIEW_SUBDIR = "review";
export const GEN_PAGE_AUTHORITY_FINAL_SUBDIR = "final";

// Style Master candidate history is append-mostly source evidence, not a
// version-generated artifact. The small per-scope head is its sole mutable
// current-plan pointer; selection remains in schema-v5 state.
export const STYLE_MASTER_ITERATIONS_RELATIVE_PATH = "1_upstream_raw_material/style-master-iterations";
export const STYLE_MASTER_STAGING_SUBDIR = "_staging";
export const STYLE_MASTER_PLANS_SUBDIR = "plans";
export const STYLE_MASTER_SCOPES_SUBDIR = "scopes";

// Progressive page production retains irreversible provider facts outside the
// rebuildable version `_generated` leaf. Its scoped head is the only mutable
// pointer; all plan container records remain append-mostly history.
export const PAGE_PRODUCTION_ITERATIONS_RELATIVE_PATH = "1_upstream_raw_material/page-production-iterations";
export const PAGE_PRODUCTION_STAGING_SUBDIR = "_staging";
export const PAGE_PRODUCTION_PLANS_SUBDIR = "plans";
export const PAGE_PRODUCTION_SCOPES_SUBDIR = "scopes";

export const PAGE_AUTHORITY_IMAGE2_PATHS = Object.freeze({
  root: `${GENERATED_SUBDIR}/${GEN_PAGE_AUTHORITY_IMAGE2_SUBDIR}`,
  receipt: `${GENERATED_SUBDIR}/${GEN_PAGE_AUTHORITY_IMAGE2_SUBDIR}/${GEN_PAGE_AUTHORITY_RECEIPTS_SUBDIR}/source-receipt.json`,
  target_source_receipt: `${GENERATED_SUBDIR}/${GEN_PAGE_AUTHORITY_IMAGE2_SUBDIR}/${GEN_PAGE_AUTHORITY_RECEIPTS_SUBDIR}/source-receipt-v2.json`,
  transition_receipt: `${GENERATED_SUBDIR}/${GEN_PAGE_AUTHORITY_IMAGE2_SUBDIR}/${GEN_PAGE_AUTHORITY_RECEIPTS_SUBDIR}/production-mode-transition.json`,
  raw_root: `${GENERATED_SUBDIR}/${GEN_PAGE_AUTHORITY_IMAGE2_SUBDIR}/${GEN_PAGE_AUTHORITY_RAW_SUBDIR}`,
  raw_manifest: `${GENERATED_SUBDIR}/${GEN_PAGE_AUTHORITY_IMAGE2_SUBDIR}/${GEN_PAGE_AUTHORITY_RAW_SUBDIR}/manifest.json`,
  target_raw_plan: `${GENERATED_SUBDIR}/${GEN_PAGE_AUTHORITY_IMAGE2_SUBDIR}/${GEN_PAGE_AUTHORITY_RAW_SUBDIR}/work-plan-v2.json`,
  target_provider_request_inspection: `${GENERATED_SUBDIR}/${GEN_PAGE_AUTHORITY_IMAGE2_SUBDIR}/${GEN_PAGE_AUTHORITY_RAW_SUBDIR}/provider-request-inspection-v1.json`,
  target_raw_evidence: `${GENERATED_SUBDIR}/${GEN_PAGE_AUTHORITY_IMAGE2_SUBDIR}/${GEN_PAGE_AUTHORITY_RAW_SUBDIR}/accepted-evidence-v2.json`,
  review_root: `${GENERATED_SUBDIR}/${GEN_PAGE_AUTHORITY_IMAGE2_SUBDIR}/${GEN_PAGE_AUTHORITY_REVIEW_SUBDIR}`,
  raw_review_projection: `${GENERATED_SUBDIR}/${GEN_PAGE_AUTHORITY_IMAGE2_SUBDIR}/${GEN_PAGE_AUTHORITY_REVIEW_SUBDIR}/raw-review.png`,
  raw_review_coverage: `${GENERATED_SUBDIR}/${GEN_PAGE_AUTHORITY_IMAGE2_SUBDIR}/${GEN_PAGE_AUTHORITY_REVIEW_SUBDIR}/coverage.json`,
  target_raw_review_projection: `${GENERATED_SUBDIR}/${GEN_PAGE_AUTHORITY_IMAGE2_SUBDIR}/${GEN_PAGE_AUTHORITY_REVIEW_SUBDIR}/raw-review-v2.png`,
  target_raw_review: `${GENERATED_SUBDIR}/${GEN_PAGE_AUTHORITY_IMAGE2_SUBDIR}/${GEN_PAGE_AUTHORITY_REVIEW_SUBDIR}/raw-review-v2.json`,
  final_root: `${GENERATED_SUBDIR}/${GEN_PAGE_AUTHORITY_IMAGE2_SUBDIR}/${GEN_PAGE_AUTHORITY_FINAL_SUBDIR}`,
  final_manifest: `${GENERATED_SUBDIR}/${GEN_PAGE_AUTHORITY_IMAGE2_SUBDIR}/${GEN_PAGE_AUTHORITY_FINAL_SUBDIR}/manifest.json`,
  target_final_manifest: `${GENERATED_SUBDIR}/${GEN_PAGE_AUTHORITY_IMAGE2_SUBDIR}/${GEN_PAGE_AUTHORITY_FINAL_SUBDIR}/manifest-v2.json`,
  final_projection: `${GENERATED_SUBDIR}/${GEN_PAGE_AUTHORITY_IMAGE2_SUBDIR}/${GEN_PAGE_AUTHORITY_FINAL_SUBDIR}/projection.png`,
});

export function isPageAuthorityVersionDir(runDir) {
  const root = path.resolve(runDir);
  const parentName = path.basename(path.dirname(root));
  const deckRoot = path.dirname(path.dirname(root));
  return parentName === VERSIONS_DIR && /^v\d+$/.test(path.basename(root)) && path.basename(deckRoot).startsWith("deck_");
}

/** Canonical rebuildable Page Authority derived-artifact locations. */
export function pageAuthorityImage2Paths(runDir) {
  const root = path.resolve(runDir);
  if (!isPageAuthorityVersionDir(root)) throw new Error(`Page Authority paths require a version directory (got ${root})`);
  return Object.freeze(Object.fromEntries(
    Object.entries(PAGE_AUTHORITY_IMAGE2_PATHS).map(([key, relativePath]) => [key, path.join(root, ...relativePath.split("/"))]),
  ));
}

/** Canonical Style Master candidate-history paths for one v2 run. */
export function pageAuthorityStyleMasterPaths(runDir) {
  const root = path.resolve(runDir);
  if (!isPageAuthorityVersionDir(root)) throw new Error(`Style Master paths require a version directory (got ${root})`);
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

/** Canonical append-mostly progressive raw-production owner paths for one v2 run. */
export function pageAuthorityProgressiveRawPaths(runDir) {
  const root = path.resolve(runDir);
  if (!isPageAuthorityVersionDir(root)) throw new Error(`Progressive Page Authority paths require a version directory (got ${root})`);
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
