import { sha256Bytes } from "../../shared/identity/byte_hash.mjs";
import { canonicalJson, canonicalJsonSha256 } from "../../shared/identity/canonical_json.mjs";
import {
  hasCurrentPageImageSourceReceiptEnvelope,
} from "../../shared/page-image/page_image_source_receipt.mjs";
import {
  PageImageCoreError,
  createPageImageCoreFacts,
  createPageImageProviderInputBinding,
} from "../../shared/page-image/page_image_core.mjs";
import { resolvePageDesignSystemBinding } from "../../02-visual-system/index.mjs";
import { evaluateImage2PromptBudget } from "../../shared/image2/provider_profile.mjs";
import {
  buildTargetRawGenerationProfile,
  createTargetProviderRequest,
  createTargetRawReviewContribution,
  validateTargetRawReviewContribution,
  TARGET_COMPILED_PROVIDER_INPUT_SCHEMA,
  TARGET_RAW_CONTRACT_SCHEMA,
} from "../../shared/image2/page_image_target_runtime.mjs";
import { validateRawWorkPlan } from "../../shared/image2/page_image_artifacts.mjs";
import { createRawWorkPlan } from "../../shared/image2/page_image_artifacts.mjs";
import { PureImageWorkflowError } from "../index.mjs";
import { validatePureRawContract } from "./pure_raw_contract.mjs";

const PURE_RAW_CONTRACT_KEYS = Object.freeze([
  "schema",
  "slide_id",
  "workflow",
  "visual_language",
  "provider_clauses",
  "visual_identity_role_clause",
  "visual_scene",
  "visual_identity",
  "page_presentation",
  "page_design_system",
  "page_image_core",
  "provider_rendered_content",
]);
const IDENTITY_PROJECTION_KEYS = Object.freeze([
  "profile",
  "role",
  "reference_sha256",
  "role_clause_sha256",
  "subject_class",
  "identity_subject_count",
  "subject_restrictions",
]);
const SHA256_RE = /^[0-9a-f]{64}$/;
const LOWER_KEBAB_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SUBJECT_RESTRICTIONS = new Set(["none", "no-generic-metal-robot", "no-identity-subject"]);

function hasExactKeys(value, keys) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)) &&
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function buildPureProviderIdentity(rawContract) {
  const projection = rawContract.visual_identity;
  if (projection === null) return null;
  return Object.freeze({
    profile: projection.profile,
    role: projection.role,
    subject_class: projection.subject_class,
    identity_subject_count: projection.identity_subject_count,
    subject_restrictions: projection.subject_restrictions,
    role_clause: rawContract.visual_identity_role_clause,
  });
}

function requireReceipt(receipt) {
  if (!hasCurrentPageImageSourceReceiptEnvelope(receipt, { workflow: "pure" }) || !Array.isArray(receipt.slides) || !receipt.slides.length) {
    throw new PureImageWorkflowError("wrong_workflow_owner", "Pure workflow requires a current Page Image Workflow pure receipt");
  }
  return receipt;
}

/** The selected adapter alone writes target raw plans for its Pure receipt. */
export function createPureRawWorkPlan({
  receipt,
  provider_profile_sha256,
  authorization_scope_sha256,
  raw_contracts_by_slide,
  provider_input_bindings_by_slide,
} = {}) {
  requireReceipt(receipt);
  if (!raw_contracts_by_slide || typeof raw_contracts_by_slide !== "object" || Array.isArray(raw_contracts_by_slide)) {
    throw new PureImageWorkflowError("raw_contracts_required", "Pure raw contracts are required for every slide");
  }
  if (!provider_input_bindings_by_slide || typeof provider_input_bindings_by_slide !== "object" || Array.isArray(provider_input_bindings_by_slide) ||
    canonicalJson(Object.keys(provider_input_bindings_by_slide).sort()) !== canonicalJson(receipt.slides.map((slide) => slide.slide_id).sort())) {
    throw new PureImageWorkflowError("pure_provider_input_bindings_required", "Pure raw plans require one provider input binding for every slide");
  }
  return createRawWorkPlan({
    source_receipt_sha256: receipt.source_sha256,
    workflow: "pure",
    ordered_slide_ids: receipt.slides.map((slide) => slide.slide_id),
    provider_profile_sha256,
    authorization_scope_sha256,
    items: receipt.slides.map((slide) => ({
      slide_id: slide.slide_id,
      raw_contract_sha256: raw_contracts_by_slide[slide.slide_id],
      provider_input_binding: provider_input_bindings_by_slide[slide.slide_id],
    })),
  });
}

/**
 * Map Pure's selected plan to the generic review contribution without
 * introducing Framed text or safe-zone semantics into the shared boundary.
 */
export function createPureTargetRawReviewContribution({ receipt, rawWorkPlan } = {}) {
  requireReceipt(receipt);
  const plan = validateRawWorkPlan(rawWorkPlan);
  const receiptIds = receipt.slides.map((slide) => slide.slide_id);
  if (!plan.ok || rawWorkPlan.workflow !== "pure" ||
    rawWorkPlan.source_receipt_sha256 !== receipt.source_sha256 ||
    canonicalJsonSha256(rawWorkPlan.ordered_slide_ids) !== canonicalJsonSha256(receiptIds)) {
    throw new PureImageWorkflowError("pure_review_contribution_plan_invalid", "Pure raw-review contribution requires the exact current raw work plan");
  }
  const slidesById = new Map(receipt.slides.map((slide) => [slide.slide_id, slide]));
  if (slidesById.size !== receipt.slides.length) {
    throw new PureImageWorkflowError("pure_review_contribution_source_invalid", "Pure raw-review contribution requires unique source slide identities");
  }
  const labels = rawWorkPlan.ordered_slide_ids.map((slideId, index) => {
    const slide = slidesById.get(slideId);
    const title = slide?.header_policy?.provider_visible?.title;
    if (typeof title !== "string" || !title.trim()) {
      throw new PureImageWorkflowError("pure_review_contribution_label_invalid", `Pure raw-review projection requires a title for ${slideId}`);
    }
    return { stable_id: slideId, position: index + 1, title };
  });
  const contribution = createTargetRawReviewContribution({
    workflow: "pure",
    ordered_stable_ids: rawWorkPlan.ordered_slide_ids,
    coverage_items: rawWorkPlan.ordered_slide_ids.map((slideId) => ({
      stable_id: slideId,
      coverage_profile_digest: rawWorkPlan.provider_profile_sha256,
      guide_primitives: [],
    })),
    projection_labels: labels,
  });
  const validation = validateTargetRawReviewContribution(contribution, {
    rawWorkPlan,
    expectedWorkflow: "pure",
  });
  if (!validation.ok) throw new PureImageWorkflowError(validation.code, validation.message);
  return contribution;
}

function coreStyleMasterSelection(workflow, styleMasterReference) {
  if (!styleMasterReference || typeof styleMasterReference !== "object" ||
    !SHA256_RE.test(styleMasterReference.selection_sha256 || "") ||
    !SHA256_RE.test(styleMasterReference.plan_sha256 || "")) {
    throw new PureImageWorkflowError("pure_page_image_core_invalid", "Pure adapter requires current Style Master selection facts for Page Image Core");
  }
  return Object.freeze({
    workflow,
    selection_sha256: styleMasterReference.selection_sha256,
    plan_sha256: styleMasterReference.plan_sha256,
  });
}

function createPureCoreFacts(context, generation, pageDesignSystemSha256) {
  try {
    return createPageImageCoreFacts({
      sourceReceipt: context.receipt,
      visualSelections: context.receipt.slides.map((slide) => ({
        slide_id: slide.slide_id,
        selection: slide.visual_language,
      })),
      styleMasterSelection: coreStyleMasterSelection("pure", generation.style_master_reference),
      generationProfile: generation.profile,
      headerRenderingPolicy: { workflow: "pure", policy: "provider-visible" },
      pageDesignSystemSha256,
    });
  } catch (error) {
    if (error instanceof PageImageCoreError) {
      throw new PureImageWorkflowError("pure_page_image_core_invalid", error.message);
    }
    throw error;
  }
}

function pureRawContract(slide, coreSlide, pageDesignSystem) {
  const visualLanguage = coreSlide?.visual_selection?.projection;
  if (!visualLanguage || typeof visualLanguage !== "object") {
    throw new PureImageWorkflowError("pure_visual_language_required", `Pure visual language is unresolved for ${slide.slide_id}`);
  }
  if (coreSlide.slide_id !== slide.slide_id || coreSlide.workflow !== "pure" ||
    coreSlide.header_policy?.provider_visible === undefined) {
    throw new PureImageWorkflowError("pure_page_image_core_invalid", `Pure Page Image Core facts are unavailable for ${slide.slide_id}`);
  }
  const presentation = coreSlide.visual_selection?.presentation;
  if (!presentation || presentation.workflow !== "pure" ||
    presentation.page_class !== slide.page_class || !SHA256_RE.test(presentation.binding_sha256 || "") ||
    !presentation.profile || typeof presentation.profile !== "object" || Array.isArray(presentation.profile)) {
    throw new PureImageWorkflowError("pure_page_presentation_required", `Pure page presentation is unavailable for ${slide.slide_id}`);
  }
  const providerClauses = coreSlide.visual_selection?.provider_clauses || null;
  const identityRoleClause = coreSlide.visual_selection?.identity_reference?.provider_reference?.role_clause || null;
  return Object.freeze({
    schema: TARGET_RAW_CONTRACT_SCHEMA,
    slide_id: slide.slide_id,
    workflow: "pure",
    visual_language: { ...visualLanguage, negative_constraints: [...(slide.visual_brief?.negative_constraints || [])] },
    provider_clauses: providerClauses,
    visual_identity_role_clause: identityRoleClause,
    visual_scene: null,
    visual_identity: coreSlide.visual_selection?.identity_reference?.projection || null,
    page_presentation: {
      page_class: presentation.page_class,
      profile_id: presentation.profile_id,
      binding_sha256: presentation.binding_sha256,
      provenance: presentation.provenance,
      profile: presentation.profile,
    },
    page_design_system: {
      text: pageDesignSystem?.text,
      sha256: pageDesignSystem?.sha256,
    },
    page_image_core: {
      schema: coreSlide.schema,
      canonical_semantic_sha256: coreSlide.canonical_semantic_sha256,
      page_design_system_sha256: coreSlide.page_design_system_sha256,
    },
    provider_rendered_content: {
      header: { ...coreSlide.header_policy.provider_visible },
      items: coreSlide.provider_content.items.map((item) => ({ ...item })),
    },
  });
}

/** Compile Pure's complete provider-visible page input from its selected adapter facts. */
function compilePureProviderInput({ slideId, rawContract } = {}) {
  const contract = validatePureRawContract(rawContract);
  if (!contract.ok || rawContract.slide_id !== slideId) {
    throw new PureImageWorkflowError("pure_provider_input_invalid", "Pure provider input requires one valid selected raw contract");
  }
  const utf8 = canonicalJson({
    schema: "page-image-pure-provider-input",
    slide_id: slideId,
    instruction: "Render one complete premium keynote page. Render every header literal and provider-rendered content item as readable integrated page typography; preserve exact literals unless an item explicitly allows presentation adaptation.",
    design_system: rawContract.page_design_system.text,
    provider_rendered_content: rawContract.provider_rendered_content,
    visual: {
      recipe: rawContract.provider_clauses.recipe,
      composition: rawContract.provider_clauses.composition,
      motifs: rawContract.provider_clauses.motifs,
      relationship: rawContract.provider_clauses.relationship || null,
      identity: buildPureProviderIdentity(rawContract),
    },
    page_presentation: { profile: rawContract.page_presentation.profile },
  });
  return Object.freeze({
    schema: TARGET_COMPILED_PROVIDER_INPUT_SCHEMA,
    utf8,
    sha256: sha256Bytes(Buffer.from(utf8, "utf8")),
  });
}

/** Compile a selected Pure current raw-plan candidate without materializing state. */
function compilePureTargetRawPlanCandidate(context) {
  const pageDesignSystem = resolvePageDesignSystemBinding(context.run_dir);
  const generation = buildTargetRawGenerationProfile({
    runDir: context.run_dir,
    deckDir: context.deck_dir,
    receipt: context.receipt,
  });
  const coreFacts = createPureCoreFacts(context, generation, pageDesignSystem.sha256);
  const coreSlidesById = new Map(coreFacts.slides.map((slide) => [slide.slide_id, slide]));
  const rawContractsBySlide = {};
  const providerInputBindingsBySlide = {};
  const providerRequestsBySlide = {};
  for (const slide of context.receipt.slides) {
    const coreSlide = coreSlidesById.get(slide.slide_id);
    const rawContract = pureRawContract(slide, coreSlide, pageDesignSystem);
    const rawContractValidation = validatePureRawContract(rawContract);
    if (!rawContractValidation.ok) throw new PureImageWorkflowError(rawContractValidation.code, rawContractValidation.message);
    rawContractsBySlide[slide.slide_id] = rawContractValidation.raw_contract_sha256;
    const compiledProviderInput = compilePureProviderInput({
      slideId: slide.slide_id,
      rawContract,
    });
    try {
      evaluateImage2PromptBudget({
        prompt: compiledProviderInput.utf8,
        operationProfile: generation.profile.provider,
      });
    } catch (error) {
      const failure = new PureImageWorkflowError(error?.code || "pure_provider_input_budget_invalid", "Pure canonical provider input does not fit the selected Image2 operation budget");
      if (error?.measurement) failure.measurement = error.measurement;
      throw failure;
    }
    providerRequestsBySlide[slide.slide_id] = createTargetProviderRequest({
      slideId: slide.slide_id,
      rawContract,
      generationProfile: generation.profile,
      compiledProviderInput,
    });
    providerInputBindingsBySlide[slide.slide_id] = createPageImageProviderInputBinding({
      coreSlide,
      compiledProviderInputSha256: compiledProviderInput.sha256,
    });
  }
  const authorizationScopeSha = canonicalJsonSha256({
    source_receipt_sha256: context.receipt.source_sha256,
    workflow: "pure",
    provider_profile_sha256: generation.provider_profile_sha256,
    ordered_slide_ids: context.receipt.slides.map((slide) => slide.slide_id),
    raw_contracts_by_slide: rawContractsBySlide,
    provider_input_bindings_by_slide: providerInputBindingsBySlide,
  });
  const rawWorkPlan = createPureRawWorkPlan({
    receipt: context.receipt,
    provider_profile_sha256: generation.provider_profile_sha256,
    authorization_scope_sha256: authorizationScopeSha,
    raw_contracts_by_slide: rawContractsBySlide,
    provider_input_bindings_by_slide: providerInputBindingsBySlide,
  });
  return Object.freeze({
    ...context,
    raw_work_plan: rawWorkPlan,
    provider_requests_by_slide: Object.freeze(providerRequestsBySlide),
    page_image_core: coreFacts,
    style_master_reference: generation.style_master_reference,
  });
}

export { compilePureTargetRawPlanCandidate, createPureCoreFacts, pureRawContract, compilePureProviderInput, requireReceipt };