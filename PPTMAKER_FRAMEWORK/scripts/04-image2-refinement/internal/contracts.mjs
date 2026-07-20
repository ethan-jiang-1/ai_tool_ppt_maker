import { createHash, randomUUID } from "node:crypto";
import { canonicalJson } from "../../shared/identity/canonical_json.mjs";

/**
 * Phase 4 is deliberately contract-heavy.  The values in this module are
 * pure data constructors/validators; filesystem and provider work lives in
 * the other private modules.
 */
export const REFINEMENT_PLAN_SCHEMA_V1 = "pptmaker-image2-refinement-plan-v1";
export const REFINEMENT_PLAN_SCHEMA_V2 = "pptmaker-image2-refinement-plan-v2";
export const REFINEMENT_PLAN_SCHEMA = REFINEMENT_PLAN_SCHEMA_V2;
export const REFINEMENT_AUTHORIZATION_SCHEMA_V1 = "pptmaker-image2-refinement-authorization-v1";
export const REFINEMENT_AUTHORIZATION_SCHEMA_V2 = "pptmaker-image2-refinement-authorization-v2";
export const REFINEMENT_AUTHORIZATION_SCHEMA = REFINEMENT_AUTHORIZATION_SCHEMA_V2;
export const REFINEMENT_ATTEMPT_SCHEMA = "pptmaker-image2-refinement-attempt-v1";
export const REFINEMENT_CANDIDATE_SCHEMA = "pptmaker-image2-refinement-candidate-v1";
export const REFINEMENT_REVIEW_SCHEMA = "pptmaker-image2-refinement-review-v1";
export const REFINEMENT_PROVENANCE_SCHEMA = "pptmaker-image2-refinement-provenance-v1";
export const REFINEMENT_PROMOTION_JOURNAL_SCHEMA = "pptmaker-image2-refinement-promotion-journal-v1";
export const REFINEMENT_STATE_SCHEMA_V1 = "pptmaker-image2-refinement-state-v1";
export const REFINEMENT_STATE_SCHEMA_V2 = "pptmaker-image2-refinement-state-v2";
export const REFINEMENT_STATE_SCHEMA = REFINEMENT_STATE_SCHEMA_V2;

export const ATTEMPT_STATES = Object.freeze([
  "planned",
  "submitting",
  "submitted",
  "failed",
  "unknown-submit",
]);
export const REVIEW_DECISIONS = Object.freeze(["pending", "accept", "use-html"]);
export const UNKNOWN_SUBMIT_DECISIONS = Object.freeze(["retain", "abandon"]);
export const REFINEMENT_TARGETS = Object.freeze(["style-reference", "visual-slots"]);

const SAFE_ID_RE = /^[A-Za-z][A-Za-z0-9_-]{0,127}$/;
const VERSION_RE = /^v[1-9][0-9]*$/;
const SHA256_RE = /^[0-9a-f]{64}$/;
const FINGERPRINT_RE = /^[A-Za-z0-9_-]{1,256}$/;
const SECRET_KEY_RE = /(?:key|token|secret|password|authorization|credential|prompt_body|response_body)/i;
const WAIVED_CHECK_CODE_RE = /^[a-z][a-z0-9_]{0,63}$/;
const WAIVED_CHECK_SUBJECT_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const WAIVED_CHECK_SUBJECT_KINDS = new Set(["gate", "slide", "recipe", "artifact", "receipt"]);

export class RefinementContractError extends Error {
  constructor(message, code = "invalid_refinement_contract", details = undefined) {
    super(message);
    this.name = "RefinementContractError";
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}

export function sha256(value) {
  return createHash("sha256")
    .update(typeof value === "string" || Buffer.isBuffer(value) ? value : canonicalJson(value))
    .digest("hex");
}

export function isSha256(value) { return SHA256_RE.test(String(value || "")); }
export function isSafeRefinementId(value) { return typeof value === "string" && SAFE_ID_RE.test(value); }
export function isNormalizedVersion(value) { return VERSION_RE.test(String(value || "")); }

/** Shared durable waiver shape used by HTML delivery and optional Phase 4. */
export function canonicalWaivedChecks(value) {
  if (!Array.isArray(value) || value.length > 64) {
    throw new RefinementContractError("waived_checks must contain at most 64 entries", "invalid_prerequisite");
  }
  const checks = value.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry) || Object.keys(entry).length !== 2 || !Object.hasOwn(entry, "code") || !Object.hasOwn(entry, "subject") || !WAIVED_CHECK_CODE_RE.test(entry.code || "")) {
      throw new RefinementContractError("waived_checks entry is invalid", "invalid_prerequisite");
    }
    if (entry.subject === null) return { code: entry.code, subject: null };
    if (!entry.subject || typeof entry.subject !== "object" || Array.isArray(entry.subject) || Object.keys(entry.subject).length !== 2 || !WAIVED_CHECK_SUBJECT_KINDS.has(entry.subject.kind) || !WAIVED_CHECK_SUBJECT_ID_RE.test(entry.subject.id || "")) {
      throw new RefinementContractError("waived_checks subject is invalid", "invalid_prerequisite");
    }
    return { code: entry.code, subject: { kind: entry.subject.kind, id: entry.subject.id } };
  }).sort((left, right) => {
    const leftKey = `${left.code}\u0000${left.subject?.kind || ""}\u0000${left.subject?.id || ""}`;
    const rightKey = `${right.code}\u0000${right.subject?.kind || ""}\u0000${right.subject?.id || ""}`;
    return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
  });
  if (checks.some((entry, index) => index > 0 && canonicalJson(entry) === canonicalJson(checks[index - 1]))) {
    throw new RefinementContractError("waived_checks must be duplicate-free", "invalid_prerequisite");
  }
  return Object.freeze(checks.map((entry) => Object.freeze({ code: entry.code, subject: entry.subject ? Object.freeze(entry.subject) : null })));
}

export function normalizePrerequisiteWaiver(value) {
  object(value, "prerequisite waiver");
  const keys = ["reason", "waived_checks", "run_version", "html_production_reset_id", "html_delivery_digest", "recorded_at"];
  rejectUnknown(value, new Set(keys), "prerequisite waiver");
  if (Object.keys(value).length !== keys.length || keys.some((key) => !Object.hasOwn(value, key))) {
    throw new RefinementContractError("prerequisite waiver must use its exact field set", "invalid_prerequisite");
  }
  const reason = requiredString(value.reason, "prerequisite waiver reason", { max: 1024 });
  const checks = canonicalWaivedChecks(value.waived_checks);
  if (!checks.length || canonicalJson(checks) !== canonicalJson(value.waived_checks)) {
    throw new RefinementContractError("prerequisite waiver checks must be non-empty and canonical", "invalid_prerequisite");
  }
  const runVersion = requiredString(value.run_version, "prerequisite waiver run_version");
  if (!VERSION_RE.test(runVersion)) throw new RefinementContractError("prerequisite waiver run_version must be normalized vN", "invalid_prerequisite");
  if (value.html_production_reset_id !== null && !SHA256_RE.test(value.html_production_reset_id || "")) {
    throw new RefinementContractError("prerequisite waiver reset ID must be null or SHA-256", "invalid_prerequisite");
  }
  const deliveryDigest = shaFingerprint(value.html_delivery_digest, "prerequisite waiver delivery digest");
  if (typeof value.recorded_at !== "string" || !value.recorded_at || Number.isNaN(Date.parse(value.recorded_at))) {
    throw new RefinementContractError("prerequisite waiver recorded_at must be UTC ISO-8601", "invalid_prerequisite");
  }
  return Object.freeze({
    reason,
    waived_checks: checks,
    run_version: runVersion,
    html_production_reset_id: value.html_production_reset_id,
    html_delivery_digest: deliveryDigest,
    recorded_at: value.recorded_at,
  });
}

export function prerequisiteWaiverFingerprint(value) {
  const waiver = normalizePrerequisiteWaiver(value);
  return sha256({
    reason: waiver.reason,
    waived_checks: waiver.waived_checks,
    run_version: waiver.run_version,
    html_production_reset_id: waiver.html_production_reset_id,
    html_delivery_digest: waiver.html_delivery_digest,
  });
}

function object(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new RefinementContractError(`${label} must be an object`);
  }
  return value;
}

function rejectUnknown(value, allowed, label) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new RefinementContractError(`${label} does not accept ${key}`, "invalid_fields", { field: key });
  }
}

function requiredString(value, label, { id = false, max = 256 } = {}) {
  if (typeof value !== "string" || !value.trim() || value.length > max) {
    throw new RefinementContractError(`${label} must be a bounded non-empty string`);
  }
  const normalized = value.trim();
  if (id && !isSafeRefinementId(normalized)) throw new RefinementContractError(`${label} is not a safe refinement identifier`);
  return normalized;
}

function fingerprint(value, label, { required = false } = {}) {
  if (value == null || value === "") {
    if (required) throw new RefinementContractError(`${label} is required`);
    return "";
  }
  if (typeof value !== "string" || !FINGERPRINT_RE.test(value)) throw new RefinementContractError(`${label} must be a safe fingerprint`);
  return value;
}

function shaFingerprint(value, label) {
  const normalized = requiredString(value, label);
  if (!SHA256_RE.test(normalized)) throw new RefinementContractError(`${label} must be lowercase SHA-256`, "invalid_fingerprint");
  return normalized;
}

function cloneSlide(slide) {
  object(slide, "slide selection");
  const slideId = requiredString(slide.slide_id ?? slide.slideId, "slide_id", { id: true });
  const slot = requiredString(slide.slot ?? slide.slot_id ?? slide.slotId, "slot", { id: true, max: 96 });
  const visualContract = fingerprint(slide.visual_contract_fingerprint ?? slide.visualContractFingerprint, "visual_contract_fingerprint");
  const candidateIds = slide.candidate_ids ?? slide.candidates;
  if (candidateIds != null && (!Array.isArray(candidateIds) || candidateIds.length > 1)) {
    throw new RefinementContractError("each selected slide may have at most one candidate", "invalid_scope");
  }
  return {
    slide_id: slideId,
    slot,
    ...(visualContract ? { visual_contract_fingerprint: visualContract } : { visual_contract_fingerprint: "" }),
  };
}

export function validateRefinementEligibility(input) {
  object(input, "refinement eligibility");
  const marked = input.marked_html_first ?? input.markedHtmlFirst ?? input.html_first;
  if (marked !== true) throw new RefinementContractError("modern refinement requires a marked HTML-first run", "ineligible_pipeline");
  const decision = input.delivery_review ?? input.deliveryReview ?? input.delivery_decision;
  if (decision !== "proceed") throw new RefinementContractError("current html-delivery-review: proceed is required", "ineligible_delivery");
  const runVersion = requiredString(input.run_version ?? input.runVersion, "run_version");
  if (!VERSION_RE.test(runVersion)) throw new RefinementContractError("run_version must be normalized vN", "invalid_version");
  return Object.freeze({ marked_html_first: true, delivery_review: "proceed", run_version: runVersion });
}

/**
 * Validate the deterministic part of a plan.  Random execution IDs are never
 * accepted here, which makes this function safe to call for previews.
 */
export function validatePlanInput(input) {
  object(input, "plan input");
  const allowed = new Set([
    "schema", "run_version", "runVersion", "delivery_digest", "deliveryDigest",
    "profile_fingerprint", "profileFingerprint", "style_reference_status",
    "styleReferenceStatus", "slides", "marked_html_first", "markedHtmlFirst",
    "delivery_review", "deliveryReview", "eligibility", "setup_attempts", "page_attempts",
    "plan_hash", "total_attempts", "prerequisite_waiver_fingerprint", "prerequisiteWaiverFingerprint",
  ]);
  rejectUnknown(input, allowed, "plan input");
  const schema = input.schema == null ? REFINEMENT_PLAN_SCHEMA : String(input.schema);
  if (![REFINEMENT_PLAN_SCHEMA_V1, REFINEMENT_PLAN_SCHEMA_V2].includes(schema)) {
    throw new RefinementContractError("refinement plan schema is invalid", "invalid_plan");
  }
  const slides = Array.isArray(input.slides) ? input.slides : [];
  if (slides.length < 2 || slides.length > 4) throw new RefinementContractError("refinement requires 2 to 4 slides", "invalid_scope");
  const normalizedSlides = slides.map(cloneSlide);
  const ids = new Set();
  for (const slide of normalizedSlides) {
    if (ids.has(slide.slide_id)) throw new RefinementContractError("selected slide IDs must be unique", "invalid_scope");
    ids.add(slide.slide_id);
  }
  const runVersion = requiredString(input.run_version ?? input.runVersion, "run_version");
  if (!VERSION_RE.test(runVersion)) throw new RefinementContractError("run_version must be normalized vN", "invalid_version");
  const styleStatus = String(input.style_reference_status ?? input.styleReferenceStatus ?? "missing");
  if (!["current", "missing", "stale", "failed", "unknown"].includes(styleStatus)) {
    throw new RefinementContractError("style_reference_status is invalid", "invalid_prerequisite");
  }
  const marked = input.marked_html_first ?? input.markedHtmlFirst;
  if (marked != null && marked !== true) throw new RefinementContractError("modern refinement requires a marked HTML-first run", "ineligible_pipeline");
  const delivery = input.delivery_review ?? input.deliveryReview;
  if (delivery != null && delivery !== "proceed") throw new RefinementContractError("current html-delivery-review: proceed is required", "ineligible_delivery");
  const prerequisiteWaiverFingerprint = input.prerequisite_waiver_fingerprint ?? input.prerequisiteWaiverFingerprint ?? null;
  if (schema === REFINEMENT_PLAN_SCHEMA_V1 && prerequisiteWaiverFingerprint !== null) {
    throw new RefinementContractError("v1 refinement plans cannot bind a prerequisite waiver", "invalid_plan");
  }
  if (prerequisiteWaiverFingerprint !== null && !SHA256_RE.test(prerequisiteWaiverFingerprint || "")) {
    throw new RefinementContractError("prerequisite_waiver_fingerprint must be lowercase SHA-256 or null", "invalid_prerequisite");
  }
  return Object.freeze({
    schema,
    run_version: runVersion,
    delivery_digest: fingerprint(input.delivery_digest ?? input.deliveryDigest, "delivery_digest"),
    profile_fingerprint: shaFingerprint(input.profile_fingerprint ?? input.profileFingerprint, "profile_fingerprint"),
    style_reference_status: styleStatus,
    slides: normalizedSlides.sort((a, b) => a.slide_id.localeCompare(b.slide_id)),
    ...(schema === REFINEMENT_PLAN_SCHEMA_V2 ? { prerequisite_waiver_fingerprint: prerequisiteWaiverFingerprint } : {}),
  });
}

export function canonicalPlanPayload(plan) {
  const normalized = validatePlanInput({
    schema: plan.schema,
    run_version: plan.run_version,
    delivery_digest: plan.delivery_digest,
    profile_fingerprint: plan.profile_fingerprint,
    style_reference_status: plan.style_reference_status,
    slides: plan.slides,
    ...(plan.schema === REFINEMENT_PLAN_SCHEMA_V2 ? { prerequisite_waiver_fingerprint: plan.prerequisite_waiver_fingerprint ?? null } : {}),
  });
  const setupAttempts = plan.setup_attempts ?? (normalized.style_reference_status === "current" ? 0 : 1);
  const pageAttempts = plan.page_attempts ?? normalized.slides.length;
  if (!Number.isSafeInteger(setupAttempts) || setupAttempts < 0 || setupAttempts > 1) throw new RefinementContractError("setup_attempts must be 0 or 1", "invalid_attempt_count");
  const expectedSetupAttempts = normalized.style_reference_status === "current" ? 0 : 1;
  if (setupAttempts !== expectedSetupAttempts) throw new RefinementContractError("setup_attempts must match style_reference_status", "invalid_attempt_count");
  if (pageAttempts !== normalized.slides.length) throw new RefinementContractError("page_attempts must equal selected slide count", "invalid_attempt_count");
  return Object.freeze({ ...normalized, setup_attempts: setupAttempts, page_attempts: pageAttempts, total_attempts: setupAttempts + pageAttempts });
}

export function buildPlan(input) {
  const plan = canonicalPlanPayload(validatePlanInput(input));
  const plan_hash = sha256({
    schema: plan.schema,
    run_version: plan.run_version,
    delivery_digest: plan.delivery_digest,
    profile_fingerprint: plan.profile_fingerprint,
    style_reference_status: plan.style_reference_status,
    slides: plan.slides,
    setup_attempts: plan.setup_attempts,
    page_attempts: plan.page_attempts,
    ...(plan.schema === REFINEMENT_PLAN_SCHEMA_V2 ? { prerequisite_waiver_fingerprint: plan.prerequisite_waiver_fingerprint } : {}),
  });
  return Object.freeze({ ...plan, plan_hash });
}

export function recommendRefinementSlides(slides, { min = 2, max = 4 } = {}) {
  if (!Array.isArray(slides)) throw new RefinementContractError("recommendation slides must be an array", "invalid_scope");
  const candidates = slides.map(cloneSlide);
  if (candidates.length < min) throw new RefinementContractError(`refinement recommendation requires at least ${min} eligible slides`, "invalid_scope");
  return Object.freeze(candidates.slice(0, max).sort((a, b) => a.slide_id.localeCompare(b.slide_id)));
}

function randomId(prefix) { return `${prefix}-${randomUUID()}`; }

export function authorizePlan(planInput, authorizationId = randomId("auth"), { now = new Date().toISOString() } = {}) {
  if (!planInput || typeof planInput !== "object" || Array.isArray(planInput)) {
    throw new RefinementContractError("authorization requires an exact plan", "invalid_plan");
  }
  const suppliedHash = planInput.plan_hash || null;
  const plan = buildPlan(planInput);
  if (suppliedHash !== null && suppliedHash !== plan.plan_hash) {
    throw new RefinementContractError("authorization plan hash does not match the canonical plan", "stale_plan");
  }
  if (!isSha256(plan.plan_hash)) throw new RefinementContractError("plan hash is required", "invalid_plan");
  const authId = requiredString(authorizationId, "authorization_id", { id: true });
  const attempts = [];
  if (plan.setup_attempts) attempts.push({ attempt_id: randomId("attempt"), kind: "style-reference", state: "planned" });
  for (const slide of plan.slides) attempts.push({ attempt_id: randomId("attempt"), kind: "slot", slide_id: slide.slide_id, slot: slide.slot, state: "planned" });
  return Object.freeze({
    schema: plan.schema === REFINEMENT_PLAN_SCHEMA_V1
      ? REFINEMENT_AUTHORIZATION_SCHEMA_V1
      : REFINEMENT_AUTHORIZATION_SCHEMA_V2,
    authorization_id: authId,
    plan_hash: plan.plan_hash,
    state: "authorized",
    authorized_at: now,
    used: false,
    attempts: Object.freeze(attempts.map(Object.freeze)),
  });
}

const TRANSITIONS = Object.freeze({
  planned: Object.freeze(["submitting"]),
  submitting: Object.freeze(["submitted", "failed", "unknown-submit"]),
  submitted: Object.freeze([]),
  failed: Object.freeze([]),
  // Reconciliation may prove the already-submitted attempt succeeded or
  // failed. It may never reopen the attempt for another submission.
  "unknown-submit": Object.freeze(["submitted", "failed"]),
});

export function transitionAttempt(attempt, next, patch = {}) {
  object(attempt, "attempt");
  if (!ATTEMPT_STATES.includes(next)) throw new RefinementContractError("unknown attempt state", "invalid_attempt_state");
  if (!TRANSITIONS[attempt.state]?.includes(next)) throw new RefinementContractError("attempt transition is not allowed", "invalid_attempt_transition");
  if (Object.keys(patch).some((key) => SECRET_KEY_RE.test(key))) throw new RefinementContractError("attempt patch contains secret-bearing field", "unsafe_receipt");
  const safePatch = { ...patch };
  if (Object.hasOwn(safePatch, "receipt")) safePatch.receipt = sanitizeReceipt(safePatch.receipt);
  return Object.freeze({ ...attempt, ...safePatch, state: next, updated_at: safePatch.updated_at || new Date().toISOString() });
}

export function validateAttempt(attempt) {
  object(attempt, "attempt");
  if (attempt.schema != null && attempt.schema !== REFINEMENT_ATTEMPT_SCHEMA) throw new RefinementContractError("attempt schema is invalid");
  requiredString(attempt.attempt_id, "attempt_id", { id: true });
  requiredString(attempt.authorization_id, "authorization_id", { id: true });
  requiredString(attempt.plan_hash, "plan_hash");
  if (!isSha256(attempt.plan_hash)) throw new RefinementContractError("attempt plan_hash must be lowercase SHA-256", "invalid_attempt");
  if (!ATTEMPT_STATES.includes(attempt.state)) throw new RefinementContractError("attempt state is invalid");
  if (!["style-reference", "slot"].includes(attempt.kind)) throw new RefinementContractError("attempt kind is invalid");
  if (attempt.kind === "slot") {
    requiredString(attempt.slide_id, "attempt.slide_id", { id: true });
    requiredString(attempt.slot, "attempt.slot", { id: true, max: 96 });
  }
  return true;
}

export function createCandidateRecord(input) {
  object(input, "candidate");
  const allowed = new Set(["candidate_id", "attempt_id", "authorization_id", "plan_hash", "run_version", "slide_id", "slot", "sha256", "media", "width", "height", "profile_fingerprint", "created_at", "receipt"]);
  rejectUnknown(input, allowed, "candidate");
  const candidate = {
    schema: REFINEMENT_CANDIDATE_SCHEMA,
    candidate_id: requiredString(input.candidate_id, "candidate_id", { id: true }),
    attempt_id: requiredString(input.attempt_id, "attempt_id", { id: true }),
    authorization_id: requiredString(input.authorization_id, "authorization_id", { id: true }),
    plan_hash: requiredString(input.plan_hash, "plan_hash"),
    run_version: requiredString(input.run_version, "run_version"),
    slide_id: requiredString(input.slide_id, "slide_id", { id: true }),
    slot: requiredString(input.slot, "slot", { id: true, max: 96 }),
    sha256: requiredString(input.sha256, "candidate.sha256"),
    media: ["image/png", "image/jpeg"].includes(input.media) ? input.media : "image/png",
    width: Number.isSafeInteger(input.width) && input.width > 0 ? input.width : null,
    height: Number.isSafeInteger(input.height) && input.height > 0 ? input.height : null,
    profile_fingerprint: shaFingerprint(input.profile_fingerprint, "candidate.profile_fingerprint"),
    created_at: requiredString(input.created_at || new Date().toISOString(), "candidate.created_at"),
  };
  if (!isNormalizedVersion(candidate.run_version)) throw new RefinementContractError("candidate run_version must be normalized vN", "invalid_candidate");
  if (!isSha256(candidate.plan_hash)) throw new RefinementContractError("candidate plan_hash must be lowercase SHA-256", "invalid_candidate");
  if (!isSha256(candidate.sha256)) throw new RefinementContractError("candidate SHA must be lowercase SHA-256", "invalid_candidate");
  if (input.receipt !== undefined) candidate.receipt = sanitizeReceipt(input.receipt);
  return Object.freeze(candidate);
}

export function sanitizeReceipt(receipt) {
  if (receipt == null) return null;
  object(receipt, "receipt");
  const out = {};
  for (const [key, value] of Object.entries(receipt)) {
    if (SECRET_KEY_RE.test(key)) continue;
    if (typeof value === "string" && /(prompt|response|body|credential|token|key)/i.test(key)) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null) out[key] = value;
  }
  return Object.freeze(out);
}

export function createReviewRecord(input) {
  object(input, "review");
  const decision = input.decision || "pending";
  if (!REVIEW_DECISIONS.includes(decision)) throw new RefinementContractError("review decision is invalid", "invalid_review");
  const candidateSha = requiredString(input.candidate_sha256, "candidate_sha256");
  if (!isSha256(candidateSha)) throw new RefinementContractError("candidate_sha256 must be lowercase SHA-256", "invalid_review");
  const comparisonSha = input.comparison_sha256 == null ? null : requiredString(input.comparison_sha256, "comparison_sha256");
  if (comparisonSha !== null && !isSha256(comparisonSha)) throw new RefinementContractError("comparison_sha256 must be lowercase SHA-256", "invalid_review");
  if (!isNormalizedVersion(input.run_version)) throw new RefinementContractError("review run_version must be normalized vN", "invalid_review");
  return Object.freeze({
    schema: REFINEMENT_REVIEW_SCHEMA,
    run_version: requiredString(input.run_version, "run_version"),
    slide_id: requiredString(input.slide_id, "slide_id", { id: true }),
    slot: requiredString(input.slot, "slot", { id: true, max: 96 }),
    candidate_id: requiredString(input.candidate_id, "candidate_id", { id: true }),
    candidate_sha256: candidateSha,
    comparison_sha256: comparisonSha,
    decision,
    ...(input.created_at ? { created_at: requiredString(input.created_at, "created_at") } : {}),
    reviewed_at: input.reviewed_at || new Date().toISOString(),
  });
}

export function safeProfileFingerprint(profile) {
  if (typeof profile === "string") return shaFingerprint(profile, "profile_fingerprint");
  object(profile, "profile");
  const safe = Object.fromEntries(Object.entries(profile).filter(([key]) => !SECRET_KEY_RE.test(key)).map(([key, value]) => [key, typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null ? value : String(value)]));
  return sha256(safe);
}

export function validateUnknownSubmitDecision(decision) {
  if (!UNKNOWN_SUBMIT_DECISIONS.includes(decision)) throw new RefinementContractError("unknown-submit decision must be retain or abandon", "invalid_unknown_submit_decision");
  return decision;
}

export { SHA256_RE };
