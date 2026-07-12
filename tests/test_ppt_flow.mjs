import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { initBundle } from "../PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs";
import { readState } from "../PPTMAKER_FRAMEWORK/scripts/lib/state.mjs";
import { selectPilotSlideIds } from "../PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs";
import {
  generationFingerprint,
  generationProfile,
  sha256File,
} from "../PPTMAKER_FRAMEWORK/scripts/lib/image_provenance.mjs";

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

  it("registers exactly 12 top-level commands", () => {
    const matches = PPT_FLOW_SRC.match(/\.command\("/g) || [];
    expect(matches.length).toBe(12);
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
**IMAGE PROMPT**: [A clear three-part framework diagram]

## Slide 02 — \`c2\`
**VISUAL TYPE**: Direction
**KICKER**: TWO
**TITLE**: Second content title
**IMAGE PROMPT**: [A clear directional roadmap]
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
      expect(state.nodes["header-review"].by_version["3_versions/v1"].status).toBe("in_progress");

      writeFileSync(join(qaDir, "pilot_slide_plan.json"), JSON.stringify({ slides: [plan[1]] }), "utf-8");
      const second = runPptFlow(["approve", runDir, "header"]);
      expect(second.status).toBe(0);
      state = readState(deck);
      const record = state.nodes["header-review"].by_version["3_versions/v1"];
      expect(record.status).toBe("completed");
      expect(record.reviewed_content_full_page_ids).toEqual(["c1", "c2"]);
      expect(state.gates.header).toBeUndefined();
      expect(readFileSync(join(deck, "project-metadata.yaml"), "utf-8")).not.toMatch(/header_gate/);

      const reviewedRefresh = runPptFlow([
        "refresh", runDir, "--kind", "title", "--only", "1", "--resolution", "1k", "--dry-run",
      ]);
      expect(reviewedRefresh.status).toBe(0);

      const specsPath = join(runDir, "slide-specifications.md");
      writeFileSync(
        specsPath,
        readFileSync(specsPath, "utf-8").replace("First content title", "Changed first title"),
        "utf-8"
      );
      const staleRefresh = runPptFlow([
        "refresh", runDir, "--kind", "title", "--only", "c1", "--resolution", "1k", "--dry-run",
      ]);
      expect(staleRefresh.status).toBe(1);
      const staleEnvelope = parseFailureEnvelope(staleRefresh.stderr);
      expect(staleEnvelope.code).toBe("TITLE_REVIEW_REQUIRED");
      expect(staleEnvelope.hint).toMatch(/pilot .*--only c1 .*--force-images/);
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

  it("title refresh keeps body-only Chain A and requires selectors for mixed decks", () => {
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
**IMAGE PROMPT**: [A simple body diagram]
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
**IMAGE PROMPT**: [A complete visual]

## Slide 02 — \`body\`
**VISUAL TYPE**: Direction
**TITLE**: Body title
**IMAGE PROMPT**: [A body visual]
`, "utf-8");
      const noSelector = runPptFlow(["refresh", mixedRun, "--kind", "title", "--dry-run"]);
      expect(noSelector.status).toBe(1);
      expect(parseFailureEnvelope(noSelector.stderr).code).toBe("USAGE");

      for (const selector of [["--only", "1"], ["--all"]]) {
        const result = runPptFlow([
          "refresh", mixedRun, "--kind", "title", ...selector, "--resolution", "1k", "--dry-run",
        ]);
        expect(result.status).toBe(1);
        const envelope = parseFailureEnvelope(result.stderr);
        expect(envelope.code).toBe("TITLE_REVIEW_REQUIRED");
        expect(envelope.message).toContain("full");
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
current_node: hitl1
nodes:
  hitl1:
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
      expect(j.current_node).toBe("hitl1");
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
