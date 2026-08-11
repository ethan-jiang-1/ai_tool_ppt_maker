import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { parseDocument } from "yaml";
import { describe, expect, it } from "vitest";

import { evaluatePageDerivedPublicationConformance, evaluateProductionSchemaConformance } from "../../ppt_maker_harness/scripts/contracts/harness_architecture.mjs";

const ROOT = process.cwd();
const HARNESS = join(ROOT, "ppt_maker_harness");
const SCHEMA_HOME = join(HARNESS, "schema");
const ACTIVE_ROOTS = [HARNESS, join(ROOT, "tests"), join(ROOT, "tests_e2e")];
const TEXT_FILE = /\.(?:mjs|md|json|yaml)$/;
const CONTRACT_VALUE = /^(?:page-image|pptmaker|image2-page|mnemonic|standard)(?:-|$)/;
const VERSIONED_CONTRACT = /\b(?:page-image|pptmaker|image2-page|mnemonic|standard)[a-z0-9-]*-v[1-9][0-9]*\b/g;
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

function fieldAssignments(path, text) {
  const fields = [];
  const quoted = /["']?(schema|pipeline|mode|adapter|scheme)["']?\s*[:=]\s*["']([a-z][a-z0-9-]*)["']/g;
  const yamlBare = /(?:^|\n)\s*(schema|pipeline|mode|adapter|scheme)\s*:\s*([a-z][a-z0-9-]*)\b/gm;
  for (const pattern of [quoted, yamlBare]) {
    for (const match of text.matchAll(pattern)) {
      if (CONTRACT_VALUE.test(match[2])) fields.push({ field: match[1], value: match[2], location: relative(ROOT, path) });
    }
  }
  return fields;
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
  const anchors = sharedContracts.flatMap((entry) => entry.anchors || []).filter(sourceAnchorExists);
  const contractFields = [];
  const literalOccurrences = [];
  for (const root of ACTIVE_ROOTS) {
    for (const path of walk(root)) {
      const text = readFileSync(path, "utf8");
      contractFields.push(...fieldAssignments(path, text));
      for (const match of text.matchAll(VERSIONED_CONTRACT)) literalOccurrences.push({ value: match[0], location: relative(ROOT, path) });
    }
  }
  return {
    stage_names: stageNames,
    anchors,
    selectors,
    wire_schemas: wireSchemas,
    shared_contracts: sharedContracts,
    contract_fields: contractFields,
    literal_occurrences: literalOccurrences,
  };
}

describe("production schema conformance", () => {
  it("matches the declared active source, test, and E2E contract surface", () => {
    const result = evaluateProductionSchemaConformance(currentSnapshot());
    expect(result.issues, result.issues.map((issue) => `${issue.code}: ${issue.path} ${issue.message}`).join("\n")).toEqual([]);
  });

  it("detects an undeclared Page Image field and a version-suffixed literal", () => {
    const snapshot = currentSnapshot();
    snapshot.contract_fields.push({ field: "schema", value: "page-image-hidden-contract", location: "synthetic" });
    snapshot.literal_occurrences.push({ value: ["page-image-workflow", "v9"].join("-"), location: "synthetic" });
    const result = evaluateProductionSchemaConformance(snapshot);
    expect(result.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      "contract-field-undeclared",
      "version-suffixed-production-literal",
    ]));
  });

  it("declares C4 presentation contracts only as materialized layout config", () => {
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

  it("evaluates Framed and Pure C5 chains without becoming a runtime validator", () => {
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
      ].map(([stage, role]) => ({
        stage,
        role,
        page: { slide_id },
        producer: "scripts/shared/image2/page_derived_data.mjs",
        upstream_bindings: { source_sha256: "a".repeat(64) },
        invalidated_by: { source_sha256: "a".repeat(64) },
      })),
    });
    expect(evaluatePageDerivedPublicationConformance({ workflow: "framed", pages: [page("FrameGo", { framed: true })] }).issues).toEqual([]);
    expect(evaluatePageDerivedPublicationConformance({ workflow: "pure", pages: [page("PureGo")] }).issues).toEqual([]);

    const invalid = page("PureGo", { framed: true });
    invalid.artifacts[0].stage = "undeclared-stage";
    delete invalid.artifacts[1].upstream_bindings;
    invalid.artifacts[2].page.slide_id = "OtherGo";
    const codes = evaluatePageDerivedPublicationConformance({ workflow: "pure", pages: [invalid] }).issues.map((issue) => issue.code);
    expect(codes).toEqual(expect.arrayContaining([
      "page-derived-stage-undeclared",
      "page-derived-provenance-missing",
      "page-derived-identity-mixed",
      "page-derived-framed-artifact-on-pure",
    ]));
  });
});
