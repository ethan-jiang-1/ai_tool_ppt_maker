import { afterEach, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createCanvas } from "@napi-rs/canvas";

import { initBundle } from "../../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import {
  buildPureProgressiveTargetRawPlan,
  resolvePureStyleMasterScope,
} from "../../../ppt_maker_harness/scripts/04-pure-image/index.mjs";
import { acceptLocalStyleMasterFixture } from "../../helpers/accepted_style_master.mjs";

const FLOW = "ppt_maker_harness/scripts/ppt_flow.mjs";
const cleanupRoots = [];

const SELECTED_DRAFT_SOURCE = `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: pure
---

## Slide 01: \`DeckGo\`

**TITLE**: Selected-workflow draft
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`
`;

function run(args) {
  return spawnSync(process.execPath, [FLOW, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    timeout: 15_000,
  });
}

function initDeck(name) {
  const root = mkdtempSync(join(tmpdir(), `${name}-`));
  cleanupRoots.push(root);
  const deck = join(root, `deck_${name}`);
  const initialized = run(["init", deck, "--deck-type", "keynote", "--style", "dark-executive"]);
  expect(initialized.status, initialized.stderr).toBe(0);
  return { deck, runDir: join(deck, "3_versions", "v1") };
}

afterEach(() => {
  while (cleanupRoots.length > 0) rmSync(cleanupRoots.pop(), { recursive: true, force: true });
});

describe("status Next and style-master --json", () => {
  it("prints status Next from workflow inspection on a selected-workflow draft", () => {
    const { runDir } = initDeck("status-next-draft");
    writeFileSync(join(runDir, "slide-specifications.md"), SELECTED_DRAFT_SOURCE);
    const human = run(["status", runDir]);
    expect(human.status, human.stderr).toBe(0);
    expect(human.stdout).toMatch(/Next:/);
    expect(human.stdout).not.toMatch(/Build full deck/);

    const json = run(["status", runDir, "--json"]);
    expect(json.status, json.stderr).toBe(0);
    const report = JSON.parse(json.stdout);
    expect(report.workflow_inspection.primary_action.action_id).not.toBe("repair-current-protocol-identity");
    expect(report.suggested_next).toBeTruthy();

    const state = run(["state", runDir, "--json"]);
    expect(state.status, state.stderr).toBe(0);
    expect(JSON.parse(state.stdout).workflow_inspection.root_cause.kind).not.toBe("current-protocol-invalid");
  });

  it("prints status Next after Style Master is ready and PPTX is unbuilt", async () => {
    const root = mkdtempSync(join(tmpdir(), "status-next-style-master-"));
    cleanupRoots.push(root);
    const deck = join(root, "deck_status_next_style_master");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    initBundle(deck, null, "keynote", "dark-executive");
    writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.png"), image.toBuffer("image/png"));
    writeFileSync(join(runDir, "slide-specifications.md"), `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: pure
---

## Slide 01: \`DeckGo\`

**TITLE**: Status Next after Style Master
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`
`);
    await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));
    buildPureProgressiveTargetRawPlan(runDir);

    const human = run(["status", runDir]);
    expect(human.status, human.stderr).toBe(0);
    expect(human.stdout).toMatch(/Next:/);
    expect(human.stdout).not.toMatch(/Build full deck/);

    const json = run(["status", runDir, "--json"]);
    expect(json.status, json.stderr).toBe(0);
    const report = JSON.parse(json.stdout);
    expect(report.workflow_inspection.primary_action.action_id).toBeTruthy();
    expect(report.workflow_inspection.primary_action.action_id).not.toBe("repair-current-protocol-identity");
    expect(String(report.suggested_next)).toMatch(/style-master|progressive|image2|plan/i);
  });

  it("accepts style-master inspect --json without USAGE", async () => {
    const root = mkdtempSync(join(tmpdir(), "style-master-json-"));
    cleanupRoots.push(root);
    const deck = join(root, "deck_style_master_json");
    const runDir = join(deck, "3_versions", "v1");
    const image = createCanvas(2000, 1125);
    image.getContext("2d").fillRect(0, 0, 2000, 1125);
    initBundle(deck, null, "keynote", "dark-executive");
    writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.png"), image.toBuffer("image/png"));
    writeFileSync(join(runDir, "slide-specifications.md"), SELECTED_DRAFT_SOURCE);
    await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));

    const result = run(["style-master", "inspect", runDir, "--json"]);
    expect(result.stderr).not.toMatch(/unknown option '--json'|USAGE/i);
    expect(result.status, result.stderr).toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report.schema).toBe("pptmaker-command-result");
    expect(report.operation).toBe("style-master.inspect");
  });
});
