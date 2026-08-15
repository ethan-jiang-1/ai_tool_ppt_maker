import { canonicalJson, canonicalJsonSha256 } from "../identity/canonical_json.mjs";
import { sha256Bytes } from "../identity/byte_hash.mjs";

export const STYLE_MASTER_PLAN_IDENTITY_SCHEMA = "page-image-style-master-plan-identity";
export const STYLE_MASTER_HEAD_SCHEMA = "page-image-style-master-head";
export const STYLE_MASTER_CANDIDATE_GRANT_SCHEMA = "page-image-style-master-candidate-grant";
export const STYLE_MASTER_CANDIDATE_ATTEMPT_SCHEMA = "page-image-style-master-candidate-attempt";
export const STYLE_MASTER_CANDIDATE_ABANDONMENT_SCHEMA = "page-image-style-master-candidate-abandonment";
export const STYLE_MASTER_LOCAL_PROVENANCE_SCHEMA = "page-image-style-master-local-provenance";
export const STYLE_MASTER_GENERATED_PROVENANCE_SCHEMA = "page-image-style-master-generated-provenance";
export const STYLE_MASTER_PROVIDER_REQUEST_SCHEMA = "page-image-style-master-provider-request";
export const STYLE_MASTER_REVIEW_DECISION_SCHEMA = "page-image-style-master-review-decision";
export const STYLE_MASTER_SELECTION_SCHEMA = "page-image-style-master-selection";
export const STYLE_MASTER_GENERATION_PROFILE_SCHEMA = "page-image-style-master-generation-profile";

export const STYLE_MASTER_WORKFLOWS = Object.freeze(["framed", "pure"]);
export const STYLE_MASTER_MEDIA_TYPES = Object.freeze(["image/png", "image/jpeg"]);
export const STYLE_MASTER_ATTEMPT_STATUSES = Object.freeze(["claimed", "submitted", "succeeded", "failed", "unknown"]);
export const STYLE_MASTER_REVIEW_DECISIONS = Object.freeze(["proceed", "repair", "redirect"]);
const SHA256_RE = /^[0-9a-f]{64}$/;
const RUN_VERSION_RE = /^v[1-9][0-9]*$/;
const GENERATED_CANDIDATE_ID_RE = /^candidate-([0-9]{3})$/;
const ISO_TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const LOWER_KEBAB_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// This schema validates only the persisted vocabulary. Resolution and exact
// prompt measurement remain owned by provider_profile.mjs.
const PROMPT_BUDGET_UNITS = new Set([
  "unicode-code-points",
  "utf16-code-units",
  "utf8-bytes",
]);

export class StyleMasterSchemaError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function freeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) freeze(item);
  return Object.freeze(value);
}

function fail(code, message) {
  throw new StyleMasterSchemaError(code, message);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function exactKeys(value, keys) {
  return isPlainObject(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function assertExactKeys(value, keys, label) {
  if (!exactKeys(value, keys)) fail("style_master_record_invalid", `${label} has an invalid field set`);
}

function assertSha256(value, label) {
  if (!SHA256_RE.test(value || "")) fail("style_master_digest_invalid", `${label} must be a lowercase SHA-256`);
}

function assertNullableSha256(value, label) {
  if (value !== null) assertSha256(value, label);
}

function assertRunVersion(value) {
  if (!RUN_VERSION_RE.test(value || "")) fail("style_master_scope_invalid", "run_version must be a canonical vN");
}

function assertWorkflow(value) {
  if (!STYLE_MASTER_WORKFLOWS.includes(value)) fail("style_master_scope_invalid", "workflow must be framed | pure");
}

function assertMedia(value) {
  if (!STYLE_MASTER_MEDIA_TYPES.includes(value)) fail("style_master_media_invalid", "candidate_media_type must be image/png | image/jpeg");
}

function assertDimensions(width, height) {
  if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0) {
    fail("style_master_media_invalid", "candidate dimensions must be positive integers");
  }
}

function assertGeneratedCandidateId(value) {
  if (!GENERATED_CANDIDATE_ID_RE.test(value || "")) fail("style_master_candidate_invalid", "generated candidate_id must be candidate-NNN");
}

function assertCandidateId(value) {
  if (value === "local-existing") return;
  assertGeneratedCandidateId(value);
}

function assertValidIsoTimestamp(value) {
  if (typeof value !== "string" || !ISO_TIMESTAMP_RE.test(value) || Number.isNaN(Date.parse(value))) {
    fail("style_master_selection_invalid", "accepted_at must be an ISO timestamp with milliseconds");
  }
}

function validation(run) {
  try {
    const result = run();
    return freeze({ ok: true, ...result });
  } catch (error) {
    return freeze({ ok: false, code: error?.code || "style_master_record_invalid", message: error?.message || String(error) });
  }
}

export function styleMasterCanonicalBytes(record) {
  return Buffer.from(canonicalJson(record), "utf8");
}

export function parseStyleMasterCanonicalBytes(bytes, label = "Style Master record") {
  if (!Buffer.isBuffer(bytes) && !(bytes instanceof Uint8Array)) {
    throw new StyleMasterSchemaError("style_master_record_invalid", `${label} must be UTF-8 bytes`);
  }
  let value;
  try {
    value = JSON.parse(Buffer.from(bytes).toString("utf8"));
  } catch {
    throw new StyleMasterSchemaError("style_master_record_invalid", `${label} is not valid JSON`);
  }
  const canonical = styleMasterCanonicalBytes(value);
  if (!canonical.equals(Buffer.from(bytes))) {
    throw new StyleMasterSchemaError("style_master_record_noncanonical", `${label} must use exact canonical JSON bytes`);
  }
  return value;
}

export function validateStyleMasterGenerationProfile(profile) {
  return validation(() => {
    assertExactKeys(profile, ["schema", "provider", "output", "prompt_contract"], "candidate generation profile");
    if (profile.schema !== STYLE_MASTER_GENERATION_PROFILE_SCHEMA ||
      !exactKeys(profile.provider, ["provider", "profile_id", "profile_sha256", "endpoint_profile", "route_id", "operation", "model", "prompt_budget"]) ||
      profile.provider.provider !== "image2" ||
      !LOWER_KEBAB_ID_RE.test(profile.provider.profile_id || "") ||
      !SHA256_RE.test(profile.provider.profile_sha256 || "") ||
      !LOWER_KEBAB_ID_RE.test(profile.provider.endpoint_profile || "") ||
      !LOWER_KEBAB_ID_RE.test(profile.provider.route_id || "") ||
      profile.provider.operation !== "style-master-text-generation" ||
      typeof profile.provider.model !== "string" || !profile.provider.model.trim() ||
      !exactKeys(profile.provider.prompt_budget, ["limit", "unit"]) ||
      !Number.isSafeInteger(profile.provider.prompt_budget.limit) || profile.provider.prompt_budget.limit <= 0 ||
      !PROMPT_BUDGET_UNITS.has(profile.provider.prompt_budget.unit) ||
      !exactKeys(profile.output, ["format", "width", "height"]) ||
      profile.output.format !== "png" || profile.output.width !== 2000 || profile.output.height !== 1125 ||
      profile.prompt_contract !== "style-master-no-readable-text") {
      fail("style_master_profile_invalid", "candidate generation profile must bind one confirmed Style Master operation");
    }
    return { candidate_generation_profile_sha256: canonicalJsonSha256(profile) };
  });
}

export function createStyleMasterGenerationProfile(operationProfile) {
  const profile = {
    schema: STYLE_MASTER_GENERATION_PROFILE_SCHEMA,
    provider: {
      provider: "image2",
      profile_id: operationProfile?.profile_id,
      profile_sha256: operationProfile?.profile_sha256,
      endpoint_profile: operationProfile?.endpoint_profile,
      route_id: operationProfile?.route_id,
      operation: operationProfile?.operation,
      model: operationProfile?.model,
      prompt_budget: operationProfile?.prompt_budget
        ? { limit: operationProfile.prompt_budget.limit, unit: operationProfile.prompt_budget.unit }
        : null,
    },
    output: { format: "png", width: 2000, height: 1125 },
    prompt_contract: "style-master-no-readable-text",
  };
  const checked = validateStyleMasterGenerationProfile(profile);
  if (!checked.ok) throw new StyleMasterSchemaError(checked.code, checked.message);
  return freeze(profile);
}

export function styleMasterGenerationProfileSha256(profile) {
  const checked = validateStyleMasterGenerationProfile(profile);
  if (!checked.ok) throw new StyleMasterSchemaError(checked.code, checked.message);
  return checked.candidate_generation_profile_sha256;
}

function validatePlanCandidate(candidate, generatedIndex) {
  if (!isPlainObject(candidate) || typeof candidate.kind !== "string") {
    fail("style_master_candidate_invalid", "plan candidate must be an object");
  }
  if (candidate.kind === "generated") {
    assertExactKeys(candidate, ["candidate_id", "kind"], "generated candidate");
    const expected = `candidate-${String(generatedIndex).padStart(3, "0")}`;
    if (candidate.candidate_id !== expected) {
      fail("style_master_candidate_invalid", "generated candidates must use ordered stable candidate-NNN IDs");
    }
    return;
  }
  if (candidate.kind === "local-existing") {
    assertExactKeys(candidate, [
      "candidate_id", "kind", "candidate_sha256", "candidate_provenance_sha256",
      "candidate_media_type", "candidate_width", "candidate_height",
    ], "local-existing candidate");
    if (candidate.candidate_id !== "local-existing") fail("style_master_candidate_invalid", "local candidate ID must be local-existing");
    assertSha256(candidate.candidate_sha256, "candidate_sha256");
    assertSha256(candidate.candidate_provenance_sha256, "candidate_provenance_sha256");
    assertMedia(candidate.candidate_media_type);
    assertDimensions(candidate.candidate_width, candidate.candidate_height);
    return;
  }
  fail("style_master_candidate_invalid", "candidate kind must be generated | local-existing");
}

export function validateStyleMasterPlanIdentity(identity) {
  return validation(() => {
    const keys = [
      "schema", "run_version", "workflow", "plan_generation", "previous_plan_sha256", "previous_selection_sha256",
      "style_intent_sha256", "style_context_sha256", "candidate_generation_profile_sha256", "compiled_prompt_sha256",
      "generated_candidate_count", "candidates",
    ];
    assertExactKeys(identity, keys, "plan identity");
    if (identity.schema !== STYLE_MASTER_PLAN_IDENTITY_SCHEMA) fail("style_master_plan_invalid", "plan identity schema is invalid");
    assertRunVersion(identity.run_version);
    assertWorkflow(identity.workflow);
    if (!Number.isInteger(identity.plan_generation) || identity.plan_generation <= 0) {
      fail("style_master_plan_invalid", "plan_generation must be positive");
    }
    assertNullableSha256(identity.previous_plan_sha256, "previous_plan_sha256");
    assertNullableSha256(identity.previous_selection_sha256, "previous_selection_sha256");
    for (const field of ["style_intent_sha256", "style_context_sha256", "compiled_prompt_sha256"]) {
      assertSha256(identity[field], field);
    }
    assertSha256(identity.candidate_generation_profile_sha256, "candidate_generation_profile_sha256");
    if (!Number.isInteger(identity.generated_candidate_count) || identity.generated_candidate_count < 0 || identity.generated_candidate_count > 4) {
      fail("style_master_plan_invalid", "generated_candidate_count must be an integer from 0 through 4");
    }
    if (!Array.isArray(identity.candidates) || identity.candidates.length === 0) {
      fail("style_master_candidate_invalid", "plan must contain at least one candidate");
    }
    const localCandidates = identity.candidates.filter((candidate) => candidate?.kind === "local-existing");
    if (localCandidates.length > 1 || (localCandidates.length === 1 && identity.candidates[0] !== localCandidates[0])) {
      fail("style_master_candidate_invalid", "local-existing candidate must appear at most once and first");
    }
    let generatedIndex = 1;
    for (const candidate of identity.candidates) {
      validatePlanCandidate(candidate, generatedIndex);
      if (candidate.kind === "generated") generatedIndex += 1;
    }
    if (generatedIndex - 1 !== identity.generated_candidate_count || identity.candidates.length !== identity.generated_candidate_count + localCandidates.length) {
      fail("style_master_candidate_invalid", "candidate count does not match the plan identity");
    }
    if (identity.generated_candidate_count === 0 && localCandidates.length !== 1) {
      fail("style_master_plan_invalid", "zero-generated plan requires one local-existing candidate");
    }
    return { plan_sha256: canonicalJsonSha256(identity) };
  });
}

export function createStyleMasterPlanRecord(identity) {
  const checked = validateStyleMasterPlanIdentity(identity);
  if (!checked.ok) throw new StyleMasterSchemaError(checked.code, checked.message);
  return freeze({ ...structuredClone(identity), plan_sha256: checked.plan_sha256 });
}

export function planIdentityFromRecord(record) {
  const { plan_sha256: _ignored, ...identity } = record || {};
  return identity;
}

export function validateStyleMasterPlanRecord(record) {
  return validation(() => {
    const identity = planIdentityFromRecord(record);
    const keys = [...Object.keys(identity), "plan_sha256"];
    const expectedKeys = [
      "schema", "run_version", "workflow", "plan_generation", "previous_plan_sha256", "previous_selection_sha256",
      "style_intent_sha256", "style_context_sha256", "candidate_generation_profile_sha256", "compiled_prompt_sha256",
      "generated_candidate_count", "candidates", "plan_sha256",
    ];
    if (keys.length !== expectedKeys.length || !expectedKeys.every((key) => Object.hasOwn(record || {}, key))) {
      fail("style_master_plan_invalid", "candidate-plan record has an invalid field set");
    }
    const checked = validateStyleMasterPlanIdentity(identity);
    if (!checked.ok) fail(checked.code, checked.message);
    if (record.plan_sha256 !== checked.plan_sha256) fail("style_master_plan_invalid", "candidate-plan digest does not match its identity");
    return { plan_sha256: checked.plan_sha256, identity: freeze(structuredClone(identity)) };
  });
}

export function validateStyleMasterHeadRecord(head, { plan = null } = {}) {
  return validation(() => {
    assertExactKeys(head, ["schema", "run_version", "workflow", "plan_sha256", "plan_generation", "previous_plan_sha256"], "scope head");
    if (head.schema !== STYLE_MASTER_HEAD_SCHEMA) fail("style_master_head_invalid", "scope head schema is invalid");
    assertRunVersion(head.run_version);
    assertWorkflow(head.workflow);
    assertSha256(head.plan_sha256, "plan_sha256");
    if (!Number.isInteger(head.plan_generation) || head.plan_generation <= 0) fail("style_master_head_invalid", "head plan_generation must be positive");
    assertNullableSha256(head.previous_plan_sha256, "previous_plan_sha256");
    if (plan) {
      const checkedPlan = validateStyleMasterPlanRecord(plan);
      if (!checkedPlan.ok) fail(checkedPlan.code, checkedPlan.message);
      if (head.plan_sha256 !== checkedPlan.plan_sha256 || head.run_version !== plan.run_version || head.workflow !== plan.workflow ||
        head.plan_generation !== plan.plan_generation || head.previous_plan_sha256 !== plan.previous_plan_sha256) {
        fail("style_master_head_invalid", "scope head does not cross-bind its candidate plan");
      }
    }
    return { head_sha256: canonicalJsonSha256(head) };
  });
}

export function createStyleMasterHeadRecord(plan) {
  const checkedPlan = validateStyleMasterPlanRecord(plan);
  if (!checkedPlan.ok) throw new StyleMasterSchemaError(checkedPlan.code, checkedPlan.message);
  const head = {
    schema: STYLE_MASTER_HEAD_SCHEMA,
    run_version: plan.run_version,
    workflow: plan.workflow,
    plan_sha256: plan.plan_sha256,
    plan_generation: plan.plan_generation,
    previous_plan_sha256: plan.previous_plan_sha256,
  };
  const checked = validateStyleMasterHeadRecord(head, { plan });
  if (!checked.ok) throw new StyleMasterSchemaError(checked.code, checked.message);
  return freeze(head);
}

export function generatedCandidateIds(plan) {
  const checked = validateStyleMasterPlanRecord(plan);
  if (!checked.ok) throw new StyleMasterSchemaError(checked.code, checked.message);
  return freeze(plan.candidates.filter((candidate) => candidate.kind === "generated").map((candidate) => candidate.candidate_id));
}

export function validateStyleMasterCandidateGrantRecord(grant, { plan = null } = {}) {
  return validation(() => {
    assertExactKeys(grant, [
      "schema", "run_version", "workflow", "plan_sha256", "generated_candidate_ids", "max_submissions", "candidate_generation_profile_sha256",
    ], "candidate grant");
    if (grant.schema !== STYLE_MASTER_CANDIDATE_GRANT_SCHEMA) fail("style_master_grant_invalid", "candidate grant schema is invalid");
    assertRunVersion(grant.run_version);
    assertWorkflow(grant.workflow);
    assertSha256(grant.plan_sha256, "plan_sha256");
    assertSha256(grant.candidate_generation_profile_sha256, "candidate_generation_profile_sha256");
    if (!Array.isArray(grant.generated_candidate_ids) || grant.generated_candidate_ids.length === 0 ||
      grant.generated_candidate_ids.some((id) => !GENERATED_CANDIDATE_ID_RE.test(id || "")) ||
      new Set(grant.generated_candidate_ids).size !== grant.generated_candidate_ids.length) {
      fail("style_master_grant_invalid", "generated_candidate_ids must be nonempty unique stable generated IDs");
    }
    if (!Number.isInteger(grant.max_submissions) || grant.max_submissions <= 0 || grant.max_submissions !== grant.generated_candidate_ids.length) {
      fail("style_master_grant_invalid", "max_submissions must equal the positive generated slot count");
    }
    if (plan) {
      const checkedPlan = validateStyleMasterPlanRecord(plan);
      if (!checkedPlan.ok) fail(checkedPlan.code, checkedPlan.message);
      const expectedIds = generatedCandidateIds(plan);
      if (grant.plan_sha256 !== plan.plan_sha256 || grant.run_version !== plan.run_version || grant.workflow !== plan.workflow ||
        grant.candidate_generation_profile_sha256 !== plan.candidate_generation_profile_sha256 ||
        canonicalJson(grant.generated_candidate_ids) !== canonicalJson(expectedIds)) {
        fail("style_master_grant_invalid", "candidate grant does not cross-bind its candidate plan");
      }
    }
    return { candidate_grant_sha256: canonicalJsonSha256(grant) };
  });
}

export function createStyleMasterCandidateGrantRecord(plan) {
  const grant = {
    schema: STYLE_MASTER_CANDIDATE_GRANT_SCHEMA,
    run_version: plan?.run_version,
    workflow: plan?.workflow,
    plan_sha256: plan?.plan_sha256,
    generated_candidate_ids: [...generatedCandidateIds(plan)],
    max_submissions: plan?.generated_candidate_count,
    candidate_generation_profile_sha256: plan?.candidate_generation_profile_sha256,
  };
  const checked = validateStyleMasterCandidateGrantRecord(grant, { plan });
  if (!checked.ok) throw new StyleMasterSchemaError(checked.code, checked.message);
  return freeze(grant);
}

export function createStyleMasterProviderRequestRecord({ plan_sha256, candidate_id, compiled_prompt_sha256, candidate_generation_profile_sha256 } = {}) {
  const request = {
    schema: STYLE_MASTER_PROVIDER_REQUEST_SCHEMA,
    plan_sha256,
    candidate_id,
    compiled_prompt_sha256,
    candidate_generation_profile_sha256,
  };
  const checked = validateStyleMasterProviderRequestRecord(request);
  if (!checked.ok) throw new StyleMasterSchemaError(checked.code, checked.message);
  return freeze(request);
}

export function validateStyleMasterProviderRequestRecord(request, { plan = null, candidateId = null } = {}) {
  return validation(() => {
    assertExactKeys(request, ["schema", "plan_sha256", "candidate_id", "compiled_prompt_sha256", "candidate_generation_profile_sha256"], "provider request");
    if (request.schema !== STYLE_MASTER_PROVIDER_REQUEST_SCHEMA) fail("style_master_request_invalid", "provider request schema is invalid");
    assertSha256(request.plan_sha256, "plan_sha256");
    assertGeneratedCandidateId(request.candidate_id);
    assertSha256(request.compiled_prompt_sha256, "compiled_prompt_sha256");
    assertSha256(request.candidate_generation_profile_sha256, "candidate_generation_profile_sha256");
    if (candidateId && request.candidate_id !== candidateId) fail("style_master_request_invalid", "provider request candidate does not match its attempt");
    if (plan) {
      const checkedPlan = validateStyleMasterPlanRecord(plan);
      if (!checkedPlan.ok) fail(checkedPlan.code, checkedPlan.message);
      if (request.plan_sha256 !== plan.plan_sha256 || request.compiled_prompt_sha256 !== plan.compiled_prompt_sha256 ||
        request.candidate_generation_profile_sha256 !== plan.candidate_generation_profile_sha256 || !generatedCandidateIds(plan).includes(request.candidate_id)) {
        fail("style_master_request_invalid", "provider request does not cross-bind its candidate plan");
      }
    }
    return { provider_request_sha256: canonicalJsonSha256(request) };
  });
}

export function validateStyleMasterCandidateAttemptRecord(attempt, { plan = null, grant = null } = {}) {
  return validation(() => {
    assertExactKeys(attempt, [
      "schema", "run_version", "workflow", "plan_sha256", "candidate_id", "candidate_grant_sha256", "status",
      "provider_request_sha256", "candidate_sha256", "candidate_provenance_sha256", "reason_sha256",
    ], "candidate attempt");
    if (attempt.schema !== STYLE_MASTER_CANDIDATE_ATTEMPT_SCHEMA) fail("style_master_attempt_invalid", "candidate attempt schema is invalid");
    assertRunVersion(attempt.run_version);
    assertWorkflow(attempt.workflow);
    assertSha256(attempt.plan_sha256, "plan_sha256");
    assertGeneratedCandidateId(attempt.candidate_id);
    assertSha256(attempt.candidate_grant_sha256, "candidate_grant_sha256");
    if (!STYLE_MASTER_ATTEMPT_STATUSES.includes(attempt.status)) fail("style_master_attempt_invalid", "candidate attempt status is invalid");
    const nullable = ["provider_request_sha256", "candidate_sha256", "candidate_provenance_sha256", "reason_sha256"];
    for (const field of nullable) assertNullableSha256(attempt[field], field);
    if (attempt.status === "claimed" && nullable.some((field) => attempt[field] !== null)) {
      fail("style_master_attempt_invalid", "claimed attempt cannot carry outcome fields");
    }
    if (attempt.status === "submitted" && (attempt.provider_request_sha256 === null || attempt.candidate_sha256 !== null || attempt.candidate_provenance_sha256 !== null || attempt.reason_sha256 !== null)) {
      fail("style_master_attempt_invalid", "submitted attempt must contain only its provider request digest");
    }
    if (attempt.status === "succeeded" && (attempt.provider_request_sha256 === null || attempt.candidate_sha256 === null || attempt.candidate_provenance_sha256 === null || attempt.reason_sha256 !== null)) {
      fail("style_master_attempt_invalid", "succeeded attempt must bind request, bytes, and provenance only");
    }
    if (attempt.status === "failed" && (attempt.provider_request_sha256 === null || attempt.candidate_sha256 !== null || attempt.candidate_provenance_sha256 !== null || attempt.reason_sha256 !== null)) {
      fail("style_master_attempt_invalid", "failed attempt must retain only its provider request digest");
    }
    if (attempt.status === "unknown" && (attempt.provider_request_sha256 === null || attempt.candidate_sha256 !== null || attempt.candidate_provenance_sha256 !== null)) {
      fail("style_master_attempt_invalid", "unknown attempt must retain only request and optional reason digests");
    }
    if (plan) {
      const checkedPlan = validateStyleMasterPlanRecord(plan);
      if (!checkedPlan.ok) fail(checkedPlan.code, checkedPlan.message);
      if (attempt.plan_sha256 !== plan.plan_sha256 || attempt.run_version !== plan.run_version || attempt.workflow !== plan.workflow ||
        !generatedCandidateIds(plan).includes(attempt.candidate_id)) {
        fail("style_master_attempt_invalid", "candidate attempt does not cross-bind its plan");
      }
    }
    if (grant) {
      const checkedGrant = validateStyleMasterCandidateGrantRecord(grant, { plan });
      if (!checkedGrant.ok) fail(checkedGrant.code, checkedGrant.message);
      if (attempt.candidate_grant_sha256 !== checkedGrant.candidate_grant_sha256 || !grant.generated_candidate_ids.includes(attempt.candidate_id)) {
        fail("style_master_attempt_invalid", "candidate attempt does not cross-bind its grant");
      }
    }
    return { attempt_record_sha256: canonicalJsonSha256(attempt) };
  });
}

export function createStyleMasterCandidateAttemptRecord({ run_version, workflow, plan_sha256, candidate_id, candidate_grant_sha256 } = {}) {
  const attempt = {
    schema: STYLE_MASTER_CANDIDATE_ATTEMPT_SCHEMA,
    run_version,
    workflow,
    plan_sha256,
    candidate_id,
    candidate_grant_sha256,
    status: "claimed",
    provider_request_sha256: null,
    candidate_sha256: null,
    candidate_provenance_sha256: null,
    reason_sha256: null,
  };
  const checked = validateStyleMasterCandidateAttemptRecord(attempt);
  if (!checked.ok) throw new StyleMasterSchemaError(checked.code, checked.message);
  return freeze(attempt);
}

/** Derive, never persist, grant consumption and candidate progress. */
export function deriveStyleMasterGrantProgress({ plan, grant, attempts = [] } = {}) {
  const checkedPlan = validateStyleMasterPlanRecord(plan);
  if (!checkedPlan.ok) throw new StyleMasterSchemaError(checkedPlan.code, checkedPlan.message);
  const checkedGrant = validateStyleMasterCandidateGrantRecord(grant, { plan });
  if (!checkedGrant.ok) throw new StyleMasterSchemaError(checkedGrant.code, checkedGrant.message);
  if (!Array.isArray(attempts)) throw new StyleMasterSchemaError("style_master_attempt_invalid", "attempts must be an array");
  const byCandidate = new Map();
  for (const attempt of attempts) {
    const checkedAttempt = validateStyleMasterCandidateAttemptRecord(attempt, { plan, grant });
    if (!checkedAttempt.ok) throw new StyleMasterSchemaError(checkedAttempt.code, checkedAttempt.message);
    if (byCandidate.has(attempt.candidate_id)) {
      throw new StyleMasterSchemaError("style_master_attempt_invalid", "one candidate may have only one monotonic attempt record");
    }
    byCandidate.set(attempt.candidate_id, attempt);
  }
  const items = grant.generated_candidate_ids.map((candidate_id) => {
    const attempt = byCandidate.get(candidate_id) || null;
    return freeze({
      candidate_id,
      status: attempt?.status || "pending",
      submitted: Boolean(attempt && attempt.status !== "claimed"),
      attempt_record_sha256: attempt ? canonicalJsonSha256(attempt) : null,
    });
  });
  const consumed = items.filter((item) => item.submitted).length;
  return freeze({
    max_submissions: grant.max_submissions,
    consumed_submissions: consumed,
    remaining_submissions: grant.max_submissions - consumed,
    items: freeze(items),
  });
}

export function validateStyleMasterAttemptTransition(previous, next) {
  return validation(() => {
    const prior = validateStyleMasterCandidateAttemptRecord(previous);
    const candidate = validateStyleMasterCandidateAttemptRecord(next);
    if (!prior.ok) fail(prior.code, prior.message);
    if (!candidate.ok) fail(candidate.code, candidate.message);
    const bindings = ["run_version", "workflow", "plan_sha256", "candidate_id", "candidate_grant_sha256"];
    if (bindings.some((field) => previous[field] !== next[field])) fail("style_master_attempt_transition_invalid", "candidate attempt bindings are immutable");
    if (canonicalJson(previous) === canonicalJson(next)) return { attempt_record_sha256: candidate.attempt_record_sha256, replay: true };
    const allowed = {
      claimed: ["submitted"],
      submitted: ["succeeded", "failed", "unknown"],
      succeeded: [],
      failed: [],
      unknown: [],
    };
    if (!allowed[previous.status].includes(next.status)) fail("style_master_attempt_transition_invalid", "candidate attempt transition is not monotonic");
    if (previous.status === "claimed" && next.status === "submitted" && next.provider_request_sha256 === null) {
      fail("style_master_attempt_transition_invalid", "submitted attempt requires a provider request digest");
    }
    if (previous.status === "submitted" && next.provider_request_sha256 !== previous.provider_request_sha256) {
      fail("style_master_attempt_transition_invalid", "terminal attempt must retain the submitted provider request digest");
    }
    return { attempt_record_sha256: candidate.attempt_record_sha256, replay: false };
  });
}

export function validateStyleMasterLocalProvenance(record) {
  return validation(() => {
    assertExactKeys(record, ["schema", "kind", "source_asset", "candidate_sha256", "candidate_media_type", "candidate_width", "candidate_height"], "local provenance");
    if (record.schema !== STYLE_MASTER_LOCAL_PROVENANCE_SCHEMA || record.kind !== "local-existing" || record.source_asset !== "visual-style/style_master.jpg") {
      fail("style_master_provenance_invalid", "local provenance does not have the canonical local-existing shape");
    }
    assertSha256(record.candidate_sha256, "candidate_sha256");
    assertMedia(record.candidate_media_type);
    assertDimensions(record.candidate_width, record.candidate_height);
    return { candidate_provenance_sha256: canonicalJsonSha256(record) };
  });
}

export function validateStyleMasterGeneratedProvenance(record, { plan = null, attempt = null } = {}) {
  return validation(() => {
    assertExactKeys(record, [
      "schema", "kind", "plan_sha256", "candidate_id", "compiled_prompt_sha256", "candidate_generation_profile_sha256",
      "provider_request_sha256", "candidate_sha256", "candidate_media_type", "candidate_width", "candidate_height",
    ], "generated provenance");
    if (record.schema !== STYLE_MASTER_GENERATED_PROVENANCE_SCHEMA || record.kind !== "generated") {
      fail("style_master_provenance_invalid", "generated provenance schema is invalid");
    }
    for (const field of ["plan_sha256", "compiled_prompt_sha256", "provider_request_sha256", "candidate_sha256"]) {
      assertSha256(record[field], field);
    }
    assertSha256(record.candidate_generation_profile_sha256, "candidate_generation_profile_sha256");
    assertGeneratedCandidateId(record.candidate_id);
    if (record.candidate_media_type !== "image/png") {
      fail("style_master_provenance_invalid", "generated candidate must be a PNG");
    }
    assertDimensions(record.candidate_width, record.candidate_height);
    if (plan) {
      const checkedPlan = validateStyleMasterPlanRecord(plan);
      if (!checkedPlan.ok) fail(checkedPlan.code, checkedPlan.message);
      if (record.plan_sha256 !== plan.plan_sha256 || record.compiled_prompt_sha256 !== plan.compiled_prompt_sha256 ||
        record.candidate_generation_profile_sha256 !== plan.candidate_generation_profile_sha256 || !generatedCandidateIds(plan).includes(record.candidate_id)) {
        fail("style_master_provenance_invalid", "generated provenance does not cross-bind its plan");
      }
    }
    if (attempt) {
      const checkedAttempt = validateStyleMasterCandidateAttemptRecord(attempt, { plan });
      if (!checkedAttempt.ok) fail(checkedAttempt.code, checkedAttempt.message);
      if (attempt.status !== "succeeded" || attempt.candidate_id !== record.candidate_id || attempt.provider_request_sha256 !== record.provider_request_sha256 ||
        attempt.candidate_sha256 !== record.candidate_sha256) {
        fail("style_master_provenance_invalid", "generated provenance does not cross-bind its successful attempt");
      }
    }
    return { candidate_provenance_sha256: canonicalJsonSha256(record) };
  });
}

export function normalizeStyleMasterAbandonmentReason(value) {
  if (typeof value !== "string") throw new StyleMasterSchemaError("style_master_reason_invalid", "abandonment reason must be text");
  const normalized = value.normalize("NFC").replace(/\p{White_Space}+/gu, " ").trim();
  if (!normalized || /[\u0000-\u001f\u007f-\u009f]/u.test(normalized)) {
    throw new StyleMasterSchemaError("style_master_reason_invalid", "abandonment reason is empty or contains a control character");
  }
  if (Buffer.byteLength(normalized, "utf8") > 512) {
    throw new StyleMasterSchemaError("style_master_reason_invalid", "abandonment reason exceeds 512 UTF-8 bytes");
  }
  return normalized;
}

export function styleMasterReasonSha256(reason) {
  return sha256Bytes(Buffer.from(normalizeStyleMasterAbandonmentReason(reason), "utf8"));
}

export function validateStyleMasterAbandonmentRecord(record, { head = null, plan = null, grant = null, attempt = null } = {}) {
  return validation(() => {
    assertExactKeys(record, [
      "schema", "run_version", "workflow", "scope_head_sha256", "plan_sha256", "candidate_grant_sha256", "candidate_id",
      "unknown_attempt_sha256", "provider_request_sha256", "reason", "reason_sha256",
    ], "candidate abandonment");
    if (record.schema !== STYLE_MASTER_CANDIDATE_ABANDONMENT_SCHEMA) fail("style_master_abandonment_invalid", "abandonment schema is invalid");
    assertRunVersion(record.run_version);
    assertWorkflow(record.workflow);
    for (const field of ["scope_head_sha256", "plan_sha256", "candidate_grant_sha256", "unknown_attempt_sha256", "provider_request_sha256", "reason_sha256"]) {
      assertSha256(record[field], field);
    }
    assertGeneratedCandidateId(record.candidate_id);
    const normalizedReason = normalizeStyleMasterAbandonmentReason(record.reason);
    if (normalizedReason !== record.reason || styleMasterReasonSha256(record.reason) !== record.reason_sha256) {
      fail("style_master_abandonment_invalid", "abandonment reason bytes do not match reason_sha256");
    }
    if (plan) {
      const checkedPlan = validateStyleMasterPlanRecord(plan);
      if (!checkedPlan.ok) fail(checkedPlan.code, checkedPlan.message);
      if (record.run_version !== plan.run_version || record.workflow !== plan.workflow || record.plan_sha256 !== plan.plan_sha256) {
        fail("style_master_abandonment_invalid", "abandonment does not cross-bind its plan");
      }
    }
    if (head) {
      const checkedHead = validateStyleMasterHeadRecord(head, { plan });
      if (!checkedHead.ok) fail(checkedHead.code, checkedHead.message);
      if (record.scope_head_sha256 !== checkedHead.head_sha256) fail("style_master_abandonment_invalid", "abandonment does not bind the current scope head");
    }
    if (grant) {
      const checkedGrant = validateStyleMasterCandidateGrantRecord(grant, { plan });
      if (!checkedGrant.ok) fail(checkedGrant.code, checkedGrant.message);
      if (record.candidate_grant_sha256 !== checkedGrant.candidate_grant_sha256 || !grant.generated_candidate_ids.includes(record.candidate_id)) {
        fail("style_master_abandonment_invalid", "abandonment does not cross-bind its grant");
      }
    }
    if (attempt) {
      const checkedAttempt = validateStyleMasterCandidateAttemptRecord(attempt, { plan, grant });
      if (!checkedAttempt.ok) fail(checkedAttempt.code, checkedAttempt.message);
      if (attempt.status !== "unknown" || checkedAttempt.attempt_record_sha256 !== record.unknown_attempt_sha256 ||
        attempt.candidate_id !== record.candidate_id || attempt.provider_request_sha256 !== record.provider_request_sha256 ||
        (attempt.reason_sha256 !== null && attempt.reason_sha256 !== record.reason_sha256)) {
        fail("style_master_abandonment_invalid", "abandonment does not cross-bind its unknown attempt");
      }
    }
    return { abandonment_sha256: canonicalJsonSha256(record) };
  });
}

export function validateStyleMasterReviewDecisionRecord(record, { plan = null } = {}) {
  return validation(() => {
    assertExactKeys(record, ["schema", "run_version", "workflow", "plan_sha256", "decision", "candidate_id", "candidate_sha256", "previous_selection_sha256"], "review decision");
    if (record.schema !== STYLE_MASTER_REVIEW_DECISION_SCHEMA || !STYLE_MASTER_REVIEW_DECISIONS.includes(record.decision)) {
      fail("style_master_decision_invalid", "review decision schema or value is invalid");
    }
    assertRunVersion(record.run_version);
    assertWorkflow(record.workflow);
    assertSha256(record.plan_sha256, "plan_sha256");
    assertNullableSha256(record.previous_selection_sha256, "previous_selection_sha256");
    if (record.decision === "proceed") {
      assertCandidateId(record.candidate_id);
      assertSha256(record.candidate_sha256, "candidate_sha256");
    } else if (record.candidate_id !== null || record.candidate_sha256 !== null) {
      fail("style_master_decision_invalid", "repair and redirect decisions cannot select a candidate");
    }
    if (plan) {
      const checkedPlan = validateStyleMasterPlanRecord(plan);
      if (!checkedPlan.ok) fail(checkedPlan.code, checkedPlan.message);
      if (record.run_version !== plan.run_version || record.workflow !== plan.workflow || record.plan_sha256 !== plan.plan_sha256 ||
        record.previous_selection_sha256 !== plan.previous_selection_sha256) {
        fail("style_master_decision_invalid", "review decision does not cross-bind its plan");
      }
      if (record.decision === "proceed") {
        const candidate = plan.candidates.find((item) => item.candidate_id === record.candidate_id);
        if (!candidate || (candidate.kind === "local-existing" && candidate.candidate_sha256 !== record.candidate_sha256)) {
          fail("style_master_decision_invalid", "review decision candidate does not bind its plan");
        }
      }
    }
    return { review_decision_sha256: canonicalJsonSha256(record) };
  });
}

export function validateStyleMasterSelectionRecord(record, { plan = null, decision = null, expectedRunVersion = null, expectedWorkflow = null } = {}) {
  return validation(() => {
    assertExactKeys(record, [
      "schema", "run_version", "workflow", "plan_sha256", "candidate_id", "candidate_sha256", "candidate_media_type",
      "candidate_width", "candidate_height", "candidate_provenance_sha256", "style_intent_sha256", "style_context_sha256",
      "candidate_generation_profile_sha256", "previous_selection_sha256", "review_decision_sha256", "accepted_at",
    ], "Style Master selection");
    if (record.schema !== STYLE_MASTER_SELECTION_SCHEMA) fail("style_master_selection_invalid", "selection schema is invalid");
    assertRunVersion(record.run_version);
    assertWorkflow(record.workflow);
    for (const field of [
      "plan_sha256", "candidate_sha256", "candidate_provenance_sha256", "style_intent_sha256", "style_context_sha256",
      "review_decision_sha256",
    ]) assertSha256(record[field], field);
    assertSha256(record.candidate_generation_profile_sha256, "candidate_generation_profile_sha256");
    assertNullableSha256(record.previous_selection_sha256, "previous_selection_sha256");
    assertCandidateId(record.candidate_id);
    assertMedia(record.candidate_media_type);
    assertDimensions(record.candidate_width, record.candidate_height);
    assertValidIsoTimestamp(record.accepted_at);
    if (expectedRunVersion && record.run_version !== expectedRunVersion) fail("style_master_selection_invalid", "selection run_version does not match its state key");
    if (expectedWorkflow && record.workflow !== expectedWorkflow) fail("style_master_selection_invalid", "selection workflow does not match its bound source");
    if (plan) {
      const checkedPlan = validateStyleMasterPlanRecord(plan);
      if (!checkedPlan.ok) fail(checkedPlan.code, checkedPlan.message);
      const candidate = plan.candidates.find((item) => item.candidate_id === record.candidate_id);
      if (record.plan_sha256 !== plan.plan_sha256 || record.run_version !== plan.run_version || record.workflow !== plan.workflow ||
        record.style_intent_sha256 !== plan.style_intent_sha256 || record.style_context_sha256 !== plan.style_context_sha256 ||
        record.candidate_generation_profile_sha256 !== plan.candidate_generation_profile_sha256 ||
        record.previous_selection_sha256 !== plan.previous_selection_sha256 || !candidate) {
        fail("style_master_selection_invalid", "selection does not cross-bind its plan");
      }
      if (candidate.kind === "local-existing" && (candidate.candidate_sha256 !== record.candidate_sha256 ||
        candidate.candidate_provenance_sha256 !== record.candidate_provenance_sha256 || candidate.candidate_media_type !== record.candidate_media_type ||
        candidate.candidate_width !== record.candidate_width || candidate.candidate_height !== record.candidate_height)) {
        fail("style_master_selection_invalid", "selection local candidate does not bind its plan snapshot");
      }
    }
    if (decision) {
      const checkedDecision = validateStyleMasterReviewDecisionRecord(decision, { plan });
      if (!checkedDecision.ok) fail(checkedDecision.code, checkedDecision.message);
      if (decision.decision !== "proceed" || record.review_decision_sha256 !== checkedDecision.review_decision_sha256 ||
        record.candidate_id !== decision.candidate_id || record.candidate_sha256 !== decision.candidate_sha256 ||
        record.previous_selection_sha256 !== decision.previous_selection_sha256) {
        fail("style_master_selection_invalid", "selection does not cross-bind its proceed decision");
      }
    }
    return { selection_sha256: canonicalJsonSha256(record) };
  });
}
