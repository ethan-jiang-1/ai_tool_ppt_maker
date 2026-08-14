import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import PptxGenJS from "pptxgenjs";
import { canonicalJson, canonicalJsonSha256 } from "../../shared/identity/canonical_json.mjs";
import { validateFinalSlideManifest } from "../../shared/image2/page_image_artifacts.mjs";
import {
  inspectExactPageImagePng,
  pageImageFinalPngForWorkflow,
} from "../../shared/image2/page_image_media_contract.mjs";
import { pageImageWorkflowPaths } from "../../shared/run-bundle/bundle_layout.mjs";
import { addPageImageOrdinalFooter } from "./page_image_ordinal_footer.mjs";
import {
  readPageImageDeliveryMedia,
  validatePageImageDeliveryMediaManifest,
} from "./page_image_delivery_media.mjs";
import { currentProtocolInvalid } from "../../shared/workflow/current_protocol_invalid.mjs";

export const PAGE_IMAGE_FINAL_SLIDE_MANIFEST_SCHEMA = "page-image-final-slide-manifest";
export const PAGE_IMAGE_PPTX_ASSEMBLY_SCHEMA = "page-image-pptx-assembly";

const SHA256_RE = /^[0-9a-f]{64}$/;
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function exactKeys(value, keys) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)) &&
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function atomicJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.tmp-${process.pid}`;
  writeFileSync(temporary, `${canonicalJson(value)}\n`);
  renameSync(temporary, path);
}

function requireSourceEpoch(sourceEpoch) {
  if (!Number.isInteger(sourceEpoch) || sourceEpoch <= 0) {
    throw new Error("current Page Image source epoch is required for assembly");
  }
}

/** Validate replacement final-manifest/evidence lineage before any file read or PPTX write. */
export function validatePageImageAssemblyInput({ manifest, acceptedRawEvidence, sourceEpoch } = {}) {
  requireSourceEpoch(sourceEpoch);
  const checked = validateFinalSlideManifest(manifest, { evidence: acceptedRawEvidence });
  if (!checked.ok || manifest.schema !== PAGE_IMAGE_FINAL_SLIDE_MANIFEST_SCHEMA) {
    throw currentProtocolInvalid("the assembly final manifest cannot establish current production identity");
  }
  return Object.freeze({
    manifest: Object.freeze(manifest),
    accepted_raw_evidence: Object.freeze(acceptedRawEvidence),
    final_manifest_sha256: checked.sha256,
    source_epoch: sourceEpoch,
    ordered_slide_ids: Object.freeze(manifest.items.map((item) => item.slide_id)),
  });
}

/** Validate the persisted assembly receipt against one replacement final manifest. */
export function validatePageImageAssemblyReceipt(receipt, {
  manifest,
  finalManifestSha256,
  sourceEpoch,
  deliveryMediaManifest,
} = {}) {
  const manifestChecked = validateFinalSlideManifest(manifest);
  const deliveryChecked = validatePageImageDeliveryMediaManifest(deliveryMediaManifest, {
    finalManifest: manifest,
    finalManifestSha256,
  });
  if (!manifestChecked.ok || !SHA256_RE.test(finalManifestSha256 || "") ||
    !Number.isInteger(sourceEpoch) || sourceEpoch <= 0 ||
    !exactKeys(receipt, [
      "schema",
      "source_epoch",
      "final_manifest_sha256",
      "accepted_raw_evidence_sha256",
      "source_receipt_sha256",
      "workflow",
      "ordered_slide_ids",
      "final_entries",
      "delivery_media_manifest_sha256",
      "delivery_entries",
      "pptx_path",
      "pptx_sha256",
    ]) ||
    receipt.schema !== PAGE_IMAGE_PPTX_ASSEMBLY_SCHEMA ||
    receipt.source_epoch !== sourceEpoch ||
    receipt.final_manifest_sha256 !== finalManifestSha256 ||
    receipt.accepted_raw_evidence_sha256 !== manifest.accepted_raw_evidence_sha256 ||
    receipt.source_receipt_sha256 !== manifest.source_receipt_sha256 ||
    receipt.workflow !== manifest.workflow ||
    receipt.delivery_media_manifest_sha256 !== deliveryChecked.manifest_sha256 ||
    !SHA256_RE.test(receipt.pptx_sha256 || "") ||
    typeof receipt.pptx_path !== "string" || !receipt.pptx_path ||
    !Array.isArray(receipt.ordered_slide_ids) ||
    !Array.isArray(receipt.final_entries) ||
    !Array.isArray(receipt.delivery_entries) ||
    receipt.ordered_slide_ids.length !== manifest.items.length ||
    receipt.final_entries.length !== manifest.items.length ||
    receipt.delivery_entries.length !== manifest.items.length) {
    throw currentProtocolInvalid("the assembly receipt cannot establish current production identity");
  }
  for (const [index, item] of manifest.items.entries()) {
    const entry = receipt.final_entries[index];
    if (receipt.ordered_slide_ids[index] !== item.slide_id ||
      !exactKeys(entry, ["slide_id", "position", "final_sha256"]) ||
      entry.slide_id !== item.slide_id || entry.position !== item.position ||
      entry.final_sha256 !== item.final_sha256) {
      throw currentProtocolInvalid("the assembly receipt cannot establish current production identity");
    }
    const deliveryEntry = receipt.delivery_entries[index];
    const expectedDeliveryEntry = deliveryChecked.manifest.entries[index];
    if (!exactKeys(deliveryEntry, ["slide_id", "position", "source_final_sha256", "jpeg_sha256"]) ||
      deliveryEntry.slide_id !== expectedDeliveryEntry.slide_id ||
      deliveryEntry.position !== expectedDeliveryEntry.position ||
      deliveryEntry.source_final_sha256 !== expectedDeliveryEntry.source_final_sha256 ||
      deliveryEntry.jpeg_sha256 !== expectedDeliveryEntry.jpeg_sha256) {
      throw currentProtocolInvalid("the assembly receipt cannot establish current production identity");
    }
  }
  return Object.freeze({
    receipt: Object.freeze(receipt),
    final_manifest_sha256: finalManifestSha256,
    ordered_slide_ids: Object.freeze([...receipt.ordered_slide_ids]),
    delivery_media_manifest_sha256: deliveryChecked.manifest_sha256,
    delivery_entries: Object.freeze([...receipt.delivery_entries]),
  });
}

function readPersistedFinalManifest(paths, input) {
  let bytes;
  try {
    bytes = readFileSync(paths.target_final_manifest);
  } catch {
    throw new Error("Page Image final manifest is missing");
  }
  let manifest;
  try {
    manifest = JSON.parse(bytes.toString("utf8"));
  } catch {
    throw currentProtocolInvalid("the persisted final manifest cannot establish current production identity");
  }
  const checked = validateFinalSlideManifest(manifest, { evidence: input.accepted_raw_evidence });
  if (!checked.ok || checked.sha256 !== input.final_manifest_sha256 ||
    canonicalJsonSha256(manifest) !== canonicalJsonSha256(input.manifest)) {
    throw currentProtocolInvalid("the persisted final manifest cannot establish current production identity");
  }
  return Object.freeze(manifest);
}

function readFinalMedia(paths, input) {
  const mediaBySlide = {};
  for (const item of input.manifest.items) {
    const path = join(paths.final_root, item.path);
    let bytes;
    try {
      bytes = readFileSync(path);
    } catch {
      throw new Error(`final Page Image PNG drifted for ${item.slide_id}`);
    }
    if (sha256(bytes) !== item.final_sha256) {
      throw new Error(`final Page Image PNG drifted for ${item.slide_id}`);
    }
    const media = inspectExactPageImagePng(bytes, pageImageFinalPngForWorkflow(input.manifest.workflow));
    if (!media.ok || (Object.hasOwn(item, "width") &&
      (media.actual.width !== item.width || media.actual.height !== item.height))) {
      throw new Error(`final Page Image PNG media is invalid for ${item.slide_id}`);
    }
    mediaBySlide[item.slide_id] = Object.freeze({ path, bytes: media.bytes });
  }
  return Object.freeze(mediaBySlide);
}

/** Assemble only validated delivery-owned JPEGs while retaining PNG source validation. */
export async function assemblePageImagePptx(runDir, {
  title = "Presentation",
  sourceEpoch,
  manifest,
  acceptedRawEvidence,
} = {}) {
  const input = validatePageImageAssemblyInput({ manifest, acceptedRawEvidence, sourceEpoch });
  const paths = pageImageWorkflowPaths(runDir);
  readPersistedFinalManifest(paths, input);
  readFinalMedia(paths, input);
  const deliveryMedia = await readPageImageDeliveryMedia(paths, {
    finalManifest: input.manifest,
    finalManifestSha256: input.final_manifest_sha256,
  });
  const pptxPath = join(paths.final_root, "deck.pptx");
  const temporary = `${pptxPath}.tmp-${process.pid}.pptx`;
  mkdirSync(paths.final_root, { recursive: true });
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "PPT Maker Harness";
  pptx.title = title;
  for (const item of input.manifest.items) {
    const slide = pptx.addSlide();
    slide.addImage({ path: deliveryMedia.media_by_slide[item.slide_id].path, x: 0, y: 0, w: 13.333333, h: 7.5 });
    addPageImageOrdinalFooter(slide, item.position);
  }
  try {
    await pptx.writeFile({ fileName: temporary });
    renameSync(temporary, pptxPath);
  } catch (error) {
    rmSync(temporary, { force: true });
    throw error;
  }
  // A rebuilt assembly starts a new notes lineage from the newly written PPTX.
  rmSync(join(paths.final_root, "notes-receipt.json"), { force: true });
  const receipt = {
    schema: PAGE_IMAGE_PPTX_ASSEMBLY_SCHEMA,
    source_epoch: input.source_epoch,
    final_manifest_sha256: input.final_manifest_sha256,
    accepted_raw_evidence_sha256: input.manifest.accepted_raw_evidence_sha256,
    source_receipt_sha256: input.manifest.source_receipt_sha256,
    workflow: input.manifest.workflow,
    ordered_slide_ids: input.ordered_slide_ids,
    final_entries: input.manifest.items.map((item) => ({
      slide_id: item.slide_id,
      position: item.position,
      final_sha256: item.final_sha256,
    })),
    delivery_media_manifest_sha256: deliveryMedia.manifest_sha256,
    delivery_entries: deliveryMedia.manifest.entries.map((entry) => ({
      slide_id: entry.slide_id,
      position: entry.position,
      source_final_sha256: entry.source_final_sha256,
      jpeg_sha256: entry.jpeg_sha256,
    })),
    pptx_path: relative(runDir, pptxPath).split("\\").join("/"),
    pptx_sha256: sha256(readFileSync(pptxPath)),
  };
  const receiptPath = join(paths.final_root, "pptx-assembly.json");
  atomicJson(receiptPath, receipt);
  return Object.freeze({
    path: pptxPath,
    pptx_path: pptxPath,
    receipt_path: receiptPath,
    receipt: Object.freeze(receipt),
  });
}
