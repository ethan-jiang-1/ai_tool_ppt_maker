import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { decode as decodePng } from "fast-png";
import { canonicalJsonSha256 } from "../../contracts/canonical_json.mjs";
import { pageAuthorityImage2Paths } from "../../shared/run-bundle/bundle_layout.mjs";
import { composePageAuthorityFramedPage } from "../../03-framed-image/index.mjs";

export const PAGE_AUTHORITY_FINAL_SLIDE_SCHEMA = "pptmaker-page-authority-final-slide-v1";
function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function assertPng(bytes, declaredSha) {
  if (!Buffer.isBuffer(bytes) || !bytes.length || sha256(bytes) !== declaredSha) throw new Error("verified raw bytes and SHA-256 are required");
  const png = decodePng(bytes, { checkCrc: true });
  if (png.width !== 2000 || png.height !== 1125) throw new Error("final slide PNG must be 2000x1125");
  return png;
}
function safeSlideId(value) { if (typeof value !== "string" || !/^[A-Za-z][A-Za-z0-9_-]{0,127}$/.test(value)) throw new Error("finalizer requires a stable slide_id"); return value; }

/** The sole public Page Authority final-slide publication interface. */
export async function finalizePage(receipt, verifiedRaw, verifiedEvidence, { runDir, preflight = null } = {}) {
  if (!receipt || !["pure-image2", "framed-image2"].includes(receipt.authority)) throw new Error("finalizePage requires a resolved Page Authority slide receipt");
  const slideId = safeSlideId(receipt.slide_id);
  if (!/^[0-9a-f]{64}$/.test(verifiedRaw?.raw_image_contract_digest || "")) throw new Error("verified raw contract digest is required");
  if (!verifiedEvidence?.ok || verifiedEvidence.coverage?.decision !== "proceed") throw new Error("current Page Authority raw-review proceed evidence is required before finalization");
  if (!verifiedEvidence.coverage.tuples?.some((tuple) => tuple.slide_id === slideId && tuple.raw_sha256 === verifiedRaw?.sha256)) throw new Error("raw-review evidence does not cover this exact raw tuple");
  assertPng(verifiedRaw?.bytes, verifiedRaw?.sha256);
  const final = receipt.authority === "pure-image2"
    ? { bytes: Buffer.from(verifiedRaw.bytes), sha256: verifiedRaw.sha256, width: 2000, height: 1125, media_profile: "page-authority-pure-pass-through-v1" }
    : await composePageAuthorityFramedPage({ receipt, verifiedRaw, preflight });
  const finalSha = sha256(final.bytes);
  if (finalSha !== final.sha256) throw new Error("finalizer output SHA-256 drifted");
  const entry = Object.freeze({ schema: PAGE_AUTHORITY_FINAL_SLIDE_SCHEMA, slide_id: slideId, authority: receipt.authority, final_sha256: finalSha, width: final.width, height: final.height, media_profile: final.media_profile, finalization_fingerprint: canonicalJsonSha256({ slide_id: slideId, authority: receipt.authority, raw_sha256: verifiedRaw.sha256, raw_contract: verifiedRaw.raw_image_contract_digest, review: verifiedEvidence.coverage }), bytes: final.bytes });
  if (runDir) { const path = join(pageAuthorityImage2Paths(runDir).final_root, `${slideId}.png`); mkdirSync(pageAuthorityImage2Paths(runDir).final_root, { recursive: true }); writeFileSync(path, final.bytes); return Object.freeze({ ...entry, path }); }
  return entry;
}
