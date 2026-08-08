import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, posix, relative, resolve } from "node:path";
import { EXECUTABLE_INVENTORY, normalizeExecutablePath } from "./executable_inventory.mjs";
import {
  LEGACY_TOKEN_EXCEPTIONS,
  scanRetiredWholePageTerms,
  validateLegacyTokenExceptions,
  validateRetiredWholePageTokenExceptions,
} from "./harness_static_coherence.mjs";

export const ACTIVE_PHASES = Object.freeze([
  "00-setup",
  "01-content",
  "02-visual-system",
]);

export const TARGET_WORKFLOW_INTERFACES = Object.freeze([
  "03-framed-image/index.mjs",
  "04-pure-image/index.mjs",
]);

export const TARGET_DELIVERY_INTERFACES = Object.freeze([
  "05-delivery/index.mjs",
]);

export const TARGET_ITERATION_INTERFACES = Object.freeze([
  "06-iteration/index.mjs",
]);

export const PHASE_ADJACENCY = Object.freeze({
  "00-setup": Object.freeze([]),
  "01-content": Object.freeze([]),
  "02-visual-system": Object.freeze([]),
});

export const PUBLIC_SHARED_INTERFACES = Object.freeze([
  "shared/cli/cli_bootstrap.mjs",
  "shared/cli/cli_error.mjs",
  "shared/run-bundle/bundle_layout.mjs",
  "shared/run-bundle/page_image_paths.mjs",
  "shared/run-bundle/page_image_workflow_identity.mjs",
  "shared/run-bundle/production_marker.mjs",
  "shared/state/state.mjs",
  "shared/state/md_controller_reader.mjs",
  "shared/identity/canonical_json.mjs",
  "shared/identity/byte_hash.mjs",
  "shared/page-image/page_image_core.mjs",
  "shared/page-image/page_image_invalidation.mjs",
  "shared/image2/credentials.mjs",
  "shared/image2/page_image_artifacts.mjs",
  "shared/image2/page_image_complete_page_review.mjs",
  "shared/image2/page_image_final_manifest.mjs",
  "shared/image2/page_image_media_contract.mjs",
  "shared/image2/page_image_raw_mechanics.mjs",
  "shared/image2/page_image_progressive_raw_owner.mjs",
  "shared/image2/page_image_target_runtime.mjs",
  "shared/image2/style_master_plan.mjs",
  "shared/image2/style_master_scope.mjs",
  "shared/state/target_authoring_draft_route.mjs",
  "shared/workflow/inspect_workflow.mjs",
  "shared/workflow/page_production_task_projection.mjs",
  "shared/workflow/progressive_controller_task_projection_eligibility.mjs",
]);

export const PAGE_IMAGE_CORE_INTERFACE = "shared/page-image/page_image_core.mjs";

export const PAGE_IMAGE_CORE_SEAM_CONSUMERS = Object.freeze([
  "01-content/internal/page_image_source.mjs",
  "03-framed-image/index.mjs",
  "04-pure-image/index.mjs",
]);

// Provider-input syntax is policy-specific. The common Core supplies facts;
// only the selected adapters turn those facts into provider bytes.
export const PAGE_IMAGE_PROVIDER_INPUT_COMPILER_ADAPTERS = Object.freeze([
  "03-framed-image/index.mjs",
  "04-pure-image/index.mjs",
]);

export const PAGE_IMAGE_PROVIDER_INPUT_COMPILER_SCHEMA_BY_ADAPTER = Object.freeze({
  "03-framed-image/index.mjs": "page-image-framed-provider-input-v1",
  "04-pure-image/index.mjs": "page-image-pure-provider-input-v1",
});

export const SHARED_WORKFLOW_SEMANTIC_HELPERS = Object.freeze([
  "shared/image2/page_image_raw_mechanics.mjs",
  "shared/image2/page_image_final_manifest.mjs",
  "shared/image2/page_image_target_runtime.mjs",
]);

export const CROSS_OWNER_PROCESS_ADAPTERS = Object.freeze([
  "ppt_flow.mjs",
  "00-setup/env-check.mjs",
]);

const ROOT_WHITELIST = new Set([
  "README.md", "ppt_flow.mjs", "00-setup", "01-content", "03-framed-image", "04-pure-image", "05-delivery",
  "02-visual-system", "06-iteration", "shared", "contracts", "fonts", "fixtures",
]);
const FORBIDDEN_GENERIC_ROOTS = new Set(["lib", "internal", "utils", "helpers", "common"]);
const TARGET_WORKFLOW_ADAPTERS = Object.freeze(["03-framed-image", "04-pure-image"]);
const TARGET_METHOD_MODULES = Object.freeze([
  ...TARGET_WORKFLOW_ADAPTERS,
  "05-delivery",
  "06-iteration",
]);
const SHARED_PUBLIC_PHASE_INTERFACE_IMPORTS = new Map();
const DIRECT_ENTRY_EXCEPTIONS = new Set([
  "shared/cli/cli_bootstrap.mjs",
  "shared/cli/cli_error.mjs",
]);
const REQUIRED_MANIFEST_INTERFACES = Object.freeze([
  ...ACTIVE_PHASES.map((phase) => `${phase}/index.mjs`),
  ...TARGET_WORKFLOW_INTERFACES,
  ...TARGET_DELIVERY_INTERFACES,
  ...TARGET_ITERATION_INTERFACES,
  ...PUBLIC_SHARED_INTERFACES,
  "contracts/canonical_json.mjs",
  "contracts/executable_inventory.mjs",
  "contracts/harness_architecture.mjs",
  "contracts/harness_document_command_audit.mjs",
  "contracts/harness_static_coherence.mjs",
  "contracts/retirement_ledger_audit.mjs",
]);

function normalized(value) {
  return String(value).replaceAll("\\", "/").replace(/^\.\//, "").replace(/\/+/g, "/");
}

function phaseOf(path) {
  const first = normalized(path).split("/")[0];
  return ACTIVE_PHASES.includes(first) ? first : null;
}

function targetWorkflowAdapterOf(path) {
  const first = normalized(path).split("/")[0];
  return TARGET_WORKFLOW_ADAPTERS.includes(first) ? first : null;
}

function targetMethodModuleOf(path) {
  const first = normalized(path).split("/")[0];
  return TARGET_METHOD_MODULES.includes(first) ? first : null;
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
  const fromTargetWorkflowAdapter = targetWorkflowAdapterOf(importer);
  const toTargetWorkflowAdapter = targetWorkflowAdapterOf(target);
  const fromTargetMethodModule = targetMethodModuleOf(importer);
  const toTargetMethodModule = targetMethodModuleOf(target);
  if (importer === "ppt_flow.mjs") {
    if (toPhase && target !== `${toPhase}/index.mjs`) addIssue(issues, "root-private-import", importer, `root imports private Phase path ${target}`);
    if (target.startsWith("shared/") && !PUBLIC_SHARED_INTERFACES.includes(target)) addIssue(issues, "root-private-shared-import", importer, `root imports private shared path ${target}`);
    return;
  }
  if (importer.startsWith("shared/")) {
    const allowedPhaseInterfaces = SHARED_PUBLIC_PHASE_INTERFACE_IMPORTS.get(importer);
    if (toPhase && !allowedPhaseInterfaces?.has(target)) addIssue(issues, "shared-phase-import", importer, `shared imports Phase path ${target}`);
    if (target.startsWith("shared/") && !PUBLIC_SHARED_INTERFACES.includes(target) && phaseOf(target) !== fromPhase) {
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
  if (fromTargetWorkflowAdapter && toTargetWorkflowAdapter && fromTargetWorkflowAdapter !== toTargetWorkflowAdapter) {
    addIssue(issues, "sibling-workflow-import", importer, `${fromTargetWorkflowAdapter} may not import ${toTargetWorkflowAdapter}`);
  }
  if (fromTargetMethodModule && target.startsWith("shared/") && !PUBLIC_SHARED_INTERFACES.includes(target)) {
    addIssue(issues, "target-private-shared-import", importer, `target method module imports private shared path ${target}`);
  }
  if (fromTargetMethodModule === "06-iteration" && toTargetMethodModule && fromTargetMethodModule !== toTargetMethodModule && target !== `${toTargetMethodModule}/index.mjs`) {
    addIssue(issues, "iteration-private-sibling-import", importer, `06-iteration may import only the public index of ${toTargetMethodModule}`);
  }
  if (fromPhase && target.startsWith("shared/") && !PUBLIC_SHARED_INTERFACES.includes(target)) {
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

function validateSharedWorkflowSemanticBoundaries(files, issues) {
  const workflowReference = "(?:workflow|ownerWorkflow|(?:manifest|provenance|receipt)\\.workflow)";
  const semanticBranch = new RegExp(
    `(?:${workflowReference})\\s*(?:===|!==|==|!=)\\s*["'](?:framed|pure)["']|` +
    `(?:case\\s*["'](?:framed|pure)["']|switch\\s*\\(\\s*${workflowReference}\\s*\\))`,
  );
  for (const path of [...SHARED_WORKFLOW_SEMANTIC_HELPERS, ...TARGET_DELIVERY_INTERFACES]) {
    const source = files.get(path);
    if (source && semanticBranch.test(source)) {
      addIssue(issues, "shared-workflow-semantic-branch", path, "shared raw/final helpers may not branch on Framed or Pure semantics");
    }
  }
}

function validateSingleDeliveryOwner(files, issues) {
  const deliveryWriter = /\bPptxGenJS\b|\binjectNotes\s*\(|\bassemblePageImagePptx\s*\(|\binjectPageImageNotes\s*\(/;
  for (const [path, source] of files) {
    if (!/^(?:03-framed-image|04-pure-image|06-iteration)\//.test(path) || !deliveryWriter.test(source)) continue;
    addIssue(issues, "second-delivery-owner", path, "workflow code may not own PPTX, notes, or delivery writing");
  }
}

const RETIRED_PROTOCOL_PATH = `compatibility/${["current", "v1"].join("-")}-page-image`;
const RETIRED_PROTOCOL_IMPORT_SEGMENT = /(?:^|\/)(?:page_authority(?:_|$)|page-authority(?:_|-|$))/i;
const retiredDispatchToken = (...parts) => parts.join("");
const RETIRED_PROTOCOL_DISPATCH_IDENTIFIERS = Object.freeze([
  retiredDispatchToken("parsePage", "AuthoritySource"),
  retiredDispatchToken("createPage", "AuthoritySourceResolver"),
  retiredDispatchToken("page", "AuthorityImage2Paths"),
  retiredDispatchToken("Page", "Authority"),
]);

function validatePageImageCoreSeam(files, issues) {
  if (!files.has(PAGE_IMAGE_CORE_INTERFACE)) {
    addIssue(issues, "missing-page-image-core", PAGE_IMAGE_CORE_INTERFACE, "the shared Page Image Core interface is missing");
    return;
  }
  const coreConsumers = new Set();
  for (const [importer, source] of files) {
    const importsCore = collectLiteralImports(source)
      .map((specifier) => resolveLocalImport(importer, specifier))
      .includes(PAGE_IMAGE_CORE_INTERFACE);
    if (!importsCore) continue;
    if (!PAGE_IMAGE_CORE_SEAM_CONSUMERS.includes(importer)) {
      addIssue(issues, "page-image-core-illegal-consumer", importer, "only the source parser and selected workflow adapters may consume the Page Image Core seam");
      continue;
    }
    coreConsumers.add(importer);
  }
  for (const adapter of TARGET_WORKFLOW_INTERFACES) {
    if (!coreConsumers.has(adapter)) {
      addIssue(issues, "page-image-core-adapter-missing", adapter, "each selected workflow adapter must compile through the one shared Page Image Core seam");
    }
  }
}

function hasProviderInputSchemaDeclaration(source, schema) {
  return new RegExp(`\\bschema\\s*:\\s*["']${schema}["']`).test(source);
}

function validatePageImageProviderInputCompilation(files, issues) {
  const compilerEntries = Object.entries(PAGE_IMAGE_PROVIDER_INPUT_COMPILER_SCHEMA_BY_ADAPTER);
  for (const [adapter, schema] of compilerEntries) {
    const source = files.get(adapter);
    if (!source || !hasProviderInputSchemaDeclaration(source, schema)) {
      addIssue(issues, "page-image-provider-input-compiler-missing", adapter, "each selected workflow adapter must own its Page Image provider-input compiler");
    }
  }
  for (const [path, source] of files) {
    if (path.startsWith("tests/") || path.startsWith("tests_e2e/")) continue;
    for (const [adapter, schema] of compilerEntries) {
      if (path !== adapter && hasProviderInputSchemaDeclaration(source, schema)) {
        addIssue(issues, "page-image-provider-input-illegal-compiler", path, `only ${adapter} may declare ${schema}`);
      }
    }
  }

  const rootSource = files.get("ppt_flow.mjs");
  const semanticFields = ["provider_rendered_content", "context_not_to_render", "protected_geometry"];
  const foundSemanticField = semanticFields.find((field) => new RegExp(`\\b${field}\\b`).test(rootSource || ""));
  if (foundSemanticField) {
    addIssue(issues, "root-page-image-prompt-assembly", "ppt_flow.mjs", `ppt_flow may not assemble Page Image prompt semantics (${foundSemanticField})`);
  }
}

function validateRetiredProtocolAbsence(files, issues) {
  for (const [path, source] of files) {
    if (path.startsWith("tests/") || path.startsWith("tests_e2e/")) continue;
    if (normalized(path).includes(RETIRED_PROTOCOL_PATH)) {
      addIssue(issues, "retired-protocol-owner", path, "retired protocol paths may not exist in active roots");
    }
    const retiredImport = collectLiteralImports(source).find((specifier) => RETIRED_PROTOCOL_IMPORT_SEGMENT.test(specifier));
    if (retiredImport) {
      addIssue(issues, "retired-protocol-import", path, `active source imports retired protocol implementation ${retiredImport}`);
    }
    const retiredDispatch = RETIRED_PROTOCOL_DISPATCH_IDENTIFIERS.find((identifier) =>
      new RegExp(`\\b${identifier}\\b`).test(String(source)));
    if (retiredDispatch) {
      addIssue(issues, "retired-protocol-dispatch", path, `active source dispatches retired protocol identifier ${retiredDispatch}`);
    }
  }
}

export function validateArchitectureSnapshot({ files: inputFiles, manifest = null, requireCompleteManifest = true }) {
  const files = new Map(Object.entries(inputFiles instanceof Map ? Object.fromEntries(inputFiles) : inputFiles).map(([path, value]) => [normalized(path), String(value)]));
  const issues = [];
  validatePageImageCoreSeam(files, issues);
  validatePageImageProviderInputCompilation(files, issues);
  validateSharedWorkflowSemanticBoundaries(files, issues);
  validateSingleDeliveryOwner(files, issues);
  validateRetiredProtocolAbsence(files, issues);
  for (const legacyIssue of validateLegacyTokenExceptions(LEGACY_TOKEN_EXCEPTIONS)) addIssue(issues, legacyIssue.rule, legacyIssue.file, legacyIssue.message);
  for (const retiredIssue of validateRetiredWholePageTokenExceptions()) addIssue(issues, retiredIssue.rule, retiredIssue.file, retiredIssue.message);
  const scriptFiles = new Map([...files].filter(([path]) => !path.startsWith("tests/") && !path.startsWith("tests_e2e/")));
  const rootEntries = new Set([...scriptFiles].map(([path]) => path.split("/")[0]));
  for (const entry of rootEntries) if (!ROOT_WHITELIST.has(entry)) addIssue(issues, "root-whitelist", entry, "unexpected scripts-root entry");
  for (const name of FORBIDDEN_GENERIC_ROOTS) if (rootEntries.has(name)) addIssue(issues, "generic-root", name, "forbidden generic scripts root");
  if ([...scriptFiles].some(([path]) => path === "lib" || path.startsWith("lib/"))) addIssue(issues, "legacy-lib", "lib", "scripts/lib is forbidden");
  for (const phase of ACTIVE_PHASES) if (!scriptFiles.has(`${phase}/index.mjs`)) addIssue(issues, "missing-phase-interface", `${phase}/index.mjs`, "active Phase interface is missing");
  for (const path of TARGET_WORKFLOW_INTERFACES) if (!scriptFiles.has(path)) addIssue(issues, "missing-workflow-interface", path, "target workflow interface is missing");
  for (const path of TARGET_DELIVERY_INTERFACES) if (!scriptFiles.has(path)) addIssue(issues, "missing-delivery-interface", path, "target delivery interface is missing");
  for (const path of TARGET_ITERATION_INTERFACES) if (!scriptFiles.has(path)) addIssue(issues, "missing-iteration-interface", path, "target iteration interface is missing");
  for (const path of scriptFiles.keys()) {
    if (/^(?:04-image-production|05-iteration)\//.test(path)) addIssue(issues, "retired-numbered-owner", path, "retired numbered ownership path is forbidden");
  }
  for (const path of scriptFiles.keys()) if (/^(?:asset_manifest|bundle_layout|env-check|generate_style_master|image_api_client|lessons|make_contact_sheet|stage[1-5]_|unified_pipeline|visual_config)\.mjs$/.test(path)) addIssue(issues, "old-flat-path", path, "old flat business path is forbidden");
  for (const [importer, source] of scriptFiles) {
    for (const specifier of collectLiteralImports(source)) validateImportEdge(scriptFiles, importer, resolveLocalImport(importer, specifier), issues);
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
  const scriptsRoot = resolve(repoRoot, "ppt_maker_harness/scripts");
  const files = walk(scriptsRoot);
  for (const testRoot of ["tests", "tests_e2e"]) {
    const absolute = resolve(repoRoot, testRoot);
    for (const [path, source] of Object.entries(walk(absolute))) files[`${testRoot}/${path}`] = source;
  }
  const manifest = JSON.parse(files["tests/contracts/source-test-ownership-v1.json"] || readFileSync(resolve(repoRoot, "tests/contracts/source-test-ownership-v1.json"), "utf8"));
  const result = validateArchitectureSnapshot({ files, manifest });
  const activeSurfaceFiles = {};
  for (const [path, source] of Object.entries(files)) {
    const activePath = path.startsWith("tests/") || path.startsWith("tests_e2e/")
      ? path
      : `ppt_maker_harness/scripts/${path}`;
    activeSurfaceFiles[activePath] = source;
  }
  const retiredIssues = scanRetiredWholePageTerms(activeSurfaceFiles)
    .map((entry) => ({ code: entry.rule, path: entry.file, message: entry.message }));
  return Object.freeze({ ...result, ok: result.ok && retiredIssues.length === 0, issues: [...result.issues, ...retiredIssues] });
}
