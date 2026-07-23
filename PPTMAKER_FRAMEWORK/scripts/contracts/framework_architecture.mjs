import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, posix, relative, resolve } from "node:path";
import { EXECUTABLE_INVENTORY, normalizeExecutablePath } from "./executable_inventory.mjs";
import { LEGACY_TOKEN_EXCEPTIONS, validateLegacyTokenExceptions } from "./framework_static_coherence.mjs";

export const ACTIVE_PHASES = Object.freeze([
  "00-setup",
  "01-content",
  "02-visual-system",
  "03-html-production",
  "04-image-production",
  "05-iteration",
]);

export const PHASE_ADJACENCY = Object.freeze({
  "00-setup": Object.freeze([]),
  "01-content": Object.freeze([]),
  "02-visual-system": Object.freeze([]),
  "03-html-production": Object.freeze(["00-setup", "01-content", "02-visual-system"]),
  "04-image-production": Object.freeze(["01-content", "02-visual-system", "03-html-production"]),
  "05-iteration": Object.freeze(["01-content", "02-visual-system", "03-html-production", "04-image-production"]),
});

export const PUBLIC_SHARED_INTERFACES = Object.freeze([
  "shared/cli/cli_bootstrap.mjs",
  "shared/cli/cli_error.mjs",
  "shared/run-bundle/bundle_layout.mjs",
  "shared/run-bundle/production_marker.mjs",
  "shared/state/state.mjs",
  "shared/state/md_controller_reader.mjs",
  "shared/state/html_review_evidence.mjs",
  "shared/identity/canonical_json.mjs",
  "shared/identity/byte_hash.mjs",
  "shared/identity/notes_receipt.mjs",
  "shared/identity/render_artifacts.mjs",
  "shared/image2/credentials.mjs",
  "shared/workflow/inspect_workflow.mjs",
]);

export const CROSS_OWNER_PROCESS_ADAPTERS = Object.freeze([
  "ppt_flow.mjs",
  "00-setup/env-check.mjs",
  "03-html-production/unified_pipeline.mjs",
  "03-html-production/stage1_build_inputs.mjs",
  "03-html-production/stage4_build_pptx.mjs",
]);

const ROOT_WHITELIST = new Set([
  "README.md", "ppt_flow.mjs", "00-setup", "01-content",
  "02-visual-system", "03-html-production", "04-image-production",
  "05-iteration", "shared", "contracts", "fonts", "fixtures",
]);
const FORBIDDEN_GENERIC_ROOTS = new Set(["lib", "internal", "utils", "helpers", "common"]);
const SHARED_CORE = "shared/state/internal/html_review_evidence_core.mjs";
const SHARED_CORE_IMPORTERS = new Set([
  "shared/run-bundle/bundle_layout.mjs",
  "shared/state/html_review_evidence.mjs",
]);
const DIRECT_ENTRY_EXCEPTIONS = new Set([
  "shared/cli/cli_bootstrap.mjs",
  "shared/cli/cli_error.mjs",
]);
const REQUIRED_MANIFEST_INTERFACES = Object.freeze([
  ...ACTIVE_PHASES.map((phase) => `${phase}/index.mjs`),
  ...PUBLIC_SHARED_INTERFACES,
  "contracts/canonical_json.mjs",
  "contracts/executable_inventory.mjs",
  "contracts/framework_architecture.mjs",
  "contracts/framework_static_coherence.mjs",
  "contracts/html_source_ast.mjs",
  "contracts/html_review_projection.mjs",
]);

function normalized(value) {
  return String(value).replaceAll("\\", "/").replace(/^\.\//, "").replace(/\/+/g, "/");
}

function phaseOf(path) {
  const first = normalized(path).split("/")[0];
  return ACTIVE_PHASES.includes(first) ? first : null;
}

function imageProductionAdapterOf(path) {
  const match = normalized(path).match(/^04-image-production\/(whole-page|visual-slot)\//);
  return match?.[1] || null;
}

function addIssue(issues, code, path, message) {
  issues.push({ code, path: normalized(path), message });
}

export function collectLiteralImports(source) {
  const edges = [];
  const patterns = [
    /(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g,
    /import\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) edges.push(match[1].split("?")[0]);
  }
  return [...new Set(edges)];
}

function resolveLocalImport(importer, specifier) {
  if (!specifier.startsWith(".")) return null;
  return normalized(posix.normalize(posix.join(posix.dirname(importer), specifier)));
}

export function hasDirectEntryIndicator(source) {
  return /^#!/.test(source) ||
    /cli_bootstrap\.mjs\?entry=/.test(source) ||
    /installStandaloneFailureEnvelope\s*\(/.test(source) ||
    /\.parse(?:Async)?\s*\(\s*process\.argv/.test(source) ||
    /process\.argv\[1\].*import\.meta\.url|import\.meta\.url.*process\.argv\[1\]/s.test(source);
}

function validateImportEdge(files, importer, target, issues) {
  if (!target || !files.has(target)) return;
  const fromPhase = phaseOf(importer);
  const toPhase = phaseOf(target);
  const fromImageProductionAdapter = imageProductionAdapterOf(importer);
  const toImageProductionAdapter = imageProductionAdapterOf(target);
  if (importer === "ppt_flow.mjs") {
    if (toPhase && target !== `${toPhase}/index.mjs`) addIssue(issues, "root-private-import", importer, `root imports private Phase path ${target}`);
    if (target.startsWith("shared/") && !PUBLIC_SHARED_INTERFACES.includes(target)) addIssue(issues, "root-private-shared-import", importer, `root imports private shared path ${target}`);
    return;
  }
  if (importer.startsWith("shared/")) {
    if (toPhase) addIssue(issues, "shared-phase-import", importer, `shared imports Phase path ${target}`);
    if (target === SHARED_CORE && !SHARED_CORE_IMPORTERS.has(importer)) addIssue(issues, "review-core-importer", importer, `only exact review-core collaborators may import ${target}`);
    if (target.startsWith("shared/") && target !== SHARED_CORE && !PUBLIC_SHARED_INTERFACES.includes(target) && phaseOf(target) !== fromPhase) {
      const fromCategory = importer.split("/")[1];
      const toCategory = target.split("/")[1];
      if (fromCategory !== toCategory) addIssue(issues, "shared-private-cross-category", importer, `cross-category shared import targets private path ${target}`);
    }
    return;
  }
  if (importer.startsWith("contracts/")) {
    if (toPhase || target.startsWith("shared/")) addIssue(issues, "contract-back-edge", importer, `contract imports production path ${target}`);
    return;
  }
  if (fromPhase && toPhase && fromPhase !== toPhase) {
    const processAdapterPublicEdge = CROSS_OWNER_PROCESS_ADAPTERS.includes(importer) && target === `${toPhase}/index.mjs`;
    if (!processAdapterPublicEdge && !PHASE_ADJACENCY[fromPhase].includes(toPhase)) addIssue(issues, "phase-adjacency", importer, `${fromPhase} may not import ${toPhase}`);
    if (target !== `${toPhase}/index.mjs`) addIssue(issues, "foreign-phase-private-import", importer, `foreign Phase import must target ${toPhase}/index.mjs`);
  }
  if (fromImageProductionAdapter && toImageProductionAdapter && fromImageProductionAdapter !== toImageProductionAdapter && /\/internal\//.test(target)) {
    addIssue(issues, "cross-adapter-private-import", importer, `${fromImageProductionAdapter} imports private ${toImageProductionAdapter} path ${target}`);
  }
  if (fromPhase && target.startsWith("shared/") && target !== SHARED_CORE && !PUBLIC_SHARED_INTERFACES.includes(target)) {
    addIssue(issues, "phase-private-shared-import", importer, `Phase imports private shared path ${target}`);
  }
  if (fromPhase && importer.endsWith("/index.mjs") && target !== "shared/run-bundle/bundle_layout.mjs" && EXECUTABLE_INVENTORY.includes(target)) {
    addIssue(issues, "interface-cli-import", importer, `Phase interface imports direct executable ${target}`);
  }
}

function validateManifest(files, manifest, issues, { requireCompleteManifest }) {
  if (!manifest || manifest.schema !== "pptmaker-source-test-ownership-v1" || !Array.isArray(manifest.owners)) {
    addIssue(issues, "ownership-schema", "tests/contracts/source-test-ownership-v1.json", "invalid ownership manifest schema");
    return;
  }
  const seenInterfaces = new Map();
  const seenExecutables = new Map();
  const seenTests = new Map();
  const owners = manifest.owners.map((entry) => entry.owner);
  if (owners.join("\n") !== [...owners].sort().join("\n")) addIssue(issues, "ownership-order", "tests/contracts/source-test-ownership-v1.json", "owners must be sorted");
  for (const entry of manifest.owners) {
    const unitPrefix = `tests/${entry.owner}/`;
    const e2ePrefix = `tests_e2e/${entry.owner}/`;
    for (const field of ["interfaces", "executables", "unit_integration", "e2e"]) {
      if (!Array.isArray(entry[field])) { addIssue(issues, "ownership-field", entry.owner || "unknown", `${field} must be an array`); continue; }
      if (entry[field].join("\n") !== [...entry[field]].sort().join("\n")) addIssue(issues, "ownership-order", entry.owner || "unknown", `${field} must be sorted`);
    }
    for (const path of entry.interfaces || []) {
      if (seenInterfaces.has(path)) addIssue(issues, "duplicate-interface-owner", path, `owned by ${seenInterfaces.get(path)} and ${entry.owner}`);
      seenInterfaces.set(path, entry.owner);
    }
    for (const path of entry.executables || []) {
      if (seenExecutables.has(path)) addIssue(issues, "duplicate-executable-owner", path, `owned by ${seenExecutables.get(path)} and ${entry.owner}`);
      seenExecutables.set(path, entry.owner);
    }
    for (const path of [...(entry.unit_integration || []), ...(entry.e2e || [])]) {
      if (seenTests.has(path)) addIssue(issues, "duplicate-test-owner", path, `owned by ${seenTests.get(path)} and ${entry.owner}`);
      seenTests.set(path, entry.owner);
      if (!files.has(path)) addIssue(issues, "missing-owned-test", path, `owned test does not exist for ${entry.owner}`);
    }
    for (const path of entry.unit_integration || []) if (!path.startsWith(unitPrefix)) addIssue(issues, "test-owner-directory", path, `unit/integration owner ${entry.owner} requires ${unitPrefix}`);
    for (const path of entry.e2e || []) if (!path.startsWith(e2ePrefix)) addIssue(issues, "test-owner-directory", path, `E2E owner ${entry.owner} requires ${e2ePrefix}`);
  }
  if (requireCompleteManifest) {
    for (const path of REQUIRED_MANIFEST_INTERFACES) if (!seenInterfaces.has(path)) addIssue(issues, "missing-interface-owner", path, "required interface has no owner");
    const actual = [...seenExecutables.keys()].sort();
    const expected = [...EXECUTABLE_INVENTORY].sort();
    if (actual.join("\n") !== expected.join("\n")) addIssue(issues, "executable-owner-union", "tests/contracts/source-test-ownership-v1.json", `manifest executable union [${actual.join(", ")}] differs from canonical registry [${expected.join(", ")}]`);
    for (const path of files.keys()) {
      if (/^tests\/.*\/test[_-].*\.mjs$/.test(path) && !seenTests.has(path)) addIssue(issues, "unowned-test", path, "recursive unit/integration suite has no manifest owner");
      if (/^tests_e2e\/.*\/test[_-].*\.mjs$/.test(path) && !seenTests.has(path)) addIssue(issues, "unowned-test", path, "recursive E2E suite has no manifest owner");
    }
  }
}

export function validateArchitectureSnapshot({ files: inputFiles, manifest = null, requireCompleteManifest = true }) {
  const files = new Map(Object.entries(inputFiles instanceof Map ? Object.fromEntries(inputFiles) : inputFiles).map(([path, value]) => [normalized(path), String(value)]));
  const issues = [];
  for (const legacyIssue of validateLegacyTokenExceptions(LEGACY_TOKEN_EXCEPTIONS)) addIssue(issues, legacyIssue.rule, legacyIssue.file, legacyIssue.message);
  const scriptFiles = new Map([...files].filter(([path]) => !path.startsWith("tests/") && !path.startsWith("tests_e2e/")));
  const rootEntries = new Set([...scriptFiles].map(([path]) => path.split("/")[0]));
  for (const entry of rootEntries) if (!ROOT_WHITELIST.has(entry)) addIssue(issues, "root-whitelist", entry, "unexpected scripts-root entry");
  for (const name of FORBIDDEN_GENERIC_ROOTS) if (rootEntries.has(name)) addIssue(issues, "generic-root", name, "forbidden generic scripts root");
  if ([...scriptFiles].some(([path]) => path === "lib" || path.startsWith("lib/"))) addIssue(issues, "legacy-lib", "lib", "scripts/lib is forbidden");
  for (const phase of ACTIVE_PHASES) if (!scriptFiles.has(`${phase}/index.mjs`)) addIssue(issues, "missing-phase-interface", `${phase}/index.mjs`, "active Phase interface is missing");
  for (const path of scriptFiles.keys()) {
    if (path.startsWith("04-image-production/") && path.endsWith(".mjs") && !path.startsWith("04-image-production/whole-page/") && !path.startsWith("04-image-production/visual-slot/") && path !== "04-image-production/index.mjs") {
      addIssue(issues, "phase4-public-surface", path, "Image Production exposes only its family and adapter interfaces");
    }
  }
  for (const path of scriptFiles.keys()) if (/^(?:asset_manifest|bundle_layout|env-check|generate_style_master|image_api_client|lessons|make_contact_sheet|stage[1-5]_|unified_pipeline|visual_config)\.mjs$/.test(path)) addIssue(issues, "old-flat-path", path, "old flat business path is forbidden");
  for (const [importer, source] of scriptFiles) {
    for (const specifier of collectLiteralImports(source)) validateImportEdge(scriptFiles, importer, resolveLocalImport(importer, specifier), issues);
    if (importer.startsWith("03-html-production/") && /04-image-production\/(?:whole-page|visual-slot)\/internal/.test(source)) addIssue(issues, "html-image-production-edge", importer, "HTML Phase 3 must not import private Image Production transport");
  }
  const detected = [...scriptFiles].filter(([path, source]) => path.endsWith(".mjs") && !DIRECT_ENTRY_EXCEPTIONS.has(path) && hasDirectEntryIndicator(source)).map(([path]) => path).sort();
  const expected = [...EXECUTABLE_INVENTORY].sort();
  if (detected.join("\n") !== expected.join("\n")) addIssue(issues, "executable-inventory", "contracts/executable_inventory.mjs", `detected [${detected.join(", ")}] but registered [${expected.join(", ")}]`);
  for (const path of files.keys()) {
    if (/^tests(?:_e2e)?\/[^/]+\.mjs$/.test(path)) addIssue(issues, "flat-test", path, "business test files must live under an owner directory");
    if (/^(?:tests|tests_e2e)\/(?:deck_|dpt_)/.test(path)) addIssue(issues, "production-data-fixture", path, "tests may not use deck/dpt production data as fixtures");
  }
  validateManifest(files, manifest, issues, { requireCompleteManifest });
  return { ok: issues.length === 0, issues, detectedExecutables: detected };
}

function walk(root, current = root, output = {}) {
  for (const name of readdirSync(current)) {
    const path = join(current, name);
    if (statSync(path).isDirectory()) walk(root, path, output);
    else output[normalized(relative(root, path))] = readFileSync(path, "utf8");
  }
  return output;
}

/** Public diagnostic seam used by ownership/CI checks; it is read-only and
 * recursively discovers nested Phase/test owners. */
export function discoverRecursiveFiles(root) {
  return walk(resolve(root));
}

export function validateSourceTestOwnership(repoRoot = process.cwd()) {
  const result = validateRepositoryArchitecture(repoRoot);
  return Object.freeze({ ok: result.ok, issues: result.issues.filter((issue) => ["ownership-schema", "ownership-order", "missing-owned-test", "unowned-test", "test-owner-directory", "duplicate-test-owner", "missing-interface-owner", "executable-owner-union"].includes(issue.code)) });
}

export function validateRepositoryArchitecture(repoRoot = process.cwd()) {
  const scriptsRoot = resolve(repoRoot, "PPTMAKER_FRAMEWORK/scripts");
  const files = walk(scriptsRoot);
  for (const testRoot of ["tests", "tests_e2e"]) {
    const absolute = resolve(repoRoot, testRoot);
    for (const [path, source] of Object.entries(walk(absolute))) files[`${testRoot}/${path}`] = source;
  }
  const manifest = JSON.parse(files["tests/contracts/source-test-ownership-v1.json"] || readFileSync(resolve(repoRoot, "tests/contracts/source-test-ownership-v1.json"), "utf8"));
  return validateArchitectureSnapshot({ files, manifest });
}
