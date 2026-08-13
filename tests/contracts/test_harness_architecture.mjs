import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { EXECUTABLE_INVENTORY } from "../../ppt_maker_harness/scripts/contracts/executable_inventory.mjs";
import {
  ACTIVE_FOUNDATION_METHOD_MODULES,
  HUMAN_NAVIGATION_INTERFACE,
  PAGE_DERIVED_DATA_INTERFACE,
  PAGE_IMAGE_CORE_INTERFACE,
  PAGE_IMAGE_CORE_SEAM_CONSUMERS,
  PAGE_IMAGE_PROVIDER_INPUT_COMPILER_ADAPTERS,
  PAGE_IMAGE_PROVIDER_INPUT_COMPILER_SCHEMA_BY_ADAPTER,
  FOUNDATION_METHOD_MODULE_ADJACENCY,
  PUBLIC_SHARED_INTERFACES,
  TARGET_DELIVERY_INTERFACES,
  TARGET_ITERATION_INTERFACES,
  TARGET_WORKFLOW_INTERFACES,
  collectLiteralImports,
  evaluateFramedCompositionConformance,
  evaluateProductionSchemaConformance,
  validateArchitectureSnapshot,
  validateRepositoryArchitecture,
} from "../../ppt_maker_harness/scripts/contracts/harness_architecture.mjs";

const REQUIRED_CONTRACTS = [
  "contracts/canonical_json.mjs",
  "contracts/executable_inventory.mjs",
  "contracts/harness_architecture.mjs",
  "contracts/harness_coherence.mjs",
  "contracts/harness_document_command_audit.mjs",
];

function ownerFor(path) {
  if (path === "ppt_flow.mjs") return "root";
  if (path.startsWith("shared/")) return path.split("/").slice(0, 2).join("/");
  if (path.startsWith("contracts/")) return "contracts";
  return path.split("/")[0];
}

function canonicalSnapshot() {
  const files = {
    "README.md": "target tree",
  };
  const interfaces = [
    ...ACTIVE_FOUNDATION_METHOD_MODULES.map((module) => `${module}/index.mjs`),
    ...TARGET_WORKFLOW_INTERFACES,
    ...TARGET_DELIVERY_INTERFACES,
    ...TARGET_ITERATION_INTERFACES,
    ...PUBLIC_SHARED_INTERFACES,
    ...REQUIRED_CONTRACTS,
  ];
  for (const path of interfaces) files[path] = "export const importSafe = true;\n";
  for (const path of TARGET_WORKFLOW_INTERFACES) {
    files[path] = `import "../${PAGE_IMAGE_CORE_INTERFACE}";\nconst providerInput = { schema: "${PAGE_IMAGE_PROVIDER_INPUT_COMPILER_SCHEMA_BY_ADAPTER[path]}" };\nexport const importSafe = true;\n`;
  }
  for (const path of EXECUTABLE_INVENTORY) {
    const prefix = path.includes("/") ? path.slice(0, path.lastIndexOf("/") + 1).split("/").map(() => "..").join("/") : "./";
    files[path] = `import "${prefix}shared/cli/cli_bootstrap.mjs?entry=${path}";\n` +
      (path.startsWith("00-setup/") ? `import "./index.mjs";\n` : "") +
      (path.startsWith("05-iteration/") ? `import "../../index.mjs";\n` : "");
  }
  files["ppt_flow.mjs"] = `import "./shared/cli/cli_bootstrap.mjs?entry=ppt_flow.mjs";\nimport("./00-setup/index.mjs");\n`;
  const grouped = new Map();
  for (const path of interfaces) {
    const owner = ownerFor(path);
    if (!grouped.has(owner)) grouped.set(owner, { owner, interfaces: [], executables: [], unit_integration: [], e2e: [] });
    grouped.get(owner).interfaces.push(path);
  }
  for (const path of EXECUTABLE_INVENTORY) {
    const owner = ownerFor(path);
    if (!grouped.has(owner)) grouped.set(owner, { owner, interfaces: [], executables: [], unit_integration: [], e2e: [] });
    grouped.get(owner).executables.push(path);
  }
  for (const entry of grouped.values()) {
    const testPath = `tests/${entry.owner}/test_interface.mjs`;
    entry.unit_integration.push(testPath);
    files[testPath] = "// owned synthetic test\n";
    for (const field of ["interfaces", "executables", "unit_integration", "e2e"]) entry[field].sort();
  }
  return { files, manifest: { schema: "pptmaker-source-test-ownership", owners: [...grouped.values()].sort((a, b) => a.owner.localeCompare(b.owner)) } };
}

function issueCodes(result) {
  return result.issues.map((issue) => issue.code);
}

function walkHarnessScripts(root, files = []) {
  for (const name of readdirSync(root)) {
    const path = join(root, name);
    if (statSync(path).isDirectory()) walkHarnessScripts(path, files);
    else if (path.endsWith(".mjs")) files.push(path);
  }
  return files;
}

describe("Harness architecture contract", () => {
  it("registers the one provider-free derived-publication writer as a public shared interface", () => {
    expect(PAGE_DERIVED_DATA_INTERFACE).toBe("shared/image2/page_derived_data.mjs");
    expect(PUBLIC_SHARED_INTERFACES).toContain(PAGE_DERIVED_DATA_INTERFACE);
  });

  it("registers the one derived Human Navigation Path writer as a public shared interface", () => {
    expect(HUMAN_NAVIGATION_INTERFACE).toBe("shared/image2/page_image_human_artifact_reference.mjs");
    expect(PUBLIC_SHARED_INTERFACES).toContain(HUMAN_NAVIGATION_INTERFACE);
  });

  it("accepts the exact target tree, executable registry, and ownership manifest", () => {
    const result = validateArchitectureSnapshot(canonicalSnapshot());
    expect(result.issues).toEqual([]);
    expect(result.detectedExecutables).toEqual([...EXECUTABLE_INVENTORY].sort());
  });

  it("pins active foundation method modules and rejects retired numbered owners", () => {
    expect(FOUNDATION_METHOD_MODULE_ADJACENCY).toEqual({
      "00-setup": [],
      "01-content": [],
      "02-visual-system": [],
    });
    const snapshot = canonicalSnapshot();
    snapshot.files["04-image-production/cli.mjs"] = "export {};";
      expect(issueCodes(validateArchitectureSnapshot(snapshot))).toContain("retired-numbered-owner");
  });

  it("rejects old paths, scripts/lib, generic roots, and root business dumping", () => {
    for (const [path, code] of [
      ["lib/old.mjs", "retired-lib"],
      ["utils/misc.mjs", "generic-root"],
      ["visual_config.mjs", "old-flat-path"],
    ]) {
      const snapshot = canonicalSnapshot();
      snapshot.files[path] = "export {};";
      expect(issueCodes(validateArchitectureSnapshot(snapshot)), path).toContain(code);
    }
  });

  it("parses static, export-from, and literal dynamic imports while ignoring computed imports", () => {
    expect(collectLiteralImports(`import x from "./a.mjs"; export { y } from './b.mjs'; import("./c.mjs"); import(path);`)).toEqual([
      "./a.mjs", "./b.mjs", "./c.mjs",
    ]);
  });

  it("rejects forbidden foundation method-module, shared, core, and cross-adapter private edges", () => {
    const cases = [
      ["03-framed-image/index.mjs", `import "../shared/image2/private.mjs";`, "target-private-shared-import"],
    ];
    for (const [path, source, code] of cases) {
      const snapshot = canonicalSnapshot();
      snapshot.files[path] = source;
      if (source.includes("private.mjs")) snapshot.files["01-content/internal/private.mjs"] = "export {};";
      if (path.includes("03-framed-image")) snapshot.files["shared/image2/private.mjs"] = "export {};";
      expect(issueCodes(validateArchitectureSnapshot(snapshot)), `${path} -> ${code}`).toContain(code);
    }
  });

  it("rejects Framed/Pure semantic branches in shared mechanics and delivery", () => {
    for (const [path, source] of [
      ["shared/image2/page_image_raw_mechanics.mjs", `if (workflow === "framed") return null;`],
      ["shared/image2/page_image_final_manifest.mjs", `if (ownerWorkflow !== "pure") return null;`],
      ["05-delivery/index.mjs", `switch (manifest.workflow) { case "framed": return null; }`],
    ]) {
      const snapshot = canonicalSnapshot();
      snapshot.files[path] = source;
      expect(issueCodes(validateArchitectureSnapshot(snapshot)), path).toContain("shared-workflow-semantic-branch");
    }
  });

  it("rejects imports between target workflow siblings", () => {
    for (const [path, imported] of [
      ["03-framed-image/index.mjs", "../04-pure-image/index.mjs"],
      ["03-framed-image/index.mjs", "../04-pure-image/internal/private.mjs"],
      ["04-pure-image/index.mjs", "../03-framed-image/index.mjs"],
      ["04-pure-image/index.mjs", "../03-framed-image/internal/private.mjs"],
    ]) {
      const snapshot = canonicalSnapshot();
      snapshot.files[path] = `import "${imported}";`;
      if (imported.includes("internal/private")) {
        const sibling = imported.includes("04-pure") ? "04-pure-image" : "03-framed-image";
        snapshot.files[`${sibling}/internal/private.mjs`] = "export {};";
      }
      expect(issueCodes(validateArchitectureSnapshot(snapshot)), `${path} -> ${imported}`).toContain("sibling-workflow-import");
    }
  });

  it("requires one shared Page Image Core seam for both selected adapters", () => {
    expect(PUBLIC_SHARED_INTERFACES).toContain(PAGE_IMAGE_CORE_INTERFACE);
    expect(PAGE_IMAGE_CORE_SEAM_CONSUMERS).toEqual([
      "01-content/internal/page_image_source.mjs",
      "03-framed-image/index.mjs",
      "04-pure-image/index.mjs",
    ]);

    const missing = canonicalSnapshot();
    missing.files["04-pure-image/index.mjs"] = "export const importSafe = true;\n";
    expect(issueCodes(validateArchitectureSnapshot(missing))).toContain("page-image-core-adapter-missing");

    const illegal = canonicalSnapshot();
    illegal.files["shared/image2/page_image_target_runtime.mjs"] = `import "../page-image/page_image_core.mjs";`;
    expect(issueCodes(validateArchitectureSnapshot(illegal))).toContain("page-image-core-illegal-consumer");
  });

  it("confines Page Image provider-input compilation to selected adapters", () => {
    expect(PAGE_IMAGE_PROVIDER_INPUT_COMPILER_ADAPTERS).toEqual(TARGET_WORKFLOW_INTERFACES);

    const missing = canonicalSnapshot();
    missing.files["04-pure-image/index.mjs"] = `import "../${PAGE_IMAGE_CORE_INTERFACE}";\nexport const importSafe = true;\n`;
    expect(issueCodes(validateArchitectureSnapshot(missing))).toContain("page-image-provider-input-compiler-missing");

    const sharedCompiler = canonicalSnapshot();
    sharedCompiler.files["shared/image2/page_image_target_runtime.mjs"] = `const providerInput = { schema: "page-image-pure-provider-input" };`;
    expect(issueCodes(validateArchitectureSnapshot(sharedCompiler))).toContain("page-image-provider-input-illegal-compiler");

    const siblingCompiler = canonicalSnapshot();
    siblingCompiler.files["04-pure-image/index.mjs"] += `\nconst wrongPolicy = { schema: "page-image-framed-provider-input" };`;
    expect(issueCodes(validateArchitectureSnapshot(siblingCompiler))).toContain("page-image-provider-input-illegal-compiler");

    const rootAssembly = canonicalSnapshot();
    rootAssembly.files["ppt_flow.mjs"] += `\nconst prompt = { provider_rendered_content: [] };`;
    expect(issueCodes(validateArchitectureSnapshot(rootAssembly))).toContain("root-page-image-prompt-assembly");
  });

  it("allows iteration to use target public interfaces but rejects target sibling internals", () => {
    const allowed = canonicalSnapshot();
    allowed.files["06-iteration/index.mjs"] = [
      `import "../03-framed-image/index.mjs";`,
      `import "../04-pure-image/index.mjs";`,
      `import "../05-delivery/index.mjs";`,
    ].join("\n");
    expect(issueCodes(validateArchitectureSnapshot(allowed))).not.toContain("iteration-private-sibling-import");

    for (const [path, imported] of [
      ["06-iteration/index.mjs", "../03-framed-image/internal/text_frame.mjs"],
      ["06-iteration/index.mjs", "../04-pure-image/internal/private.mjs"],
      ["06-iteration/index.mjs", "../05-delivery/internal/notes_runtime.mjs"],
    ]) {
      const snapshot = canonicalSnapshot();
      snapshot.files[path] = `import "${imported}";`;
      if (imported.includes("03-framed-image/internal/text_frame")) snapshot.files["03-framed-image/internal/text_frame.mjs"] = "export {};";
      if (imported.includes("04-pure-image/internal/private")) snapshot.files["04-pure-image/internal/private.mjs"] = "export {};";
      if (imported.includes("05-delivery/internal/notes_runtime")) snapshot.files["05-delivery/internal/notes_runtime.mjs"] = "export {};";
      expect(issueCodes(validateArchitectureSnapshot(snapshot)), `${path} -> ${imported}`).toContain("iteration-private-sibling-import");
    }
  });

  it("keeps all PPTX and notes writers under the delivery owner", () => {
    const snapshot = canonicalSnapshot();
    snapshot.files["03-framed-image/internal/operations.mjs"] = "import PptxGenJS from 'pptxgenjs'; new PptxGenJS();";
    expect(issueCodes(validateArchitectureSnapshot(snapshot))).toContain("second-delivery-owner");
    snapshot.files["06-iteration/index.mjs"] = "injectNotes();";
    expect(issueCodes(validateArchitectureSnapshot(snapshot))).toContain("second-delivery-owner");
  });

  it("evaluates serialization declarations without file or YAML access", () => {
    const valid = {
      stage_names: ["page-source-receipt"],
      anchors: ["scripts/01-content/internal/page_image_source.mjs#PAGE_IMAGE_WORKFLOW_SOURCE_RECEIPT_SCHEMA"],
      selectors: [{ value: "page-image-workflow" }],
      wire_schemas: [{ value: "page-source-receipt", stage_ref: "page-source-receipt", role: "parsed-source" }],
      stage_artifact_envelopes: [{
        stage_ref: "page-source-receipt",
        artifact_role: "parsed-source",
        form: "source-receipt",
        producer: "scripts/01-content/internal/page_image_source.mjs",
        anchors: ["scripts/01-content/internal/page_image_source.mjs#PAGE_IMAGE_WORKFLOW_SOURCE_RECEIPT_SCHEMA"],
        required_fields: ["schema", "artifact_role", "pipeline"],
      }],
      shared_contracts: [{ name: "run-bundle-locator", value: "pptmaker-run-bundle", field: "schema", anchors: ["scripts/01-content/internal/page_image_source.mjs#PAGE_IMAGE_WORKFLOW_SOURCE_RECEIPT_SCHEMA"] }],
      state_shapes: [{ name: "md-controller-state", owner: "scripts/shared/state/state.mjs", anchors: ["scripts/01-content/internal/page_image_source.mjs#PAGE_IMAGE_WORKFLOW_SOURCE_RECEIPT_SCHEMA"], required_fields: ["pipeline"] }],
      semantic_exclusions: [],
      contract_fields: [{ field: "pipeline", value: "page-image-workflow" }],
      envelope_observations: [{ schema: "page-source-receipt", artifact_role: "parsed-source", form: "source-receipt", fields: ["schema", "artifact_role", "pipeline"] }],
      literal_occurrences: [{ value: "page-image-workflow" }],
      numeric_marker_occurrences: [],
    };
    expect(evaluateProductionSchemaConformance(valid)).toEqual({ ok: true, issues: [] });
  });

  it("evaluates Framed composition snapshots without file, YAML, provider, or lifecycle access", () => {
    const reserved_header = { x: 0.04, y: 28 / 562.5, width: 0.92, height: 238 / 562.5 };
    const snapshot = {
      workflow: "framed",
      source_receipt: { subject_restrictions: "none" },
      presentation: {
        profile: {
          canvas: { css_width: 1000, css_height: 562.5, capture_width: 2000, capture_height: 1125 },
          header_region: { x: 40, y: 28, width: 920, height: 238 },
        },
        protected_composition: {
          coordinate_space: "normalized-canvas",
          reserved_header,
          body_safe: { x: 0, y: reserved_header.y + reserved_header.height, width: 1, height: 1 - reserved_header.y - reserved_header.height },
        },
        provenance: { catalog: "catalog", defaults: "defaults", profile: "profile" },
      },
      raw_contract: { framed: { protected_composition: null, subject_restrictions: "none" } },
      provider_request: { protected_composition: null, subject_restrictions: "none", provider_rendered_content: { items: [{ literal: "Header spelling remains provider-owned here" }] } },
      provider_input_binding: { protected_composition_sha256: "a".repeat(64) },
    };
    snapshot.raw_contract.framed.protected_composition = snapshot.presentation.protected_composition;
    snapshot.provider_request.protected_composition = snapshot.presentation.protected_composition;
    expect(evaluateFramedCompositionConformance(snapshot)).toEqual({ ok: true, issues: [] });
    snapshot.provider_request.context_not_to_render = { title: "Forbidden" };
    expect(issueCodes(evaluateFramedCompositionConformance(snapshot))).toContain("framed-composition-request-local-header");
  });

  it("reports invalid stage roles, missing anchors, undeclared fields, and suffixes", () => {
    const result = evaluateProductionSchemaConformance({
      stage_names: [],
      anchors: [],
      wire_schemas: [{ value: "page-image-record", stage_ref: "missing-stage", role: "" }],
      stage_artifact_envelopes: [{ stage_ref: "missing-stage", artifact_role: "", form: "", producer: "", anchors: [], required_fields: [] }],
      shared_contracts: [{ name: "locator", value: "pptmaker-run-bundle", field: "schema", anchors: ["missing#anchor"] }],
      state_shapes: [{ name: "", owner: "", anchors: [], required_fields: [] }],
      semantic_exclusions: [{ name: "broken", field: "", values: [], meaning: "" }],
      contract_fields: [{ field: "schema", value: "undeclared-contract" }],
      envelope_observations: [{ schema: "missing-stage", artifact_role: "missing-role", form: "missing-form", fields: [] }],
      literal_occurrences: [{ value: ["page-image-workflow", "v7"].join("-") }],
      numeric_marker_occurrences: [{ field: "schema_version", value: "7", number: 7, intent: "current-contract" }],
    });
    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      "wire-stage-role-invalid",
      "contract-anchor-missing",
      "contract-field-undeclared",
      "stage-artifact-envelope-invalid",
      "artifact-envelope-undeclared",
      "semantic-exclusion-invalid",
      "numeric-harness-marker-undeclared",
      "version-suffixed-production-literal",
    ]));
    expect(evaluateProductionSchemaConformance({}).issues.map((issue) => issue.code))
      .toContain("contract-snapshot-incomplete");
  });

  it("fails closed on executable, recursive test, and source ownership drift", () => {
    const missingCli = canonicalSnapshot();
    delete missingCli.files[EXECUTABLE_INVENTORY[1]];
    expect(issueCodes(validateArchitectureSnapshot(missingCli))).toContain("executable-inventory");

    const flatTest = canonicalSnapshot();
    flatTest.files["tests/test_business.mjs"] = "// forbidden flat suite";
    expect(issueCodes(validateArchitectureSnapshot(flatTest))).toContain("flat-test");

    const missingOwner = canonicalSnapshot();
    missingOwner.manifest.owners.find((entry) => entry.owner === "00-setup").interfaces = [];
    expect(issueCodes(validateArchitectureSnapshot(missingOwner))).toContain("missing-interface-owner");
  });

  it("keeps the pre-install CLI closure free of external packages", () => {
    for (const path of [
      "ppt_maker_harness/scripts/contracts/executable_inventory.mjs",
      "ppt_maker_harness/scripts/shared/cli/cli_bootstrap.mjs",
      "ppt_maker_harness/scripts/shared/cli/cli_error.mjs",
    ]) {
      const imports = collectLiteralImports(readFileSync(path, "utf8"));
      expect(imports.filter((specifier) => !specifier.startsWith(".") && !specifier.startsWith("node:")), path).toEqual([]);
    }
  });

  it("keeps presentation selection in Visual Config with no retired control path", () => {
    const harnessRoot = join(process.cwd(), "ppt_maker_harness");
    const retiredTokens = /FRAME PRESET|frame_preset|framed_header_preset|pure-deck-visual-system-v1|pure_deck_visual_system_v1/i;
    const occurrences = walkHarnessScripts(join(harnessRoot, "scripts"))
      .flatMap((path) => retiredTokens.test(readFileSync(path, "utf8")) ? [relative(process.cwd(), path)] : []);
    expect(occurrences).toEqual([]);

    const resolver = readFileSync(join(harnessRoot, "scripts", "02-visual-system", "internal", "page_image_presentation.mjs"), "utf8");
    const framedAdapter = readFileSync(join(harnessRoot, "scripts", "03-framed-image", "index.mjs"), "utf8");
    const pureAdapter = readFileSync(join(harnessRoot, "scripts", "04-pure-image", "index.mjs"), "utf8");
    const overlay = readFileSync(join(harnessRoot, "scripts", "03-framed-image", "internal", "header_overlay.mjs"), "utf8");

    expect(resolver).toContain("PAGE_IMAGE_PRESENTATION_FILES");
    expect(resolver).toContain('Object.hasOwn(value, "revision")');
    expect(framedAdapter).toContain("resolvePageImagePresentation");
    expect(pureAdapter).toContain("resolvePageImagePresentation");
    expect(overlay).not.toMatch(/standard/);
  });

  it("enforces the final architecture against the real repository tree", () => {
    const result = validateRepositoryArchitecture(process.cwd());
    expect(result.issues, result.issues.map((issue) => `${issue.code}: ${issue.path} ${issue.message}`).join("\n")).toEqual([]);
  });

});
