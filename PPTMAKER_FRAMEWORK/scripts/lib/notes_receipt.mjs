/** Stage-5 completion receipt helpers. Uses only Node built-ins. */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createHash, randomBytes } from "node:crypto";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

export const NOTES_RECEIPT_VERSION = 1;
export const NOTES_RECEIPT_RELATIVE_PATH = join("_generated", "qa", "notes_injection.json");

export function notesReceiptPath(runDir) {
  return join(runDir, NOTES_RECEIPT_RELATIVE_PATH);
}

export function sha256File(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
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

export function invalidateNotesReceipt(runDir) {
  rmSync(notesReceiptPath(runDir), { force: true });
}

export function buildNotesReceipt({ runDir, inputPath, pptxPath, slideCount, notesInjected }) {
  if (!Number.isInteger(slideCount) || slideCount < 1) throw new Error("slide_count must be a positive integer");
  if (!Number.isInteger(notesInjected) || notesInjected !== slideCount) throw new Error("notes_injected must equal slide_count");
  return {
    schema_version: NOTES_RECEIPT_VERSION,
    input_path: normalizedRelative(runDir, inputPath),
    input_sha256: sha256File(inputPath),
    pptx_path: normalizedRelative(runDir, pptxPath),
    pptx_sha256: sha256File(pptxPath),
    slide_count: slideCount,
    notes_injected: notesInjected,
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

export function readNotesReceipt(runDir) {
  const path = notesReceiptPath(runDir);
  if (!existsSync(path)) return { receipt: null, error: "notes injection receipt is missing" };
  try {
    return { receipt: JSON.parse(readFileSync(path, "utf8")), error: null };
  } catch (error) {
    return { receipt: null, error: `notes injection receipt is invalid JSON: ${error.message}` };
  }
}

export function validateNotesReceipt(runDir) {
  const { receipt, error } = readNotesReceipt(runDir);
  const hint = "Rerun Stage 5 through unified_pipeline/ppt_flow for the current run directory";
  if (error) return { valid: false, reason: error, hint, receipt: null };
  try {
    if (receipt.schema_version !== NOTES_RECEIPT_VERSION) throw new Error(`unsupported receipt schema ${receipt.schema_version}`);
    if (!Number.isInteger(receipt.slide_count) || receipt.slide_count < 1) throw new Error("invalid slide_count");
    if (receipt.notes_injected !== receipt.slide_count) throw new Error("notes_injected does not equal slide_count");
    if (typeof receipt.created_at !== "string" || Number.isNaN(Date.parse(receipt.created_at))) throw new Error("invalid created_at");
    const inputPath = resolveContainedExisting(runDir, receipt.input_path);
    const pptxPath = resolveContainedExisting(runDir, receipt.pptx_path);
    if (sha256File(inputPath) !== receipt.input_sha256) throw new Error("slide specification hash is stale");
    if (sha256File(pptxPath) !== receipt.pptx_sha256) throw new Error("PPTX hash is stale");
    return { valid: true, reason: "current", hint: "", receipt, inputPath, pptxPath };
  } catch (validationError) {
    return { valid: false, reason: validationError.message, hint, receipt };
  }
}
