import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  extractNodeCommands,
  scanFrameworkCoherence,
  scanMarkdownLinks,
  scanRetiredWholePageTerms,
  scanSemanticDrift,
  validateDiagnosticAuthorityPointers,
  validateExceptionMap,
  validateLegacyTokenExceptions,
  validatePseudocodeMarkers,
  validateRetiredWholePageTokenExceptions,
} from "../../PPTMAKER_FRAMEWORK/scripts/contracts/framework_coherence.mjs";
import { validateDocumentedCommands } from "../../PPTMAKER_FRAMEWORK/scripts/contracts/framework_document_command_audit.mjs";

const CRITICAL_FILES = [
  "PPTMAKER_FRAMEWORK/BOOTSTRAP.md",
  "PPTMAKER_FRAMEWORK/charter/AGENT_CONTRACT.md",
  "PPTMAKER_FRAMEWORK/AGENTS.md",
  "PPTMAKER_FRAMEWORK/README.md",
  "PPTMAKER_FRAMEWORK/COMMANDS.md",
  "PPTMAKER_FRAMEWORK/charter/CONSTITUTION.md",
  "PPTMAKER_FRAMEWORK/charter/WORKFLOW.md",
  "PPTMAKER_FRAMEWORK/reference/glossary.md",
];

describe("framework documentation coherence", () => {
  it("keeps the current entry documents available", () => {
    for (const file of CRITICAL_FILES) expect(existsSync(file), file).toBe(true);
  });

  it("rejects broken links, stale commands, broad exceptions, and retired protocol terms", () => {
    expect(scanMarkdownLinks("/tmp/a/doc.md", "[bad](missing.md)")).toHaveLength(1);
    expect(scanSemanticDrift("doc.md", "Stage 2 uses image2-ppt skill")).toHaveLength(1);
    expect(validateExceptionMap({ "PPTMAKER_FRAMEWORK/workflow/": "broad" })).toHaveLength(1);
    expect(validateLegacyTokenExceptions([{}])).not.toEqual([]);
    expect(validateRetiredWholePageTokenExceptions([{}])).not.toEqual([]);
    const retired = ["whole", "page", "image2", "v1"].join("-");
    expect(scanRetiredWholePageTerms({ "PPTMAKER_FRAMEWORK/playbook/example.md": retired }))
      .toEqual(expect.arrayContaining([expect.objectContaining({ rule: "retired-protocol-term" })]));
    const commands = extractNodeCommands("doc.md", "```bash\nnode PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs validate x --unexpected\n```");
    expect(validateDocumentedCommands(commands, "PPTMAKER_FRAMEWORK/scripts").some((item) => item.rule === "unsupported-flag")).toBe(true);
  });

  it("requires an adjacent reasoned pseudocode marker for non-executable commands", () => {
    const text = `<!-- coherence:pseudocode reason="illustrative placeholder" -->\n\n\`\`\`bash\nnode scripts/fake.mjs --fake\n\`\`\``;
    expect(extractNodeCommands("doc.md", text)).toEqual([]);
    expect(validatePseudocodeMarkers("doc.md", text)).toEqual([]);
  });

  it("keeps CLI producer and MD consumer authority routes discoverable", () => {
    const cliSpec = readFileSync("openspec/specs/cli-surface/spec.md", "utf8");
    expect(cliSpec).toMatch(/fixed 14-command unified entry\s+point/);
    expect(validateDiagnosticAuthorityPointers()).toEqual([]);
  });

  it("keeps current guidance and main specifications free of retired protocol prose", () => {
    const issues = scanFrameworkCoherence();
    expect(issues, issues.map((item) => `${item.file}:${item.line} [${item.rule}] ${item.message}`).join("\n")).toEqual([]);
  }, 30_000);
});
