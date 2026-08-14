import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { createCanvas } from "@napi-rs/canvas";
import { canonicalJson, canonicalJsonSha256 } from "../shared/identity/canonical_json.mjs";
import { validateFinalSlideManifest } from "../shared/image2/page_image_artifacts.mjs";
import { inspectPageImageFinalMedia } from "../shared/image2/page_image_media_contract.mjs";
import { createPngRasterProjectionCanvas } from "../shared/image2/png_raster_projection.mjs";
import { pageImageWorkflowPaths } from "../shared/run-bundle/bundle_layout.mjs";
import { currentProtocolInvalid, isCurrentProtocolInvalid } from "../shared/workflow/current_protocol_invalid.mjs";
import { extractNoteRecordsFromMarkdown } from "./internal/notes_runtime.mjs";
import {
  PAGE_IMAGE_PPTX_ASSEMBLY_SCHEMA,
  assemblePageImagePptx,
  validatePageImageAssemblyInput,
  validatePageImageAssemblyReceipt,
} from "./internal/page_image_pptx_assembly.mjs";
import {
  PAGE_IMAGE_NOTES_RECEIPT_SCHEMA,
  injectPageImageNotes,
  validatePageImageNotesInput,
  validatePageImageNotesReceipt,
} from "./internal/page_image_notes.mjs";
import {
  PAGE_IMAGE_DELIVERY_MEDIA_PROFILE,
  PAGE_IMAGE_DELIVERY_MEDIA_SCHEMA,
  derivePageImageDeliveryMedia,
  publishPageImageDeliveryMedia,
  readPageImageDeliveryMedia,
  validatePageImageDeliveryMediaManifest,
} from "./internal/page_image_delivery_media.mjs";

export const PAGE_IMAGE_DELIVERY_RECEIPT_SCHEMA = "page-image-delivery-receipt";

export {
  PAGE_IMAGE_NOTES_RECEIPT_SCHEMA,
  PAGE_IMAGE_PPTX_ASSEMBLY_SCHEMA,
  PAGE_IMAGE_DELIVERY_MEDIA_PROFILE,
  PAGE_IMAGE_DELIVERY_MEDIA_SCHEMA,
  assemblePageImagePptx,
  derivePageImageDeliveryMedia,
  injectPageImageNotes,
  readPageImageDeliveryMedia,
  validatePageImageAssemblyInput,
  validatePageImageAssemblyReceipt,
  validatePageImageDeliveryMediaManifest,
  validatePageImageNotesInput,
  validatePageImageNotesReceipt,
};

export class PageImageDeliveryError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "PageImageDeliveryError";
    this.code = code;
  }
}

const SHA256_RE = /^[0-9a-f]{64}$/;
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function parseCurrentDeliveryRecord(bytes, message) {
  try {
    return JSON.parse(Buffer.from(bytes).toString("utf8"));
  } catch {
    throw currentProtocolInvalid(message);
  }
}

function asBytes(value, label) {
  if (!Buffer.isBuffer(value) && !(value instanceof Uint8Array)) {
    throw new PageImageDeliveryError("final_bytes_invalid", `${label} must be bytes`);
  }
  const bytes = Buffer.from(value);
  if (bytes.length === 0) throw new PageImageDeliveryError("final_bytes_invalid", `${label} must not be empty`);
  return bytes;
}

function exactKeys(value, keys) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)) &&
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function writeAtomic(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.tmp-${process.pid}`;
  writeFileSync(temporary, bytes);
  renameSync(temporary, path);
}

/** Resolve only source-authored notes in final-manifest order. */
export function sourceOwnedNotesBySlide(sourcePath, orderedSlideIds) {
  if (typeof sourcePath !== "string" || !sourcePath) {
    throw new PageImageDeliveryError("source_notes_unavailable", "the canonical source path is required for notes delivery");
  }
  const records = extractNoteRecordsFromMarkdown([sourcePath]);
  const notesBySlide = Object.fromEntries(records.map((record) => [record.slide_id, record.note]));
  if (!exactKeys(notesBySlide, orderedSlideIds)) {
    throw new PageImageDeliveryError("source_notes_lineage_mismatch", "source notes must exactly cover final manifest slide IDs");
  }
  return Object.freeze(notesBySlide);
}

/** Validate identity-bearing final facts before source-note or delivery-artifact reads. */
function validateTargetFinalDeliveryIdentity({ manifest, acceptedRawEvidence, finalBytesBySlide, sourceEpoch } = {}) {
  if (!Number.isInteger(sourceEpoch) || sourceEpoch <= 0) {
    throw new PageImageDeliveryError("source_epoch_invalid", "a positive target source epoch is required for delivery");
  }
  const manifestValidation = validateFinalSlideManifest(manifest, { evidence: acceptedRawEvidence });
  if (!manifestValidation.ok || manifest.schema !== "page-image-final-slide-manifest") {
    throw currentProtocolInvalid("the target final manifest cannot establish current production identity");
  }
  const orderedSlideIds = manifest.items.map((item) => item.slide_id);
  if (!finalBytesBySlide || typeof finalBytesBySlide !== "object" || Array.isArray(finalBytesBySlide) ||
    Object.keys(finalBytesBySlide).sort().join("\n") !== [...orderedSlideIds].sort().join("\n")) {
    throw new PageImageDeliveryError("final_bytes_coverage_invalid", "final bytes must exactly cover final manifest slide IDs");
  }
  const finalBytes = {};
  if (!Array.isArray(acceptedRawEvidence?.items)) {
    throw currentProtocolInvalid("the target final evidence cannot establish current production identity");
  }
  const rawShaBySlide = new Map(acceptedRawEvidence.items.map((item) => [item.slide_id, item.raw_sha256]));
  for (const item of manifest.items) {
    const bytes = asBytes(finalBytesBySlide[item.slide_id], `final bytes for ${item.slide_id}`);
    if (sha256(bytes) !== item.final_sha256) {
      throw new PageImageDeliveryError("final_bytes_stale", `final bytes drifted for ${item.slide_id}`);
    }
    const media = inspectPageImageFinalMedia({
      workflow: manifest.workflow,
      finalBytes: bytes,
      rawSha256: rawShaBySlide.get(item.slide_id),
      finalSha256: item.final_sha256,
    });
    if (!media.ok) throw new PageImageDeliveryError(media.code, `final bytes for ${item.slide_id} do not meet the selected workflow media contract`);
    if (Object.hasOwn(item, "width") && (item.width !== media.actual.width || item.height !== media.actual.height)) {
      throw new PageImageDeliveryError("final_dimensions_stale", `final dimensions drifted for ${item.slide_id}`);
    }
    finalBytes[item.slide_id] = media.bytes;
  }
  return Object.freeze({
    manifest: Object.freeze(manifest),
    manifest_sha256: manifestValidation.sha256,
    ordered_slide_ids: Object.freeze(orderedSlideIds),
    final_bytes_by_slide: Object.freeze(finalBytes),
    source_epoch: sourceEpoch,
  });
}

/** Validate shared replacement final media before any delivery artifact is written. */
export function validateTargetFinalDeliveryInput({ manifest, acceptedRawEvidence, finalBytesBySlide, notesBySlide, sourceEpoch } = {}) {
  const identity = validateTargetFinalDeliveryIdentity({ manifest, acceptedRawEvidence, finalBytesBySlide, sourceEpoch });
  if (!notesBySlide || typeof notesBySlide !== "object" || Array.isArray(notesBySlide) ||
    Object.keys(notesBySlide).sort().join("\n") !== [...identity.ordered_slide_ids].sort().join("\n")) {
    throw new PageImageDeliveryError("notes_coverage_invalid", "source notes must exactly cover final manifest slide IDs");
  }
  for (const slideId of identity.ordered_slide_ids) {
    if (typeof notesBySlide[slideId] !== "string" || !notesBySlide[slideId].trim()) {
      throw new PageImageDeliveryError("source_notes_invalid", `source notes are missing for ${slideId}`);
    }
  }
  return Object.freeze({ ...identity, notes_by_slide: Object.freeze({ ...notesBySlide }) });
}

/** Delivery has one current replacement-manifest protocol. */
export function validatePageImageDeliveryInput(input = {}) {
  return Object.freeze({
    protocol: "page-image-workflow",
    input: validateTargetFinalDeliveryInput(input),
  });
}

function readPersistedTargetFinalManifest(paths, input, acceptedRawEvidence) {
  let bytes;
  try {
    bytes = readFileSync(paths.target_final_manifest);
  } catch {
    throw new PageImageDeliveryError("final_manifest_unavailable", "current final manifest is required before delivery");
  }
  const persisted = parseCurrentDeliveryRecord(bytes, "the persisted final manifest cannot establish current production identity");
  const check = validateFinalSlideManifest(persisted, { evidence: acceptedRawEvidence });
  if (!check.ok || check.sha256 !== input.manifest_sha256 ||
    canonicalJsonSha256(persisted) !== canonicalJsonSha256(input.manifest)) {
    throw currentProtocolInvalid("the persisted final manifest cannot establish current production identity");
  }
  return Object.freeze(persisted);
}

function deriveFinalProjection(input) {
  const width = 1032;
  const cellWidth = 500;
  const cellHeight = 281;
  const padding = 16;
  const labelHeight = 34;
  const rows = Math.ceil(input.manifest.items.length / 2);
  const canvas = createCanvas(width, padding * 2 + rows * (cellHeight + labelHeight) + Math.max(0, rows - 1) * padding);
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  try {
    for (const [index, item] of input.manifest.items.entries()) {
      const x = padding + (index % 2) * (cellWidth + padding);
      const y = padding + Math.floor(index / 2) * (cellHeight + labelHeight + padding);
      const imageCanvas = createPngRasterProjectionCanvas(input.final_bytes_by_slide[item.slide_id]);
      context.drawImage(imageCanvas, x, y, cellWidth, cellHeight);
      context.fillStyle = "#17212b";
      context.font = "700 16px Arial";
      context.fillText(item.slide_id, x, y + cellHeight + 22);
    }
  } catch (error) {
    throw new PageImageDeliveryError(
      "final_projection_invalid",
      error?.message || "final PNG media could not be rendered as a delivery projection",
    );
  }
  const bytes = canvas.toBuffer("image/png");
  return Object.freeze({ bytes, sha256: sha256(bytes) });
}

function publishFinalProjection(paths, derivedProjection) {
  if ((!Buffer.isBuffer(derivedProjection?.bytes) && !(derivedProjection?.bytes instanceof Uint8Array)) ||
    sha256(derivedProjection.bytes) !== derivedProjection.sha256) {
    throw new PageImageDeliveryError("final_projection_invalid", "final projection bytes are invalid");
  }
  writeAtomic(paths.final_projection, derivedProjection.bytes);
  return Object.freeze({ path: paths.final_projection, sha256: derivedProjection.sha256 });
}

/**
 * The single final delivery writer. It consumes a persisted replacement
 * manifest and writes only its derived media, assembly, notes, and receipt.
 */
export async function deliverTargetFinalSlideManifest({
  runDir,
  manifest,
  acceptedRawEvidence,
  finalBytesBySlide,
  notesBySlide = null,
  sourcePath = null,
  sourceEpoch = 1,
  title = "Presentation",
  deliveryMediaDeriver = derivePageImageDeliveryMedia,
  projectionDeriver = deriveFinalProjection,
} = {}) {
  // Identity must hard-stop before source-note or artifact reads.
  const identity = validateTargetFinalDeliveryIdentity({ manifest, acceptedRawEvidence, finalBytesBySlide, sourceEpoch });
  const selectedNotes = notesBySlide || sourceOwnedNotesBySlide(sourcePath, identity.ordered_slide_ids);
  const input = validateTargetFinalDeliveryInput({
    manifest,
    acceptedRawEvidence,
    finalBytesBySlide,
    notesBySlide: selectedNotes,
    sourceEpoch,
  });
  const paths = pageImageWorkflowPaths(runDir);
  readPersistedTargetFinalManifest(paths, input, acceptedRawEvidence);
  let derivedDeliveryMedia;
  try {
    derivedDeliveryMedia = await deliveryMediaDeriver({
      finalManifest: input.manifest,
      finalManifestSha256: input.manifest_sha256,
      finalBytesBySlide: input.final_bytes_by_slide,
    });
  } catch (error) {
    throw new PageImageDeliveryError("delivery_media_derivation_failed", error.message);
  }
  let derivedProjection;
  try {
    derivedProjection = await projectionDeriver(input);
  } catch (error) {
    throw new PageImageDeliveryError(
      "final_projection_invalid",
      error?.message || "final PNG media could not be rendered as a delivery projection",
    );
  }
  for (const item of input.manifest.items) {
    writeAtomic(join(paths.final_root, item.path), input.final_bytes_by_slide[item.slide_id]);
  }
  const projection = publishFinalProjection(paths, derivedProjection);
  let deliveryMedia;
  try {
    deliveryMedia = publishPageImageDeliveryMedia(paths, derivedDeliveryMedia);
  } catch (error) {
    throw new PageImageDeliveryError("delivery_media_publication_failed", error.message);
  }
  const assembly = await assemblePageImagePptx(runDir, {
    title,
    sourceEpoch: input.source_epoch,
    manifest: input.manifest,
    acceptedRawEvidence,
  });
  const notes = await injectPageImageNotes(runDir, {
    notes_by_slide: input.notes_by_slide,
    sourceEpoch: input.source_epoch,
  });
  const receipt = Object.freeze({
    schema: PAGE_IMAGE_DELIVERY_RECEIPT_SCHEMA,
    source_epoch: input.source_epoch,
    final_manifest_sha256: input.manifest_sha256,
    assembly_receipt_sha256: canonicalJsonSha256(assembly.receipt),
    notes_receipt_sha256: canonicalJsonSha256(notes.receipt),
    delivery_media_manifest_sha256: deliveryMedia.manifest_sha256,
    delivery_entries: assembly.receipt.delivery_entries,
    ordered_slide_ids: input.ordered_slide_ids,
    final_entries: input.manifest.items.map((item) => ({ slide_id: item.slide_id, final_sha256: item.final_sha256 })),
    projection_sha256: projection.sha256,
    pptx_path: relative(runDir, assembly.path).split("\\").join("/"),
    pptx_sha256: notes.receipt.pptx_sha256,
    notes_fingerprint: notes.receipt.notes_fingerprint,
    notes_injected: notes.receipt.notes_injected,
  });
  const receiptPath = join(paths.final_root, "delivery-receipt.json");
  writeAtomic(receiptPath, Buffer.from(`${canonicalJson(receipt)}\n`, "utf8"));
  return Object.freeze({ receipt, receipt_path: receiptPath, projection, delivery_media: deliveryMedia, assembly, notes });
}

async function currentTargetDeliveryReceipt(runDir) {
  const paths = pageImageWorkflowPaths(runDir);
  const receiptPath = join(paths.final_root, "delivery-receipt.json");
  let receiptBytes;
  try {
    receiptBytes = readFileSync(receiptPath);
  } catch {
    throw new PageImageDeliveryError("delivery_receipt_unavailable", "current replacement delivery lineage is unavailable for notes refresh");
  }
  const receipt = parseCurrentDeliveryRecord(receiptBytes, "the delivery receipt cannot establish current production identity");
  if (!receipt || !Number.isInteger(receipt.source_epoch) || receipt.source_epoch <= 0) {
    throw currentProtocolInvalid("the delivery receipt cannot establish current production identity");
  }
  let manifestBytes;
  try {
    manifestBytes = readFileSync(paths.target_final_manifest);
  } catch {
    throw new PageImageDeliveryError("delivery_receipt_unavailable", "current replacement delivery lineage is unavailable for notes refresh");
  }
  const manifest = parseCurrentDeliveryRecord(manifestBytes, "the final manifest cannot establish current production identity");
  const manifestCheck = validateFinalSlideManifest(manifest);
  if (!manifestCheck.ok || manifest.schema !== "page-image-final-slide-manifest") {
    throw currentProtocolInvalid("the final manifest cannot establish current production identity");
  }
  if (!SHA256_RE.test(receipt.delivery_media_manifest_sha256 || "")) {
    throw currentProtocolInvalid("the delivery receipt cannot establish current production identity");
  }
  let deliveryMedia;
  try {
    deliveryMedia = await readPageImageDeliveryMedia(paths, {
      finalManifest: manifest,
      finalManifestSha256: manifestCheck.sha256,
    });
  } catch (error) {
    if (isCurrentProtocolInvalid(error)) throw error;
    throw new PageImageDeliveryError("delivery_media_rebuild_required", "current JPEG delivery media must be rebuilt through normal delivery");
  }
  const assemblyPath = join(paths.final_root, "pptx-assembly.json");
  let assemblyBytes;
  try {
    assemblyBytes = readFileSync(assemblyPath);
  } catch {
    throw new PageImageDeliveryError("delivery_receipt_unavailable", "current replacement delivery lineage is unavailable for notes refresh");
  }
  const assembly = parseCurrentDeliveryRecord(assemblyBytes, "the assembly receipt cannot establish current production identity");
  const assemblyCheck = validatePageImageAssemblyReceipt(assembly, {
    manifest,
    finalManifestSha256: manifestCheck.sha256,
    sourceEpoch: receipt.source_epoch,
    deliveryMediaManifest: deliveryMedia.manifest,
  });
  const notesPath = join(paths.final_root, "notes-receipt.json");
  let notesBytes;
  try {
    notesBytes = readFileSync(notesPath);
  } catch {
    throw new PageImageDeliveryError("delivery_receipt_unavailable", "current replacement delivery lineage is unavailable for notes refresh");
  }
  const notes = parseCurrentDeliveryRecord(notesBytes, "the notes receipt cannot establish current production identity");
  const notesCheck = validatePageImageNotesReceipt(notes, {
    assembly,
    assemblyReceiptSha256: canonicalJsonSha256(assembly),
    finalManifest: manifest,
    finalManifestSha256: manifestCheck.sha256,
    deliveryMediaManifest: deliveryMedia.manifest,
    sourceEpoch: receipt.source_epoch,
  });
  const pptxPath = join(paths.final_root, "deck.pptx");
  const expectedPptxPath = relative(runDir, pptxPath).split("\\").join("/");
  if (!exactKeys(receipt, [
    "schema",
    "source_epoch",
    "final_manifest_sha256",
    "assembly_receipt_sha256",
    "notes_receipt_sha256",
    "delivery_media_manifest_sha256",
    "delivery_entries",
    "ordered_slide_ids",
    "final_entries",
    "projection_sha256",
    "pptx_path",
    "pptx_sha256",
    "notes_fingerprint",
    "notes_injected",
  ]) ||
    receipt.schema !== PAGE_IMAGE_DELIVERY_RECEIPT_SCHEMA ||
    receipt.final_manifest_sha256 !== manifestCheck.sha256 ||
    receipt.assembly_receipt_sha256 !== canonicalJsonSha256(assembly) ||
    receipt.notes_receipt_sha256 !== canonicalJsonSha256(notes) ||
    receipt.delivery_media_manifest_sha256 !== deliveryMedia.manifest_sha256 ||
    canonicalJson(receipt.delivery_entries) !== canonicalJson(assemblyCheck.delivery_entries) ||
    canonicalJson(receipt.ordered_slide_ids) !== canonicalJson(assemblyCheck.ordered_slide_ids) ||
    receipt.pptx_path !== expectedPptxPath ||
    receipt.pptx_sha256 !== notesCheck.receipt.pptx_sha256 ||
    receipt.notes_fingerprint !== notesCheck.receipt.notes_fingerprint ||
    receipt.notes_injected !== notesCheck.receipt.notes_injected ||
    !existsSync(pptxPath) || sha256(readFileSync(pptxPath)) !== receipt.pptx_sha256) {
    throw currentProtocolInvalid("the delivery receipt cannot establish current production identity");
  }
  return Object.freeze({
    paths,
    receipt: Object.freeze(receipt),
    receiptPath,
    manifest: Object.freeze(manifest),
    assembly: assemblyCheck.receipt,
    notes: notesCheck.receipt,
    delivery_media: deliveryMedia,
    pptxPath,
  });
}

/**
 * Inspect the one current delivery lineage without refreshing notes or writing
 * any state/artifact. A missing receipt means delivery is not available yet;
 * every present receipt still traverses the same strict binding validation.
 */
export async function inspectCurrentTargetPageImageDelivery({ runDir } = {}) {
  const paths = pageImageWorkflowPaths(runDir);
  const receiptPath = join(paths.final_root, "delivery-receipt.json");
  if (!existsSync(receiptPath)) return Object.freeze({ available: false });
  const current = await currentTargetDeliveryReceipt(runDir);
  return Object.freeze({ available: true, ...current });
}

/**
 * Existing delivery identity is checked before an adapter publishes another
 * final manifest. A first delivery has no record to inspect; a present record
 * must already be a complete current lineage rather than a replacement input.
 */
export async function assertPresentCurrentTargetDeliveryIdentity({ runDir } = {}) {
  const paths = pageImageWorkflowPaths(runDir);
  const receiptPath = join(paths.final_root, "delivery-receipt.json");
  if (existsSync(receiptPath)) return currentTargetDeliveryReceipt(runDir);
  if (!existsSync(paths.target_final_manifest)) return null;

  let manifestBytes;
  try {
    manifestBytes = readFileSync(paths.target_final_manifest);
  } catch {
    throw currentProtocolInvalid("the persisted final manifest cannot establish current production identity");
  }
  const manifest = parseCurrentDeliveryRecord(manifestBytes, "the persisted final manifest cannot establish current production identity");
  const check = validateFinalSlideManifest(manifest);
  if (!check.ok || manifest.schema !== "page-image-final-slide-manifest") {
    throw currentProtocolInvalid("the persisted final manifest cannot establish current production identity");
  }
  return Object.freeze({ available: false, manifest: Object.freeze(manifest), manifest_sha256: check.sha256 });
}

/** Refresh notes only after revalidating the same replacement final/assembly lineage. */
export async function refreshTargetPageImageNotes({ runDir, sourcePath, sourceEpoch = null } = {}) {
  const current = await currentTargetDeliveryReceipt(runDir);
  if (sourceEpoch !== null && sourceEpoch !== current.receipt.source_epoch) {
    throw new PageImageDeliveryError("notes_source_epoch_mismatch", "target notes refresh requires the delivery receipt source epoch");
  }
  const notesBySlide = sourceOwnedNotesBySlide(sourcePath, current.receipt.ordered_slide_ids);
  const notes = await injectPageImageNotes(runDir, {
    notes_by_slide: notesBySlide,
    sourceEpoch: current.receipt.source_epoch,
  });
  const receipt = Object.freeze({
    ...current.receipt,
    notes_receipt_sha256: canonicalJsonSha256(notes.receipt),
    pptx_sha256: notes.receipt.pptx_sha256,
    notes_fingerprint: notes.receipt.notes_fingerprint,
    notes_injected: notes.receipt.notes_injected,
  });
  writeAtomic(current.receiptPath, Buffer.from(`${canonicalJson(receipt)}\n`, "utf8"));
  return Object.freeze({ receipt, receipt_path: current.receiptPath, notes });
}

/** The public delivery facade accepts only the declared manifest contract. */
export async function deliverPageImageManifest(input = {}) {
  validatePageImageDeliveryInput(input);
  return deliverTargetFinalSlideManifest(input);
}

export function deliveryReceiptSha256(receipt) {
  return canonicalJsonSha256(receipt);
}
