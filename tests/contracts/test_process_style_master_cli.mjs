import { chmodSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import {
  STYLE_MASTER_PROMPT,
  initBundle,
  styleAsset,
} from "../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import { resolveEffectiveStyleMasterSelection } from "../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";
import { styleMasterStorePaths } from "../../PPTMAKER_FRAMEWORK/scripts/shared/image2/style_master_store.mjs";
import { readProgressiveRawPlanDirectRecords } from "../../PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_progressive_store.mjs";

const FLOW = "PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs";
const LOCAL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAABHNCSVQICAgIfAhkiAAAAAFzUkdCAK7OHOkAAAANSURBVAiZY1AJyPoPAANYAd6lcnCEAAAAAElFTkSuQmCC",
  "base64",
);

function run(args, env = {}, { cwd = process.cwd(), nodeArgs = [] } = {}) {
  return spawnSync(process.execPath, [...nodeArgs, FLOW, ...args], {
    encoding: "utf8",
    timeout: 30_000,
    env: { ...process.env, ...env },
    cwd,
  });
}

function finalDiagnostic(stderr) {
  return JSON.parse(stderr.trim().split("\n").filter(Boolean).at(-1));
}

function treeSnapshot(root, current = root, entries = []) {
  for (const name of readdirSync(current).sort()) {
    const path = join(current, name);
    const relative = path.slice(root.length + 1);
    if (statSync(path).isDirectory()) treeSnapshot(root, path, entries);
    else entries.push(`${relative}:${readFileSync(path).toString("base64")}`);
  }
  return entries;
}

function source(workflow = "pure") {
  return `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: ${workflow}
---

## Slide 01: \`DeckGo\`

**TITLE**: Target CLI Style Master source
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`

> **SPEAKER NOTE**: Target CLI source-owned note.
`;
}

function fixture(tag) {
  const root = mkdtempSync(join(tmpdir(), `${tag}-`));
  const deck = join(root, "deck_style_master_cli");
  const runDir = join(deck, "3_versions", "v1");
  initBundle(deck, null, "keynote", "dark-executive");
  writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.jpg"), LOCAL_PNG);
  writeFileSync(styleAsset(runDir, STYLE_MASTER_PROMPT), "Use a clear editorial visual system with no readable text.\n", "utf8");
  writeFileSync(join(runDir, "slide-specifications.md"), source(), "utf8");
  return { root, deck, runDir };
}

describe("Style Master process CLI", () => {
  it("keeps inspect current-only and rejects zero-cost authorization or generation", () => {
    const value = fixture("style-master-cli-assertion");
    try {
      const planned = run(["style-master", "plan", value.runDir, "--candidate-count", "0"]);
      expect(planned.status, planned.stderr).toBe(0);
      const firstPlan = JSON.parse(planned.stdout);

      for (const operation of ["authorize", "generate"]) {
        const result = run(["style-master", operation, value.runDir, "--plan-hash", firstPlan.plan_sha256]);
        expect(result.status, result.stderr).toBe(1);
        expect(result.stdout).toBe("");
        expect(finalDiagnostic(result.stderr)).toMatchObject({
          diagnostic: {
            operation: `style-master-${operation}`,
            category: "artifact",
            next: { action: "inspect", requires_human: false },
          },
        });
      }

      const repaired = run([
        "style-master", "accept", value.runDir,
        "--plan-hash", firstPlan.plan_sha256,
        "--decision", "repair",
      ]);
      expect(repaired.status, repaired.stderr).toBe(0);
      const successor = run(["style-master", "plan", value.runDir, "--candidate-count", "0"]);
      expect(successor.status, successor.stderr).toBe(0);
      expect(JSON.parse(successor.stdout).plan_sha256).not.toBe(firstPlan.plan_sha256);

      const beforeStaleInspect = treeSnapshot(value.deck);
      const stale = run(["style-master", "inspect", value.runDir, "--plan-hash", firstPlan.plan_sha256]);
      expect(stale.status, stale.stderr).toBe(1);
      expect(stale.stdout).toBe("");
      expect(finalDiagnostic(stale.stderr)).toMatchObject({
        diagnostic: {
          operation: "style-master-inspect",
          reason: { kind: "style_master_plan_not_current" },
          next: { action: "inspect", requires_human: false },
        },
      });
      expect(treeSnapshot(value.deck)).toEqual(beforeStaleInspect);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("rejects a legacy or bypass-shaped input before plan publication", () => {
    const value = fixture("style-master-cli-bypass");
    try {
      const before = treeSnapshot(value.deck);
      const result = run([
        "style-master", "plan", value.runDir,
        "--candidate-count", "0",
        "--plan-hash", "a".repeat(64),
      ]);
      expect(result.status, result.stderr).toBe(1);
      expect(result.stdout).toBe("");
      expect(finalDiagnostic(result.stderr)).toMatchObject({
        code: "USAGE",
        diagnostic: { category: "usage", next: { action: "fix_arguments", requires_human: false } },
      });
      expect(treeSnapshot(value.deck)).toEqual(before);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("preserves an unknown submission for reasoned exact-plan abandonment", () => {
    const value = fixture("style-master-cli-unknown");
    try {
      const planned = run(["style-master", "plan", value.runDir, "--candidate-count", "1"]);
      expect(planned.status, planned.stderr).toBe(0);
      const plan = JSON.parse(planned.stdout);
      const authorized = run(["style-master", "authorize", value.runDir, "--plan-hash", plan.plan_sha256]);
      expect(authorized.status, authorized.stderr).toBe(0);

      const generated = run([
        "style-master", "generate", value.runDir, "--plan-hash", plan.plan_sha256,
      ], {
        IMAGE2_API_KEY: "test-style-master-key",
        IMAGE2_BASE_URL: "http://127.0.0.1:1",
      });
      expect(generated.status, generated.stderr).toBe(1);
      expect(generated.stdout).toBe("");
      expect(finalDiagnostic(generated.stderr)).toMatchObject({
        diagnostic: {
          category: "gate",
          reason: { kind: "style_master_attempt_unknown" },
          next: { action: "review", requires_human: true },
        },
      });

      const abandoned = run([
        "style-master", "abandon", value.runDir,
        "--plan-hash", plan.plan_sha256,
        "--reason", "Transport did not return an authoritative result.",
      ]);
      expect(abandoned.status, abandoned.stderr).toBe(0);
      expect(JSON.parse(abandoned.stdout)).toMatchObject({
        plan_sha256: plan.plan_sha256,
        next_action: "plan_style_master_successor",
      });
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("rejects a comma-list endpoint before Style Master fetch and preserves its pre-submit claim", () => {
    const value = fixture("style-master-cli-comma-endpoint");
    const marker = join(value.root, "style-master-fetches.log");
    const preload = join(process.cwd(), "tests", "helpers", "fixtures", "mock_image_probe_fetch.mjs");
    const apiKey = "STYLE_MASTER_COMMA_LIST_SECRET";
    const endpointList = "https://first.example.test/v1,https://second.example.test/v1";
    try {
      const planned = run(["style-master", "plan", value.runDir, "--candidate-count", "1"]);
      expect(planned.status, planned.stderr).toBe(0);
      const plan = JSON.parse(planned.stdout);
      const authorized = run(["style-master", "authorize", value.runDir, "--plan-hash", plan.plan_sha256]);
      expect(authorized.status, authorized.stderr).toBe(0);

      const generated = run([
        "style-master", "generate", value.runDir, "--plan-hash", plan.plan_sha256,
      ], {
        IMAGE2_API_KEY: apiKey,
        IMAGE2_BASE_URL: endpointList,
        PPTMAKER_IMAGE_PROBE_MARKER: marker,
      }, { nodeArgs: ["--import", preload] });

      expect(generated.status, generated.stderr).toBe(1);
      expect(generated.stdout).toBe("");
      expect(finalDiagnostic(generated.stderr)).toMatchObject({
        code: "FAILED",
        diagnostic: {
          operation: "style-master-generate",
          category: "environment",
          reason: { kind: "style_master_provider_credentials_unavailable" },
          next: { action: "repair_environment", requires_human: false },
        },
      });
      expect(`${generated.stdout}${generated.stderr}`).not.toContain(apiKey);
      expect(`${generated.stdout}${generated.stderr}`).not.toContain("first.example.test");
      expect(`${generated.stdout}${generated.stderr}`).not.toContain("second.example.test");
      expect(existsSync(marker)).toBe(false);

      const attemptPaths = styleMasterStorePaths(value.runDir, {
        plan_sha256: plan.plan_sha256,
        candidate_id: "candidate-001",
      });
      expect(JSON.parse(readFileSync(attemptPaths.candidate_attempt, "utf8"))).toMatchObject({
        status: "claimed",
        provider_request_sha256: null,
      });
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("rejects a comma-list endpoint before Page Authority fetch or attempt creation", () => {
    const value = fixture("page-authority-cli-comma-endpoint");
    const marker = join(value.root, "page-authority-fetches.log");
    const preload = join(process.cwd(), "tests", "helpers", "fixtures", "mock_image_probe_fetch.mjs");
    const apiKey = "PAGE_AUTHORITY_COMMA_LIST_SECRET";
    const endpointList = "https://first.example.test/v1,https://second.example.test/v1";
    try {
      const stylePlan = run(["style-master", "plan", value.runDir, "--candidate-count", "0"]);
      expect(stylePlan.status, stylePlan.stderr).toBe(0);
      const reviewed = run([
        "style-master", "review", value.runDir,
        "--plan-hash", JSON.parse(stylePlan.stdout).plan_sha256,
      ]);
      expect(reviewed.status, reviewed.stderr).toBe(0);
      const accepted = run([
        "style-master", "accept", value.runDir,
        "--plan-hash", JSON.parse(stylePlan.stdout).plan_sha256,
        "--decision", "proceed",
        "--candidate-id", "local-existing",
      ]);
      expect(accepted.status, accepted.stderr).toBe(0);

      const planned = run(["image2", "plan", value.runDir]);
      expect(planned.status, planned.stderr).toBe(0);
      const plan = JSON.parse(planned.stdout);
      const piloted = run([
        "image2", "pilot", value.runDir,
        "--plan-hash", plan.plan_hash,
        "--slide-id", "DeckGo",
      ]);
      expect(piloted.status, piloted.stderr).toBe(0);
      const batch = JSON.parse(piloted.stdout).batch;
      const authorized = run([
        "image2", "authorize", value.runDir,
        "--plan-hash", plan.plan_hash,
        "--batch-hash", batch.batch_hash,
      ]);
      expect(authorized.status, authorized.stderr).toBe(0);

      const generated = run([
        "image2", "generate", value.runDir,
        "--plan-hash", plan.plan_hash,
        "--batch-hash", batch.batch_hash,
      ], {
        IMAGE2_API_KEY: apiKey,
        IMAGE2_BASE_URL: endpointList,
        PPTMAKER_IMAGE_PROBE_MARKER: marker,
      }, { nodeArgs: ["--import", preload] });

      expect(generated.status, generated.stderr).toBe(1);
      expect(generated.stdout).toBe("");
      expect(finalDiagnostic(generated.stderr)).toMatchObject({
        code: "FAILED",
        diagnostic: {
          operation: "target-page-authority-generate",
          category: "provider",
          reason: { kind: "page_authority_provider_credentials_unavailable" },
          next: { action: "repair_environment", requires_human: false },
        },
      });
      expect(`${generated.stdout}${generated.stderr}`).not.toContain(apiKey);
      expect(`${generated.stdout}${generated.stderr}`).not.toContain("first.example.test");
      expect(`${generated.stdout}${generated.stderr}`).not.toContain("second.example.test");
      expect(existsSync(marker)).toBe(false);
      expect(readProgressiveRawPlanDirectRecords(value.runDir, { plan_sha256: plan.plan_hash }).attempts).toEqual([]);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("reports committed selection partial success with exact non-human replay", () => {
    const value = fixture("style-master-cli-projection");
    const compatibilityDirectory = join(value.deck, "2_backbone", "visual-style");
    try {
      const planned = run(["style-master", "plan", value.runDir, "--candidate-count", "0"]);
      expect(planned.status, planned.stderr).toBe(0);
      const plan = JSON.parse(planned.stdout);
      const reviewed = run(["style-master", "review", value.runDir, "--plan-hash", plan.plan_sha256]);
      expect(reviewed.status, reviewed.stderr).toBe(0);

      chmodSync(compatibilityDirectory, 0o500);
      let failed;
      try {
        failed = run([
          "style-master", "accept", value.runDir,
          "--plan-hash", plan.plan_sha256,
          "--decision", "proceed",
          "--candidate-id", "local-existing",
        ]);
      } finally {
        chmodSync(compatibilityDirectory, 0o700);
      }
      expect(failed.status, failed.stderr).toBe(1);
      expect(failed.stdout).toBe("");
      const selection = resolveEffectiveStyleMasterSelection(value.deck, { runDir: value.runDir });
      expect(selection).toMatchObject({ ok: true, record: { plan_sha256: plan.plan_sha256 } });
      const diagnostic = finalDiagnostic(failed.stderr);
      expect(diagnostic).toMatchObject({
        code: "FAILED",
        where: "ppt_flow.style-master.accept",
        diagnostic: {
          category: "artifact",
          subject: { kind: "style_master_selection", id: selection.selection_sha256 },
          reason: { kind: "compatibility_projection_failed" },
          next: { action: "rerun", requires_human: false },
        },
      });
      expect(diagnostic.diagnostic.next.invocation).toEqual({
        program: "node",
        args: [
          expect.stringContaining("ppt_flow.mjs"),
          "style-master",
          "accept",
          value.runDir,
          "--plan-hash",
          plan.plan_sha256,
          "--decision",
          "proceed",
          "--candidate-id",
          "local-existing",
        ],
      });

      const replay = run([
        "style-master", "accept", value.runDir,
        "--plan-hash", plan.plan_sha256,
        "--decision", "proceed",
        "--candidate-id", "local-existing",
      ]);
      expect(replay.status, replay.stderr).toBe(0);
      expect(JSON.parse(replay.stdout)).toMatchObject({
        replay: true,
        selection_sha256: selection.selection_sha256,
        compatibility_projection: { status: "rebuilt" },
      });
    } finally {
      chmodSync(compatibilityDirectory, 0o700);
      rmSync(value.root, { recursive: true, force: true });
    }
  });
});
