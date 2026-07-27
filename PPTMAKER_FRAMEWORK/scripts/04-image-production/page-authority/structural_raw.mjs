import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { canonicalJson, canonicalJsonSha256 } from "../../contracts/canonical_json.mjs";
import { pageAuthorityImage2Paths } from "../../shared/run-bundle/bundle_layout.mjs";
import { readPageAuthorityRawManifest } from "./raw_manifest.mjs";

export const PAGE_AUTHORITY_STRUCTURAL_RAW_PLAN_SCHEMA = "pptmaker-page-authority-structural-raw-plan-v1";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const SHA256_RE = /^[0-9a-f]{64}$/;

function assertBatch(batch) { if (!batch?.requests?.length || !/^[0-9a-f]{64}$/.test(batch.raw_generation_profile_digest || "")) throw new Error("target Page Authority raw batch is required"); }
function stagingRawPaths(runDir) {
  const raw_root = join(runDir, "_generated", "page_authority_image2", "raw");
  return { raw_root, raw_manifest: join(raw_root, "manifest.json") };
}

/** Preview only: classifies exact raw tuples without copying bytes or calling a provider. */
export function previewPageAuthorityStructuralRaw({ sourceRunDir, targetRunDir, targetRawBatch, slideEditBasePlanSha256 } = {}) {
  assertBatch(targetRawBatch);
  if (!SHA256_RE.test(slideEditBasePlanSha256 || "")) throw new Error("structural raw preview requires the base slide-edit plan hash");
  const source = readPageAuthorityRawManifest(sourceRunDir);
  const sourceById = new Map(source?.items?.map((item) => [item.slide_id, item]) || []);
  const entries = targetRawBatch.requests.map((request) => {
    const prior = sourceById.get(request.slide_id);
    const reusable = Boolean(prior && prior.raw_image_contract_digest === request.raw_image_contract_digest && prior.raw_generation_profile_digest === request.raw_generation_profile_digest);
    return { slide_id: request.slide_id, disposition: reusable ? "materialize_unreviewed" : "needs_raw_generation", ...(reusable ? { source_raw_sha256: prior.raw_sha256 } : {}) };
  }).sort((a, b) => a.slide_id.localeCompare(b.slide_id));
  const body = { schema: PAGE_AUTHORITY_STRUCTURAL_RAW_PLAN_SCHEMA, source_run_dir: sourceRunDir, target_run_dir: targetRunDir, slide_edit_base_plan_sha256: slideEditBasePlanSha256, target_source_epoch: 1, target_source_sha256: targetRawBatch.source_sha256, raw_generation_profile_digest: targetRawBatch.raw_generation_profile_digest, entries };
  return Object.freeze({ ...body, plan_hash: canonicalJsonSha256(body) });
}

/** Apply a confirmed preview; materialized target raw provenance is always unreviewed. */
export function applyPageAuthorityStructuralRaw({ plan, planHash, targetRawBatch, expectedSlideEditBasePlanSha256, materializationRunDir = null } = {}) {
  assertBatch(targetRawBatch);
  if (!plan || plan.plan_hash !== planHash) throw new Error("confirmed structural raw plan hash is required");
  const { plan_hash: ignored, ...body } = plan;
  if (canonicalJsonSha256(body) !== planHash || !SHA256_RE.test(plan.slide_edit_base_plan_sha256 || "") || plan.slide_edit_base_plan_sha256 !== expectedSlideEditBasePlanSha256 || plan.target_source_epoch !== 1 || plan.target_source_sha256 !== targetRawBatch.source_sha256 || plan.raw_generation_profile_digest !== targetRawBatch.raw_generation_profile_digest) throw new Error("structural raw plan drifted");
  const sourcePaths = pageAuthorityImage2Paths(plan.source_run_dir); const targetPaths = stagingRawPaths(materializationRunDir || plan.target_run_dir); const source = readPageAuthorityRawManifest(plan.source_run_dir); const sourceById = new Map(source?.items?.map((item) => [item.slide_id, item]) || []); const requestById = new Map(targetRawBatch.requests.map((request) => [request.slide_id, request]));
  mkdirSync(targetPaths.raw_root, { recursive: true }); const items = []; const debt = [];
  for (const entry of plan.entries) {
    const request = requestById.get(entry.slide_id); const prior = sourceById.get(entry.slide_id);
    if (entry.disposition !== "materialize_unreviewed" || !request || !prior) { debt.push(entry.slide_id); continue; }
    const sourcePath = join(sourcePaths.raw_root, prior.image_path); if (!existsSync(sourcePath)) throw new Error(`structural source raw is missing for ${entry.slide_id}`);
    const bytes = readFileSync(sourcePath); if (sha256(bytes) !== prior.raw_sha256) throw new Error(`structural source raw is corrupt for ${entry.slide_id}`);
    writeFileSync(join(targetPaths.raw_root, `${entry.slide_id}.png`), bytes);
    items.push({ slide_id: entry.slide_id, raw_sha256: prior.raw_sha256, raw_image_contract_digest: request.raw_image_contract_digest, raw_generation_profile_digest: request.raw_generation_profile_digest, image_path: `${entry.slide_id}.png`, provenance: "unreviewed", source_lineage: { run_dir: plan.source_run_dir, raw_sha256: prior.raw_sha256 } });
  }
  const manifest = { schema: "pptmaker-page-authority-raw-manifest-v1", source_epoch: 1, source_sha256: targetRawBatch.source_sha256, raw_generation_profile_digest: targetRawBatch.raw_generation_profile_digest, items: items.sort((a, b) => a.slide_id.localeCompare(b.slide_id)), needs_raw_generation: debt.sort() };
  writeFileSync(targetPaths.raw_manifest, `${canonicalJson(manifest)}\n`);
  return Object.freeze({ plan_hash: planHash, materialized_slide_ids: items.map((item) => item.slide_id), needs_raw_generation: debt, provider_calls: 0 });
}
