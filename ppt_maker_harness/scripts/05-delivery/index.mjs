import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { createCanvas } from "@napi-rs/canvas";
import { decode as decodePng } from "fast-png";
import { canonicalJson, canonicalJsonSha256 } from "../shared/identity/canonical_json.mjs";
import { validateFinalSlideManifest } from "../shared/image2/page_image_artifacts.mjs";
import { inspectPageImageFinalMedia } from "../shared/image2/page_image_media_contract.mjs";
import { pageImageWorkflowPaths } from "../shared/run-bundle/bundle_layout.mjs";
import {
  UNSUPPORTED_PROTOCOL_EXPORT_ACTION,
  evaluateReplacementIdentity,
} from "../shared/run-bundle/page_image_workflow_identity.mjs";
import { extractNoteRecordsFromMarkdown } from "./internal/notes_runtime.mjs";
import {
  PAGE_IMAGE_PPTX_ASSEMBLY_SCHEMA,
  assemblePageImagePptx,
  validatePageImageAssemblyInput,
  validatePageImageAssemblyReceipt,
} from "./internal/page_image_pptx_assembly_v1.mjs";
import {
  PAGE_IMAGE_NOTES_RECEIPT_SCHEMA,
  injectPageImageNotes,
  validatePageImageNotesInput,
  validatePageImageNotesReceipt,
} from "./internal/page_image_notes_v1.mjs";

export const PAGE_IMAGE_DELIVERY_RECEIPT_SCHEMA = "page-image-delivery-receipt-v1";

export {
  PAGE_IMAGE_NOTES_RECEIPT_SCHEMA,
  PAGE_IMAGE_PPTX_ASSEMBLY_SCHEMA,
  assemblePageImagePptx,
  injectPageImageNotes,
  validatePageImageAssemblyInput,
  validatePageImageAssemblyReceipt,
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

function requireReplacementDeliveryRecord(record, kind, path = null) {
  const identity = evaluateReplacementIdentity({ record, recordKind: kind, recordPath: path });
  if (!identity.ok) {
    throw new PageImageDeliveryError(identity.code, `${kind} is unsupported; preserve its bytes and use ${UNSUPPORTED_PROTOCOL_EXPORT_ACTION}`);
  }
}

function parseReplacementDeliveryRecord(bytes, kind, path, code, message) {
  requireReplacementDeliveryRecord(bytes, kind, path);
  try {
    return JSON.parse(Buffer.from(bytes).toString("utf8"));
  } catch {
    throw new PageImageDeliveryError(code, message);
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

/** Validate shared replacement final media before any delivery artifact is written. */
export function validateTargetFinalDeliveryInput({ manifest, acceptedRawEvidence, finalBytesBySlide, notesBySlide, sourceEpoch } = {}) {
  requireReplacementDeliveryRecord(manifest, "final-manifest");
  requireReplacementDeliveryRecord(acceptedRawEvidence, "accepted-raw-evidence");
  if (!Number.isInteger(sourceEpoch) || sourceEpoch <= 0) {
    throw new PageImageDeliveryError("source_epoch_invalid", "a positive target source epoch is required for delivery");
  }
  const manifestValidation = validateFinalSlideManifest(manifest, { evidence: acceptedRawEvidence });
  if (!manifestValidation.ok || manifest.schema !== "page-image-final-slide-manifest-v1") {
    throw new PageImageDeliveryError(manifestValidation.code || "final_manifest_invalid", "target final manifest is invalid or stale");
  }
  const orderedSlideIds = manifest.items.map((item) => item.slide_id);
  if (!finalBytesBySlide || typeof finalBytesBySlide !== "object" || Array.isArray(finalBytesBySlide) ||
    Object.keys(finalBytesBySlide).sort().join("\n") !== [...orderedSlideIds].sort().join("\n")) {
    throw new PageImageDeliveryError("final_bytes_coverage_invalid", "final bytes must exactly cover final manifest slide IDs");
  }
  if (!notesBySlide || typeof notesBySlide !== "object" || Array.isArray(notesBySlide) ||
    Object.keys(notesBySlide).sort().join("\n") !== [...orderedSlideIds].sort().join("\n")) {
    throw new PageImageDeliveryError("notes_coverage_invalid", "source notes must exactly cover final manifest slide IDs");
  }
  const finalBytes = {};
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
    if (typeof notesBySlide[item.slide_id] !== "string" || !notesBySlide[item.slide_id].trim()) {
      throw new PageImageDeliveryError("source_notes_invalid", `source notes are missing for ${item.slide_id}`);
    }
    finalBytes[item.slide_id] = media.bytes;
  }
  return Object.freeze({
    manifest: Object.freeze(manifest),
    manifest_sha256: manifestValidation.sha256,
    ordered_slide_ids: Object.freeze(orderedSlideIds),
    final_bytes_by_slide: Object.freeze(finalBytes),
    notes_by_slide: Object.freeze({ ...notesBySlide }),
    source_epoch: sourceEpoch,
  });
}

/** Delivery has one current replacement-manifest protocol. */
export function validatePageImageDeliveryInput(input = {}) {
  return Object.freeze({
    protocol: "page-image-workflow-v1",
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
  const persisted = parseReplacementDeliveryRecord(
    bytes,
    "final-manifest",
    paths.target_final_manifest,
    "final_manifest_invalid",
    "current final manifest is invalid",
  );
  const check = validateFinalSlideManifest(persisted, { evidence: acceptedRawEvidence });
  if (!check.ok || check.sha256 !== input.manifest_sha256 ||
    canonicalJsonSha256(persisted) !== canonicalJsonSha256(input.manifest)) {
    throw new PageImageDeliveryError("final_manifest_stale", "persisted final manifest no longer binds the current finalization");
  }
  return Object.freeze(persisted);
}

async function writeProjection(paths, input) {
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
  for (const [index, item] of input.manifest.items.entries()) {
    const x = padding + (index % 2) * (cellWidth + padding);
    const y = padding + Math.floor(index / 2) * (cellHeight + labelHeight + padding);
    const decoded = decodePng(input.final_bytes_by_slide[item.slide_id], { checkCrc: true });
    const imageCanvas = createCanvas(decoded.width, decoded.height);
    const imageContext = imageCanvas.getContext("2d");
    const pixels = imageContext.createImageData(decoded.width, decoded.height);
    pixels.data.set(decoded.data);
    imageContext.putImageData(pixels, 0, 0);
    context.drawImage(imageCanvas, x, y, cellWidth, cellHeight);
    context.fillStyle = "#17212b";
    context.font = "700 16px Arial";
    context.fillText(item.slide_id, x, y + cellHeight + 22);
  }
  const bytes = canvas.toBuffer("image/png");
  writeAtomic(paths.final_projection, bytes);
  return Object.freeze({ path: paths.final_projection, sha256: sha256(bytes) });
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
} = {}) {
  // Identity must hard-stop before source-note or artifact reads.
  requireReplacementDeliveryRecord(manifest, "final-manifest");
  requireReplacementDeliveryRecord(acceptedRawEvidence, "accepted-raw-evidence");
  const selectedNotes = notesBySlide || sourceOwnedNotesBySlide(sourcePath, manifest?.items?.map((item) => item.slide_id) || []);
  const input = validateTargetFinalDeliveryInput({
    manifest,
    acceptedRawEvidence,
    finalBytesBySlide,
    notesBySlide: selectedNotes,
    sourceEpoch,
  });
  const paths = pageImageWorkflowPaths(runDir);
  readPersistedTargetFinalManifest(paths, input, acceptedRawEvidence);
  for (const item of input.manifest.items) {
    writeAtomic(join(paths.final_root, item.path), input.final_bytes_by_slide[item.slide_id]);
  }
  const projection = await writeProjection(paths, input);
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
    ordered_slide_ids: input.ordered_slide_ids,
    final_entries: input.manifest.items.map((item) => ({ slide_id: item.slide_id, final_sha256: item.final_sha256 })),
    projection_sha256: projection.sha256,
    pptx_path: relative(runDir, assembly.path).split("\\").join("/"),
    pptx_sha256: notes.receipt.pptx_sha256,
    notes_fingerprint: notes.receipt.notes_fingerprint,
    notes_injected: notes.receipt.notes_injected,
  });
  const receiptPath = join(paths.final_root, "delivery-receipt-v1.json");
  writeAtomic(receiptPath, Buffer.from(`${canonicalJson(receipt)}\n`, "utf8"));
  return Object.freeze({ receipt, receipt_path: receiptPath, projection, assembly, notes });
}

function currentTargetDeliveryReceipt(runDir) {
  const paths = pageImageWorkflowPaths(runDir);
  const receiptPath = join(paths.final_root, "delivery-receipt-v1.json");
  let receiptBytes;
  try {
    receiptBytes = readFileSync(receiptPath);
  } catch {
    throw new PageImageDeliveryError("delivery_receipt_unavailable", "current replacement delivery lineage is unavailable for notes refresh");
  }
  const receipt = parseReplacementDeliveryRecord(receiptBytes, "delivery-receipt", receiptPath, "delivery_receipt_invalid", "target delivery receipt is invalid");
  if (!receipt || !Number.isInteger(receipt.source_epoch) || receipt.source_epoch <= 0) {
    throw new PageImageDeliveryError("delivery_receipt_invalid", "target delivery receipt is invalid");
  }
  let manifestBytes;
  try {
    manifestBytes = readFileSync(paths.target_final_manifest);
  } catch {
    throw new PageImageDeliveryError("delivery_receipt_unavailable", "current replacement delivery lineage is unavailable for notes refresh");
  }
  const manifest = parseReplacementDeliveryRecord(manifestBytes, "final-manifest", paths.target_final_manifest, "final_manifest_invalid", "current final manifest is invalid");
  const manifestCheck = validateFinalSlideManifest(manifest);
  if (!manifestCheck.ok || manifest.schema !== "page-image-final-slide-manifest-v1") {
    throw new PageImageDeliveryError("final_manifest_invalid", "current final manifest is invalid");
  }
  const assemblyPath = join(paths.final_root, "pptx-assembly.json");
  let assemblyBytes;
  try {
    assemblyBytes = readFileSync(assemblyPath);
  } catch {
    throw new PageImageDeliveryError("delivery_receipt_unavailable", "current replacement delivery lineage is unavailable for notes refresh");
  }
  const assembly = parseReplacementDeliveryRecord(assemblyBytes, "pptx-assembly-receipt", assemblyPath, "assembly_invalid", "current Page Image assembly receipt is invalid");
  const assemblyCheck = validatePageImageAssemblyReceipt(assembly, {
    manifest,
    finalManifestSha256: manifestCheck.sha256,
    sourceEpoch: receipt.source_epoch,
  });
  const notesPath = join(paths.final_root, "notes-receipt.json");
  let notesBytes;
  try {
    notesBytes = readFileSync(notesPath);
  } catch {
    throw new PageImageDeliveryError("delivery_receipt_unavailable", "current replacement delivery lineage is unavailable for notes refresh");
  }
  const notes = parseReplacementDeliveryRecord(notesBytes, "notes-receipt", notesPath, "notes_receipt_invalid", "current Page Image notes receipt is invalid");
  const notesCheck = validatePageImageNotesReceipt(notes, {
    assembly,
    assemblyReceiptSha256: canonicalJsonSha256(assembly),
    finalManifest: manifest,
    finalManifestSha256: manifestCheck.sha256,
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
    canonicalJson(receipt.ordered_slide_ids) !== canonicalJson(assemblyCheck.ordered_slide_ids) ||
    receipt.pptx_path !== expectedPptxPath ||
    receipt.pptx_sha256 !== notesCheck.receipt.pptx_sha256 ||
    receipt.notes_fingerprint !== notesCheck.receipt.notes_fingerprint ||
    receipt.notes_injected !== notesCheck.receipt.notes_injected ||
    !existsSync(pptxPath) || sha256(readFileSync(pptxPath)) !== receipt.pptx_sha256) {
    throw new PageImageDeliveryError("delivery_receipt_invalid", "target delivery receipt no longer binds the current assembled PPTX");
  }
  return Object.freeze({
    paths,
    receipt: Object.freeze(receipt),
    receiptPath,
    manifest: Object.freeze(manifest),
    assembly: assemblyCheck.receipt,
    notes: notesCheck.receipt,
    pptxPath,
  });
}

/** Refresh notes only after revalidating the same replacement final/assembly lineage. */
export async function refreshTargetPageImageNotes({ runDir, sourcePath, sourceEpoch = null } = {}) {
  const current = currentTargetDeliveryReceipt(runDir);
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

/** The public delivery facade has no legacy manifest branch. */
export async function deliverPageImageManifest(input = {}) {
  validatePageImageDeliveryInput(input);
  return deliverTargetFinalSlideManifest(input);
}

export function deliveryReceiptSha256(receipt) {
  return canonicalJsonSha256(receipt);
}
