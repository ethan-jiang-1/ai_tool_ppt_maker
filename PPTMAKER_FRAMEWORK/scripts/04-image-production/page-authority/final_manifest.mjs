import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { canonicalJson } from "../../contracts/canonical_json.mjs";
import { pageAuthorityImage2Paths } from "../../shared/run-bundle/bundle_layout.mjs";
import { readPageAuthorityRawManifest, validatePageAuthorityRawManifest } from "./raw_manifest.mjs";
import { inspectPageAuthorityRawReviewCoverage } from "./raw_review.mjs";
import { finalizePage } from "./finalizer.mjs";

export const PAGE_AUTHORITY_FINAL_MANIFEST_SCHEMA = "pptmaker-page-authority-final-manifest-v1";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const atomic = (path, bytes) => { mkdirSync(dirname(path), { recursive: true }); const tmp = join(dirname(path), `.final.tmp-${process.pid}`); writeFileSync(tmp, bytes); renameSync(tmp, path); };

export async function finalizePageAuthorityRun({ runDir, receipt, sourceEpoch, rawBatch = null, preflight_by_slide = {} } = {}) {
  if (!receipt?.slides?.length || !Number.isInteger(sourceEpoch) || sourceEpoch <= 0) throw new Error("resolved Page Authority receipt and source epoch are required");
  const review = inspectPageAuthorityRawReviewCoverage(runDir, { sourceEpoch });
  if (!review.ok) return review;
  const raw = readPageAuthorityRawManifest(runDir);
  if (!raw?.items?.length) throw new Error("Page Authority raw manifest is missing");
  const rawValidation = validatePageAuthorityRawManifest(raw, { rawBatch, sourceEpoch, runDir });
  if (!rawValidation.ok) {
    return Object.freeze({ ok: false, kind: "hard-stop", code: "RAW_EVIDENCE_MISSING", next_action: "prepare_raw_evidence" });
  }
  const rawById = new Map(raw.items.map((item) => [item.slide_id, item]));
  const paths = pageAuthorityImage2Paths(runDir);
  const entries = [];
  for (const slide of receipt.slides) {
    const item = rawById.get(slide.slide_id);
    if (!item) throw new Error(`raw evidence is missing for ${slide.slide_id}`);
    const imagePath = join(paths.raw_root, item.image_path);
    if (!existsSync(imagePath)) throw new Error(`raw PNG is missing for ${slide.slide_id}`);
    const bytes = readFileSync(imagePath);
    const final = await finalizePage(slide, { bytes, sha256: item.raw_sha256, raw_image_contract_digest: item.raw_image_contract_digest }, review, { runDir, preflight: preflight_by_slide[slide.slide_id] || null });
    entries.push({ slide_id: final.slide_id, authority: final.authority, final_sha256: final.final_sha256, raw_sha256: item.raw_sha256, raw_image_contract_digest: item.raw_image_contract_digest, raw_generation_profile_digest: item.raw_generation_profile_digest, path: `${final.slide_id}.png`, width: final.width, height: final.height, media_profile: final.media_profile, finalization_fingerprint: final.finalization_fingerprint });
  }
  const manifest = { schema: PAGE_AUTHORITY_FINAL_MANIFEST_SCHEMA, source_epoch: sourceEpoch, raw_review_coverage_sha256: sha256(readFileSync(paths.raw_review_coverage)), entries };
  atomic(paths.final_manifest, Buffer.from(`${canonicalJson(manifest)}\n`, "utf8"));
  return Object.freeze({ ok: true, manifest, path: paths.final_manifest });
}

/** Local final projection for delivery review; no provider or legacy artifact access. */
export async function renderPageAuthorityFinalProjection(runDir) {
  const paths = pageAuthorityImage2Paths(runDir);
  const manifest = JSON.parse(readFileSync(paths.final_manifest, "utf8"));
  if (manifest.schema !== PAGE_AUTHORITY_FINAL_MANIFEST_SCHEMA || !Array.isArray(manifest.entries) || !manifest.entries.length) throw new Error("Page Authority final manifest is invalid");
  const width = 1032; const cellW = 500; const cellH = 281; const pad = 16; const labelH = 34; const rows = Math.ceil(manifest.entries.length / 2);
  const canvas = createCanvas(width, pad * 2 + rows * (cellH + labelH) + Math.max(0, rows - 1) * pad); const ctx = canvas.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const [index, entry] of manifest.entries.entries()) { const x = pad + (index % 2) * (cellW + pad); const y = pad + Math.floor(index / 2) * (cellH + labelH + pad); ctx.drawImage(await loadImage(readFileSync(join(paths.final_root, entry.path))), x, y, cellW, cellH); ctx.fillStyle = "#17212b"; ctx.font = "700 16px Arial"; ctx.fillText(entry.slide_id, x, y + cellH + 22); }
  const bytes = canvas.toBuffer("image/png"); atomic(paths.final_projection, bytes); return Object.freeze({ path: paths.final_projection, sha256: sha256(bytes) });
}
