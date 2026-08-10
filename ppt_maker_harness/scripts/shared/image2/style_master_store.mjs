import { mkdirSync, openSync, closeSync, lstatSync, readFileSync, realpathSync, renameSync, rmSync, rmdirSync, writeSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { randomUUID } from "node:crypto";

import {
  pageImageStyleMasterPaths,
} from "../run-bundle/page_image_paths.mjs";
import {
  STYLE_MASTER_MEDIA_TYPES,
  STYLE_MASTER_WORKFLOWS,
  StyleMasterSchemaError,
  parseStyleMasterCanonicalBytes,
  styleMasterCanonicalBytes,
  validateStyleMasterAttemptTransition,
  validateStyleMasterCandidateAttemptRecord,
  validateStyleMasterHeadRecord,
  validateStyleMasterPlanRecord,
} from "./style_master_schema.mjs";
import {
  assertNoActiveMigration,
  resolveContentAddressName,
  shortName,
} from "./content_address_store.mjs";

const SHA256_RE = /^[0-9a-f]{64}$/;
const GENERATED_CANDIDATE_ID_RE = /^candidate-[0-9]{3}$/;
const STAGING_NAME_RE = /^plan-[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;

export class StyleMasterStoreError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function fail(code, message) {
  throw new StyleMasterStoreError(code, message);
}

function assertSha256(value, label) {
  if (!SHA256_RE.test(value || "")) fail("style_master_store_invalid", `${label} must be a lowercase SHA-256`);
}

function assertWorkflow(value) {
  if (!STYLE_MASTER_WORKFLOWS.includes(value)) fail("style_master_store_invalid", "workflow must be framed | pure");
}

function assertCandidateId(value) {
  if (value === "local-existing" || GENERATED_CANDIDATE_ID_RE.test(value || "")) return;
  fail("style_master_store_invalid", "candidate_id must be local-existing or candidate-NNN");
}

function assertMediaType(value) {
  if (!STYLE_MASTER_MEDIA_TYPES.includes(value)) fail("style_master_store_invalid", "candidate media type is invalid");
}

function assertInside(root, candidate, label) {
  const resolvedRoot = resolve(root);
  const resolvedCandidate = resolve(candidate);
  const rel = relative(resolvedRoot, resolvedCandidate);
  if (!rel || rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    fail("style_master_store_escape", `${label} must remain below its canonical owner root`);
  }
  return resolvedCandidate;
}

function isPathInside(root, candidate, { allowEqual = false } = {}) {
  const rel = relative(resolve(root), resolve(candidate));
  if (rel === "") return allowEqual;
  return rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
}

function assertPhysicalPathInside(root, candidate, label, options = undefined) {
  let physicalRoot;
  let physicalCandidate;
  try {
    physicalRoot = realpathSync(root);
    physicalCandidate = realpathSync(candidate);
  } catch {
    fail("style_master_store_escape", `${label} could not be physically confined to its canonical owner root`);
  }
  if (!isPathInside(physicalRoot, physicalCandidate, options)) {
    fail("style_master_store_escape", `${label} must remain physically below its canonical owner root`);
  }
}

function ensureRealDirectoryBelowDeck(deckRoot, target, label) {
  const root = resolve(deckRoot);
  const resolvedTarget = resolve(target);
  if (!isPathInside(root, resolvedTarget, { allowEqual: true })) {
    fail("style_master_store_escape", `${label} must remain below the deck root`);
  }
  let rootStats;
  try {
    rootStats = lstatSync(root);
  } catch {
    fail("style_master_store_escape", "Style Master deck root is unavailable");
  }
  if (!rootStats.isDirectory() || rootStats.isSymbolicLink()) {
    fail("style_master_store_escape", "Style Master deck root must be a real directory");
  }
  let current = root;
  for (const segment of relative(root, resolvedTarget).split(sep).filter(Boolean)) {
    current = join(current, segment);
    let stats;
    try {
      stats = lstatSync(current);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      mkdirSync(current, { mode: 0o700 });
      stats = lstatSync(current);
    }
    if (!stats.isDirectory() || stats.isSymbolicLink()) {
      fail("style_master_store_escape", `${label} must use real directories only`);
    }
  }
  assertPhysicalPathInside(root, resolvedTarget, label, { allowEqual: true });
  return resolvedTarget;
}

function directStagingPath(paths, stagingPath, label) {
  const stagingRoot = resolve(paths.staging_root);
  const staging = assertInside(stagingRoot, stagingPath, label);
  if (dirname(staging) !== stagingRoot || !STAGING_NAME_RE.test(basename(staging))) {
    fail("style_master_store_escape", "only direct plan-* staging directories may be used");
  }
  return staging;
}

function inspectConfinedStagingDirectory(paths, staging) {
  const stagingRoot = resolve(paths.staging_root);
  let rootStats;
  try {
    rootStats = lstatSync(stagingRoot);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    fail("style_master_store_escape", "Style Master staging root is unavailable");
  }
  if (!rootStats.isDirectory() || rootStats.isSymbolicLink()) {
    fail("style_master_store_escape", "Style Master staging root must be a real directory");
  }
  let stagingStats;
  try {
    stagingStats = lstatSync(staging);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    fail("style_master_store_escape", "Style Master staging directory is unavailable");
  }
  if (!stagingStats.isDirectory() || stagingStats.isSymbolicLink()) {
    fail("style_master_store_escape", "staging cleanup requires a real staging directory");
  }
  assertPhysicalPathInside(paths.deck_root, stagingRoot, "Style Master staging root");
  assertPhysicalPathInside(stagingRoot, staging, "staging directory");
  return stagingStats;
}

function equalBytes(left, right) {
  return left !== null && right !== null && Buffer.from(left).equals(Buffer.from(right));
}

function readBytesOrNull(path) {
  try {
    return readFileSync(path);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function styleMasterPlanAddress(pathname) {
  try {
    const parsed = parseStyleMasterCanonicalBytes(readFileSync(join(pathname, "candidate-plan.json")), "Style Master candidate plan");
    const checked = validateStyleMasterPlanRecord(parsed);
    return checked.ok ? checked.plan_sha256 : null;
  } catch {
    return null;
  }
}

function assertExpectedBytes(value) {
  if (value === null) return null;
  if (!Buffer.isBuffer(value) && !(value instanceof Uint8Array)) {
    fail("style_master_cas_invalid", "expected bytes must be null or canonical bytes");
  }
  return Buffer.from(value);
}

function writeBytesAtomic(path, bytes) {
  const target = resolve(path);
  mkdirSync(dirname(target), { recursive: true });
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
      try { closeSync(descriptor); } catch { /* best-effort temporary cleanup */ }
    }
    try { rmSync(temporary, { force: true }); } catch { /* best-effort temporary cleanup */ }
    throw error;
  }
}

function withExclusiveDirectoryLock(lockPath, action) {
  mkdirSync(dirname(lockPath), { recursive: true });
  try {
    mkdirSync(lockPath, { mode: 0o700 });
  } catch (error) {
    if (error?.code === "EEXIST") {
      fail("style_master_cas_locked", "another Style Master owner mutation is in progress for this exact record");
    }
    throw error;
  }
  try {
    return action();
  } finally {
    try { rmdirSync(lockPath); } catch { /* Never delete an unproven lock. */ }
  }
}

/** Resolve the only canonical paths used by Style Master lifecycle records. */
export function styleMasterStorePaths(runDir, { workflow = null, plan_sha256 = null, candidate_id = null, candidate_media_type = null } = {}) {
  const root = pageImageStyleMasterPaths(runDir);
  if (workflow !== null) assertWorkflow(workflow);
  if (plan_sha256 !== null) assertSha256(plan_sha256, "plan_sha256");
  if (candidate_id !== null) assertCandidateId(candidate_id);
  if (candidate_media_type !== null) assertMediaType(candidate_media_type);
  const scopeRoot = workflow === null ? null : join(root.scopes_root, root.run_version, workflow);
  const planRoot = plan_sha256 === null ? null : join(root.plans_root, resolveContentAddressName(root.plans_root, plan_sha256, {
    recordHashReader: styleMasterPlanAddress,
  }));
  const candidateRoot = planRoot === null || candidate_id === null ? null : join(planRoot, "candidates", candidate_id);
  const imageExtension = candidate_media_type === "image/png" ? "png" : candidate_media_type === "image/jpeg" ? "jpg" : null;
  return Object.freeze({
    ...root,
    scope_root: scopeRoot,
    scope_head: scopeRoot === null ? null : join(scopeRoot, "head.json"),
    scope_lock: scopeRoot === null ? null : join(scopeRoot, ".head.lock"),
    plan_root: planRoot,
    candidate_plan: planRoot === null ? null : join(planRoot, "candidate-plan.json"),
    candidate_grant: planRoot === null ? null : join(planRoot, "candidate-grant.json"),
    review_decision: planRoot === null ? null : join(planRoot, "review-decision.json"),
    abandonment: planRoot === null ? null : join(planRoot, "abandonment.json"),
    candidate_root: candidateRoot,
    candidate_attempt: candidateRoot === null ? null : join(candidateRoot, "attempt.json"),
    candidate_provenance: candidateRoot === null ? null : join(candidateRoot, "provenance.json"),
    candidate_image: candidateRoot === null || imageExtension === null ? null : join(candidateRoot, `image.${imageExtension}`),
  });
}

/** Allocate one incomplete plan directory below the only permitted staging root. */
export function createStyleMasterStagingDirectory(runDir, unique = randomUUID()) {
  const paths = styleMasterStorePaths(runDir);
  if (typeof unique !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(unique)) {
    fail("style_master_store_invalid", "staging unique suffix is invalid");
  }
  ensureRealDirectoryBelowDeck(paths.deck_root, paths.staging_root, "Style Master staging root");
  const staging = directStagingPath(paths, join(paths.staging_root, `plan-${unique}`), "staging directory");
  try {
    mkdirSync(staging, { mode: 0o700 });
  } catch (error) {
    if (error?.code === "EEXIST") fail("style_master_store_conflict", "Style Master staging directory already exists");
    throw error;
  }
  inspectConfinedStagingDirectory(paths, staging);
  return staging;
}

/** Remove only a proven incomplete plan staging directory during owner mutation. */
export function cleanupStyleMasterStagingDirectory(runDir, stagingPath) {
  const paths = styleMasterStorePaths(runDir);
  const staging = directStagingPath(paths, stagingPath, "staging directory");
  if (inspectConfinedStagingDirectory(paths, staging) === null) return false;
  rmSync(staging, { recursive: true, force: false });
  return true;
}

/** Read and validate strict canonical JSON bytes without inferring from a path. */
export function readCanonicalStyleMasterRecord(path, validator, options = undefined) {
  if (typeof validator !== "function") fail("style_master_store_invalid", "record reader requires a validator");
  const bytes = readFileSync(path);
  const record = parseStyleMasterCanonicalBytes(bytes, basename(path));
  const checked = validator(record, options);
  if (!checked?.ok) throw new StyleMasterSchemaError(checked?.code || "style_master_record_invalid", checked?.message || "Style Master record is invalid");
  return Object.freeze({ record: Object.freeze(record), bytes: Buffer.from(bytes), ...checked });
}

/** Create one immutable record or exact-replay its canonical bytes. */
export function createOrExactMatchStyleMasterRecord(path, record, validator, options = undefined, deckRoot = null) {
  if (typeof validator !== "function") fail("style_master_store_invalid", "record writer requires a validator");
  const desiredBytes = styleMasterCanonicalBytes(record);
  const checkedDesired = validator(record, options);
  if (!checkedDesired?.ok) throw new StyleMasterSchemaError(checkedDesired?.code || "style_master_record_invalid", checkedDesired?.message || "Style Master record is invalid");
  const target = resolve(path);
  const lock = join(dirname(target), `.${basename(target)}.lock`);
  return withExclusiveDirectoryLock(lock, () => {
    if (deckRoot != null) assertNoActiveMigration(deckRoot);
    const existing = readBytesOrNull(target);
    if (existing !== null) {
      const parsed = readCanonicalStyleMasterRecord(target, validator, options);
      if (!equalBytes(existing, desiredBytes)) {
        fail("style_master_record_conflict", "existing immutable Style Master record differs from the requested canonical record");
      }
      return Object.freeze({ created: false, replay: true, bytes: parsed.bytes, record: parsed.record, ...checkedDesired });
    }
    writeBytesAtomic(target, desiredBytes);
    return Object.freeze({ created: true, replay: false, bytes: desiredBytes, record: Object.freeze(structuredClone(record)), ...checkedDesired });
  });
}

/** CAS one generated candidate attempt through its monotonic exact record. */
export function writeStyleMasterCandidateAttemptCas(runDir, {
  plan,
  grant,
  candidate_id,
  expected_bytes,
  attempt,
} = {}) {
  if (expected_bytes === undefined) {
    fail("style_master_cas_invalid", "attempt CAS requires expected_bytes (null for an absent attempt)");
  }
  if (!attempt || candidate_id !== attempt.candidate_id) {
    fail("style_master_cas_invalid", "attempt CAS requires one exact candidate attempt record");
  }
  const checkedAttempt = validateStyleMasterCandidateAttemptRecord(attempt, { plan, grant });
  if (!checkedAttempt.ok) throw new StyleMasterSchemaError(checkedAttempt.code, checkedAttempt.message);
  const expected = assertExpectedBytes(expected_bytes);
  const paths = styleMasterStorePaths(runDir, {
    plan_sha256: attempt.plan_sha256,
    candidate_id,
  });
  const desired = styleMasterCanonicalBytes(attempt);
  const lock = join(dirname(paths.candidate_attempt), ".attempt.lock");
  return withExclusiveDirectoryLock(lock, () => {
    assertNoActiveMigration(paths.deck_root);
    const actual = readBytesOrNull(paths.candidate_attempt);
    if ((expected === null && actual !== null) || (expected !== null && !equalBytes(expected, actual))) {
      fail("style_master_attempt_conflict", "Style Master candidate attempt changed before compare-and-swap");
    }
    if (actual === null) {
      if (attempt.status !== "claimed") {
        fail("style_master_attempt_transition_invalid", "a Style Master candidate attempt must begin as claimed");
      }
    } else {
      const current = readCanonicalStyleMasterRecord(paths.candidate_attempt, validateStyleMasterCandidateAttemptRecord, { plan, grant });
      const transition = validateStyleMasterAttemptTransition(current.record, attempt);
      if (!transition.ok) throw new StyleMasterSchemaError(transition.code, transition.message);
    }
    if (actual !== null && equalBytes(actual, desired)) {
      return Object.freeze({
        created: false,
        replay: true,
        bytes: Buffer.from(actual),
        previous_bytes: Buffer.from(actual),
        record: Object.freeze(structuredClone(attempt)),
        attempt_record_sha256: checkedAttempt.attempt_record_sha256,
      });
    }
    writeBytesAtomic(paths.candidate_attempt, desired);
    return Object.freeze({
      created: actual === null,
      replay: false,
      bytes: desired,
      previous_bytes: actual === null ? null : Buffer.from(actual),
      record: Object.freeze(structuredClone(attempt)),
      attempt_record_sha256: checkedAttempt.attempt_record_sha256,
    });
  });
}

/** Atomically place immutable candidate bytes or exact-replay the same bytes. */
export function placeStyleMasterCandidateImage(runDir, {
  plan_sha256,
  candidate_id,
  candidate_media_type,
  bytes,
} = {}) {
  if (!Buffer.isBuffer(bytes) && !(bytes instanceof Uint8Array)) {
    fail("style_master_store_invalid", "candidate image bytes must be a Buffer or Uint8Array");
  }
  const payload = Buffer.from(bytes);
  if (!payload.length) fail("style_master_store_invalid", "candidate image bytes must not be empty");
  const paths = styleMasterStorePaths(runDir, {
    plan_sha256,
    candidate_id,
    candidate_media_type,
  });
  if (!paths.candidate_image) fail("style_master_store_invalid", "candidate image path requires exact media type");
  const lock = join(dirname(paths.candidate_image), ".image.lock");
  return withExclusiveDirectoryLock(lock, () => {
    assertNoActiveMigration(paths.deck_root);
    const existing = readBytesOrNull(paths.candidate_image);
    if (existing !== null) {
      if (!equalBytes(existing, payload)) {
        fail("style_master_candidate_conflict", "existing immutable Style Master candidate bytes differ from the submitted bytes");
      }
      return Object.freeze({ created: false, replay: true, bytes: Buffer.from(existing), path: paths.candidate_image });
    }
    writeBytesAtomic(paths.candidate_image, payload);
    return Object.freeze({ created: true, replay: false, bytes: payload, path: paths.candidate_image });
  });
}

/** CAS the only mutable current-plan pointer for one run-version/workflow scope. */
export function writeStyleMasterScopeHeadCas(runDir, { workflow, head, plan, expected_bytes } = {}) {
  if (expected_bytes === undefined) fail("style_master_cas_invalid", "head CAS requires expected_bytes (null for an absent head)");
  const paths = styleMasterStorePaths(runDir, { workflow });
  const checkedHead = validateStyleMasterHeadRecord(head, { plan });
  if (!checkedHead.ok) throw new StyleMasterSchemaError(checkedHead.code, checkedHead.message);
  const expected = assertExpectedBytes(expected_bytes);
  const desired = styleMasterCanonicalBytes(head);
  ensureRealDirectoryBelowDeck(paths.deck_root, paths.scope_root, "Style Master scope root");
  return withExclusiveDirectoryLock(paths.scope_lock, () => {
    assertNoActiveMigration(paths.deck_root);
    const actual = readBytesOrNull(paths.scope_head);
    if ((expected === null && actual !== null) || (expected !== null && !equalBytes(expected, actual))) {
      fail("style_master_head_conflict", "Style Master scope head changed before compare-and-swap");
    }
    writeBytesAtomic(paths.scope_head, desired);
    return Object.freeze({
      bytes: desired,
      previous_bytes: actual === null ? null : Buffer.from(actual),
      head_sha256: checkedHead.head_sha256,
    });
  });
}

/** Publish a fully validated staged initial bundle before any scope-head CAS. */
export function publishStyleMasterStagedPlan(runDir, { staging_path, plan_sha256, validate_bundle } = {}) {
  assertSha256(plan_sha256, "plan_sha256");
  if (typeof validate_bundle !== "function") fail("style_master_store_invalid", "plan publication requires validate_bundle");
  const paths = styleMasterStorePaths(runDir, { plan_sha256 });
  const staging = directStagingPath(paths, staging_path, "staging directory");
  if (inspectConfinedStagingDirectory(paths, staging) === null) {
    fail("style_master_store_invalid", "staged plan directory is unavailable");
  }
  validate_bundle(staging);
  ensureRealDirectoryBelowDeck(paths.deck_root, paths.plans_root, "Style Master plans root");
  return withExclusiveDirectoryLock(join(paths.plans_root, `.${shortName(plan_sha256)}.lock`), () => {
    assertNoActiveMigration(paths.deck_root);
    if (readBytesOrNull(paths.candidate_plan) !== null) {
      validate_bundle(paths.plan_root);
      cleanupStyleMasterStagingDirectory(runDir, staging);
      return Object.freeze({ published: false, replay: true, plan_root: paths.plan_root });
    }
    try {
      renameSync(staging, paths.plan_root);
    } catch (error) {
      if (readBytesOrNull(paths.candidate_plan) === null) throw error;
      validate_bundle(paths.plan_root);
      cleanupStyleMasterStagingDirectory(runDir, staging);
      return Object.freeze({ published: false, replay: true, plan_root: paths.plan_root });
    }
    return Object.freeze({ published: true, replay: false, plan_root: paths.plan_root });
  });
}
