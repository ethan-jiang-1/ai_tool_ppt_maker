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

export const PAGE_AUTHORITY_IMAGE2_PATHS = Object.freeze({
  root: `${GENERATED_SUBDIR}/${GEN_PAGE_AUTHORITY_IMAGE2_SUBDIR}`,
  receipt: `${GENERATED_SUBDIR}/${GEN_PAGE_AUTHORITY_IMAGE2_SUBDIR}/${GEN_PAGE_AUTHORITY_RECEIPTS_SUBDIR}/source-receipt.json`,
  transition_receipt: `${GENERATED_SUBDIR}/${GEN_PAGE_AUTHORITY_IMAGE2_SUBDIR}/${GEN_PAGE_AUTHORITY_RECEIPTS_SUBDIR}/production-mode-transition.json`,
  raw_root: `${GENERATED_SUBDIR}/${GEN_PAGE_AUTHORITY_IMAGE2_SUBDIR}/${GEN_PAGE_AUTHORITY_RAW_SUBDIR}`,
  raw_manifest: `${GENERATED_SUBDIR}/${GEN_PAGE_AUTHORITY_IMAGE2_SUBDIR}/${GEN_PAGE_AUTHORITY_RAW_SUBDIR}/manifest.json`,
  review_root: `${GENERATED_SUBDIR}/${GEN_PAGE_AUTHORITY_IMAGE2_SUBDIR}/${GEN_PAGE_AUTHORITY_REVIEW_SUBDIR}`,
  raw_review_projection: `${GENERATED_SUBDIR}/${GEN_PAGE_AUTHORITY_IMAGE2_SUBDIR}/${GEN_PAGE_AUTHORITY_REVIEW_SUBDIR}/raw-review.png`,
  raw_review_coverage: `${GENERATED_SUBDIR}/${GEN_PAGE_AUTHORITY_IMAGE2_SUBDIR}/${GEN_PAGE_AUTHORITY_REVIEW_SUBDIR}/coverage.json`,
  final_root: `${GENERATED_SUBDIR}/${GEN_PAGE_AUTHORITY_IMAGE2_SUBDIR}/${GEN_PAGE_AUTHORITY_FINAL_SUBDIR}`,
  final_manifest: `${GENERATED_SUBDIR}/${GEN_PAGE_AUTHORITY_IMAGE2_SUBDIR}/${GEN_PAGE_AUTHORITY_FINAL_SUBDIR}/manifest.json`,
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
