/**
 * Rebuildable, human-facing Page Image artifact view.
 *
 * The cross-owner adapter supplies only already-validated artifact facts. This
 * renderer never reads lifecycle records, discovers currentness, or resolves a
 * display reference back into a control selector.
 */
import { randomBytes } from "node:crypto";
import { lstatSync, mkdirSync, realpathSync, renameSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

import { pageImageWorkflowPaths } from "../run-bundle/page_image_paths.mjs";
import { createPageProductionDisplayReferenceIndex } from "../workflow/page_production_display_references.mjs";

const SLIDE_ID_RE = /^[A-Za-z][A-Za-z0-9_-]{0,127}$/;
const CANDIDATE_ID_RE = /^(?:local-existing|candidate-\d{3})$/;
const SAFE_TEXT_RE = /^[^\r\n`]{1,240}$/;

function invalid(message) {
  const error = new Error(message);
  error.code = "human_artifact_reference_invalid";
  throw error;
}

function requirePlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid(`${label} must be an object`);
  return value;
}

function requireText(value, label) {
  if (typeof value !== "string" || !SAFE_TEXT_RE.test(value)) invalid(`${label} must be bounded single-line text`);
  return value;
}

function requireLocator(runDir, locator) {
  if (typeof locator !== "string" || !isAbsolute(locator)) invalid("artifact locator must be an absolute path");
  const resolvedRunDir = resolve(runDir);
  const resolvedDeckDir = dirname(dirname(resolvedRunDir));
  const resolvedLocator = resolve(locator);
  let physicalRunDir;
  let physicalDeckDir;
  let physicalLocator;
  try {
    physicalRunDir = realpathSync(resolvedRunDir);
    physicalDeckDir = realpathSync(resolvedDeckDir);
    physicalLocator = realpathSync(resolvedLocator);
  } catch {
    invalid("artifact locator must name an available regular file");
  }
  const inScope = (root) => {
    const relation = relative(root, physicalLocator);
    return relation && relation !== ".." && !relation.startsWith(`..${sep}`) && !isAbsolute(relation);
  };
  if (!inScope(physicalRunDir) && !inScope(physicalDeckDir)) {
    invalid("artifact locator must remain within the current run or deck root");
  }
  let stat;
  try {
    stat = lstatSync(resolvedLocator);
  } catch {
    invalid("artifact locator must name an available regular file");
  }
  if (!stat.isFile() || stat.isSymbolicLink()) invalid("artifact locator must name a confined regular file");
  return resolvedLocator;
}

function requireReference(value) {
  const reference = requirePlainObject(value, "artifact display reference");
  if (Object.keys(reference).sort().join("\n") !== "kind\nsha256") invalid("artifact display reference has an invalid shape");
  return Object.freeze({ kind: reference.kind, sha256: reference.sha256 });
}

function normalizeArtifact(runDir, entry) {
  const artifact = requirePlainObject(entry, "artifact entry");
  if (Object.keys(artifact).sort().join("\n") !== "artifact_type\nlabel\nlocator\npurpose\nreference") {
    invalid("artifact entry has an invalid shape");
  }
  return Object.freeze({
    label: requireText(artifact.label, "artifact label"),
    artifact_type: requireText(artifact.artifact_type, "artifact type"),
    purpose: requireText(artifact.purpose, "artifact purpose"),
    locator: requireLocator(runDir, artifact.locator),
    reference: requireReference(artifact.reference),
  });
}

function normalizeUnavailable(value) {
  const entry = requirePlainObject(value, "unavailable artifact");
  if (Object.keys(entry).sort().join("\n") !== "category\nreason") invalid("unavailable artifact has an invalid shape");
  return Object.freeze({
    category: requireText(entry.category, "unavailable category"),
    reason: requireText(entry.reason, "unavailable reason"),
  });
}

function normalizePage(runDir, page) {
  const checked = requirePlainObject(page, "page artifact group");
  if (Object.keys(checked).sort().join("\n") !== "artifacts\nposition\nslide_id") invalid("page artifact group has an invalid shape");
  if (!Number.isInteger(checked.position) || checked.position < 1) invalid("page position must be positive");
  if (typeof checked.slide_id !== "string" || !SLIDE_ID_RE.test(checked.slide_id)) invalid("page slide ID is invalid");
  if (!Array.isArray(checked.artifacts) || checked.artifacts.length === 0) invalid("page artifact group must contain an artifact");
  return Object.freeze({
    position: checked.position,
    slide_id: checked.slide_id,
    artifacts: Object.freeze(checked.artifacts.map((entry) => normalizeArtifact(runDir, entry))),
  });
}

function normalizeView(input) {
  const view = requirePlainObject(input, "human artifact reference input");
  if (Object.keys(view).sort().join("\n") !== "deck_artifacts\npage_artifacts\nrun_dir\nstyle_master\nunavailable\nworkflow") {
    invalid("human artifact reference input has an invalid shape");
  }
  const runDir = resolve(view.run_dir || "");
  if (!["framed", "pure"].includes(view.workflow)) invalid("human artifact reference workflow is invalid");
  for (const key of ["style_master", "page_artifacts", "deck_artifacts", "unavailable"]) {
    if (!Array.isArray(view[key])) invalid(`human artifact reference ${key} must be an array`);
  }
  const styleMaster = view.style_master.map((entry) => normalizeArtifact(runDir, entry));
  for (const entry of styleMaster) if (!CANDIDATE_ID_RE.test(entry.label)) invalid("Style Master label must be a stable candidate ID");
  const pages = view.page_artifacts.map((entry) => normalizePage(runDir, entry));
  const expected = [...pages].sort((left, right) => left.position - right.position || left.slide_id.localeCompare(right.slide_id));
  if (expected.some((page, index) => page !== pages[index]) || new Set(pages.map((page) => page.slide_id)).size !== pages.length) {
    invalid("page artifact groups must be uniquely ordered by current position and stable slide ID");
  }
  return Object.freeze({
    run_dir: runDir,
    workflow: view.workflow,
    style_master: Object.freeze(styleMaster),
    page_artifacts: Object.freeze(pages),
    deck_artifacts: Object.freeze(view.deck_artifacts.map((entry) => normalizeArtifact(runDir, entry))),
    unavailable: Object.freeze(view.unavailable.map(normalizeUnavailable)),
  });
}

function renderArtifact(entry, displayIndex) {
  const display = displayIndex.describe(entry.reference.kind, entry.reference.sha256);
  return `- \`${entry.label}\` [\`${display}\`]\n  - Type: ${entry.artifact_type}\n  - Purpose: ${entry.purpose}\n  - Locator: \`${entry.locator}\``;
}

/** Render owner-validated facts without looking at a prior view or lifecycle storage. */
export function renderHumanArtifactReference(input) {
  const view = normalizeView(input);
  const artifacts = [
    ...view.style_master,
    ...view.page_artifacts.flatMap((page) => page.artifacts),
    ...view.deck_artifacts,
  ];
  const displayIndex = createPageProductionDisplayReferenceIndex(artifacts.map((entry) => entry.reference));
  const lines = [
    "# Page Image Human Artifact Reference",
    "",
    `Run: \`${view.run_dir}\``,
    `Workflow: \`${view.workflow}\``,
    "",
    "This is a rebuildable inspection view. Its locators are read targets only: they do not select lifecycle records, authorize provider work, record a decision, or permit edits to generated artifacts.",
    "",
    "## Style Master",
    "",
    ...(view.style_master.length ? view.style_master.map((entry) => renderArtifact(entry, displayIndex)) : ["- unavailable"]),
    "",
    "## Page Artifacts",
    "",
  ];
  if (view.page_artifacts.length === 0) lines.push("- unavailable");
  for (const page of view.page_artifacts) {
    lines.push(`### \`${String(page.position).padStart(2, "0")}_${page.slide_id}\``);
    lines.push("");
    lines.push(...page.artifacts.map((entry) => renderArtifact(entry, displayIndex)));
    lines.push("");
  }
  lines.push("## Deck Artifacts", "");
  lines.push(...(view.deck_artifacts.length ? view.deck_artifacts.map((entry) => renderArtifact(entry, displayIndex)) : ["- unavailable"]));
  lines.push("", "## Unavailable", "");
  lines.push(...(view.unavailable.length ? view.unavailable.map((entry) => `- ${entry.category}: ${entry.reason}`) : ["- none"]));
  lines.push("");
  return lines.join("\n");
}

/** Atomically replace only the canonical derived view. */
export function writeHumanArtifactReference(input) {
  const view = normalizeView(input);
  const paths = pageImageWorkflowPaths(view.run_dir);
  const target = paths.human_artifact_reference;
  mkdirSync(paths.reference_root, { recursive: true });
  const root = lstatSync(paths.reference_root);
  if (!root.isDirectory() || root.isSymbolicLink() || dirname(target) !== paths.reference_root) {
    invalid("human artifact reference path must remain a direct canonical derived leaf");
  }
  const temporary = `${target}.tmp-${process.pid}-${randomBytes(8).toString("hex")}`;
  writeFileSync(temporary, `${renderHumanArtifactReference(view)}\n`, "utf8", { mode: 0o644 });
  renameSync(temporary, target);
  return Object.freeze({ path: target, run_dir: view.run_dir, workflow: view.workflow });
}
