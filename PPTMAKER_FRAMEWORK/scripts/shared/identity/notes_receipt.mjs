/** Stage-5 assembly and notes receipt helpers. Uses only Node built-ins. */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { randomBytes } from "node:crypto";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { sha256File } from "./byte_hash.mjs";
import { htmlNotesProjectionFromSourceAstV1 } from "../../contracts/html_source_ast.mjs";

export const NOTES_RECEIPT_VERSION = 2;
export const HTML_NOTES_RECEIPT_VERSION = 3;
export const NOTES_RECEIPT_RELATIVE_PATH = join("_generated", "qa", "notes_injection.json");
export const PPTX_ASSEMBLY_RELATIVE_PATH = join("_generated", "qa", "pptx_assembly.json");
const SHA256_RE = /^[0-9a-f]{64}$/;

export function notesReceiptPath(runDir) {
  return join(runDir, NOTES_RECEIPT_RELATIVE_PATH);
}

export function assemblyReceiptPath(runDir) {
  return join(runDir, PPTX_ASSEMBLY_RELATIVE_PATH);
}

function normalizedRelative(runDir, filePath) {
  const rel = relative(resolve(runDir), resolve(filePath));
  if (!rel || isAbsolute(rel) || rel === ".." || rel.startsWith(`..${sep}`)) {
    throw new Error(`path escapes run directory: ${filePath}`);
  }
  return rel.split(sep).join("/");
}

function resolveContainedExisting(runDir, relativePath) {
  if (typeof relativePath !== "string" || !relativePath || isAbsolute(relativePath)) {
    throw new Error("receipt path must be a non-empty relative path");
  }
  const lexical = resolve(runDir, relativePath);
  const root = realpathSync(runDir);
  const lexicalRel = relative(resolve(runDir), lexical);
  if (lexicalRel === ".." || lexicalRel.startsWith(`..${sep}`) || isAbsolute(lexicalRel)) {
    throw new Error(`receipt path escapes run directory: ${relativePath}`);
  }
  if (!existsSync(lexical)) throw new Error(`receipt target missing: ${relativePath}`);
  const real = realpathSync(lexical);
  const realRel = relative(root, real);
  if (realRel === ".." || realRel.startsWith(`..${sep}`) || isAbsolute(realRel)) {
    throw new Error(`receipt target resolves outside run directory: ${relativePath}`);
  }
  return lexical;
}

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Error(`${label} is invalid JSON: ${error.message}`);
  }
}

function orderedIdsFromPlan(planPath) {
  const plan = readJson(planPath, "slide plan");
  const ids = (plan.slides || []).map((slide) => String(slide.slide_id || slide.id || ""));
  if (ids.length === 0 || ids.some((id) => !id) || new Set(ids).size !== ids.length) {
    throw new Error("slide plan has missing or duplicate formal IDs");
  }
  return ids;
}

function sameArray(left, right) {
  return Array.isArray(left) && Array.isArray(right) &&
    left.length === right.length && left.every((value, index) => value === right[index]);
}

export function invalidateNotesReceipt(runDir) {
  rmSync(notesReceiptPath(runDir), { force: true });
}

export function readAssemblyReceipt(runDir) {
  const path = assemblyReceiptPath(runDir);
  if (!existsSync(path)) return { receipt: null, error: "PPTX assembly receipt is missing", path };
  try {
    return { receipt: JSON.parse(readFileSync(path, "utf8")), error: null, path };
  } catch (error) {
    return { receipt: null, error: `PPTX assembly receipt is invalid JSON: ${error.message}`, path };
  }
}

/**
 * Validate immutable assembly lineage. requireCurrentPptx is true before the
 * first notes injection and false when validating the retained root after notes
 * have legitimately changed the PPTX bytes.
 */
export function validatePptxAssemblyReceipt(runDir, {
  requireCurrentPptx = true,
  expectedOrderedIds = null,
} = {}) {
  const { receipt, error, path } = readAssemblyReceipt(runDir);
  if (error) return { valid: false, reason: error, receipt: null, path };
  try {
    if (![1, 2].includes(receipt.schema_version)) throw new Error(`unsupported assembly schema ${receipt.schema_version}`);
    if (!Array.isArray(receipt.ordered_slide_ids) || receipt.ordered_slide_ids.length < 1) {
      throw new Error("assembly ordered_slide_ids are missing");
    }
    if (new Set(receipt.ordered_slide_ids).size !== receipt.ordered_slide_ids.length) {
      throw new Error("assembly ordered_slide_ids contain duplicates");
    }
    const planPath = resolveContainedExisting(runDir, receipt.slide_plan_path);
    const pptxPath = resolveContainedExisting(runDir, receipt.pptx_path);
    if (sha256File(planPath) !== receipt.slide_plan_sha256) throw new Error("assembly slide plan hash is stale");
    const planIds = orderedIdsFromPlan(planPath);
    if (!sameArray(planIds, receipt.ordered_slide_ids)) throw new Error("assembly ordered IDs do not match slide plan");
    if (expectedOrderedIds && !sameArray(expectedOrderedIds, receipt.ordered_slide_ids)) {
      throw new Error("assembly ordered IDs do not match current requested IDs");
    }
    if (!Array.isArray(receipt.final_images) || receipt.final_images.length !== planIds.length) {
      throw new Error("assembly final image evidence count is invalid");
    }
    for (let index = 0; index < receipt.final_images.length; index += 1) {
      const image = receipt.final_images[index];
      if (image.slide_id !== planIds[index]) throw new Error("assembly final image order is invalid");
      const imagePath = resolveContainedExisting(runDir, image.path);
      if (sha256File(imagePath) !== image.sha256) {
        throw new Error(`assembly final image hash is stale for ${image.slide_id}`);
      }
      if (receipt.schema_version === 2) {
        if (image.artifact_kind !== "final-slide" || typeof image.producer !== "string" || !image.producer || !SHA256_RE.test(image.final_slide_fingerprint || "") || !Number.isInteger(image.width) || image.width <= 0 || !Number.isInteger(image.height) || image.height <= 0 || typeof image.media_profile !== "string" || !image.media_profile) throw new Error(`assembly common final-slide evidence is invalid for ${image.slide_id}`);
      }
    }
    if (receipt.schema_version === 2) {
      const html = receipt.pipeline === "html-first-v1";
      if (html && ((receipt.html_production_reset_id !== null && !SHA256_RE.test(receipt.html_production_reset_id || "")) || !SHA256_RE.test(receipt.html_delivery_digest || ""))) throw new Error("HTML assembly reset/delivery lineage is invalid");
      if (!html && (receipt.html_production_reset_id !== null || receipt.html_delivery_digest !== null)) throw new Error("whole-page assembly cannot carry HTML reset/delivery lineage");
    }
    if (requireCurrentPptx && sha256File(pptxPath) !== receipt.pptx_sha256) {
      throw new Error("assembled PPTX hash is stale");
    }
    return {
      valid: true,
      reason: "current",
      receipt,
      receiptPath: path,
      receiptSha256: sha256File(path),
      planPath,
      pptxPath,
      orderedIds: planIds,
    };
  } catch (validationError) {
    return { valid: false, reason: validationError.message, receipt, path };
  }
}

export function readNotesReceipt(runDir) {
  const path = notesReceiptPath(runDir);
  if (!existsSync(path)) return { receipt: null, error: "notes injection receipt is missing", path };
  try {
    return { receipt: JSON.parse(readFileSync(path, "utf8")), error: null, path };
  } catch (error) {
    return { receipt: null, error: `notes injection receipt is invalid JSON: ${error.message}`, path };
  }
}

function validateV2Shape(receipt) {
  if (receipt.schema_version !== NOTES_RECEIPT_VERSION) {
    throw new Error(`unsupported receipt schema ${receipt.schema_version}`);
  }
  if (!Number.isInteger(receipt.slide_count) || receipt.slide_count < 1) throw new Error("invalid slide_count");
  if (receipt.notes_injected !== receipt.slide_count) throw new Error("notes_injected does not equal slide_count");
  if (!Array.isArray(receipt.ordered_slide_ids) || receipt.ordered_slide_ids.length !== receipt.slide_count) {
    throw new Error("ordered_slide_ids do not equal slide_count");
  }
  if (new Set(receipt.ordered_slide_ids).size !== receipt.ordered_slide_ids.length) {
    throw new Error("ordered_slide_ids contain duplicates");
  }
  if (typeof receipt.created_at !== "string" || Number.isNaN(Date.parse(receipt.created_at))) {
    throw new Error("invalid created_at");
  }
  if (!receipt.root_assembly || typeof receipt.root_assembly !== "object") {
    throw new Error("root assembly lineage is missing");
  }
}

function validateV3Shape(receipt) {
  if (receipt.schema_version !== HTML_NOTES_RECEIPT_VERSION || !["html-first-v1", "whole-page-image2-v1"].includes(receipt.pipeline) || typeof receipt.producer !== "string" || !receipt.producer) throw new Error(`unsupported receipt schema ${receipt.schema_version}`);
  if (!Number.isInteger(receipt.slide_count) || receipt.slide_count < 1 || receipt.notes_injected !== receipt.slide_count) throw new Error("invalid HTML notes counts");
  if (!Array.isArray(receipt.ordered_slide_ids) || receipt.ordered_slide_ids.length !== receipt.slide_count || new Set(receipt.ordered_slide_ids).size !== receipt.ordered_slide_ids.length) throw new Error("invalid HTML notes ordered IDs");
  if (receipt.pipeline === "html-first-v1") {
    if ((receipt.html_production_reset_id !== null && !SHA256_RE.test(receipt.html_production_reset_id || "")) || !SHA256_RE.test(receipt.html_delivery_digest || "")) throw new Error("invalid HTML notes reset/delivery lineage");
  } else if (receipt.html_production_reset_id !== null || receipt.html_delivery_digest !== null) throw new Error("whole-page notes cannot carry HTML reset/delivery lineage");
  if (!receipt.root_assembly || typeof receipt.root_assembly !== "object" || receipt.root_assembly.schema_version !== 2) throw new Error("HTML root assembly lineage is missing");
  if (receipt.notes_fingerprint !== undefined && !SHA256_RE.test(receipt.notes_fingerprint || "")) throw new Error("invalid notes_fingerprint");
  if (typeof receipt.created_at !== "string" || Number.isNaN(Date.parse(receipt.created_at))) throw new Error("invalid created_at");
}

function validateKnownShape(receipt) {
  if (receipt?.schema_version === HTML_NOTES_RECEIPT_VERSION) validateV3Shape(receipt);
  else validateV2Shape(receipt);
}

function validateRootAssembly(runDir, receipt) {
  const root = receipt.root_assembly;
  const rootPath = resolveContainedExisting(runDir, root.receipt_path);
  if (sha256File(rootPath) !== root.receipt_sha256) throw new Error("root assembly receipt hash is stale");
  const assembly = validatePptxAssemblyReceipt(runDir, {
    requireCurrentPptx: false,
    expectedOrderedIds: receipt.ordered_slide_ids,
  });
  if (!assembly.valid) throw new Error(assembly.reason);
  if (assembly.receipt.slide_plan_sha256 !== root.slide_plan_sha256) {
    throw new Error("root assembly plan lineage differs");
  }
  if (assembly.receipt.pptx_sha256 !== root.assembled_pptx_sha256) {
    throw new Error("root assembled PPTX lineage differs");
  }
  return assembly;
}

export function buildNotesReceipt({
  runDir,
  inputPath,
  planPath,
  pptxPath,
  orderedSlideIds,
  slideCount,
  notesInjected,
  assembly,
  predecessor = null,
  notesFingerprint = null,
}) {
  if (!Number.isInteger(slideCount) || slideCount < 1) throw new Error("slide_count must be a positive integer");
  if (!Number.isInteger(notesInjected) || notesInjected !== slideCount) throw new Error("notes_injected must equal slide_count");
  if (!sameArray(orderedSlideIds, assembly?.orderedIds)) throw new Error("notes IDs must match root assembly IDs");
  if (notesFingerprint !== null && !SHA256_RE.test(notesFingerprint)) throw new Error("notes_fingerprint must be a SHA-256");
  if (assembly.receipt.schema_version === 2) {
    return {
      schema_version: HTML_NOTES_RECEIPT_VERSION,
      pipeline: assembly.receipt.pipeline,
      producer: assembly.receipt.producer,
      input_path: normalizedRelative(runDir, inputPath), input_sha256: sha256File(inputPath),
      ...(notesFingerprint ? { notes_fingerprint: notesFingerprint } : {}),
      slide_plan_path: normalizedRelative(runDir, planPath), slide_plan_sha256: sha256File(planPath),
      pptx_path: normalizedRelative(runDir, pptxPath), pptx_sha256: sha256File(pptxPath),
      ordered_slide_ids: [...orderedSlideIds], slide_count: slideCount, notes_injected: notesInjected,
      html_production_reset_id: null, html_delivery_digest: null,
      root_assembly: { schema_version: 2, receipt_path: normalizedRelative(runDir, assembly.receiptPath), receipt_sha256: assembly.receiptSha256, slide_plan_sha256: assembly.receipt.slide_plan_sha256, ordered_slide_ids: [...assembly.orderedIds], assembled_pptx_path: assembly.receipt.pptx_path, assembled_pptx_sha256: assembly.receipt.pptx_sha256, html_production_reset_id: null, html_delivery_digest: null },
      predecessor: predecessor ? { receipt_schema_version: predecessor.receipt.schema_version, receipt_sha256: predecessor.receiptSha256, input_pptx_sha256: predecessor.inputPptxSha256 } : null,
      created_at: new Date().toISOString(),
    };
  }
  return {
    schema_version: NOTES_RECEIPT_VERSION,
    input_path: normalizedRelative(runDir, inputPath),
    input_sha256: sha256File(inputPath),
    slide_plan_path: normalizedRelative(runDir, planPath),
    slide_plan_sha256: sha256File(planPath),
    pptx_path: normalizedRelative(runDir, pptxPath),
    pptx_sha256: sha256File(pptxPath),
    ordered_slide_ids: [...orderedSlideIds],
    slide_count: slideCount,
    notes_injected: notesInjected,
    root_assembly: {
      receipt_path: normalizedRelative(runDir, assembly.receiptPath),
      receipt_sha256: assembly.receiptSha256,
      slide_plan_sha256: assembly.receipt.slide_plan_sha256,
      ordered_slide_ids: [...assembly.orderedIds],
      assembled_pptx_path: assembly.receipt.pptx_path,
      assembled_pptx_sha256: assembly.receipt.pptx_sha256,
    },
    predecessor: predecessor ? {
      receipt_sha256: predecessor.receiptSha256,
      input_pptx_sha256: predecessor.inputPptxSha256,
    } : null,
    created_at: new Date().toISOString(),
  };
}

export function buildHtmlNotesReceipt({ runDir, inputPath, planPath, pptxPath, orderedSlideIds, slideCount, notesInjected, assembly, predecessor = null, notesFingerprint = null }) {
  if (!assembly?.valid || assembly.receipt?.schema_version !== 2 || assembly.receipt.pipeline !== "html-first-v1") throw new Error("HTML notes require a current schema-v2 HTML assembly");
  if (!Number.isInteger(slideCount) || slideCount < 1 || notesInjected !== slideCount || !sameArray(orderedSlideIds, assembly.orderedIds)) throw new Error("HTML notes IDs/counts must match current assembly");
  if (!SHA256_RE.test(notesFingerprint || "")) throw new Error("HTML notes require a notes_fingerprint");
  return {
    schema_version: HTML_NOTES_RECEIPT_VERSION,
    pipeline: "html-first-v1",
    producer: assembly.receipt.producer,
    input_path: normalizedRelative(runDir, inputPath),
    input_sha256: sha256File(inputPath),
    notes_fingerprint: notesFingerprint,
    slide_plan_path: normalizedRelative(runDir, planPath),
    slide_plan_sha256: sha256File(planPath),
    pptx_path: normalizedRelative(runDir, pptxPath),
    pptx_sha256: sha256File(pptxPath),
    ordered_slide_ids: [...orderedSlideIds],
    slide_count: slideCount,
    notes_injected: notesInjected,
    html_production_reset_id: assembly.receipt.html_production_reset_id,
    html_delivery_digest: assembly.receipt.html_delivery_digest,
    root_assembly: {
      schema_version: 2,
      receipt_path: normalizedRelative(runDir, assembly.receiptPath),
      receipt_sha256: assembly.receiptSha256,
      slide_plan_sha256: assembly.receipt.slide_plan_sha256,
      ordered_slide_ids: [...assembly.orderedIds],
      assembled_pptx_path: assembly.receipt.pptx_path,
      assembled_pptx_sha256: assembly.receipt.pptx_sha256,
      html_production_reset_id: assembly.receipt.html_production_reset_id,
      html_delivery_digest: assembly.receipt.html_delivery_digest,
    },
    predecessor: predecessor ? { receipt_schema_version: predecessor.receipt.schema_version, receipt_sha256: predecessor.receiptSha256, input_pptx_sha256: predecessor.inputPptxSha256 } : null,
    created_at: new Date().toISOString(),
  };
}

export function writeNotesReceiptAtomic(runDir, receipt) {
  const path = notesReceiptPath(runDir);
  const dir = dirname(path);
  mkdirSync(dir, { recursive: true });
  const temp = join(dir, `.notes_injection.json.tmp-${process.pid}-${randomBytes(4).toString("hex")}`);
  writeFileSync(temp, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  renameSync(temp, path);
  return path;
}

/** Strict current-completion proof used by the speaker_notes_injected gate. */
export function validateNotesCompletionReceipt(runDir) {
  const { receipt, error } = readNotesReceipt(runDir);
  const hint = "Rerun Stage 5 through unified_pipeline/ppt_flow for the current run directory";
  if (error) return { valid: false, reason: error, hint, receipt: null };
  try {
    validateKnownShape(receipt);
    const inputPath = resolveContainedExisting(runDir, receipt.input_path);
    const planPath = resolveContainedExisting(runDir, receipt.slide_plan_path);
    const pptxPath = resolveContainedExisting(runDir, receipt.pptx_path);
    if (receipt.schema_version === HTML_NOTES_RECEIPT_VERSION && receipt.notes_fingerprint !== undefined) {
      if (htmlNotesProjectionFromSourceAstV1({
        sourceBytes: readFileSync(inputPath),
        planBytes: readFileSync(planPath),
      }).fingerprint !== receipt.notes_fingerprint) {
        throw new Error("speaker notes projection is stale");
      }
    } else if (sha256File(inputPath) !== receipt.input_sha256) {
      throw new Error("slide specification hash is stale");
    }
    if (sha256File(planPath) !== receipt.slide_plan_sha256) throw new Error("slide plan hash is stale");
    if (sha256File(pptxPath) !== receipt.pptx_sha256) throw new Error("PPTX hash is stale");
    const planIds = orderedIdsFromPlan(planPath);
    if (!sameArray(planIds, receipt.ordered_slide_ids)) throw new Error("ordered IDs differ from current slide plan");
    const assembly = validateRootAssembly(runDir, receipt);
    if (receipt.schema_version === HTML_NOTES_RECEIPT_VERSION && (assembly.receipt.pipeline !== receipt.pipeline || assembly.receipt.html_production_reset_id !== receipt.html_production_reset_id || assembly.receipt.html_delivery_digest !== receipt.html_delivery_digest)) throw new Error("v3 notes assembly reset/delivery lineage differs");
    return { valid: true, reason: "current", hint: "", receipt, inputPath, planPath, pptxPath };
  } catch (validationError) {
    return { valid: false, reason: validationError.message, hint, receipt };
  }
}

/**
 * Authorize a notes-only successor. Source hash is intentionally not checked;
 * edited notes make completion stale but do not erase valid PPTX ancestry.
 */
export function validateNotesRerunInputLineage(runDir, {
  pptxPath = null,
  planPath = null,
  orderedSlideIds = null,
} = {}) {
  const { receipt, error, path } = readNotesReceipt(runDir);
  const hint = "Re-establish Stage 4 assembly lineage before rerunning Stage 5";
  if (error) return { valid: false, reason: error, hint, receipt: null };
  try {
    validateKnownShape(receipt);
    const currentPptx = pptxPath || resolveContainedExisting(runDir, receipt.pptx_path);
    const currentPlan = planPath || resolveContainedExisting(runDir, receipt.slide_plan_path);
    // Explicit caller paths must still be contained.
    const containedPptx = resolveContainedExisting(runDir, normalizedRelative(runDir, currentPptx));
    const containedPlan = resolveContainedExisting(runDir, normalizedRelative(runDir, currentPlan));
    if (sha256File(containedPptx) !== receipt.pptx_sha256) throw new Error("PPTX is not the prior notes successor");
    if (sha256File(containedPlan) !== receipt.slide_plan_sha256) throw new Error("slide plan changed after prior notes injection");
    const planIds = orderedIdsFromPlan(containedPlan);
    if (!sameArray(planIds, receipt.ordered_slide_ids)) throw new Error("prior receipt ordered IDs differ from current plan");
    if (orderedSlideIds && !sameArray(orderedSlideIds, receipt.ordered_slide_ids)) {
      throw new Error("requested ordered IDs differ from prior notes lineage");
    }
    const assembly = validateRootAssembly(runDir, receipt);
    if (receipt.schema_version === HTML_NOTES_RECEIPT_VERSION && (assembly.receipt.pipeline !== receipt.pipeline || assembly.receipt.html_production_reset_id !== receipt.html_production_reset_id || assembly.receipt.html_delivery_digest !== receipt.html_delivery_digest)) throw new Error("v3 notes rerun reset/delivery lineage differs");
    return {
      valid: true,
      reason: "current rerun input lineage",
      hint: "",
      receipt,
      receiptPath: path,
      receiptSha256: sha256File(path),
      inputPptxSha256: receipt.pptx_sha256,
      pptxPath: containedPptx,
      planPath: containedPlan,
      orderedIds: planIds,
      assembly,
    };
  } catch (validationError) {
    return { valid: false, reason: validationError.message, hint, receipt };
  }
}

/** Compatibility name now means strict schema-v2 completion. */
export function validateNotesReceipt(runDir) {
  return validateNotesCompletionReceipt(runDir);
}
