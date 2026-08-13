import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  extractNodeCommands,
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

describe("Harness documentation coherence", () => {
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
    expect(cliSpec).toMatch(/fixed 12-command unified entry\s+point/);
    expect(validateDiagnosticAuthorityPointers()).toEqual([]);
  });

  it("keeps terminology and authority claims scoped to their active owners", () => {
    expect(validateTerminologyAuthorityPointers()).toEqual([]);
    const root = process.cwd();
    const context = readFileSync("CONTEXT.md", "utf8");
    const bootstrap = readFileSync("ppt_maker_harness/BOOTSTRAP.md", "utf8");
    expect(context).not.toContain("**HTML Production**");
    expect(context).not.toContain("reviewed visual-slot asset");
    expect(bootstrap).toContain("Reserved Header Region");
    expect(bootstrap).toContain("Provider Avoidance Constraint");
    expect(validateTerminologyAuthorityPointers({
      root,
      readFile: (path, encoding) => path.endsWith("CONTEXT.md")
        ? `${readFileSync(path, encoding)}\n**HTML Production**`
        : readFileSync(path, encoding),
    }).some((item) => item.rule === "terminology-authority")).toBe(true);
  });

  it("keeps current guidance and main specifications free of retired protocol prose", () => {
    const issues = scanHarnessCoherence();
    expect(issues, issues.map((item) => `${item.file}:${item.line} [${item.rule}] ${item.message}`).join("\n")).toEqual([]);
  }, 30_000);
});
