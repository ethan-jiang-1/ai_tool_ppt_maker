import { canonicalJson, canonicalJsonSha256 } from "../identity/canonical_json.mjs";
import { sha256Bytes } from "../identity/byte_hash.mjs";
import {
  PROGRESSIVE_ACCEPTED_RAW_EVIDENCE_SCHEMA,
  PROGRESSIVE_RAW_WORK_PLAN_SCHEMA,
  validateProgressiveAcceptedRawEvidence,
  validateProgressiveRawWorkPlan,
} from "./page_authority_progressive_schema.mjs";

export const RAW_WORK_PLAN_SCHEMA = "page-authority-raw-work-plan-v2";
export const ACCEPTED_RAW_EVIDENCE_SCHEMA = "page-authority-accepted-raw-evidence-v2";
export const FINAL_SLIDE_MANIFEST_SCHEMA = "page-authority-final-slide-manifest-v2";

const SHA256_RE = /^[0-9a-f]{64}$/;
const SLIDE_ID_RE = /^[A-Za-z][A-Za-z0-9_-]{0,127}$/;
const WORKFLOWS = Object.freeze(["framed", "pure"]);

export class PageAuthorityArtifactError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function freeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const entry of Object.values(value)) freeze(entry);
  return Object.freeze(value);
}

function withSha(value, sha256) {
  Object.defineProperty(value, "sha256", { value: sha256, enumerable: false, configurable: false, writable: false });
  return freeze(value);
}

function exactKeys(value, keys) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)) &&
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function assertDigest(value, field) {
  if (!SHA256_RE.test(value || "")) throw new PageAuthorityArtifactError("invalid_digest", `${field} must be a lowercase SHA-256`);
}

function assertWorkflow(workflow) {
  if (!WORKFLOWS.includes(workflow)) throw new PageAuthorityArtifactError("invalid_workflow", "workflow must be framed | pure");
}

function assertOrderedIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0 || ids.some((id) => !SLIDE_ID_RE.test(id || "")) || new Set(ids).size !== ids.length) {
    throw new PageAuthorityArtifactError("invalid_slide_order", "ordered_slide_ids must contain unique stable slide IDs");
  }
}

function bytes(value, label) {
  if (!Buffer.isBuffer(value) && !(value instanceof Uint8Array)) throw new PageAuthorityArtifactError("invalid_bytes", `${label} must be nonempty bytes`);
  const copy = Buffer.from(value);
  if (copy.length === 0) throw new PageAuthorityArtifactError("invalid_bytes", `${label} must be nonempty bytes`);
  return copy;
}

function rawPlanShape(plan) {
  return exactKeys(plan, [
    "schema", "source_receipt_sha256", "workflow", "ordered_slide_ids",
    "provider_profile_sha256", "authorization_scope_sha256", "items",
  ]) && plan.schema === RAW_WORK_PLAN_SCHEMA;
}

/** Validate opaque raw-work inputs without interpreting workflow semantics. */
export function validateRawWorkPlan(plan) {
  try {
    if (!rawPlanShape(plan)) throw new PageAuthorityArtifactError("raw_plan_invalid", "raw work plan has an invalid shape");
    assertDigest(plan.source_receipt_sha256, "source_receipt_sha256");
    assertWorkflow(plan.workflow);
    assertOrderedIds(plan.ordered_slide_ids);
    assertDigest(plan.provider_profile_sha256, "provider_profile_sha256");
    assertDigest(plan.authorization_scope_sha256, "authorization_scope_sha256");
    if (!Array.isArray(plan.items) || plan.items.length !== plan.ordered_slide_ids.length) throw new PageAuthorityArtifactError("raw_plan_invalid", "raw work plan items must cover ordered_slide_ids exactly");
    const ids = [];
    for (const item of plan.items) {
      if (!exactKeys(item, ["slide_id", "raw_contract_sha256"]) || !SLIDE_ID_RE.test(item.slide_id || "")) throw new PageAuthorityArtifactError("raw_plan_invalid", "raw work item is invalid");
      assertDigest(item.raw_contract_sha256, "raw_contract_sha256");
      ids.push(item.slide_id);
    }
    if (canonicalJson(ids) !== canonicalJson(plan.ordered_slide_ids)) throw new PageAuthorityArtifactError("raw_plan_invalid", "raw work item order must equal ordered_slide_ids");
    return freeze({ ok: true, sha256: canonicalJsonSha256(plan) });
  } catch (error) {
    return freeze({ ok: false, code: error.code || "raw_plan_invalid", message: error.message });
  }
}

export function createRawWorkPlan(input) {
  const plan = {
    schema: RAW_WORK_PLAN_SCHEMA,
    source_receipt_sha256: input?.source_receipt_sha256,
    workflow: input?.workflow,
    ordered_slide_ids: input?.ordered_slide_ids,
    provider_profile_sha256: input?.provider_profile_sha256,
    authorization_scope_sha256: input?.authorization_scope_sha256,
    items: input?.items,
  };
  const validation = validateRawWorkPlan(plan);
  if (!validation.ok) throw new PageAuthorityArtifactError(validation.code, validation.message);
  return withSha(plan, validation.sha256);
}

function rawEvidenceShape(evidence) {
  return exactKeys(evidence, [
    "schema", "raw_work_plan_sha256", "source_receipt_sha256", "workflow",
    "provider_authorization_sha256", "raw_review_sha256", "items",
  ]) && evidence.schema === ACCEPTED_RAW_EVIDENCE_SCHEMA;
}

export function validateAcceptedRawEvidence(evidence, { plan = null } = {}) {
  try {
    if (!rawEvidenceShape(evidence)) throw new PageAuthorityArtifactError("raw_evidence_invalid", "accepted raw evidence has an invalid shape");
    for (const field of ["raw_work_plan_sha256", "source_receipt_sha256", "provider_authorization_sha256", "raw_review_sha256"]) assertDigest(evidence[field], field);
    assertWorkflow(evidence.workflow);
    if (!Array.isArray(evidence.items) || evidence.items.length === 0) throw new PageAuthorityArtifactError("raw_evidence_invalid", "accepted raw evidence needs ordered items");
    const seen = new Set();
    for (const item of evidence.items) {
      if (!exactKeys(item, ["slide_id", "raw_sha256", "path"]) || !SLIDE_ID_RE.test(item.slide_id || "") || seen.has(item.slide_id) || typeof item.path !== "string" || !item.path) {
        throw new PageAuthorityArtifactError("raw_evidence_invalid", "accepted raw evidence item is invalid");
      }
      assertDigest(item.raw_sha256, "raw_sha256");
      seen.add(item.slide_id);
    }
    if (plan) {
      const checked = validateRawWorkPlan(plan);
      if (!checked.ok || checked.sha256 !== evidence.raw_work_plan_sha256 || plan.source_receipt_sha256 !== evidence.source_receipt_sha256 || plan.workflow !== evidence.workflow ||
        canonicalJson(plan.ordered_slide_ids) !== canonicalJson(evidence.items.map((item) => item.slide_id))) {
        throw new PageAuthorityArtifactError("raw_evidence_stale", "accepted raw evidence does not bind the current raw work plan");
      }
    }
    return freeze({ ok: true, sha256: canonicalJsonSha256(evidence) });
  } catch (error) {
    return freeze({ ok: false, code: error.code || "raw_evidence_invalid", message: error.message });
  }
}

export function createAcceptedRawEvidence({ plan, provider_authorization_sha256, raw_review_sha256, raw_bytes_by_slide } = {}) {
  const checkedPlan = validateRawWorkPlan(plan);
  if (!checkedPlan.ok) throw new PageAuthorityArtifactError(checkedPlan.code, checkedPlan.message);
  if (!raw_bytes_by_slide || typeof raw_bytes_by_slide !== "object" || Array.isArray(raw_bytes_by_slide)) throw new PageAuthorityArtifactError("raw_evidence_invalid", "raw_bytes_by_slide is required");
  const ids = plan.ordered_slide_ids;
  if (Object.keys(raw_bytes_by_slide).sort().join("\n") !== [...ids].sort().join("\n")) throw new PageAuthorityArtifactError("raw_evidence_invalid", "raw bytes must cover the raw work plan exactly");
  const evidence = {
    schema: ACCEPTED_RAW_EVIDENCE_SCHEMA,
    raw_work_plan_sha256: checkedPlan.sha256,
    source_receipt_sha256: plan.source_receipt_sha256,
    workflow: plan.workflow,
    provider_authorization_sha256,
    raw_review_sha256,
    items: ids.map((slide_id) => ({ slide_id, raw_sha256: sha256Bytes(bytes(raw_bytes_by_slide[slide_id], `raw ${slide_id}`)), path: `${slide_id}.png` })),
  };
  const validation = validateAcceptedRawEvidence(evidence, { plan });
  if (!validation.ok) throw new PageAuthorityArtifactError(validation.code, validation.message);
  return withSha(evidence, validation.sha256);
}

/** Validate either preserved v2 evidence or the progressive v3 finalization input. */
export function validateAcceptedRawEvidenceForFinalization(evidence, { plan = null } = {}) {
  if (evidence?.schema === PROGRESSIVE_ACCEPTED_RAW_EVIDENCE_SCHEMA) {
    return validateProgressiveAcceptedRawEvidence(evidence, { plan });
  }
  return validateAcceptedRawEvidence(evidence, { plan });
}

/** Validate either historical v2 or progressive v3 raw plan bindings for final publication. */
export function validateRawWorkPlanForFinalization(plan) {
  if (plan?.schema === PROGRESSIVE_RAW_WORK_PLAN_SCHEMA) return validateProgressiveRawWorkPlan(plan);
  return validateRawWorkPlan(plan);
}

function finalManifestShape(manifest) {
  return exactKeys(manifest, [
    "schema", "source_receipt_sha256", "accepted_raw_evidence_sha256", "workflow", "items",
  ]) && manifest.schema === FINAL_SLIDE_MANIFEST_SCHEMA;
}

export function validateFinalSlideManifest(manifest, { evidence = null, expectedWorkflow = null } = {}) {
  try {
    if (!finalManifestShape(manifest)) throw new PageAuthorityArtifactError("final_manifest_invalid", "final slide manifest has an invalid shape");
    for (const field of ["source_receipt_sha256", "accepted_raw_evidence_sha256"]) assertDigest(manifest[field], field);
    assertWorkflow(manifest.workflow);
    if (expectedWorkflow && manifest.workflow !== expectedWorkflow) throw new PageAuthorityArtifactError("wrong_workflow_owner", "final manifest workflow does not match its owner");
    if (!Array.isArray(manifest.items) || manifest.items.length === 0) throw new PageAuthorityArtifactError("final_manifest_invalid", "final slide manifest needs ordered items");
    const ids = [];
    for (const item of manifest.items) {
      if (!exactKeys(item, ["slide_id", "position", "final_sha256", "path"]) || !SLIDE_ID_RE.test(item.slide_id || "") || !Number.isInteger(item.position) || item.position < 1 || item.path !== `${item.slide_id}.png`) {
        throw new PageAuthorityArtifactError("final_manifest_invalid", "final slide manifest item is invalid");
      }
      assertDigest(item.final_sha256, "final_sha256");
      ids.push(item.slide_id);
    }
    if (new Set(ids).size !== ids.length || manifest.items.some((item, index) => item.position !== index + 1)) throw new PageAuthorityArtifactError("final_manifest_invalid", "final slide manifest position/order is invalid");
    if (evidence) {
      const checked = validateAcceptedRawEvidenceForFinalization(evidence);
      if (!checked.ok || checked.sha256 !== manifest.accepted_raw_evidence_sha256 || evidence.source_receipt_sha256 !== manifest.source_receipt_sha256 || evidence.workflow !== manifest.workflow ||
        canonicalJson(evidence.items.map((item) => item.slide_id)) !== canonicalJson(ids)) {
        throw new PageAuthorityArtifactError("final_manifest_stale", "final slide manifest does not bind current accepted raw evidence");
      }
    }
    return freeze({ ok: true, sha256: canonicalJsonSha256(manifest) });
  } catch (error) {
    return freeze({ ok: false, code: error.code || "final_manifest_invalid", message: error.message });
  }
}

export function createFinalSlideManifest({ evidence, expected_workflow, final_bytes_by_slide } = {}) {
  const checkedEvidence = validateAcceptedRawEvidenceForFinalization(evidence);
  if (!checkedEvidence.ok) throw new PageAuthorityArtifactError(checkedEvidence.code, checkedEvidence.message);
  if (expected_workflow !== evidence.workflow) throw new PageAuthorityArtifactError("wrong_workflow_owner", "only the selected workflow may publish final slides");
  if (!final_bytes_by_slide || typeof final_bytes_by_slide !== "object" || Array.isArray(final_bytes_by_slide)) throw new PageAuthorityArtifactError("final_manifest_invalid", "final_bytes_by_slide is required");
  const ids = evidence.items.map((item) => item.slide_id);
  if (Object.keys(final_bytes_by_slide).sort().join("\n") !== [...ids].sort().join("\n")) throw new PageAuthorityArtifactError("final_manifest_invalid", "final bytes must cover accepted evidence exactly");
  const manifest = {
    schema: FINAL_SLIDE_MANIFEST_SCHEMA,
    source_receipt_sha256: evidence.source_receipt_sha256,
    accepted_raw_evidence_sha256: checkedEvidence.sha256,
    workflow: evidence.workflow,
    items: ids.map((slide_id, index) => ({ slide_id, position: index + 1, final_sha256: sha256Bytes(bytes(final_bytes_by_slide[slide_id], `final ${slide_id}`)), path: `${slide_id}.png` })),
  };
  const validation = validateFinalSlideManifest(manifest, { evidence, expectedWorkflow: expected_workflow });
  if (!validation.ok) throw new PageAuthorityArtifactError(validation.code, validation.message);
  return withSha(manifest, validation.sha256);
}
