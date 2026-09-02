import { createHash } from "node:crypto";
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { canonicalJson, canonicalJsonSha256 } from "../../shared/identity/canonical_json.mjs";
import { validateFinalSlideManifest } from "../../shared/image2/page_image_artifacts.mjs";
import { pageImageWorkflowPaths } from "../../shared/run-bundle/bundle_layout.mjs";
import {
  PAGE_IMAGE_PPTX_ASSEMBLY_SCHEMA,
  validatePageImageAssemblyReceipt,
} from "./page_image_pptx_assembly.mjs";
import {
  readPageImageDeliveryMedia,
  validatePageImageDeliveryMediaManifest,
} from "./page_image_delivery_media.mjs";
import { injectNotes, missingSpeakerNoteContentError } from "./notes_runtime.mjs";
import { currentProtocolInvalid } from "../../shared/workflow/current_protocol_invalid.mjs";

export const PAGE_IMAGE_NOTES_RECEIPT_SCHEMA = "page-image-notes-receipt";

const SHA256_RE = /^[0-9a-f]{64}$/;
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function exactKeys(value, keys) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)) &&
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function parseCurrentRecord(bytes, kind, path, message) {
  try {
    return JSON.parse(Buffer.from(bytes).toString("utf8"));
  } catch {
    throw currentProtocolInvalid(message);
  }
}

function writeReceipt(path, receipt) {
  const temporary = `${path}.tmp-${process.pid}`;
  writeFileSync(temporary, `${canonicalJson(receipt)}\n`);
  renameSync(temporary, path);
}

/** Validate notes against exact replacement final-manifest and assembly lineage. */
export function validatePageImageNotesInput({ assembly, finalManifest, finalManifestSha256, deliveryMediaManifest, notesBySlide, sourceEpoch } = {}) {
  if (!Number.isInteger(sourceEpoch) || sourceEpoch <= 0 || !SHA256_RE.test(finalManifestSha256 || "")) {
    throw new Error("current Page Image source epoch is required for notes injection");
  }
  const manifestChecked = validateFinalSlideManifest(finalManifest);
  if (!manifestChecked.ok || manifestChecked.sha256 !== finalManifestSha256 ||
    finalManifest.schema !== "page-image-final-slide-manifest") {
    throw currentProtocolInvalid("the notes final manifest cannot establish current production identity");
  }
  const deliveryChecked = validatePageImageDeliveryMediaManifest(deliveryMediaManifest, {
    finalManifest,
    finalManifestSha256,
  });
  const assemblyChecked = validatePageImageAssemblyReceipt(assembly, {
    manifest: finalManifest,
    finalManifestSha256,
    sourceEpoch,
    deliveryMediaManifest: deliveryChecked.manifest,
  });
  if (assembly.schema !== PAGE_IMAGE_PPTX_ASSEMBLY_SCHEMA ||
    !notesBySlide || typeof notesBySlide !== "object" || Array.isArray(notesBySlide) ||
    Object.keys(notesBySlide).sort().join("\n") !== [...assemblyChecked.ordered_slide_ids].sort().join("\n")) {
    throw currentProtocolInvalid("the notes input cannot establish current production identity");
  }
  const missingPositions = [];
  for (const [index, slideId] of assemblyChecked.ordered_slide_ids.entries()) {
    const note = notesBySlide[slideId];
    if (typeof note !== "string" || !note.trim()) missingPositions.push(index + 1);
  }
  if (missingPositions.length > 0) throw missingSpeakerNoteContentError(missingPositions);
  return Object.freeze({
    assembly: assemblyChecked.receipt,
    ordered_slide_ids: assemblyChecked.ordered_slide_ids,
    final_manifest_sha256: finalManifestSha256,
    delivery_media_manifest_sha256: deliveryChecked.manifest_sha256,
    delivery_entries: assemblyChecked.delivery_entries,
  });
}

/** Validate one current notes receipt before it may support a refresh. */
export function validatePageImageNotesReceipt(receipt, {
  assembly,
  assemblyReceiptSha256,
  finalManifest,
  finalManifestSha256,
  deliveryMediaManifest,
  sourceEpoch,
} = {}) {
  const input = validatePageImageNotesInput({
    assembly,
    finalManifest,
    finalManifestSha256,
    deliveryMediaManifest,
    notesBySlide: Object.fromEntries((assembly?.ordered_slide_ids || []).map((slideId) => [slideId, "validated"])),
    sourceEpoch,
  });
  if (!SHA256_RE.test(assemblyReceiptSha256 || "") ||
    !exactKeys(receipt, [
      "schema",
      "source_epoch",
      "assembly_receipt_sha256",
      "final_manifest_sha256",
      "accepted_raw_evidence_sha256",
      "source_receipt_sha256",
      "workflow",
      "ordered_slide_ids",
      "delivery_media_manifest_sha256",
      "delivery_entries",
      "notes_fingerprint",
      "previous_pptx_sha256",
      "pptx_sha256",
      "notes_injected",
    ]) ||
    receipt.schema !== PAGE_IMAGE_NOTES_RECEIPT_SCHEMA ||
    receipt.source_epoch !== sourceEpoch ||
    receipt.assembly_receipt_sha256 !== assemblyReceiptSha256 ||
    receipt.final_manifest_sha256 !== finalManifestSha256 ||
    receipt.accepted_raw_evidence_sha256 !== finalManifest.accepted_raw_evidence_sha256 ||
    receipt.source_receipt_sha256 !== finalManifest.source_receipt_sha256 ||
    receipt.workflow !== finalManifest.workflow ||
    canonicalJson(receipt.ordered_slide_ids) !== canonicalJson(input.ordered_slide_ids) ||
    receipt.delivery_media_manifest_sha256 !== input.delivery_media_manifest_sha256 ||
    canonicalJson(receipt.delivery_entries) !== canonicalJson(input.delivery_entries) ||
    !SHA256_RE.test(receipt.notes_fingerprint || "") ||
    !SHA256_RE.test(receipt.previous_pptx_sha256 || "") ||
    !SHA256_RE.test(receipt.pptx_sha256 || "") ||
    !Number.isInteger(receipt.notes_injected) || receipt.notes_injected < 0) {
    throw currentProtocolInvalid("the notes receipt cannot establish current production identity");
  }
  return Object.freeze({ receipt: Object.freeze(receipt), ordered_slide_ids: input.ordered_slide_ids });
}

/** Inject notes into a current assembled PPTX and write a receipt bound to that assembly. */
export async function injectPageImageNotes(runDir, { notes_by_slide, sourceEpoch } = {}) {
  const paths = pageImageWorkflowPaths(runDir);
  const assemblyPath = join(paths.final_root, "pptx-assembly.json");
  if (!existsSync(paths.target_final_manifest)) {
    throw new Error("Page Image final manifest is missing");
  }
  const manifestBytes = readFileSync(paths.target_final_manifest);
  const finalManifest = parseCurrentRecord(manifestBytes, "final-manifest", paths.target_final_manifest, "Page Image final manifest is invalid");
  if (!existsSync(assemblyPath)) {
    throw new Error("Page Image PPTX assembly receipt is missing");
  }
  const assemblyBytes = readFileSync(assemblyPath);
  const assembly = parseCurrentRecord(assemblyBytes, "pptx-assembly-receipt", assemblyPath, "Page Image assembly receipt is invalid");
  const finalManifestSha256 = canonicalJsonSha256(finalManifest);
  const deliveryMedia = await readPageImageDeliveryMedia(paths, { finalManifest, finalManifestSha256 });
  const input = validatePageImageNotesInput({
    assembly,
    finalManifest,
    finalManifestSha256,
    deliveryMediaManifest: deliveryMedia.manifest,
    notesBySlide: notes_by_slide,
    sourceEpoch,
  });
  const assemblyReceiptSha256 = canonicalJsonSha256(assembly);
  const pptxPath = join(runDir, input.assembly.pptx_path);
  const notesPath = join(paths.final_root, "notes-receipt.json");
  let expectedPptxSha256 = input.assembly.pptx_sha256;
  if (existsSync(notesPath)) {
    const existing = parseCurrentRecord(readFileSync(notesPath), "notes-receipt", notesPath, "Page Image notes receipt is invalid");
    expectedPptxSha256 = validatePageImageNotesReceipt(existing, {
      assembly,
      assemblyReceiptSha256,
      finalManifest,
      finalManifestSha256,
      deliveryMediaManifest: deliveryMedia.manifest,
      sourceEpoch,
    }).receipt.pptx_sha256;
  }
  const previousPptxSha256 = sha256(readFileSync(pptxPath));
  if (previousPptxSha256 !== expectedPptxSha256) {
    throw new Error("Page Image assembled PPTX is stale before notes injection");
  }
  const result = await injectNotes({
    pptx: pptxPath,
    notes: input.ordered_slide_ids.map((slideId) => notes_by_slide[slideId]),
  });
  const receipt = {
    schema: PAGE_IMAGE_NOTES_RECEIPT_SCHEMA,
    source_epoch: sourceEpoch,
    assembly_receipt_sha256: assemblyReceiptSha256,
    final_manifest_sha256: finalManifestSha256,
    accepted_raw_evidence_sha256: finalManifest.accepted_raw_evidence_sha256,
    source_receipt_sha256: finalManifest.source_receipt_sha256,
    workflow: finalManifest.workflow,
    ordered_slide_ids: input.ordered_slide_ids,
    delivery_media_manifest_sha256: input.delivery_media_manifest_sha256,
    delivery_entries: input.delivery_entries,
    notes_fingerprint: sha256(Buffer.from(canonicalJson(notes_by_slide))),
    previous_pptx_sha256: previousPptxSha256,
    pptx_sha256: sha256(readFileSync(pptxPath)),
    notes_injected: result.notesInjected,
  };
  writeReceipt(notesPath, receipt);
  return Object.freeze({ path: notesPath, receipt: Object.freeze(receipt) });
}
