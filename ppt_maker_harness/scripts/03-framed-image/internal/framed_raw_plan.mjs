import {
  describeFramedHeaderOverlay,
  renderFramedHeaderOverlayHtml,
} from "./framed_render_contract.mjs";
import {
  FRAMED_EXCLUSIVE_HEADER_RESERVATION_INSTRUCTION,
  buildFramedProviderIdentity,
  validateFramedProviderInputContract,
} from "./framed_provider_input_contract.mjs";
import { createRawWorkPlan, validateRawWorkPlan } from "../../shared/image2/page_image_artifacts.mjs";
import { canonicalJson, canonicalJsonSha256 } from "../../shared/identity/canonical_json.mjs";
import { sha256Bytes } from "../../shared/identity/byte_hash.mjs";
import { resolvePageDesignSystemBinding } from "../../02-visual-system/index.mjs";
import {
  PageImageCoreError,
  createPageImageCoreFacts,
  createPageImageProviderInputBinding,
} from "../../shared/page-image/page_image_core.mjs";
import { evaluateImage2PromptBudget } from "../../shared/image2/provider_profile.mjs";
import {
  buildTargetRawGenerationProfile,
  createTargetProviderRequest,
  createTargetRawReviewContribution,
  TARGET_COMPILED_PROVIDER_INPUT_SCHEMA,
  TARGET_RAW_CONTRACT_SCHEMA,
  validateTargetRawReviewContribution,
} from "../../shared/image2/page_image_target_runtime.mjs";
import { PageDerivedDataError, publishPageDerivedData } from "../../shared/image2/page_derived_data.mjs";
import {
  FRAMED_HEADER_FIELDS,
  FRAMED_HEADER_POLICY_KEYS,
  isProtectedComposition,
  validateFramedRawContract,
  validateFramedRawContractAgainstProfile,
} from "./framed_raw_contract.mjs";
import { FRAMED_IMAGE_WORKFLOW, FramedImageWorkflowError, requireReceipt, SHA256_RE, SUBJECT_RESTRICTIONS, coreStyleMasterSelection } from "./framed_identity.mjs";

function canonicalFramedFrameFacts(frame, presentation) {
  const layout = frame?.layout;
  const profile = frame?.render_profile;
  if (!layout || !profile || typeof profile.preset?.id !== "string" ||
    !SHA256_RE.test(profile.preset?.digest || "") ||
    !layout.canvas || !isProtectedComposition(presentation?.protected_composition)) {
    throw new FramedImageWorkflowError("framed_render_contract_invariant_failed", "Framed render contract is missing canonical raw facts");
  }
  return Object.freeze({
    profile_id: profile.preset.id,
    profile_digest: profile.preset.digest,
    canvas: layout.canvas,
    protected_composition: presentation.protected_composition,
  });
}

export function framedHeaderOverlayInput(slide) {
  const policy = slide?.header_policy;
  const presentation = slide?.visual_language?.presentation;
  if (!hasExactKeys(policy, FRAMED_HEADER_POLICY_KEYS) ||
    !hasExactKeys(policy.local_header, FRAMED_HEADER_FIELDS) ||
    !presentation || presentation.workflow !== FRAMED_IMAGE_WORKFLOW || presentation.page_class !== slide.page_class ||
    !SHA256_RE.test(presentation.binding_sha256 || "") || !presentation.profile || typeof presentation.profile !== "object" ||
    !isProtectedComposition(presentation.protected_composition)) {
    throw new FramedImageWorkflowError("framed_header_policy_invalid", "Framed slides require one closed local header and protected composition");
  }
  return Object.freeze({
    slide_id: slide.slide_id,
    presentation_profile: presentation.profile,
    local_header: policy.local_header,
  });
}

function describeFramedSlide(slide) {
  return describeFramedHeaderOverlay(framedHeaderOverlayInput(slide));
}

function framedRawPlanItems(receipt) {
  requireReceipt(receipt);
  return Object.freeze(receipt.slides.map((slide) => Object.freeze({
    slide_id: slide.slide_id,
  })));
}

/** The selected adapter alone writes target raw plans for its framed receipt. */
export function createFramedRawWorkPlan({
  receipt,
  provider_profile_sha256,
  authorization_scope_sha256,
  raw_contracts_by_slide,
  provider_input_bindings_by_slide,
} = {}) {
  const items = framedRawPlanItems(receipt);
  if (!raw_contracts_by_slide || typeof raw_contracts_by_slide !== "object" || Array.isArray(raw_contracts_by_slide)) {
    throw new FramedImageWorkflowError("raw_contracts_required", "Framed raw contracts are required for every slide");
  }
  if (!provider_input_bindings_by_slide || typeof provider_input_bindings_by_slide !== "object" || Array.isArray(provider_input_bindings_by_slide) ||
    canonicalJson(Object.keys(provider_input_bindings_by_slide).sort()) !== canonicalJson(items.map((item) => item.slide_id).sort())) {
    throw new FramedImageWorkflowError("framed_provider_input_bindings_required", "Framed raw plans require one provider input binding for every slide");
  }
  return createRawWorkPlan({
    source_receipt_sha256: receipt.source_sha256,
    workflow: FRAMED_IMAGE_WORKFLOW,
    ordered_slide_ids: items.map((item) => item.slide_id),
    provider_profile_sha256,
    authorization_scope_sha256,
    items: items.map((item) => ({
      slide_id: item.slide_id,
      raw_contract_sha256: raw_contracts_by_slide[item.slide_id],
      provider_input_binding: provider_input_bindings_by_slide[item.slide_id],
    })),
  });
}

/**
 * Map Framed's canonical protected composition into the shared review
 * contribution interface. Composition is a provider-avoidance and
 * review fact, never a rendered panel or blank strip.
 */
export function createFramedTargetRawReviewContribution({ receipt, rawWorkPlan } = {}) {
  requireReceipt(receipt);
  const plan = validateRawWorkPlan(rawWorkPlan);
  const receiptIds = receipt.slides.map((slide) => slide.slide_id);
  if (!plan.ok || rawWorkPlan.workflow !== FRAMED_IMAGE_WORKFLOW ||
    rawWorkPlan.source_receipt_sha256 !== receipt.source_sha256 ||
    canonicalJsonSha256(rawWorkPlan.ordered_slide_ids) !== canonicalJsonSha256(receiptIds)) {
    throw new FramedImageWorkflowError("framed_review_contribution_plan_invalid", "Framed raw-review contribution requires the exact current raw work plan");
  }
  const slidesById = new Map(receipt.slides.map((slide) => [slide.slide_id, slide]));
  if (slidesById.size !== receipt.slides.length) {
    throw new FramedImageWorkflowError("framed_review_contribution_source_invalid", "Framed raw-review contribution requires unique source slide identities");
  }
  const described = rawWorkPlan.ordered_slide_ids.map((slideId) => {
    const slide = slidesById.get(slideId);
    if (!slide) throw new FramedImageWorkflowError("framed_review_contribution_source_invalid", `Framed raw-review contribution is missing ${slideId}`);
    const frame = describeFramedSlide(slide);
    const title = slide.header_policy?.local_header?.title;
    if (typeof title !== "string" || !title.trim()) {
      throw new FramedImageWorkflowError("framed_review_contribution_label_invalid", `Framed raw-review projection requires a title for ${slideId}`);
    }
    return Object.freeze({ slide, frame, title });
  });
  const contribution = createTargetRawReviewContribution({
    workflow: FRAMED_IMAGE_WORKFLOW,
    ordered_stable_ids: rawWorkPlan.ordered_slide_ids,
    coverage_items: described.map(({ slide, frame }, index) => ({
      stable_id: rawWorkPlan.ordered_slide_ids[index],
      coverage_profile_digest: frame.render_profile.render_profile_digest,
      guide_primitives: [
        ["reserved_header", slide.visual_language.presentation.protected_composition.reserved_header],
        ["body_safe", slide.visual_language.presentation.protected_composition.body_safe],
      ].map(([guide_id, rectangle]) => ({
        kind: "rectangle",
        guide_id,
        x: rectangle.x,
        y: rectangle.y,
        width: rectangle.width,
        height: rectangle.height,
      })),
    })),
    projection_labels: described.map(({ title }, index) => ({
      stable_id: rawWorkPlan.ordered_slide_ids[index],
      position: index + 1,
      title,
    })),
  });
  const validation = validateTargetRawReviewContribution(contribution, {
    rawWorkPlan,
    expectedWorkflow: FRAMED_IMAGE_WORKFLOW,
  });
  if (!validation.ok) throw new FramedImageWorkflowError(validation.code, validation.message);
  return contribution;
}

function createFramedCoreFacts(context, generation, pageDesignSystemSha256) {
  try {
    return createPageImageCoreFacts({
      sourceReceipt: context.receipt,
      visualSelections: context.receipt.slides.map((slide) => ({
        slide_id: slide.slide_id,
        selection: slide.visual_language,
      })),
      styleMasterSelection: coreStyleMasterSelection(FRAMED_IMAGE_WORKFLOW, generation.style_master_reference),
      generationProfile: generation.profile,
      headerRenderingPolicy: { workflow: FRAMED_IMAGE_WORKFLOW, policy: "local-transparent-overlay" },
      pageDesignSystemSha256,
    });
  } catch (error) {
    if (error instanceof PageImageCoreError) {
      throw new FramedImageWorkflowError("framed_page_image_core_invalid", error.message);
    }
    throw error;
  }
}

function framedRawContract(slide, frame, coreSlide, pageDesignSystem) {
  const visualLanguage = coreSlide?.visual_selection?.projection;
  if (!visualLanguage || typeof visualLanguage !== "object") {
    throw new FramedImageWorkflowError("framed_visual_language_required", `Framed visual language is unresolved for ${slide.slide_id}`);
  }
  if (frame?.slide_id !== slide.slide_id || !SHA256_RE.test(frame?.render_profile?.render_profile_digest || "")) {
    throw new FramedImageWorkflowError("framed_render_contract_invariant_failed", `Framed render contract is unavailable for ${slide.slide_id}`);
  }
  if (coreSlide.slide_id !== slide.slide_id || coreSlide.workflow !== FRAMED_IMAGE_WORKFLOW ||
    coreSlide.header_policy?.local_header === undefined || !SUBJECT_RESTRICTIONS.has(coreSlide.subject_restrictions)) {
    throw new FramedImageWorkflowError("framed_page_image_core_invalid", `Framed Page Image Core facts are unavailable for ${slide.slide_id}`);
  }
  const presentation = coreSlide.visual_selection?.presentation;
  if (!presentation || presentation.workflow !== FRAMED_IMAGE_WORKFLOW ||
    presentation.page_class !== slide.page_class || !SHA256_RE.test(presentation.binding_sha256 || "")) {
    throw new FramedImageWorkflowError("framed_page_presentation_required", `Framed page presentation is unavailable for ${slide.slide_id}`);
  }
  const facts = canonicalFramedFrameFacts(frame, presentation);
  const providerClauses = coreSlide.visual_selection?.provider_clauses || null;
  const identityRoleClause = coreSlide.visual_selection?.identity_reference?.provider_reference?.role_clause || null;
  const rawContract = Object.freeze({
    schema: TARGET_RAW_CONTRACT_SCHEMA,
    slide_id: slide.slide_id,
    workflow: FRAMED_IMAGE_WORKFLOW,
    visual_language: { ...visualLanguage, negative_constraints: [...(slide.visual_brief?.negative_constraints || [])] },
    provider_clauses: providerClauses,
    visual_identity_role_clause: identityRoleClause,
    visual_scene: null,
    visual_identity: coreSlide.visual_selection?.identity_reference?.projection || null,
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
      items: coreSlide.provider_content.items.map((item) => ({ ...item })),
    },
    framed: {
      ...facts,
      presentation_binding_sha256: presentation.binding_sha256,
      local_header: { ...coreSlide.header_policy.local_header },
      subject_restrictions: coreSlide.subject_restrictions,
      render_profile_digest: frame.render_profile.render_profile_digest,
    },
  });
  return rawContract;
}

/** Compile Framed's provider page while reserving its transparent local header overlay. */
export function compileFramedProviderInput({ slideId, rawContract } = {}) {
  const contract = validateFramedRawContract(rawContract);
  if (!contract.ok || rawContract.slide_id !== slideId) {
    throw new FramedImageWorkflowError("framed_provider_input_invalid", "Framed provider input requires one valid selected raw contract");
  }
  const utf8 = canonicalJson({
    schema: "page-image-framed-provider-input",
    slide_id: slideId,
    instruction: FRAMED_EXCLUSIVE_HEADER_RESERVATION_INSTRUCTION,
    design_system: rawContract.page_design_system.text,
    provider_rendered_content: rawContract.provider_rendered_content,
    subject_restrictions: rawContract.framed.subject_restrictions,
    protected_composition: rawContract.framed.protected_composition,
    visual: {
      recipe: rawContract.provider_clauses.recipe,
      composition: rawContract.provider_clauses.composition,
      motifs: rawContract.provider_clauses.motifs,
      relationship: rawContract.provider_clauses.relationship || null,
      identity: buildFramedProviderIdentity(rawContract),
    },
  });
  const compiledProviderInput = Object.freeze({
    schema: TARGET_COMPILED_PROVIDER_INPUT_SCHEMA,
    utf8,
    sha256: sha256Bytes(Buffer.from(utf8, "utf8")),
  });
  const validation = validateFramedProviderInputContract({
    rawContract,
    compiledProviderInput,
  });
  if (!validation.ok) {
    throw new FramedImageWorkflowError(validation.code, validation.message);
  }
  return compiledProviderInput;
}

/** Compile a selected Framed current raw-plan candidate without artifact writes. */
export function compileFramedTargetRawPlanCandidate(context) {
  const pageDesignSystem = resolvePageDesignSystemBinding(context.run_dir);
  const framesById = new Map(context.receipt.slides.map((slide) => [slide.slide_id, describeFramedSlide(slide)]));
  const generation = buildTargetRawGenerationProfile({
    runDir: context.run_dir,
    deckDir: context.deck_dir,
    receipt: context.receipt,
  });
  const coreFacts = createFramedCoreFacts(context, generation, pageDesignSystem.sha256);
  const coreSlidesById = new Map(coreFacts.slides.map((slide) => [slide.slide_id, slide]));
  const rawContractsBySlide = {};
  const providerInputBindingsBySlide = {};
  const providerRequestsBySlide = {};
  for (const slide of context.receipt.slides) {
    const frame = framesById.get(slide.slide_id);
    const coreSlide = coreSlidesById.get(slide.slide_id);
    const rawContract = framedRawContract(slide, frame, coreSlide, pageDesignSystem);
    const rawContractValidation = validateFramedRawContractAgainstProfile(rawContract, frame.render_profile);
    if (!rawContractValidation.ok) throw new FramedImageWorkflowError(rawContractValidation.code, rawContractValidation.message);
    rawContractsBySlide[slide.slide_id] = rawContractValidation.raw_contract_sha256;
    const compiledProviderInput = compileFramedProviderInput({
      slideId: slide.slide_id,
      rawContract,
    });
    try {
      evaluateImage2PromptBudget({
        prompt: compiledProviderInput.utf8,
        operationProfile: generation.profile.provider,
      });
    } catch (error) {
      const failure = new FramedImageWorkflowError(error?.code || "framed_provider_input_budget_invalid", "Framed canonical provider input does not fit the selected Image2 operation budget");
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
      localHeaderProfileSha256: frame.render_profile.render_profile_digest,
      protectedCompositionSha256: canonicalJsonSha256(rawContract.framed.protected_composition),
    });
  }
  const authorizationScopeSha = canonicalJsonSha256({
    source_receipt_sha256: context.receipt.source_sha256,
    workflow: FRAMED_IMAGE_WORKFLOW,
    provider_profile_sha256: generation.provider_profile_sha256,
    ordered_slide_ids: context.receipt.slides.map((slide) => slide.slide_id),
    raw_contracts_by_slide: rawContractsBySlide,
    provider_input_bindings_by_slide: providerInputBindingsBySlide,
  });
  const rawWorkPlan = createFramedRawWorkPlan({
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
    frames_by_slide: Object.freeze(Object.fromEntries(framesById)),
    page_image_core: coreFacts,
    style_master_reference: generation.style_master_reference,
  });
}

export function verifyFramedCandidateProof(candidate, proof) {
  const expected = candidate.receipt.slides.map((slide) => slide.slide_id);
  if (!proof || !Array.isArray(proof.pages) || canonicalJson(proof.pages.map((page) => page.slide_id)) !== canonicalJson(expected)) {
    throw new FramedImageWorkflowError("framed_render_profile_stale", "Framed layout proof did not return the candidate's ordered stable page IDs");
  }
  for (const page of proof.pages) {
    const frame = candidate.frames_by_slide?.[page.slide_id];
    if (!frame || page.render_profile_digest !== frame.render_profile.render_profile_digest ||
      canonicalJson(page.layout?.header_region) !== canonicalJson(frame.layout.header_region)) {
      throw new FramedImageWorkflowError("framed_render_profile_stale", `Framed layout proof did not bind the candidate profile and guide for ${page.slide_id}`);
    }
  }
}

function framedHeaderHtmlBySlide(receipt) {
  return Object.freeze(Object.fromEntries(receipt.slides.map((slide) => [
    slide.slide_id,
    renderFramedHeaderOverlayHtml(framedHeaderOverlayInput(slide)),
  ])));
}

export function publishFramedPageDerivedData({ context, candidate, progressiveRawWorkPlan }) {
  try {
    return publishPageDerivedData({
      run_dir: context.run_dir,
      workflow: FRAMED_IMAGE_WORKFLOW,
      receipt: candidate.receipt,
      raw_work_plan: candidate.raw_work_plan,
      progressive_raw_work_plan: progressiveRawWorkPlan,
      page_image_core: candidate.page_image_core,
      provider_requests_by_slide: candidate.provider_requests_by_slide,
      framed_header_html_by_slide: framedHeaderHtmlBySlide(candidate.receipt),
    });
  } catch (error) {
    if (!(error instanceof PageDerivedDataError)) throw error;
    const failure = new FramedImageWorkflowError(
      "target_page_derived_publication_invalid",
      "Framed page-derived data could not be published; repair the current source, presentation, or generated derived root and rerun image2 plan.",
    );
    failure.next_action = "rebuild_target_raw_plan";
    throw failure;
  }
}

// Local hasExactKeys used by framedHeaderOverlayInput (kept in sync with the
// shared raw-contract validator's helper).
function hasExactKeys(value, keys) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)) &&
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}