import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import {
  extractNodeCommands,
  scanFrameworkCoherence,
  scanMarkdownLinks,
  scanSemanticDrift,
  validateDocumentedCommands,
  validateDiagnosticAuthorityPointers,
  validateExceptionMap,
  validatePseudocodeMarkers,
} from "../PPTMAKER_FRAMEWORK/scripts/lib/framework_coherence.mjs";

const CRITICAL_FILES = [
  "PPTMAKER_FRAMEWORK/BOOTSTRAP.md",
  "PPTMAKER_FRAMEWORK/charter/AGENT_CONTRACT.md",
  "PPTMAKER_FRAMEWORK/AGENTS.md",
  "PPTMAKER_FRAMEWORK/README.md",
  "PPTMAKER_FRAMEWORK/COMMANDS.md",
  "PPTMAKER_FRAMEWORK/charter/CONSTITUTION.md",
  "PPTMAKER_FRAMEWORK/charter/WORKFLOW.md",
  "PPTMAKER_FRAMEWORK/reference/quick-start.md",
  "PPTMAKER_FRAMEWORK/reference/glossary.md",
  "PPTMAKER_FRAMEWORK/reference/anti-patterns.md",
];

describe("framework documentation coherence", () => {
  it("critical entry documents exist", () => {
    for (const file of CRITICAL_FILES) expect(existsSync(file), file).toBe(true);
  });

  it("fixtures catch links, paths, version drift, hierarchy ambiguity, title routing, flags, and broad exceptions", () => {
    expect(scanMarkdownLinks("/tmp/a/doc.md", "[bad](missing.md)")).toHaveLength(1);
    expect(scanSemanticDrift("doc.md", "Stage 2 走 image2-ppt skill")).toHaveLength(1);
    expect(scanSemanticDrift("doc.md", "版本快照 = 完整复制").some((item) => item.rule === "complete-copy-version")).toBe(true);
    expect(scanSemanticDrift("doc.md", "### 三个宏观 Phase").some((item) => item.rule === "hierarchy-ambiguity")).toBe(true);
    expect(scanSemanticDrift("doc.md", "标题 → Chain A").some((item) => item.rule === "render-unaware-title")).toBe(true);
    expect(scanSemanticDrift("openspec/config.yaml", "分类参照: PPTMAKER_FRAMEWORK/automation/change-classifier.md").some((item) => item.rule === "old-path")).toBe(true);
    expect(scanSemanticDrift("doc.md", "Stage 2 不依赖 .claude/skills")).toEqual([]);
    expect(validateExceptionMap({ "PPTMAKER_FRAMEWORK/workflow/": "broad" })).toHaveLength(1);
    const commands = extractNodeCommands("doc.md", "```bash\nnode PPTMAKER_FRAMEWORK/scripts/stage3_lock_headers.mjs --run-dir x\n```");
    expect(validateDocumentedCommands(commands, "PPTMAKER_FRAMEWORK/scripts").some((item) => item.rule === "unsupported-flag")).toBe(true);
  });

  it("requires an adjacent reasoned pseudocode marker for non-executable commands", () => {
    const text = `<!-- coherence:pseudocode reason="illustrative placeholder" -->\n\n\`\`\`bash\nnode scripts/fake.mjs --fake\n\`\`\``;
    expect(extractNodeCommands("doc.md", text)).toEqual([]);
    expect(validatePseudocodeMarkers("doc.md", text)).toEqual([]);
    expect(validatePseudocodeMarkers("doc.md", '<!-- coherence:pseudocode reason="" -->\n```bash\nnode scripts/fake.mjs\n```')).toHaveLength(1);
    expect(validatePseudocodeMarkers("doc.md", '<!-- coherence:pseudocode reason="two examples" -->\n```bash\nnode scripts/a.mjs\nnode scripts/b.mjs\n```')).toHaveLength(1);
  });

  it("keeps CLI producer and MD consumer authority routes discoverable", () => {
    expect(validateDiagnosticAuthorityPointers()).toEqual([]);
  });

  it("the complete active framework has no coherence violations", () => {
    const issues = scanFrameworkCoherence();
    expect(issues, issues.map((item) => `${item.file}:${item.line} [${item.rule}] ${item.message} -> ${item.hint}`).join("\n")).toEqual([]);
  }, 30000);
});
