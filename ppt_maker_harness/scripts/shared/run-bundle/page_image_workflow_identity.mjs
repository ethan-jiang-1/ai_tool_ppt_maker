import {
  PAGE_IMAGE_WORKFLOW_V1_PIPELINE,
  RETIRED_PAGE_AUTHORITY_IMAGE2_V2_PIPELINE,
} from "./production_marker.mjs";
import { PAGE_IMAGE_WORKFLOW_PRODUCTION_MODE } from "./production_mode.mjs";

export const RETIRED_PAGE_AUTHORITY_IMAGE2_V2_MODE = "image2-page-authority-v2";
export const UNSUPPORTED_PROTOCOL_CODE = "UNSUPPORTED_PROTOCOL";
export const UNSUPPORTED_PROTOCOL_EXPORT_ACTION = "unsupported-protocol/export";

// This scanner intentionally operates on raw record bytes.  It recognizes
// only retired record identities and paths, not arbitrary source prose, so a
// retained record is stopped before JSON/YAML decoding can reinterpret it.
const RETIRED_RECORD_VALUE_RE = /(?:^|[^A-Za-z0-9_-])(?:pptmaker-)?page-authority(?:-[a-z0-9]+)+-v[0-9]+(?:$|[^A-Za-z0-9_-])/i;
const RETIRED_RECORD_PATH_RE = /(?:^|[^A-Za-z0-9_])page_authority_image2(?:$|[^A-Za-z0-9_])/i;
const RETIRED_MODE_VALUE_RE = /(?:^|[^A-Za-z0-9_-])image2-page-authority-v[0-9]+(?:$|[^A-Za-z0-9_-])/i;

function asText(value) {
  if (Buffer.isBuffer(value)) return value.toString("utf8");
  if (value instanceof Uint8Array) return Buffer.from(value).toString("utf8");
  return typeof value === "string" ? value : null;
}

function leadingFrontmatter(text) {
  const body = text.startsWith("\uFEFF") ? text.slice(1) : text;
  if (!body.startsWith("---\n") && !body.startsWith("---\r\n")) return "";
  const newline = body.startsWith("---\r\n") ? "\r\n" : "\n";
  const close = body.indexOf(`${newline}---${newline}`, 3 + newline.length);
  const terminalClose = body.endsWith(`${newline}---`) ? body.length - (newline.length + 3) : -1;
  const closing = close >= 0 ? close + newline.length : terminalClose;
  return closing < 0 ? body : body.slice(0, closing + 3);
}

function yamlValue(text, key) {
  const match = text.match(new RegExp(`(?:^|\\n)[\\t ]*${key}[\\t ]*:[\\t ]*(?:[\\"']([^\\"'\\r\\n#]+)[\\"']|([^\\r\\n#]+))`, "i"));
  return (match?.[1] ?? match?.[2] ?? "").trim() || null;
}

function jsonValue(text, key) {
  const match = text.match(new RegExp(`\\"${key}\\"\\s*:\\s*\\"([^\\"]+)\\"`, "i"));
  return match?.[1] ?? null;
}

function fieldValue(value, key) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return typeof value[key] === "string" ? value[key] : null;
}

function retiredRecordToken(text) {
  if (RETIRED_RECORD_VALUE_RE.test(text) || RETIRED_RECORD_PATH_RE.test(text) || RETIRED_MODE_VALUE_RE.test(text)) {
    return "page-authority-record";
  }
  return null;
}

function retiredResult(kind, actual, { path = null } = {}) {
  return Object.freeze({
    ok: false,
    code: UNSUPPORTED_PROTOCOL_CODE,
    owner_action: UNSUPPORTED_PROTOCOL_EXPORT_ACTION,
    byte_preserving: true,
    kind,
    actual,
    ...(path ? { path } : {}),
  });
}

function invalidCurrentResult(kind, actual, expected, { path = null } = {}) {
  return Object.freeze({
    ok: false,
    code: "CURRENT_PROTOCOL_IDENTITY_INVALID",
    owner_action: "repair-current-protocol-identity",
    kind,
    actual,
    expected,
    ...(path ? { path } : {}),
  });
}

function sourceIdentity(sourceBytes, path) {
  const text = asText(sourceBytes);
  if (text === null) return null;
  const pipeline = yamlValue(leadingFrontmatter(text), "pipeline");
  if (pipeline === RETIRED_PAGE_AUTHORITY_IMAGE2_V2_PIPELINE) {
    return retiredResult("source", pipeline, { path });
  }
  return pipeline ? Object.freeze({ pipeline }) : null;
}

function stateIdentity(stateBytes, path) {
  const text = asText(stateBytes);
  if (text === null) return null;
  const pipeline = yamlValue(text, "pipeline") ?? jsonValue(text, "pipeline");
  const mode = yamlValue(text, "mode") ?? jsonValue(text, "mode");
  if (pipeline === RETIRED_PAGE_AUTHORITY_IMAGE2_V2_PIPELINE) {
    return retiredResult("state", pipeline, { path });
  }
  if (mode === RETIRED_PAGE_AUTHORITY_IMAGE2_V2_MODE) {
    return retiredResult("state", mode, { path });
  }
  const retired = retiredRecordToken(text);
  if (retired) return retiredResult("state", retired, { path });
  return pipeline || mode ? Object.freeze({ pipeline, mode }) : null;
}

function recordIdentity(record, kind, path) {
  const text = asText(record);
  if (text !== null) {
    const pipeline = jsonValue(text, "pipeline") ?? yamlValue(text, "pipeline");
    const mode = jsonValue(text, "mode") ?? yamlValue(text, "mode");
    const schema = jsonValue(text, "schema") ?? yamlValue(text, "schema");
    const adapter = jsonValue(text, "adapter") ?? yamlValue(text, "adapter");
    if (pipeline === RETIRED_PAGE_AUTHORITY_IMAGE2_V2_PIPELINE ||
      mode === RETIRED_PAGE_AUTHORITY_IMAGE2_V2_MODE ||
      schema?.startsWith("page-authority-") || schema?.startsWith("pptmaker-page-authority-") ||
      adapter === RETIRED_PAGE_AUTHORITY_IMAGE2_V2_PIPELINE ||
      retiredRecordToken(text)) {
      return retiredResult(kind, pipeline || mode || schema || adapter || "page-authority-record", { path });
    }
    return null;
  }
  const pipeline = fieldValue(record, "pipeline");
  const mode = fieldValue(record, "mode");
  const schema = fieldValue(record, "schema");
  const adapter = fieldValue(record, "adapter");
  if (pipeline === RETIRED_PAGE_AUTHORITY_IMAGE2_V2_PIPELINE ||
    mode === RETIRED_PAGE_AUTHORITY_IMAGE2_V2_MODE ||
    schema?.startsWith("page-authority-") || schema?.startsWith("pptmaker-page-authority-") ||
    adapter === RETIRED_PAGE_AUTHORITY_IMAGE2_V2_PIPELINE) {
    return retiredResult(kind, pipeline || mode || schema || adapter || "page-authority-record", { path });
  }
  try {
    const retired = retiredRecordToken(JSON.stringify(record));
    if (retired) return retiredResult(kind, retired, { path });
  } catch {
    // Owner shape validation reports non-serializable current input separately.
  }
  return null;
}

/**
 * Detect retired Page Authority identity without decoding it into a current
 * object. Callers pass raw source/state/record bytes before their owner parser
 * or artifact reader runs; object inputs are supported only for already-owned
 * in-memory current records.
 */
export function evaluateReplacementIdentity({
  sourceBytes = null,
  sourcePath = null,
  stateBytes = null,
  statePath = null,
  record = null,
  recordKind = "record",
  recordPath = null,
  records = [],
  sourcePipeline = null,
  productionMode = null,
} = {}) {
  const source = sourceIdentity(sourceBytes, sourcePath);
  if (source?.ok === false) return source;
  const state = stateIdentity(stateBytes, statePath);
  if (state?.ok === false) return state;

  const single = recordIdentity(record, recordKind, recordPath);
  if (single?.ok === false) return single;
  for (const entry of records) {
    const item = entry && typeof entry === "object" && !Buffer.isBuffer(entry) && !(entry instanceof Uint8Array) && Object.hasOwn(entry, "value")
      ? entry
      : { value: entry };
    const checked = recordIdentity(item.value, item.kind || "record", item.path || null);
    if (checked?.ok === false) return checked;
  }

  const effectivePipeline = sourcePipeline ?? source?.pipeline ?? state?.pipeline ?? null;
  const effectiveMode = productionMode ?? state?.mode ?? null;
  if (effectivePipeline === RETIRED_PAGE_AUTHORITY_IMAGE2_V2_PIPELINE) {
    return retiredResult("source", effectivePipeline, { path: sourcePath });
  }
  if (effectiveMode === RETIRED_PAGE_AUTHORITY_IMAGE2_V2_MODE) {
    return retiredResult("state", effectiveMode, { path: statePath });
  }
  if (effectivePipeline && effectivePipeline !== PAGE_IMAGE_WORKFLOW_V1_PIPELINE) {
    return invalidCurrentResult("source", effectivePipeline, PAGE_IMAGE_WORKFLOW_V1_PIPELINE, { path: sourcePath });
  }
  if (effectiveMode && effectiveMode !== PAGE_IMAGE_WORKFLOW_PRODUCTION_MODE) {
    return invalidCurrentResult("state", effectiveMode, PAGE_IMAGE_WORKFLOW_PRODUCTION_MODE, { path: statePath });
  }
  return Object.freeze({
    ok: true,
    pipeline: effectivePipeline || null,
    mode: effectiveMode || null,
  });
}

export function identityDiagnostic(identity) {
  if (identity?.ok !== false) return null;
  return Object.freeze({
    code: identity.code,
    action: identity.owner_action,
    byte_preserving: identity.byte_preserving === true,
    kind: identity.kind,
    ...(identity.actual ? { actual: identity.actual } : {}),
    ...(identity.path ? { path: identity.path } : {}),
  });
}
