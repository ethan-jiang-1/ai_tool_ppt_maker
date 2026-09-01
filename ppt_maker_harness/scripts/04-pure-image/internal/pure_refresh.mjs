import { evaluatePageImageInvalidation } from "../../shared/page-image/page_image_invalidation.mjs";
import { hasCurrentPageImageSourceReceiptEnvelope } from "../../shared/page-image/page_image_source_receipt.mjs";
import { PureImageWorkflowError } from "../index.mjs";

function requireReceipt(receipt) {
  if (!hasCurrentPageImageSourceReceiptEnvelope(receipt, { workflow: "pure" }) || !Array.isArray(receipt.slides) || !receipt.slides.length) {
    throw new PureImageWorkflowError("wrong_workflow_owner", "Pure workflow requires a current Page Image Workflow pure receipt");
  }
  return receipt;
}

/** Pure provider-rendered content or visual source drift always carries raw-generation debt. */
export function classifyPureRefresh({
  previousReceipt,
  nextReceipt,
  rawWorkPlan = null,
  nextRawWorkPlan = null,
  acceptedRawEvidence = null,
} = {}) {
  requireReceipt(previousReceipt);
  requireReceipt(nextReceipt);
  const classified = evaluatePageImageInvalidation({
    previousReceipt,
    nextReceipt,
    previousRawWorkPlan: rawWorkPlan,
    nextRawWorkPlan,
    acceptedRawEvidence,
  });
  return Object.freeze({
    ...classified,
    kind: classified.kind === "raw_rebuild" ? "rebuild_raw" : classified.kind,
  });
}