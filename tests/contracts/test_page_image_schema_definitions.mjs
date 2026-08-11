import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";

const SCHEMA_ROOT = join(process.cwd(), "ppt_maker_harness", "schema");
const STAGES_ROOT = join(SCHEMA_ROOT, "stages");
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
});
