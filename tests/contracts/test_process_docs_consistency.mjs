import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  extractNodeCommands,
  scanHarnessCoherence,
  scanMarkdownLinks,
  scanRetiredWholePageTerms,
  scanSemanticDrift,
  validateDiagnosticAuthorityPointers,
  validateExceptionMap,
  validateLegacyTokenExceptions,
  validatePseudocodeMarkers,
  validateRetiredWholePageTokenExceptions,
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

  it("rejects broken links, stale commands, broad exceptions, and retired protocol terms", () => {
    expect(scanMarkdownLinks("/tmp/a/doc.md", "[bad](missing.md)")).toHaveLength(1);
    expect(scanSemanticDrift("doc.md", "Stage 2 uses image2-ppt skill")).toHaveLength(1);
    expect(validateExceptionMap({ "ppt_maker_harness/workflow/": "broad" })).toHaveLength(1);
    expect(validateLegacyTokenExceptions([{}])).not.toEqual([]);
    expect(validateRetiredWholePageTokenExceptions([{}])).not.toEqual([]);
    const retired = ["whole", "page", "image2", "v1"].join("-");
    expect(scanRetiredWholePageTerms({ "ppt_maker_harness/playbook/example.md": retired }))
      .toEqual(expect.arrayContaining([expect.objectContaining({ rule: "retired-protocol-term" })]));
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

  it("keeps current guidance and main specifications free of retired protocol prose", () => {
    const issues = scanHarnessCoherence();
    expect(issues, issues.map((item) => `${item.file}:${item.line} [${item.rule}] ${item.message}`).join("\n")).toEqual([]);
  }, 30_000);
});
