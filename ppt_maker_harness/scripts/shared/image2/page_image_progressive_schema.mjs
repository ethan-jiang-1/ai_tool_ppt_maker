import { canonicalJson, canonicalJsonSha256 } from "../identity/canonical_json.mjs";

export const PROGRESSIVE_RAW_WORK_PLAN_SCHEMA = "page-image-progressive-raw-work-plan";
export const PROGRESSIVE_RAW_SCOPE_HEAD_SCHEMA = "page-image-progressive-raw-scope-head";
export const PROGRESSIVE_RAW_BATCH_SCHEMA = "page-image-progressive-raw-batch-projection";
export const PROGRESSIVE_RAW_BATCH_GRANT_SCHEMA = "page-image-progressive-raw-batch-grant";
export const PROGRESSIVE_RAW_ITEM_ATTEMPT_SCHEMA = "page-image-progressive-raw-item-attempt";
export const PROGRESSIVE_RAW_MATERIALIZATION_PROVENANCE_SCHEMA = "page-image-progressive-raw-materialization-provenance";
export const PROGRESSIVE_RAW_PILOT_EVIDENCE_SCHEMA = "page-image-progressive-raw-pilot-evidence";
export const PROGRESSIVE_RAW_PILOT_DECISION_SCHEMA = "page-image-progressive-raw-pilot-decision";
export const PROGRESSIVE_RAW_COMPLETE_REVIEW_SCHEMA = "page-image-progressive-raw-complete-review";
export const PROGRESSIVE_ACCEPTED_RAW_EVIDENCE_SCHEMA = "page-image-progressive-accepted-raw-evidence";

export const PROGRESSIVE_RAW_WORKFLOWS = Object.freeze(["framed", "pure"]);
export const PROGRESSIVE_RAW_BATCH_KINDS = Object.freeze(["pilot", "expansion"]);
export const PROGRESSIVE_RAW_ATTEMPT_STATUSES = Object.freeze(["claimed", "submitted", "succeeded", "known_failure", "unknown"]);
export const PROGRESSIVE_RAW_PILOT_REVIEW_DECISIONS = Object.freeze(["proceed", "repair", "redirect"]);
export const PROGRESSIVE_RAW_COMPLETE_REVIEW_DECISIONS = Object.freeze(["proceed", "repair"]);

const SHA256_RE = /^[0-9a-f]{64}$/;
const RUN_VERSION_RE = /^v[1-9][0-9]*$/;
const SLIDE_ID_RE = /^[A-Za-z][A-Za-z0-9_-]{0,127}$/;
const IDEMPOTENCY_KEY_RE = /^page-image-workflow-[0-9a-f]{64}$/;
const PROVIDER_INPUT_BINDING_KEYS = Object.freeze([
  "compiled_provider_input_sha256",
  "provider_content_sha256",
  "visual_selection_sha256",
  "style_master_selection_sha256",
  "generation_profile_sha256",
  "header_policy_sha256",
  "page_presentation_sha256",
  "page_design_system_sha256",
  "local_header_profile_sha256",
  "protected_composition_sha256",
]);
const FORMER_PROVIDER_INPUT_BINDING_KEYS = Object.freeze(
  PROVIDER_INPUT_BINDING_KEYS.filter((field) => field !== "page_design_system_sha256"),
);
const CURRENT_BINDING_KIND = "current";
const FORMER_BINDING_KIND = "former_page_design_system_binding";

export class ProgressiveRawSchemaError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ProgressiveRawSchemaError";
    this.code = code;
  }
}

function fail(code, message) {
  throw new ProgressiveRawSchemaError(code, message);
}

function freeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const entry of Object.values(value)) freeze(entry);
  return Object.freeze(value);
}

function withSha(record, sha256) {
  Object.defineProperty(record, "sha256", {
    value: sha256,
    enumerable: false,
    configurable: false,
    writable: false,
  });
  return freeze(record);
}

function exactKeys(value, keys) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)) &&
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function assertDigest(value, field, { nullable = false } = {}) {
  if (nullable && value === null) return;
  if (!SHA256_RE.test(value || "")) fail("progressive_raw_invalid_digest", `${field} must be a lowercase SHA-256`);
}

function assertRunVersion(value) {
  if (!RUN_VERSION_RE.test(value || "")) fail("progressive_raw_invalid_run_version", "run_version must be a canonical vN");
}

function assertWorkflow(value) {
  if (!PROGRESSIVE_RAW_WORKFLOWS.includes(value)) fail("progressive_raw_invalid_workflow", "workflow must be framed | pure");
}

function assertSlideId(value, field = "slide_id") {
  if (!SLIDE_ID_RE.test(value || "")) fail("progressive_raw_invalid_slide_id", `${field} must be a stable formal slide ID`);
}

function assertOrderedIds(ids, field = "ordered_slide_ids", { allowEmpty = false } = {}) {
  if (!Array.isArray(ids) || (!allowEmpty && ids.length === 0) || ids.some((id) => !SLIDE_ID_RE.test(id || "")) || new Set(ids).size !== ids.length) {
    fail("progressive_raw_invalid_slide_order", `${field} must contain unique formal slide IDs`);
  }
}

function assertSubset(ids, available, field) {
  const allowed = new Set(available);
  if (ids.some((id) => !allowed.has(id))) fail("progressive_raw_invalid_scope", `${field} must be a subset of ordered_slide_ids`);
}

function sameOrder(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function rawPlanItemShape(item) {
  return exactKeys(item, ["slide_id", "raw_contract_sha256", "provider_input_binding"]);
}

function assertProviderInputBinding(binding, bindingKind = CURRENT_BINDING_KIND) {
  const keys = bindingKind === FORMER_BINDING_KIND
    ? FORMER_PROVIDER_INPUT_BINDING_KEYS
    : PROVIDER_INPUT_BINDING_KEYS;
  if (!exactKeys(binding, keys)) {
    fail("progressive_raw_invalid_provider_input_binding", "provider input binding has an invalid shape");
  }
  for (const field of keys.slice(0, 7)) assertDigest(binding[field], field);
  for (const field of keys.slice(7)) {
    if (binding[field] !== null) assertDigest(binding[field], field);
  }
}

function assertItems(items, ids, { plan = null, bindingKind = CURRENT_BINDING_KIND } = {}) {
  if (!Array.isArray(items) || items.length !== ids.length) {
    fail("progressive_raw_invalid_items", "items must cover ordered_slide_ids exactly");
  }
  const actualIds = [];
  for (const item of items) {
    if (!rawPlanItemShape(item)) {
      fail("progressive_raw_invalid_items", "each item must contain raw contract and provider input binding");
    }
    assertSlideId(item.slide_id);
    assertDigest(item.raw_contract_sha256, "raw_contract_sha256");
    assertProviderInputBinding(item.provider_input_binding, bindingKind);
    actualIds.push(item.slide_id);
  }
  if (!sameOrder(actualIds, ids)) fail("progressive_raw_invalid_items", "item order must equal ordered_slide_ids");
  if (plan) {
    const planItems = new Map(plan.items.map((item) => [item.slide_id, item]));
    for (const item of items) {
      const planItem = planItems.get(item.slide_id);
      if (!planItem || planItem.raw_contract_sha256 !== item.raw_contract_sha256 ||
        canonicalJson(planItem.provider_input_binding ?? null) !== canonicalJson(item.provider_input_binding ?? null)) {
        fail("progressive_raw_cross_bound", "item bindings do not match the referenced full plan");
      }
    }
  }
}

function commonPlanBinding(record, { plan = null, bindingKind = CURRENT_BINDING_KIND } = {}) {
  assertDigest(record.plan_sha256, "plan_sha256");
  assertRunVersion(record.run_version);
  assertDigest(record.source_receipt_sha256, "source_receipt_sha256");
  if (!Number.isInteger(record.source_epoch) || record.source_epoch <= 0) {
    fail("progressive_raw_invalid_source_epoch", "source_epoch must be positive");
  }
  assertWorkflow(record.workflow);
  assertDigest(record.provider_profile_sha256, "provider_profile_sha256");
  assertDigest(record.effective_style_master_sha256, "effective_style_master_sha256");
  assertDigest(record.source_execution_sha256, "source_execution_sha256");
  if (plan) {
    const checked = validateProgressiveRawWorkPlanWithBindingKind(plan, bindingKind);
    if (!checked.ok || checked.sha256 !== record.plan_sha256 ||
      plan.run_version !== record.run_version ||
      plan.source_receipt_sha256 !== record.source_receipt_sha256 ||
      plan.source_epoch !== record.source_epoch ||
      plan.workflow !== record.workflow ||
      plan.provider_profile_sha256 !== record.provider_profile_sha256 ||
      plan.effective_style_master_sha256 !== record.effective_style_master_sha256 ||
      plan.source_execution_sha256 !== record.source_execution_sha256) {
      fail("progressive_raw_cross_bound", "record does not bind the referenced full plan");
    }
  }
}

function coverageItems(items, ids, { plan = null } = {}) {
  if (!Array.isArray(items) || items.length !== ids.length) {
    fail("progressive_raw_invalid_coverage", "coverage must contain every ordered tuple exactly once");
  }
  const actualIds = [];
  for (const item of items) {
    if (!exactKeys(item, ["slide_id", "raw_contract_sha256", "raw_sha256", "materialization_provenance_sha256"])) {
      fail("progressive_raw_invalid_coverage", "coverage item shape is invalid");
    }
    assertSlideId(item.slide_id);
    assertDigest(item.raw_contract_sha256, "raw_contract_sha256");
    assertDigest(item.raw_sha256, "raw_sha256");
    assertDigest(item.materialization_provenance_sha256, "materialization_provenance_sha256");
    actualIds.push(item.slide_id);
  }
  if (!sameOrder(actualIds, ids)) fail("progressive_raw_invalid_coverage", "coverage order must equal the bound ordered IDs");
  if (plan) {
    const contracts = new Map(plan.items.map((item) => [item.slide_id, item.raw_contract_sha256]));
    for (const item of items) {
      if (contracts.get(item.slide_id) !== item.raw_contract_sha256) {
        fail("progressive_raw_cross_bound", "coverage raw contract does not match the referenced full plan");
      }
    }
  }
}

function result(action) {
  try {
    const record = action();
    return freeze({ ok: true, sha256: canonicalJsonSha256(record) });
  } catch (error) {
    return freeze({ ok: false, code: error.code || "progressive_raw_record_invalid", message: error.message });
  }
}

function create(record, validator, options = undefined) {
  const checked = validator(record, options);
  if (!checked.ok) throw new ProgressiveRawSchemaError(checked.code, checked.message);
  return withSha(record, checked.sha256);
}

function validateProgressiveRawWorkPlanWithBindingKind(plan, bindingKind) {
  return result(() => {
    const hasTaskMandate = Object.hasOwn(plan || {}, "task_mandate_sha256");
    const keys = [
      "schema", "run_version", "source_receipt_sha256", "source_epoch", "workflow",
      "provider_profile_sha256", "effective_style_master_sha256", "source_execution_sha256",
      ...(hasTaskMandate ? ["task_mandate_sha256"] : []),
      "ordered_slide_ids", "items",
    ];
    if (plan?.schema !== PROGRESSIVE_RAW_WORK_PLAN_SCHEMA || !exactKeys(plan, keys)) {
      fail("progressive_raw_plan_invalid", "raw work plan has an invalid shape");
    }
    assertRunVersion(plan.run_version);
    assertDigest(plan.source_receipt_sha256, "source_receipt_sha256");
    if (!Number.isInteger(plan.source_epoch) || plan.source_epoch <= 0) fail("progressive_raw_plan_invalid", "source_epoch must be positive");
    assertWorkflow(plan.workflow);
    assertDigest(plan.provider_profile_sha256, "provider_profile_sha256");
    assertDigest(plan.effective_style_master_sha256, "effective_style_master_sha256");
    assertDigest(plan.source_execution_sha256, "source_execution_sha256");
    if (hasTaskMandate) assertDigest(plan.task_mandate_sha256, "task_mandate_sha256");
    assertOrderedIds(plan.ordered_slide_ids);
    assertItems(plan.items, plan.ordered_slide_ids, { bindingKind });
    return plan;
  });
}

export function validateProgressiveRawWorkPlan(plan) {
  return validateProgressiveRawWorkPlanWithBindingKind(plan, CURRENT_BINDING_KIND);
}

export function validateFormerProgressiveRawWorkPlan(plan) {
  return validateProgressiveRawWorkPlanWithBindingKind(plan, FORMER_BINDING_KIND);
}

export function createProgressiveRawWorkPlan(input = {}) {
  const hasTaskMandate = Object.hasOwn(input, "task_mandate_sha256");
  const taskMandate = input.task_mandate_sha256;
  return create({
    schema: PROGRESSIVE_RAW_WORK_PLAN_SCHEMA,
    run_version: input.run_version,
    source_receipt_sha256: input.source_receipt_sha256,
    source_epoch: input.source_epoch,
    workflow: input.workflow,
    provider_profile_sha256: input.provider_profile_sha256,
    effective_style_master_sha256: input.effective_style_master_sha256,
    source_execution_sha256: input.source_execution_sha256,
    ...(hasTaskMandate ? { task_mandate_sha256: taskMandate } : {}),
    ordered_slide_ids: input.ordered_slide_ids,
    items: input.items,
  }, validateProgressiveRawWorkPlan);
}

function validateProgressiveRawScopeHeadWithBindingKind(head, { plan = null } = {}, bindingKind) {
  return result(() => {
    if (!exactKeys(head, ["schema", "run_version", "workflow", "plan_sha256", "plan_generation", "previous_plan_sha256"]) ||
      head.schema !== PROGRESSIVE_RAW_SCOPE_HEAD_SCHEMA) {
      fail("progressive_raw_head_invalid", "scope head has an invalid shape");
    }
    assertRunVersion(head.run_version);
    assertWorkflow(head.workflow);
    assertDigest(head.plan_sha256, "plan_sha256");
    if (!Number.isInteger(head.plan_generation) || head.plan_generation <= 0) {
      fail("progressive_raw_head_invalid", "plan_generation must be positive");
    }
    assertDigest(head.previous_plan_sha256, "previous_plan_sha256", { nullable: true });
    if (head.previous_plan_sha256 === head.plan_sha256) fail("progressive_raw_head_invalid", "a scope head cannot point to itself as predecessor");
    if (plan) {
      const checked = validateProgressiveRawWorkPlanWithBindingKind(plan, bindingKind);
      if (!checked.ok || checked.sha256 !== head.plan_sha256 || plan.run_version !== head.run_version || plan.workflow !== head.workflow) {
        fail("progressive_raw_cross_bound", "scope head does not bind the referenced raw work plan");
      }
    }
    return head;
  });
}

export function validateProgressiveRawScopeHead(head, options = {}) {
  return validateProgressiveRawScopeHeadWithBindingKind(head, options, CURRENT_BINDING_KIND);
}

export function validateFormerProgressiveRawScopeHead(head, options = {}) {
  return validateProgressiveRawScopeHeadWithBindingKind(head, options, FORMER_BINDING_KIND);
}

export function createProgressiveRawScopeHead(input = {}, options = undefined) {
  return create({
    schema: PROGRESSIVE_RAW_SCOPE_HEAD_SCHEMA,
    run_version: input.run_version,
    workflow: input.workflow,
    plan_sha256: input.plan_sha256,
    plan_generation: input.plan_generation,
    previous_plan_sha256: input.previous_plan_sha256 ?? null,
  }, validateProgressiveRawScopeHead, options);
}

function validateProgressiveRawBatchWithBindingKind(batch, { plan = null } = {}, bindingKind) {
  return result(() => {
    if (!exactKeys(batch, [
      "schema", "plan_sha256", "run_version", "source_receipt_sha256", "source_epoch", "workflow",
      "provider_profile_sha256", "effective_style_master_sha256", "source_execution_sha256", "kind",
      "batch_generation", "previous_batch_sha256", "ordered_slide_ids", "items",
      "review_sample_slide_ids", "paid_submission_slide_ids", "maximum_submissions", "is_partial_pilot",
    ]) || batch.schema !== PROGRESSIVE_RAW_BATCH_SCHEMA) {
      fail("progressive_raw_batch_invalid", "batch projection has an invalid shape");
    }
    commonPlanBinding(batch, { plan, bindingKind });
    if (!PROGRESSIVE_RAW_BATCH_KINDS.includes(batch.kind)) fail("progressive_raw_batch_invalid", "batch kind must be pilot | expansion");
    if (typeof batch.is_partial_pilot !== "boolean" || (batch.kind !== "pilot" && batch.is_partial_pilot)) {
      fail("progressive_raw_batch_invalid", "only a Pilot batch may be marked partial");
    }
    if (!Number.isInteger(batch.batch_generation) || batch.batch_generation <= 0) fail("progressive_raw_batch_invalid", "batch_generation must be positive");
    assertDigest(batch.previous_batch_sha256, "previous_batch_sha256", { nullable: true });
    assertOrderedIds(batch.ordered_slide_ids);
    assertItems(batch.items, batch.ordered_slide_ids, { plan, bindingKind });
    assertOrderedIds(batch.review_sample_slide_ids, "review_sample_slide_ids");
    assertOrderedIds(batch.paid_submission_slide_ids, "paid_submission_slide_ids");
    assertSubset(batch.review_sample_slide_ids, batch.ordered_slide_ids, "review_sample_slide_ids");
    assertSubset(batch.paid_submission_slide_ids, batch.ordered_slide_ids, "paid_submission_slide_ids");
    assertSubset(batch.paid_submission_slide_ids, batch.review_sample_slide_ids, "paid_submission_slide_ids");
    if (!Number.isInteger(batch.maximum_submissions) || batch.maximum_submissions !== batch.paid_submission_slide_ids.length || batch.maximum_submissions <= 0) {
      fail("progressive_raw_batch_invalid", "maximum_submissions must equal the nonempty paid submission scope");
    }
    return batch;
  });
}

export function validateProgressiveRawBatch(batch, options = {}) {
  return validateProgressiveRawBatchWithBindingKind(batch, options, CURRENT_BINDING_KIND);
}

export function validateFormerProgressiveRawBatch(batch, options = {}) {
  return validateProgressiveRawBatchWithBindingKind(batch, options, FORMER_BINDING_KIND);
}

export function createProgressiveRawBatch(input = {}, options = undefined) {
  return create({
    schema: PROGRESSIVE_RAW_BATCH_SCHEMA,
    plan_sha256: input.plan_sha256,
    run_version: input.run_version,
    source_receipt_sha256: input.source_receipt_sha256,
    source_epoch: input.source_epoch,
    workflow: input.workflow,
    provider_profile_sha256: input.provider_profile_sha256,
    effective_style_master_sha256: input.effective_style_master_sha256,
    source_execution_sha256: input.source_execution_sha256,
    kind: input.kind,
    batch_generation: input.batch_generation,
    previous_batch_sha256: input.previous_batch_sha256 ?? null,
    ordered_slide_ids: input.ordered_slide_ids,
    items: input.items,
    review_sample_slide_ids: input.review_sample_slide_ids,
    paid_submission_slide_ids: input.paid_submission_slide_ids,
    maximum_submissions: input.maximum_submissions,
    is_partial_pilot: input.is_partial_pilot === true,
  }, validateProgressiveRawBatch, options);
}

function validateProgressiveRawBatchGrantWithBindingKind(grant, { plan = null, batch = null } = {}, bindingKind) {
  return result(() => {
    if (!exactKeys(grant, [
      "schema", "plan_sha256", "batch_sha256", "run_version", "source_receipt_sha256", "source_epoch",
      "workflow", "provider_profile_sha256", "effective_style_master_sha256", "source_execution_sha256",
      "ordered_slide_ids", "items", "maximum_submissions",
    ]) || grant.schema !== PROGRESSIVE_RAW_BATCH_GRANT_SCHEMA) {
      fail("progressive_raw_grant_invalid", "batch grant has an invalid shape");
    }
    commonPlanBinding(grant, { plan, bindingKind });
    assertDigest(grant.batch_sha256, "batch_sha256");
    assertOrderedIds(grant.ordered_slide_ids);
    assertItems(grant.items, grant.ordered_slide_ids, { plan, bindingKind });
    if (!Number.isInteger(grant.maximum_submissions) || grant.maximum_submissions <= 0) {
      fail("progressive_raw_grant_invalid", "maximum_submissions must be positive");
    }
    if (batch) {
      const checked = validateProgressiveRawBatchWithBindingKind(batch, { plan }, bindingKind);
      if (!checked.ok || checked.sha256 !== grant.batch_sha256 ||
        !sameOrder(batch.paid_submission_slide_ids, grant.ordered_slide_ids) ||
        batch.maximum_submissions !== grant.maximum_submissions ||
        !sameOrder(batch.items.filter((item) => batch.paid_submission_slide_ids.includes(item.slide_id)), grant.items)) {
        fail("progressive_raw_cross_bound", "grant does not bind the batch's exact paid tuple scope");
      }
    }
    return grant;
  });
}

export function validateProgressiveRawBatchGrant(grant, options = {}) {
  return validateProgressiveRawBatchGrantWithBindingKind(grant, options, CURRENT_BINDING_KIND);
}

export function validateFormerProgressiveRawBatchGrant(grant, options = {}) {
  return validateProgressiveRawBatchGrantWithBindingKind(grant, options, FORMER_BINDING_KIND);
}

export function createProgressiveRawBatchGrant(input = {}, options = undefined) {
  return create({
    schema: PROGRESSIVE_RAW_BATCH_GRANT_SCHEMA,
    plan_sha256: input.plan_sha256,
    batch_sha256: input.batch_sha256,
    run_version: input.run_version,
    source_receipt_sha256: input.source_receipt_sha256,
    source_epoch: input.source_epoch,
    workflow: input.workflow,
    provider_profile_sha256: input.provider_profile_sha256,
    effective_style_master_sha256: input.effective_style_master_sha256,
    source_execution_sha256: input.source_execution_sha256,
    ordered_slide_ids: input.ordered_slide_ids,
    items: input.items,
    maximum_submissions: input.maximum_submissions,
  }, validateProgressiveRawBatchGrant, options);
}

export function progressiveRawAttemptKey({ plan_sha256, batch_sha256, slide_id, raw_contract_sha256 } = {}) {
  assertDigest(plan_sha256, "plan_sha256");
  assertDigest(batch_sha256, "batch_sha256");
  assertSlideId(slide_id);
  assertDigest(raw_contract_sha256, "raw_contract_sha256");
  return canonicalJsonSha256({ schema: "page-image-progressive-raw-attempt-key", plan_sha256, batch_sha256, slide_id, raw_contract_sha256 });
}

export function progressiveRawIdempotencyKey({ attempt_key_sha256 } = {}) {
  assertDigest(attempt_key_sha256, "attempt_key_sha256");
  return `page-image-workflow-${attempt_key_sha256}`;
}

function validateProgressiveRawItemAttemptWithBindingKind(
  attempt,
  { plan = null, batch = null, grant = null } = {},
  bindingKind,
) {
  return result(() => {
    if (!exactKeys(attempt, [
      "schema", "attempt_key_sha256", "plan_sha256", "batch_sha256", "grant_sha256", "run_version",
      "source_receipt_sha256", "source_epoch", "workflow", "provider_profile_sha256",
      "effective_style_master_sha256", "source_execution_sha256", "slide_id", "raw_contract_sha256",
      "status", "previous_attempt_sha256", "provider_request_sha256", "provider_idempotency_key",
      "materialization_provenance_sha256",
    ]) || attempt.schema !== PROGRESSIVE_RAW_ITEM_ATTEMPT_SCHEMA) {
      fail("progressive_raw_attempt_invalid", "item attempt has an invalid shape");
    }
    commonPlanBinding(attempt, { plan, bindingKind });
    assertDigest(attempt.attempt_key_sha256, "attempt_key_sha256");
    assertDigest(attempt.batch_sha256, "batch_sha256");
    assertDigest(attempt.grant_sha256, "grant_sha256");
    assertSlideId(attempt.slide_id);
    assertDigest(attempt.raw_contract_sha256, "raw_contract_sha256");
    if (attempt.attempt_key_sha256 !== progressiveRawAttemptKey(attempt)) {
      fail("progressive_raw_attempt_invalid", "attempt_key_sha256 must bind its exact plan, batch, item, and raw contract");
    }
    if (!PROGRESSIVE_RAW_ATTEMPT_STATUSES.includes(attempt.status)) fail("progressive_raw_attempt_invalid", "attempt status is invalid");
    assertDigest(attempt.previous_attempt_sha256, "previous_attempt_sha256", { nullable: true });
    assertDigest(attempt.provider_request_sha256, "provider_request_sha256", { nullable: true });
    assertDigest(attempt.materialization_provenance_sha256, "materialization_provenance_sha256", { nullable: true });
    if (attempt.provider_idempotency_key !== null && !IDEMPOTENCY_KEY_RE.test(attempt.provider_idempotency_key)) {
      fail("progressive_raw_attempt_invalid", "provider_idempotency_key is invalid");
    }
    if (attempt.status === "claimed") {
      if (attempt.previous_attempt_sha256 !== null || attempt.provider_request_sha256 !== null ||
        attempt.provider_idempotency_key !== null || attempt.materialization_provenance_sha256 !== null) {
        fail("progressive_raw_attempt_invalid", "claimed attempt cannot contain submitted or terminal facts");
      }
    } else if (attempt.status === "submitted") {
      if (!attempt.previous_attempt_sha256 || !attempt.provider_request_sha256 ||
        attempt.provider_idempotency_key !== progressiveRawIdempotencyKey(attempt) ||
        attempt.materialization_provenance_sha256 !== null) {
        fail("progressive_raw_attempt_invalid", "submitted attempt requires its persisted request identity and claimed predecessor");
      }
    } else {
      if (!attempt.previous_attempt_sha256 || !attempt.provider_request_sha256 ||
        attempt.provider_idempotency_key !== progressiveRawIdempotencyKey(attempt)) {
        fail("progressive_raw_attempt_invalid", "terminal attempt requires its submitted predecessor and request identity");
      }
      if ((attempt.status === "succeeded") !== (attempt.materialization_provenance_sha256 !== null)) {
        fail("progressive_raw_attempt_invalid", "only succeeded attempts may bind materialization provenance");
      }
    }
    if (batch) {
      const checked = validateProgressiveRawBatchWithBindingKind(batch, { plan }, bindingKind);
      if (!checked.ok || checked.sha256 !== attempt.batch_sha256 ||
        !batch.paid_submission_slide_ids.includes(attempt.slide_id) ||
        batch.items.find((item) => item.slide_id === attempt.slide_id)?.raw_contract_sha256 !== attempt.raw_contract_sha256) {
        fail("progressive_raw_cross_bound", "attempt does not bind an exact batch paid tuple");
      }
    }
    if (grant) {
      const checked = validateProgressiveRawBatchGrantWithBindingKind(grant, { plan, batch }, bindingKind);
      if (!checked.ok || checked.sha256 !== attempt.grant_sha256 ||
        !grant.ordered_slide_ids.includes(attempt.slide_id) ||
        grant.items.find((item) => item.slide_id === attempt.slide_id)?.raw_contract_sha256 !== attempt.raw_contract_sha256) {
        fail("progressive_raw_cross_bound", "attempt does not bind an exact batch grant tuple");
      }
    }
    return attempt;
  });
}

export function validateProgressiveRawItemAttempt(attempt, options = {}) {
  return validateProgressiveRawItemAttemptWithBindingKind(attempt, options, CURRENT_BINDING_KIND);
}

export function validateFormerProgressiveRawItemAttempt(attempt, options = {}) {
  return validateProgressiveRawItemAttemptWithBindingKind(attempt, options, FORMER_BINDING_KIND);
}

export function createProgressiveRawItemAttempt(input = {}, options = undefined) {
  const attemptKey = input.attempt_key_sha256 || progressiveRawAttemptKey(input);
  return create({
    schema: PROGRESSIVE_RAW_ITEM_ATTEMPT_SCHEMA,
    attempt_key_sha256: attemptKey,
    plan_sha256: input.plan_sha256,
    batch_sha256: input.batch_sha256,
    grant_sha256: input.grant_sha256,
    run_version: input.run_version,
    source_receipt_sha256: input.source_receipt_sha256,
    source_epoch: input.source_epoch,
    workflow: input.workflow,
    provider_profile_sha256: input.provider_profile_sha256,
    effective_style_master_sha256: input.effective_style_master_sha256,
    source_execution_sha256: input.source_execution_sha256,
    slide_id: input.slide_id,
    raw_contract_sha256: input.raw_contract_sha256,
    status: input.status,
    previous_attempt_sha256: input.previous_attempt_sha256 ?? null,
    provider_request_sha256: input.provider_request_sha256 ?? null,
    provider_idempotency_key: input.provider_idempotency_key ?? null,
    materialization_provenance_sha256: input.materialization_provenance_sha256 ?? null,
  }, validateProgressiveRawItemAttempt, options);
}

export function createHistoricalCutoverProgressiveRawItemAttempt(input = {}, options = undefined) {
  if (!["succeeded", "known_failure", "unknown"].includes(input.status)) {
    throw new ProgressiveRawSchemaError(
      "progressive_raw_attempt_invalid",
      "historical-cutover attempt creation is limited to reconciliation-owned terminal outcomes",
    );
  }
  const attemptKey = input.attempt_key_sha256 || progressiveRawAttemptKey(input);
  return create({
    schema: PROGRESSIVE_RAW_ITEM_ATTEMPT_SCHEMA,
    attempt_key_sha256: attemptKey,
    plan_sha256: input.plan_sha256,
    batch_sha256: input.batch_sha256,
    grant_sha256: input.grant_sha256,
    run_version: input.run_version,
    source_receipt_sha256: input.source_receipt_sha256,
    source_epoch: input.source_epoch,
    workflow: input.workflow,
    provider_profile_sha256: input.provider_profile_sha256,
    effective_style_master_sha256: input.effective_style_master_sha256,
    source_execution_sha256: input.source_execution_sha256,
    slide_id: input.slide_id,
    raw_contract_sha256: input.raw_contract_sha256,
    status: input.status,
    previous_attempt_sha256: input.previous_attempt_sha256 ?? null,
    provider_request_sha256: input.provider_request_sha256 ?? null,
    provider_idempotency_key: input.provider_idempotency_key ?? null,
    materialization_provenance_sha256: input.materialization_provenance_sha256 ?? null,
  }, validateFormerProgressiveRawItemAttempt, options);
}

export function validateProgressiveRawAttemptTransition(previous, next) {
  return result(() => {
    const prior = validateProgressiveRawItemAttempt(previous);
    const following = validateProgressiveRawItemAttempt(next);
    if (!prior.ok || !following.ok) fail("progressive_raw_attempt_transition_invalid", "attempt transition contains an invalid record");
    if (previous.attempt_key_sha256 !== next.attempt_key_sha256 || previous.plan_sha256 !== next.plan_sha256 ||
      previous.batch_sha256 !== next.batch_sha256 || previous.grant_sha256 !== next.grant_sha256 ||
      previous.slide_id !== next.slide_id || previous.raw_contract_sha256 !== next.raw_contract_sha256) {
      fail("progressive_raw_attempt_transition_invalid", "attempt transition changes its immutable tuple");
    }
    if (next.previous_attempt_sha256 !== prior.sha256) fail("progressive_raw_attempt_transition_invalid", "attempt transition must reference its exact prior record");
    if ((previous.status === "claimed" && next.status === "submitted") ||
      (previous.status === "submitted" && ["succeeded", "known_failure", "unknown"].includes(next.status))) {
      return next;
    }
    fail("progressive_raw_attempt_transition_invalid", "attempt status transition is not monotonic");
  });
}

function validateProgressiveRawMaterializationProvenanceWithBindingKind(
  provenance,
  { plan = null, batch = null, grant = null, attempt = null } = {},
  bindingKind,
) {
  return result(() => {
    if (!exactKeys(provenance, [
      "schema", "kind", "plan_sha256", "run_version", "source_receipt_sha256", "source_epoch", "workflow",
      "provider_profile_sha256", "effective_style_master_sha256", "source_execution_sha256", "slide_id",
      "raw_contract_sha256", "raw_sha256", "batch_sha256", "grant_sha256", "attempt_key_sha256",
      "reused_from_provenance_sha256",
    ]) || provenance.schema !== PROGRESSIVE_RAW_MATERIALIZATION_PROVENANCE_SCHEMA) {
      fail("progressive_raw_provenance_invalid", "materialization provenance has an invalid shape");
    }
    commonPlanBinding(provenance, { plan, bindingKind });
    if (!["provider", "reuse"].includes(provenance.kind)) fail("progressive_raw_provenance_invalid", "provenance kind must be provider | reuse");
    assertSlideId(provenance.slide_id);
    assertDigest(provenance.raw_contract_sha256, "raw_contract_sha256");
    assertDigest(provenance.raw_sha256, "raw_sha256");
    assertDigest(provenance.batch_sha256, "batch_sha256", { nullable: true });
    assertDigest(provenance.grant_sha256, "grant_sha256", { nullable: true });
    assertDigest(provenance.attempt_key_sha256, "attempt_key_sha256", { nullable: true });
    assertDigest(provenance.reused_from_provenance_sha256, "reused_from_provenance_sha256", { nullable: true });
    if (provenance.kind === "provider") {
      if (!provenance.batch_sha256 || !provenance.grant_sha256 || !provenance.attempt_key_sha256 || provenance.reused_from_provenance_sha256 !== null) {
        fail("progressive_raw_provenance_invalid", "provider provenance requires batch, grant, and terminal attempt only");
      }
    } else if (provenance.batch_sha256 !== null || provenance.grant_sha256 !== null || provenance.attempt_key_sha256 !== null || !provenance.reused_from_provenance_sha256) {
      fail("progressive_raw_provenance_invalid", "reuse provenance requires exactly one prior provenance reference");
    }
    if (plan && plan.items.find((item) => item.slide_id === provenance.slide_id)?.raw_contract_sha256 !== provenance.raw_contract_sha256) {
      fail("progressive_raw_cross_bound", "provenance does not bind a current full-plan tuple");
    }
    if (batch && (batch.sha256 || canonicalJsonSha256(batch)) !== provenance.batch_sha256) {
      fail("progressive_raw_cross_bound", "provenance does not bind its batch");
    }
    if (grant && (grant.sha256 || canonicalJsonSha256(grant)) !== provenance.grant_sha256) {
      fail("progressive_raw_cross_bound", "provenance does not bind its grant");
    }
    if (attempt) {
      const checked = validateProgressiveRawItemAttemptWithBindingKind(attempt, { plan, batch, grant }, bindingKind);
      if (!checked.ok || attempt.attempt_key_sha256 !== provenance.attempt_key_sha256 || attempt.status !== "succeeded" ||
        attempt.materialization_provenance_sha256 !== canonicalJsonSha256(provenance)) {
        fail("progressive_raw_cross_bound", "provenance does not bind the terminal succeeded attempt");
      }
    }
    return provenance;
  });
}

export function validateProgressiveRawMaterializationProvenance(provenance, options = {}) {
  return validateProgressiveRawMaterializationProvenanceWithBindingKind(
    provenance,
    options,
    CURRENT_BINDING_KIND,
  );
}

export function validateFormerProgressiveRawMaterializationProvenance(provenance, options = {}) {
  return validateProgressiveRawMaterializationProvenanceWithBindingKind(
    provenance,
    options,
    FORMER_BINDING_KIND,
  );
}

export function createProgressiveRawMaterializationProvenance(input = {}, options = undefined) {
  return create({
    schema: PROGRESSIVE_RAW_MATERIALIZATION_PROVENANCE_SCHEMA,
    kind: input.kind,
    plan_sha256: input.plan_sha256,
    run_version: input.run_version,
    source_receipt_sha256: input.source_receipt_sha256,
    source_epoch: input.source_epoch,
    workflow: input.workflow,
    provider_profile_sha256: input.provider_profile_sha256,
    effective_style_master_sha256: input.effective_style_master_sha256,
    source_execution_sha256: input.source_execution_sha256,
    slide_id: input.slide_id,
    raw_contract_sha256: input.raw_contract_sha256,
    raw_sha256: input.raw_sha256,
    batch_sha256: input.batch_sha256 ?? null,
    grant_sha256: input.grant_sha256 ?? null,
    attempt_key_sha256: input.attempt_key_sha256 ?? null,
    reused_from_provenance_sha256: input.reused_from_provenance_sha256 ?? null,
  }, validateProgressiveRawMaterializationProvenance, options);
}

export function createHistoricalCutoverProgressiveRawMaterializationProvenance(input = {}, options = undefined) {
  return create({
    schema: PROGRESSIVE_RAW_MATERIALIZATION_PROVENANCE_SCHEMA,
    kind: input.kind,
    plan_sha256: input.plan_sha256,
    run_version: input.run_version,
    source_receipt_sha256: input.source_receipt_sha256,
    source_epoch: input.source_epoch,
    workflow: input.workflow,
    provider_profile_sha256: input.provider_profile_sha256,
    effective_style_master_sha256: input.effective_style_master_sha256,
    source_execution_sha256: input.source_execution_sha256,
    slide_id: input.slide_id,
    raw_contract_sha256: input.raw_contract_sha256,
    raw_sha256: input.raw_sha256,
    batch_sha256: input.batch_sha256 ?? null,
    grant_sha256: input.grant_sha256 ?? null,
    attempt_key_sha256: input.attempt_key_sha256 ?? null,
    reused_from_provenance_sha256: input.reused_from_provenance_sha256 ?? null,
  }, validateFormerProgressiveRawMaterializationProvenance, options);
}

function validatePilotCoverage(record, { plan = null, batch = null } = {}, bindingKind) {
  commonPlanBinding(record, { plan, bindingKind });
  assertDigest(record.batch_sha256, "batch_sha256");
  assertDigest(record.workflow_evidence_sha256, "workflow_evidence_sha256");
  assertDigest(record.projection_sha256, "projection_sha256");
  const ids = batch?.review_sample_slide_ids || record.ordered_slide_ids;
  assertOrderedIds(record.ordered_slide_ids);
  if (batch && (!sameOrder(record.ordered_slide_ids, ids) || (batch.sha256 || canonicalJsonSha256(batch)) !== record.batch_sha256)) {
    fail("progressive_raw_cross_bound", "Pilot evidence does not bind the batch review sample");
  }
  coverageItems(record.items, record.ordered_slide_ids, { plan });
}

function validateProgressiveRawPilotEvidenceWithBindingKind(
  evidence,
  { plan = null, batch = null } = {},
  bindingKind,
) {
  return result(() => {
    if (!exactKeys(evidence, [
      "schema", "plan_sha256", "batch_sha256", "run_version", "source_receipt_sha256", "source_epoch", "workflow",
      "provider_profile_sha256", "effective_style_master_sha256", "source_execution_sha256", "ordered_slide_ids",
      "items", "workflow_evidence_sha256", "projection_sha256",
    ]) || evidence.schema !== PROGRESSIVE_RAW_PILOT_EVIDENCE_SCHEMA) {
      fail("progressive_raw_pilot_evidence_invalid", "Pilot evidence has an invalid shape");
    }
    validatePilotCoverage(evidence, { plan, batch }, bindingKind);
    return evidence;
  });
}

export function validateProgressiveRawPilotEvidence(evidence, options = {}) {
  return validateProgressiveRawPilotEvidenceWithBindingKind(evidence, options, CURRENT_BINDING_KIND);
}

export function validateFormerProgressiveRawPilotEvidence(evidence, options = {}) {
  return validateProgressiveRawPilotEvidenceWithBindingKind(evidence, options, FORMER_BINDING_KIND);
}

export function createProgressiveRawPilotEvidence(input = {}, options = undefined) {
  return create({
    schema: PROGRESSIVE_RAW_PILOT_EVIDENCE_SCHEMA,
    plan_sha256: input.plan_sha256,
    batch_sha256: input.batch_sha256,
    run_version: input.run_version,
    source_receipt_sha256: input.source_receipt_sha256,
    source_epoch: input.source_epoch,
    workflow: input.workflow,
    provider_profile_sha256: input.provider_profile_sha256,
    effective_style_master_sha256: input.effective_style_master_sha256,
    source_execution_sha256: input.source_execution_sha256,
    ordered_slide_ids: input.ordered_slide_ids,
    items: input.items,
    workflow_evidence_sha256: input.workflow_evidence_sha256,
    projection_sha256: input.projection_sha256,
  }, validateProgressiveRawPilotEvidence, options);
}

function validateProgressiveRawPilotDecisionWithBindingKind(
  decision,
  { plan = null, batch = null, evidence = null } = {},
  bindingKind,
) {
  return result(() => {
    if (!exactKeys(decision, [
      "schema", "plan_sha256", "batch_sha256", "pilot_evidence_sha256", "run_version", "source_receipt_sha256",
      "source_epoch", "workflow", "provider_profile_sha256", "effective_style_master_sha256", "source_execution_sha256", "decision",
    ]) || decision.schema !== PROGRESSIVE_RAW_PILOT_DECISION_SCHEMA) {
      fail("progressive_raw_pilot_decision_invalid", "Pilot decision has an invalid shape");
    }
    commonPlanBinding(decision, { plan, bindingKind });
    assertDigest(decision.batch_sha256, "batch_sha256");
    assertDigest(decision.pilot_evidence_sha256, "pilot_evidence_sha256");
    if (!PROGRESSIVE_RAW_PILOT_REVIEW_DECISIONS.includes(decision.decision)) fail("progressive_raw_pilot_decision_invalid", "Pilot decision is invalid");
    if (batch && (batch.sha256 || canonicalJsonSha256(batch)) !== decision.batch_sha256) fail("progressive_raw_cross_bound", "Pilot decision does not bind the batch");
    if (evidence) {
      const checked = validateProgressiveRawPilotEvidenceWithBindingKind(evidence, { plan, batch }, bindingKind);
      if (!checked.ok || checked.sha256 !== decision.pilot_evidence_sha256) fail("progressive_raw_cross_bound", "Pilot decision does not bind current Pilot evidence");
    }
    return decision;
  });
}

export function validateProgressiveRawPilotDecision(decision, options = {}) {
  return validateProgressiveRawPilotDecisionWithBindingKind(decision, options, CURRENT_BINDING_KIND);
}

export function validateFormerProgressiveRawPilotDecision(decision, options = {}) {
  return validateProgressiveRawPilotDecisionWithBindingKind(decision, options, FORMER_BINDING_KIND);
}

export function createProgressiveRawPilotDecision(input = {}, options = undefined) {
  return create({
    schema: PROGRESSIVE_RAW_PILOT_DECISION_SCHEMA,
    plan_sha256: input.plan_sha256,
    batch_sha256: input.batch_sha256,
    pilot_evidence_sha256: input.pilot_evidence_sha256,
    run_version: input.run_version,
    source_receipt_sha256: input.source_receipt_sha256,
    source_epoch: input.source_epoch,
    workflow: input.workflow,
    provider_profile_sha256: input.provider_profile_sha256,
    effective_style_master_sha256: input.effective_style_master_sha256,
    source_execution_sha256: input.source_execution_sha256,
    decision: input.decision,
  }, validateProgressiveRawPilotDecision, options);
}

function validateProgressiveRawCompleteReviewWithBindingKind(review, { plan = null } = {}, bindingKind) {
  return result(() => {
    const keys = [
      "schema", "plan_sha256", "run_version", "source_receipt_sha256", "source_epoch", "workflow",
      "provider_profile_sha256", "effective_style_master_sha256", "source_execution_sha256", "ordered_slide_ids", "items",
      "workflow_evidence_sha256", "projection_sha256", "decision", "previous_review_sha256",
    ];
    const retainedKeys = [...keys, "retained_from_complete_raw_review_sha256"];
    if (!(exactKeys(review, keys) || exactKeys(review, retainedKeys)) || review.schema !== PROGRESSIVE_RAW_COMPLETE_REVIEW_SCHEMA) {
      fail("progressive_raw_complete_review_invalid", "complete raw review has an invalid shape");
    }
    commonPlanBinding(review, { plan, bindingKind });
    assertOrderedIds(review.ordered_slide_ids);
    if (plan && !sameOrder(plan.ordered_slide_ids, review.ordered_slide_ids)) {
      fail("progressive_raw_cross_bound", "complete review does not cover the full plan in order");
    }
    coverageItems(review.items, review.ordered_slide_ids, { plan });
    assertDigest(review.workflow_evidence_sha256, "workflow_evidence_sha256");
    assertDigest(review.projection_sha256, "projection_sha256");
    assertDigest(review.previous_review_sha256, "previous_review_sha256", { nullable: true });
    assertDigest(review.retained_from_complete_raw_review_sha256 ?? null, "retained_from_complete_raw_review_sha256", { nullable: true });
    if (review.decision === null) {
      if (review.previous_review_sha256 !== null) fail("progressive_raw_complete_review_invalid", "prepared review cannot name a predecessor");
    } else if (!PROGRESSIVE_RAW_COMPLETE_REVIEW_DECISIONS.includes(review.decision) || !review.previous_review_sha256) {
      fail("progressive_raw_complete_review_invalid", "decided review requires a permitted decision and prepared predecessor");
    }
    return review;
  });
}

export function validateProgressiveRawCompleteReview(review, options = {}) {
  return validateProgressiveRawCompleteReviewWithBindingKind(review, options, CURRENT_BINDING_KIND);
}

export function validateFormerProgressiveRawCompleteReview(review, options = {}) {
  return validateProgressiveRawCompleteReviewWithBindingKind(review, options, FORMER_BINDING_KIND);
}

export function createProgressiveRawCompleteReview(input = {}, options = undefined) {
  return create({
    schema: PROGRESSIVE_RAW_COMPLETE_REVIEW_SCHEMA,
    plan_sha256: input.plan_sha256,
    run_version: input.run_version,
    source_receipt_sha256: input.source_receipt_sha256,
    source_epoch: input.source_epoch,
    workflow: input.workflow,
    provider_profile_sha256: input.provider_profile_sha256,
    effective_style_master_sha256: input.effective_style_master_sha256,
    source_execution_sha256: input.source_execution_sha256,
    ordered_slide_ids: input.ordered_slide_ids,
    items: input.items,
    workflow_evidence_sha256: input.workflow_evidence_sha256,
    projection_sha256: input.projection_sha256,
    decision: input.decision ?? null,
    previous_review_sha256: input.previous_review_sha256 ?? null,
    retained_from_complete_raw_review_sha256: input.retained_from_complete_raw_review_sha256 ?? null,
  }, validateProgressiveRawCompleteReview, options);
}

function validateProgressiveAcceptedRawEvidenceWithBindingKind(
  evidence,
  { plan = null, completeReview = null } = {},
  bindingKind,
) {
  return result(() => {
    if (!exactKeys(evidence, [
      "schema", "raw_work_plan_sha256", "run_version", "source_receipt_sha256", "source_epoch", "workflow",
      "provider_profile_sha256", "effective_style_master_sha256", "source_execution_sha256", "complete_raw_review_sha256",
      "ordered_slide_ids", "items",
    ]) || evidence.schema !== PROGRESSIVE_ACCEPTED_RAW_EVIDENCE_SCHEMA) {
      fail("progressive_raw_accepted_evidence_invalid", "accepted raw evidence has an invalid shape");
    }
    const planBinding = { ...evidence, plan_sha256: evidence.raw_work_plan_sha256 };
    commonPlanBinding(planBinding, { plan, bindingKind });
    assertDigest(evidence.complete_raw_review_sha256, "complete_raw_review_sha256");
    assertOrderedIds(evidence.ordered_slide_ids);
    if (plan && !sameOrder(plan.ordered_slide_ids, evidence.ordered_slide_ids)) {
      fail("progressive_raw_cross_bound", "accepted raw evidence does not cover the full plan in order");
    }
    coverageItems(evidence.items, evidence.ordered_slide_ids, { plan });
    if (completeReview) {
      const checked = validateProgressiveRawCompleteReviewWithBindingKind(completeReview, { plan }, bindingKind);
      if (!checked.ok || checked.sha256 !== evidence.complete_raw_review_sha256 || completeReview.decision !== "proceed" ||
        !sameOrder(completeReview.items, evidence.items)) {
        fail("progressive_raw_cross_bound", "accepted raw evidence requires the exact complete review proceed record");
      }
    }
    return evidence;
  });
}

export function validateProgressiveAcceptedRawEvidence(evidence, options = {}) {
  return validateProgressiveAcceptedRawEvidenceWithBindingKind(evidence, options, CURRENT_BINDING_KIND);
}

export function validateFormerProgressiveAcceptedRawEvidence(evidence, options = {}) {
  return validateProgressiveAcceptedRawEvidenceWithBindingKind(evidence, options, FORMER_BINDING_KIND);
}

export function createProgressiveAcceptedRawEvidence(input = {}, options = undefined) {
  return create({
    schema: PROGRESSIVE_ACCEPTED_RAW_EVIDENCE_SCHEMA,
    raw_work_plan_sha256: input.raw_work_plan_sha256,
    run_version: input.run_version,
    source_receipt_sha256: input.source_receipt_sha256,
    source_epoch: input.source_epoch,
    workflow: input.workflow,
    provider_profile_sha256: input.provider_profile_sha256,
    effective_style_master_sha256: input.effective_style_master_sha256,
    source_execution_sha256: input.source_execution_sha256,
    complete_raw_review_sha256: input.complete_raw_review_sha256,
    ordered_slide_ids: input.ordered_slide_ids,
    items: input.items,
  }, validateProgressiveAcceptedRawEvidence, options);
}

/** Return the canonical digest whether a record was just created or parsed. */
export function progressiveRawRecordSha256(record) {
  return canonicalJsonSha256(record);
}
