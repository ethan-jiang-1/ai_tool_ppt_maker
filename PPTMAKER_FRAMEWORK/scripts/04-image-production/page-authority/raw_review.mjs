import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { canonicalJson, canonicalJsonSha256 } from "../../contracts/canonical_json.mjs";
import { pageAuthorityImage2Paths } from "../../shared/run-bundle/bundle_layout.mjs";
import { readPageAuthorityRawManifest } from "./raw_manifest.mjs";

export const PAGE_AUTHORITY_RAW_REVIEW_COVERAGE_SCHEMA = "pptmaker-page-authority-raw-review-coverage-v1";
export const PAGE_AUTHORITY_RAW_REVIEW_RENDERER_PROFILE = Object.freeze({
  schema: "pptmaker-page-authority-raw-review-renderer-profile-v1",
  canvas: { cell_width: 500, image_height: 281, label_height: 34, padding: 16, columns: 2 },
  safe_zone_guide: { stroke: "#ff7a00", line_width: 3, opacity: 1 },
  font: { family: "Arial", size_px: 16, weight: "700" },
  capture: { format: "png", normalizer: "napi-rs-canvas-v1" },
});
export const PAGE_AUTHORITY_RAW_REVIEW_RENDERER_PROFILE_DIGEST = canonicalJsonSha256(PAGE_AUTHORITY_RAW_REVIEW_RENDERER_PROFILE);

const SHA256_RE = /^[0-9a-f]{64}$/;
function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function exactKeys(value, keys) { return Boolean(value && typeof value === "object" && !Array.isArray(value)) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key)); }
function nowIso() { return new Date().toISOString(); }
function writeAtomic(path, bytes) { mkdirSync(dirname(path), { recursive: true }); const tmp = join(dirname(path), `.${"coverage"}.tmp-${process.pid}`); writeFileSync(tmp, bytes); renameSync(tmp, path); }

export class PageAuthorityRawReviewError extends Error {
  constructor(code, message) { super(message); this.name = "PageAuthorityRawReviewError"; this.code = code; }
}

function reviewTuples(rawManifest) {
  if (!rawManifest?.items?.length) throw new PageAuthorityRawReviewError("raw_manifest_missing", "a nonempty Page Authority raw manifest is required");
  return rawManifest.items.map((item) => ({
    slide_id: item.slide_id,
    raw_sha256: item.raw_sha256,
    raw_image_contract_digest: item.raw_image_contract_digest,
    raw_generation_profile_digest: item.raw_generation_profile_digest,
  })).sort((left, right) => left.slide_id.localeCompare(right.slide_id));
}

function rawManifestSha(runDir) {
  const path = pageAuthorityImage2Paths(runDir).raw_manifest;
  if (!existsSync(path)) throw new PageAuthorityRawReviewError("raw_manifest_missing", "raw manifest is missing");
  return sha256(readFileSync(path));
}

function framedGuides(rawBatch) {
  const byId = new Map();
  for (const request of rawBatch?.requests || []) {
    const framed = request.provider_payload?.image_contract?.framed;
    if (request.authority === "framed-image2" && Array.isArray(framed?.reserved_underlay_rectangles) && framed.canvas?.width > 0 && framed.canvas?.height > 0) {
      byId.set(request.slide_id, { rectangles: framed.reserved_underlay_rectangles, canvas: framed.canvas });
    }
  }
  return byId;
}

/** Build the non-publishing raw contact sheet. It reads only local raw bytes. */
export async function renderPageAuthorityRawReviewProjection(runDir, { rawBatch } = {}) {
  const paths = pageAuthorityImage2Paths(runDir);
  const manifest = readPageAuthorityRawManifest(runDir);
  const tuples = reviewTuples(manifest);
  const guides = framedGuides(rawBatch);
  const profile = PAGE_AUTHORITY_RAW_REVIEW_RENDERER_PROFILE;
  const rows = Math.ceil(tuples.length / profile.canvas.columns);
  const width = profile.canvas.padding * 2 + profile.canvas.columns * profile.canvas.cell_width + (profile.canvas.columns - 1) * profile.canvas.padding;
  const height = profile.canvas.padding * 2 + rows * (profile.canvas.image_height + profile.canvas.label_height) + (rows - 1) * profile.canvas.padding;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  for (const [index, tuple] of tuples.entries()) {
    const col = index % profile.canvas.columns;
    const row = Math.floor(index / profile.canvas.columns);
    const x = profile.canvas.padding + col * (profile.canvas.cell_width + profile.canvas.padding);
    const y = profile.canvas.padding + row * (profile.canvas.image_height + profile.canvas.label_height + profile.canvas.padding);
    const image = await loadImage(readFileSync(join(paths.raw_root, `${tuple.slide_id}.png`)));
    ctx.drawImage(image, x, y, profile.canvas.cell_width, profile.canvas.image_height);
    const guide = guides.get(tuple.slide_id);
    for (const rectangle of guide?.rectangles || []) {
      const scaleX = profile.canvas.cell_width / guide.canvas.width;
      const scaleY = profile.canvas.image_height / guide.canvas.height;
      ctx.save(); ctx.strokeStyle = profile.safe_zone_guide.stroke; ctx.lineWidth = profile.safe_zone_guide.line_width;
      ctx.strokeRect(x + rectangle.x * scaleX, y + rectangle.y * scaleY, rectangle.width * scaleX, rectangle.height * scaleY); ctx.restore();
    }
    ctx.fillStyle = "#17212b"; ctx.font = `${profile.font.weight} ${profile.font.size_px}px ${profile.font.family}`;
    ctx.fillText(tuple.slide_id, x, y + profile.canvas.image_height + 22);
  }
  const png = canvas.toBuffer("image/png");
  if (!png.length) throw new PageAuthorityRawReviewError("raw_review_render_failed", "raw review renderer produced no PNG bytes");
  mkdirSync(dirname(paths.raw_review_projection), { recursive: true });
  writeFileSync(paths.raw_review_projection, png);
  return Object.freeze({ path: paths.raw_review_projection, sha256: sha256(png), tuples, raw_manifest_sha256: rawManifestSha(runDir) });
}

function validCoverage(value) {
  const keys = ["schema", "source_epoch", "raw_manifest_sha256", "projection_sha256", "renderer_profile_digest", "tuples", "decision", "decided_at"];
  return exactKeys(value, keys) && value.schema === PAGE_AUTHORITY_RAW_REVIEW_COVERAGE_SCHEMA &&
    Number.isInteger(value.source_epoch) && value.source_epoch > 0 && SHA256_RE.test(value.raw_manifest_sha256 || "") &&
    SHA256_RE.test(value.projection_sha256 || "") && value.renderer_profile_digest === PAGE_AUTHORITY_RAW_REVIEW_RENDERER_PROFILE_DIGEST &&
    Array.isArray(value.tuples) && value.tuples.length > 0 && [null, "proceed", "repair", "redirect"].includes(value.decision) &&
    (value.decision === null ? value.decided_at === null : typeof value.decided_at === "string" && !Number.isNaN(Date.parse(value.decided_at)));
}

export function writePageAuthorityRawReviewCoverage(runDir, { sourceEpoch, projection } = {}) {
  if (!Number.isInteger(sourceEpoch) || sourceEpoch <= 0 || !projection?.sha256 || !Array.isArray(projection.tuples)) throw new PageAuthorityRawReviewError("raw_review_inputs_invalid", "current source epoch and projection are required");
  const coverage = { schema: PAGE_AUTHORITY_RAW_REVIEW_COVERAGE_SCHEMA, source_epoch: sourceEpoch, raw_manifest_sha256: projection.raw_manifest_sha256, projection_sha256: projection.sha256, renderer_profile_digest: PAGE_AUTHORITY_RAW_REVIEW_RENDERER_PROFILE_DIGEST, tuples: projection.tuples, decision: null, decided_at: null };
  if (!validCoverage(coverage)) throw new PageAuthorityRawReviewError("raw_review_coverage_invalid", "derived raw review coverage is invalid");
  const path = pageAuthorityImage2Paths(runDir).raw_review_coverage;
  writeAtomic(path, Buffer.from(`${canonicalJson(coverage)}\n`, "utf8"));
  return Object.freeze(coverage);
}

export function recordPageAuthorityRawReviewDecision(runDir, { decision } = {}) {
  if (!["proceed", "repair", "redirect"].includes(decision)) throw new PageAuthorityRawReviewError("raw_review_decision_invalid", "decision must be proceed, repair, or redirect");
  const current = inspectPageAuthorityRawReviewCoverage(runDir, { sourceEpoch: readPageAuthorityRawManifest(runDir)?.source_epoch });
  if (current.kind !== "confirm") throw new PageAuthorityRawReviewError("raw_review_not_confirmable", "only a complete current raw review projection may receive a human decision");
  const path = pageAuthorityImage2Paths(runDir).raw_review_coverage;
  if (!existsSync(path)) throw new PageAuthorityRawReviewError("raw_review_coverage_missing", "current raw review coverage is required");
  let coverage; try { coverage = JSON.parse(readFileSync(path, "utf8")); } catch { throw new PageAuthorityRawReviewError("raw_review_coverage_invalid", "raw review coverage is invalid JSON"); }
  if (!validCoverage(coverage)) throw new PageAuthorityRawReviewError("raw_review_coverage_invalid", "raw review coverage has an invalid shape");
  const next = { ...coverage, decision, decided_at: nowIso() };
  writeAtomic(path, Buffer.from(`${canonicalJson(next)}\n`, "utf8"));
  return Object.freeze(next);
}

/** Classify finalization readiness without publishing or invoking a provider. */
export function inspectPageAuthorityRawReviewCoverage(runDir, { sourceEpoch } = {}) {
  const paths = pageAuthorityImage2Paths(runDir);
  if (!existsSync(paths.raw_review_coverage) || !existsSync(paths.raw_review_projection)) return Object.freeze({ ok: false, kind: "hard-stop", code: "RAW_REVIEW_EVIDENCE_MISSING", next_action: "repair_raw_review" });
  let coverage; try { coverage = JSON.parse(readFileSync(paths.raw_review_coverage, "utf8")); } catch { return Object.freeze({ ok: false, kind: "hard-stop", code: "RAW_REVIEW_EVIDENCE_INVALID", next_action: "repair_raw_review" }); }
  const manifest = readPageAuthorityRawManifest(runDir);
  const currentTuples = reviewTuples(manifest);
  const stale = !validCoverage(coverage) || coverage.source_epoch !== sourceEpoch || coverage.raw_manifest_sha256 !== rawManifestSha(runDir) || coverage.projection_sha256 !== sha256(readFileSync(paths.raw_review_projection)) || coverage.renderer_profile_digest !== PAGE_AUTHORITY_RAW_REVIEW_RENDERER_PROFILE_DIGEST || canonicalJson(coverage.tuples) !== canonicalJson(currentTuples);
  if (stale) return Object.freeze({ ok: false, kind: "hard-stop", code: "RAW_REVIEW_EVIDENCE_STALE", next_action: "repair_raw_review" });
  if (coverage.decision === null) return Object.freeze({ ok: false, kind: "confirm", code: "RAW_REVIEW_CONFIRM_REQUIRED", next_action: "confirm_raw_review", coverage: Object.freeze(coverage) });
  if (coverage.decision !== "proceed") return Object.freeze({ ok: false, kind: "hard-stop", code: "RAW_REVIEW_NOT_PROCEEDED", next_action: coverage.decision === "repair" ? "repair_raw_review" : "redirect_raw_review", coverage: Object.freeze(coverage) });
  return Object.freeze({ ok: true, coverage: Object.freeze(coverage) });
}
