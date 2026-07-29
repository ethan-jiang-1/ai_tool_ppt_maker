import { isMap, isScalar, parseDocument } from "yaml";

/** The exact v2 Page Authority marker is the only current protocol. */
export const PAGE_AUTHORITY_IMAGE2_V2_PIPELINE = "page-authority-image2-v2";
export const SUPPORTED_PRODUCTION_PIPELINES = Object.freeze([
  PAGE_AUTHORITY_IMAGE2_V2_PIPELINE,
]);
export const TARGET_WORKFLOWS = Object.freeze(["framed", "pure"]);
export const TARGET_WORKFLOW_SELECTION_REQUIRED_MESSAGE =
  "target workflow selection required: record production.workflow as framed or pure before provider work";

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
  return { branch: "invalid", issues: [issue(code, message, { source, ...options })] };
}

/** A v2 authoring draft is intentionally not a production-ready marker. */
export function isTargetWorkflowSelectionPending(marker) {
  return Boolean(marker?.branch === "invalid" && marker?.target_workflow_selection_required === true);
}

/**
 * Read a direct Page Authority frontmatter marker. Historical marker parsing
 * remains exclusively in the observer module so it cannot become production
 * input through this seam.
 */
export function probeProductionMarker(sourceBytes, { source = "slide-specifications.md" } = {}) {
  const text = Buffer.isBuffer(sourceBytes) ? sourceBytes.toString("utf8") : String(sourceBytes ?? "");
  const body = text.startsWith("\uFEFF") ? text.slice(1) : text;
  if (!body.startsWith("---\n") && !body.startsWith("---\r\n")) {
    return invalid(source, "missing_production_marker", "production.pipeline must explicitly select a supported Page Authority protocol", {
      expected: SUPPORTED_PRODUCTION_PIPELINES.join(" | "),
    });
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
  const pipeline = values.get("pipeline");
  if (!isScalar(pipeline) || typeof pipeline.value !== "string" || !SUPPORTED_PRODUCTION_PIPELINES.includes(pipeline.value)) {
    return invalid(source, "unsupported_pipeline_marker", "production.pipeline must select a supported Page Authority protocol", {
      actual: pipeline?.value,
      expected: SUPPORTED_PRODUCTION_PIPELINES.join(" | "),
    });
  }
  const expectedKeys = ["pipeline", "workflow"];
  if ([...values.keys()].some((key) => !expectedKeys.includes(key)) || values.size !== expectedKeys.length) {
    const result = invalid(source, "invalid_production_protocol_shape", `${pipeline.value} requires exactly ${expectedKeys.join(", ")}`, {
      expected: expectedKeys.join(", "),
    });
    if (values.size === 1 && values.has("pipeline")) {
      result.target_workflow_selection_required = true;
    }
    return result;
  }
  const workflow = values.get("workflow");
  if (!isScalar(workflow) || typeof workflow.value !== "string" || !TARGET_WORKFLOWS.includes(workflow.value)) {
    return invalid(source, "invalid_target_workflow", "production.workflow must equal framed | pure", {
      actual: workflow?.value,
      expected: TARGET_WORKFLOWS.join(" | "),
    });
  }
  return {
    branch: PAGE_AUTHORITY_IMAGE2_V2_PIPELINE,
    issues: [],
    frontmatter: { metadata: { production: { pipeline: pipeline.value, workflow: workflow.value } } },
  };
}
