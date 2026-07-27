/**
 * Shared CLI diagnostic producer. The authoritative contract is
 * openspec/specs/cli-surface/spec.md plus any active cli-surface delta.
 */
import { EXECUTABLE_INVENTORY } from "../../contracts/executable_inventory.mjs";
export { CLI_RETURN_AUDIT_SCHEMA, CONTINUATION_RETURN_CASES, IMAGE2_RETURN_CASES, PRODUCTION_MODE_TRANSITION_RETURN_CASES, PPT_FLOW_RETURN_AUDIT, validateCliReturnAudit } from "../../contracts/cli_return_audit.mjs";
export { EXECUTABLE_INVENTORY } from "../../contracts/executable_inventory.mjs";

export const CLI_ERROR_CODES = Object.freeze({
  UNCAUGHT: "UNCAUGHT",
  USAGE: "USAGE",
  GATE_BLOCKED: "GATE_BLOCKED",
  TITLE_REVIEW_REQUIRED: "TITLE_REVIEW_REQUIRED",
  STATE_CORRUPTED: "STATE_CORRUPTED",
  FAILED: "FAILED",
});

export const PPT_FLOW_COMMAND_INVENTORY = Object.freeze([
  "doctor",
  "init",
  "status",
  "validate",
  "build",
  "refresh",
  "slides",
  "new-version",
  "test",
  "state",
  "image2",
]);

export const CLI_DIAGNOSTIC_CATEGORIES = Object.freeze([
  "usage",
  "source_validation",
  "structure",
  "artifact",
  "gate",
  "environment",
  "provider",
  "delegated",
  "interrupted",
  "internal",
]);

export const CLI_NEXT_ACTIONS = Object.freeze([
  "fix_arguments",
  "inspect",
  "edit_source",
  "repair_environment",
  "repair_prerequisite",
  "rerun",
  "review",
  "approve",
  "report_internal",
]);

export const CLI_BOUNDS = Object.freeze({
  textChars: 1024,
  whereChars: 256,
  pathChars: 2048,
  issues: 20,
  lineage: 12,
  inspect: 16,
  reasonValues: 16,
  invocationArgs: 32,
  diagnosticBytes: 16 * 1024,
  envelopeBytes: 20 * 1024,
  humanBytes: 20 * 1024,
  streamBytes: 1024 * 1024,
});

export const CLI_TRANSACTION_SYMBOL = Symbol.for("pptmaker.cli.transaction.v1");
export const CLI_PROGRESS_ENV = "PPTMAKER_CLI_DELEGATED_PROGRESS";
export const CLI_PROGRESS_MARKER = "pptmaker_cli_progress";
export const CLI_JSON_REPORT_SCHEMAS = Object.freeze({
  ENV_CHECK: "env-check-v1",
  STATE_FAILURE: "ppt-flow-state-failure-v1",
});

const REQUIRED = ["code", "message", "hint", "where"];
const TOKEN_RE = /^[a-z][a-z0-9_-]{0,63}$/;
const SECRETISH_RE = /(?:sentinel|authorization\s*:|bearer\s+\S+|(?:api[_ -]?key|access[_ -]?token|refresh[_ -]?token|client[_ -]?secret|password|private[_ -]?key)\s*[=:]\s*\S+|raw[ _.-]?(?:env|prompt|body|response|stack))/i;
const HUMAN_ACTIONS = new Set(["review", "approve"]);
const CODE_VALUES = new Set(Object.values(CLI_ERROR_CODES));
const CATEGORY_VALUES = new Set(CLI_DIAGNOSTIC_CATEGORIES);
const ACTION_VALUES = new Set(CLI_NEXT_ACTIONS);

function byteLength(value) {
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}

function boundedString(value, max, state, { path = false, safe = false } = {}) {
  if (typeof value !== "string") return undefined;
  let result = value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim();
  if (!result || (safe && SECRETISH_RE.test(result))) return undefined;
  if (result.length > max) {
    result = result.slice(0, max);
    state.truncated = true;
  }
  if (path && /[\r\n]/.test(result)) return undefined;
  return result;
}

function token(value) {
  return typeof value === "string" && TOKEN_RE.test(value) ? value : undefined;
}

function positivePosition(value) {
  return Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

function safeScalar(value, state) {
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return boundedString(value, CLI_BOUNDS.textChars, state, { safe: true });
}

function sanitizeScalarValue(value, state) {
  if (Array.isArray(value)) {
    const out = [];
    for (const item of value.slice(0, CLI_BOUNDS.reasonValues)) {
      const safe = safeScalar(item, state);
      if (safe !== undefined) out.push(safe);
      else state.truncated = true;
    }
    if (value.length > CLI_BOUNDS.reasonValues) state.truncated = true;
    return out.length ? out : undefined;
  }
  return safeScalar(value, state);
}

function sanitizeLocator(value, state) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const path = boundedString(value.path, CLI_BOUNDS.pathChars, state, { path: true, safe: true });
  if (!path) return undefined;
  const out = { path };
  const line = positivePosition(value.line);
  const column = positivePosition(value.column);
  if (line) out.line = line;
  if (column) out.column = column;
  return out;
}

function sanitizeSubject(value, state) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const kind = token(value.kind);
  if (!kind) return undefined;
  const out = { kind };
  const id = boundedString(value.id, CLI_BOUNDS.textChars, state, { safe: true });
  const field = boundedString(value.field, CLI_BOUNDS.textChars, state, { safe: true });
  if (id) out.id = id;
  if (field) out.field = field;
  return out;
}

function sanitizeReason(value, state) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const kind = token(value.kind);
  if (!kind) return undefined;
  const out = { kind };
  const actual = sanitizeScalarValue(value.actual, state);
  const expected = sanitizeScalarValue(value.expected, state);
  if (actual !== undefined) out.actual = actual;
  if (expected !== undefined) out.expected = expected;
  return out;
}

function sanitizeLineage(value, state) {
  if (!Array.isArray(value)) return undefined;
  const out = [];
  for (const item of value.slice(0, CLI_BOUNDS.lineage)) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const kind = token(item.kind);
    const path = boundedString(item.path, CLI_BOUNDS.pathChars, state, { path: true, safe: true });
    if (!kind || !path) continue;
    const leaf = { kind, path };
    const stage = token(item.stage);
    if (stage) leaf.stage = stage;
    out.push(leaf);
  }
  if (value.length > CLI_BOUNDS.lineage) state.truncated = true;
  return out.length ? out : undefined;
}

function sanitizeInvocation(value, state) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const program = boundedString(value.program, CLI_BOUNDS.pathChars, state, { path: true, safe: true });
  if (!program || !Array.isArray(value.args)) return undefined;
  const args = [];
  for (let index = 0; index < value.args.slice(0, CLI_BOUNDS.invocationArgs).length; index += 1) {
    const arg = value.args[index];
    const safe = boundedString(arg, CLI_BOUNDS.pathChars, state, { path: true, safe: true });
    if (!safe) return undefined;
    if (/^https?:\/\//i.test(safe)) {
      try {
        const parsed = new URL(safe);
        if (parsed.username || parsed.password || parsed.search || parsed.hash) return undefined;
      } catch {
        return undefined;
      }
    }
    if (/^--?(?:api[-_]?key|token|secret|password|authorization)$/i.test(safe)) return undefined;
    args.push(safe);
  }
  if (value.args.length > CLI_BOUNDS.invocationArgs) state.truncated = true;
  return { program, args };
}

function sanitizeIssue(value, state) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const out = {};
  const message = boundedString(value.message, CLI_BOUNDS.textChars, state, { safe: true });
  const subject = sanitizeSubject(value.subject, state);
  const source = sanitizeLocator(value.source, state);
  const reason = sanitizeReason(value.reason, state);
  const lineage = sanitizeLineage(value.lineage, state);
  if (message) out.message = message;
  if (subject) out.subject = subject;
  if (source) out.source = source;
  if (reason) out.reason = reason;
  if (lineage) out.lineage = lineage;
  return Object.keys(out).length ? out : undefined;
}

function minimalDiagnostic(category = "internal") {
  const normalized = CATEGORY_VALUES.has(category) ? category : "internal";
  const action = normalized === "usage"
    ? "fix_arguments"
    : normalized === "interrupted"
      ? "rerun"
      : normalized === "environment"
        ? "repair_environment"
        : "report_internal";
  return {
    version: 1,
    category: normalized,
    next: {
      action,
      requires_human: false,
      default: action === "fix_arguments"
        ? "Correct the command arguments, then rerun."
        : action === "rerun"
          ? "Rerun the command when execution can continue."
          : action === "repair_environment"
            ? "Repair the local environment, then rerun."
            : "Inspect the named command location and report the framework failure."
    },
  };
}

export function sanitizeCliDiagnostic(input, { fallbackOnInvalid = true } = {}) {
  const invalid = () => fallbackOnInvalid ? minimalDiagnostic("internal") : null;
  if (!input || typeof input !== "object" || Array.isArray(input)) return invalid();
  if (input.version !== 1 || !CATEGORY_VALUES.has(input.category)) return invalid();
  if (!input.next || typeof input.next !== "object" || Array.isArray(input.next)) return invalid();
  const action = ACTION_VALUES.has(input.next.action) ? input.next.action : null;
  const requiresHuman = typeof input.next.requires_human === "boolean" ? input.next.requires_human : null;
  const state = { truncated: false };
  const defaultText = boundedString(input.next.default, CLI_BOUNDS.textChars, state, { safe: true });
  if (!action || requiresHuman === null || !defaultText) return invalid();
  if (HUMAN_ACTIONS.has(action) && requiresHuman !== true) return invalid();

  const out = {
    version: 1,
    category: input.category,
    next: { action, requires_human: requiresHuman, default: defaultText },
  };
  const stage = token(input.stage);
  const operation = token(input.operation);
  const subject = sanitizeSubject(input.subject, state);
  const source = sanitizeLocator(input.source, state);
  const reason = sanitizeReason(input.reason, state);
  const lineage = sanitizeLineage(input.lineage, state);
  if (stage) out.stage = stage;
  if (operation) out.operation = operation;
  if (subject) out.subject = subject;
  if (source) out.source = source;
  if (reason) out.reason = reason;

  if (input.delegated && typeof input.delegated === "object" && !Array.isArray(input.delegated)) {
    const delegated = {};
    const invocation = sanitizeInvocation(input.delegated.invocation, state);
    const childCode = CODE_VALUES.has(input.delegated.child_code) ? input.delegated.child_code : undefined;
    const childWhere = boundedString(input.delegated.child_where, CLI_BOUNDS.whereChars, state, { safe: true });
    if (invocation) delegated.invocation = invocation;
    if (childCode) delegated.child_code = childCode;
    if (childWhere) delegated.child_where = childWhere;
    if (Object.keys(delegated).length) out.delegated = delegated;
  }

  let omittedCount = Number.isSafeInteger(input.omitted_count) && input.omitted_count >= 0
    ? input.omitted_count
    : 0;
  if (Array.isArray(input.issues)) {
    const issues = [];
    const candidates = input.issues.slice(0, CLI_BOUNDS.issues);
    for (const issue of candidates) {
      const safe = sanitizeIssue(issue, state);
      if (safe) issues.push(safe);
      else omittedCount += 1;
    }
    if (input.issues.length > CLI_BOUNDS.issues) {
      omittedCount += input.issues.length - CLI_BOUNDS.issues;
      state.truncated = true;
    }
    if (issues.length) out.issues = issues;
  }
  if (lineage) out.lineage = lineage;

  if (Array.isArray(input.next.inspect)) {
    const inspect = input.next.inspect
      .slice(0, CLI_BOUNDS.inspect)
      .map((item) => sanitizeLocator(item, state))
      .filter(Boolean);
    if (input.next.inspect.length > CLI_BOUNDS.inspect) state.truncated = true;
    if (inspect.length) out.next.inspect = inspect;
  }
  const invocation = sanitizeInvocation(input.next.invocation, state);
  if (invocation) out.next.invocation = invocation;

  if (omittedCount > 0) out.omitted_count = omittedCount;
  if (input.truncated === true || state.truncated) out.truncated = true;

  while (byteLength(out) > CLI_BOUNDS.diagnosticBytes && out.issues?.length) {
    out.issues.pop();
    out.omitted_count = (out.omitted_count || 0) + 1;
    out.truncated = true;
  }
  while (byteLength(out) > CLI_BOUNDS.diagnosticBytes && out.lineage?.length) {
    out.lineage.pop();
    out.truncated = true;
  }
  while (byteLength(out) > CLI_BOUNDS.diagnosticBytes && out.next.inspect?.length) {
    out.next.inspect.pop();
    out.truncated = true;
  }
  if (byteLength(out) > CLI_BOUNDS.diagnosticBytes && out.reason) {
    delete out.reason.actual;
    delete out.reason.expected;
    out.truncated = true;
  }
  if (byteLength(out) > CLI_BOUNDS.diagnosticBytes && out.delegated?.invocation) {
    delete out.delegated.invocation;
    out.truncated = true;
  }
  if (byteLength(out) > CLI_BOUNDS.diagnosticBytes && out.next.invocation) {
    delete out.next.invocation;
    out.truncated = true;
  }
  return byteLength(out) <= CLI_BOUNDS.diagnosticBytes ? out : minimalDiagnostic("internal");
}

function defaultCategoryForCode(code) {
  if (code === CLI_ERROR_CODES.USAGE) return "usage";
  if (code === CLI_ERROR_CODES.GATE_BLOCKED || code === CLI_ERROR_CODES.TITLE_REVIEW_REQUIRED) return "gate";
  if (code === CLI_ERROR_CODES.STATE_CORRUPTED) return "artifact";
  return "internal";
}

function defaultDiagnosticForCode(code) {
  if (code === CLI_ERROR_CODES.GATE_BLOCKED || code === CLI_ERROR_CODES.TITLE_REVIEW_REQUIRED) {
    return {
      version: 1,
      category: "gate",
      next: {
        action: "review",
        requires_human: true,
        default: "Review the named gate evidence before continuing.",
      },
    };
  }
  if (code === CLI_ERROR_CODES.STATE_CORRUPTED) {
    return {
      version: 1,
      category: "artifact",
      next: {
        action: "repair_prerequisite",
        requires_human: false,
        default: "Preserve unsupported state bytes and run fresh explicit ppt_flow init; repair the named current prerequisite before rerunning.",
      },
    };
  }
  return minimalDiagnostic(defaultCategoryForCode(code));
}

export function formatCliError(opts) {
  if (!opts || typeof opts !== "object") throw new Error("formatCliError: opts object required");
  for (const key of REQUIRED) {
    if (typeof opts[key] !== "string" || opts[key].trim() === "") {
      throw new Error(`formatCliError: ${key} must be a non-empty string`);
    }
  }
  if (!CODE_VALUES.has(opts.code)) throw new Error(`formatCliError: illegal code ${JSON.stringify(opts.code)}`);
  const state = { truncated: false };
  const envelope = {
    ok: false,
    code: opts.code,
    message: boundedString(opts.message, CLI_BOUNDS.textChars, state, { safe: true }) || "Command failed.",
    hint: boundedString(opts.hint, CLI_BOUNDS.textChars, state, { safe: true }) || "Inspect the diagnostic and retry safely.",
    where: boundedString(opts.where, CLI_BOUNDS.whereChars, state, { safe: true }) || "cli",
    diagnostic: opts.diagnostic === undefined
      ? defaultDiagnosticForCode(opts.code)
      : sanitizeCliDiagnostic(opts.diagnostic),
  };
  if (state.truncated) envelope.diagnostic.truncated = true;
  if (byteLength(envelope) > CLI_BOUNDS.envelopeBytes) {
    envelope.diagnostic = minimalDiagnostic("internal");
    envelope.message = "Command failed with oversized diagnostic metadata.";
    envelope.hint = "Inspect the command location and report the framework failure.";
  }
  return envelope;
}

function transactionState() {
  return globalThis[CLI_TRANSACTION_SYMBOL] || null;
}

export function emitCliError(opts) {
  const envelope = formatCliError(opts);
  const state = transactionState();
  if (state?.installed && !state.committed) {
    state.pendingEnvelope = envelope;
  } else {
    console.error(JSON.stringify(envelope));
  }
  return envelope;
}

export function exitCliError(opts, exitCode = 1) {
  emitCliError(opts);
  process.exit(exitCode);
}

export function parseCliErrorLine(line) {
  try {
    const value = JSON.parse(String(line));
    if (!value || value.ok !== false) return null;
    for (const key of REQUIRED) if (typeof value[key] !== "string" || !value[key].trim()) return null;
    if (!CODE_VALUES.has(value.code)) return null;
    const parsed = {
      ok: false,
      code: value.code,
      message: value.message.slice(0, CLI_BOUNDS.textChars),
      hint: value.hint.slice(0, CLI_BOUNDS.textChars),
      where: value.where.slice(0, CLI_BOUNDS.whereChars),
    };
    if (value.diagnostic?.version === 1) {
      const diagnostic = sanitizeCliDiagnostic(value.diagnostic, { fallbackOnInvalid: false });
      if (diagnostic) parsed.diagnostic = diagnostic;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function hasSupportedCliDiagnostic(envelope) {
  return !!envelope?.diagnostic && envelope.diagnostic.version === 1 &&
    !!sanitizeCliDiagnostic(envelope.diagnostic, { fallbackOnInvalid: false });
}

export function createCliSource(path, positions = {}) {
  return { path, ...(positions.line ? { line: positions.line } : {}), ...(positions.column ? { column: positions.column } : {}) };
}

export function createCliSubject(kind, values = {}) {
  return { kind, ...(values.id ? { id: values.id } : {}), ...(values.field ? { field: values.field } : {}) };
}

export function createCliReason(kind, values = {}) {
  return { kind, ...(values.actual !== undefined ? { actual: values.actual } : {}), ...(values.expected !== undefined ? { expected: values.expected } : {}) };
}

export function createCliLineage(...entries) {
  return entries.flat().filter(Boolean);
}

export function createCliIssue(values = {}) {
  return { ...values };
}

export function createCliDelegated(values = {}) {
  return { ...values };
}

export function createCliNext(action, values = {}) {
  return {
    action,
    requires_human: values.requiresHuman ?? HUMAN_ACTIONS.has(action),
    ...(values.inspect ? { inspect: values.inspect } : {}),
    ...(values.invocation ? { invocation: values.invocation } : {}),
    default: values.default || "Inspect the diagnostic evidence before continuing.",
  };
}

export function attachCliDiagnostic(error, diagnostic) {
  const normalized = error instanceof Error ? error : new Error("CLI operation failed");
  Object.defineProperty(normalized, "cliDiagnostic", { value: diagnostic, configurable: true });
  return normalized;
}

export function diagnosticFromError(error) {
  return error?.cliDiagnostic || null;
}

export function setCliOutputMode(mode) {
  if (mode !== "human" && mode !== "json") throw new Error(`Unsupported CLI output mode: ${mode}`);
  const state = transactionState();
  if (state?.installed && !state.committed) state.outputMode = mode;
  return mode;
}

function sanitizeReportValue(value, depth = 0) {
  // State observation composes bounded workflow and review projections. A
  // missing review can add one diagnostic layer without making
  // the report unsafe; the byte cap remains the public output boundary.
  if (depth > 12) throw new Error("CLI JSON report is too deeply nested");
  if (value === null || typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value))) return value;
  if (typeof value === "string") {
    if (SECRETISH_RE.test(value) || value.length > CLI_BOUNDS.pathChars) throw new Error("CLI JSON report contains unsafe text");
    return value;
  }
  if (Array.isArray(value)) return value.slice(0, 256).map((item) => sanitizeReportValue(item, depth + 1));
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, item] of Object.entries(value)) {
      if (SECRETISH_RE.test(key)) throw new Error("CLI JSON report contains an unsafe field");
      out[key] = sanitizeReportValue(item, depth + 1);
    }
    return out;
  }
  throw new Error("CLI JSON report contains an unsupported value");
}

export function validateCliJsonReport(report, schema = null) {
  const safe = sanitizeReportValue(report);
  if (schema === null) return safe;
  if (schema === CLI_JSON_REPORT_SCHEMAS.ENV_CHECK) {
    const valid = safe && typeof safe === "object" && !Array.isArray(safe)
      && ["allPass", "foundationOk", "smoke", "probeVendors"].every((key) => typeof safe[key] === "boolean")
      && Array.isArray(safe.checks)
      && safe.checks.every((check) => check && typeof check === "object" && !Array.isArray(check)
        && typeof check.check === "string" && check.check.length > 0
        && ["ok", "warn", "fail"].includes(check.status)
        && (check.foundation === undefined || typeof check.foundation === "boolean")
        && (check.detail === undefined || check.detail === null || typeof check.detail === "string")
        && (check.fix === undefined || check.fix === null || typeof check.fix === "string"));
    if (!valid) throw new Error("CLI JSON report does not match env-check-v1");
    return safe;
  }
  if (schema === CLI_JSON_REPORT_SCHEMAS.STATE_FAILURE) {
    const valid = safe && typeof safe === "object" && !Array.isArray(safe)
      && safe.corrupted === true
      && Number.isSafeInteger(safe.error_count)
      && safe.error_count >= 0;
    if (!valid) throw new Error("CLI JSON report does not match ppt-flow-state-failure-v1");
    return safe;
  }
  throw new Error(`Unknown CLI JSON report schema: ${schema}`);
}

export function registerCliJsonReport(report, { schema = null } = {}) {
  const state = transactionState();
  if (!state?.installed || state.committed || state.outputMode !== "json") {
    throw new Error("CLI JSON reports require an active registered JSON mode");
  }
  const safe = validateCliJsonReport(report, schema);
  const serialized = `${JSON.stringify(safe, null, 2)}\n`;
  if (Buffer.byteLength(serialized, "utf8") > CLI_BOUNDS.humanBytes) throw new Error("CLI JSON report exceeds its bound");
  state.safeReport = serialized;
  return safe;
}

const PROGRESS_EVENTS = Object.freeze({
  stage_start: ({ stage }) => `Stage ${stage} started.`,
  stage_complete: ({ stage }) => `Stage ${stage} completed.`,
  item_start: ({ stage, index, total, id }) => `${stage}: starting ${index}/${total}${id ? ` (${id})` : ""}.`,
  item_complete: ({ stage, index, total, id, status }) => `${stage}: completed ${index}/${total}${id ? ` (${id})` : ""}${status ? ` [${status}]` : ""}.`,
  provider_attempt: ({ host, attempt }) => `Provider ${host}: attempt ${attempt}.`,
  provider_poll: ({ host, attempt, status }) => `Provider ${host}: poll ${attempt}${status ? ` [${status}]` : ""}.`,
});

function sanitizeProgress(event, fields) {
  if (!Object.hasOwn(PROGRESS_EVENTS, event) || !fields || typeof fields !== "object" || Array.isArray(fields)) return null;
  const allowed = new Set(["stage", "index", "total", "id", "status", "path", "host", "attempt"]);
  if (Object.keys(fields).some((key) => !allowed.has(key))) return null;
  const state = { truncated: false };
  const out = {};
  for (const [key, value] of Object.entries(fields)) {
    if (["index", "total", "attempt"].includes(key)) {
      if (!Number.isSafeInteger(value) || value < 0) return null;
      out[key] = value;
    } else {
      const safe = boundedString(value, key === "path" ? CLI_BOUNDS.pathChars : CLI_BOUNDS.textChars, state, { path: key === "path", safe: true });
      if (!safe) return null;
      out[key] = safe;
    }
  }
  return { event, fields: out };
}

export function renderCliProgress(event, fields) {
  const safe = sanitizeProgress(event, fields);
  return safe ? PROGRESS_EVENTS[event](safe.fields) : null;
}

export function emitCliProgress(event, fields = {}) {
  const safe = sanitizeProgress(event, fields);
  if (!safe) return false;
  const state = transactionState();
  if (state?.outputMode === "json") return true;
  if (process.env[CLI_PROGRESS_ENV] === "1") {
    process.stderr.write(`${JSON.stringify({ [CLI_PROGRESS_MARKER]: 1, ...safe })}\n`);
    return true;
  }
  if (!state?.installed || state.committed) return true;
  const rendered = PROGRESS_EVENTS[event](safe.fields);
  if (state?.writeSafeStderr) state.writeSafeStderr(`${rendered}\n`);
  else process.stderr.write(`${rendered}\n`);
  return true;
}

export function parseCliProgressLine(line) {
  try {
    const value = JSON.parse(String(line));
    if (value?.[CLI_PROGRESS_MARKER] !== 1) return null;
    return sanitizeProgress(value.event, value.fields);
  } catch {
    return null;
  }
}

function displayArg(value) {
  return /^[A-Za-z0-9_./:@%+=,-]+$/.test(value) ? value : JSON.stringify(value);
}

export function renderCliHumanError(envelope) {
  const lines = [`${envelope.code}: ${envelope.message}`];
  if (envelope.where) lines.push(`Where: ${envelope.where}`);
  const issues = envelope.diagnostic?.issues || [];
  for (const issue of issues) {
    const detail = [issue.message];
    if (issue.subject) detail.push([issue.subject.kind, issue.subject.id, issue.subject.field].filter(Boolean).join(":"));
    if (issue.source) detail.push(`${issue.source.path}${issue.source.line ? `:${issue.source.line}` : ""}`);
    lines.push(`- ${detail.filter(Boolean).join(" | ")}`);
  }
  if (envelope.diagnostic?.omitted_count) lines.push(`Additional issues omitted: ${envelope.diagnostic.omitted_count}`);
  const next = envelope.diagnostic?.next;
  if (next?.default) lines.push(`Next: ${next.default}`);
  if (next?.inspect?.[0]) {
    const item = next.inspect[0];
    lines.push(`Inspect: ${item.path}${item.line ? `:${item.line}` : ""}`);
  }
  if (next?.invocation) lines.push(`Run: ${[next.invocation.program, ...next.invocation.args].map(displayArg).join(" ")}`);
  while (Buffer.byteLength(`${lines.join("\n")}\n`, "utf8") > CLI_BOUNDS.humanBytes && lines.some((line) => line.startsWith("- "))) {
    const index = lines.map((line) => line.startsWith("- ")).lastIndexOf(true);
    lines.splice(index, 1);
  }
  return `${lines.join("\n")}\n`;
}

export function installStandaloneFailureEnvelope() {
  // Compatibility shim. Direct entries install through cli_bootstrap.mjs first.
  return !!transactionState()?.installed;
}

export function createChildOutputCollector({ registered = false, onProgress = null, maxBytes = CLI_BOUNDS.streamBytes } = {}) {
  const stdout = [];
  const stderr = [];
  let stderrPending = Buffer.alloc(0);
  let stdoutBytes = 0;
  let stderrBytes = 0;
  let stdoutOverflow = false;
  let stderrOverflow = false;
  const appendStdout = (chunk) => {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    const remaining = Math.max(0, maxBytes - stdoutBytes);
    if (remaining) stdout.push(buffer.subarray(0, remaining));
    if (buffer.length > remaining) stdoutOverflow = true;
    stdoutBytes += buffer.length;
  };
  const keepStderrLine = (line) => {
    const progress = registered ? parseCliProgressLine(line.toString("utf8").trim()) : null;
    if (progress) {
      if (onProgress) onProgress(progress.event, progress.fields);
      return;
    }
    stderr.push(line);
  };
  const appendStderr = (chunk) => {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    const remaining = Math.max(0, maxBytes - stderrBytes);
    const captured = remaining ? buffer.subarray(0, remaining) : Buffer.alloc(0);
    if (buffer.length > remaining) stderrOverflow = true;
    stderrBytes += buffer.length;
    if (!captured.length) return;
    stderrPending = Buffer.concat([stderrPending, captured]);
    let newline;
    while ((newline = stderrPending.indexOf(0x0a)) !== -1) {
      keepStderrLine(stderrPending.subarray(0, newline + 1));
      stderrPending = stderrPending.subarray(newline + 1);
    }
  };
  return {
    pushStdout(chunk) { appendStdout(chunk); },
    pushStderr(chunk) { appendStderr(chunk); },
    finish(rawCode) {
      if (stderrPending.length) {
        keepStderrLine(stderrPending);
        stderrPending = Buffer.alloc(0);
      }
      const stdoutText = Buffer.concat(stdout).toString("utf8");
      const stderrText = Buffer.concat(stderr).toString("utf8");
      let childError = null;
      const nonEmpty = stderrText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      if (registered && nonEmpty.length) {
        const parsed = parseCliErrorLine(nonEmpty.at(-1));
        if (parsed?.diagnostic) childError = parsed;
      }
      const code = normalizeDelegatedExit(rawCode, childError);
      return {
        code,
        childError,
        stdout: code === 0 && !stdoutOverflow && !stderrOverflow ? stdoutText : "",
        stderr: code === 0 && !stdoutOverflow && !stderrOverflow ? stderrText : "",
        overflow: stdoutOverflow || stderrOverflow,
        captured: { stdoutBytes, stderrBytes },
      };
    },
  };
}

export function normalizeDelegatedExit(rawCode, childError) {
  let code = Number.isInteger(rawCode) && rawCode > 0 && rawCode <= 255 ? rawCode : rawCode === 0 ? 0 : 1;
  if (childError && code === 0) code = 1;
  return code;
}

export function buildDelegatedDiagnostic({ invocation, childError, category, stage, operation, next, overflow = false }) {
  const child = childError?.diagnostic && hasSupportedCliDiagnostic(childError) ? childError.diagnostic : null;
  return sanitizeCliDiagnostic({
    version: 1,
    category: category || child?.category || "delegated",
    ...(stage ? { stage } : child?.stage ? { stage: child.stage } : {}),
    ...(operation ? { operation } : child?.operation ? { operation: child.operation } : {}),
    ...(child?.subject ? { subject: child.subject } : {}),
    ...(child?.source ? { source: child.source } : {}),
    ...(child?.reason ? { reason: child.reason } : {}),
    ...(child?.lineage ? { lineage: child.lineage } : {}),
    ...(child?.issues ? { issues: child.issues } : {}),
    delegated: {
      invocation,
      ...(childError?.code ? { child_code: childError.code } : {}),
      ...(childError?.where ? { child_where: childError.where } : {}),
    },
    next: next || createCliNext("report_internal", {
      default: "Inspect the parent command and registered child boundary before retrying.",
    }),
    ...(overflow ? { truncated: true } : {}),
  });
}
