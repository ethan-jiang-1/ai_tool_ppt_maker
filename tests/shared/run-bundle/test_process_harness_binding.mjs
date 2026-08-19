import { afterEach, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import { parse as parseYaml } from "yaml";

const FLOW = "ppt_maker_harness/scripts/ppt_flow.mjs";
const LAYOUT = "ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
const LESSONS = "ppt_maker_harness/scripts/shared/run-bundle/lessons.mjs";
const HARNESS_ROOT = realpathSync.native(resolve("ppt_maker_harness"));
const cleanupRoots = [];

function run(script, args) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    timeout: 15_000,
  });
}

function finalDiagnostic(result) {
  const line = result.stderr.trim().split(/\r?\n/u).filter(Boolean).at(-1);
  return JSON.parse(line);
}

function frontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/u.exec(text);
  if (!match) throw new Error("expected locator frontmatter");
  return parseYaml(match[1]);
}

function initFixture(name) {
  const root = mkdtempSync(join(tmpdir(), `${name}-`));
  cleanupRoots.push(root);
  const deck = join(root, "deck_binding");
  const initialized = run(FLOW, ["init", deck, "--deck-type", "keynote", "--style", "dark-executive"]);
  expect(initialized.status, initialized.stderr).toBe(0);
  return {
    deck,
    runDir: join(deck, "3_versions", "v1"),
    cardPath: join(deck, "RUN_BUNDLE.md"),
  };
}

afterEach(() => {
  while (cleanupRoots.length > 0) rmSync(cleanupRoots.pop(), { recursive: true, force: true });
});

describe("Harness-bound process commands", () => {
  it("creates a fresh current locator and routes normal and structure-only checks through it", () => {
    const { deck, runDir, cardPath } = initFixture("harness-binding-fresh");
    const manifest = frontmatter(readFileSync(cardPath, "utf8"));
    expect(Object.keys(manifest).sort()).toEqual([
      "deck_root",
      "harness_relation",
      "harness_root",
      "schema",
    ]);
    expect(manifest.schema).toBe("pptmaker-run-bundle");
    expect(manifest.harness_root).toBe(HARNESS_ROOT);
    expect(manifest.harness_relation).toBe(relative(manifest.deck_root, HARNESS_ROOT).split("\\").join("/"));

    const structureOnly = run(LAYOUT, ["--check", runDir, "--structure-only"]);
    expect(structureOnly.stderr).not.toContain("harness_binding_invalid");

    const normalCheck = run(LAYOUT, ["--check", runDir]);
    expect(normalCheck.stderr).not.toContain("harness_binding_invalid");
    expect(existsSync(deck)).toBe(true);
  });

  it("accepts a lexical alias for the same Harness-bound authoring draft", () => {
    const { deck, runDir } = initFixture("harness-binding-alias");
    const root = dirname(deck);
    const aliasRoot = `${root}-alias`;
    cleanupRoots.push(aliasRoot);
    symlinkSync(root, aliasRoot, "dir");
    writeFileSync(join(runDir, "slide-specifications.md"), `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: pure
---

## Slide 01: \`DeckGo\`

**TITLE**: Alias draft
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`
`);

    const aliasRunDir = join(aliasRoot, "deck_binding", "3_versions", "v1");
    const validated = run(FLOW, ["validate", aliasRunDir]);
    expect(validated.status, validated.stderr).toBe(0);
  });

  it("hard-stops undeclared and malformed cards before every authority-carrying run path", () => {
    const { deck, runDir, cardPath } = initFixture("harness-binding-undeclared");
    const statePath = join(deck, "_state", "state.yaml");
    const generatedReadme = join(runDir, "_generated", "README.md");
    const stateBefore = readFileSync(statePath);
    const generatedBefore = readFileSync(generatedReadme);
    const currentCard = readFileSync(cardPath, "utf8");
    const deckRoot = frontmatter(currentCard).deck_root;
    const relation = relative(deckRoot, HARNESS_ROOT).split("\\").join("/");
    const rejectedCards = [
      `---\nschema: pptmaker-run-bundle\ndeck_root: ${JSON.stringify(deckRoot)}\nframework_root: ${JSON.stringify(HARNESS_ROOT)}\nframework_relation: ${JSON.stringify(relation)}\n---\n`,
      "not a locator manifest\n",
    ];

    const commands = [
      [FLOW, ["status", runDir]],
      [FLOW, ["validate", runDir]],
      [FLOW, ["build", runDir]],
      [FLOW, ["refresh", runDir, "--kind", "title"]],
      [FLOW, ["slides", "list", runDir]],
      [FLOW, ["new-version", runDir, "--name", "v2"]],
      [FLOW, ["state", runDir, "--json"]],
      [FLOW, ["style-master", "inspect", runDir]],
      [FLOW, ["image2", "plan", runDir]],
      [LAYOUT, ["--check", runDir]],
      [LAYOUT, ["--new-version", runDir, "--version-name", "v2"]],
      [LESSONS, ["list", runDir]],
    ];
    for (const rejectedCard of rejectedCards) {
      writeFileSync(cardPath, rejectedCard);
      for (const [script, args] of commands) {
        const result = run(script, args);
        expect(result.status, `${script} ${args.join(" ")}\n${result.stderr}`).not.toBe(0);
        const diagnostic = finalDiagnostic(result);
        expect(diagnostic.diagnostic, `${script} ${args.join(" ")}\n${result.stderr}`).toMatchObject({
          category: "gate",
          operation: "verify-harness-binding",
          reason: { kind: "harness_binding_invalid" },
          next: { action: "repair_prerequisite", requires_human: true },
        });
      }
    }

    const structureOnly = run(LAYOUT, ["--check", runDir, "--structure-only"]);
    expect(structureOnly.stderr).not.toContain("harness_binding_invalid");
    expect(readFileSync(statePath)).toEqual(stateBefore);
    expect(readFileSync(generatedReadme)).toEqual(generatedBefore);
    expect(existsSync(join(deck, "_lessons"))).toBe(true);
    expect(existsSync(join(deck, "3_versions", "v2"))).toBe(false);
    expect(currentCard).toContain("pptmaker-run-bundle");
  });

  it("reports usage instead of binding failure when --check is given a Deck root", () => {
    const { deck, runDir } = initFixture("harness-binding-check-root");
    const rootCheck = run(LAYOUT, ["--check", deck]);
    expect(rootCheck.status).not.toBe(0);
    const diagnostic = finalDiagnostic(rootCheck);
    expect(diagnostic.diagnostic.category).toBe("usage");
    expect(diagnostic.diagnostic.reason?.kind).not.toBe("harness_binding_invalid");
    expect(`${rootCheck.stdout}\n${rootCheck.stderr}`).toMatch(/3_versions\/vN|3_versions\/v1/);

    const v1Check = run(LAYOUT, ["--check", runDir]);
    expect(v1Check.stderr).not.toContain("harness_binding_invalid");
  });

  it("prints the same init Next sentence from ppt_flow and bundle_layout", () => {
    const root = mkdtempSync(join(tmpdir(), "init-next-"));
    cleanupRoots.push(root);
    const flowDeck = join(root, "deck_flow_init");
    const layoutDeck = join(root, "deck_layout_init");
    const flow = run(FLOW, ["init", flowDeck, "--deck-type", "keynote", "--style", "dark-executive"]);
    const layout = run(LAYOUT, ["--init", layoutDeck, "--deck-type", "keynote", "--style", "dark-executive"]);
    expect(flow.status, flow.stderr).toBe(0);
    expect(layout.status, layout.stderr).toBe(0);
    const flowNext = flow.stdout.split("\n").find((line) => line.startsWith("Next:"));
    const layoutNext = layout.stdout.split("\n").find((line) => line.startsWith("Next:"));
    expect(flowNext).toBe(`Next: ppt_flow.mjs status ${join(flowDeck, "3_versions", "v1")}`);
    expect(layoutNext).toBe(`Next: ppt_flow.mjs status ${join(layoutDeck, "3_versions", "v1")}`);
    expect(layout.stdout).not.toContain("fill 2_backbone/");
  });
});
