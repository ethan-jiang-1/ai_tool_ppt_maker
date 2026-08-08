import { sha256Bytes } from "../identity/byte_hash.mjs";
import {
  inspectExactPageImagePng,
  pageImageFinalPngForWorkflow,
} from "./page_image_media_contract.mjs";
import {
  createFinalSlideManifest,
  validateAcceptedRawEvidenceForFinalization,
  validateFinalSlideManifest,
  validateRawWorkPlanForFinalization,
} from "./page_image_artifacts.mjs";

export class PageImageFinalManifestError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "PageImageFinalManifestError";
    this.code = code;
  }
}

function bytes(value) {
  if (!Buffer.isBuffer(value) && !(value instanceof Uint8Array)) return null;
  const copy = Buffer.from(value);
  return copy.length > 0 ? copy : null;
}

function requireCurrentEvidence({ rawWorkPlan, acceptedRawEvidence }) {
  const plan = validateRawWorkPlanForFinalization(rawWorkPlan);
  if (!plan.ok) throw new PageImageFinalManifestError(plan.code, plan.message);
  const evidence = validateAcceptedRawEvidenceForFinalization(acceptedRawEvidence, { plan: rawWorkPlan });
  if (!evidence.ok) throw new PageImageFinalManifestError(evidence.code, evidence.message);
  return { plan, evidence };
}

/** Publish a final manifest only from exact current accepted raw evidence. */
export function publishCurrentFinalSlideManifest({ rawWorkPlan, acceptedRawEvidence, ownerWorkflow, finalBytesBySlide } = {}) {
  requireCurrentEvidence({ rawWorkPlan, acceptedRawEvidence });
  const finalDimensionsBySlide = {};
  for (const slideId of rawWorkPlan.ordered_slide_ids) {
    const media = inspectExactPageImagePng(finalBytesBySlide?.[slideId], pageImageFinalPngForWorkflow(ownerWorkflow));
    if (!media.ok) throw new PageImageFinalManifestError("final_manifest_media_invalid", `final media is invalid for ${slideId}`);
    finalDimensionsBySlide[slideId] = media.actual;
  }
  return createFinalSlideManifest({
    evidence: acceptedRawEvidence,
    expected_workflow: ownerWorkflow,
    final_bytes_by_slide: finalBytesBySlide,
    final_dimensions_by_slide: finalDimensionsBySlide,
  });
}

/** Inspect an existing final artifact without writing, healing, or rebuilding it. */
export function inspectCurrentFinalSlideManifest({ rawWorkPlan, acceptedRawEvidence, manifest, finalBytesBySlide } = {}) {
  try {
    requireCurrentEvidence({ rawWorkPlan, acceptedRawEvidence });
    const checked = validateFinalSlideManifest(manifest, { evidence: acceptedRawEvidence });
    if (!checked.ok) throw new PageImageFinalManifestError(checked.code, checked.message);
    if (!finalBytesBySlide || typeof finalBytesBySlide !== "object" || Array.isArray(finalBytesBySlide)) {
      throw new PageImageFinalManifestError("final_manifest_bytes_unavailable", "current final bytes are unavailable");
    }
    for (const item of manifest.items) {
      const value = bytes(finalBytesBySlide[item.slide_id]);
      if (!value || sha256Bytes(value) !== item.final_sha256) {
        throw new PageImageFinalManifestError("final_manifest_bytes_stale", `final bytes drifted for ${item.slide_id}`);
      }
      if (Object.hasOwn(item, "width")) {
        const media = inspectExactPageImagePng(value, pageImageFinalPngForWorkflow(manifest.workflow));
        if (!media.ok || media.actual.width !== item.width || media.actual.height !== item.height) {
          throw new PageImageFinalManifestError("final_manifest_dimensions_stale", `final dimensions drifted for ${item.slide_id}`);
        }
      }
    }
    return Object.freeze({ ok: true, manifest, sha256: checked.sha256 });
  } catch (error) {
    return Object.freeze({
      ok: false,
      code: error.code || "final_manifest_unavailable",
      next_action: "rebuild_final_through_owner",
    });
  }
}
