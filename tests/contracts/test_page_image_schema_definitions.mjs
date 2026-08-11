import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";

const SCHEMA_ROOT = join(process.cwd(), "ppt_maker_harness", "schema");
const STAGES_ROOT = join(SCHEMA_ROOT, "stages");
const SERIALIZATION_CONTRACTS = join(SCHEMA_ROOT, "serialization-contracts.yaml");
const UNVERSIONED_IDENTIFIER = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const EXPECTED_STAGE_NAMES = [
  "story-outline",
  "visual-language",
  "design-constraints",
  "layout-config",
  "page-source",
  "page-source-receipt",
  "page-layout",
  "page-render-model",
  "page-generation-spec",
  "image2-request",
  "framed-header-html",
  "page-artifact-index",
  "image-generation-plan",
  "image-generation-record",
  "page-review-decision",
  "final-page-list",
  "delivery-package",
  "visual-style-candidates",
  "production-progress-state",
].sort();
const EXPECTED_ROUTE_IDS = ["C1", "C2", "C3", "C4", "C5", "C6", "C7"];
const REQUIRED_ROUTE_FIELDS = [
  "id",
  "work",
  "execution_kind",
  "responsibility",
  "boundary",
  "exit_evidence",
];
const REPAIR_GUIDANCE_FIELDS = ["means", "ask", "never"];

function parseYamlFile(path) {
  return parseYaml(readFileSync(path, "utf8"));
}

function visit(value, path, callback) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => visit(entry, [...path, index], callback));
    return;
  }
  if (!value || typeof value !== "object") return;
  callback(value, path);
  for (const [key, child] of Object.entries(value)) visit(child, [...path, key], callback);
}

function formatPath(path) {
  return path.length ? path.join(".") : "<root>";
}

function walkFiles(root, files = []) {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) walkFiles(path, files);
    else if (entry.isFile() && path.endsWith(".mjs")) files.push(path);
  }
  return files;
}

describe("Page Image schema definitions", () => {
  it("keeps the exact conceptual stage set and filename/schema identity", () => {
    const stageNames = readdirSync(STAGES_ROOT, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".yaml"))
      .map((entry) => entry.name.slice(0, -".yaml".length))
      .sort();

    expect(stageNames).toEqual(EXPECTED_STAGE_NAMES);
    for (const name of stageNames) {
      const definition = parseYamlFile(join(STAGES_ROOT, `${name}.yaml`));
      expect(definition?.schema, `${name}.yaml declares its conceptual schema`).toBe(name);
    }
  });

  it("gives every constrained field complete Deck Author repair guidance", () => {
    const failures = [];

    for (const name of EXPECTED_STAGE_NAMES) {
      const file = join(STAGES_ROOT, `${name}.yaml`);
      visit(parseYamlFile(file), [], (value, path) => {
        if (!Object.hasOwn(value, "rule")) return;
        for (const field of REPAIR_GUIDANCE_FIELDS) {
          if (typeof value.on_violation?.[field] !== "string" || !value.on_violation[field].trim()) {
            failures.push(`${name}.yaml:${formatPath(path)} is missing on_violation.${field}`);
          }
        }
      });
    }

    expect(failures).toEqual([]);
  });

  it("keeps C1-C7 complete and resolves every planned producer", () => {
    const route = parseYamlFile(join(SCHEMA_ROOT, "recovery-route.yaml"));
    const labels = Array.isArray(route?.labels) ? route.labels : [];
    const labelsById = new Map(labels.map((entry) => [entry?.id, entry]));
    const failures = [];

    expect(labels.map((entry) => entry?.id)).toEqual(EXPECTED_ROUTE_IDS);
    for (const [id, entry] of labelsById) {
      for (const field of REQUIRED_ROUTE_FIELDS) {
        if (typeof entry?.[field] !== "string" || !entry[field].trim()) {
          failures.push(`recovery-route.yaml:${id ?? "<unknown>"} is missing ${field}`);
        }
      }
    }

    for (const [file, definition] of [
      ["flow.yaml", parseYamlFile(join(SCHEMA_ROOT, "flow.yaml"))],
      ...EXPECTED_STAGE_NAMES.map((name) => [`stages/${name}.yaml`, parseYamlFile(join(STAGES_ROOT, `${name}.yaml`))]),
    ]) {
      visit(definition, [], (value, path) => {
        if (value.producer_status !== "planned") return;
        if (typeof value.route_ref !== "string" || !labelsById.has(value.route_ref)) {
          failures.push(`${file}:${formatPath(path)} has an unresolved planned-producer route_ref`);
        }
      });
    }

    expect(failures).toEqual([]);
  });

  it("declares only the two normalized standard Page Class defaults", () => {
    const defaults = [];

    for (const name of EXPECTED_STAGE_NAMES) {
      visit(parseYamlFile(join(STAGES_ROOT, `${name}.yaml`)), [], (value, path) => {
        if (Object.hasOwn(value, "default")) defaults.push({ stage: name, path: formatPath(path), value: value.default });
      });
    }

    expect(defaults).toEqual([
      { stage: "layout-config", path: "fields.page_class", value: "standard" },
      { stage: "page-source", path: "fields.page_class", value: "standard" },
    ]);
  });

  it("materializes C4 ownership while keeping C5 per-page publication planned", () => {
    const flow = parseYamlFile(join(SCHEMA_ROOT, "flow.yaml"));
    const flowEntries = [
      ...(flow?.sources || []),
      ...(flow?.transformations || []),
    ];
    const planned = flowEntries.filter((entry) => entry.route_ref === "C5");
    const materializedC4 = flowEntries.filter((entry) =>
      entry.schema === "layout-config" || entry.name === "resolve-page-layout");
    const scriptFiles = walkFiles(join(process.cwd(), "ppt_maker_harness", "scripts"));
    const runtimeText = scriptFiles
      .filter((path) => !path.endsWith("shared/run-bundle/bundle_layout.mjs"))
      .filter((path) => !path.endsWith("01-content/internal/narrative_source.mjs"))
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");
    const stateText = readFileSync(join(process.cwd(), "ppt_maker_harness", "scripts", "shared", "state", "state.mjs"), "utf8");
    const cliText = readFileSync(join(process.cwd(), "ppt_maker_harness", "scripts", "ppt_flow.mjs"), "utf8");

    expect(planned.length).toBeGreaterThan(0);
    expect(planned.every((entry) => entry.producer_status === "planned" && entry.route_ref === "C5")).toBe(true);
    expect(materializedC4).toHaveLength(2);
    expect(materializedC4.every((entry) => entry.producer_status === "materialized" && !Object.hasOwn(entry, "route_ref"))).toBe(true);
    expect(runtimeText).toMatch(/\bpage_class\b/);
    expect(stateText).not.toMatch(/\bpage_class\b|\b(?:layout-config|page-layout|page-render-model|page-artifact-index)\b/);
    expect(cliText).not.toMatch(/\bpage_class\b|\b(?:layout-config|page-layout|page-render-model|page-artifact-index)\b/);
  });

  it("makes the serialization inventory the one current contract declaration", () => {
    const inventory = parseYamlFile(SERIALIZATION_CONTRACTS);
    const selectors = Object.values(inventory?.selectors || {});
    const sharedContracts = inventory?.shared_contracts || [];
    const wireGroups = inventory?.wire_schema_groups || [];
    const wireValues = wireGroups.flatMap((group) => group.values || []);

    expect(inventory).toMatchObject({
      schema_home: "page-image-production-definitions",
      authority: "active-serialization-contracts",
      execution: "non-executable",
    });
    expect([...selectors, ...sharedContracts.map((entry) => entry.value), ...wireValues].every(
      (value) => typeof value === "string" && UNVERSIONED_IDENTIFIER.test(value),
    )).toBe(true);
    expect(wireGroups.every((group) =>
      EXPECTED_STAGE_NAMES.includes(group.stage_ref) &&
      typeof group.role === "string" && group.role.length > 0 &&
      Array.isArray(group.values) && group.values.length > 0,
    )).toBe(true);
    expect(new Set(wireValues).size).toBe(wireValues.length);
    expect(new Set(sharedContracts.map((entry) => entry.name)).size).toBe(sharedContracts.length);
    expect(sharedContracts.every((entry) =>
      typeof entry.field === "string" && entry.field.length > 0 &&
      Array.isArray(entry.anchors) && entry.anchors.length > 0,
    )).toBe(true);
    expect(existsSync(join(SCHEMA_ROOT, "frozen-identifiers.yaml"))).toBe(false);
  });
});
