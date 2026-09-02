/**
 * page_image_presentation_envelope — Bound presentation-profile inputs into the Page Image compile envelope.
 * Authority: openspec/specs/image-generation/spec.md
 */

export const PAGE_IMAGE_PRESENTATION_SCHEMA = "page-layout";
export const PAGE_IMAGE_PRESENTATION_ARTIFACT_ROLE = "resolved-presentation";

const PROFILE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SHA256_RE = /^[0-9a-f]{64}$/;

export function hasCurrentPageImagePresentationEnvelope(value, { workflow = null, pageClass = null } = {}) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) &&
    value.schema === PAGE_IMAGE_PRESENTATION_SCHEMA &&
    value.artifact_role === PAGE_IMAGE_PRESENTATION_ARTIFACT_ROLE &&
    !Object.hasOwn(value, "stage") && !Object.hasOwn(value, "role") &&
    (workflow === null || value.workflow === workflow) &&
    (pageClass === null || value.page_class === pageClass) &&
    typeof value.profile_id === "string" && PROFILE_ID.test(value.profile_id) &&
    SHA256_RE.test(value.binding_sha256 || "") &&
    value.provenance && typeof value.provenance === "object" && !Array.isArray(value.provenance));
}
