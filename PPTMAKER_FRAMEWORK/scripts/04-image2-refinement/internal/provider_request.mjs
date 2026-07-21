import {
  isSafeRefinementId,
  isSha256,
  refinementRequestFingerprint,
  verifyRefinementRequestReferences,
} from "./contracts.mjs";

function assertEnvelope(request) {
  if (!request || typeof request !== "object" || Array.isArray(request) ||
      !isSafeRefinementId(request.attempt_id) || !isSafeRefinementId(request.authorization_id) ||
      !isSha256(request.plan_hash) || !isSha256(request.request_fingerprint)) {
    throw new Error("refinement request envelope is invalid");
  }
}

/**
 * The relay receives only fixed visual-slot defaults and the current
 * provider-neutral material. It never receives a persisted prompt/body.
 */
export function materializeVisualSlotRelayBody(request) {
  assertEnvelope(request);
  const material = verifyRefinementRequestReferences({
    request_contract_version: request.request_contract_version,
    kind: request.kind,
    slide_id: request.slide_id,
    slot: request.slot,
    visual_brief: request.visual_brief,
    concept: request.concept,
    geometry: request.geometry,
    profile_contract: request.profile_contract,
    references: request.references,
  });
  if (refinementRequestFingerprint(material) !== request.request_fingerprint) {
    throw new Error("refinement request fingerprint does not match current material");
  }
  return {
    model: "gpt-image-2",
    n: 1,
    response_format: "b64_json",
    refinement: {
      request_contract_version: material.request_contract_version,
      kind: material.kind,
      slide_id: material.slide_id,
      slot: material.slot,
      visual_brief: material.visual_brief,
      concept: material.concept,
      geometry: material.geometry,
      profile_contract: material.profile_contract,
      references: material.references.map((reference) => ({
        role: reference.role,
        kind: reference.kind,
        media: reference.media,
        sha256: reference.sha256,
        ...(reference.kind === "asset" ? { bytes_base64: reference.bytes.toString("base64") } : {}),
      })),
    },
  };
}
