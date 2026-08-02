import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import PptxGenJS from "pptxgenjs";
import { canonicalJson, canonicalJsonSha256 } from "../shared/identity/canonical_json.mjs";
import { validateFinalSlideManifest } from "../shared/image2/page_authority_artifacts.mjs";
import { pageAuthorityImage2Paths } from "../shared/run-bundle/bundle_layout.mjs";
import { extractNoteRecordsFromMarkdown, injectNotes } from "./internal/notes_runtime.mjs";
import { renderPageAuthorityFinalProjection } from "./internal/page_authority_final_projection_v1.mjs";
import { addPageAuthorityOrdinalFooter } from "./internal/page_authority_ordinal_footer.mjs";
import {
  PAGE_AUTHORITY_PPTX_ASSEMBLY_SCHEMA,
  assemblePageAuthorityPptx,
  validatePageAuthorityAssemblyInput,
} from "./internal/page_authority_pptx_assembly_v1.mjs";
import {
  PAGE_AUTHORITY_NOTES_RECEIPT_SCHEMA,
  injectPageAuthorityNotes,
  validatePageAuthorityNotesInput,
} from "./internal/page_authority_notes_v1.mjs";

export const PAGE_AUTHORITY_DELIVERY_RECEIPT_V2_SCHEMA = "page-authority-delivery-receipt-v2";
const PAGE_AUTHORITY_FINAL_MANIFEST_V1_SCHEMA = "pptmaker-page-authority-final-manifest-v1";

export {
  PAGE_AUTHORITY_NOTES_RECEIPT_SCHEMA,
  PAGE_AUTHORITY_PPTX_ASSEMBLY_SCHEMA,
  assemblePageAuthorityPptx,
  injectPageAuthorityNotes,
  renderPageAuthorityFinalProjection,
  validatePageAuthorityAssemblyInput,
  validatePageAuthorityNotesInput,
};

export class PageAuthorityDeliveryError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "PageAuthorityDeliveryError";
    this.code = code;
  }
}

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function asBytes(value, label) {
  if (!Buffer.isBuffer(value) && !(value instanceof Uint8Array)) {
    throw new PageAuthorityDeliveryError("final_bytes_invalid", `${label} must be bytes`);
  }
  const bytes = Buffer.from(value);
  if (bytes.length === 0) throw new PageAuthorityDeliveryError("final_bytes_invalid", `${label} must not be empty`);
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
    throw new PageAuthorityDeliveryError("source_notes_unavailable", "the canonical source path is required for notes delivery");
  }
  const records = extractNoteRecordsFromMarkdown([sourcePath]);
  const notesBySlide = Object.fromEntries(records.map((record) => [record.slide_id, record.note]));
  if (!exactKeys(notesBySlide, orderedSlideIds)) {
    throw new PageAuthorityDeliveryError("source_notes_lineage_mismatch", "source notes must exactly cover final manifest slide IDs");
  }
  return Object.freeze(notesBySlide);
}

/**
 * Validate the shared delivery input without inspecting workflow semantics or
 * creating derived artifacts.
 */
export function validateTargetFinalDeliveryInput({ manifest, acceptedRawEvidence, finalBytesBySlide, notesBySlide, sourceEpoch } = {}) {
  if (!Number.isInteger(sourceEpoch) || sourceEpoch <= 0) {
    throw new PageAuthorityDeliveryError("source_epoch_invalid", "a positive target source epoch is required for delivery");
  }
  const manifestValidation = validateFinalSlideManifest(manifest, { evidence: acceptedRawEvidence });
  if (!manifestValidation.ok) {
    throw new PageAuthorityDeliveryError(manifestValidation.code, "target final manifest is invalid or stale");
  }
  const orderedSlideIds = manifest.items.map((item) => item.slide_id);
  if (!finalBytesBySlide || typeof finalBytesBySlide !== "object" || Array.isArray(finalBytesBySlide) ||
    Object.keys(finalBytesBySlide).sort().join("\n") !== [...orderedSlideIds].sort().join("\n")) {
    throw new PageAuthorityDeliveryError("final_bytes_coverage_invalid", "final bytes must exactly cover final manifest slide IDs");
  }
  if (!notesBySlide || typeof notesBySlide !== "object" || Array.isArray(notesBySlide) ||
    Object.keys(notesBySlide).sort().join("\n") !== [...orderedSlideIds].sort().join("\n")) {
    throw new PageAuthorityDeliveryError("notes_coverage_invalid", "source notes must exactly cover final manifest slide IDs");
  }
  const finalBytes = {};
  for (const item of manifest.items) {
    const bytes = asBytes(finalBytesBySlide[item.slide_id], `final bytes for ${item.slide_id}`);
    if (sha256(bytes) !== item.final_sha256) {
      throw new PageAuthorityDeliveryError("final_bytes_stale", `final bytes drifted for ${item.slide_id}`);
    }
    if (typeof notesBySlide[item.slide_id] !== "string" || !notesBySlide[item.slide_id].trim()) {
      throw new PageAuthorityDeliveryError("source_notes_invalid", `source notes are missing for ${item.slide_id}`);
    }
    finalBytes[item.slide_id] = bytes;
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

/** Resolve delivery inputs by protocol only; workflow provenance stays opaque. */
export function validatePageAuthorityDeliveryInput(input = {}) {
  if (input.manifest?.schema === PAGE_AUTHORITY_FINAL_MANIFEST_V1_SCHEMA) {
    return Object.freeze({
      protocol: "current-v1",
      input: validatePageAuthorityAssemblyInput(input.manifest, { sourceEpoch: input.sourceEpoch }),
    });
  }
  if (input.manifest?.schema === "page-authority-final-slide-manifest-v2") {
    return Object.freeze({
      protocol: "target-v2",
      input: validateTargetFinalDeliveryInput(input),
    });
  }
  throw new PageAuthorityDeliveryError("delivery_manifest_unknown", "delivery requires a recognized Page Authority final manifest");
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
    context.drawImage(await loadImage(input.final_bytes_by_slide[item.slide_id]), x, y, cellWidth, cellHeight);
    context.fillStyle = "#17212b";
    context.font = "700 16px Arial";
    context.fillText(item.slide_id, x, y + cellHeight + 22);
  }
  const bytes = canvas.toBuffer("image/png");
  writeAtomic(paths.final_projection, bytes);
  return Object.freeze({ path: paths.final_projection, sha256: sha256(bytes) });
}

async function assemblePptx(paths, input, title) {
  const pptxPath = join(paths.final_root, "deck.pptx");
  const temporary = `${pptxPath}.tmp-${process.pid}.pptx`;
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "PPT Maker Framework";
  pptx.title = title || "Presentation";
  for (const item of input.manifest.items) {
    const slide = pptx.addSlide();
    slide.addImage({ path: join(paths.final_root, item.path), x: 0, y: 0, w: 13.333333, h: 7.5 });
    addPageAuthorityOrdinalFooter(slide, item.position);
  }
  try {
    await pptx.writeFile({ fileName: temporary });
    renameSync(temporary, pptxPath);
  } catch (error) {
    rmSync(temporary, { force: true });
    throw error;
  }
  return Object.freeze({ path: pptxPath, sha256: sha256(readFileSync(pptxPath)) });
}

/**
 * The single target delivery writer. Both workflow adapters submit the same
 * validated manifest shape; this function never branches on workflow.
 */
export async function deliverTargetFinalSlideManifest({ runDir, manifest, acceptedRawEvidence, finalBytesBySlide, notesBySlide = null, sourcePath = null, sourceEpoch = 1, title = "Presentation" } = {}) {
  const selectedNotes = notesBySlide || sourceOwnedNotesBySlide(sourcePath, manifest?.items?.map((item) => item.slide_id) || []);
  const input = validateTargetFinalDeliveryInput({
    manifest,
    acceptedRawEvidence,
    finalBytesBySlide,
    notesBySlide: selectedNotes,
    sourceEpoch,
  });
  const paths = pageAuthorityImage2Paths(runDir);
  for (const item of input.manifest.items) writeAtomic(join(paths.final_root, item.path), input.final_bytes_by_slide[item.slide_id]);
  const projection = await writeProjection(paths, input);
  const assembly = await assemblePptx(paths, input, title);
  const notes = await injectNotes({
    pptx: assembly.path,
    notes: input.ordered_slide_ids.map((slideId) => input.notes_by_slide[slideId]),
  });
  const receipt = Object.freeze({
    schema: PAGE_AUTHORITY_DELIVERY_RECEIPT_V2_SCHEMA,
    source_epoch: input.source_epoch,
    final_manifest_sha256: input.manifest_sha256,
    ordered_slide_ids: input.ordered_slide_ids,
    final_entries: input.manifest.items.map((item) => ({ slide_id: item.slide_id, final_sha256: item.final_sha256 })),
    projection_sha256: projection.sha256,
    pptx_path: relative(runDir, assembly.path).split("\\").join("/"),
    pptx_sha256: sha256(readFileSync(assembly.path)),
    notes_fingerprint: sha256(Buffer.from(canonicalJson(input.notes_by_slide))),
    notes_injected: notes.notesInjected,
  });
  const receiptPath = join(paths.final_root, "delivery-receipt-v2.json");
  writeAtomic(receiptPath, Buffer.from(`${canonicalJson(receipt)}\n`, "utf8"));
  return Object.freeze({ receipt, receipt_path: receiptPath, projection, assembly, notes });
}

function currentTargetDeliveryReceipt(runDir) {
  const paths = pageAuthorityImage2Paths(runDir);
  const receiptPath = join(paths.final_root, "delivery-receipt-v2.json");
  let receipt;
  try {
    receipt = JSON.parse(readFileSync(receiptPath, "utf8"));
  } catch {
    throw new PageAuthorityDeliveryError("delivery_receipt_unavailable", "target delivery receipt is unavailable for notes refresh");
  }
  const pptxPath = join(paths.final_root, "deck.pptx");
  const expectedPptxPath = relative(runDir, pptxPath).split("\\").join("/");
  if (!receipt || receipt.schema !== PAGE_AUTHORITY_DELIVERY_RECEIPT_V2_SCHEMA ||
    !Number.isInteger(receipt.source_epoch) || receipt.source_epoch <= 0 ||
    !Array.isArray(receipt.ordered_slide_ids) || receipt.ordered_slide_ids.length === 0 ||
    new Set(receipt.ordered_slide_ids).size !== receipt.ordered_slide_ids.length ||
    receipt.pptx_path !== expectedPptxPath || !existsSync(pptxPath)) {
    throw new PageAuthorityDeliveryError("delivery_receipt_invalid", "target delivery receipt no longer binds the current assembled PPTX");
  }
  return Object.freeze({ receipt: Object.freeze(receipt), receiptPath, pptxPath });
}

/** Refresh target speaker notes through delivery without rebuilding final pixels. */
export async function refreshTargetPageAuthorityNotes({ runDir, sourcePath, sourceEpoch = null } = {}) {
  const current = currentTargetDeliveryReceipt(runDir);
  if (sourceEpoch !== null && sourceEpoch !== current.receipt.source_epoch) {
    throw new PageAuthorityDeliveryError("notes_source_epoch_mismatch", "target notes refresh requires the delivery receipt source epoch");
  }
  const notesBySlide = sourceOwnedNotesBySlide(sourcePath, current.receipt.ordered_slide_ids);
  const notes = await injectNotes({
    pptx: current.pptxPath,
    notes: current.receipt.ordered_slide_ids.map((slideId) => notesBySlide[slideId]),
  });
  const receipt = Object.freeze({
    ...current.receipt,
    pptx_sha256: sha256(readFileSync(current.pptxPath)),
    notes_fingerprint: sha256(Buffer.from(canonicalJson(notesBySlide))),
    notes_injected: notes.notesInjected,
  });
  writeAtomic(current.receiptPath, Buffer.from(`${canonicalJson(receipt)}\n`, "utf8"));
  return Object.freeze({ receipt, receipt_path: current.receiptPath, notes });
}

function currentAssemblyOrderedSlideIds(runDir) {
  const assemblyPath = join(pageAuthorityImage2Paths(runDir).final_root, "pptx-assembly.json");
  let assembly;
  try {
    assembly = JSON.parse(readFileSync(assemblyPath, "utf8"));
  } catch {
    throw new PageAuthorityDeliveryError("assembly_unavailable", "current Page Authority assembly receipt is unavailable");
  }
  if (assembly?.schema !== PAGE_AUTHORITY_PPTX_ASSEMBLY_SCHEMA || !Array.isArray(assembly.ordered_slide_ids) || !assembly.ordered_slide_ids.length) {
    throw new PageAuthorityDeliveryError("assembly_invalid", "current Page Authority assembly receipt is invalid");
  }
  return assembly.ordered_slide_ids;
}

/** Deliver a bounded CURRENT v1 manifest through the same delivery owner. */
export async function deliverCurrentPageAuthorityFinal({ runDir, sourcePath, sourceEpoch, title = "Presentation" } = {}) {
  const projection = await renderPageAuthorityFinalProjection(runDir);
  const assembly = await assemblePageAuthorityPptx(runDir, { title, sourceEpoch });
  const notesBySlide = sourceOwnedNotesBySlide(sourcePath, assembly.receipt.ordered_slide_ids);
  const notes = await injectPageAuthorityNotes(runDir, { notes_by_slide: notesBySlide, sourceEpoch });
  return Object.freeze({ projection, assembly, notes });
}

/** Notes-only CURRENT refresh remains a delivery concern and never changes pixels. */
export async function refreshCurrentPageAuthorityNotes({ runDir, sourcePath, sourceEpoch } = {}) {
  const notesBySlide = sourceOwnedNotesBySlide(sourcePath, currentAssemblyOrderedSlideIds(runDir));
  const notes = await injectPageAuthorityNotes(runDir, { notes_by_slide: notesBySlide, sourceEpoch });
  return Object.freeze({ notes });
}

/** The common delivery interface for target and bounded CURRENT manifests. */
export async function deliverPageAuthorityManifest(input = {}) {
  const validated = validatePageAuthorityDeliveryInput(input);
  if (validated.protocol === "current-v1") {
    return deliverCurrentPageAuthorityFinal({
      runDir: input.runDir,
      sourcePath: input.sourcePath,
      sourceEpoch: input.sourceEpoch,
      title: input.title,
    });
  }
  return deliverTargetFinalSlideManifest(input);
}

export function deliveryReceiptSha256(receipt) {
  return canonicalJsonSha256(receipt);
}
