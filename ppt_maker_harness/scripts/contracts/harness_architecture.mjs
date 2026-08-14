import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, posix, relative, resolve } from "node:path";
import { EXECUTABLE_INVENTORY, normalizeExecutablePath } from "./executable_inventory.mjs";

export const ACTIVE_FOUNDATION_METHOD_MODULES = Object.freeze([
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
export const CURRENT_PROTOCOL_INVALID_INTERFACE = "shared/workflow/current_protocol_invalid.mjs";

export const FOUNDATION_METHOD_MODULE_ADJACENCY = Object.freeze({
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
  "shared/page-image/page_image_presentation_envelope.mjs",
  "shared/page-image/page_image_source_receipt.mjs",
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
  CURRENT_PROTOCOL_INVALID_INTERFACE,
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
const SHARED_PUBLIC_FOUNDATION_METHOD_MODULE_INTERFACE_IMPORTS = new Map();
const DIRECT_ENTRY_EXCEPTIONS = new Set([
  "shared/cli/cli_bootstrap.mjs",
  "shared/cli/cli_error.mjs",
]);
const REQUIRED_MANIFEST_INTERFACES = Object.freeze([
  ...ACTIVE_FOUNDATION_METHOD_MODULES.map((module) => `${module}/index.mjs`),
  ...TARGET_WORKFLOW_INTERFACES,
  ...TARGET_DELIVERY_INTERFACES,
  ...TARGET_ITERATION_INTERFACES,
  ...PUBLIC_SHARED_INTERFACES,
  "contracts/canonical_json.mjs",
  "contracts/executable_inventory.mjs",
  "contracts/harness_architecture.mjs",
  "contracts/harness_coherence.mjs",
  "contracts/harness_document_command_audit.mjs",
]);

function normalized(value) {
  return String(value).replaceAll("\\", "/").replace(/^\.\//, "").replace(/\/+/g, "/");
}

function foundationMethodModuleOf(path) {
  const first = normalized(path).split("/")[0];
  return ACTIVE_FOUNDATION_METHOD_MODULES.includes(first) ? first : null;
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
  for (const key of ["stage_names", "anchors", "selectors", "wire_schemas", "stage_artifact_envelopes", "shared_contracts", "state_shapes", "semantic_exclusions", "contract_fields", "envelope_observations", "literal_occurrences", "numeric_marker_occurrences"]) {
    if (!Array.isArray(snapshot[key])) issues.push({ code: "contract-snapshot-incomplete", path: key, message: `${key} must be an array` });
  }
  const stageNames = new Set(snapshot.stage_names || []);
  const anchors = new Set(snapshot.anchors || []);
  const selectors = Array.isArray(snapshot.selectors) ? snapshot.selectors : [];
  const wireSchemas = Array.isArray(snapshot.wire_schemas) ? snapshot.wire_schemas : [];
  const stageArtifactEnvelopes = Array.isArray(snapshot.stage_artifact_envelopes) ? snapshot.stage_artifact_envelopes : [];
  const sharedContracts = Array.isArray(snapshot.shared_contracts) ? snapshot.shared_contracts : [];
  const stateShapes = Array.isArray(snapshot.state_shapes) ? snapshot.state_shapes : [];
  const semanticExclusions = Array.isArray(snapshot.semantic_exclusions) ? snapshot.semantic_exclusions : [];
  const fieldAssignments = Array.isArray(snapshot.contract_fields) ? snapshot.contract_fields : [];
  const envelopeObservations = Array.isArray(snapshot.envelope_observations) ? snapshot.envelope_observations : [];
  const literals = Array.isArray(snapshot.literal_occurrences) ? snapshot.literal_occurrences : [];
  const numericMarkers = Array.isArray(snapshot.numeric_marker_occurrences) ? snapshot.numeric_marker_occurrences : [];
  const declaredValues = new Set();
  const declaredStageRoles = new Set();
  const declaredEnvelopeForms = new Map();

  const declare = (entry, type) => {
    const value = entry?.value;
    if (typeof value !== "string" || !CONTRACT_VALUE.test(value) || VERSION_SUFFIX.test(value)) {
      issues.push({ code: "contract-declaration-invalid", path: entry?.location || type, message: `${type} must declare an unversioned kebab-case value` });
      return;
    }
    declaredValues.add(value);
  };

  for (const value of stageNames) declare({ value, location: "stage_names" }, "stage name");
  for (const entry of selectors) declare(entry, "selector");
  for (const entry of wireSchemas) {
    declare(entry, "wire schema");
    if (!stageNames.has(entry?.stage_ref) || typeof entry?.role !== "string" || !entry.role.trim()) {
      issues.push({ code: "wire-stage-role-invalid", path: entry?.location || "wire schema", message: `${entry?.value || "wire schema"} must reference one declared stage and role` });
    }
  }
  for (const entry of stageArtifactEnvelopes) {
    const stage = entry?.stage_ref;
    const role = entry?.artifact_role;
    const form = entry?.form;
    const requiredFields = entry?.required_fields;
    if (!stageNames.has(stage) || typeof role !== "string" || !CONTRACT_VALUE.test(role) ||
      typeof form !== "string" || !CONTRACT_VALUE.test(form) ||
      !Array.isArray(requiredFields) || requiredFields.length === 0 || new Set(requiredFields).size !== requiredFields.length ||
      requiredFields.some((field) => typeof field !== "string" || !field) ||
      typeof entry?.producer !== "string" || !entry.producer || !Array.isArray(entry?.anchors) || entry.anchors.length === 0) {
      issues.push({ code: "stage-artifact-envelope-invalid", path: entry?.location || stage || "stage artifact envelope", message: "stage artifact envelope requires one declared stage, role, physical form, producer, anchors, and required fields" });
      continue;
    }
    declare({ value: role, location: entry?.location || stage }, "artifact role");
    const stageRole = `${stage}\u0000${role}`;
    const key = `${stageRole}\u0000${form}`;
    if (declaredEnvelopeForms.has(key)) {
      issues.push({ code: "stage-artifact-envelope-duplicate", path: entry?.location || stage, message: `${stage}/${role}/${form} is declared more than once` });
      continue;
    }
    for (const anchor of entry.anchors) {
      if (!anchors.has(anchor)) issues.push({ code: "contract-anchor-missing", path: entry?.location || stage, message: `missing declared anchor ${anchor}` });
    }
    declaredStageRoles.add(stageRole);
    declaredEnvelopeForms.set(key, new Set(requiredFields));
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
  for (const stateShape of stateShapes) {
    if (typeof stateShape?.name !== "string" || !stateShape.name || typeof stateShape?.owner !== "string" || !stateShape.owner ||
      !Array.isArray(stateShape?.required_fields) || stateShape.required_fields.length === 0 ||
      new Set(stateShape.required_fields).size !== stateShape.required_fields.length ||
      !Array.isArray(stateShape?.anchors) || stateShape.anchors.length === 0) {
      issues.push({ code: "state-shape-incomplete", path: stateShape?.location || "current state shape", message: "state shape requires name, owner, anchors, and unique required fields" });
      continue;
    }
    if (stateShape.value !== undefined) declare(stateShape, "state shape");
    for (const anchor of stateShape.anchors) {
      if (!anchors.has(anchor)) issues.push({ code: "contract-anchor-missing", path: stateShape.location || stateShape.name, message: `missing declared anchor ${anchor}` });
    }
  }
  const declaredExclusions = new Map();
  for (const exclusion of semanticExclusions) {
    if (typeof exclusion?.name !== "string" || !exclusion.name || typeof exclusion?.field !== "string" || !exclusion.field ||
      !Array.isArray(exclusion?.values) || exclusion.values.length === 0 || exclusion.values.some((value) => typeof value !== "string" || !value) ||
      typeof exclusion?.meaning !== "string" || !exclusion.meaning ||
      (exclusion.anchors !== undefined && (!Array.isArray(exclusion.anchors) || exclusion.anchors.length === 0))) {
      issues.push({ code: "semantic-exclusion-invalid", path: exclusion?.name || "semantic exclusion", message: "semantic exclusion requires a name, field, values, and declared meaning" });
      continue;
    }
    for (const anchor of exclusion.anchors || []) {
      if (!anchors.has(anchor)) issues.push({ code: "contract-anchor-missing", path: exclusion.name, message: `missing declared anchor ${anchor}` });
    }
    declaredExclusions.set(exclusion.name, exclusion);
  }
  for (const assignment of fieldAssignments) {
    if (assignment?.intent === "test-input") continue;
    const semantic = assignment?.semantic ? declaredExclusions.get(assignment.semantic) : null;
    if (semantic && semantic.field === assignment.field && semantic.values.includes(assignment.value)) continue;
    if (!declaredValues.has(assignment?.value)) {
      issues.push({ code: "contract-field-undeclared", path: assignment?.location || assignment?.field || "contract field", message: `${assignment?.value || "missing value"} is not declared` });
    }
  }
  const observedEnvelopeForms = new Set();
  for (const observation of envelopeObservations) {
    const stage = observation?.schema;
    const role = observation?.artifact_role;
    const form = observation?.form;
    const declared = declaredEnvelopeForms.get(`${stage}\u0000${role}\u0000${form}`);
    if (!declared) {
      issues.push({ code: "artifact-envelope-undeclared", path: observation?.location || "artifact envelope", message: `${stage || "missing schema"}/${role || "missing artifact_role"}/${form || "missing form"} is not declared` });
      continue;
    }
    observedEnvelopeForms.add(`${stage}\u0000${role}\u0000${form}`);
    const fields = Array.isArray(observation?.fields) ? new Set(observation.fields) : new Set();
    const missing = [...declared].filter((field) => !fields.has(field));
    if (missing.length) issues.push({ code: "artifact-envelope-fields-missing", path: observation?.location || stage, message: `${stage}/${role} omits ${missing.join(", ")}` });
  }
  for (const key of declaredEnvelopeForms.keys()) {
    if (!observedEnvelopeForms.has(key)) {
      issues.push({ code: "artifact-envelope-unobserved", path: key.replaceAll("\u0000", "/"), message: "declared physical artifact form has no current producer observation" });
    }
  }
  for (const literal of literals) {
    if (VERSION_SUFFIX.test(String(literal?.value || ""))) {
      issues.push({ code: "version-suffixed-production-literal", path: literal?.location || "literal", message: `${literal.value} has a prohibited version suffix` });
    }
  }
  for (const marker of numericMarkers) {
    if (marker?.intent === "expected-rejection") continue;
    const declared = declaredExclusions.get(marker?.value);
    if (!declared) {
      issues.push({ code: "numeric-harness-marker-undeclared", path: marker?.location || marker?.field || "numeric marker", message: `${marker?.field || "marker"}=${marker?.value ?? "missing"} has no declared semantic classification` });
      continue;
    }
    if (declared.name === "style-master-plan-generation" && marker.scope !== "exact-work-version-workflow") {
      issues.push({ code: "numeric-harness-marker-invalid", path: marker?.location || marker?.field, message: "Style Master plan_generation must be a positive exact Work Version/workflow ordering fact" });
    }
  }
  return Object.freeze({ ok: issues.length === 0, issues: Object.freeze(issues) });
}

export const ACTIVE_SURFACE_ROOTS = Object.freeze([
  "ppt_maker_harness",
  "tests",
  "tests_e2e",
  "openspec/specs",
]);

export const ACTIVE_SURFACE_FILES = Object.freeze([
  "AGENTS.md",
  "CONTEXT.md",
  "openspec/config.yaml",
]);

export const ACTIVE_SURFACE_TEXT_EXTENSIONS = Object.freeze([
  ".mjs",
  ".md",
  ".json",
  ".yaml",
  ".css",
  ".html",
  ".txt",
]);

export const ACTIVE_SURFACE_BINARY_EXTENSIONS = Object.freeze([".woff2"]);

const ACTIVE_SURFACE_TEXT_EXTENSION_SET = new Set(ACTIVE_SURFACE_TEXT_EXTENSIONS);
const ACTIVE_SURFACE_BINARY_EXTENSION_SET = new Set(ACTIVE_SURFACE_BINARY_EXTENSIONS);
const ACTIVE_SURFACE_ROLE = /\b(?:source|state|receipt|plan|evidence|route|adapter|candidate|acceptance)(?:\b|_)/i;
const ACTIVE_SURFACE_NUMERIC_VERSION = /\bv[1-9][0-9]*\b/gi;
const ACTIVE_SURFACE_STRUCTURAL_VERSION = /\b3_versions\/v[1-9][0-9]*\b/i;
const ACTIVE_SURFACE_REQUESTED_VERSION = /\brequested(?:[_ -][a-z]+)?[_ -]version\b/i;
const ACTIVE_SURFACE_ACTIVE_VERSION = /\bactive(?:[_ -][a-z]+)?[_ -]version\b/i;
const ACTIVE_SURFACE_STRUCTURAL_VERSION_FIELD = /\b(?:runVersion|run_version|sourceVersion|source_version|targetVersion|target_version|source_run_version|target_run_version|requested_run_version|active_run_version|continuation_target_version|production_identity_run_version)\b/;
const ACTIVE_SURFACE_STRUCTURAL_VERSION_OPERATION = /\b(?:canonicalVersionKey|normalizeRunVersion|selectedRunVersion|nextVersionName)\b/;
const ACTIVE_SURFACE_STRUCTURAL_VERSION_HEADING = /^\s*#{1,6}\s+v[1-9][0-9]*\b/i;
const ACTIVE_SURFACE_STRUCTURAL_VERSION_DIRECTORY = /\bv[1-9][0-9]*\//i;
const ACTIVE_SURFACE_STRUCTURAL_VERSION_ROOT = /(?:\b3_versions|\$\{VERSIONS_DIR\})\/v[1-9][0-9]*\b/i;
const ACTIVE_SURFACE_INITIAL_DRAFT_VERSION = /\b(?:initial(?:ized|[_ -]?draft)?|hasInitialEvidence|deck-type seed)\b/i;
const ACTIVE_SURFACE_NEGATION = /\b(?:shall|must|does|do|can|will)\s+not\b|\b(?:never|without)\b/i;
const ACTIVE_SURFACE_RESIDUE_DEFINITION = /\b(?:affirmative\s+claim|residue\s+categor(?:y|ies)|defines?\s+or\s+forbids?)\b/i;
const ACTIVE_SURFACE_INVALID_IDENTITY = /\b(?:invalid|foreign|undeclared)\b[\s\S]{0,80}\b(?:protocol|production\s+identity|identity)\b/i;
const ACTIVE_SURFACE_AFFIRMATIVE_RECOVERY = /\b(?:read|migrat(?:e|ed|ion)|convert(?:ed|sion)?|adopt(?:ed|ion)?|export(?:ed|ing)?|handled|fallback(?:-handled)?)\b/i;
const ACTIVE_SURFACE_AFFIRMATIVE_LINK = /\b(?:is|are|will|can|does|do|may|shall)\s+(?:be\s+)?(?:read|migrated|converted|adopted|exported|handled)\b/i;
const ACTIVE_SURFACE_RETIRED_ACTION = new RegExp(
  `\\b${["unsupported", "protocol"].join("-")}\\s*/\\s*${"export"}\\b|` +
  `\\b${"repair"}\\s*(?:or|/)\\s*${"export"}\\b`,
  "i",
);

function activeSurfaceIssue(code, path, message) {
  return Object.freeze({ code, path, message });
}

function activeSurfaceLocation(path, line) {
  return `${path}:${line}`;
}

function isStructuralVersionOccurrence(line) {
  return ACTIVE_SURFACE_STRUCTURAL_VERSION.test(line) ||
    (ACTIVE_SURFACE_REQUESTED_VERSION.test(line) && ACTIVE_SURFACE_ACTIVE_VERSION.test(line)) ||
    ACTIVE_SURFACE_STRUCTURAL_VERSION_FIELD.test(line) ||
    ACTIVE_SURFACE_STRUCTURAL_VERSION_OPERATION.test(line) ||
    ACTIVE_SURFACE_STRUCTURAL_VERSION_HEADING.test(line) ||
    ACTIVE_SURFACE_STRUCTURAL_VERSION_DIRECTORY.test(line) ||
    ACTIVE_SURFACE_STRUCTURAL_VERSION_ROOT.test(line) ||
    ACTIVE_SURFACE_INITIAL_DRAFT_VERSION.test(line);
}

function isBareJavaScriptVersionReference(path, line, match) {
  if (!path.endsWith(".mjs")) return false;
  const before = line.slice(0, match.index).trimEnd().at(-1) || "";
  const after = line.slice(match.index + match[0].length).trimStart().at(0) || "";
  return /[.(,\[]/.test(before) && /[,);}\]]/.test(after);
}

function isResidueDefinition(lines, index) {
  return ACTIVE_SURFACE_RESIDUE_DEFINITION.test(lines.slice(Math.max(0, index - 1), Math.min(lines.length, index + 2)).join("\n"));
}

const RETIRED_CONTROL_SURFACE_RULES = Object.freeze([
  Object.freeze({
    category: ["retired", "prompt", "cookbook"].join("-"),
    pattern: new RegExp(["\\b", "agent", "[-_ ]?", "prompts", "(?:\\.md)?", "\\b"].join(""), "i"),
  }),
  Object.freeze({
    category: ["retired", "inspection", "projection"].join("-"),
    pattern: new RegExp(["\\b", "workflow", "[-_ ]?", "inspection", "[-_ ]?", "(?:baseline|ledger)", "(?:\\.md)?", "\\b"].join(""), "i"),
  }),
  Object.freeze({
    category: ["retired", "control", "catalog"].join("-"),
    pattern: new RegExp(["\\b", "intent", "[-_ ]?", "routes?", "(?:\\.json|[-_ ]?catalog)?", "\\b"].join(""), "i"),
  }),
  Object.freeze({
    category: ["retired", "controller", "metadata"].join("-"),
    pattern: /^\s*(?:production_modes|supported_production_modes|mode_transition_handoff|lifecycle_phase|phase)\s*:/im,
  }),
  Object.freeze({
    category: ["retired", "mode", "dialect"].join("-"),
    pattern: /\b(?:production_mode|image2-page-workflow)\b/i,
  }),
]);

const EXPLICIT_RETIRED_CONTROL_REJECTION = /\b(?:reject(?:ed|s|ion)?|retired|remove[ds]?|forbid(?:den)?|unsupported|invalid|malformed|instead\s+of|not\s+(?:a\s+)?current|shall\s+not|must\s+not|does\s+not|do\s+not|without)\b|\bretired(?=[_-]|[A-Z])/i;

function isExplicitRetiredControlRejection(path, lines, index) {
  const lookbehind = path.startsWith("tests/") || path.startsWith("tests_e2e/") ? 6 : path.endsWith(".md") ? 4 : 1;
  return EXPLICIT_RETIRED_CONTROL_REJECTION.test(lines.slice(Math.max(0, index - lookbehind), index + 1).join("\n"));
}

function isControllerDeclarationPath(path) {
  return /^ppt_maker_harness\/playbook\/[^/]+\.md$/u.test(path);
}

/**
 * Evaluate supplied active guidance, source, and test text for deleted control
 * surfaces. This pure seam deliberately does not enumerate repositories.
 */
export function evaluateRetiredControlSurfaceReachability(snapshot = {}) {
  if (!Array.isArray(snapshot.entries)) {
    return Object.freeze({ ok: false, issues: Object.freeze([
      activeSurfaceIssue("retired-control-snapshot-incomplete", "entries", "entries must be an array"),
    ]) });
  }

  const issues = [];
  for (const entry of snapshot.entries) {
    if (!entry || typeof entry.path !== "string" || !entry.path || typeof entry.content !== "string") {
      issues.push(activeSurfaceIssue("retired-control-entry-invalid", entry?.path || "entry", "each entry requires an exact path and text content"));
      continue;
    }
    const lines = entry.content.split("\n");
    for (const rule of RETIRED_CONTROL_SURFACE_RULES) {
      if (rule.category === "retired-controller-metadata" && !isControllerDeclarationPath(entry.path)) continue;
      const matchIndex = lines.findIndex((line) => rule.pattern.test(line));
      const matchesPath = rule.pattern.test(entry.path);
      if (matchIndex < 0 && !matchesPath) continue;
      if (matchIndex >= 0 && isExplicitRetiredControlRejection(entry.path, lines, matchIndex)) continue;
      issues.push(activeSurfaceIssue(rule.category, entry.path, "retired Agent control surface is reachable from active content"));
    }
  }
  return Object.freeze({ ok: issues.length === 0, issues: Object.freeze(issues) });
}

/**
 * Evaluate already-classified active text without filesystem, bundle, or provider access.
 * The caller owns enumeration; this seam owns only residue classification.
 */
export function evaluateActiveSurfaceResidue(snapshot = {}) {
  const entries = snapshot.entries;
  if (!Array.isArray(entries)) {
    return Object.freeze({ ok: false, issues: Object.freeze([
      activeSurfaceIssue("active-surface-snapshot-incomplete", "entries", "entries must be an array"),
    ]) });
  }

  const issues = [];
  for (const entry of entries) {
    if (!entry || typeof entry.path !== "string" || !entry.path || (entry.kind !== "text" && entry.kind !== "binary")) {
      issues.push(activeSurfaceIssue("active-surface-entry-invalid", entry?.path || "entry", "each entry requires an exact path and text or binary classification"));
      continue;
    }
    if (entry.kind === "binary") continue;
    if (typeof entry.content !== "string") {
      issues.push(activeSurfaceIssue("active-surface-entry-invalid", entry.path, "text entry content must be a string"));
      continue;
    }

    const lines = entry.content.split("\n");
    for (const [index, line] of lines.entries()) {
      if (!isStructuralVersionOccurrence(line) && ACTIVE_SURFACE_ROLE.test(line)) {
        for (const match of line.matchAll(ACTIVE_SURFACE_NUMERIC_VERSION)) {
          if (isBareJavaScriptVersionReference(entry.path, line, match)) continue;
          issues.push(activeSurfaceIssue(
            "retired-numeric-protocol-identity",
            activeSurfaceLocation(entry.path, index + 1),
            `numeric ${match[0]} is coupled to a production source/state/receipt/plan/evidence/route/adapter/candidate/acceptance role`,
          ));
        }
      }
      if (ACTIVE_SURFACE_RETIRED_ACTION.test(line)) {
        issues.push(activeSurfaceIssue(
          "retired-protocol-action",
          activeSurfaceLocation(entry.path, index + 1),
          "retired invalid-protocol recovery action is active",
        ));
      }
      if (ACTIVE_SURFACE_INVALID_IDENTITY.test(line) && ACTIVE_SURFACE_AFFIRMATIVE_RECOVERY.test(line) &&
        ACTIVE_SURFACE_AFFIRMATIVE_LINK.test(line) && !ACTIVE_SURFACE_NEGATION.test(line) && !isResidueDefinition(lines, index)) {
        issues.push(activeSurfaceIssue(
          "invalid-protocol-compatibility-claim",
          activeSurfaceLocation(entry.path, index + 1),
          "invalid protocol identity compatibility claim is active",
        ));
      }
    }
  }
  return Object.freeze({ ok: issues.length === 0, issues: Object.freeze(issues) });
}

function excludedActiveSurfaceDirectory(name) {
  return name === "_generated" || /^(?:deck_|dpt_)/.test(name);
}

/**
 * Read only the declared active maintenance roots. Run bundles, research, changes,
 * Backlog, generated outputs, and providers are outside this repository check.
 */
export function scanActiveSurfaceResidue({ root = process.cwd(), readFile = readFileSync } = {}) {
  const base = resolve(root);
  const entries = [];
  const issues = [];
  let textFiles = 0;
  let binaryFiles = 0;

  const addFile = (path) => {
    const location = normalized(relative(base, path));
    const extension = extname(path).toLowerCase();
    if (ACTIVE_SURFACE_TEXT_EXTENSION_SET.has(extension)) {
      entries.push({ path: location, kind: "text", content: readFile(path, "utf8") });
      textFiles += 1;
      return;
    }
    if (ACTIVE_SURFACE_BINARY_EXTENSION_SET.has(extension)) {
      entries.push({ path: location, kind: "binary" });
      binaryFiles += 1;
      return;
    }
    issues.push(activeSurfaceIssue("active-surface-extension-unclassified", location, `regular active-surface file has unclassified extension ${extension || "[none]"}`));
  };

  const visit = (path) => {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!excludedActiveSurfaceDirectory(entry.name)) visit(join(path, entry.name));
        continue;
      }
      if (entry.isFile()) addFile(join(path, entry.name));
    }
  };

  for (const activeRoot of ACTIVE_SURFACE_ROOTS) {
    const path = resolve(base, activeRoot);
    if (!existsSync(path) || !statSync(path).isDirectory()) {
      issues.push(activeSurfaceIssue("active-surface-root-missing", activeRoot, "declared active-surface root is missing or not a directory"));
      continue;
    }
    visit(path);
  }

  for (const activeFile of ACTIVE_SURFACE_FILES) {
    const path = resolve(base, activeFile);
    if (!existsSync(path) || !statSync(path).isFile()) {
      issues.push(activeSurfaceIssue("active-surface-file-missing", activeFile, "declared active-surface file is missing or not regular"));
      continue;
    }
    addFile(path);
  }

  const residue = evaluateActiveSurfaceResidue({ entries });
  issues.push(...residue.issues);
  const retiredControls = evaluateRetiredControlSurfaceReachability({ entries: entries.filter((entry) => entry.kind === "text") });
  issues.push(...retiredControls.issues);
  return Object.freeze({
    ok: issues.length === 0,
    issues: Object.freeze(issues),
    inventory: Object.freeze({ text: textFiles, binary: binaryFiles }),
  });
}

const FRAMED_COMPOSITION_SUBJECT_RESTRICTIONS = new Set(["none", "no-generic-metal-robot", "no-identity-subject"]);
const FRAMED_COMPOSITION_RECTANGLE_KEYS = Object.freeze(["x", "y", "width", "height"]);
const FRAMED_COMPOSITION_REQUEST_FORBIDDEN_FIELDS = new Set(["local_header", "header_policy", "context_not_to_render", "protected_geometry"]);
const PURE_FORBIDDEN_FRAMED_COMPOSITION_FIELDS = new Set([
  "header_region",
  "protected_composition",
  "protected_composition_sha256",
  "local_header",
  "context_not_to_render",
  "protected_geometry",
]);

function framedCompositionPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function framedCompositionExactKeys(value, keys) {
  return framedCompositionPlainObject(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function framedCompositionRectangle(value) {
  return framedCompositionExactKeys(value, FRAMED_COMPOSITION_RECTANGLE_KEYS) &&
    FRAMED_COMPOSITION_RECTANGLE_KEYS.every((key) => Number.isFinite(value[key])) &&
    value.x >= 0 && value.y >= 0 && value.width > 0 && value.height > 0 &&
    value.x + value.width <= 1 && value.y + value.height <= 1;
}

function framedCompositionContainsField(value, forbidden) {
  if (Array.isArray(value)) return value.some((entry) => framedCompositionContainsField(entry, forbidden));
  if (!framedCompositionPlainObject(value)) return false;
  return Object.entries(value).some(([key, entry]) => forbidden.has(key) || framedCompositionContainsField(entry, forbidden));
}

function pureContainsFramedCompositionField(value) {
  if (Array.isArray(value)) return value.some((entry) => pureContainsFramedCompositionField(entry));
  if (!framedCompositionPlainObject(value)) return false;
  return Object.entries(value).some(([key, entry]) => {
    if (key === "protected_composition_sha256") return entry !== null;
    return PURE_FORBIDDEN_FRAMED_COMPOSITION_FIELDS.has(key) || pureContainsFramedCompositionField(entry);
  });
}

function framedCompositionSame(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

/**
 * Evaluate synthetic Framed composition facts without loading YAML, a Run Bundle,
 * provider configuration, or lifecycle state. Runtime owners remain the
 * authority for current source and adapter validation.
 */
export function evaluateFramedCompositionConformance(snapshot = {}) {
  const issues = [];
  const issue = (code, path, message) => issues.push({ code, path, message });
  const workflow = snapshot?.workflow;
  const receipt = snapshot?.source_receipt;
  if (!["framed", "pure"].includes(workflow) || !framedCompositionPlainObject(receipt) || !FRAMED_COMPOSITION_SUBJECT_RESTRICTIONS.has(receipt.subject_restrictions)) {
    issue("framed-composition-source-restriction-invalid", "source_receipt.subject_restrictions", "every composition snapshot requires one closed parser-owned subject restriction");
    return Object.freeze({ ok: false, issues: Object.freeze(issues) });
  }

  if (workflow === "pure") {
    for (const [name, value] of Object.entries({
      presentation: snapshot.presentation,
      raw_contract: snapshot.raw_contract,
      provider_request: snapshot.provider_request,
      provider_input_binding: snapshot.provider_input_binding,
    })) {
      if (pureContainsFramedCompositionField(value)) {
        issue("pure-framed-composition-binding", name, "Pure may retain the receipt restriction but must not carry a Framed composition binding");
      }
    }
    if (framedCompositionContainsField(snapshot.provider_request, new Set(["subject_restrictions"]))) {
      issue("pure-provider-request-restriction", "provider_request", "Pure provider requests must not receive the Framed restriction binding");
    }
    return Object.freeze({ ok: issues.length === 0, issues: Object.freeze(issues) });
  }

  const presentation = snapshot.presentation;
  const profile = presentation?.profile;
  const canvas = profile?.canvas;
  const headerRegion = profile?.header_region;
  const composition = presentation?.protected_composition;
  if (!framedCompositionExactKeys(canvas, ["css_width", "css_height", "capture_width", "capture_height"]) ||
    !Object.values(canvas).every((value) => Number.isFinite(value) && value > 0) ||
    !framedCompositionExactKeys(headerRegion, FRAMED_COMPOSITION_RECTANGLE_KEYS) ||
    !Object.values(headerRegion).every(Number.isFinite) ||
    headerRegion.x < 0 || headerRegion.y < 0 || headerRegion.width <= 0 || headerRegion.height <= 0 ||
    headerRegion.x + headerRegion.width > canvas.css_width || headerRegion.y + headerRegion.height >= canvas.css_height) {
    issue("framed-composition-header-region-invalid", "presentation.profile.header_region", "Framed requires one in-canvas CSS-pixel header_region with positive body height below it");
  }
  const expectedReserved = framedCompositionPlainObject(canvas) && framedCompositionPlainObject(headerRegion) ? {
    x: headerRegion.x / canvas.css_width,
    y: headerRegion.y / canvas.css_height,
    width: headerRegion.width / canvas.css_width,
    height: headerRegion.height / canvas.css_height,
  } : null;
  const expectedBodySafe = framedCompositionPlainObject(expectedReserved) ? {
    x: 0,
    y: expectedReserved.y + expectedReserved.height,
    width: 1,
    height: 1 - expectedReserved.y - expectedReserved.height,
  } : null;
  if (!framedCompositionExactKeys(composition, ["coordinate_space", "reserved_header", "body_safe"]) ||
    composition.coordinate_space !== "normalized-canvas" || !framedCompositionRectangle(composition.reserved_header) || !framedCompositionRectangle(composition.body_safe) ||
    !framedCompositionSame(composition.reserved_header, expectedReserved) || !framedCompositionSame(composition.body_safe, expectedBodySafe)) {
    issue("framed-composition-protected-composition-invalid", "presentation.protected_composition", "Framed composition must be the exact normalized header region and full-width body-safe formula");
  }
  if (!framedCompositionPlainObject(presentation?.provenance) || typeof presentation.provenance.profile !== "string" || !presentation.provenance.profile ||
    typeof presentation.provenance.catalog !== "string" || !presentation.provenance.catalog ||
    typeof presentation.provenance.defaults !== "string" || !presentation.provenance.defaults) {
    issue("framed-composition-provenance-missing", "presentation.provenance", "Framed composition requires selected-profile and inherited-value provenance");
  }

  const frame = snapshot.raw_contract?.framed;
  if (!framedCompositionPlainObject(frame) || !framedCompositionSame(frame.protected_composition, composition) || frame.subject_restrictions !== receipt.subject_restrictions) {
    issue("framed-composition-raw-lineage-invalid", "raw_contract.framed", "Framed raw contract must retain the selected composition and Core-bound restriction");
  }
  if (!/^[0-9a-f]{64}$/.test(snapshot.provider_input_binding?.protected_composition_sha256 || "")) {
    issue("framed-composition-digest-missing", "provider_input_binding.protected_composition_sha256", "Framed raw-plan binding requires the protected composition digest");
  }

  const request = snapshot.provider_request;
  if (!framedCompositionPlainObject(request) || !framedCompositionSame(request.protected_composition, composition) || request.subject_restrictions !== receipt.subject_restrictions) {
    issue("framed-composition-request-lineage-invalid", "provider_request", "Framed request must retain the selected composition and source restriction");
  }
  if (framedCompositionContainsField(request, FRAMED_COMPOSITION_REQUEST_FORBIDDEN_FIELDS)) {
    issue("framed-composition-request-local-header", "provider_request", "Framed provider request must not serialize local header or former geometry fields");
  }
  if (framedCompositionContainsField({ presentation, raw_contract: snapshot.raw_contract, provider_input_binding: snapshot.provider_input_binding }, new Set(["protected_geometry"]))) {
    issue("framed-composition-legacy-geometry", "framed-lineage", "Framed current lineage must not retain protected_geometry");
  }
  return Object.freeze({ ok: issues.length === 0, issues: Object.freeze(issues) });
}

function pageDerivedPublicationRoles(entries) {
  if (!Array.isArray(entries)) return null;
  const roles = new Map();
  for (const entry of entries) {
    const stage = entry?.stage_ref;
    const role = entry?.artifact_role;
    const isPerPagePublication = entry?.form === "per-page-derived-publication" ||
      entry?.form === "framed-header-html-projection";
    if (typeof stage !== "string" || !stage || typeof role !== "string" || !role ||
      role === "deck-derived-index" || !isPerPagePublication || !Array.isArray(entry?.required_fields)) {
      continue;
    }
    const isHtmlProjection = stage === "framed-header-html" &&
      entry.required_fields.includes("artifact_role") && entry.required_fields.includes("format");
    const isObjectEnvelope = entry.required_fields.includes("schema") && entry.required_fields.includes("artifact_role");
    if (!isObjectEnvelope && !isHtmlProjection) continue;
    if (roles.has(stage)) return null;
    roles.set(stage, role);
  }
  return roles.size > 0 ? roles : null;
}

/**
 * Evaluate a derived-publication shape without loading a Run Bundle. This remains
 * an opt-in contract sweep, never a runtime planning gate.
 */
export function evaluatePageDerivedPublicationConformance(snapshot = {}) {
  const issues = [];
  const workflow = snapshot?.workflow;
  const pages = snapshot?.pages;
  const declaredRoles = pageDerivedPublicationRoles(snapshot?.stage_artifact_envelopes);
  if (!['framed', 'pure'].includes(workflow) || !Array.isArray(pages) || pages.length === 0 || !declaredRoles) {
    return Object.freeze({ ok: false, issues: Object.freeze([{ code: "page-derived-snapshot-invalid", path: "snapshot", message: "workflow, declarations, and nonempty pages are required" }]) });
  }
  const expected = [...declaredRoles.entries()]
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
      const schema = artifact?.schema;
      if (!declaredRoles.has(schema)) {
        issues.push({ code: "page-derived-schema-undeclared", path: pageId, message: `${schema || "missing"} is not a declared derived-publication schema` });
        continue;
      }
      if (byStage.has(schema)) issues.push({ code: "page-derived-schema-duplicate", path: pageId, message: `${schema} appears more than once` });
      byStage.set(schema, artifact);
      if (artifact.artifact_role !== declaredRoles.get(schema)) {
        issues.push({ code: "page-derived-artifact-role-invalid", path: pageId, message: `${schema} has an undeclared artifact_role` });
      }
      if (artifact?.page?.slide_id !== pageId) {
        issues.push({ code: "page-derived-identity-mixed", path: pageId, message: `${schema} does not bind its page identity` });
      }
      if (artifact?.producer !== "scripts/shared/image2/page_derived_data.mjs" || !artifact.upstream_bindings || !artifact.invalidated_by) {
        issues.push({ code: "page-derived-provenance-missing", path: pageId, message: `${schema} lacks declared producer or provenance` });
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
  const fromFoundationMethodModule = foundationMethodModuleOf(importer);
  const toFoundationMethodModule = foundationMethodModuleOf(target);
  const fromTargetWorkflowAdapter = targetWorkflowAdapterOf(importer);
  const toTargetWorkflowAdapter = targetWorkflowAdapterOf(target);
  const fromTargetMethodModule = targetMethodModuleOf(importer);
  const toTargetMethodModule = targetMethodModuleOf(target);
  if (importer === "ppt_flow.mjs") {
    if (toFoundationMethodModule && target !== `${toFoundationMethodModule}/index.mjs`) addIssue(issues, "root-private-import", importer, `root imports private foundation method-module path ${target}`);
    if (target.startsWith("shared/") && !PUBLIC_SHARED_INTERFACES.includes(target)) addIssue(issues, "root-private-shared-import", importer, `root imports private shared path ${target}`);
    return;
  }
  if (importer.startsWith("shared/")) {
    const allowedFoundationMethodModuleInterfaces = SHARED_PUBLIC_FOUNDATION_METHOD_MODULE_INTERFACE_IMPORTS.get(importer);
    if (toFoundationMethodModule && !allowedFoundationMethodModuleInterfaces?.has(target)) addIssue(issues, "shared-foundation-method-module-import", importer, `shared imports foundation method-module path ${target}`);
    if (target.startsWith("shared/") && !PUBLIC_SHARED_INTERFACES.includes(target) && foundationMethodModuleOf(target) !== fromFoundationMethodModule) {
      const fromCategory = importer.split("/")[1];
      const toCategory = target.split("/")[1];
      if (fromCategory !== toCategory) addIssue(issues, "shared-private-cross-category", importer, `cross-category shared import targets private path ${target}`);
    }
    return;
  }
  if (importer.startsWith("contracts/")) {
    if (toFoundationMethodModule || target.startsWith("shared/")) addIssue(issues, "contract-back-edge", importer, `contract imports production path ${target}`);
    return;
  }
  if (fromFoundationMethodModule && toFoundationMethodModule && fromFoundationMethodModule !== toFoundationMethodModule) {
    const processAdapterPublicEdge = CROSS_OWNER_PROCESS_ADAPTERS.includes(importer) && target === `${toFoundationMethodModule}/index.mjs`;
    if (!processAdapterPublicEdge && !FOUNDATION_METHOD_MODULE_ADJACENCY[fromFoundationMethodModule].includes(toFoundationMethodModule)) addIssue(issues, "foundation-method-module-adjacency", importer, `${fromFoundationMethodModule} may not import ${toFoundationMethodModule}`);
    if (target !== `${toFoundationMethodModule}/index.mjs`) addIssue(issues, "foreign-foundation-method-module-private-import", importer, `foreign foundation method-module import must target ${toFoundationMethodModule}/index.mjs`);
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
  if (fromFoundationMethodModule && target.startsWith("shared/") && !PUBLIC_SHARED_INTERFACES.includes(target)) {
    addIssue(issues, "foundation-method-module-private-shared-import", importer, `foundation method module imports private shared path ${target}`);
  }
  if (fromFoundationMethodModule && importer.endsWith("/index.mjs") && target !== "shared/run-bundle/bundle_layout.mjs" && EXECUTABLE_INVENTORY.includes(target)) {
    addIssue(issues, "interface-cli-import", importer, `foundation method-module interface imports direct executable ${target}`);
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
  for (const module of ACTIVE_FOUNDATION_METHOD_MODULES) if (!scriptFiles.has(`${module}/index.mjs`)) addIssue(issues, "missing-foundation-method-module-interface", `${module}/index.mjs`, "active foundation method-module interface is missing");
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
 * recursively discovers nested method-module/test owners. */
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
