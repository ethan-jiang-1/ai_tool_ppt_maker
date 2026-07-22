import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { Document, parse as parseYaml } from "yaml";
import { canonicalJson } from "../../shared/identity/canonical_json.mjs";
import { deckRoot, IMAGE2_REFINEMENT_PROVENANCE_FILE, SCRATCH_IMAGE2_REFINEMENT_JOURNALS_SUBDIR, SCRATCH_IMAGE2_REFINEMENT_SUBDIR } from "../../shared/run-bundle/bundle_layout.mjs";
import { readState, statePath, writeState } from "../../shared/state/state.mjs";
import {
  REFINEMENT_CANDIDATE_SCHEMA,
  REFINEMENT_PROMOTION_JOURNAL_SCHEMA as CONTRACT_PROMOTION_SCHEMA,
  REFINEMENT_PROVENANCE_SCHEMA,
  REFINEMENT_REVIEW_SCHEMA,
  SHA256_RE,
  createReviewRecord,
  isNormalizedVersion,
  isSafeRefinementId,
  sha256 as contractSha256,
} from "./contracts.mjs";

export const REFINEMENT_PROMOTION_JOURNAL_SCHEMA = CONTRACT_PROMOTION_SCHEMA;
const SHA_RE = /^[0-9a-f]{64}$/;
const VERSION_RE = /^v[1-9][0-9]*$/;

function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function exactKeys(value, keys) { return Boolean(value) && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key)); }

function atomicWrite(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = join(dirname(path), `.${basename(path)}.${process.pid}.${randomUUID()}.tmp`);
  writeFileSync(temporary, bytes, { flag: "wx", mode: 0o600 });
  try { renameSync(temporary, path); } catch (error) { rmSync(temporary, { force: true }); throw error; }
}

function validateProvenanceBinding(binding, { selection = true } = {}) {
  const keys = ["asset_id", ...(selection ? ["accepted_for"] : []), "output_sha256", "candidate_sha256", "profile_fingerprint", "plan_hash", "authorization_id", "attempt_id"];
  if (!exactKeys(binding, keys) || !/^[a-z][a-z0-9_]*(?:-[a-z0-9_]+)*$/.test(binding.asset_id || "") || !isSafeRefinementId(binding.authorization_id) || !isSafeRefinementId(binding.attempt_id)) {
    throw new Error("refinement provenance binding has an invalid shape");
  }
  for (const key of [...(selection ? ["accepted_for"] : []), "output_sha256", "candidate_sha256", "profile_fingerprint", "plan_hash"]) {
    if (!SHA_RE.test(binding[key])) throw new Error("refinement provenance binding requires SHA-256 evidence");
  }
  for (const value of Object.values(binding)) {
    if (typeof value === "string" && (/^(?:\/|[A-Za-z]:[\\/])/.test(value) || value.includes("../") || value.includes("..\\"))) throw new Error("refinement provenance contains an absolute or escaping path");
  }
  for (const key of Object.keys(binding)) if (/(?:path|prompt|response|credential|token|secret|key)/i.test(key)) throw new Error("refinement provenance contains unsafe fields");
}

function validateProvenance(paths, provenance) {
  if (!exactKeys(provenance, ["schema", "run_version", "style_reference", "accepted_slots"]) || provenance.schema !== REFINEMENT_PROVENANCE_SCHEMA || provenance.run_version !== paths.run_version || !provenance.accepted_slots || typeof provenance.accepted_slots !== "object" || Array.isArray(provenance.accepted_slots)) {
    throw new Error("refinement provenance must have its canonical schema and run_version");
  }
  if (provenance.style_reference !== null) validateProvenanceBinding(provenance.style_reference, { selection: false });
  for (const [slideId, binding] of Object.entries(provenance.accepted_slots)) {
    if (!isSafeRefinementId(slideId)) throw new Error("refinement provenance accepted slot ID is invalid");
    validateProvenanceBinding(binding);
  }
  for (const key of Object.keys(provenance)) if (/(?:path|prompt|response|credential|token|secret|key)/i.test(key)) throw new Error("refinement provenance contains unsafe fields");
}

export function refinementPaths(runDir) {
  const run = resolve(runDir);
  const runVersion = basename(run);
  if (!VERSION_RE.test(runVersion) || !isNormalizedVersion(runVersion)) throw new Error("refinement requires a normalized vN run directory");
  const generated = join(run, "_generated", "image2_refinement");
  const scratch = join(run, "_scratch", "image2_refinement");
  const candidates = join(generated, "candidates");
  const comparisons = join(generated, "comparisons");
  const attempts = join(generated, "attempts");
  const journals = join(scratch, "journals");
  const sourceAssets = join(run, "overrides", "visual-style", "assets", "refined", "image2");
  return Object.freeze({
    run,
    run_version: runVersion,
    asset_manifest: join(run, "overrides", "visual-style", "assets", "asset-manifest.yaml"),
    slide_specifications: join(run, "slide-specifications.md"),
    provenance: join(run, "overrides", "visual-style", IMAGE2_REFINEMENT_PROVENANCE_FILE),
    generated,
    candidates,
    comparisons,
    attempts,
    scratch,
    journals,
    journal: join(journals, "promotion.json"),
    plan: join(attempts, "plan.json"),
    authorization: join(attempts, "authorization.json"),
    source_assets: sourceAssets,
    style_reference_assets: join(sourceAssets, "style-reference"),
    visual_slot_assets: join(sourceAssets, "visual-slots"),
    state: statePath(deckRoot(run)),
  });
}

function assertSafeFilename(value, label = "identifier") {
  if (!isSafeRefinementId(value)) throw new Error(`${label} is not a safe refinement identifier`);
  return value;
}

export function ensureRefinementDerivedRoots(runDir) {
  const paths = refinementPaths(runDir);
  for (const dir of [paths.generated, paths.candidates, paths.comparisons, paths.attempts, paths.scratch, paths.journals]) mkdirSync(dir, { recursive: true });
  return paths;
}

export function candidatePaths(runDir, candidateId) {
  const paths = refinementPaths(runDir);
  const id = assertSafeFilename(candidateId, "candidate_id");
  return Object.freeze({
    ...paths,
    candidate_id: id,
    bytes: join(paths.candidates, `${id}.png`),
    metadata: join(paths.candidates, `${id}.json`),
    comparison: join(paths.comparisons, `${id}.html`),
    comparison_metadata: join(paths.comparisons, `${id}.json`),
  });
}

export function attemptPath(runDir, attemptId) {
  const paths = refinementPaths(runDir);
  const id = assertSafeFilename(attemptId, "attempt_id");
  return join(paths.attempts, `${id}.json`);
}

function readJson(path, label) {
  if (!existsSync(path)) return null;
  try {
    const value = JSON.parse(readFileSync(path, "utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("object expected");
    return value;
  } catch (error) {
    throw new Error(`invalid ${label}: ${error.message}`);
  }
}

export function writeJsonAtomic(path, value) {
  atomicWrite(path, Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8"));
  return path;
}

export function readRefinementPlan(runDir) { return readJson(refinementPaths(runDir).plan, "refinement plan"); }
export function readRefinementAuthorization(runDir) { return readJson(refinementPaths(runDir).authorization, "refinement authorization"); }

export function writeRefinementPlan(runDir, plan, { expectedSha256 = null } = {}) {
  const paths = ensureRefinementDerivedRoots(runDir);
  const bytes = Buffer.from(`${canonicalJson(plan)}\n`, "utf8");
  const old = existsSync(paths.plan) ? readFileSync(paths.plan) : Buffer.alloc(0);
  if (expectedSha256 !== null && contractSha256(old) !== expectedSha256) throw new Error("CONFLICT: refinement plan changed before write");
  atomicWrite(paths.plan, bytes);
  return Object.freeze({ path: paths.plan, sha256: contractSha256(bytes) });
}

export function writeRefinementAuthorization(runDir, authorization, { expectedSha256 = null } = {}) {
  const paths = ensureRefinementDerivedRoots(runDir);
  const bytes = Buffer.from(`${canonicalJson(authorization)}\n`, "utf8");
  const old = existsSync(paths.authorization) ? readFileSync(paths.authorization) : Buffer.alloc(0);
  if (expectedSha256 !== null && contractSha256(old) !== expectedSha256) throw new Error("CONFLICT: refinement authorization changed before write");
  if (existsSync(paths.authorization) && expectedSha256 === null) throw new Error("CONFLICT: refinement authorization is single-use");
  atomicWrite(paths.authorization, bytes);
  return Object.freeze({ path: paths.authorization, sha256: contractSha256(bytes) });
}

export function writeAttemptRecord(runDir, attempt, { expectedSha256 = null } = {}) {
  const path = attemptPath(runDir, attempt.attempt_id);
  const old = existsSync(path) ? readFileSync(path) : Buffer.alloc(0);
  if (expectedSha256 !== null && contractSha256(old) !== expectedSha256) throw new Error("CONFLICT: attempt changed before write");
  atomicWrite(path, Buffer.from(`${JSON.stringify(attempt, null, 2)}\n`, "utf8"));
  return Object.freeze({ path, sha256: readVersionFileSha(path) });
}

export function readAttemptRecord(runDir, attemptId) { return readJson(attemptPath(runDir, attemptId), "attempt record"); }

export function persistCandidate(runDir, candidate, bytes) {
  const paths = candidatePaths(runDir, candidate.candidate_id);
  if (!Buffer.isBuffer(bytes) && !(bytes instanceof Uint8Array)) throw new Error("candidate bytes must be a Buffer or Uint8Array");
  const payload = Buffer.from(bytes);
  if (contractSha256(payload) !== candidate.sha256) throw new Error("candidate bytes SHA differs from candidate record");
  ensureRefinementDerivedRoots(runDir);
  if (existsSync(paths.bytes) && contractSha256(readFileSync(paths.bytes)) !== candidate.sha256) throw new Error("CONFLICT: candidate identity already has different bytes");
  atomicWrite(paths.bytes, payload);
  atomicWrite(paths.metadata, Buffer.from(`${JSON.stringify(candidate, null, 2)}\n`, "utf8"));
  return Object.freeze({ ...paths, sha256: candidate.sha256 });
}

export function readCandidate(runDir, candidateId) {
  const paths = candidatePaths(runDir, candidateId);
  const metadata = readJson(paths.metadata, "candidate metadata");
  if (!metadata) return null;
  if (metadata.schema !== REFINEMENT_CANDIDATE_SCHEMA) throw new Error("invalid candidate schema");
  if (!existsSync(paths.bytes) || contractSha256(readFileSync(paths.bytes)) !== metadata.sha256) throw new Error("candidate bytes are missing or SHA-mismatched");
  return Object.freeze({ metadata, bytes: readFileSync(paths.bytes), paths });
}

export function writeCandidateComparison(runDir, candidateId, html, metadata = {}) {
  const paths = candidatePaths(runDir, candidateId);
  ensureRefinementDerivedRoots(runDir);
  const bytes = Buffer.from(String(html), "utf8");
  atomicWrite(paths.comparison, bytes);
  atomicWrite(paths.comparison_metadata, Buffer.from(`${JSON.stringify({ ...metadata, candidate_id: candidateId, sha256: contractSha256(bytes) }, null, 2)}\n`, "utf8"));
  return Object.freeze({ path: paths.comparison, sha256: contractSha256(bytes) });
}

export function listCandidates(runDir) {
  const paths = refinementPaths(runDir);
  if (!existsSync(paths.candidates)) return [];
  return readdirSync(paths.candidates).filter((name) => name.endsWith(".json")).sort().map((name) => readJson(join(paths.candidates, name), "candidate metadata"));
}

export function listReviews(runDir) {
  const paths = refinementPaths(runDir);
  if (!existsSync(paths.comparisons)) return [];
  return readdirSync(paths.comparisons).filter((name) => name.endsWith(".json")).sort().map((name) => readJson(join(paths.comparisons, name), "review metadata")).filter((entry) => entry?.schema === REFINEMENT_REVIEW_SCHEMA || entry?.decision);
}

export function refinementReviewDigest(reviews) {
  return contractSha256((reviews || []).map((entry) => ({
    run_version: entry.run_version || null,
    candidate_id: entry.candidate_id,
    slide_id: entry.slide_id,
    slot: entry.slot || null,
    decision: entry.decision,
    candidate_sha256: entry.candidate_sha256,
    comparison_sha256: entry.comparison_sha256 || null,
    created_at: entry.created_at || null,
    reviewed_at: entry.reviewed_at || null,
  })).sort((a, b) => `${a.slide_id}:${a.candidate_id}`.localeCompare(`${b.slide_id}:${b.candidate_id}`)));
}

export function readVersionFileSha(path) {
  return sha256(existsSync(path) ? readFileSync(path) : Buffer.alloc(0));
}

export function assertPromotionFencesClear(runDir) {
  const paths = refinementPaths(runDir);
  const root = deckRoot(paths.run);
  if (existsSync(join(root, "_state", "gate-approval-journal.json"))) throw new Error("CONFLICT: gate approval journal fences refinement promotion");
  const state = readState(root, { purpose: "observe", heal: false, runVersion: paths.run_version });
  const reset = state?.nodes?.["html-production-reset"]?.by_version?.[`3_versions/${paths.run_version}`];
  if (reset?.status === "deletion_pending") throw new Error("CONFLICT: HTML production reset fences refinement promotion");
}

export function prepareRefinementProvenance(runDir, provenance) {
  const paths = refinementPaths(runDir);
  validateProvenance(paths, provenance);
  const document = new Document(provenance, { version: "1.2", schema: "core", indent: 2, lineWidth: 0, simpleKeys: true });
  const bytes = Buffer.from(document.toString({ indent: 2, lineWidth: 0, simpleKeys: true }), "utf8");
  return Object.freeze({ path: paths.provenance, value: structuredClone(provenance), bytes, old_sha256: readVersionFileSha(paths.provenance), next_sha256: sha256(bytes) });
}

export function writeRefinementProvenance(runDir, provenance, { expectedSha256 = null } = {}) {
  const prepared = prepareRefinementProvenance(runDir, provenance);
  const oldSha256 = prepared.old_sha256;
  if (expectedSha256 !== null && (!SHA_RE.test(expectedSha256) || oldSha256 !== expectedSha256)) throw new Error("CONFLICT: refinement provenance precondition changed");
  if (readVersionFileSha(prepared.path) !== oldSha256) throw new Error("CONFLICT: refinement provenance changed before commit");
  atomicWrite(prepared.path, prepared.bytes);
  return Object.freeze({ path: prepared.path, sha256: prepared.next_sha256 });
}

function validatePromotionJournal(record, paths) {
  const keys = ["schema", "transaction_id", "run_version", "kind", "candidate_id", "target_asset_id", "old", "next"];
  const actualKeys = Object.keys(record);
  if (!keys.every((key) => actualKeys.includes(key)) || actualKeys.some((key) => !keys.includes(key) && !["phase", "updated_at", "recovery"].includes(key))) throw new Error("invalid refinement promotion journal");
  if (record.schema !== REFINEMENT_PROMOTION_JOURNAL_SCHEMA || record.run_version !== paths.run_version || !["style-reference", "visual-slot"].includes(record.kind) || typeof record.transaction_id !== "string" || !record.transaction_id || typeof record.candidate_id !== "string" || !record.candidate_id || typeof record.target_asset_id !== "string" || !record.target_asset_id) throw new Error("invalid refinement promotion journal");
  if (record.phase != null && !["prepared", "asset-committed", "source-committed", "provenance-committed", "state-committed"].includes(record.phase)) throw new Error("invalid refinement promotion journal phase");
  for (const side of [record.old, record.next]) {
    if (!exactKeys(side, ["asset_manifest_sha256", "slide_specifications_sha256", "provenance_sha256", "state_sha256"])) throw new Error("invalid refinement promotion journal SHA binding");
    if (Object.values(side).some((value) => !SHA_RE.test(value))) throw new Error("invalid refinement promotion journal SHA binding");
  }
  if (record.recovery != null) {
    const recoveryKeys = ["schema", "registration", "selection", "provenance", "next_state", "state_updated_at"];
    if (!exactKeys(record.recovery, recoveryKeys) || record.recovery.schema !== "pptmaker-image2-refinement-recovery-v1") throw new Error("invalid refinement promotion recovery payload");
    const registration = record.recovery.registration;
    if (!exactKeys(registration, ["asset_id", "target", "bytes_base64", "metadata"]) || registration.asset_id !== record.target_asset_id || !["style-reference", "visual-slots"].includes(registration.target) || typeof registration.bytes_base64 !== "string" || !registration.bytes_base64) throw new Error("invalid refinement promotion recovery registration");
    if (!registration.metadata || typeof registration.metadata !== "object" || Array.isArray(registration.metadata) || !exactKeys(registration.metadata, ["label", "description", "usage_guidance"])) throw new Error("invalid refinement promotion recovery metadata");
    if (record.kind === "visual-slot") {
      if (!record.recovery.selection || typeof record.recovery.selection !== "object" || Array.isArray(record.recovery.selection)) throw new Error("visual-slot recovery requires a selection binding");
    } else if (record.recovery.selection !== null) throw new Error("style-reference recovery cannot contain a selection binding");
    if (!record.recovery.provenance || typeof record.recovery.provenance !== "object" || Array.isArray(record.recovery.provenance) || !record.recovery.next_state || typeof record.recovery.next_state !== "object" || Array.isArray(record.recovery.next_state) || typeof record.recovery.state_updated_at !== "string" || Number.isNaN(Date.parse(record.recovery.state_updated_at))) throw new Error("invalid refinement promotion recovery payload");
  }
  return record;
}

export function createPromotionJournal(runDir, record) {
  const paths = refinementPaths(runDir);
  validatePromotionJournal(record, paths);
  const state = readState(deckRoot(paths.run), { purpose: "execute", heal: false, runVersion: paths.run_version });
  if (state?.replacement_required || state?.corrupted) throw new Error("replacement_required: refinement state is unavailable");
  const current = {
    asset_manifest_sha256: readVersionFileSha(paths.asset_manifest),
    slide_specifications_sha256: readVersionFileSha(paths.slide_specifications),
    provenance_sha256: readVersionFileSha(paths.provenance),
    state_sha256: readVersionFileSha(paths.state),
  };
  for (const [key, value] of Object.entries(current)) if (value !== record.old[key]) throw new Error(`CONFLICT: refinement ${key} precondition changed`);
  if (existsSync(paths.journal)) throw new Error("CONFLICT: refinement promotion journal already exists");
  // Preserve the already-validated recovery payload's insertion order. YAML
  // serialization is order-sensitive, and its exact bytes are bound by the
  // journal's next SHAs for restart recovery.
  atomicWrite(paths.journal, Buffer.from(`${JSON.stringify(record)}\n`, "utf8"));
  return Object.freeze({ path: paths.journal, transaction_id: record.transaction_id });
}

export function readPromotionJournal(runDir) {
  const paths = refinementPaths(runDir);
  if (!existsSync(paths.journal)) return null;
  let value;
  try { value = JSON.parse(readFileSync(paths.journal, "utf8")); } catch { throw new Error("invalid refinement promotion journal"); }
  return Object.freeze(validatePromotionJournal(value, paths));
}

export function updatePromotionJournal(runDir, patch, { expectedPhase = null } = {}) {
  const paths = refinementPaths(runDir);
  const current = readPromotionJournal(runDir);
  if (!current) throw new Error("CONFLICT: refinement promotion journal is absent");
  if (expectedPhase !== null && (current.phase || "prepared") !== expectedPhase) throw new Error("CONFLICT: refinement promotion journal phase changed");
  const next = { ...current, ...patch };
  validatePromotionJournal(next, paths);
  if (readPromotionJournal(runDir)?.transaction_id !== current.transaction_id) throw new Error("CONFLICT: refinement promotion journal changed");
  atomicWrite(paths.journal, Buffer.from(`${JSON.stringify(next)}\n`, "utf8"));
  return Object.freeze(next);
}

function promotionSnapshot(paths) {
  return {
    asset_manifest_sha256: readVersionFileSha(paths.asset_manifest),
    slide_specifications_sha256: readVersionFileSha(paths.slide_specifications),
    provenance_sha256: readVersionFileSha(paths.provenance),
    state_sha256: readVersionFileSha(paths.state),
  };
}

export function recoverPromotionJournal(runDir, { complete = null } = {}) {
  const paths = refinementPaths(runDir);
  const journal = readPromotionJournal(runDir);
  if (!journal) return Object.freeze({ status: "absent" });
  const current = promotionSnapshot(paths);
  const matches = (bound) => Object.entries(bound).every(([key, value]) => current[key] === value);
  if (matches(journal.old)) {
    rmSync(paths.journal, { force: true });
    return Object.freeze({ status: "uncommitted", transaction_id: journal.transaction_id });
  }
  if (matches(journal.next)) {
    rmSync(paths.journal, { force: true });
    return Object.freeze({ status: "committed", transaction_id: journal.transaction_id });
  }
  const unchanged = journal.kind === "style-reference" ? ["slide_specifications_sha256"] : [];
  for (const key of unchanged) {
    if (journal.old[key] !== journal.next[key] || current[key] !== journal.old[key]) throw new Error("CONFLICT: refinement promotion changed an unowned source SHA");
  }
  const order = journal.kind === "style-reference"
    ? ["asset_manifest_sha256", "provenance_sha256", "state_sha256"]
    : ["asset_manifest_sha256", "slide_specifications_sha256", "provenance_sha256", "state_sha256"];
  const states = order.map((key) => current[key] === journal.old[key] ? "old" : current[key] === journal.next[key] ? "next" : "other");
  if (states.includes("other")) throw new Error("CONFLICT: refinement promotion journal does not match an exact bound transaction state");
  let prefix = 0;
  while (prefix < states.length && states[prefix] === "next") prefix += 1;
  if (states.some((state, index) => index < prefix ? state !== "next" : state !== "old")) {
    throw new Error("CONFLICT: refinement promotion journal has an ambiguous commit ordering");
  }
  if (typeof complete === "function") {
    const result = complete({ journal, phase: prefix, current: Object.freeze(current) });
    if (result?.status === "committed" || result === true) {
      const final = promotionSnapshot(paths);
      if (!matches(journal.next)) throw new Error("CONFLICT: recovery callback did not produce the bound next state");
      rmSync(paths.journal, { force: true });
      return Object.freeze({ status: "committed", transaction_id: journal.transaction_id, recovered_phase: prefix });
    }
  }
  return Object.freeze({ status: "intermediate", transaction_id: journal.transaction_id, phase: prefix, next_phase: prefix + 1 });
}

export function assertExactPromotionSnapshot(runDir, bound) {
  const current = promotionSnapshot(refinementPaths(runDir));
  if (!bound || Object.keys(current).some((key) => current[key] !== bound[key])) throw new Error("CONFLICT: refinement source/state SHA is not the journal-bound value");
  return true;
}

export function commitRefinementState(runDir, nextState, { expectedStateSha256, updatedAt } = {}) {
  const paths = refinementPaths(runDir);
  const journal = readPromotionJournal(runDir);
  if (!journal) throw new Error("CONFLICT: refinement promotion journal is required");
  if (journal.old.state_sha256 !== expectedStateSha256) throw new Error("CONFLICT: refinement journal/state precondition differs");
  writeState(deckRoot(paths.run), nextState, { expectedStateSha: expectedStateSha256, ...(updatedAt ? { updatedAt } : {}) });
  if (readVersionFileSha(paths.state) !== journal.next.state_sha256) throw new Error("CONFLICT: refinement state bytes differ from journal binding");
}

function candidateReviewOrdering(entries) {
  const bySlide = new Map();
  for (const entry of entries) {
    if (!entry?.slide_id) continue;
    const list = bySlide.get(entry.slide_id) || [];
    list.push(entry);
    bySlide.set(entry.slide_id, list);
  }
  for (const list of bySlide.values()) {
    list.sort((left, right) => {
      const a = Date.parse(left.created_at || left.reviewed_at || "");
      const b = Date.parse(right.created_at || right.reviewed_at || "");
      if (!Number.isFinite(a) || !Number.isFinite(b) || a === b && String(left.candidate_id) === String(right.candidate_id)) throw new Error("CONFLICT: refinement review ordering is ambiguous");
      if (a === b) throw new Error("CONFLICT: refinement review ordering has duplicate timestamps");
      return b - a || String(right.candidate_id).localeCompare(String(left.candidate_id));
    });
  }
  return bySlide;
}

/**
 * Remove only derived refinement evidence.  The caller must bind cleanup to a
 * deterministic digest of the review set; this prevents a broad "delete old
 * files" operation from deciding which candidate is authoritative.
 */
export function cleanupRefinement(runDir, { expectedReviewSha256 = null, reviewSha256 = null, retainPerSlide = 1, dryRun = false } = {}) {
  const paths = refinementPaths(runDir);
  if (!Number.isSafeInteger(retainPerSlide) || retainPerSlide !== 1) throw new Error("cleanup retains exactly one rejected candidate per slide");
  const candidates = listCandidates(runDir);
  const reviews = listReviews(runDir);
  const reviewDigest = refinementReviewDigest(reviews);
  const bound = expectedReviewSha256 ?? reviewSha256;
  if (bound !== null && bound !== reviewDigest) throw new Error("CONFLICT: cleanup review hash is stale");
  if (bound === null && candidates.length > 0) throw new Error("cleanup requires an exact review hash");
  const reviewByCandidate = new Map();
  for (const review of reviews) {
    if (!review?.candidate_id || !["accept", "use-html", "pending"].includes(review.decision)) throw new Error("CONFLICT: cleanup encountered an invalid review decision");
    if (reviewByCandidate.has(review.candidate_id)) throw new Error(`CONFLICT: cleanup has duplicate review records for ${review.candidate_id}`);
    reviewByCandidate.set(review.candidate_id, review);
  }
  const rejected = [];
  const accepted = new Set();
  for (const candidate of candidates) {
    // Validate the immutable bytes before deciding whether any derived files
    // may be removed. A missing/mismatched candidate fails closed.
    const verified = readCandidate(runDir, candidate.candidate_id);
    if (!verified || verified.metadata.sha256 !== candidate.sha256) throw new Error(`CONFLICT: candidate ${candidate.candidate_id} is missing or SHA-mismatched`);
    const review = reviewByCandidate.get(candidate.candidate_id);
    if (!review || review.decision === "pending") throw new Error(`CONFLICT: cleanup requires a terminal review for ${candidate.candidate_id}`);
    if (review.slide_id !== candidate.slide_id || review.candidate_sha256 !== candidate.sha256) throw new Error(`CONFLICT: review binding for ${candidate.candidate_id} is stale`);
    if (review.decision === "accept") accepted.add(candidate.candidate_id);
    else rejected.push({ ...candidate, reviewed_at: review.reviewed_at, created_at: candidate.created_at || review.created_at });
  }
  const groups = candidateReviewOrdering(rejected);
  const keep = new Set();
  for (const list of groups.values()) for (const entry of list.slice(0, retainPerSlide)) keep.add(entry.candidate_id);
  const removed = [];
  for (const entry of rejected) {
    if (keep.has(entry.candidate_id)) continue;
    const candidate = candidatePaths(runDir, entry.candidate_id);
    for (const file of [candidate.bytes, candidate.metadata, candidate.comparison, candidate.comparison_metadata]) {
      if (existsSync(file)) { removed.push(file); if (!dryRun) rmSync(file, { force: true }); }
    }
  }
  return Object.freeze({ review_sha256: reviewDigest, retained_candidate_ids: [...keep].sort(), removed_paths: removed.sort(), dry_run: dryRun });
}

export const cleanupRefinementEvidence = cleanupRefinement;
