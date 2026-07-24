import { isMap, isScalar, parseDocument } from "yaml";

export const HTML_FIRST_PIPELINE = "html-first-v1";
export const WHOLE_PAGE_IMAGE2_PIPELINE = "whole-page-image2-v1";
export const SUPPORTED_PRODUCTION_PIPELINES = Object.freeze([
  HTML_FIRST_PIPELINE,
  WHOLE_PAGE_IMAGE2_PIPELINE,
]);

const SUPPORTED_PIPELINES_TEXT = SUPPORTED_PRODUCTION_PIPELINES.join(" | ");

function markerIssuesWithSupportedPipelines(issues) {
  return issues.map((issue) => ({
    ...issue,
    message: `${issue.message}; supported production.pipeline values: ${SUPPORTED_PIPELINES_TEXT}`,
    expected: issue.expected ?? SUPPORTED_PIPELINES_TEXT,
  }));
}

function markerIssue(code, message, { source, line = 1, actual, expected } = {}) {
  return {
    severity: "ERROR",
    code,
    message,
    source: { path: source || "slide-specifications.md", line, column: 1 },
    ...(actual !== undefined ? { actual } : {}),
    ...(expected !== undefined ? { expected } : {}),
  };
}

function parseLeadingFrontmatter(sourceText, source) {
  const text = String(sourceText ?? "");
  const bom = text.startsWith("\uFEFF") ? "\uFEFF" : "";
  const body = text.slice(bom.length);
  if (!body.startsWith("---\n") && !body.startsWith("---\r\n")) {
    return { present: false, metadata: {}, document: null, issues: [], raw: "" };
  }
  const newline = body.startsWith("---\r\n") ? "\r\n" : "\n";
  const close = body.indexOf(`${newline}---${newline}`, 3 + newline.length);
  const terminalClose = body.endsWith(`${newline}---`) ? body.length - (newline.length + 3) : -1;
  const closing = close >= 0 ? close + newline.length : terminalClose;
  if (closing < 0) {
    return {
      present: true,
      metadata: {},
      document: null,
      raw: "",
      issues: [markerIssue("unclosed_frontmatter", "leading YAML frontmatter is not closed", { source })],
    };
  }
  const contentStart = 3 + newline.length;
  const content = body.slice(contentStart, closing);
  const document = parseDocument(content, {
    version: "1.2",
    schema: "core",
    uniqueKeys: true,
    merge: false,
    keepSourceTokens: true,
  });
  const issues = [...document.errors, ...document.warnings].map((problem) =>
    markerIssue("invalid_frontmatter_yaml", problem.message.split("\n")[0], { source, line: 2 })
  );
  let metadata = {};
  if (issues.length === 0) {
    metadata = document.toJS({ mapAsMap: false }) ?? {};
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
      issues.push(markerIssue("invalid_frontmatter_root", "frontmatter root must be a mapping", { source }));
      metadata = {};
    }
  }
  return {
    present: true,
    metadata,
    document,
    issues,
    raw: body.slice(0, closing + 3 + (close >= 0 ? newline.length : 0)),
  };
}

function directProductionNodeIssues(frontmatter, source) {
  const issues = [];
  if (!frontmatter.document || frontmatter.issues.length > 0) return issues;
  const root = frontmatter.document.contents;
  if (!isMap(root)) return issues;
  const pairs = root.items.filter((pair) => isScalar(pair.key) && pair.key.value === "production");
  if (pairs.length !== 1) {
    if (Object.hasOwn(frontmatter.metadata || {}, "production")) {
      issues.push(markerIssue("invalid_production_marker", "production must be one direct string-keyed mapping", { source, expected: SUPPORTED_PIPELINES_TEXT }));
    }
    return issues;
  }
  if (pairs[0].key.anchor || pairs[0].key.tag) {
    issues.push(markerIssue("invalid_production_key", "production must use a direct untagged string key", { source, expected: SUPPORTED_PIPELINES_TEXT }));
  }
  const production = pairs[0].value;
  if (!isMap(production) || production.anchor || production.tag) {
    issues.push(markerIssue("invalid_production_marker", "production must be a direct mapping", { source, expected: SUPPORTED_PIPELINES_TEXT }));
    return issues;
  }
  for (const pair of production.items) {
    if (!isScalar(pair.key) || typeof pair.key.value !== "string" || pair.key.anchor || pair.key.tag) {
      issues.push(markerIssue("invalid_production_key", "production keys must be direct strings", { source, expected: SUPPORTED_PIPELINES_TEXT }));
    } else if (pair.key.value !== "pipeline") {
      issues.push(markerIssue("unknown_production_key", `unknown production key ${JSON.stringify(pair.key.value)}`, { source, expected: SUPPORTED_PIPELINES_TEXT }));
    }
  }
  const pipelinePairs = production.items.filter((pair) => isScalar(pair.key) && pair.key.value === "pipeline");
  if (
    pipelinePairs.length !== 1
    || !isScalar(pipelinePairs[0].value)
    || typeof pipelinePairs[0].value.value !== "string"
    || pipelinePairs[0].value.anchor
    || pipelinePairs[0].value.tag
  ) {
    issues.push(markerIssue("invalid_pipeline_marker", `production.pipeline must be one direct string scalar with value ${SUPPORTED_PIPELINES_TEXT}`, { source, expected: SUPPORTED_PIPELINES_TEXT }));
  }
  return issues;
}

export function probeProductionMarker(sourceBytes, { source = "slide-specifications.md" } = {}) {
  const text = Buffer.isBuffer(sourceBytes) ? sourceBytes.toString("utf8") : String(sourceBytes ?? "");
  const frontmatter = parseLeadingFrontmatter(text, source);
  if (frontmatter.issues.length > 0) {
    return { branch: "invalid", issues: markerIssuesWithSupportedPipelines(frontmatter.issues) };
  }
  const directIssues = directProductionNodeIssues(frontmatter, source);
  if (directIssues.length > 0) {
    return { branch: "invalid", issues: markerIssuesWithSupportedPipelines(directIssues) };
  }
  if (!Object.hasOwn(frontmatter.metadata, "production")) {
    return {
      branch: "invalid",
      issues: [markerIssue("missing_production_marker", `production.pipeline must explicitly select ${SUPPORTED_PIPELINES_TEXT}`, { source, expected: SUPPORTED_PIPELINES_TEXT })],
    };
  }
  const production = frontmatter.metadata.production;
  if (!production || typeof production !== "object" || Array.isArray(production)) {
    return { branch: "invalid", issues: [markerIssue("invalid_production_marker", `production must be a direct mapping with pipeline ${SUPPORTED_PIPELINES_TEXT}`, { source, expected: SUPPORTED_PIPELINES_TEXT })] };
  }
  if (!SUPPORTED_PRODUCTION_PIPELINES.includes(production.pipeline)) {
    return {
      branch: "invalid",
      issues: [markerIssue("unsupported_pipeline_marker", `production.pipeline must equal ${SUPPORTED_PIPELINES_TEXT}`, {
        source,
        actual: production.pipeline,
        expected: SUPPORTED_PIPELINES_TEXT,
      })],
    };
  }
  return { branch: production.pipeline, issues: [], frontmatter };
}
