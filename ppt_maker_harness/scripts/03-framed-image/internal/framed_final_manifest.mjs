import { composeFramedHeaderOverlays } from "./framed_render_contract.mjs";
import { sha256Bytes } from "../../shared/identity/byte_hash.mjs";
import { canonicalJsonSha256 } from "../../shared/identity/canonical_json.mjs";
import { publishCurrentFinalSlideManifest } from "../../shared/image2/page_image_final_manifest.mjs";
import { validateRawWorkPlan, validateAcceptedRawEvidenceForFinalization } from "../../shared/image2/page_image_artifacts.mjs";
import { FRAMED_IMAGE_WORKFLOW, FramedImageWorkflowError, requireReceipt } from "./framed_identity.mjs";
import { framedHeaderOverlayInput } from "./framed_raw_plan.mjs";
import { requireFramedFinalCompositionInput } from "./framed_review.mjs";

/** Compose the closed local header overlay over accepted provider-page bytes. */
export async function composeFramedFinalSlideManifest(input = {}) {
  const { receipt, rawWorkPlan, acceptedRawEvidence, rawBytesBySlide } = requireFramedFinalCompositionInput(input);
  const evidencePlan = input.evidencePlan ?? rawWorkPlan;
  requireReceipt(receipt);
  const rawPlan = validateRawWorkPlan(rawWorkPlan);
  const evidence = validateAcceptedRawEvidenceForFinalization(acceptedRawEvidence, { plan: evidencePlan });
  if (!evidence.ok) throw new FramedImageWorkflowError(evidence.code, evidence.message);
  if (!rawPlan.ok || rawWorkPlan.workflow !== FRAMED_IMAGE_WORKFLOW || rawWorkPlan.source_receipt_sha256 !== receipt.source_sha256 ||
    evidencePlan.workflow !== FRAMED_IMAGE_WORKFLOW || evidencePlan.source_receipt_sha256 !== receipt.source_sha256 ||
    canonicalJsonSha256(rawWorkPlan.ordered_slide_ids) !== canonicalJsonSha256(evidencePlan.ordered_slide_ids) ||
    canonicalJsonSha256(rawWorkPlan.items) !== canonicalJsonSha256(evidencePlan.items)) {
    throw new FramedImageWorkflowError("framed_finalization_lineage_invalid", "Framed finalization requires matching selected-workflow raw-plan lineage");
  }
  const byId = new Map(receipt.slides.map((slide) => [slide.slide_id, slide]));
  const frames = [];
  for (const item of acceptedRawEvidence.items) {
    const slide = byId.get(item.slide_id);
    const raw = rawBytesBySlide?.[item.slide_id];
    if (!slide || !raw) throw new FramedImageWorkflowError("accepted_raw_unavailable", `accepted raw bytes are unavailable for ${item.slide_id}`);
    frames.push(Object.freeze({
      ...framedHeaderOverlayInput(slide),
      verified_raw: { bytes: Buffer.from(raw), sha256: item.raw_sha256 },
    }));
  }
  const composed = await composeFramedHeaderOverlays(frames);
  const finalBytesBySlide = composed.final_bytes_by_slide;
  const manifest = publishCurrentFinalSlideManifest({
    rawWorkPlan: evidencePlan,
    acceptedRawEvidence,
    ownerWorkflow: FRAMED_IMAGE_WORKFLOW,
    finalBytesBySlide,
  });
  return Object.freeze({ manifest, final_bytes_by_slide: Object.freeze(finalBytesBySlide) });
}

/** Return only the Framed finalization manifest. */
export async function publishFramedFinalSlideManifest(input = {}) {
  return (await composeFramedFinalSlideManifest(input)).manifest;
}