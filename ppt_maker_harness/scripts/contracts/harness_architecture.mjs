import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, posix, relative, resolve } from "node:path";
import { EXECUTABLE_INVENTORY, normalizeExecutablePath } from "./executable_inventory.mjs";

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

// The sole cross-owner writer for derived short physical artifact navigation.
// It consumes owner-issued facts and cannot select or mutate lifecycle state.
export const HUMAN_NAVIGATION_INTERFACE = "shared/image2/page_image_human_artifact_reference.mjs";
export const PAGE_DERIVED_DATA_INTERFACE = "shared/image2/page_derived_data.mjs";

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
  "shared/run-bundle/production_marker.mjs",
  "shared/state/state.mjs",
  "shared/state/md_controller_reader.mjs",
  "shared/identity/canonical_json.mjs",
  "shared/identity/byte_hash.mjs",
  "shared/page-image/page_image_core.mjs",
  "shared/page-image/page_image_invalidation.mjs",
  "shared/image2/credentials.mjs",
  "shared/image2/content_address_store.mjs",
  "shared/image2/page_image_artifacts.mjs",
  "shared/image2/page_image_complete_page_review.mjs",
  PAGE_DERIVED_DATA_INTERFACE,
  "shared/image2/page_image_final_manifest.mjs",
  HUMAN_NAVIGATION_INTERFACE,
  "shared/image2/page_image_media_contract.mjs",
  "shared/image2/page_image_raw_mechanics.mjs",
  "shared/image2/page_image_progressive_raw_owner.mjs",
  "shared/image2/page_image_target_runtime.mjs",
  "shared/image2/png_raster_projection.mjs",
  "shared/image2/style_master_plan.mjs",
  "shared/image2/style_master_scope.mjs",
  "shared/state/target_authoring_draft_route.mjs",
  "shared/workflow/inspect_workflow.mjs",
  "shared/workflow/page_production_display_references.mjs",
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
  "03-framed-image/index.mjs": "page-image-framed-provider-input",
  "04-pure-image/index.mjs": "page-image-pure-provider-input",
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

const VERSION_SUFFIX = /-v[1-9][0-9]*\b/;
const CONTRACT_VALUE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

/**
 * Evaluate a parsed serialization-contract snapshot without reading files or
 * importing YAML. Repository scans construct this snapshot separately.
 */
export function evaluateProductionSchemaConformance(snapshot = {}) {
  const issues = [];
  for (const key of ["stage_names", "anchors", "selectors", "wire_schemas", "shared_contracts", "contract_fields", "literal_occurrences"]) {
    if (!Array.isArray(snapshot[key])) issues.push({ code: "contract-snapshot-incomplete", path: key, message: `${key} must be an array` });
  }
  const stageNames = new Set(snapshot.stage_names || []);
  const anchors = new Set(snapshot.anchors || []);
  const selectors = Array.isArray(snapshot.selectors) ? snapshot.selectors : [];
  const wireSchemas = Array.isArray(snapshot.wire_schemas) ? snapshot.wire_schemas : [];
  const sharedContracts = Array.isArray(snapshot.shared_contracts) ? snapshot.shared_contracts : [];
  const fieldAssignments = Array.isArray(snapshot.contract_fields) ? snapshot.contract_fields : [];
  const literals = Array.isArray(snapshot.literal_occurrences) ? snapshot.literal_occurrences : [];
  const declaredValues = new Set();

  const declare = (entry, type) => {
    const value = entry?.value;
    if (typeof value !== "string" || !CONTRACT_VALUE.test(value) || VERSION_SUFFIX.test(value)) {
      issues.push({ code: "contract-declaration-invalid", path: entry?.location || type, message: `${type} must declare an unversioned kebab-case value` });
      return;
    }
    declaredValues.add(value);
  };

  for (const entry of selectors) declare(entry, "selector");
  for (const entry of wireSchemas) {
    declare(entry, "wire schema");
    if (!stageNames.has(entry?.stage_ref) || typeof entry?.role !== "string" || !entry.role.trim()) {
      issues.push({ code: "wire-stage-role-invalid", path: entry?.location || "wire schema", message: `${entry?.value || "wire schema"} must reference one declared stage and role` });
    }
  }
  for (const entry of sharedContracts) {
    declare(entry, "shared contract");
    if (typeof entry?.name !== "string" || !entry.name || typeof entry?.field !== "string" || !entry.field) {
      issues.push({ code: "shared-contract-incomplete", path: entry?.location || "shared contract", message: "shared contract requires name, value, and owning field" });
    }
    for (const anchor of entry?.anchors || []) {
      if (!anchors.has(anchor)) issues.push({ code: "contract-anchor-missing", path: entry?.location || entry?.name || "shared contract", message: `missing declared anchor ${anchor}` });
    }
  }
  for (const assignment of fieldAssignments) {
    if (!declaredValues.has(assignment?.value)) {
      issues.push({ code: "contract-field-undeclared", path: assignment?.location || assignment?.field || "contract field", message: `${assignment?.value || "missing value"} is not declared` });
    }
  }
  for (const literal of literals) {
    if (VERSION_SUFFIX.test(String(literal?.value || ""))) {
      issues.push({ code: "version-suffixed-production-literal", path: literal?.location || "literal", message: `${literal.value} has a prohibited version suffix` });
    }
  }
  return Object.freeze({ ok: issues.length === 0, issues: Object.freeze(issues) });
}

const C6_SUBJECT_RESTRICTIONS = new Set(["none", "no-generic-metal-robot", "no-identity-subject"]);
const C6_RECTANGLE_KEYS = Object.freeze(["x", "y", "width", "height"]);
const C6_REQUEST_FORBIDDEN_FIELDS = new Set(["local_header", "header_policy", "context_not_to_render", "protected_geometry"]);
const C6_PURE_FORBIDDEN_FIELDS = new Set([
  "header_region",
  "protected_composition",
  "protected_composition_sha256",
  "local_header",
  "context_not_to_render",
  "protected_geometry",
]);

function c6PlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function c6ExactKeys(value, keys) {
  return c6PlainObject(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function c6Rectangle(value) {
  return c6ExactKeys(value, C6_RECTANGLE_KEYS) &&
    C6_RECTANGLE_KEYS.every((key) => Number.isFinite(value[key])) &&
    value.x >= 0 && value.y >= 0 && value.width > 0 && value.height > 0 &&
    value.x + value.width <= 1 && value.y + value.height <= 1;
}

function c6ContainsField(value, forbidden) {
  if (Array.isArray(value)) return value.some((entry) => c6ContainsField(entry, forbidden));
  if (!c6PlainObject(value)) return false;
  return Object.entries(value).some(([key, entry]) => forbidden.has(key) || c6ContainsField(entry, forbidden));
}

function c6ContainsPureFramedField(value) {
  if (Array.isArray(value)) return value.some((entry) => c6ContainsPureFramedField(entry));
  if (!c6PlainObject(value)) return false;
  return Object.entries(value).some(([key, entry]) => {
    if (key === "protected_composition_sha256") return entry !== null;
    return C6_PURE_FORBIDDEN_FIELDS.has(key) || c6ContainsPureFramedField(entry);
  });
}

function c6Same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

/**
 * Evaluate synthetic C6 composition facts without loading YAML, a Run Bundle,
 * provider configuration, or lifecycle state. Runtime owners remain the
 * authority for current source and adapter validation.
 */
export function evaluateC6CompositionConformance(snapshot = {}) {
  const issues = [];
  const issue = (code, path, message) => issues.push({ code, path, message });
  const workflow = snapshot?.workflow;
  const receipt = snapshot?.source_receipt;
  if (!["framed", "pure"].includes(workflow) || !c6PlainObject(receipt) || !C6_SUBJECT_RESTRICTIONS.has(receipt.subject_restrictions)) {
    issue("c6-source-restriction-invalid", "source_receipt.subject_restrictions", "every C6 snapshot requires one closed parser-owned subject restriction");
    return Object.freeze({ ok: false, issues: Object.freeze(issues) });
  }

  if (workflow === "pure") {
    for (const [name, value] of Object.entries({
      presentation: snapshot.presentation,
      raw_contract: snapshot.raw_contract,
      provider_request: snapshot.provider_request,
      provider_input_binding: snapshot.provider_input_binding,
    })) {
      if (c6ContainsPureFramedField(value)) {
        issue("c6-pure-framed-binding", name, "Pure may retain the receipt restriction but must not carry a Framed C6 binding");
      }
    }
    if (c6ContainsField(snapshot.provider_request, new Set(["subject_restrictions"]))) {
      issue("c6-pure-request-restriction", "provider_request", "Pure provider requests must not receive the C6 Framed restriction binding");
    }
    return Object.freeze({ ok: issues.length === 0, issues: Object.freeze(issues) });
  }

  const presentation = snapshot.presentation;
  const profile = presentation?.profile;
  const canvas = profile?.canvas;
  const headerRegion = profile?.header_region;
  const composition = presentation?.protected_composition;
  if (!c6ExactKeys(canvas, ["css_width", "css_height", "capture_width", "capture_height"]) ||
    !Object.values(canvas).every((value) => Number.isFinite(value) && value > 0) ||
    !c6ExactKeys(headerRegion, C6_RECTANGLE_KEYS) ||
    !Object.values(headerRegion).every(Number.isFinite) ||
    headerRegion.x < 0 || headerRegion.y < 0 || headerRegion.width <= 0 || headerRegion.height <= 0 ||
    headerRegion.x + headerRegion.width > canvas.css_width || headerRegion.y + headerRegion.height >= canvas.css_height) {
    issue("c6-header-region-invalid", "presentation.profile.header_region", "Framed requires one in-canvas CSS-pixel header_region with positive body height below it");
  }
  const expectedReserved = c6PlainObject(canvas) && c6PlainObject(headerRegion) ? {
    x: headerRegion.x / canvas.css_width,
    y: headerRegion.y / canvas.css_height,
    width: headerRegion.width / canvas.css_width,
    height: headerRegion.height / canvas.css_height,
  } : null;
  const expectedBodySafe = c6PlainObject(expectedReserved) ? {
    x: 0,
    y: expectedReserved.y + expectedReserved.height,
    width: 1,
    height: 1 - expectedReserved.y - expectedReserved.height,
  } : null;
  if (!c6ExactKeys(composition, ["coordinate_space", "reserved_header", "body_safe"]) ||
    composition.coordinate_space !== "normalized-canvas" || !c6Rectangle(composition.reserved_header) || !c6Rectangle(composition.body_safe) ||
    !c6Same(composition.reserved_header, expectedReserved) || !c6Same(composition.body_safe, expectedBodySafe)) {
    issue("c6-protected-composition-invalid", "presentation.protected_composition", "Framed composition must be the exact normalized header region and full-width body-safe formula");
  }
  if (!c6PlainObject(presentation?.provenance) || typeof presentation.provenance.profile !== "string" || !presentation.provenance.profile ||
    typeof presentation.provenance.catalog !== "string" || !presentation.provenance.catalog ||
    typeof presentation.provenance.defaults !== "string" || !presentation.provenance.defaults) {
    issue("c6-composition-provenance-missing", "presentation.provenance", "Framed composition requires selected-profile and inherited-value provenance");
  }

  const frame = snapshot.raw_contract?.framed;
  if (!c6PlainObject(frame) || !c6Same(frame.protected_composition, composition) || frame.subject_restrictions !== receipt.subject_restrictions) {
    issue("c6-framed-raw-lineage-invalid", "raw_contract.framed", "Framed raw contract must retain the selected composition and Core-bound restriction");
  }
  if (!/^[0-9a-f]{64}$/.test(snapshot.provider_input_binding?.protected_composition_sha256 || "")) {
    issue("c6-composition-digest-missing", "provider_input_binding.protected_composition_sha256", "Framed raw-plan binding requires the protected composition digest");
  }

  const request = snapshot.provider_request;
  if (!c6PlainObject(request) || !c6Same(request.protected_composition, composition) || request.subject_restrictions !== receipt.subject_restrictions) {
    issue("c6-framed-request-lineage-invalid", "provider_request", "Framed request must retain the selected composition and source restriction");
  }
  if (c6ContainsField(request, C6_REQUEST_FORBIDDEN_FIELDS)) {
    issue("c6-framed-request-local-header", "provider_request", "Framed provider request must not serialize local header or former geometry fields");
  }
  if (c6ContainsField({ presentation, raw_contract: snapshot.raw_contract, provider_input_binding: snapshot.provider_input_binding }, new Set(["protected_geometry"]))) {
    issue("c6-legacy-geometry", "framed-lineage", "Framed current lineage must not retain protected_geometry");
  }
  return Object.freeze({ ok: issues.length === 0, issues: Object.freeze(issues) });
}

const C5_PAGE_STAGES = Object.freeze({
  "page-source-receipt": "parsed-source",
  "page-layout": "resolved-presentation",
  "page-render-model": "reviewable-page",
  "page-generation-spec": "compiled-page-facts",
  "image2-request": "provider-input",
  "page-artifact-index": "page-derived-index",
  "framed-header-html": "local-header-overlay",
});

/**
 * Evaluate a C5 publication shape without loading a Run Bundle. This remains
 * an opt-in contract sweep, never a runtime planning gate.
 */
export function evaluatePageDerivedPublicationConformance(snapshot = {}) {
  const issues = [];
  const workflow = snapshot?.workflow;
  const pages = snapshot?.pages;
  if (!['framed', 'pure'].includes(workflow) || !Array.isArray(pages) || pages.length === 0) {
    return Object.freeze({ ok: false, issues: Object.freeze([{ code: "page-derived-snapshot-invalid", path: "snapshot", message: "workflow and nonempty pages are required" }]) });
  }
  const expected = Object.entries(C5_PAGE_STAGES)
    .filter(([stage]) => workflow === "framed" || stage !== "framed-header-html");
  for (const page of pages) {
    const pageId = page?.slide_id;
    if (typeof pageId !== "string" || !pageId) {
      issues.push({ code: "page-derived-identity-invalid", path: "page", message: "page requires one stable slide_id" });
      continue;
    }
    if (!Array.isArray(page.artifacts)) {
      issues.push({ code: "page-derived-artifacts-invalid", path: pageId, message: "page requires artifact records" });
      continue;
    }
    const byStage = new Map();
    for (const artifact of page.artifacts) {
      const stage = artifact?.stage;
      if (!Object.hasOwn(C5_PAGE_STAGES, stage)) {
        issues.push({ code: "page-derived-stage-undeclared", path: pageId, message: `${stage || "missing"} is not a declared C5 stage` });
        continue;
      }
      if (byStage.has(stage)) issues.push({ code: "page-derived-stage-duplicate", path: pageId, message: `${stage} appears more than once` });
      byStage.set(stage, artifact);
      if (artifact.role !== C5_PAGE_STAGES[stage]) {
        issues.push({ code: "page-derived-role-invalid", path: pageId, message: `${stage} has an undeclared role` });
      }
      if (artifact?.page?.slide_id !== pageId) {
        issues.push({ code: "page-derived-identity-mixed", path: pageId, message: `${stage} does not bind its page identity` });
      }
      if (artifact?.producer !== "scripts/shared/image2/page_derived_data.mjs" || !artifact.upstream_bindings || !artifact.invalidated_by) {
        issues.push({ code: "page-derived-provenance-missing", path: pageId, message: `${stage} lacks declared producer or provenance` });
      }
    }
    for (const [stage] of expected) if (!byStage.has(stage)) issues.push({ code: "page-derived-stage-missing", path: pageId, message: `${stage} is required for ${workflow}` });
    if (workflow === "pure" && byStage.has("framed-header-html")) {
      issues.push({ code: "page-derived-framed-artifact-on-pure", path: pageId, message: "Pure publication must not contain Framed header HTML" });
    }
  }
  return Object.freeze({ ok: issues.length === 0, issues: Object.freeze(issues) });
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
  if (!manifest || manifest.schema !== "pptmaker-source-test-ownership" || !Array.isArray(manifest.owners)) {
    addIssue(issues, "ownership-schema", "tests/contracts/source-test-ownership.json", "invalid ownership manifest schema");
    return;
  }
  const seenInterfaces = new Map();
  const seenExecutables = new Map();
  const seenTests = new Map();
  const owners = manifest.owners.map((entry) => entry.owner);
  if (owners.join("\n") !== [...owners].sort().join("\n")) addIssue(issues, "ownership-order", "tests/contracts/source-test-ownership.json", "owners must be sorted");
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
    if (actual.join("\n") !== expected.join("\n")) addIssue(issues, "executable-owner-union", "tests/contracts/source-test-ownership.json", `manifest executable union [${actual.join(", ")}] differs from canonical registry [${expected.join(", ")}]`);
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
  const semanticFields = ["provider_rendered_content", "local_header", "subject_restrictions", "protected_composition"];
  const foundSemanticField = semanticFields.find((field) => new RegExp(`\\b${field}\\b`).test(rootSource || ""));
  if (foundSemanticField) {
    addIssue(issues, "root-page-image-prompt-assembly", "ppt_flow.mjs", `ppt_flow may not assemble Page Image prompt semantics (${foundSemanticField})`);
  }
}

export function validateArchitectureSnapshot({ files: inputFiles, manifest = null, requireCompleteManifest = true }) {
  const files = new Map(Object.entries(inputFiles instanceof Map ? Object.fromEntries(inputFiles) : inputFiles).map(([path, value]) => [normalized(path), String(value)]));
  const issues = [];
  validatePageImageCoreSeam(files, issues);
  validatePageImageProviderInputCompilation(files, issues);
  validateSharedWorkflowSemanticBoundaries(files, issues);
  validateSingleDeliveryOwner(files, issues);
  const scriptFiles = new Map([...files].filter(([path]) => !path.startsWith("tests/") && !path.startsWith("tests_e2e/")));
  const rootEntries = new Set([...scriptFiles].map(([path]) => path.split("/")[0]));
  for (const entry of rootEntries) if (!ROOT_WHITELIST.has(entry)) addIssue(issues, "root-whitelist", entry, "unexpected scripts-root entry");
  for (const name of FORBIDDEN_GENERIC_ROOTS) if (rootEntries.has(name)) addIssue(issues, "generic-root", name, "forbidden generic scripts root");
  if ([...scriptFiles].some(([path]) => path === "lib" || path.startsWith("lib/"))) addIssue(issues, "retired-lib", "lib", "scripts/lib is forbidden");
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
  const manifest = JSON.parse(files["tests/contracts/source-test-ownership.json"] || readFileSync(resolve(repoRoot, "tests/contracts/source-test-ownership.json"), "utf8"));
  const result = validateArchitectureSnapshot({ files, manifest });
  return Object.freeze(result);
}
