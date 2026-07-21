import { readFileSync } from "node:fs";

import { loadHtmlAssetCatalog } from "../../02-visual-system/index.mjs";
import {
  REFINEMENT_REQUEST_CONTRACT_VERSION_V1,
  RefinementContractError,
  refinementAttemptRole,
  refinementRequestFingerprint,
  normalizeProfileContract,
  normalizeRefinementRequestMaterial,
  verifyRefinementRequestReferences,
} from "./contracts.mjs";

function mediaForAsset(entry) {
  if (entry.type === "png") return "image/png";
  if (entry.type === "jpg") return "image/jpeg";
  if (entry.type === "svg") return "image/svg+xml";
  throw new RefinementContractError("HTML asset has an unsupported request media type", "stale_request_material");
}

function assetReference(catalog, assetId, role) {
  const entry = catalog[assetId];
  if (!entry || typeof entry.absolute_path !== "string") {
    throw new RefinementContractError("current HTML reference asset is unavailable", "stale_request_material");
  }
  const bytes = readFileSync(entry.absolute_path);
  return {
    role,
    kind: "asset",
    media: mediaForAsset(entry),
    sha256: entry.measured_sha256,
    bytes,
  };
}

function referencesForSlot(slide, catalog, { styleReferenceCurrent = false } = {}) {
  const references = [];
  if (styleReferenceCurrent) references.push(assetReference(catalog, "refined-style-reference", "style-reference"));
  const resolution = slide.visual_resolution;
  if (!resolution || typeof resolution !== "object") {
    throw new RefinementContractError("current HTML visual resolution is unavailable", "stale_request_material");
  }
  if (resolution.effective === "selected" && resolution.selected?.asset?.asset_id) {
    references.push(assetReference(catalog, resolution.selected.asset.asset_id, "selected-visual"));
  } else if (resolution.fallback?.kind === "asset" && resolution.fallback.asset?.asset_id) {
    references.push(assetReference(catalog, resolution.fallback.asset.asset_id, "fallback-asset"));
  } else if (resolution.fallback?.kind === "icon-composition") {
    for (const [index, asset] of (resolution.fallback.assets || []).entries()) {
      if (!asset?.asset_id) throw new RefinementContractError("current HTML icon reference is unavailable", "stale_request_material");
      references.push(assetReference(catalog, asset.asset_id, `fallback-icon-${index + 1}`));
    }
  } else if (resolution.fallback?.kind === "abstract-pattern") {
    references.push({ role: "fallback-abstract-pattern", kind: "abstract-pattern", media: null, sha256: null });
  } else {
    throw new RefinementContractError("current HTML fallback reference is unavailable", "stale_request_material");
  }
  return references;
}

function slotGeometry(slide) {
  const box = slide.geometry?.boxes?.primary_visual;
  if (!Array.isArray(box) || box.length !== 4 || box.some((value) => !Number.isFinite(value))) {
    throw new RefinementContractError("current HTML primary visual geometry is unavailable", "stale_request_material");
  }
  return { x: box[0], y: box[1], width: box[2], height: box[3] };
}

function slotMaterial(slide, profileContract, references) {
  return normalizeRefinementRequestMaterial({
    request_contract_version: REFINEMENT_REQUEST_CONTRACT_VERSION_V1,
    kind: "slot",
    slide_id: slide.slide_id,
    slot: "primary_visual",
    visual_brief: slide.primary_visual?.brief || null,
    concept: slide.concept || null,
    geometry: slotGeometry(slide),
    profile_contract: profileContract,
    references,
  });
}

function styleMaterial(profileContract, slotMaterials) {
  const references = [];
  for (const [index, material] of slotMaterials.entries()) {
    for (const reference of material.references) {
      references.push({
        ...reference,
        role: `style-${index + 1}-${reference.role}`,
      });
    }
  }
  return normalizeRefinementRequestMaterial({
    request_contract_version: REFINEMENT_REQUEST_CONTRACT_VERSION_V1,
    kind: "style-reference",
    slide_id: null,
    slot: null,
    visual_brief: null,
    concept: null,
    geometry: null,
    profile_contract: profileContract,
    references,
  });
}

/**
 * Materialize provider-neutral requests from current local HTML ownership. No
 * request bytes leave memory and this module has no credential or network API.
 */
export function materializeRefinementRequestSet({ runDir, htmlPlan, refinementPlan }) {
  if (!htmlPlan || !Array.isArray(htmlPlan.slides) || !refinementPlan || !Array.isArray(refinementPlan.slides)) {
    throw new RefinementContractError("current HTML plan and refinement plan are required", "stale_request_material");
  }
  const profileContract = normalizeProfileContract(refinementPlan.profile_contract, refinementPlan.profile_fingerprint);
  const selected = new Map(refinementPlan.slides.map((slide) => [slide.slide_id, slide]));
  const currentSlides = htmlPlan.slides.filter((slide) => selected.has(slide.slide_id));
  if (currentSlides.length !== selected.size) throw new RefinementContractError("one or more planned HTML visual slots are no longer current", "stale_request_material");
  const catalog = loadHtmlAssetCatalog(runDir).catalog;
  const styleReferenceCurrent = refinementPlan.style_reference_status === "current";
  if (styleReferenceCurrent && !catalog["refined-style-reference"]) {
    throw new RefinementContractError("current style-reference asset is unavailable", "stale_request_material");
  }
  const slots = currentSlides
    .sort((left, right) => left.slide_id.localeCompare(right.slide_id))
    .map((slide) => {
      const planned = selected.get(slide.slide_id);
      if (planned.slot !== "primary_visual" || planned.visual_contract_fingerprint !== slide.visual_contract_fingerprint) {
        throw new RefinementContractError("planned HTML visual slot binding is stale", "stale_request_material");
      }
      const material = verifyRefinementRequestReferences(
        slotMaterial(slide, profileContract, referencesForSlot(slide, catalog, { styleReferenceCurrent })),
      );
      return Object.freeze({
        role: refinementAttemptRole({ kind: "slot", slide_id: slide.slide_id, slot: "primary_visual" }),
        material,
        request_fingerprint: refinementRequestFingerprint(material),
      });
    });
  const materials = refinementPlan.style_reference_status === "current"
    ? slots
    : [Object.freeze({
      role: refinementAttemptRole({ kind: "style-reference" }),
      material: verifyRefinementRequestReferences(styleMaterial(profileContract, slots.map((entry) => entry.material))),
      request_fingerprint: null,
    }), ...slots];
  return Object.freeze(materials.map((entry) => Object.freeze({
    ...entry,
    request_fingerprint: entry.request_fingerprint || refinementRequestFingerprint(entry.material),
  })).sort((left, right) => left.role.localeCompare(right.role)));
}

export function requestFingerprintsForPlan(materials) {
  if (!Array.isArray(materials)) throw new RefinementContractError("materialized requests are required", "invalid_request_fingerprint");
  return Object.freeze(materials.map(({ role, material, request_fingerprint }) => Object.freeze({
    role,
    kind: material.kind,
    slide_id: material.slide_id,
    slot: material.slot,
    request_fingerprint,
  })).sort((left, right) => left.role.localeCompare(right.role)));
}

export function materializeAuthorizedRefinementRequest({ materials, attempt, authorizationId, planHash }) {
  const role = refinementAttemptRole(attempt);
  const entry = (materials || []).find((candidate) => candidate.role === role);
  if (!entry || entry.request_fingerprint !== attempt.request_fingerprint) {
    throw new RefinementContractError("authorized attempt request fingerprint is stale", "stale_request_material");
  }
  const material = verifyRefinementRequestReferences(entry.material);
  return Object.freeze({
    attempt_id: attempt.attempt_id,
    authorization_id: authorizationId,
    plan_hash: planHash,
    request_fingerprint: entry.request_fingerprint,
    ...material,
  });
}
