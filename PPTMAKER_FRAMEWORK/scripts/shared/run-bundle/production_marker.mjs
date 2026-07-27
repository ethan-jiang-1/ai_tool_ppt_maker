import { isMap, isScalar, parseDocument } from "yaml";

/** The only source marker accepted by current production code. */
export const PAGE_AUTHORITY_IMAGE2_PIPELINE = "page-authority-image2-v1";
export const SUPPORTED_PRODUCTION_PIPELINES = Object.freeze([PAGE_AUTHORITY_IMAGE2_PIPELINE]);

function issue(code, message, { source, line = 1, actual, expected } = {}) {
  return {
    severity: "ERROR",
    code,
    message,
    source: { path: source || "slide-specifications.md", line, column: 1 },
    ...(actual !== undefined ? { actual } : {}),
    ...(expected !== undefined ? { expected } : {}),
  };
}

function invalid(source, code, message, options = {}) {
  return { branch: "invalid", issues: [issue(code, message, { source, expected: PAGE_AUTHORITY_IMAGE2_PIPELINE, ...options })] };
}

/**
 * Read the direct Page Authority frontmatter. Historical marker parsing lives
 * exclusively in the observer module so it cannot be reused as current input.
 */
export function probeProductionMarker(sourceBytes, { source = "slide-specifications.md" } = {}) {
  const text = Buffer.isBuffer(sourceBytes) ? sourceBytes.toString("utf8") : String(sourceBytes ?? "");
  const body = text.startsWith("\uFEFF") ? text.slice(1) : text;
  if (!body.startsWith("---\n") && !body.startsWith("---\r\n")) {
    return invalid(source, "missing_production_marker", "production.pipeline must explicitly select page-authority-image2-v1");
  }
  const newline = body.startsWith("---\r\n") ? "\r\n" : "\n";
  const close = body.indexOf(`${newline}---${newline}`, 3 + newline.length);
  const terminalClose = body.endsWith(`${newline}---`) ? body.length - (newline.length + 3) : -1;
  const closing = close >= 0 ? close + newline.length : terminalClose;
  if (closing < 0) return invalid(source, "unclosed_frontmatter", "leading YAML frontmatter is not closed");
  const document = parseDocument(body.slice(3 + newline.length, closing), {
    version: "1.2", schema: "core", uniqueKeys: true, merge: false, keepSourceTokens: true,
  });
  if (document.errors.length || document.warnings.length || !isMap(document.contents)) {
    return invalid(source, "invalid_frontmatter_yaml", "frontmatter must be one direct YAML mapping");
  }
  const pairs = new Map();
  for (const pair of document.contents.items) {
    if (!isScalar(pair.key) || typeof pair.key.value !== "string" || pair.key.anchor || pair.key.tag || pairs.has(pair.key.value)) {
      return invalid(source, "invalid_frontmatter_key", "frontmatter keys must be unique direct strings");
    }
    pairs.set(pair.key.value, pair.value);
  }
  const production = pairs.get("production");
  if (!isMap(production) || production.anchor || production.tag) {
    return invalid(source, "invalid_production_marker", "production must be one direct mapping");
  }
  const values = new Map();
  for (const pair of production.items) {
    if (!isScalar(pair.key) || typeof pair.key.value !== "string" || pair.key.anchor || pair.key.tag || values.has(pair.key.value)) {
      return invalid(source, "invalid_production_key", "production keys must be unique direct strings");
    }
    values.set(pair.key.value, pair.value);
  }
  if ([...values.keys()].some((key) => !["pipeline", "page_authority_default"].includes(key))) {
    return invalid(source, "unknown_production_key", "production contains a retired or unsupported key");
  }
  const pipeline = values.get("pipeline");
  const authority = values.get("page_authority_default");
  if (!isScalar(pipeline) || typeof pipeline.value !== "string" || pipeline.value !== PAGE_AUTHORITY_IMAGE2_PIPELINE) {
    return invalid(source, "unsupported_pipeline_marker", "production.pipeline must equal page-authority-image2-v1", { actual: pipeline?.value });
  }
  if (!isScalar(authority) || typeof authority.value !== "string" || !["pure-image2", "framed-image2"].includes(authority.value)) {
    return invalid(source, "invalid_page_authority_default", "production.page_authority_default must equal pure-image2 | framed-image2", { actual: authority?.value, expected: "pure-image2 | framed-image2" });
  }
  return {
    branch: PAGE_AUTHORITY_IMAGE2_PIPELINE,
    issues: [],
    frontmatter: {
      metadata: {
        production: { pipeline: pipeline.value, page_authority_default: authority.value },
      },
    },
  };
}
