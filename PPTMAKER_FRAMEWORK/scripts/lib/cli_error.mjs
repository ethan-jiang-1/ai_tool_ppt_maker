/**
 * cli_error.mjs — JSON failure envelope for ppt_flow (and shared CLI helpers).
 *
 * Wire format (design D2): last non-empty stderr line = single-line JSON.
 * emitCliError does NOT call process.exit — callers exit after emit (D13).
 */

export const CLI_ERROR_CODES = Object.freeze({
  UNCAUGHT: "UNCAUGHT",
  USAGE: "USAGE",
  GATE_BLOCKED: "GATE_BLOCKED",
  TITLE_REVIEW_REQUIRED: "TITLE_REVIEW_REQUIRED",
  STATE_CORRUPTED: "STATE_CORRUPTED",
  FAILED: "FAILED",
});
export const EXECUTABLE_INVENTORY = Object.freeze([
  "bundle_layout.mjs",
  "env-check.mjs",
  "generate_style_master.mjs",
  "make_contact_sheet.mjs",
  "ppt_flow.mjs",
  "stage1_build_inputs.mjs",
  "stage2_generate_images.mjs",
  "stage3_lock_headers.mjs",
  "stage4_build_pptx.mjs",
  "stage5_inject_notes.mjs",
  "unified_pipeline.mjs",
]);

const REQUIRED = ["code", "message", "hint", "where"];
const EMITTED = Symbol.for("pptmaker.cliErrorEmitted");
const INSTALLED = Symbol.for("pptmaker.cliFailureGuardInstalled");

/**
 * @param {{ code: string, message: string, hint: string, where: string, stack?: string }} opts
 * @returns {{ ok: false, code: string, message: string, hint: string, where: string, stack?: string }}
 */
export function formatCliError(opts) {
  if (!opts || typeof opts !== "object") {
    throw new Error("formatCliError: opts object required");
  }
  for (const key of REQUIRED) {
    const v = opts[key];
    if (typeof v !== "string" || v.trim() === "") {
      throw new Error(`formatCliError: ${key} must be a non-empty string`);
    }
  }
  if (!Object.values(CLI_ERROR_CODES).includes(opts.code)) {
    throw new Error(
      `formatCliError: illegal code ${JSON.stringify(opts.code)}`
    );
  }
  /** @type {{ ok: false, code: string, message: string, hint: string, where: string, stack?: string }} */
  const envelope = {
    ok: false,
    code: opts.code,
    message: opts.message,
    hint: opts.hint,
    where: opts.where,
  };
  if (opts.stack != null && opts.stack !== "") {
    const stack =
      typeof opts.stack === "string" ? opts.stack : String(opts.stack);
    envelope.stack = stack.length > 2048 ? stack.slice(0, 2048) : stack;
  }
  return envelope;
}

/**
 * Write failure envelope as one stderr line. Does not exit.
 * @param {{ code: string, message: string, hint: string, where: string, stack?: string }} opts
 */
export function emitCliError(opts) {
  process[EMITTED] = true;
  console.error(JSON.stringify(formatCliError(opts)));
}

/**
 * Emit then process.exit. Never returns.
 * @param {{ code: string, message: string, hint: string, where: string, stack?: string }} opts
 * @param {number} [exitCode=1]
 */
export function exitCliError(opts, exitCode = 1) {
  emitCliError(opts);
  process.exit(exitCode);
}

export function parseCliErrorLine(line) {
  try {
    const value = JSON.parse(String(line));
    if (!value || value.ok !== false) return null;
    for (const key of REQUIRED) if (typeof value[key] !== "string" || !value[key].trim()) return null;
    if (!Object.values(CLI_ERROR_CODES).includes(value.code)) return null;
    return value;
  } catch {
    return null;
  }
}

/**
 * Install a direct-entry safety net. It never runs on module import.
 * Existing diagnostics are preserved; a missing final envelope is appended on
 * non-zero process exit. Calls through emitCliError are detected to avoid a
 * duplicate envelope.
 */
export function installStandaloneFailureEnvelope({ where, hint = "Run with --help and fix the reported arguments" }) {
  if (process[INSTALLED]) return;
  process[INSTALLED] = true;
  let recentStderr = "";
  const originalWrite = process.stderr.write.bind(process.stderr);
  process.stderr.write = (chunk, encoding, callback) => {
    const text = Buffer.isBuffer(chunk) ? chunk.toString(typeof encoding === "string" ? encoding : "utf8") : String(chunk);
    recentStderr = (recentStderr + text).slice(-65536);
    return originalWrite(chunk, encoding, callback);
  };
  const lastDiagnostic = () => recentStderr.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).at(-1) || "command failed";
  const emitFallback = (code = null, error = null) => {
    if (process[EMITTED]) return;
    const last = lastDiagnostic();
    if (parseCliErrorLine(last)) {
      process[EMITTED] = true;
      return;
    }
    const message = error?.message || last;
    const usageLike = /usage|unknown (?:command|option)|required|missing mandatory|too many arguments|only applies|choose only one|option .* argument/i.test(recentStderr);
    emitCliError({
      code: code || (usageLike ? CLI_ERROR_CODES.USAGE : CLI_ERROR_CODES.FAILED),
      message,
      hint,
      where,
      ...(error?.stack ? { stack: error.stack } : {}),
    });
  };
  process.on("uncaughtException", (error) => {
    emitFallback(CLI_ERROR_CODES.UNCAUGHT, error);
    process.exitCode = 1;
  });
  process.on("unhandledRejection", (error) => {
    const normalized = error instanceof Error ? error : new Error(String(error));
    emitFallback(CLI_ERROR_CODES.UNCAUGHT, normalized);
    process.exitCode = 1;
  });
  process.on("exit", (code) => {
    if (code !== 0) emitFallback();
  });
}

export function createChildStderrFramer({ relay, maxCandidateBytes = 65536 }) {
  let pendingLine = "";
  let partialLine = "";
  let fallback = "";
  const emit = (line) => {
    if (!line) return;
    relay(line);
    fallback = line.trim().slice(-4096) || fallback;
  };
  return {
    push(chunk) {
      partialLine += String(chunk);
      while (partialLine.includes("\n")) {
        const index = partialLine.indexOf("\n");
        const completeLine = partialLine.slice(0, index + 1);
        partialLine = partialLine.slice(index + 1);
        if (pendingLine) emit(pendingLine);
        pendingLine = completeLine;
      }
      if (partialLine.length > maxCandidateBytes) {
        if (pendingLine) emit(pendingLine);
        pendingLine = "";
        emit(partialLine.slice(0, partialLine.length - 4096));
        partialLine = partialLine.slice(-4096);
      }
    },
    finish() {
      if (partialLine && pendingLine) emit(pendingLine);
      const finalLine = (partialLine || pendingLine).trim();
      const childError = parseCliErrorLine(finalLine);
      if (!childError && finalLine) emit(finalLine);
      return { childError, fallback };
    },
  };
}

export function normalizeDelegatedExit(rawCode, childError) {
  let code = Number.isInteger(rawCode) && rawCode > 0 && rawCode <= 255 ? rawCode : rawCode === 0 ? 0 : 1;
  if (childError && code === 0) code = 1;
  return code;
}
