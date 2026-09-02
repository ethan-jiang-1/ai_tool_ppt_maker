/**
 * Rebuildable Human Navigation Path projection for Page Image artifacts.
 *
 * The cross-owner adapter supplies only already-validated current artifact
 * facts. This module never reads lifecycle records, discovers currentness, or
 * resolves a display reference or navigation path back into a control selector.
  * Authority: openspec/specs/delivery/spec.md
 */
import { randomBytes } from "node:crypto";
import {
  constants as fsConstants,
  copyFileSync,
  lstatSync,
  mkdirSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";

import { pageImageWorkflowPaths } from "../run-bundle/page_image_paths.mjs";
import {
  PAGE_PRODUCTION_DISPLAY_REFERENCE_PREFIXES,
  createPageProductionDisplayReferenceIndex,
} from "../workflow/page_production_display_references.mjs";

const SLIDE_ID_RE = /^[A-Za-z][A-Za-z0-9_-]{0,127}$/;
const CANDIDATE_ID_RE = /^(?:local-existing|candidate-\d{3})$/;
const SAFE_TEXT_RE = /^[^\r\n`]{1,240}$/;
const SHA256_RE = /^[0-9a-f]{64}$/;
const FULL_SHA256_RE = /[0-9a-f]{64}/i;
const SAFE_EXTENSION_RE = /^\.[A-Za-z0-9]{1,10}$/;
const SHORT_COMPONENT_RE = /^[A-Za-z0-9._~-]{1,24}$/;

const DEFAULT_FILESYSTEM = Object.freeze({
  copyFileSync,
  lstatSync,
  mkdirSync,
  renameSync,
  rmSync,
  writeFileSync,
});

function invalid(message) {
  const error = new Error(message);
  error.code = "human_navigation_invalid";
  throw error;
}

function requirePlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid(`${label} must be an object`);
  return value;
}

function requireText(value, label) {
  if (typeof value !== "string" || !SAFE_TEXT_RE.test(value)) invalid(`${label} must be bounded single-line text`);
  if (FULL_SHA256_RE.test(value)) invalid(`${label} must not expose a full SHA-256`);
  return value;
}

function isDescendant(root, target) {
  const relation = relative(root, target);
  return relation && relation !== ".." && !relation.startsWith(`..${sep}`) && !isAbsolute(relation);
}

function requireDirectory(pathname, label) {
  let stats;
  try {
    stats = lstatSync(pathname);
  } catch {
    invalid(`${label} must be an available non-symbolic-link directory`);
  }
  if (!stats.isDirectory() || stats.isSymbolicLink()) invalid(`${label} must be an available non-symbolic-link directory`);
  return pathname;
}

function assertNoSymbolicLinkPath(root, target, label) {
  requireDirectory(root, label);
  if (!isDescendant(root, target)) invalid(`${label} must remain within its allowed root`);
  let current = root;
  for (const component of relative(root, target).split(sep)) {
    current = join(current, component);
    let stats;
    try {
      stats = lstatSync(current);
    } catch {
      invalid(`${label} must name an available regular file`);
    }
    if (stats.isSymbolicLink()) invalid(`${label} must not traverse a symbolic link`);
  }
}

function requireRunDir(value) {
  if (typeof value !== "string" || !value) invalid("human navigation run directory is invalid");
  const runDir = resolve(value);
  requireDirectory(runDir, "human navigation run directory");
  return runDir;
}

function requireLocator(runDir, locator) {
  if (typeof locator !== "string" || !isAbsolute(locator)) invalid("artifact locator must be an absolute path");
  const resolvedDeckDir = dirname(dirname(runDir));
  const resolvedLocator = resolve(locator);
  const lexicalRoot = isDescendant(runDir, resolvedLocator)
    ? runDir
    : isDescendant(resolvedDeckDir, resolvedLocator)
      ? resolvedDeckDir
      : null;
  if (!lexicalRoot) invalid("artifact locator must remain within the current run or deck root");
  assertNoSymbolicLinkPath(lexicalRoot, resolvedLocator, "artifact locator");

  let physicalRoot;
  let physicalLocator;
  try {
    physicalRoot = realpathSync(lexicalRoot);
    physicalLocator = realpathSync(resolvedLocator);
  } catch {
    invalid("artifact locator must name an available regular file");
  }
  if (!isDescendant(physicalRoot, physicalLocator)) {
    invalid("artifact locator must remain within the current run or deck root");
  }
  let stats;
  try {
    stats = lstatSync(resolvedLocator);
  } catch {
    invalid("artifact locator must name an available regular file");
  }
  if (!stats.isFile() || stats.isSymbolicLink()) invalid("artifact locator must name a confined regular file");
  return resolvedLocator;
}

function requireReference(value) {
  const reference = requirePlainObject(value, "artifact display reference");
  if (Object.keys(reference).sort().join("\n") !== "kind\nsha256") invalid("artifact display reference has an invalid shape");
  if (typeof reference.kind !== "string" || !Object.hasOwn(PAGE_PRODUCTION_DISPLAY_REFERENCE_PREFIXES, reference.kind)) {
    invalid("artifact display reference kind is invalid");
  }
  if (typeof reference.sha256 !== "string" || !SHA256_RE.test(reference.sha256)) {
    invalid("artifact display reference digest is invalid");
  }
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
  if (typeof checked.slide_id !== "string" || !SLIDE_ID_RE.test(checked.slide_id) || FULL_SHA256_RE.test(checked.slide_id)) {
    invalid("page slide ID is invalid");
  }
  if (!Array.isArray(checked.artifacts) || checked.artifacts.length === 0) invalid("page artifact group must contain an artifact");
  return Object.freeze({
    position: checked.position,
    slide_id: checked.slide_id,
    artifacts: Object.freeze(checked.artifacts.map((entry) => normalizeArtifact(runDir, entry))),
  });
}

function normalizeView(input) {
  const view = requirePlainObject(input, "human navigation input");
  if (Object.keys(view).sort().join("\n") !== "deck_artifacts\npage_artifacts\nrun_dir\nstyle_master\nunavailable\nworkflow") {
    invalid("human navigation input has an invalid shape");
  }
  const runDir = requireRunDir(view.run_dir);
  try {
    pageImageWorkflowPaths(runDir);
  } catch {
    invalid("human navigation run directory is not a Page Image version directory");
  }
  if (!['framed', 'pure'].includes(view.workflow)) invalid("human navigation workflow is invalid");
  for (const key of ["style_master", "page_artifacts", "deck_artifacts", "unavailable"]) {
    if (!Array.isArray(view[key])) invalid(`human navigation ${key} must be an array`);
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

function requireShortComponent(value, label) {
  if (typeof value !== "string" || !SHORT_COMPONENT_RE.test(value) || FULL_SHA256_RE.test(value)) {
    invalid(`${label} must be a 1-24 character safe ASCII component without a full SHA-256`);
  }
  return value;
}

function navigationExtension(locator) {
  const extension = extname(locator);
  if (!SAFE_EXTENSION_RE.test(extension)) invalid("artifact locator must have a safe short extension");
  return extension;
}

function flattenArtifacts(view) {
  return [
    ...view.style_master,
    ...view.page_artifacts.flatMap((page) => page.artifacts),
    ...view.deck_artifacts,
  ];
}

function createNavigationModel(view) {
  const artifacts = flattenArtifacts(view);
  let displayIndex;
  try {
    displayIndex = createPageProductionDisplayReferenceIndex(artifacts.map((entry) => entry.reference));
  } catch {
    invalid("human navigation display references are invalid");
  }
  const described = artifacts.map((entry) => Object.freeze({
    entry,
    display: displayIndex.describe(entry.reference.kind, entry.reference.sha256),
    extension: navigationExtension(entry.locator),
  }));
  const totals = new Map();
  for (const item of described) totals.set(item.display, (totals.get(item.display) || 0) + 1);
  const occurrences = new Map();
  const names = new Set();
  const records = described.map((item) => {
    const occurrence = (occurrences.get(item.display) || 0) + 1;
    occurrences.set(item.display, occurrence);
    const filename = `${item.display}${totals.get(item.display) > 1 ? `-${occurrence}` : ""}${item.extension}`;
    requireShortComponent(filename, "human navigation artifact filename");
    if (names.has(filename)) invalid("human navigation artifact filenames must be collision-safe");
    names.add(filename);
    return Object.freeze({
      entry: item.entry,
      display: item.display,
      filename,
      locator: `art/${filename}`,
    });
  });
  const recordByEntry = new Map(records.map((record) => [record.entry, record]));
  return Object.freeze({ view, records: Object.freeze(records), recordByEntry });
}

function renderArtifact(entry, record) {
  return `- \`${entry.label}\` [\`${record.display}\`]\n  - Type: ${entry.artifact_type}\n  - Purpose: ${entry.purpose}\n  - Locator: \`${record.locator}\``;
}

function renderNavigation(model) {
  const { view, recordByEntry } = model;
  const recordFor = (entry) => recordByEntry.get(entry) || invalid("human navigation record is missing");
  const lines = [
    "# Page Image Human Navigation",
    "",
    `Workflow: \`${view.workflow}\``,
    "",
    "All locators in this index are short relative paths inside this Human Navigation Path. They are derived read targets only: they do not select lifecycle records, authorize provider work, record a decision, or permit edits to generated artifacts.",
    "",
    "## Style Master",
    "",
    ...(view.style_master.length ? view.style_master.map((entry) => renderArtifact(entry, recordFor(entry))) : ["- unavailable"]),
    "",
    "## Page Artifacts",
    "",
  ];
  if (view.page_artifacts.length === 0) lines.push("- unavailable");
  for (const page of view.page_artifacts) {
    lines.push(`### \`${String(page.position).padStart(2, "0")}_${page.slide_id}\``);
    lines.push("");
    lines.push(...page.artifacts.map((entry) => renderArtifact(entry, recordFor(entry))));
    lines.push("");
  }
  lines.push("## Deck Artifacts", "");
  lines.push(...(view.deck_artifacts.length ? view.deck_artifacts.map((entry) => renderArtifact(entry, recordFor(entry))) : ["- unavailable"]));
  lines.push("", "## Unavailable", "");
  lines.push(...(view.unavailable.length ? view.unavailable.map((entry) => `- ${entry.category}: ${entry.reason}`) : ["- none"]));
  lines.push("");
  return lines.join("\n");
}

function optionalLstat(filesystem, pathname) {
  try {
    return filesystem.lstatSync(pathname);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    invalid("human navigation path cannot be inspected safely");
  }
}

function requireFilesystem(options) {
  if (options === undefined) return DEFAULT_FILESYSTEM;
  const checked = requirePlainObject(options, "human navigation writer options");
  if (Object.keys(checked).sort().join("\n") !== "filesystem") invalid("human navigation writer options are invalid");
  const overrides = requirePlainObject(checked.filesystem, "human navigation writer filesystem");
  const filesystem = { ...DEFAULT_FILESYSTEM, ...overrides };
  for (const name of Object.keys(DEFAULT_FILESYSTEM)) {
    if (typeof filesystem[name] !== "function") invalid("human navigation writer filesystem is invalid");
  }
  return filesystem;
}

function requireExistingDirectory(filesystem, pathname, label) {
  const stats = optionalLstat(filesystem, pathname);
  if (!stats || !stats.isDirectory() || stats.isSymbolicLink()) {
    invalid(`${label} must be a non-symbolic-link directory`);
  }
  return pathname;
}

function ensureChildDirectory(filesystem, parent, component, label) {
  requireShortComponent(component, `${label} component`);
  requireExistingDirectory(filesystem, parent, `${label} parent`);
  const pathname = join(parent, component);
  const existing = optionalLstat(filesystem, pathname);
  if (!existing) {
    try {
      filesystem.mkdirSync(pathname);
    } catch {
      invalid(`${label} cannot be created safely`);
    }
  }
  return requireExistingDirectory(filesystem, pathname, label);
}

function createStagingRoot(filesystem, generatedRoot) {
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const pathname = join(generatedRoot, `.nav-stage-${randomBytes(8).toString("hex")}`);
    try {
      filesystem.mkdirSync(pathname);
      return requireExistingDirectory(filesystem, pathname, "human navigation staging root");
    } catch (error) {
      if (error?.code === "EEXIST") continue;
      invalid("human navigation staging root cannot be created safely");
    }
  }
  invalid("human navigation staging root could not be allocated safely");
}

function temporarySibling(generatedRoot, label) {
  return join(generatedRoot, `.${label}-${randomBytes(8).toString("hex")}`);
}

function assertStagedNavigation(filesystem, stageRoot, stageArtifactsRoot, records) {
  requireExistingDirectory(filesystem, stageRoot, "human navigation staging root");
  requireExistingDirectory(filesystem, stageArtifactsRoot, "human navigation staging artifacts root");
  const index = join(stageRoot, "index.md");
  const indexStats = optionalLstat(filesystem, index);
  if (!indexStats || !indexStats.isFile() || indexStats.isSymbolicLink()) {
    invalid("human navigation index was not staged safely");
  }
  for (const record of records) {
    const copied = optionalLstat(filesystem, join(stageArtifactsRoot, record.filename));
    if (!copied || !copied.isFile() || copied.isSymbolicLink()) {
      invalid("human navigation artifact copy was not staged safely");
    }
  }
}

function restorePreviousNavigation(filesystem, previousRoot, navigationRoot) {
  if (!previousRoot) return true;
  if (optionalLstat(filesystem, navigationRoot)) return false;
  try {
    filesystem.renameSync(previousRoot, navigationRoot);
    return true;
  } catch {
    return false;
  }
}

function publishNavigation(filesystem, { stageRoot, generatedRoot, navigationRoot }) {
  let previousRoot = null;
  const existing = optionalLstat(filesystem, navigationRoot);
  if (existing) requireExistingDirectory(filesystem, navigationRoot, "existing human navigation root");
  try {
    if (existing) {
      previousRoot = temporarySibling(generatedRoot, "nav-previous");
      filesystem.renameSync(navigationRoot, previousRoot);
    }
    filesystem.renameSync(stageRoot, navigationRoot);
  } catch {
    const restored = restorePreviousNavigation(filesystem, previousRoot, navigationRoot);
    if (!restored) invalid("human navigation replacement failed before the prior tree could be restored");
    invalid("human navigation replacement failed and the prior tree was preserved");
  }
  requireExistingDirectory(filesystem, navigationRoot, "published human navigation root");
  if (previousRoot) {
    try {
      filesystem.rmSync(previousRoot, { recursive: true, force: true });
    } catch {
      // Publication is complete. A stale private sibling cannot become a navigation input.
    }
  }
}

/** Render a short, physical Human Navigation Path index from owner-validated facts. */
export function renderHumanArtifactNavigation(input) {
  return renderNavigation(createNavigationModel(normalizeView(input)));
}

/**
 * Materialize a complete short Human Navigation Path tree with regular copies
 * and replace the prior derived tree only after staging succeeds.
 */
export function writeHumanArtifactNavigation(input, options) {
  const view = normalizeView(input);
  const model = createNavigationModel(view);
  const filesystem = requireFilesystem(options);
  const paths = pageImageWorkflowPaths(view.run_dir);
  const generatedRoot = ensureChildDirectory(
    filesystem,
    view.run_dir,
    basename(paths.generated_root),
    "human navigation generated root",
  );
  const navigationRoot = paths.human_navigation_root;
  const navigationIndex = paths.human_navigation_index;
  const navigationArtifactsRoot = paths.human_navigation_artifacts_root;
  if (dirname(navigationRoot) !== generatedRoot || dirname(navigationIndex) !== navigationRoot || dirname(navigationArtifactsRoot) !== navigationRoot) {
    invalid("human navigation path layout is invalid");
  }
  requireShortComponent(basename(navigationRoot), "human navigation root");
  requireShortComponent(basename(navigationIndex), "human navigation index");
  requireShortComponent(basename(navigationArtifactsRoot), "human navigation artifacts root");
  const existing = optionalLstat(filesystem, navigationRoot);
  if (existing) requireExistingDirectory(filesystem, navigationRoot, "existing human navigation root");

  let stageRoot = createStagingRoot(filesystem, generatedRoot);
  try {
    const stageArtifactsRoot = ensureChildDirectory(
      filesystem,
      stageRoot,
      basename(navigationArtifactsRoot),
      "human navigation staging artifacts root",
    );
    for (const record of model.records) {
      const destination = join(stageArtifactsRoot, record.filename);
      try {
        filesystem.copyFileSync(record.entry.locator, destination, fsConstants.COPYFILE_EXCL);
      } catch {
        invalid("human navigation artifact copy failed before publication");
      }
    }
    try {
      filesystem.writeFileSync(join(stageRoot, basename(navigationIndex)), `${renderNavigation(model)}\n`, "utf8", { mode: 0o644 });
    } catch {
      invalid("human navigation index could not be staged safely");
    }
    assertStagedNavigation(filesystem, stageRoot, stageArtifactsRoot, model.records);
    publishNavigation(filesystem, { stageRoot, generatedRoot, navigationRoot });
    stageRoot = null;
  } finally {
    if (stageRoot) {
      try {
        filesystem.rmSync(stageRoot, { recursive: true, force: true });
      } catch {
        // A failed staging cleanup never changes canonical owners or the prior tree.
      }
    }
  }

  return Object.freeze({
    path: navigationIndex,
    root: navigationRoot,
    run_dir: view.run_dir,
    workflow: view.workflow,
  });
}
