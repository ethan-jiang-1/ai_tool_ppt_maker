import { sha256Bytes } from "../identity/byte_hash.mjs";
import {
  createFinalSlideManifest,
  validateAcceptedRawEvidence,
  validateFinalSlideManifest,
  validateRawWorkPlan,
} from "./page_authority_artifacts.mjs";

export class PageAuthorityFinalManifestError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "PageAuthorityFinalManifestError";
    this.code = code;
  }
}

function bytes(value) {
  if (!Buffer.isBuffer(value) && !(value instanceof Uint8Array)) return null;
  const copy = Buffer.from(value);
  return copy.length > 0 ? copy : null;
}

function requireCurrentEvidence({ rawWorkPlan, acceptedRawEvidence }) {
  const plan = validateRawWorkPlan(rawWorkPlan);
  if (!plan.ok) throw new PageAuthorityFinalManifestError(plan.code, plan.message);
  const evidence = validateAcceptedRawEvidence(acceptedRawEvidence, { plan: rawWorkPlan });
  if (!evidence.ok) throw new PageAuthorityFinalManifestError(evidence.code, evidence.message);
  return { plan, evidence };
}

/** Publish a final manifest only from exact current accepted raw evidence. */
export function publishCurrentFinalSlideManifest({ rawWorkPlan, acceptedRawEvidence, ownerWorkflow, finalBytesBySlide } = {}) {
  requireCurrentEvidence({ rawWorkPlan, acceptedRawEvidence });
  return createFinalSlideManifest({
    evidence: acceptedRawEvidence,
    expected_workflow: ownerWorkflow,
    final_bytes_by_slide: finalBytesBySlide,
  });
}

/** Inspect an existing final artifact without writing, healing, or rebuilding it. */
export function inspectCurrentFinalSlideManifest({ rawWorkPlan, acceptedRawEvidence, manifest, finalBytesBySlide } = {}) {
  try {
    requireCurrentEvidence({ rawWorkPlan, acceptedRawEvidence });
    const checked = validateFinalSlideManifest(manifest, { evidence: acceptedRawEvidence });
    if (!checked.ok) throw new PageAuthorityFinalManifestError(checked.code, checked.message);
    if (!finalBytesBySlide || typeof finalBytesBySlide !== "object" || Array.isArray(finalBytesBySlide)) {
      throw new PageAuthorityFinalManifestError("final_manifest_bytes_unavailable", "current final bytes are unavailable");
    }
    for (const item of manifest.items) {
      const value = bytes(finalBytesBySlide[item.slide_id]);
      if (!value || sha256Bytes(value) !== item.final_sha256) {
        throw new PageAuthorityFinalManifestError("final_manifest_bytes_stale", `final bytes drifted for ${item.slide_id}`);
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
