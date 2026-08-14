import { mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { parseDocument } from "yaml";
import { describe, expect, it } from "vitest";

import {
  evaluateActiveSurfaceResidue,
  evaluateFramedCompositionConformance,
  evaluatePageDerivedPublicationConformance,
  evaluateProductionSchemaConformance,
  scanActiveSurfaceResidue,
} from "../../ppt_maker_harness/scripts/contracts/harness_architecture.mjs";

const ROOT = process.cwd();
const HARNESS = join(ROOT, "ppt_maker_harness");
const SCHEMA_HOME = join(HARNESS, "schema");
const ACTIVE_ROOTS = [HARNESS, join(ROOT, "tests"), join(ROOT, "tests_e2e"), join(ROOT, "openspec", "specs")];
const TEXT_FILE = /\.(?:mjs|md|json|yaml)$/;
const CONTRACT_VALUE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const VERSIONED_CONTRACT = /\b[a-z][a-z0-9-]*-(?:schema|protocol|compiler|manifest|report|revision|format)-v[1-9][0-9]*\b/g;
const PAGE_IMAGE_PRESENTATION_CONTRACTS = [
  "pptmaker-page-image-class-catalog",
  "pptmaker-page-image-deck-defaults",
  "pptmaker-pure-deck-visual-system",
  "pptmaker-framed-header-profiles",
];

function walk(root, files = []) {
  for (const name of readdirSync(root)) {
    const path = join(root, name);
    if (statSync(path).isDirectory()) walk(path, files);
    else if (TEXT_FILE.test(name)) files.push(path);
  }
  return files;
}

function yaml(path) {
  const document = parseDocument(readFileSync(path, "utf8"));
  if (document.errors.length) throw new Error(`${path}: ${document.errors[0].message}`);
  return document.toJS({ mapAsMap: false });
}

function sourceAnchorExists(anchor) {
  const [base, fragment] = anchor.split("#", 2);
  const path = base.startsWith("scripts/") ? join(HARNESS, base) : join(ROOT, base);
  const stat = statSync(path);
  if (stat.isDirectory()) return !fragment;
  if (!stat.isFile()) return false;
  return !fragment || readFileSync(path, "utf8").includes(fragment);
}

function sourceText(path) {
  return readFileSync(path, "utf8");
}

function sourcePathForOwner(owner) {
  return owner.startsWith("scripts/") ? join(HARNESS, owner) : join(ROOT, owner);
}

function constantsIn(path, cache = new Map()) {
  if (cache.has(path)) return cache.get(path);
  const text = sourceText(path);
  const constants = new Map();
  // Cache before descending so repeated imports retain resolved constants and
  // cyclic imports can only observe the partial map already in construction.
  cache.set(path, constants);
  for (const match of text.matchAll(/(?:export\s+)?const\s+([A-Z][A-Z0-9_]*)\s*=\s*["']([a-z][a-z0-9-]*)["']/g)) {
    constants.set(match[1], match[2]);
  }
  for (const match of text.matchAll(/import\s*{([^}]+)}\s*from\s*["'](\.[^"']+)["']/g)) {
    const imported = resolve(dirname(path), match[2]);
    for (const part of match[1].split(",")) {
      const [exported, local = exported] = part.trim().split(/\s+as\s+/);
      const value = constantsIn(imported, cache).get(exported);
      if (value) constants.set(local, value);
    }
  }
  return constants;
}

function resolvedAssignments(text, field, constants) {
  const values = [];
  const pattern = new RegExp(`["']?${field}["']?\\s*:\\s*(?:["']([^"']+)["']|([A-Z][A-Z0-9_]*))`, "g");
  for (const match of text.matchAll(pattern)) {
    values.push({ value: match[1] || constants.get(match[2]) || null, offset: match.index });
  }
  return values;
}

function objectFields(text, start) {
  const fields = [];
  let depth = 0;
  let started = false;
  let quote = null;
  let escaped = false;
  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "\"" || char === "'") {
      quote = char;
      continue;
    }
    if (char === "{") {
      if (!started) {
        started = true;
        depth = 1;
      } else {
        depth += 1;
      }
      continue;
    }
    if (char === "}") {
      depth -= 1;
      if (started && depth === 0) break;
      continue;
    }
    if (started && depth === 1) {
      const match = text.slice(index).match(/^\s*(?:\.\.\.\()?([a-z0-9_]+)(?:\s*:|\s*,)/);
      if (match) {
        fields.push(match[1]);
        index += match[0].length - 1;
      }
    }
  }
  return fields;
}

function directEnvelopeObservation(entry) {
  const path = sourcePathForOwner(entry.producer);
  const text = sourceText(path);
  const constants = constantsIn(path);
  const constructorAnchor = entry.anchors.find((anchor) => /#(?:parse|resolve)/.test(anchor));
  const fragment = constructorAnchor?.split("#", 2)[1];
  const start = fragment ? text.indexOf(fragment) : 0;
  const region = text.slice(start < 0 ? 0 : start);
  const matchingAssignment = (field, value) => {
    const local = resolvedAssignments(region, field, constants).find((assignment) => assignment.value === value);
    return local ? { ...local, absoluteOffset: (start < 0 ? 0 : start) + local.offset } :
      resolvedAssignments(text, field, constants).find((assignment) => assignment.value === value);
  };
  const schemaAssignment = matchingAssignment("schema", entry.stage_ref);
  const artifactRoleAssignment = matchingAssignment("artifact_role", entry.artifact_role);
  if (!schemaAssignment?.value || !artifactRoleAssignment?.value) return null;
  const schema = schemaAssignment.value;
  const artifactRole = artifactRoleAssignment.value;
  const schemaOffset = schemaAssignment.absoluteOffset ?? schemaAssignment.offset;
  const bindingStart = entry.stage_ref === "page-layout" ? text.lastIndexOf("const binding = {", schemaOffset) : text.lastIndexOf("return deepFreeze({", schemaOffset);
  const fields = entry.stage_ref === "page-layout"
    ? [...objectFields(text, bindingStart), "workflow", "provenance", "binding_sha256"]
    : objectFields(text, bindingStart);
  return {
    schema,
    artifact_role: artifactRole,
    form: entry.form,
    fields,
    location: relative(ROOT, path),
  };
}

function derivedPublicationEnvelopeObservation(entry) {
  const path = sourcePathForOwner(entry.producer);
  const text = sourceText(path);
  const fieldsFrom = (needle) => {
    const start = text.indexOf(needle);
    if (start < 0) return null;
    const returnStart = text.indexOf("return {", start);
    return returnStart < 0 ? null : objectFields(text, returnStart);
  };
  const detailRole = (stage) => {
    const start = text.indexOf(`"${stage}": Object.freeze({`);
    if (start < 0) return null;
    const region = text.slice(start, text.indexOf("}),", start));
    return region.match(/\brole:\s*["']([a-z][a-z0-9-]*)["']/)?.[1] || null;
  };
  let fields = null;
  if (entry.form === "per-page-derived-publication") {
    if (!new RegExp(`stage:\\s*["']${entry.stage_ref}["']`).test(text) || detailRole(entry.stage_ref) !== entry.artifact_role) return null;
    fields = fieldsFrom("function artifactEnvelope");
  } else if (entry.form === "framed-header-html-projection") {
    if (detailRole(entry.stage_ref) !== entry.artifact_role) return null;
    const start = text.indexOf("references.framed_header_html = {");
    fields = start < 0 ? null : objectFields(text, start);
  } else if (entry.form === "deck-derived-publication") {
    const start = text.indexOf("function deckIndex");
    if (start < 0) return null;
    const region = text.slice(start, text.indexOf("function assertStagedTree", start));
    const role = region.match(/artifact_role:\s*details\.role/) ? "deck-derived-index" : null;
    if (role !== entry.artifact_role) return null;
    fields = fieldsFrom("function deckIndex");
  }
  if (!fields) return null;
  return {
    schema: entry.stage_ref,
    artifact_role: entry.artifact_role,
    form: entry.form,
    fields,
    location: relative(ROOT, path),
  };
}

function envelopeObservations(envelopes) {
  return envelopes.map((entry) => {
    const isDerivedPublication = ["per-page-derived-publication", "framed-header-html-projection", "deck-derived-publication"].includes(entry.form);
    return isDerivedPublication ? derivedPublicationEnvelopeObservation(entry) : directEnvelopeObservation(entry);
  }).filter(Boolean);
}

function pageDerivedDeclarations() {
  return envelopeDeclarations(yaml(join(SCHEMA_HOME, "serialization-contracts.yaml")));
}

function contractFieldObservations() {
  const assignments = [];
  const constantsCache = new Map();
  for (const root of ACTIVE_ROOTS) {
    for (const path of walk(root)) {
      const text = sourceText(path);
      const location = relative(ROOT, path);
      const testInput = location.startsWith("tests/") || location.startsWith("tests_e2e/");
      const constants = path.endsWith(".mjs") ? constantsIn(path, constantsCache) : new Map();
      for (const field of ["schema", "pipeline", "production_mode", "adapter", "scheme", "artifact_role"]) {
        for (const assignment of resolvedAssignments(text, field, constants)) {
          if (assignment.value === null) continue;
          const parserStart = text.lastIndexOf("parseDocument(", assignment.offset);
          const parserConfigured = field === "schema" && assignment.value === "core" &&
            parserStart >= 0 && assignment.offset - parserStart < 500;
          assignments.push({
            field: parserConfigured ? "yaml.parseDocument.schema" : field,
            value: assignment.value,
            intent: testInput ? "test-input" : "current-contract",
            ...(parserConfigured ? { semantic: "yaml-parser-core-schema" } : {}),
            location,
          });
        }
      }
    }
  }
  return assignments;
}

function envelopeDeclarations(inventory) {
  return (inventory.stage_artifact_envelopes || []).map((entry) => ({
    ...entry,
    location: "serialization-contracts.yaml",
  }));
}

function stateShapes(inventory) {
  const state = inventory.current_state_shape;
  const lease = state?.execution_lease;
  return [
    state && {
      name: state.name,
      value: state.name,
      owner: state.owner,
      anchors: state.anchors,
      required_fields: state.required_top_level_fields,
      location: "serialization-contracts.yaml",
    },
    lease && {
      name: lease.name,
      value: lease.value,
      owner: lease.owner,
      anchors: lease.anchors,
      required_fields: lease.required_fields,
      location: "serialization-contracts.yaml",
    },
  ].filter(Boolean);
}

function semanticExclusions(inventory) {
  return (inventory.semantic_exclusions || []).map((entry) => ({
    ...entry,
    location: "serialization-contracts.yaml",
  }));
}

function numericMarkerObservations() {
  const observations = [];
  const prohibited = /\b(schema_version|protocol_version|compiler_version|manifest_version|report_version|format_version|revision)\s*[:=]\s*([0-9]+)/g;
  const planGeneration = /\bplan_generation\s*[:=]/g;
  for (const root of ACTIVE_ROOTS) {
    for (const path of walk(root)) {
      const text = sourceText(path);
      const location = relative(ROOT, path);
      for (const match of text.matchAll(planGeneration)) {
        observations.push({
          field: "plan_generation",
          value: "style-master-plan-generation",
          scope: "exact-work-version-workflow",
          location,
        });
      }
      for (const match of text.matchAll(prohibited)) {
        observations.push({
          field: match[1],
          value: match[2],
          number: Number(match[2]),
          intent: location.startsWith("tests/") || location.startsWith("tests_e2e/") ? "expected-rejection" : "current-contract",
          location,
        });
      }
    }
  }
  return observations;
}

function currentSnapshot() {
  const inventory = yaml(join(SCHEMA_HOME, "serialization-contracts.yaml"));
  const stageNames = walk(join(SCHEMA_HOME, "stages"))
    .map((path) => yaml(path).schema)
    .filter(Boolean);
  const selectors = Object.entries(inventory.selectors || {}).map(([field, value]) => ({ field, value, location: "serialization-contracts.yaml" }));
  const wireSchemas = (inventory.wire_schema_groups || []).flatMap((group) =>
    (group.values || []).map((value) => ({ value, stage_ref: group.stage_ref, role: group.role, location: "serialization-contracts.yaml" })));
  const sharedContracts = inventory.shared_contracts || [];
  const envelopes = envelopeDeclarations(inventory);
  const states = stateShapes(inventory);
  const exclusions = semanticExclusions(inventory);
  const anchors = [
    ...sharedContracts.flatMap((entry) => entry.anchors || []),
    ...envelopes.flatMap((entry) => entry.anchors || []),
    ...states.flatMap((entry) => entry.anchors || []),
    ...exclusions.flatMap((entry) => entry.anchors || []),
  ].filter(sourceAnchorExists);
  const contractFields = [];
  const literalOccurrences = [];
  contractFields.push(...contractFieldObservations());
  const observedEnvelopes = envelopeObservations(envelopes);
  for (const root of ACTIVE_ROOTS) {
    for (const path of walk(root)) {
      const text = readFileSync(path, "utf8");
      for (const match of text.matchAll(VERSIONED_CONTRACT)) literalOccurrences.push({ value: match[0], location: relative(ROOT, path) });
    }
  }
  return {
    stage_names: stageNames,
    anchors,
    selectors,
    wire_schemas: wireSchemas,
    stage_artifact_envelopes: envelopes,
    shared_contracts: sharedContracts,
    state_shapes: states,
    semantic_exclusions: exclusions,
    contract_fields: contractFields,
    envelope_observations: observedEnvelopes,
    literal_occurrences: literalOccurrences,
    numeric_marker_occurrences: numericMarkerObservations(),
  };
}

function framedCompositionSnapshot(workflow = "framed") {
  const header_region = { x: 40, y: 28, width: 920, height: 238 };
  const canvas = { css_width: 1000, css_height: 562.5, capture_width: 2000, capture_height: 1125 };
  const reserved_header = {
    x: header_region.x / canvas.css_width,
    y: header_region.y / canvas.css_height,
    width: header_region.width / canvas.css_width,
    height: header_region.height / canvas.css_height,
  };
  const protected_composition = {
    coordinate_space: "normalized-canvas",
    reserved_header,
    body_safe: {
      x: 0,
      y: reserved_header.y + reserved_header.height,
      width: 1,
      height: 1 - reserved_header.y - reserved_header.height,
    },
  };
  if (workflow === "pure") {
    return {
      workflow,
      source_receipt: { subject_restrictions: "none" },
      presentation: { profile: { typography: "provider-owned" } },
      raw_contract: { provider_rendered_content: { header: { title: "Shared spelling" } } },
      provider_request: { provider_rendered_content: { items: [{ literal: "Shared spelling" }] } },
      provider_input_binding: { local_header_profile_sha256: null, protected_composition_sha256: null },
    };
  }
  return {
    workflow,
    source_receipt: { subject_restrictions: "no-identity-subject" },
    presentation: {
      profile: { canvas, header_region },
      protected_composition,
      provenance: { catalog: "catalog.yaml", defaults: "defaults.yaml", profile: "framed-header-profiles.yaml" },
    },
    raw_contract: {
      framed: {
        local_header: { title: "Shared spelling" },
        protected_composition,
        subject_restrictions: "no-identity-subject",
      },
    },
    provider_request: {
      protected_composition,
      subject_restrictions: "no-identity-subject",
      provider_rendered_content: { items: [{ literal: "Shared spelling" }] },
    },
    provider_input_binding: { protected_composition_sha256: "a".repeat(64) },
  };
}

function createActiveSurfaceFixture() {
  const root = mkdtempSync(join(tmpdir(), "pptmaker-active-surface-"));
  const write = (path, content) => {
    const target = join(root, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
    return target;
  };
  const v2 = ["v", "2"].join("");
  write("ppt_maker_harness/scripts/current.mjs", "export const current = true;\n");
  write("ppt_maker_harness/scripts/fonts/face.woff2", Buffer.from([0, 1, 2, 3]));
  write("tests/structural.mjs", `const versionPath = "3_versions/${v2}";\n`);
  write("tests_e2e/execution.mjs", `const requested_run_version = "v1"; const active_run_version = "${v2}"; const source = "current";\n`);
  write("openspec/specs/current/spec.md", "The requirement SHALL NOT migrate invalid production identity.\n");
  write("openspec/config.yaml", "schema: spec-driven\n");
  return { root, write };
}

describe("production schema conformance", () => {
  it("classifies active-surface residue semantically without a global version-token exception", () => {
    const retiredNumericMarker = ["v", "2"].join("");
    const retiredAction = [["unsupported", "protocol"].join("-"), "export"].join("/");
    const affirmativeVerb = ["migr", "ated"].join("");
    const result = evaluateActiveSurfaceResidue({
      entries: [
        { path: "tests/numeric.mjs", kind: "text", content: `const source_protocol = "${retiredNumericMarker}";` },
        { path: "tests/action.md", kind: "text", content: retiredAction },
        { path: "tests/claim.md", kind: "text", content: `Invalid production identity is ${affirmativeVerb} before use.` },
      ],
    });
    expect(result.issues.map((issue) => [issue.code, issue.path])).toEqual([
      ["retired-numeric-protocol-identity", "tests/numeric.mjs:1"],
      ["retired-protocol-action", "tests/action.md:1"],
      ["invalid-protocol-compatibility-claim", "tests/claim.md:1"],
    ]);

    const valid = evaluateActiveSurfaceResidue({
      entries: [
        { path: "tests/structural.mjs", kind: "text", content: `const versionPath = "3_versions/${retiredNumericMarker}";` },
        { path: "tests/execution.mjs", kind: "text", content: `const requested_run_version = "v1"; const active_run_version = "${retiredNumericMarker}"; const source = "current";` },
        { path: "tests/source-version.mjs", kind: "text", content: `const sourceVersion = "${retiredNumericMarker}";` },
        { path: "openspec/specs/current/spec.md", kind: "text", content: `The guard rejects the residue category where invalid production identity is ${affirmativeVerb}.` },
        { path: "ppt_maker_harness/scripts/current.mjs", kind: "text", content: "export const compatibility = true;" },
        { path: "ppt_maker_harness/scripts/fonts/face.woff2", kind: "binary" },
      ],
    });
    expect(valid).toEqual({ ok: true, issues: [] });
  });

  it("enumerates only declared active roots and fails unclassified coverage without writes or provider calls", () => {
    const fixture = createActiveSurfaceFixture();
    const repositoryConfig = readFileSync(join(ROOT, "openspec/config.yaml"), "utf8");
    const originalFetch = globalThis.fetch;
    let providerCalls = 0;
    try {
      globalThis.fetch = () => {
        providerCalls += 1;
        throw new Error("active-surface residue scanning must not contact a provider");
      };
      expect(scanActiveSurfaceResidue({ root: fixture.root })).toMatchObject({
        ok: true,
        issues: [],
        inventory: { text: 5, binary: 1 },
      });

      const unclassified = fixture.write("ppt_maker_harness/scripts/prompt-surface.prompt", "active text-like surface\n");
      expect(scanActiveSurfaceResidue({ root: fixture.root }).issues).toEqual(expect.arrayContaining([
        expect.objectContaining({
          code: "active-surface-extension-unclassified",
          path: "ppt_maker_harness/scripts/prompt-surface.prompt",
        }),
      ]));

      renameSync(unclassified, unclassified.replace(/\.prompt$/, ".txt"));
      expect(scanActiveSurfaceResidue({ root: fixture.root })).toMatchObject({ ok: true, issues: [] });
      expect(readFileSync(join(ROOT, "openspec/config.yaml"), "utf8")).toEqual(repositoryConfig);
    } finally {
      globalThis.fetch = originalFetch;
      rmSync(fixture.root, { recursive: true, force: true });
    }
    expect(providerCalls).toBe(0);
  });

  it("accepts the synchronized repository active surface", () => {
    const result = scanActiveSurfaceResidue();
    expect(result.issues, result.issues.map((issue) => `${issue.code}: ${issue.path} ${issue.message}`).join("\n")).toEqual([]);
  });

  it("matches the declared active source, test, and E2E contract surface", () => {
    const result = evaluateProductionSchemaConformance(currentSnapshot());
    expect(result.issues, result.issues.map((issue) => `${issue.code}: ${issue.path} ${issue.message}`).join("\n")).toEqual([]);
  });

  it("detects undeclared contract fields, numeric Harness markers, and version-suffixed literals", () => {
    const snapshot = currentSnapshot();
    snapshot.contract_fields.push({ field: "schema", value: "page-image-hidden-contract", location: "synthetic" });
    snapshot.literal_occurrences.push({ value: ["page-image-workflow", "v9"].join("-"), location: "synthetic" });
    snapshot.numeric_marker_occurrences.push({ field: "schema_version", value: "9", number: 9, intent: "current-contract", location: "synthetic" });
    const result = evaluateProductionSchemaConformance(snapshot);
    expect(result.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      "contract-field-undeclared",
      "numeric-harness-marker-undeclared",
      "version-suffixed-production-literal",
    ]));
  });

  it("treats accepted-spec fields as current contract consumers", () => {
    const snapshot = currentSnapshot();
    snapshot.contract_fields.push({
      field: "schema",
      value: "undeclared-spec-contract",
      intent: "current-contract",
      location: "openspec/specs/production-schema-conformance/spec.md",
    });
    expect(evaluateProductionSchemaConformance(snapshot).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: "contract-field-undeclared",
        path: "openspec/specs/production-schema-conformance/spec.md",
      }),
    ]));
  });

  it("rejects missing anchors and invalid physical envelope forms", () => {
    const snapshot = currentSnapshot();
    snapshot.anchors = snapshot.anchors.filter((anchor) => !anchor.endsWith("#parsePageImageSource"));
    snapshot.envelope_observations[0] = {
      ...snapshot.envelope_observations[0],
      form: "wrong-physical-form",
    };
    const codes = evaluateProductionSchemaConformance(snapshot).issues.map((issue) => issue.code);
    expect(codes).toEqual(expect.arrayContaining([
      "contract-anchor-missing",
      "artifact-envelope-undeclared",
      "artifact-envelope-unobserved",
    ]));
  });

  it("declares presentation contracts only as materialized layout config", () => {
    const inventory = yaml(join(SCHEMA_HOME, "serialization-contracts.yaml"));
    const layoutConfig = inventory.wire_schema_groups.find((group) => group.stage_ref === "layout-config");
    const visualLanguage = inventory.wire_schema_groups.find((group) => group.stage_ref === "visual-language");

    expect(layoutConfig).toMatchObject({ role: "version-presentation-source" });
    expect(layoutConfig.values).toEqual(PAGE_IMAGE_PRESENTATION_CONTRACTS);
    expect(visualLanguage.values).not.toContain("pptmaker-pure-deck-visual-system");
    expect(inventory.selectors).not.toHaveProperty("framed_header_preset");

    for (const stage of ["page-source", "layout-config", "page-layout"]) {
      const definition = yaml(join(SCHEMA_HOME, "stages", `${stage}.yaml`));
      expect(definition).toMatchObject({ schema: stage, producer_status: "materialized" });
      expect(definition).not.toHaveProperty("route_ref");
    }
  });

  it("evaluates Framed and Pure derived-publication chains without becoming a runtime validator", () => {
    const stages = [
      ["page-source-receipt", "parsed-source"],
      ["page-layout", "resolved-presentation"],
      ["page-render-model", "reviewable-page"],
      ["page-generation-spec", "compiled-page-facts"],
      ["image2-request", "provider-input"],
      ["page-artifact-index", "page-derived-index"],
    ];
    const page = (slide_id, { framed = false } = {}) => ({
      slide_id,
      artifacts: [
        ...stages,
        ...(framed ? [["framed-header-html", "local-header-overlay"]] : []),
      ].map(([schema, artifact_role]) => ({
        schema,
        artifact_role,
        page: { slide_id },
        producer: "scripts/shared/image2/page_derived_data.mjs",
        upstream_bindings: { source_sha256: "a".repeat(64) },
        invalidated_by: { source_sha256: "a".repeat(64) },
      })),
    });
    expect(evaluatePageDerivedPublicationConformance({ workflow: "framed", pages: [page("FrameGo", { framed: true })], stage_artifact_envelopes: pageDerivedDeclarations() }).issues).toEqual([]);
    expect(evaluatePageDerivedPublicationConformance({ workflow: "pure", pages: [page("PureGo")], stage_artifact_envelopes: pageDerivedDeclarations() }).issues).toEqual([]);

    const invalid = page("PureGo", { framed: true });
    invalid.artifacts[0].schema = "undeclared-stage";
    delete invalid.artifacts[1].upstream_bindings;
    invalid.artifacts[2].page.slide_id = "OtherGo";
    const codes = evaluatePageDerivedPublicationConformance({ workflow: "pure", pages: [invalid], stage_artifact_envelopes: pageDerivedDeclarations() }).issues.map((issue) => issue.code);
    expect(codes).toEqual(expect.arrayContaining([
      "page-derived-schema-undeclared",
      "page-derived-provenance-missing",
      "page-derived-identity-mixed",
      "page-derived-framed-artifact-on-pure",
    ]));
  });

  it("checks Framed composition ownership from synthetic data without provider or runtime access", () => {
    expect(evaluateFramedCompositionConformance(framedCompositionSnapshot()).issues).toEqual([]);
    expect(evaluateFramedCompositionConformance(framedCompositionSnapshot("pure")).issues).toEqual([]);

    const invalidSource = framedCompositionSnapshot();
    invalidSource.source_receipt.subject_restrictions = "no-robot";
    expect(evaluateFramedCompositionConformance(invalidSource).issues.map((issue) => issue.code))
      .toContain("framed-composition-source-restriction-invalid");

    const malformedComposition = framedCompositionSnapshot();
    malformedComposition.presentation.protected_composition.body_safe.width = 0.9;
    expect(evaluateFramedCompositionConformance(malformedComposition).issues.map((issue) => issue.code))
      .toContain("framed-composition-protected-composition-invalid");

    const localHeaderLeak = framedCompositionSnapshot();
    localHeaderLeak.provider_request.local_header = { title: "Shared spelling" };
    expect(evaluateFramedCompositionConformance(localHeaderLeak).issues.map((issue) => issue.code))
      .toContain("framed-composition-request-local-header");

    const legacyGeometry = framedCompositionSnapshot();
    legacyGeometry.presentation.profile.protected_geometry = [];
    expect(evaluateFramedCompositionConformance(legacyGeometry).issues.map((issue) => issue.code))
      .toContain("framed-composition-legacy-geometry");

    const pureLeak = framedCompositionSnapshot("pure");
    pureLeak.provider_request.protected_composition = framedCompositionSnapshot().presentation.protected_composition;
    expect(evaluateFramedCompositionConformance(pureLeak).issues.map((issue) => issue.code))
      .toContain("pure-framed-composition-binding");
  });
});
