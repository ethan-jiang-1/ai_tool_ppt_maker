import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  evaluateHarnessAuthorityMap,
  evaluateRepositoryHarnessAuthorityMap,
  extractNodeCommands,
  parseHarnessCapabilityRegistryContext,
  scanHarnessCoherence,
  scanMarkdownLinks,
  scanSemanticDrift,
  validateDiagnosticAuthorityPointers,
  validateExceptionMap,
  validatePseudocodeMarkers,
  validateTerminologyAuthorityPointers,
} from "../../ppt_maker_harness/scripts/contracts/harness_coherence.mjs";
import { validateDocumentedCommands } from "../../ppt_maker_harness/scripts/contracts/harness_document_command_audit.mjs";

const CRITICAL_FILES = [
  "ppt_maker_harness/BOOTSTRAP.md",
  "ppt_maker_harness/charter/AGENT_CONTRACT.md",
  "ppt_maker_harness/AGENTS.md",
  "ppt_maker_harness/README.md",
  "ppt_maker_harness/COMMANDS.md",
  "ppt_maker_harness/charter/CONSTITUTION.md",
  "ppt_maker_harness/charter/WORKFLOW.md",
  "ppt_maker_harness/reference/glossary.md",
];

const VALID_AUTHORITY_MAP = Object.freeze({
  registry: {
    capabilities: [{
      id: "harness-charter",
      spec: "openspec/specs/harness-charter/spec.md",
      scope: "active Harness guidance",
      owner_paths: [
        "ppt_maker_harness/charter/AGENT_CONTRACT.md",
        "ppt_maker_harness/scripts/contracts/harness_coherence.mjs",
      ],
    }],
  },
  capabilities: ["harness-charter"],
  repositoryFiles: [
    "ppt_maker_harness/charter/AGENT_CONTRACT.md",
    "ppt_maker_harness/schema/flow.yaml",
    "ppt_maker_harness/scripts/01-content/index.mjs",
    "ppt_maker_harness/scripts/README.md",
    "ppt_maker_harness/scripts/contracts/harness_coherence.mjs",
    "ppt_maker_harness/scripts/01-content/internal/page_image_source.mjs",
  ],
  repositoryDirectories: ["ppt_maker_harness/schema"],
  registeredScriptSurfaces: [
    "ppt_maker_harness/scripts/contracts/harness_coherence.mjs",
  ],
});

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function authorityCodes(snapshot) { return evaluateHarnessAuthorityMap(snapshot).issues.map((item) => item.rule); }

function registryContext(body) {
  return [
    "before registry",
    "<!-- harness-capability-registry:start -->",
    body,
    "<!-- harness-capability-registry:end -->",
    "after registry",
  ].join("\n");
}

describe("Harness documentation coherence", () => {
  it("evaluates a closed authority map without mutating its direct facts", () => {
    const snapshot = clone(VALID_AUTHORITY_MAP);
    const before = clone(snapshot);
    expect(evaluateHarnessAuthorityMap(snapshot)).toEqual({ ok: true, issues: [] });
    expect(snapshot).toEqual(before);
  });

  it("rejects capability identity and record-shape drift before dependent owner claims", () => {
    const cases = [
      ["missing", (snapshot) => { snapshot.registry.capabilities = []; }, "authority-capability-missing"],
      ["extra", (snapshot) => { snapshot.registry.capabilities.push({ id: "extra-owner", spec: "openspec/specs/extra-owner/spec.md", scope: "extra" }); }, "authority-capability-extra"],
      ["duplicate", (snapshot) => { snapshot.registry.capabilities.push(clone(snapshot.registry.capabilities[0])); }, "authority-registry-duplicate-id"],
      ["malformed", (snapshot) => { snapshot.registry.capabilities[0].extra = "not allowed"; }, "authority-registry-shape"],
      ["mismatched spec", (snapshot) => { snapshot.registry.capabilities[0].spec = "openspec/specs/other/spec.md"; }, "authority-registry-spec"],
    ];
    for (const [, mutate, expected] of cases) {
      const snapshot = clone(VALID_AUTHORITY_MAP);
      snapshot.registry.capabilities[0].owner_paths = ["ppt_maker_harness/missing.md"];
      mutate(snapshot);
      const codes = authorityCodes(snapshot);
      expect(codes).toContain(expected);
      expect(codes).not.toContain("authority-owner-missing");
    }
  });

  it("rejects forbidden, unregistered, unadmitted, and missing owner claims", () => {
    const cases = [
      ["glob", "ppt_maker_harness/charter/*.md", "authority-owner-forbidden"],
      ["main spec", "openspec/specs/harness-charter/spec.md", "authority-owner-forbidden"],
      ["missing", "ppt_maker_harness/charter/MISSING.md", "authority-owner-missing"],
      ["unregistered script", "ppt_maker_harness/scripts/01-content/index.mjs", "authority-owner-script-unregistered"],
      ["private implementation", "ppt_maker_harness/scripts/01-content/internal/page_image_source.mjs", "authority-owner-forbidden"],
      ["unadmitted document", "ppt_maker_harness/scripts/README.md", "authority-owner-unadmitted"],
      ["directory", "ppt_maker_harness/schema", "authority-owner-directory"],
    ];
    for (const [, ownerPath, expected] of cases) {
      const snapshot = clone(VALID_AUTHORITY_MAP);
      snapshot.registry.capabilities[0].owner_paths = [ownerPath];
      const codes = authorityCodes(snapshot);
      expect(codes).toContain(expected);
    }

    const documentation = clone(VALID_AUTHORITY_MAP);
    documentation.registry.capabilities[0].owner_paths = ["ppt_maker_harness/schema/flow.yaml"];
    expect(evaluateHarnessAuthorityMap(documentation)).toEqual({ ok: true, issues: [] });

    const duplicate = clone(VALID_AUTHORITY_MAP);
    duplicate.registry.capabilities[0].owner_paths.push("ppt_maker_harness/charter/AGENT_CONTRACT.md");
    expect(authorityCodes(duplicate)).toContain("authority-owner-duplicate");

    const withoutOwners = clone(VALID_AUTHORITY_MAP);
    withoutOwners.registry.capabilities[0].owner_paths = [];
    expect(evaluateHarnessAuthorityMap(withoutOwners)).toEqual({ ok: true, issues: [] });
  });

  it("parses exactly one closed capability-registry payload before evaluating claims", () => {
    const body = [
      "capabilities:",
      "  - id: harness-charter",
      "    spec: openspec/specs/harness-charter/spec.md",
      "    scope: active Harness guidance",
    ].join("\n");
    expect(parseHarnessCapabilityRegistryContext(registryContext(body))).toMatchObject({
      registry: {
        capabilities: [{ id: "harness-charter" }],
      },
      issues: [],
    });
    expect(parseHarnessCapabilityRegistryContext("no registry").issues.map((item) => item.rule))
      .toContain("authority-registry-marker");
    expect(parseHarnessCapabilityRegistryContext(`${registryContext(body)}\n<!-- harness-capability-registry:start -->`).issues.map((item) => item.rule))
      .toContain("authority-registry-marker");
    expect(parseHarnessCapabilityRegistryContext(registryContext("capabilities: [")).issues.map((item) => item.rule))
      .toContain("authority-registry-yaml");
  });

  it("adapts checked-in authority facts and rejects planted post-cutover registry drift", () => {
    const configPath = "openspec/config.yaml";
    const original = readFileSync(configPath, "utf8");
    expect(evaluateRepositoryHarnessAuthorityMap({ configText: original })).toEqual({ ok: true, issues: [] });

    const cases = [
      ["missing marker", original.replace("<!-- harness-capability-registry:start -->", ""), "authority-registry-marker"],
      ["repeated marker", original.replace("<!-- harness-capability-registry:end -->", "<!-- harness-capability-registry:start -->\n  <!-- harness-capability-registry:end -->"), "authority-registry-marker"],
      ["malformed payload", original.replace("capabilities:\n", "capabilities: [\n"), "authority-registry-yaml"],
      ["missing capability", original.replace("id: workflow-inspection", "id: workflow-observation"), "authority-capability-missing"],
      ["extra capability", original.replace(
        "<!-- harness-capability-registry:end -->",
        [
          "  - id: unbacked-authority",
          "      spec: openspec/specs/unbacked-authority/spec.md",
          "      scope: planted post-cutover authority drift",
          "  <!-- harness-capability-registry:end -->",
        ].join("\n"),
      ), "authority-capability-extra"],
    ];
    for (const [, configText, expected] of cases) {
      expect(evaluateRepositoryHarnessAuthorityMap({ configText }).issues.map((item) => item.rule)).toContain(expected);
    }
    expect(evaluateRepositoryHarnessAuthorityMap({ configText: original })).toEqual({ ok: true, issues: [] });
  });

  it("keeps the current entry documents available", () => {
    for (const file of CRITICAL_FILES) expect(existsSync(file), file).toBe(true);
  });

  it("rejects broken links, stale commands, and broad exceptions", () => {
    expect(scanMarkdownLinks("/tmp/a/doc.md", "[bad](missing.md)")).toHaveLength(1);
    expect(scanSemanticDrift("doc.md", "Stage 2 uses image2-ppt skill")).toHaveLength(1);
    expect(scanSemanticDrift("doc.md", "phase: 04").some((item) => item.rule === "hierarchy-ambiguity")).toBe(false);
    expect(scanSemanticDrift("doc.md", "目录 = Stage").some((item) => item.rule === "hierarchy-ambiguity")).toBe(true);
    expect(validateExceptionMap({ "ppt_maker_harness/workflow/": "broad" })).toHaveLength(1);
    const commands = extractNodeCommands("doc.md", "```bash\nnode ppt_maker_harness/scripts/ppt_flow.mjs validate x --unexpected\n```");
    expect(validateDocumentedCommands(commands, "ppt_maker_harness/scripts").some((item) => item.rule === "unsupported-flag")).toBe(true);
  });

  it("requires an adjacent reasoned pseudocode marker for non-executable commands", () => {
    const text = `<!-- coherence:pseudocode reason="illustrative placeholder" -->\n\n\`\`\`bash\nnode scripts/fake.mjs --fake\n\`\`\``;
    expect(extractNodeCommands("doc.md", text)).toEqual([]);
    expect(validatePseudocodeMarkers("doc.md", text)).toEqual([]);
  });

  it("keeps CLI producer and MD consumer authority routes discoverable", () => {
    const cliSpec = readFileSync("openspec/specs/cli-surface/spec.md", "utf8");
    expect(cliSpec).toMatch(/closed, audited command inventory\s+unified entry\s+point/);
    expect(validateDiagnosticAuthorityPointers()).toEqual([]);
  });

  it("keeps terminology and authority claims scoped to their active owners", () => {
    expect(validateTerminologyAuthorityPointers()).toEqual([]);
    const root = process.cwd();
    const context = readFileSync("CONTEXT.md", "utf8");
    const bootstrap = readFileSync("ppt_maker_harness/BOOTSTRAP.md", "utf8");
    const agentContract = readFileSync("ppt_maker_harness/charter/AGENT_CONTRACT.md", "utf8");
    expect(context).not.toContain("**HTML Production**");
    expect(context).not.toContain("reviewed visual-slot asset");
    expect(context).toContain("The current whole-page Page Image Workflow capability family.");
    expect(bootstrap).toContain("Reserved Header Region");
    expect(bootstrap).toContain("Provider Avoidance Constraint");
    expect(agentContract).toContain("`html-render-runtime`");
    expect(agentContract).toContain("receipt-bound Framed Page\nImage finalization");
    expect(validateTerminologyAuthorityPointers({
      root,
      readFile: (path, encoding) => path.endsWith("CONTEXT.md")
        ? `${readFileSync(path, encoding)}\n**HTML Production**`
        : readFileSync(path, encoding),
    }).some((item) => item.rule === "terminology-authority")).toBe(true);
    expect(validateTerminologyAuthorityPointers({
      root,
      readFile: (path, encoding) => path.endsWith("CONTEXT.md")
        ? `${readFileSync(path, encoding)}\nwhole-deck renderer`
        : readFileSync(path, encoding),
    }).some((item) => item.rule === "terminology-authority")).toBe(true);
  });

  it("keeps workflow-selection fact homes free of full restatements", () => {
    const nonHomeFiles = [
      "AGENTS.md",
      "ppt_maker_harness/AGENTS.md",
      "ppt_maker_harness/README.md",
      "ppt_maker_harness/charter/WORKFLOW.md",
      "ppt_maker_harness/workflow/00-setup/04-conventions.md",
      "ppt_maker_harness/workflow/README.md",
    ];
    for (const file of nonHomeFiles) {
      const text = readFileSync(file, "utf8");
      expect(text, `${file} must point to the fact home instead of restating the production_identity binding`).not.toContain("production_identity");
      expect(text, `${file} must reference the workflow-selection fact home`).toMatch(/NODE-SPEC\.md|node-specification/);
    }
    expect(readFileSync("ppt_maker_harness/charter/NODE-SPEC.md", "utf8")).toContain("production_identity");
  });

  it("keeps current guidance and main specifications free of retired protocol prose", () => {
    const issues = scanHarnessCoherence();
    expect(issues, issues.map((item) => `${item.file}:${item.line} [${item.rule}] ${item.message}`).join("\n")).toEqual([]);
  }, 30_000);
});
