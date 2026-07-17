import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, mkdtempSync, writeFileSync, rmSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { initBundle } from "../PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs";
import { readState } from "../PPTMAKER_FRAMEWORK/scripts/lib/state.mjs";
import {
  buildControllerGateContext,
  selectPilotSlideIds,
} from "../PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs";
import {
  generationFingerprint,
  generationProfile,
  sha256File,
} from "../PPTMAKER_FRAMEWORK/scripts/lib/image_provenance.mjs";
import { PPT_FLOW_COMMAND_INVENTORY } from "../PPTMAKER_FRAMEWORK/scripts/lib/cli_error.mjs";

const PPT_FLOW = "PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs";
const PPT_FLOW_SRC = readFileSync(PPT_FLOW, "utf-8");

function lastNonEmptyLine(text) {
  const lines = String(text || "")
    .split("\n")
    .map((l) => l.trimEnd())
    .filter((l) => l.trim() !== "");
  return lines.length ? lines[lines.length - 1] : "";
}

function runPptFlow(args, opts = {}) {
  return spawnSync("node", [PPT_FLOW, ...args], {
    encoding: "utf-8",
    timeout: opts.timeout ?? 15000,
    env: process.env,
  });
}

function parseFailureEnvelope(stderr) {
  const line = lastNonEmptyLine(stderr);
  const env = JSON.parse(line);
  expect(env.ok).toBe(false);
  return env;
}

describe("ppt_flow", () => {
  it("audits clean help and deterministic usage diagnostics across all 13 commands", () => {
    const usageProbes = {
      doctor: ["doctor", "--smoke", "--probe-vendors"],
      init: ["init"],
      status: ["status"],
      approve: ["approve"],
      "style-master": ["style-master", "/tmp/missing-run", "--resolution", "8k"],
      validate: ["validate"],
      pilot: ["pilot", "/tmp/missing-run", "--resolution", "8k"],
      build: ["build", "/tmp/missing-run", "--resolution", "8k"],
      refresh: ["refresh", "/tmp/missing-run", "--kind", "unsupported"],
      slides: ["slides", "resolve", "/tmp/missing-run"],
      "new-version": ["new-version"],
      state: ["state"],
    };
    expect(PPT_FLOW_COMMAND_INVENTORY).toHaveLength(13);
    for (const command of PPT_FLOW_COMMAND_INVENTORY) {
      const help = runPptFlow([command, "--help"]);
      expect(help.status, `${command} --help\n${help.stderr}`).toBe(0);
      expect(help.stderr).not.toMatch(/"ok"\s*:\s*false/);
      if (command === "test") continue;
      const result = runPptFlow(usageProbes[command]);
      expect(result.status, `${command} usage`).not.toBe(0);
      const envelope = parseFailureEnvelope(result.stderr);
      expect(envelope.code, command).toBe("USAGE");
      expect(envelope.diagnostic, command).toMatchObject({
        version: 1,
        category: "usage",
        next: { action: "fix_arguments", requires_human: false },
      });
      expect((result.stderr.match(/"ok"\s*:\s*false/g) || []).length, command).toBe(1);
    }
  }, 30000);

  it("responds to --help and lists state", () => {
    const r = runPptFlow(["--help"]);
    expect(r.status).toBe(0);
    expect(r.stdout + r.stderr).toMatch(/\bstate\b/);
    const tail = lastNonEmptyLine(r.stderr);
    if (tail.startsWith("{")) {
      expect(() => JSON.parse(tail)).not.toThrow();
      expect(JSON.parse(tail).ok).not.toBe(false);
    }
  });

  it("state --help exits 0 without failure envelope", () => {
    const r = runPptFlow(["state", "--help"]);
    expect(r.status).toBe(0);
    const tail = lastNonEmptyLine(r.stderr);
    if (tail.startsWith("{")) {
      expect(JSON.parse(tail).ok).not.toBe(false);
    }
  });

  it("doctor starts without freeze TypeError; non-zero yields FAILED envelope", () => {
    const r = runPptFlow(["doctor"], { timeout: 20000 });
    const combined = (r.stderr || "") + (r.stdout || "");
    expect(combined).not.toMatch(/Cannot assign to read only property/);
    expect(combined).not.toMatch(/program is not defined/);
    if (r.status !== 0) {
      const env = parseFailureEnvelope(r.stderr);
      expect(env.code).toBe("FAILED");
      expect(env.where).toBe("ppt_flow.doctor");
    }
  });

  it("doctor remains text-only and does not expose a JSON flag", () => {
    const help = runPptFlow(["doctor", "--help"]);
    expect(help.status).toBe(0);
    expect(help.stdout + help.stderr).not.toMatch(/--json/);
    const unsupported = runPptFlow(["doctor", "--json"]);
    expect(unsupported.status).not.toBe(0);
    expect(parseFailureEnvelope(unsupported.stderr).code).toBe("USAGE");
  });

  it("unknown command → USAGE envelope", () => {
    const r = runPptFlow(["nosuch"]);
    expect(r.status).not.toBe(0);
    const env = parseFailureEnvelope(r.stderr);
    expect(env.code).toBe("USAGE");
  });

  it("init unknown style → USAGE with preset hint (exactly one envelope)", () => {
    const r = runPptFlow([
      "init",
      "/tmp/deck_cli_envelope_test",
      "--deck-type",
      "keynote",
      "--style",
      "not-a-preset",
    ]);
    expect(r.status).not.toBe(0);
    const matches = (r.stderr.match(/\{[^\n]*"ok"\s*:\s*false/g) || []).length;
    expect(matches).toBe(1);
    const env = parseFailureEnvelope(r.stderr);
    expect(env.code).toBe("USAGE");
    expect(env.hint).toMatch(/clean-clinical|dark-executive|tech-startup/);
    expect(env.where).toMatch(/init\.style/);
  });

  it("state --check-gates on minimal fixture → GATE_BLOCKED", () => {
    const root = mkdtempSync(join(tmpdir(), "ppt-gate-"));
    const runDir = join(root, "deck_x", "_runs", "r1");
    mkdirSync(runDir, { recursive: true });
    const r = runPptFlow(["state", runDir, "--check-gates"]);
    expect(r.status).toBe(1);
    const env = parseFailureEnvelope(r.stderr);
    expect(env.code).toBe("GATE_BLOCKED");
    expect(env.hint).toMatch(/content|visual/);
  });

  it("does not mutate STYLE_PRESETS in place", () => {
    expect(PPT_FLOW_SRC).not.toMatch(
      /STYLE_PRESETS\.(sort|reverse|splice)\(/
    );
  });

  it("registers exactly 13 top-level commands", () => {
    const matches = PPT_FLOW_SRC.match(/\.command\("/g) || [];
    expect(matches.length).toBe(13);
  });

  it("state --json includes resume card fields", () => {
    const root = mkdtempSync(join(tmpdir(), "ppt-resume-"));
    const deck = join(root, "deck_resume");
    const runDir = join(deck, "3_versions", "v1");
    mkdirSync(join(deck, "_state"), { recursive: true });
    mkdirSync(runDir, { recursive: true });
    writeFileSync(
      join(deck, "_state", "state.yaml"),
      `playbook: iterate-style
current_node: review-gate
nodes:
  review-gate:
    status: in_progress
    waiting_for: user:review-style-master
gates:
  content: pending
  visual: pending
deck:
  name: resume
  type: keynote
  style: dark
playbook_stack: []
`,
      "utf-8"
    );
    const r = runPptFlow(["state", runDir, "--json"]);
    expect(r.status).toBe(0);
    const j = JSON.parse(r.stdout);
    expect(j.playbook).toBe("iterate-style");
    expect(j.current_node).toBe("review-gate");
    expect(j.workflow_summary).toMatch(/等人|waiting|review/i);
    expect(j.suggested_next).toContain("user:review-style-master");
  });

  it("controller gate context reuses real validators and fails closed", async () => {
    const deck = join(mkdtempSync(join(tmpdir(), "ppt-controller-ctx-")), "deck_ctx");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      const ctx = await buildControllerGateContext(runDir);
      expect(ctx.deckDir).toBe(deck);
      expect(ctx.runDir).toBe(runDir);
      expect(ctx.slideSpecsValid).toBe(false);
      expect(ctx.headerReviewCurrent).toBe(false);
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it("approve dual-writes metadata and _state gates", () => {
    const deck = join(mkdtempSync(join(tmpdir(), "ppt-approve-")), "deck_approve");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      const r = runPptFlow(["approve", runDir, "visual"]);
      expect(r.status).toBe(0);
      const meta = readFileSync(join(deck, "project-metadata.yaml"), "utf-8");
      expect(meta).toMatch(/visual_gate:\s*approved/);
      const s = readState(deck);
      expect(s.gates.visual).toBe("approved");
      const r2 = runPptFlow(["approve", runDir, "content", "--waive"]);
      expect(r2.status).toBe(0);
      const meta2 = readFileSync(join(deck, "project-metadata.yaml"), "utf-8");
      expect(meta2).toMatch(/content_gate:\s*waived/);
      const s2 = readState(deck);
      expect(s2.gates.content).toBe("waived");
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it("approve header merges version-scoped pilot batches without metadata gate writes", () => {
    const deck = join(mkdtempSync(join(tmpdir(), "ppt-header-approve-")), "deck_header");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      const generated = join(runDir, "_generated");
      const promptsDir = join(generated, "page_prompts");
      const imagesDir = join(generated, "page_images_full");
      const qaDir = join(generated, "qa");
      const previewDir = join(generated, "preview");
      writeFileSync(join(runDir, "slide-specifications.md"), `---
render:
  default: full-page
  header-lock: []
---

## Slide 01 — \`c1\`
**VISUAL TYPE**: Framework
**KICKER**: ONE
**TITLE**: First content title
**IMAGE PROMPT**: Create a clear three-part framework diagram with large labels.

## Slide 02 — \`c2\`
**VISUAL TYPE**: Direction
**KICKER**: TWO
**TITLE**: Second content title
**IMAGE PROMPT**: Create a clear directional roadmap with three milestones.
`, "utf-8");
      const stage1 = spawnSync("node", [
        "PPTMAKER_FRAMEWORK/scripts/unified_pipeline.mjs",
        "--run-dir", runDir,
        "--stage", "1",
      ], { encoding: "utf-8", timeout: 15000, env: process.env });
      expect(stage1.status).toBe(0);
      const stylePath = join(deck, "2_backbone", "visual-style", "style_master.jpg");
      writeFileSync(stylePath, "style");
      mkdirSync(imagesDir, { recursive: true });
      mkdirSync(qaDir, { recursive: true });
      mkdirSync(previewDir, { recursive: true });
      const prompts = JSON.parse(readFileSync(join(promptsDir, "_prompts.json"), "utf-8")).slides;
      const profile = generationProfile({
        styleReferenceSha256: sha256File(stylePath),
        resolution: "1k",
        model: "gpt-image-2",
        semanticOptions: { size: "16:9", n: 1 },
      });
      const manifest = { version: 1, slides: {} };
      for (const prompt of prompts) {
        const imagePath = join(imagesDir, prompt.out);
        writeFileSync(imagePath, `image-${prompt.id}`);
        manifest.slides[prompt.id] = {
          slide_id: prompt.id,
          output: prompt.out,
          generation_fingerprint: generationFingerprint({ prompt: prompt.prompt.trim(), profile }),
          image_sha256: sha256File(imagePath),
          generation_profile: profile,
          generated_at: new Date().toISOString(),
        };
      }
      writeFileSync(join(imagesDir, "_manifest.json"), JSON.stringify(manifest), "utf-8");
      writeFileSync(join(previewDir, "pilot_final_contact_sheet.jpg"), "reviewed", "utf-8");

      const plan = JSON.parse(readFileSync(join(generated, "slide_plan.json"), "utf-8")).slides;
      writeFileSync(join(qaDir, "pilot_slide_plan.json"), JSON.stringify({ slides: [plan[0]] }), "utf-8");
      const first = runPptFlow(["approve", runDir, "header"]);
      expect(first.status).toBe(0);
      let state = readState(deck);
      const v1 = state.nodes["header-review"].by_version["3_versions/v1"];
      expect(v1.slides).toBeDefined();
      expect(v1.slides.c1.status).toBe("reviewed");

      writeFileSync(join(qaDir, "pilot_slide_plan.json"), JSON.stringify({ slides: [plan[1]] }), "utf-8");
      const second = runPptFlow(["approve", runDir, "header"]);
      expect(second.status).toBe(0);
      state = readState(deck);
      const record = state.nodes["header-review"].by_version["3_versions/v1"];
      expect(record.slides.c2.status).toBe("reviewed");
      expect(state.gates.header).toBeUndefined();
      expect(readFileSync(join(deck, "project-metadata.yaml"), "utf-8")).not.toMatch(/header_gate/);

      const reviewedRefresh = runPptFlow([
        "refresh", runDir, "--kind", "title", "--only", "1", "--resolution", "1k", "--dry-run",
      ]);
      expect(reviewedRefresh.status).toBe(0);

      // Per-slide state verified: both slides are reviewed in the new format
      expect(record.slides.c1.status).toBe("reviewed");
      expect(record.slides.c2.status).toBe("reviewed");
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it("approve header waiver requires both ids and a reason", () => {
    const deck = join(mkdtempSync(join(tmpdir(), "ppt-header-waive-")), "deck_waive");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      const result = runPptFlow(["approve", runDir, "header", "--waive", "--only", "1"]);
      expect(result.status).toBe(1);
      const envelope = parseFailureEnvelope(result.stderr);
      expect(envelope.code).toBe("USAGE");
      expect(envelope.message).toMatch(/--only.*--reason/);
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it("title refresh keeps body-only Header Text & Style Refresh and requires selectors for mixed decks", () => {
    const bodyDeck = join(mkdtempSync(join(tmpdir(), "ppt-title-body-")), "deck_title_body");
    const mixedDeck = join(mkdtempSync(join(tmpdir(), "ppt-title-mixed-")), "deck_title_mixed");
    try {
      initBundle(bodyDeck, null, "keynote", "dark-executive");
      const bodyRun = join(bodyDeck, "3_versions", "v1");
      writeFileSync(join(bodyRun, "slide-specifications.md"), `---
render:
  default: body+header-lock
  header-lock: []
---

## Slide 01 — \`body\`
**VISUAL TYPE**: Framework
**TITLE**: Body title
**IMAGE PROMPT**: Create a simple body diagram with two labeled sections.
`, "utf-8");
      const body = runPptFlow(["refresh", bodyRun, "--kind", "title", "--dry-run"]);
      expect(body.status).toBe(0);
      expect(body.stdout).toMatch(/--stage 3,4,5/);
      expect(body.stdout).not.toMatch(/--stage 1,2,3,4,5/);

      initBundle(mixedDeck, null, "keynote", "dark-executive");
      const mixedRun = join(mixedDeck, "3_versions", "v1");
      writeFileSync(join(mixedRun, "slide-specifications.md"), `---
render:
  default: full-page
  header-lock:
    - body
---

## Slide 01 — \`full\`
**VISUAL TYPE**: Framework
**TITLE**: Full title
**IMAGE PROMPT**: Create a complete visual with a strong central framework.

## Slide 02 — \`body\`
**VISUAL TYPE**: Direction
**TITLE**: Body title
**IMAGE PROMPT**: Create a body visual with one directional sequence.
`, "utf-8");
      const noSelector = runPptFlow(["refresh", mixedRun, "--kind", "title", "--dry-run"]);
      expect(noSelector.status).toBe(1);
      expect(parseFailureEnvelope(noSelector.stderr).code).toBe("USAGE");

      for (const selector of [["--only", "1"], ["--all"]]) {
        const result = runPptFlow([
          "refresh", mixedRun, "--kind", "title", ...selector, "--resolution", "1k", "--dry-run",
        ]);
        // New behavior: no header review record → gate passes → refresh succeeds
        expect(result.status).toBe(0);
      }
    } finally {
      rmSync(bodyDeck, { recursive: true, force: true });
      rmSync(mixedDeck, { recursive: true, force: true });
    }
  });

  it("status --json includes playbook breakpoint", () => {
    const deck = join(mkdtempSync(join(tmpdir(), "ppt-status-")), "deck_status");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      writeFileSync(
        join(deck, "_state", "state.yaml"),
        `playbook: create-deck
current_node: checkpoint-intake
nodes:
  checkpoint-intake:
    status: in_progress
gates:
  content: pending
  visual: pending
deck:
  name: status
  type: keynote
  style: dark
playbook_stack: []
`,
        "utf-8"
      );
      const r = runPptFlow(["status", runDir, "--json"]);
      expect(r.status).toBe(0);
      const j = JSON.parse(r.stdout);
      expect(j.playbook).toBe("create-deck");
      expect(j.current_node).toBe("checkpoint-intake");
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it("slides list/resolve are read-only and retain per-token binding evidence", () => {
    const deck = join(mkdtempSync(join(tmpdir(), "ppt-slides-read-")), "deck_slides_read");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      const spec = join(runDir, "slide-specifications.md");
      writeFileSync(spec, `---
identity:
  scheme: mnemonic-v1
---
# Deck

## Slide 01: \`DeckGo\`

**VISUAL TYPE**: Framework
**TITLE**: Opening claim
**IMAGE PROMPT**: Show an opening claim with two large labeled zones.

## Slide 02: \`UXGap\`

**VISUAL TYPE**: Framework
**TITLE**: Why the old workflow breaks
**IMAGE PROMPT**: Show the workflow friction with a clear before and after.
`, "utf8");
      const before = readFileSync(spec, "utf8");
      const list = runPptFlow(["slides", "list", runDir, "--json"]);
      expect(list.status).toBe(0);
      expect(JSON.parse(list.stdout).slides).toEqual([
        { slide_id: "DeckGo", position: 1, title: "Opening claim" },
        { slide_id: "UXGap", position: 2, title: "Why the old workflow breaks" },
      ]);
      const stage1 = spawnSync("node", [
        "PPTMAKER_FRAMEWORK/scripts/unified_pipeline.mjs",
        "--run-dir", runDir,
        "--stage", "1",
      ], { encoding: "utf8", timeout: 10000 });
      expect(stage1.status, stage1.stderr).toBe(0);
      const status = runPptFlow(["status", runDir, "--json"]);
      expect(status.status).toBe(0);
      expect(JSON.parse(status.stdout).slide_labels).toEqual([
        "01 · DeckGo · Opening claim",
        "02 · UXGap · Why the old workflow breaks",
      ]);
      const resolved = runPptFlow(["slides", "resolve", runDir, "UXGap", "UX gap", "2", "--json"]);
      expect(resolved.status).toBe(0);
      expect(JSON.parse(resolved.stdout).bindings).toEqual([
        { token: "UXGap", slide_id: "UXGap", position: 2, matched_by: "exact_id" },
        { token: "UX gap", slide_id: "UXGap", position: 2, matched_by: "spoken_key" },
        { token: "2", slide_id: "UXGap", position: 2, matched_by: "position" },
      ]);
      expect(readFileSync(spec, "utf8")).toBe(before);
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it("slides preview writes nothing; bare/hash-mismatched apply fails; confirmed move publishes clean vNext", () => {
    const deck = join(mkdtempSync(join(tmpdir(), "ppt-slides-move-")), "deck_slides_move");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      const spec = join(runDir, "slide-specifications.md");
      writeFileSync(spec, `## Slide 01: DeckGo

**TITLE**: Opening

## Slide 02: UXGap

**TITLE**: Gap

## Slide 03: AICost

**TITLE**: Cost
`, "utf8");
      writeFileSync(join(runDir, "_generated", "stale.bin"), "must not copy", "utf8");
      const before = readFileSync(spec, "utf8");
      const preview = runPptFlow(["slides", "move", runDir, "3", "--after", "1", "--json"]);
      expect(preview.status).toBe(0);
      const transaction = JSON.parse(preview.stdout).transaction;
      expect(transaction.after_order).toEqual(["DeckGo", "AICost", "UXGap"]);
      expect(transaction.bindings.map((binding) => binding.matched_by)).toEqual(["position", "position"]);
      expect(readFileSync(spec, "utf8")).toBe(before);
      expect(() => statSync(join(deck, "3_versions", "v2"))).toThrow();

      const bare = runPptFlow(["slides", "move", runDir, "3", "--after", "1", "--apply"]);
      expect(bare.status).toBe(1);
      expect(parseFailureEnvelope(bare.stderr).code).toBe("USAGE");
      const mismatch = runPptFlow(["slides", "move", runDir, "3", "--after", "1", "--apply", "--plan-sha256", "0".repeat(64)]);
      expect(mismatch.status).toBe(1);
      expect(() => statSync(join(deck, "3_versions", "v2"))).toThrow();

      const applied = runPptFlow(["slides", "move", runDir, "3", "--after", "1", "--apply", "--plan-sha256", transaction.plan_sha256, "--json"]);
      expect(applied.status, applied.stderr).toBe(0);
      const result = JSON.parse(applied.stdout);
      const v2 = join(deck, "3_versions", "v2");
      expect(result.receipt.after_order).toEqual(transaction.after_order);
      expect(readFileSync(spec, "utf8")).toBe(before);
      expect(readFileSync(join(v2, "slide-specifications.md"), "utf8")).toMatch(
        /Slide 01: DeckGo[\s\S]*Slide 02: AICost[\s\S]*Slide 03: UXGap/
      );
      expect(readdirSync(join(v2, "_generated"))).toEqual(["README.md"]);
      expect(readdirSync(join(v2, "_scratch"))).toEqual(["README.md"]);
      expect(readdirSync(join(deck, "3_versions")).filter((name) => name.startsWith(".v2"))).toEqual([]);
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it("slides normalize is the hash-bound in-place exception and changes only heading projections", () => {
    const deck = join(mkdtempSync(join(tmpdir(), "ppt-slides-normalize-")), "deck_slides_normalize");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      const spec = join(runDir, "slide-specifications.md");
      writeFileSync(spec, `## Slide 07: DeckGo

body one

## Slide 09: UXGap

body two
`, "utf8");
      const preview = runPptFlow(["slides", "normalize", runDir, "--json"]);
      expect(preview.status).toBe(0);
      const hash = JSON.parse(preview.stdout).transaction.plan_sha256;
      const applied = runPptFlow(["slides", "normalize", runDir, "--apply", "--plan-sha256", hash, "--json"]);
      expect(applied.status, applied.stderr).toBe(0);
      expect(readFileSync(spec, "utf8")).toBe(`## Slide 01: DeckGo

body one

## Slide 02: UXGap

body two
`);
      expect(readdirSync(join(deck, "3_versions")).filter((name) => /^v\d+$/.test(name))).toEqual(["v1"]);
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it("slides insertion requires mnemonic/history availability and apply-plan stays inside _scratch", () => {
    const deck = join(mkdtempSync(join(tmpdir(), "ppt-slides-insert-")), "deck_slides_insert");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const v1 = join(deck, "3_versions", "v1");
      writeFileSync(join(v1, "slide-specifications.md"), `## Slide 01: DeckGo

**TITLE**: Opening
`, "utf8");
      const block = join(v1, "_scratch", "insert.md");
      writeFileSync(block, `## Slide 01: UXGap

**TITLE**: New gap
`, "utf8");
      const preview = runPptFlow(["slides", "insert", v1, "--source", block, "--to", "end", "--json"]);
      expect(preview.status).toBe(0);
      const transaction = JSON.parse(preview.stdout).transaction;
      expect(transaction.after_order).toEqual(["DeckGo", "UXGap"]);
      expect(transaction.plan_sha256).toMatch(/^[a-f0-9]{64}$/);

      const planPath = join(v1, "_scratch", "plan.json");
      writeFileSync(planPath, JSON.stringify(transaction), "utf8");
      const applied = runPptFlow(["slides", "apply-plan", v1, "--plan", planPath, "--apply", "--json"]);
      expect(applied.status, applied.stderr).toBe(0);
      expect(JSON.parse(applied.stdout).receipt.needs_render).toEqual(["UXGap"]);

      const v2 = join(deck, "3_versions", "v2");
      const reused = join(v2, "_scratch", "reused.md");
      writeFileSync(reused, `## Slide 01: UXGap

**TITLE**: Reuse deleted or retained ID
`, "utf8");
      const conflict = runPptFlow(["slides", "insert", v2, "--source", reused, "--to", "end", "--json"]);
      expect(conflict.status).toBe(1);

      const outside = join(tmpdir(), `outside-plan-${Date.now()}.json`);
      writeFileSync(outside, JSON.stringify(transaction), "utf8");
      const rejected = runPptFlow(["slides", "apply-plan", v1, "--plan", outside, "--apply"]);
      expect(rejected.status).toBe(1);
      expect(parseFailureEnvelope(rejected.stderr).message).toMatch(/_scratch/);
      rmSync(outside, { force: true });
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });

  it("slides multi-delete binds every position before mutation and ambiguity requires a human", () => {
    const deck = join(mkdtempSync(join(tmpdir(), "ppt-slides-delete-")), "deck_slides_delete");
    try {
      initBundle(deck, null, "keynote", "dark-executive");
      const runDir = join(deck, "3_versions", "v1");
      writeFileSync(join(runDir, "slide-specifications.md"), `## Slide 01: DeckGo

**TITLE**: Opening

## Slide 02: UXGap

**TITLE**: Cost gap

## Slide 03: AICost

**TITLE**: Cost curve

## Slide 04: IDFix

**TITLE**: Fix
`, "utf8");
      const preview = runPptFlow(["slides", "delete", runDir, "2", "4", "--json"]);
      expect(preview.status).toBe(0);
      const transaction = JSON.parse(preview.stdout).transaction;
      expect(transaction.bindings.map((binding) => binding.slide_id)).toEqual(["UXGap", "IDFix"]);
      expect(transaction.after_order).toEqual(["DeckGo", "AICost"]);

      const ambiguous = runPptFlow(["slides", "resolve", runDir, "cost", "--json"]);
      expect(ambiguous.status).toBe(1);
      const envelope = parseFailureEnvelope(ambiguous.stderr);
      expect(envelope.diagnostic.next.requires_human).toBe(true);
      expect(envelope.diagnostic.issues.map((issue) => issue.subject.id)).toEqual(["UXGap", "AICost"]);
      expect(envelope.diagnostic.issues[0]).toMatchObject({
        message: expect.stringMatching(/02.*UXGap.*Cost gap/),
        reason: { kind: "selector_candidate" },
      });
      expect((ambiguous.stderr.match(/"ok"\s*:\s*false/g) || [])).toHaveLength(1);
    } finally {
      rmSync(deck, { recursive: true, force: true });
    }
  });
});

describe("pilot selector", () => {
  const slides = [
    { id: "hero", visual_type: "Title / Opener", layout_contract: { render_mode: "full-page" } },
    { id: "c1", visual_type: "Framework", layout_contract: { render_mode: "full-page" } },
    { id: "lock", visual_type: "Direction", layout_contract: { render_mode: "body+header-lock" } },
    { id: "c2", visual_type: "Impact / Evidence", layout_contract: { render_mode: "full-page" } },
    { id: "close", visual_type: "Closer", layout_contract: { render_mode: "full-page" } },
  ];

  it("prioritizes one or two content full-page slides by count", () => {
    expect(selectPilotSlideIds(slides, 1)).toEqual(["c1"]);
    expect(selectPilotSlideIds(slides, 2)).toEqual(["c1", "c2"]);
    expect(selectPilotSlideIds(slides, 3)).toEqual(["c1", "c2", "hero"]);
  });

  it("is deterministic and deduplicated with no content full-page", () => {
    const noContent = slides.filter((slide) => !["c1", "c2"].includes(slide.id));
    const a = selectPilotSlideIds(noContent, 3);
    expect(a).toEqual(selectPilotSlideIds(noContent, 3));
    expect(new Set(a).size).toBe(a.length);
  });
});
