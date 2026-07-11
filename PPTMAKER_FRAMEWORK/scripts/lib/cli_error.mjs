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
  STATE_CORRUPTED: "STATE_CORRUPTED",
  FAILED: "FAILED",
});

const REQUIRED = ["code", "message", "hint", "where"];

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
