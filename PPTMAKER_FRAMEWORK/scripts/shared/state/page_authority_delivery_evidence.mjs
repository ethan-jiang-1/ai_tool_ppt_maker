import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

import { canonicalJson, canonicalJsonSha256 } from "../../contracts/canonical_json.mjs";
import { SLIDE_SPECS_NAME, pageAuthorityImage2Paths } from "../run-bundle/page_authority_paths.mjs";

const PAGE_AUTHORITY_SOURCE_RECEIPT_SCHEMA = "pptmaker-page-authority-source-receipt-v1";
const PAGE_AUTHORITY_RAW_MANIFEST_SCHEMA = "pptmaker-page-authority-raw-manifest-v1";
const PAGE_AUTHORITY_RAW_REVIEW_COVERAGE_SCHEMA = "pptmaker-page-authority-raw-review-coverage-v1";
const PAGE_AUTHORITY_FINAL_MANIFEST_SCHEMA = "pptmaker-page-authority-final-manifest-v1";
const PAGE_AUTHORITY_PPTX_ASSEMBLY_SCHEMA = "pptmaker-page-authority-pptx-assembly-v1";
const PAGE_AUTHORITY_NOTES_RECEIPT_SCHEMA = "pptmaker-page-authority-notes-receipt-v1";
const PAGE_AUTHORITY_RAW_REVIEW_RENDERER_PROFILE = Object.freeze({
  schema: "pptmaker-page-authority-raw-review-renderer-profile-v1",
  canvas: { cell_width: 500, image_height: 281, label_height: 34, padding: 16, columns: 2 },
  safe_zone_guide: { stroke: "#ff7a00", line_width: 3, opacity: 1 },
  font: { family: "Arial", size_px: 16, weight: "700" },
  capture: { format: "png", normalizer: "napi-rs-canvas-v1" },
});
const PAGE_AUTHORITY_RAW_REVIEW_RENDERER_PROFILE_DIGEST = canonicalJsonSha256(PAGE_AUTHORITY_RAW_REVIEW_RENDERER_PROFILE);
const SHA256_RE = /^[0-9a-f]{64}$/;
const SAFE_SLIDE_ID = /^[A-Za-z][A-Za-z0-9_-]{0,127}$/;

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function exactKeys(value, keys) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)) &&
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function readRegularFile(path) {
  if (!existsSync(path)) return null;
  try {
    const stat = lstatSync(path);
    if (!stat.isFile() || stat.isSymbolicLink()) return null;
    const bytes = readFileSync(path);
    if (!bytes.length) return null;
    return Object.freeze({ path, bytes, sha256: sha256(bytes) });
  } catch {
    return null;
  }
}

function readJson(file) {
  if (!file) return null;
  try {
    return JSON.parse(file.bytes.toString("utf8"));
  } catch {
    return null;
  }
}

function relativeFile(runDir, relativePath) {
  if (typeof relativePath !== "string" || !relativePath || relativePath.includes("\\") || relativePath.startsWith("/")) return null;
  const path = resolve(runDir, relativePath);
  const confined = relative(resolve(runDir), path);
  if (!confined || confined === ".." || confined.startsWith(`..${sep}`)) return null;
  return readRegularFile(path);
}

function validRawManifestItem(item, profileDigest) {
  const baseKeys = ["slide_id", "raw_sha256", "raw_image_contract_digest", "raw_generation_profile_digest", "image_path"];
  const materialized = exactKeys(item, [...baseKeys, "provenance", "source_lineage"]) && item.provenance === "unreviewed" &&
    item.source_lineage && typeof item.source_lineage === "object" && !Array.isArray(item.source_lineage) &&
    exactKeys(item.source_lineage, ["run_dir", "raw_sha256"]) && typeof item.source_lineage.run_dir === "string" && SHA256_RE.test(item.source_lineage.raw_sha256 || "");
  return (exactKeys(item, baseKeys) || materialized) && SAFE_SLIDE_ID.test(item.slide_id || "") &&
    SHA256_RE.test(item.raw_sha256 || "") && SHA256_RE.test(item.raw_image_contract_digest || "") &&
    item.raw_generation_profile_digest === profileDigest && item.image_path === `${item.slide_id}.png`;
}

function currentRawManifest(rawManifest, rawRoot, sourceEpoch) {
  const keys = ["schema", "source_epoch", "source_sha256", "raw_generation_profile_digest", "items"];
  const structural = exactKeys(rawManifest, [...keys, "needs_raw_generation"]) && Array.isArray(rawManifest.needs_raw_generation) && rawManifest.needs_raw_generation.every((id) => SAFE_SLIDE_ID.test(id));
  if (!(exactKeys(rawManifest, keys) || structural) || rawManifest.schema !== PAGE_AUTHORITY_RAW_MANIFEST_SCHEMA ||
    rawManifest.source_epoch !== sourceEpoch || !SHA256_RE.test(rawManifest.source_sha256 || "") ||
    !SHA256_RE.test(rawManifest.raw_generation_profile_digest || "") || !Array.isArray(rawManifest.items)) return false;
  const seen = new Set();
  let previous = null;
  for (const item of rawManifest.items) {
    if (!validRawManifestItem(item, rawManifest.raw_generation_profile_digest) || seen.has(item.slide_id) ||
      (previous !== null && previous >= item.slide_id)) return false;
    const image = readRegularFile(join(rawRoot, item.image_path));
    if (!image || image.sha256 !== item.raw_sha256) return false;
    seen.add(item.slide_id);
    previous = item.slide_id;
  }
  return true;
}

function reviewTuples(rawManifest) {
  if (!rawManifest?.items?.length) return null;
  return rawManifest.items.map((item) => ({
    slide_id: item.slide_id,
    raw_sha256: item.raw_sha256,
    raw_image_contract_digest: item.raw_image_contract_digest,
    raw_generation_profile_digest: item.raw_generation_profile_digest,
  })).sort((left, right) => left.slide_id.localeCompare(right.slide_id));
}

function validRawReviewCoverage(value) {
  const keys = ["schema", "source_epoch", "raw_manifest_sha256", "projection_sha256", "renderer_profile_digest", "tuples", "decision", "decided_at"];
  return exactKeys(value, keys) && value.schema === PAGE_AUTHORITY_RAW_REVIEW_COVERAGE_SCHEMA &&
    Number.isInteger(value.source_epoch) && value.source_epoch > 0 && SHA256_RE.test(value.raw_manifest_sha256 || "") &&
    SHA256_RE.test(value.projection_sha256 || "") && value.renderer_profile_digest === PAGE_AUTHORITY_RAW_REVIEW_RENDERER_PROFILE_DIGEST &&
    Array.isArray(value.tuples) && value.tuples.length > 0 && [null, "proceed", "repair", "redirect"].includes(value.decision) &&
    (value.decision === null ? value.decided_at === null : typeof value.decided_at === "string" && !Number.isNaN(Date.parse(value.decided_at)));
}

function inspectRawReview({ paths, sourceEpoch, rawManifest, rawManifestFile }) {
  const coverageFile = readRegularFile(paths.raw_review_coverage);
  const projectionFile = readRegularFile(paths.raw_review_projection);
  if (!coverageFile || !projectionFile) {
    return Object.freeze({ ok: false, kind: "hard-stop", code: "RAW_REVIEW_EVIDENCE_MISSING", next_action: "repair_raw_review" });
  }
  const coverage = readJson(coverageFile);
  const tuples = reviewTuples(rawManifest);
  const stale = !tuples || !validRawReviewCoverage(coverage) || coverage.source_epoch !== sourceEpoch ||
    coverage.raw_manifest_sha256 !== rawManifestFile.sha256 || coverage.projection_sha256 !== projectionFile.sha256 ||
    canonicalJson(coverage.tuples) !== canonicalJson(tuples);
  if (stale) return Object.freeze({ ok: false, kind: "hard-stop", code: "RAW_REVIEW_EVIDENCE_STALE", next_action: "repair_raw_review" });
  if (coverage.decision === null) return Object.freeze({ ok: false, kind: "confirm", code: "RAW_REVIEW_CONFIRM_REQUIRED", next_action: "confirm_raw_review", coverage: Object.freeze(coverage) });
  if (coverage.decision !== "proceed") return Object.freeze({ ok: false, kind: "hard-stop", code: "RAW_REVIEW_NOT_PROCEEDED", next_action: coverage.decision === "repair" ? "repair_raw_review" : "redirect_raw_review", coverage: Object.freeze(coverage) });
  return Object.freeze({ ok: true, coverage: Object.freeze(coverage) });
}

function baseFacts(sourceEpoch) {
  return {
    source_epoch: sourceEpoch,
    source_receipt: null,
    raw_manifest: null,
    raw_review: null,
    final_manifest: null,
    final_projection: null,
    assembly: null,
    notes: null,
  };
}

function failed(stage, code, nextAction, facts, kind = "hard-stop") {
  return Object.freeze({ ok: false, kind, stage, code, next_action: nextAction, ...facts });
}

/** Read the direct, non-publishing evidence required by a Page Authority delivery decision. */
export function inspectPageAuthorityDeliveryEvidence(runDir, { sourceEpoch } = {}) {
  const resolved = resolve(runDir || "");
  const facts = baseFacts(sourceEpoch);
  if (!Number.isInteger(sourceEpoch) || sourceEpoch <= 0) {
    return failed("state", "PAGE_AUTHORITY_STATE_INVALID", "repair_page_authority_state", facts);
  }

  let paths;
  try {
    paths = pageAuthorityImage2Paths(resolved);
  } catch {
    return failed("layout", "PAGE_AUTHORITY_LAYOUT_INVALID", "repair_layout", facts);
  }

  const source = readRegularFile(join(resolved, SLIDE_SPECS_NAME));
  const receiptFile = readRegularFile(paths.receipt);
  const receipt = readJson(receiptFile);
  if (!source || !receiptFile || !receipt || receipt.schema !== PAGE_AUTHORITY_SOURCE_RECEIPT_SCHEMA ||
    !SHA256_RE.test(receipt.source_sha256 || "") || receipt.source_sha256 !== source.sha256) {
    return failed("source-receipt", "SOURCE_RECEIPT_MISSING_OR_STALE", "validate_page_authority_source", facts);
  }
  facts.source_receipt = Object.freeze({ sha256: receiptFile.sha256, source_sha256: source.sha256 });

  const rawFile = readRegularFile(paths.raw_manifest);
  const rawManifest = readJson(rawFile);
  if (!rawFile || !rawManifest || !currentRawManifest(rawManifest, paths.raw_root, sourceEpoch)) {
    return failed("raw-manifest", "RAW_EVIDENCE_MISSING_OR_STALE", "prepare_raw_evidence", facts);
  }
  facts.raw_manifest = Object.freeze({ sha256: rawFile.sha256 });

  const rawReview = inspectRawReview({ paths, sourceEpoch, rawManifest, rawManifestFile: rawFile });
  facts.raw_review = rawReview;
  if (!rawReview.ok) return failed("raw-review", rawReview.code, rawReview.next_action, facts, rawReview.kind);
  const coverageFile = readRegularFile(paths.raw_review_coverage);
  const rawProjectionFile = readRegularFile(paths.raw_review_projection);
  if (!coverageFile || !rawProjectionFile || rawReview.coverage?.projection_sha256 !== rawProjectionFile.sha256 ||
    rawReview.coverage?.raw_manifest_sha256 !== rawFile.sha256) {
    return failed("raw-review", "RAW_REVIEW_EVIDENCE_STALE", "repair_raw_review", facts);
  }

  const finalFile = readRegularFile(paths.final_manifest);
  const finalManifest = readJson(finalFile);
  if (!finalFile || !finalManifest || finalManifest.schema !== PAGE_AUTHORITY_FINAL_MANIFEST_SCHEMA ||
    finalManifest.source_epoch !== sourceEpoch || finalManifest.raw_review_coverage_sha256 !== coverageFile.sha256 ||
    !Array.isArray(finalManifest.entries) || finalManifest.entries.length === 0) {
    return failed("final-manifest", "FINAL_MANIFEST_MISSING_OR_STALE", "finalize_page_authority_delivery", facts);
  }
  for (const entry of finalManifest.entries) {
    if (!entry || typeof entry.slide_id !== "string" || entry.path !== `${entry.slide_id}.png` || !SHA256_RE.test(entry.final_sha256 || "")) {
      return failed("final-manifest", "FINAL_MANIFEST_INVALID", "finalize_page_authority_delivery", facts);
    }
    const finalImage = readRegularFile(join(paths.final_root, entry.path));
    if (!finalImage || finalImage.sha256 !== entry.final_sha256) {
      return failed("final-manifest", "FINAL_MANIFEST_IMAGE_STALE", "finalize_page_authority_delivery", facts);
    }
  }
  facts.final_manifest = Object.freeze({ sha256: finalFile.sha256 });

  const finalProjectionFile = readRegularFile(paths.final_projection);
  if (!finalProjectionFile) return failed("final-projection", "FINAL_PROJECTION_MISSING", "finalize_page_authority_delivery", facts);
  facts.final_projection = Object.freeze({ sha256: finalProjectionFile.sha256 });

  const assemblyFile = readRegularFile(join(paths.final_root, "pptx-assembly.json"));
  const assembly = readJson(assemblyFile);
  const pptx = assembly ? relativeFile(resolved, assembly.pptx_path) : null;
  if (!assemblyFile || !assembly || assembly.schema !== PAGE_AUTHORITY_PPTX_ASSEMBLY_SCHEMA || assembly.source_epoch !== sourceEpoch ||
    assembly.final_manifest_sha256 !== finalFile.sha256 || !pptx) {
    return failed("assembly", "PPTX_ASSEMBLY_MISSING_OR_STALE", "assemble_page_authority_delivery", facts);
  }
  facts.assembly = Object.freeze({ sha256: assemblyFile.sha256 });

  const notesFile = readRegularFile(join(paths.final_root, "notes-receipt.json"));
  const notes = readJson(notesFile);
  if (!notesFile || !notes || notes.schema !== PAGE_AUTHORITY_NOTES_RECEIPT_SCHEMA || notes.source_epoch !== sourceEpoch ||
    notes.assembly_receipt_sha256 !== assemblyFile.sha256 || notes.final_manifest_sha256 !== finalFile.sha256 ||
    notes.pptx_sha256 !== pptx.sha256) {
    return failed("notes", "NOTES_RECEIPT_MISSING_OR_STALE", "inject_page_authority_notes", facts);
  }
  facts.notes = Object.freeze({ sha256: notesFile.sha256 });

  const evidence = Object.freeze({
    source_epoch: sourceEpoch,
    source_sha256: source.sha256,
    source_receipt_sha256: receiptFile.sha256,
    raw_manifest_sha256: rawFile.sha256,
    raw_review_projection_sha256: rawProjectionFile.sha256,
    raw_review_coverage_sha256: coverageFile.sha256,
    final_manifest_sha256: finalFile.sha256,
    final_projection_sha256: finalProjectionFile.sha256,
    assembly_receipt_sha256: assemblyFile.sha256,
    pptx_sha256: pptx.sha256,
    notes_receipt_sha256: notesFile.sha256,
  });
  return Object.freeze({ ok: true, stage: "delivery", code: "PAGE_AUTHORITY_DELIVERY_EVIDENCE_CURRENT", next_action: "confirm_page_authority_delivery_review", ...facts, evidence });
}
