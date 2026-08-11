import {
  closeSync,
  existsSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmdirSync,
  rmSync,
  writeSync,
} from "node:fs";
import { randomUUID } from "node:crypto";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

import { canonicalJson, canonicalJsonSha256 } from "../identity/canonical_json.mjs";
import { sha256Bytes } from "../identity/byte_hash.mjs";
import {
  PAGE_PRODUCTION_STAGING_SUBDIR,
  pageImageProgressiveRawPaths,
} from "../run-bundle/page_image_paths.mjs";
import {
  ProgressiveRawSchemaError,
  validateProgressiveAcceptedRawEvidence,
  validateProgressiveRawBatch,
  validateProgressiveRawBatchGrant,
  validateProgressiveRawCompleteReview,
  validateProgressiveRawItemAttempt,
  validateProgressiveRawMaterializationProvenance,
  validateProgressiveRawPilotDecision,
  validateProgressiveRawPilotEvidence,
  validateProgressiveRawScopeHead,
  validateProgressiveRawWorkPlan,
} from "./page_image_progressive_schema.mjs";
import {
  CONTENT_ADDRESS_SHORT_NAME_RE,
  nameMatchesAddress,
  resolveContentAddressName,
  shortName,
} from "./content_address_store.mjs";

const SHA256_RE = /^[0-9a-f]{64}$/;
const STAGING_NAME_RE = /^(?:plan|record|materialization)-[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const WORKFLOWS = new Set(["framed", "pure"]);

export class ProgressiveRawStoreError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ProgressiveRawStoreError";
    this.code = code;
  }
}

function fail(code, message) {
  throw new ProgressiveRawStoreError(code, message);
}

function assertDigest(value, label) {
  if (!SHA256_RE.test(value || "")) fail("progressive_raw_store_invalid", `${label} must be a lowercase SHA-256`);
}

function assertWorkflow(value) {
  if (!WORKFLOWS.has(value)) fail("progressive_raw_store_invalid", "workflow must be framed | pure");
}

function assertInside(root, candidate, label, { allowEqual = false } = {}) {
  const rootPath = resolve(root);
  const candidatePath = resolve(candidate);
  const rel = relative(rootPath, candidatePath);
  if ((!allowEqual && !rel) || rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    fail("progressive_raw_store_escape", `${label} must remain below its canonical owner root`);
  }
  return candidatePath;
}

function isInside(root, candidate, { allowEqual = false } = {}) {
  const rel = relative(resolve(root), resolve(candidate));
  return (allowEqual && rel === "") || (rel !== "" && rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
}

function assertPhysicalInside(root, candidate, label, { allowEqual = false } = {}) {
  let physicalRoot;
  let physicalCandidate;
  try {
    physicalRoot = realpathSync(root);
    physicalCandidate = realpathSync(candidate);
  } catch {
    fail("progressive_raw_store_escape", `${label} could not be physically confined to its canonical owner root`);
  }
  if (!isInside(physicalRoot, physicalCandidate, { allowEqual })) {
    fail("progressive_raw_store_escape", `${label} must remain physically below its canonical owner root`);
  }
}

function ensureRealDirectoryBelowDeck(deckRoot, target, label) {
  const root = resolve(deckRoot);
  const destination = resolve(target);
  if (!isInside(root, destination, { allowEqual: true })) fail("progressive_raw_store_escape", `${label} must remain below the deck root`);
  let rootStats;
  try {
    rootStats = lstatSync(root);
  } catch {
    fail("progressive_raw_store_escape", "progressive raw deck root is unavailable");
  }
  if (!rootStats.isDirectory() || rootStats.isSymbolicLink()) fail("progressive_raw_store_escape", "progressive raw deck root must be a real directory");
  let current = root;
  for (const segment of relative(root, destination).split(sep).filter(Boolean)) {
    current = join(current, segment);
    let stats;
    try {
      stats = lstatSync(current);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      mkdirSync(current, { mode: 0o700 });
      stats = lstatSync(current);
    }
    if (!stats.isDirectory() || stats.isSymbolicLink()) fail("progressive_raw_store_escape", `${label} must use real directories only`);
  }
  assertPhysicalInside(root, destination, label, { allowEqual: true });
  return destination;
}

function realDirectory(pathname, label) {
  let stats;
  try {
    stats = lstatSync(pathname);
  } catch {
    fail("progressive_raw_store_unavailable", `${label} is unavailable`);
  }
  if (!stats.isDirectory() || stats.isSymbolicLink()) fail("progressive_raw_store_escape", `${label} must be a real directory`);
  return pathname;
}

function directStagingPath(paths, stagingPath, label) {
  const stagingRoot = resolve(paths.staging_root);
  const staging = assertInside(stagingRoot, stagingPath, label);
  if (dirname(staging) !== stagingRoot || !STAGING_NAME_RE.test(basename(staging))) {
    fail("progressive_raw_store_escape", "only direct plan|record|materialization-<unique> staging directories may be used");
  }
  return staging;
}

function canonicalBytes(record) {
  return Buffer.from(`${canonicalJson(record)}\n`, "utf8");
}

function canonicalRecordAddress(pathname) {
  try {
    const bytes = readFileSync(pathname);
    const record = JSON.parse(bytes.toString("utf8"));
    return bytes.equals(canonicalBytes(record)) ? canonicalJsonSha256(record) : null;
  } catch {
    return null;
  }
}

function parseCanonicalRecord(bytes, label) {
  let parsed;
  try {
    parsed = JSON.parse(Buffer.from(bytes).toString("utf8"));
  } catch {
    fail("progressive_raw_store_record_invalid", `${label} is not valid JSON`);
  }
  if (!Buffer.from(bytes).equals(canonicalBytes(parsed))) {
    fail("progressive_raw_store_record_invalid", `${label} is not canonical JSON bytes`);
  }
  return parsed;
}

function readBytesOrNull(pathname) {
  try {
    return readFileSync(pathname);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function equalBytes(left, right) {
  return left !== null && right !== null && Buffer.from(left).equals(Buffer.from(right));
}

function writeBytesAtomic(pathname, bytes) {
  const target = resolve(pathname);
  mkdirSync(dirname(target), { recursive: true, mode: 0o700 });
  const temporary = join(dirname(target), `.${basename(target)}.tmp-${randomUUID()}`);
  let descriptor = null;
  try {
    descriptor = openSync(temporary, "wx", 0o600);
    writeSync(descriptor, bytes);
    closeSync(descriptor);
    descriptor = null;
    renameSync(temporary, target);
  } catch (error) {
    if (descriptor !== null) {
      try { closeSync(descriptor); } catch { /* best effort cleanup */ }
    }
    try { rmSync(temporary, { force: true }); } catch { /* best effort cleanup */ }
    throw error;
  }
}

function withExclusiveDirectoryLock(lockPath, action) {
  mkdirSync(dirname(lockPath), { recursive: true, mode: 0o700 });
  try {
    mkdirSync(lockPath, { mode: 0o700 });
  } catch (error) {
    if (error?.code === "EEXIST") fail("progressive_raw_store_locked", "another progressive raw-owner mutation is in progress for this exact scope");
    throw error;
  }
  try {
    return action();
  } finally {
    try { rmdirSync(lockPath); } catch { /* Never remove an unproven lock. */ }
  }
}

async function withExclusiveDirectoryLockAsync(lockPath, action) {
  mkdirSync(dirname(lockPath), { recursive: true, mode: 0o700 });
  try {
    mkdirSync(lockPath, { mode: 0o700 });
  } catch (error) {
    if (error?.code === "EEXIST") fail("progressive_raw_store_locked", "another progressive raw-owner mutation is in progress for this exact plan");
    throw error;
  }
  try {
    return await action();
  } finally {
    try { rmdirSync(lockPath); } catch { /* Never remove an unproven lock. */ }
  }
}

function assertChecked(validation, label) {
  if (!validation?.ok) throw new ProgressiveRawSchemaError(validation?.code || "progressive_raw_record_invalid", validation?.message || `${label} is invalid`);
  return validation;
}

function readCanonicalValidatedRecord(pathname, validator, options, label = basename(pathname)) {
  const bytes = readFileSync(pathname);
  const record = parseCanonicalRecord(bytes, label);
  const checked = assertChecked(validator(record, options), label);
  return Object.freeze({ record: Object.freeze(record), bytes: Buffer.from(bytes), sha256: checked.sha256 });
}

function writeStagedImmutableRecord(runDir, {
  plan_sha256,
  target,
  record,
  validator,
  options,
} = {}) {
  assertDigest(plan_sha256, "plan_sha256");
  if (typeof validator !== "function") fail("progressive_raw_store_invalid", "immutable record writer requires a validator");
  const desired = canonicalBytes(record);
  const checked = assertChecked(validator(record, options), "record");
  const paths = progressiveRawStorePaths(runDir, { plan_sha256 });
  const targetPath = assertInside(paths.plan_root, target, "immutable direct record");
  ensureRealDirectoryBelowDeck(paths.deck_root, dirname(targetPath), "immutable direct record parent");
  return withExclusiveDirectoryLock(join(dirname(targetPath), `.${basename(targetPath)}.lock`), () => {
    const existing = readBytesOrNull(targetPath);
    if (existing !== null) {
      const read = readCanonicalValidatedRecord(targetPath, validator, options);
      if (!equalBytes(existing, desired)) {
        fail("progressive_raw_store_conflict", "existing immutable progressive raw record differs from the requested canonical record");
      }
      return Object.freeze({ created: false, replay: true, bytes: read.bytes, record: read.record, sha256: read.sha256, path: targetPath });
    }
    const staging = createProgressiveRawStagingDirectory(runDir, { kind: "record" });
    try {
      const staged = join(staging, "record.json");
      writeBytesAtomic(staged, desired);
      const stagedRead = readCanonicalValidatedRecord(staged, validator, options, "staged progressive raw record");
      if (!equalBytes(stagedRead.bytes, desired)) fail("progressive_raw_store_record_invalid", "staged immutable record changed before publication");
      renameSync(staged, targetPath);
      rmdirSync(staging);
    } catch (error) {
      if (existsSync(staging)) cleanupProgressiveRawStagingDirectory(runDir, staging);
      if (error?.code === "EEXIST" || existsSync(targetPath)) {
        const replay = readCanonicalValidatedRecord(targetPath, validator, options);
        if (!equalBytes(replay.bytes, desired)) throw error;
        return Object.freeze({ created: false, replay: true, bytes: replay.bytes, record: replay.record, sha256: replay.sha256, path: targetPath });
      }
      throw error;
    }
    return Object.freeze({ created: true, replay: false, bytes: desired, record: Object.freeze(structuredClone(record)), sha256: checked.sha256, path: targetPath });
  });
}

function recordTarget(paths, group, sha256) {
  assertDigest(sha256, `${group}_sha256`);
  const root = join(paths.plan_root, group);
  return join(root, resolveContentAddressName(root, sha256, {
    suffix: ".json",
    recordHashReader: canonicalRecordAddress,
  }));
}

export function progressiveRawStorePaths(runDir, { workflow = null, plan_sha256 = null, batch_sha256 = null, attempt_sha256 = null, provenance_sha256 = null } = {}) {
  if (workflow !== null) assertWorkflow(workflow);
  for (const [label, value] of [["plan_sha256", plan_sha256], ["batch_sha256", batch_sha256], ["attempt_sha256", attempt_sha256], ["provenance_sha256", provenance_sha256]]) {
    if (value !== null) assertDigest(value, label);
  }
  const root = pageImageProgressiveRawPaths(runDir);
  const scopeRoot = workflow === null ? null : join(root.scopes_root, root.run_version, workflow);
  const planRoot = plan_sha256 === null ? null : join(root.plans_root, resolveContentAddressName(root.plans_root, plan_sha256, {
    recordHashReader: (pathname) => canonicalRecordAddress(join(pathname, "work-plan.json")),
  }));
  const batchRoot = planRoot === null || batch_sha256 === null ? null : join(planRoot, "batches", resolveContentAddressName(join(planRoot, "batches"), batch_sha256, {
    recordHashReader: (pathname) => canonicalRecordAddress(join(pathname, "batch.json")),
  }));
  const materializationRoot = planRoot === null || provenance_sha256 === null ? null : join(planRoot, "materializations", resolveContentAddressName(join(planRoot, "materializations"), provenance_sha256, {
    recordHashReader: (pathname) => canonicalRecordAddress(join(pathname, "provenance.json")),
  }));
  return Object.freeze({
    ...root,
    scope_root: scopeRoot,
    scope_head: scopeRoot === null ? null : join(scopeRoot, "head.json"),
    scope_lock: scopeRoot === null ? null : join(scopeRoot, ".head.lock"),
    plan_root: planRoot,
    plan_lock: planRoot === null ? null : join(planRoot, ".owner.lock"),
    work_plan: planRoot === null ? null : join(planRoot, "work-plan.json"),
    batches_root: planRoot === null ? null : join(planRoot, "batches"),
    batch_root: batchRoot,
    batch: batchRoot === null ? null : join(batchRoot, "batch.json"),
    grant: batchRoot === null ? null : join(batchRoot, "grant.json"),
    attempts_root: planRoot === null ? null : join(planRoot, "attempts"),
    attempt: planRoot === null || attempt_sha256 === null ? null : join(planRoot, "attempts", resolveContentAddressName(join(planRoot, "attempts"), attempt_sha256, {
      suffix: ".json",
      recordHashReader: canonicalRecordAddress,
    })),
    materializations_root: planRoot === null ? null : join(planRoot, "materializations"),
    materialization_root: materializationRoot,
    materialization_provenance: materializationRoot === null ? null : join(materializationRoot, "provenance.json"),
    materialization_bytes: materializationRoot === null ? null : join(materializationRoot, "raw.png"),
    pilot_evidence_root: planRoot === null ? null : join(planRoot, "pilot-evidence"),
    pilot_decisions_root: planRoot === null ? null : join(planRoot, "pilot-decisions"),
    complete_reviews_root: planRoot === null ? null : join(planRoot, "complete-reviews"),
    accepted_evidence_root: planRoot === null ? null : join(planRoot, "accepted-evidence"),
  });
}

/** Allocate a direct confined staging directory for one owner mutation. */
export function createProgressiveRawStagingDirectory(runDir, { kind = "record", unique = randomUUID() } = {}) {
  if (!["plan", "record", "materialization"].includes(kind)) fail("progressive_raw_store_invalid", "staging kind is invalid");
  if (typeof unique !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(unique)) {
    fail("progressive_raw_store_invalid", "staging unique suffix is invalid");
  }
  const paths = progressiveRawStorePaths(runDir);
  ensureRealDirectoryBelowDeck(paths.deck_root, paths.staging_root, "progressive raw staging root");
  const staging = directStagingPath(paths, join(paths.staging_root, `${kind}-${unique}`), "progressive raw staging directory");
  try {
    mkdirSync(staging, { mode: 0o700 });
  } catch (error) {
    if (error?.code === "EEXIST") fail("progressive_raw_store_conflict", "progressive raw staging directory already exists");
    throw error;
  }
  assertPhysicalInside(paths.staging_root, staging, "progressive raw staging directory");
  return staging;
}

/** Remove only a proven direct incomplete staging directory during an owner mutation. */
export function cleanupProgressiveRawStagingDirectory(runDir, stagingPath) {
  const paths = progressiveRawStorePaths(runDir);
  const staging = directStagingPath(paths, stagingPath, "progressive raw staging directory");
  if (!existsSync(staging)) return false;
  realDirectory(staging, "progressive raw staging directory");
  assertPhysicalInside(paths.staging_root, staging, "progressive raw staging directory");
  rmSync(staging, { recursive: true, force: false });
  return true;
}

/** Stage a validated immutable full plan before its initial container publication. */
export function stageProgressiveRawPlanContainer(runDir, { plan, unique = randomUUID() } = {}) {
  const checked = assertChecked(validateProgressiveRawWorkPlan(plan), "raw work plan");
  const staging = createProgressiveRawStagingDirectory(runDir, { kind: "plan", unique });
  try {
    writeBytesAtomic(join(staging, "work-plan.json"), canonicalBytes(plan));
    const staged = readCanonicalValidatedRecord(join(staging, "work-plan.json"), validateProgressiveRawWorkPlan, undefined, "staged raw work plan");
    if (staged.sha256 !== checked.sha256) fail("progressive_raw_store_record_invalid", "staged raw work plan digest drifted");
    return Object.freeze({ staging_path: staging, plan_sha256: checked.sha256, bytes: staged.bytes });
  } catch (error) {
    cleanupProgressiveRawStagingDirectory(runDir, staging);
    throw error;
  }
}

/** Publish one validated staged plan container atomically, or exact-replay it. */
export function publishProgressiveRawStagedPlan(runDir, { staging_path, plan_sha256 } = {}) {
  assertDigest(plan_sha256, "plan_sha256");
  const paths = progressiveRawStorePaths(runDir, { plan_sha256 });
  const staging = directStagingPath(paths, staging_path, "progressive raw staging directory");
  realDirectory(staging, "progressive raw staging directory");
  const staged = readCanonicalValidatedRecord(join(staging, "work-plan.json"), validateProgressiveRawWorkPlan, undefined, "staged raw work plan");
  if (staged.sha256 !== plan_sha256) fail("progressive_raw_store_record_invalid", "staged plan digest does not match the publication path");
  ensureRealDirectoryBelowDeck(paths.deck_root, paths.plans_root, "progressive raw plans root");
  return withExclusiveDirectoryLock(join(paths.plans_root, `.${shortName(plan_sha256)}.lock`), () => {
    if (existsSync(paths.plan_root)) {
      const existing = readProgressiveRawWorkPlan(runDir, { plan_sha256 });
      if (existing.sha256 !== plan_sha256 || !equalBytes(existing.bytes, staged.bytes)) {
        fail("progressive_raw_store_conflict", "existing immutable raw plan differs from the staged plan");
      }
      cleanupProgressiveRawStagingDirectory(runDir, staging);
      return Object.freeze({ published: false, replay: true, plan_root: paths.plan_root, plan: existing.record });
    }
    try {
      renameSync(staging, paths.plan_root);
    } catch (error) {
      if (!existsSync(paths.plan_root)) throw error;
      const existing = readProgressiveRawWorkPlan(runDir, { plan_sha256 });
      if (existing.sha256 !== plan_sha256 || !equalBytes(existing.bytes, staged.bytes)) throw error;
      if (existsSync(staging)) cleanupProgressiveRawStagingDirectory(runDir, staging);
      return Object.freeze({ published: false, replay: true, plan_root: paths.plan_root, plan: existing.record });
    }
    return Object.freeze({ published: true, replay: false, plan_root: paths.plan_root, plan: staged.record });
  });
}

export function readProgressiveRawWorkPlan(runDir, { plan_sha256 } = {}) {
  const paths = progressiveRawStorePaths(runDir, { plan_sha256 });
  return readCanonicalValidatedRecord(paths.work_plan, validateProgressiveRawWorkPlan, undefined, "progressive raw work plan");
}

export function readProgressiveRawScopeHead(runDir, { workflow, plan = null } = {}) {
  const paths = progressiveRawStorePaths(runDir, { workflow });
  const bytes = readBytesOrNull(paths.scope_head);
  if (bytes === null) return null;
  assertPhysicalInside(paths.deck_root, paths.scope_root, "progressive raw scope root");
  return readCanonicalValidatedRecord(paths.scope_head, validateProgressiveRawScopeHead, { plan }, "progressive raw scope head");
}

/** CAS the one mutable scope head. Callers supply direct-record preflight. */
export function writeProgressiveRawScopeHeadCas(runDir, { workflow, head, plan, expected_bytes, validate_advance = null } = {}) {
  if (expected_bytes === undefined) fail("progressive_raw_store_invalid", "scope-head CAS requires expected_bytes (null for an absent head)");
  const checked = assertChecked(validateProgressiveRawScopeHead(head, { plan }), "scope head");
  const paths = progressiveRawStorePaths(runDir, { workflow });
  if (head.workflow !== workflow) fail("progressive_raw_store_invalid", "scope-head workflow must match its canonical path");
  const expected = expected_bytes === null ? null : Buffer.from(expected_bytes);
  const desired = canonicalBytes(head);
  ensureRealDirectoryBelowDeck(paths.deck_root, paths.scope_root, "progressive raw scope root");
  return withExclusiveDirectoryLock(paths.scope_lock, () => {
    const actual = readBytesOrNull(paths.scope_head);
    if ((expected === null && actual !== null) || (expected !== null && !equalBytes(expected, actual))) {
      fail("progressive_raw_head_conflict", "progressive raw scope head changed before compare-and-swap");
    }
    if (typeof validate_advance === "function") validate_advance(actual === null ? null : Buffer.from(actual));
    writeBytesAtomic(paths.scope_head, desired);
    return Object.freeze({ bytes: desired, previous_bytes: actual === null ? null : Buffer.from(actual), head_sha256: checked.sha256 });
  });
}

/** Serialize mutable lifecycle transitions for one immutable plan container. */
export async function withProgressiveRawPlanLock(runDir, { plan_sha256, action } = {}) {
  if (typeof action !== "function") fail("progressive_raw_store_invalid", "plan lock requires an action");
  const paths = progressiveRawStorePaths(runDir, { plan_sha256 });
  realDirectory(paths.plan_root, "progressive raw plan container");
  return withExclusiveDirectoryLockAsync(paths.plan_lock, async () => {
    return action();
  });
}

export function writeProgressiveRawBatch(runDir, { plan, batch } = {}) {
  const planCheck = assertChecked(validateProgressiveRawWorkPlan(plan), "raw work plan");
  const batchCheck = assertChecked(validateProgressiveRawBatch(batch, { plan }), "raw batch");
  const paths = progressiveRawStorePaths(runDir, { plan_sha256: planCheck.sha256, batch_sha256: batchCheck.sha256 });
  return writeStagedImmutableRecord(runDir, {
    plan_sha256: planCheck.sha256,
    target: paths.batch,
    record: batch,
    validator: validateProgressiveRawBatch,
    options: { plan },
  });
}

export function writeProgressiveRawBatchGrant(runDir, { plan, batch, grant } = {}) {
  const planCheck = assertChecked(validateProgressiveRawWorkPlan(plan), "raw work plan");
  const batchCheck = assertChecked(validateProgressiveRawBatch(batch, { plan }), "raw batch");
  const grantCheck = assertChecked(validateProgressiveRawBatchGrant(grant, { plan, batch }), "raw batch grant");
  const paths = progressiveRawStorePaths(runDir, { plan_sha256: planCheck.sha256, batch_sha256: batchCheck.sha256 });
  return writeStagedImmutableRecord(runDir, {
    plan_sha256: planCheck.sha256,
    target: paths.grant,
    record: grant,
    validator: validateProgressiveRawBatchGrant,
    options: { plan, batch },
  });
}

export function writeProgressiveRawItemAttempt(runDir, { plan, batch, grant, attempt } = {}) {
  const planCheck = assertChecked(validateProgressiveRawWorkPlan(plan), "raw work plan");
  const attemptCheck = assertChecked(validateProgressiveRawItemAttempt(attempt, { plan, batch, grant }), "raw item attempt");
  const paths = progressiveRawStorePaths(runDir, { plan_sha256: planCheck.sha256, attempt_sha256: attemptCheck.sha256 });
  return writeStagedImmutableRecord(runDir, {
    plan_sha256: planCheck.sha256,
    target: paths.attempt,
    record: attempt,
    validator: validateProgressiveRawItemAttempt,
    options: { plan, batch, grant },
  });
}

export function writeProgressiveRawPilotEvidence(runDir, { plan, batch, evidence } = {}) {
  const planCheck = assertChecked(validateProgressiveRawWorkPlan(plan), "raw work plan");
  const evidenceCheck = assertChecked(validateProgressiveRawPilotEvidence(evidence, { plan, batch }), "Pilot evidence");
  const paths = progressiveRawStorePaths(runDir, { plan_sha256: planCheck.sha256 });
  return writeStagedImmutableRecord(runDir, {
    plan_sha256: planCheck.sha256,
    target: recordTarget(paths, "pilot-evidence", evidenceCheck.sha256),
    record: evidence,
    validator: validateProgressiveRawPilotEvidence,
    options: { plan, batch },
  });
}

export function writeProgressiveRawPilotDecision(runDir, { plan, batch, evidence, decision } = {}) {
  const planCheck = assertChecked(validateProgressiveRawWorkPlan(plan), "raw work plan");
  const decisionCheck = assertChecked(validateProgressiveRawPilotDecision(decision, { plan, batch, evidence }), "Pilot decision");
  const paths = progressiveRawStorePaths(runDir, { plan_sha256: planCheck.sha256 });
  return writeStagedImmutableRecord(runDir, {
    plan_sha256: planCheck.sha256,
    target: recordTarget(paths, "pilot-decisions", decisionCheck.sha256),
    record: decision,
    validator: validateProgressiveRawPilotDecision,
    options: { plan, batch, evidence },
  });
}

export function writeProgressiveRawCompleteReview(runDir, { plan, review } = {}) {
  const planCheck = assertChecked(validateProgressiveRawWorkPlan(plan), "raw work plan");
  const reviewCheck = assertChecked(validateProgressiveRawCompleteReview(review, { plan }), "complete raw review");
  const paths = progressiveRawStorePaths(runDir, { plan_sha256: planCheck.sha256 });
  return writeStagedImmutableRecord(runDir, {
    plan_sha256: planCheck.sha256,
    target: recordTarget(paths, "complete-reviews", reviewCheck.sha256),
    record: review,
    validator: validateProgressiveRawCompleteReview,
    options: { plan },
  });
}

export function writeProgressiveAcceptedRawEvidence(runDir, { plan, completeReview, evidence } = {}) {
  const planCheck = assertChecked(validateProgressiveRawWorkPlan(plan), "raw work plan");
  const evidenceCheck = assertChecked(validateProgressiveAcceptedRawEvidence(evidence, { plan, completeReview }), "accepted raw evidence");
  const paths = progressiveRawStorePaths(runDir, { plan_sha256: planCheck.sha256 });
  return writeStagedImmutableRecord(runDir, {
    plan_sha256: planCheck.sha256,
    target: recordTarget(paths, "accepted-evidence", evidenceCheck.sha256),
    record: evidence,
    validator: validateProgressiveAcceptedRawEvidence,
    options: { plan, completeReview },
  });
}

/** Publish bytes and provenance as one immutable bundle before terminal attempt visibility. */
export function publishProgressiveRawMaterialization(runDir, { plan, provenance, bytes } = {}) {
  const planCheck = assertChecked(validateProgressiveRawWorkPlan(plan), "raw work plan");
  const provenanceCheck = assertChecked(validateProgressiveRawMaterializationProvenance(provenance, { plan }), "materialization provenance");
  if (!Buffer.isBuffer(bytes) && !(bytes instanceof Uint8Array)) fail("progressive_raw_store_invalid", "materialization bytes must be a Buffer or Uint8Array");
  const payload = Buffer.from(bytes);
  if (!payload.length) fail("progressive_raw_store_invalid", "materialization bytes must not be empty");
  if (sha256Bytes(payload) !== provenance.raw_sha256) {
    fail("progressive_raw_store_invalid", "materialization bytes do not match provenance raw_sha256");
  }
  const paths = progressiveRawStorePaths(runDir, { plan_sha256: planCheck.sha256, provenance_sha256: provenanceCheck.sha256 });
  const staging = createProgressiveRawStagingDirectory(runDir, { kind: "materialization" });
  try {
    writeBytesAtomic(join(staging, "provenance.json"), canonicalBytes(provenance));
    writeBytesAtomic(join(staging, "raw.png"), payload);
    const staged = readCanonicalValidatedRecord(join(staging, "provenance.json"), validateProgressiveRawMaterializationProvenance, { plan }, "staged materialization provenance");
    if (staged.sha256 !== provenanceCheck.sha256) fail("progressive_raw_store_record_invalid", "staged materialization provenance digest drifted");
    ensureRealDirectoryBelowDeck(paths.deck_root, paths.materializations_root, "progressive raw materializations root");
    return withExclusiveDirectoryLock(join(paths.materializations_root, `.${shortName(provenanceCheck.sha256)}.lock`), () => {
      if (existsSync(paths.materialization_root)) {
        const existing = readProgressiveRawMaterialization(runDir, { plan_sha256: planCheck.sha256, provenance_sha256: provenanceCheck.sha256, plan });
        if (!equalBytes(existing.provenance.bytes, staged.bytes) || !equalBytes(existing.bytes, payload)) {
          fail("progressive_raw_store_conflict", "existing materialization bundle differs from the requested immutable bundle");
        }
        cleanupProgressiveRawStagingDirectory(runDir, staging);
        return Object.freeze({ created: false, replay: true, provenance: existing.provenance, bytes: existing.bytes, root: paths.materialization_root });
      }
      renameSync(staging, paths.materialization_root);
      return Object.freeze({ created: true, replay: false, provenance: Object.freeze(structuredClone(provenance)), bytes: payload, root: paths.materialization_root });
    });
  } catch (error) {
    if (existsSync(staging)) cleanupProgressiveRawStagingDirectory(runDir, staging);
    throw error;
  }
}

export function readProgressiveRawMaterialization(runDir, { plan_sha256, provenance_sha256, plan = null } = {}) {
  const paths = progressiveRawStorePaths(runDir, { plan_sha256, provenance_sha256 });
  realDirectory(paths.materialization_root, "progressive raw materialization bundle");
  const provenance = readCanonicalValidatedRecord(paths.materialization_provenance, validateProgressiveRawMaterializationProvenance, { plan }, "progressive raw materialization provenance");
  if (provenance.sha256 !== provenance_sha256) fail("progressive_raw_store_record_invalid", "materialization provenance does not match its canonical directory");
  const bytes = readFileSync(paths.materialization_bytes);
  if (!bytes.length) fail("progressive_raw_store_record_invalid", "materialization bytes are empty");
  if (sha256Bytes(bytes) !== provenance.record.raw_sha256) {
    fail("progressive_raw_store_record_invalid", "materialization bytes do not match immutable provenance");
  }
  return Object.freeze({ provenance, bytes: Buffer.from(bytes), root: paths.materialization_root });
}

function listRecordFiles(root, label) {
  if (!existsSync(root)) return [];
  realDirectory(root, label);
  const paths = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isFile() || entry.isSymbolicLink() || !/^[0-9a-f]{8}\.json$/.test(entry.name)) {
      fail("progressive_raw_store_record_invalid", `${label} contains a noncanonical immutable record`);
    }
    paths.push(join(root, entry.name));
  }
  return paths;
}

function listBatchDirectories(root) {
  if (!existsSync(root)) return [];
  realDirectory(root, "progressive raw batches root");
  const paths = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.isSymbolicLink() ||
      !CONTENT_ADDRESS_SHORT_NAME_RE.test(entry.name)) {
      fail("progressive_raw_store_record_invalid", "batches root contains a noncanonical immutable batch container");
    }
    paths.push(join(root, entry.name));
  }
  return paths;
}

/** Read all direct records beneath one immutable plan without selecting by file order. */
export function readProgressiveRawPlanDirectRecords(runDir, { plan_sha256 } = {}) {
  const plan = readProgressiveRawWorkPlan(runDir, { plan_sha256 });
  const paths = progressiveRawStorePaths(runDir, { plan_sha256 });
  realDirectory(paths.plan_root, "progressive raw plan container");
  const batches = [];
  const grants = [];
  for (const batchRoot of listBatchDirectories(paths.batches_root)) {
    const batch = readCanonicalValidatedRecord(join(batchRoot, "batch.json"), validateProgressiveRawBatch, { plan: plan.record }, "progressive raw batch");
    if (!nameMatchesAddress(basename(batchRoot), batch.sha256)) fail("progressive_raw_store_record_invalid", "batch directory does not match its canonical record digest");
    batches.push(batch);
    const grantPath = join(batchRoot, "grant.json");
    if (existsSync(grantPath)) grants.push(readCanonicalValidatedRecord(grantPath, validateProgressiveRawBatchGrant, { plan: plan.record, batch: batch.record }, "progressive raw batch grant"));
  }
  const attempts = listRecordFiles(paths.attempts_root, "progressive raw attempts root").map((pathname) => {
    const record = readCanonicalValidatedRecord(pathname, validateProgressiveRawItemAttempt, { plan: plan.record }, "progressive raw item attempt");
    const fileName = basename(pathname);
    if (fileName !== `${shortName(record.sha256)}.json`) {
      fail("progressive_raw_store_record_invalid", "attempt file does not match its canonical record digest");
    }
    return record;
  });
  const materializations = [];
  if (existsSync(paths.materializations_root)) {
    realDirectory(paths.materializations_root, "progressive raw materializations root");
    for (const entry of readdirSync(paths.materializations_root, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.isSymbolicLink() ||
        !CONTENT_ADDRESS_SHORT_NAME_RE.test(entry.name)) {
        fail("progressive_raw_store_record_invalid", "materializations root contains a noncanonical immutable bundle");
      }
      const provenance = readCanonicalValidatedRecord(
        join(paths.materializations_root, entry.name, "provenance.json"),
        validateProgressiveRawMaterializationProvenance,
        { plan: plan.record },
        "progressive raw materialization provenance",
      );
      if (!nameMatchesAddress(entry.name, provenance.sha256)) {
        fail("progressive_raw_store_record_invalid", "materialization bundle does not match its canonical provenance digest");
      }
      materializations.push(readProgressiveRawMaterialization(runDir, { plan_sha256, provenance_sha256: provenance.sha256, plan: plan.record }));
    }
  }
  const pilotEvidence = listRecordFiles(paths.pilot_evidence_root, "progressive raw Pilot-evidence root")
    .map((pathname) => readCanonicalValidatedRecord(pathname, validateProgressiveRawPilotEvidence, { plan: plan.record }, "progressive raw Pilot evidence"));
  const pilotDecisions = listRecordFiles(paths.pilot_decisions_root, "progressive raw Pilot-decisions root")
    .map((pathname) => readCanonicalValidatedRecord(pathname, validateProgressiveRawPilotDecision, { plan: plan.record }, "progressive raw Pilot decision"));
  const completeReviews = listRecordFiles(paths.complete_reviews_root, "progressive raw complete-reviews root")
    .map((pathname) => readCanonicalValidatedRecord(pathname, validateProgressiveRawCompleteReview, { plan: plan.record }, "progressive raw complete review"));
  const acceptedEvidence = listRecordFiles(paths.accepted_evidence_root, "progressive raw accepted-evidence root")
    .map((pathname) => readCanonicalValidatedRecord(pathname, validateProgressiveAcceptedRawEvidence, { plan: plan.record }, "progressive accepted raw evidence"));
  return Object.freeze({
    plan,
    batches: Object.freeze(batches),
    grants: Object.freeze(grants),
    attempts: Object.freeze(attempts),
    materializations: Object.freeze(materializations),
    pilot_evidence: Object.freeze(pilotEvidence),
    pilot_decisions: Object.freeze(pilotDecisions),
    complete_reviews: Object.freeze(completeReviews),
    accepted_evidence: Object.freeze(acceptedEvidence),
  });
}

/**
 * Resolve one immutable provenance digest across this selected deck's
 * append-mostly plan containers. The digest is the selector; directory order
 * never selects a source. A duplicate digest is a malformed owner history.
 */
export function findProgressiveRawMaterializationByProvenance(runDir, { provenance_sha256 } = {}) {
  assertDigest(provenance_sha256, "provenance_sha256");
  const root = progressiveRawStorePaths(runDir);
  if (!existsSync(root.plans_root)) return null;
  realDirectory(root.plans_root, "progressive raw plans root");

  let found = null;
  for (const entry of readdirSync(root.plans_root, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) {
      if (/^\.[0-9a-f]{8}\.lock$/.test(entry.name)) continue;
      fail("progressive_raw_store_record_invalid", "plans root contains a noncanonical entry");
    }
    if (!CONTENT_ADDRESS_SHORT_NAME_RE.test(entry.name)) {
      fail("progressive_raw_store_record_invalid", "plans root contains a noncanonical plan container");
    }
    const planDir = join(root.plans_root, entry.name);
    const plan = readCanonicalValidatedRecord(join(planDir, "work-plan.json"), validateProgressiveRawWorkPlan, undefined, "progressive raw work plan");
    const paths = progressiveRawStorePaths(runDir, {
      plan_sha256: plan.sha256,
      provenance_sha256,
    });
    if (!existsSync(paths.materialization_root)) continue;
    const materialization = readProgressiveRawMaterialization(runDir, {
      plan_sha256: plan.sha256,
      provenance_sha256,
      plan: plan.record,
    });
    if (found) {
      fail("progressive_raw_store_record_invalid", "materialization provenance digest appears in multiple immutable plan containers");
    }
    found = Object.freeze({
      plan: plan.record,
      plan_sha256: plan.sha256,
      materialization,
    });
  }
  return found;
}

/** Resolve one immutable complete-review digest across canonical plan containers. */
export function findProgressiveRawCompleteReviewBySha(runDir, { complete_raw_review_sha256 } = {}) {
  assertDigest(complete_raw_review_sha256, "complete_raw_review_sha256");
  const root = progressiveRawStorePaths(runDir);
  if (!existsSync(root.plans_root)) return null;
  realDirectory(root.plans_root, "progressive raw plans root");

  let found = null;
  for (const entry of readdirSync(root.plans_root, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) {
      if (/^\.[0-9a-f]{8}\.lock$/.test(entry.name)) continue;
      fail("progressive_raw_store_record_invalid", "plans root contains a noncanonical entry");
    }
    if (!CONTENT_ADDRESS_SHORT_NAME_RE.test(entry.name)) {
      fail("progressive_raw_store_record_invalid", "plans root contains a noncanonical plan container");
    }
    const planDir = join(root.plans_root, entry.name);
    const plan = readCanonicalValidatedRecord(join(planDir, "work-plan.json"), validateProgressiveRawWorkPlan, undefined, "progressive raw work plan");
    const direct = readProgressiveRawPlanDirectRecords(runDir, { plan_sha256: plan.sha256 });
    const review = direct.complete_reviews.find((candidate) => candidate.sha256 === complete_raw_review_sha256) || null;
    if (!review) continue;
    if (found) {
      fail("progressive_raw_store_record_invalid", "complete raw review digest appears in multiple immutable plan containers");
    }
    found = Object.freeze({
      plan: direct.plan.record,
      plan_sha256: direct.plan.sha256,
      review,
    });
  }
  return found;
}

export function progressiveRawCanonicalRecordBytes(record) {
  return canonicalBytes(record);
}
