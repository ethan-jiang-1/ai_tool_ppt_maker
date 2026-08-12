export const PAGE_IMAGE_WORKFLOW_SOURCE_RECEIPT_SCHEMA = "page-source-receipt";
export const PAGE_IMAGE_WORKFLOW_SOURCE_RECEIPT_ARTIFACT_ROLE = "parsed-source";
export const PAGE_IMAGE_WORKFLOW_PIPELINE = "page-image-workflow";
const PAGE_IMAGE_WORKFLOW_SOURCE_RECEIPT_KEYS = Object.freeze([
  "schema",
  "artifact_role",
  "pipeline",
  "workflow",
  "source_sha256",
  "slides",
]);

export function hasCurrentPageImageSourceReceiptEnvelope(value, { workflow = null } = {}) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).length === PAGE_IMAGE_WORKFLOW_SOURCE_RECEIPT_KEYS.length &&
    PAGE_IMAGE_WORKFLOW_SOURCE_RECEIPT_KEYS.every((key) => Object.hasOwn(value, key)) &&
    value.schema === PAGE_IMAGE_WORKFLOW_SOURCE_RECEIPT_SCHEMA &&
    value.artifact_role === PAGE_IMAGE_WORKFLOW_SOURCE_RECEIPT_ARTIFACT_ROLE &&
    value.pipeline === PAGE_IMAGE_WORKFLOW_PIPELINE &&
    (workflow === null || value.workflow === workflow));
}
