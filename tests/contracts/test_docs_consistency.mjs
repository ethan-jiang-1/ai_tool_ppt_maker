import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import {
  extractNodeCommands,
  scanFrameworkCoherence,
  scanMarkdownLinks,
  scanSemanticDrift,
  validateDiagnosticAuthorityPointers,
  validateExceptionMap,
  validateLegacyTokenExceptions,
  validatePseudocodeMarkers,
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
  "PPTMAKER_FRAMEWORK/reference/quick-start.md",
  "PPTMAKER_FRAMEWORK/reference/glossary.md",
  "PPTMAKER_FRAMEWORK/reference/anti-patterns.md",
];

const GIT_GUIDANCE_CORPUS = [
  "PPTMAKER_FRAMEWORK/README.md",
  "PPTMAKER_FRAMEWORK/AGENTS.md",
  "PPTMAKER_FRAMEWORK/BOOTSTRAP.md",
  "PPTMAKER_FRAMEWORK/charter/AGENT_CONTRACT.md",
  "PPTMAKER_FRAMEWORK/COMMANDS.md",
  "PPTMAKER_FRAMEWORK/scripts/05-iteration/change-classifier.md",
  "PPTMAKER_FRAMEWORK/workflow/00-setup/00-run-bundle-concept.md",
  "PPTMAKER_FRAMEWORK/workflow/00-setup/04-conventions.md",
  "PPTMAKER_FRAMEWORK/workflow/00-setup/README.md",
  "PPTMAKER_FRAMEWORK/workflow/00-setup/template-deck-guide.md",
  "PPTMAKER_FRAMEWORK/workflow/02-visual-system/04-validate-the-html-system.md",
  "PPTMAKER_FRAMEWORK/workflow/03-html-production/05-stage-5-inject-speaker-notes.md",
  "PPTMAKER_FRAMEWORK/workflow/05-iteration/README.md",
  "PPTMAKER_FRAMEWORK/workflow/05-iteration/02-visual-system-iteration.md",
  "PPTMAKER_FRAMEWORK/reference/glossary.md",
];

describe("framework documentation coherence", () => {
  it("critical entry documents exist", () => {
    for (const file of CRITICAL_FILES) expect(existsSync(file), file).toBe(true);
  });

  it("fixtures catch links, paths, version drift, hierarchy ambiguity, refresh routing, flags, and broad exceptions", () => {
    expect(scanMarkdownLinks("/tmp/a/doc.md", "[bad](missing.md)")).toHaveLength(1);
    expect(scanSemanticDrift("doc.md", "Stage 2 走 image2-ppt skill")).toHaveLength(1);
    expect(scanSemanticDrift("doc.md", "版本快照 = 完整复制").some((item) => item.rule === "complete-copy-version")).toBe(true);
    expect(scanSemanticDrift("doc.md", "### 三个宏观 Phase").some((item) => item.rule === "hierarchy-ambiguity")).toBe(true);
    expect(scanSemanticDrift("doc.md", "标题 → Chain A").some((item) => item.rule === "legacy-edit-path")).toBe(true);
    expect(scanSemanticDrift("openspec/config.yaml", "分类参照: PPTMAKER_FRAMEWORK/automation/change-classifier.md").some((item) => item.rule === "old-path")).toBe(true);
    expect(scanSemanticDrift("doc.md", "Stage 2 不依赖 .claude/skills")).toEqual([]);
    expect(validateExceptionMap({ "PPTMAKER_FRAMEWORK/workflow/": "broad" })).toHaveLength(1);
    expect(validateLegacyTokenExceptions([{ token: "image2-*", file: "PPTMAKER_FRAMEWORK/", reason: "broad", owner: "bad", public_compatibility: true, retire_by: "later" }]).length).toBeGreaterThan(0);
    const commands = extractNodeCommands("doc.md", "```bash\nnode PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/stage3_lock_headers.mjs --run-dir x\n```");
    expect(validateDocumentedCommands(commands, "PPTMAKER_FRAMEWORK/scripts").some((item) => item.rule === "unsupported-flag")).toBe(true);
  });

  it("enforces the controlled refresh-path terminology boundary", () => {
    const canonical = "Header Text & Style Refresh / Generated Image Rebuild / Notes-Only Refresh / Structural Versioning Path";
    expect(scanSemanticDrift("doc.md", canonical)).toEqual([]);
    expect(scanSemanticDrift(
      "PPTMAKER_FRAMEWORK/reference/glossary.md",
      "Header Text & Style Refresh (formerly Chain A)",
    )).toEqual([]);
    expect(scanSemanticDrift(
      "PPTMAKER_FRAMEWORK/reference/glossary.md",
      "Chain A: Stage 1,3,4,5",
    ).some((item) => item.rule === "unpaired-legacy-alias")).toBe(true);
    expect(scanSemanticDrift(
      "PPTMAKER_FRAMEWORK/playbook/edit-text.md",
      "Header text and overlay style use Header Text & Style Refresh.",
    )).toEqual([]);
    expect(scanSemanticDrift(
      "PPTMAKER_FRAMEWORK/playbook/edit-text.md",
      "A safe-zone or render-mode change uses Header Text & Style Refresh.",
    ).some((item) => item.rule === "raw-contract-header-route")).toBe(true);
    expect(scanSemanticDrift(
      "PPTMAKER_FRAMEWORK/playbook/edit-text.md",
      "Chain B rebuilds the selected image.",
    ).some((item) => item.rule === "legacy-edit-path")).toBe(true);
    expect(scanSemanticDrift(
      "PPTMAKER_FRAMEWORK/playbook/migrate-import.md",
      "Option A: import source. Option B: preserve layout. Option C: rebuild.",
    )).toEqual([]);
    expect(scanSemanticDrift(
      "PPTMAKER_FRAMEWORK/COMMANDS.md",
      "Add a slide: Generated Image Rebuild.",
    ).some((item) => item.rule === "structural-bypass")).toBe(true);
    expect(scanSemanticDrift(
      "PPTMAKER_FRAMEWORK/COMMANDS.md",
      "KPI and chart data use Header Text & Style Refresh.",
    ).some((item) => item.rule === "image-owned-header-route")).toBe(true);
    expect(scanSemanticDrift(
      "PPTMAKER_FRAMEWORK/scripts/README.md",
      "raw unified_pipeline --only automatically forces regeneration.",
    ).some((item) => item.rule === "only-implies-force")).toBe(true);
  });

  it("requires an adjacent reasoned pseudocode marker for non-executable commands", () => {
    const text = `<!-- coherence:pseudocode reason="illustrative placeholder" -->\n\n\`\`\`bash\nnode scripts/fake.mjs --fake\n\`\`\``;
    expect(extractNodeCommands("doc.md", text)).toEqual([]);
    expect(validatePseudocodeMarkers("doc.md", text)).toEqual([]);
    expect(validatePseudocodeMarkers("doc.md", '<!-- coherence:pseudocode reason="" -->\n```bash\nnode scripts/fake.mjs\n```')).toHaveLength(1);
    expect(validatePseudocodeMarkers("doc.md", '<!-- coherence:pseudocode reason="two examples" -->\n```bash\nnode scripts/a.mjs\nnode scripts/b.mjs\n```')).toHaveLength(1);
  });

  it("keeps CLI producer and MD consumer authority routes discoverable", () => {
    const cliSpec = readFileSync("openspec/specs/cli-surface/spec.md", "utf8");
    expect(cliSpec).toMatch(/fixed 15-command unified entry point/);
    expect(validateDiagnosticAuthorityPointers()).toEqual([]);
  });

  it("keeps stable identity and renderer authorization guidance aligned", () => {
    const docs = [
      "PPTMAKER_FRAMEWORK/playbook/restructure-slides.md",
      "PPTMAKER_FRAMEWORK/charter/NODE-SPEC.md",
      "PPTMAKER_FRAMEWORK/charter/AGENT_CONTRACT.md",
      "PPTMAKER_FRAMEWORK/COMMANDS.md",
      "PPTMAKER_FRAMEWORK/scripts/05-iteration/change-classifier.md",
    ].map((file) => [file, readFileSync(file, "utf8")]);
    for (const [file, text] of docs) {
      expect(text, file).toMatch(/position/);
      expect(text, file).toMatch(/slide_id|stable ID|正式 ID/i);
      expect(text, file).toMatch(/plan_sha256|plan hash/i);
      expect(text, file).toMatch(/needs_render/);
    }
    const template = readFileSync("PPTMAKER_FRAMEWORK/workflow/01-content/template-slide-specifications.md", "utf8");
    expect(template).toMatch(/identity:\s*\n\s+scheme: mnemonic-v1/);
    expect(template).toMatch(/SUBJECT \+ MOVE/);
    expect(template).toMatch(/5–8/);
    expect(readFileSync("PPTMAKER_FRAMEWORK/scripts/README.md", "utf8")).toContain("Fourteen direct executables");
  });

  it("keeps optional Git guidance aligned with visible deck versions", () => {
    const bootstrap = readFileSync("PPTMAKER_FRAMEWORK/BOOTSTRAP.md", "utf8");
    expect(bootstrap).toContain("### git");
    expect(bootstrap).toContain("Git 对做 PPT **可选但推荐**");
    expect(bootstrap).toContain("本次调用所在目录");
    expect(bootstrap).toContain("not confirmed as a worktree");
    expect(bootstrap).toContain("no verifiable Git history checkpoint");
    expect(bootstrap).toContain("项目根");
    expect(bootstrap).toContain("不得嵌套 `git init`");

    const contract = readFileSync("PPTMAKER_FRAMEWORK/charter/AGENT_CONTRACT.md", "utf8");
    expect(contract).toContain("连续 source-work episode");
    expect(contract).toContain("命名操作和精确范围");
    expect(contract).toContain("普通 checkpoint 授权不包含任何 inspection");
    expect(contract).toContain("`_generated/` 始终是可重建派生品");

    const template = readFileSync("PPTMAKER_FRAMEWORK/workflow/00-setup/template-deck-guide.md", "utf8");
    expect(template).toContain("RUN_BUNDLE.md");
    expect(template).toContain("operating guide");
    expect(template).not.toContain("continuation_card.mjs");

    for (const file of GIT_GUIDANCE_CORPUS) {
      const text = readFileSync(file, "utf8");
      expect(text, file).not.toMatch(/Git commit \+ push/);
      expect(text, file).not.toMatch(/源文件属于 Git/);
      expect(text, file).not.toMatch(/v1 不变，随时回退/);
      expect(text, file).not.toMatch(/git add -f\s+_generated/);
    }

    const commands = readFileSync("PPTMAKER_FRAMEWORK/COMMANDS.md", "utf8");
    expect(commands).toContain("标题/小问题修当前版本；同一方向的大改发布 clean vNext");
    expect(commands).toContain("Git history reader");
    expect(commands).toContain("命名 Git 操作和用户给定范围");
  });

  it("documents only the bounded local run-bundle locator entry", () => {
    const contract = readFileSync("PPTMAKER_FRAMEWORK/charter/AGENT_CONTRACT.md", "utf8");
    expect(contract).toContain("RUN_BUNDLE locator entry");
    expect(contract).toContain("run_bundle_locator.mjs");
    expect(contract).toContain("resolveContinuationTargetVersion");
    expect(contract).toContain("bundle_layout --check <run-dir> --structure-only");
    expect(contract).toContain("另一条路径覆盖");
    expect(contract).toContain("不得用第二个 YAML parser");
    expect(contract).toContain("terminal deck");
    expect(contract).toContain("generic remote-chat attachment integration");
    const bootstrap = readFileSync("PPTMAKER_FRAMEWORK/BOOTSTRAP.md", "utf8");
    expect(bootstrap).toContain("RUN_BUNDLE.md");
    expect(bootstrap).toContain("generic remote-chat attachment integration 不受支持");
  });

  it("keeps every migration entry point on the closed prepare-to-confirmation path", () => {
    const files = [
      "PPTMAKER_FRAMEWORK/COMMANDS.md",
      "PPTMAKER_FRAMEWORK/BOOTSTRAP.md",
      "PPTMAKER_FRAMEWORK/workflow/00-setup/05-migrate-import-existing-deck.md",
      "PPTMAKER_FRAMEWORK/reference/legacy-image2-first-maintenance.md",
      "PPTMAKER_FRAMEWORK/playbook/migrate-import.md",
    ];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      const prepare = text.indexOf("prepare --preset");
      const preview = text.indexOf("preview", prepare + 1);
      const confirm = text.indexOf("confirm-migration-apply");
      const apply = text.lastIndexOf("apply");
      expect(prepare, file).toBeGreaterThan(-1);
      expect(preview, file).toBeGreaterThan(prepare);
      expect(confirm, file).toBeGreaterThan(preview);
      expect(apply, file).toBeGreaterThan(confirm);
      expect(text, file).toMatch(/zero.provider|零 provider/i);
    }
  });

  it("the complete active framework has no coherence violations", () => {
    const issues = scanFrameworkCoherence();
    expect(issues, issues.map((item) => `${item.file}:${item.line} [${item.rule}] ${item.message} -> ${item.hint}`).join("\n")).toEqual([]);
  }, 30000);
});
