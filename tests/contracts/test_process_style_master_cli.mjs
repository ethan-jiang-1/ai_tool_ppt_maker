import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import {
  STYLE_MASTER_PROMPT,
  initBundle,
  styleAsset,
} from "../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import { resolveEffectiveStyleMasterSelection } from "../../ppt_maker_harness/scripts/shared/state/state.mjs";
import { styleMasterStorePaths } from "../../ppt_maker_harness/scripts/shared/image2/style_master_store.mjs";
import { readProgressiveRawPlanDirectRecords } from "../../ppt_maker_harness/scripts/shared/image2/page_image_progressive_store.mjs";
import { pageImageWorkflowPaths } from "../../ppt_maker_harness/scripts/shared/run-bundle/page_image_paths.mjs";
import { writeConfirmedImage2ProviderProfile } from "../helpers/image2_provider_profile.mjs";

const FLOW = "ppt_maker_harness/scripts/ppt_flow.mjs";
const LOCAL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAABHNCSVQICAgIfAhkiAAAAAFzUkdCAK7OHOkAAAANSURBVAiZY1AJyPoPAANYAd6lcnCEAAAAAElFTkSuQmCC",
  "base64",
);

function run(args, env = {}, { cwd = process.cwd(), nodeArgs = [] } = {}) {
  return spawnSync(process.execPath, [...nodeArgs, FLOW, ...args], {
    encoding: "utf8",
    timeout: 30_000,
    env: {
      ...process.env,
      IMAGE2_PROVIDER_PROFILE_ID: "test-image2-profile",
      ...env,
    },
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
  scheme: mnemonic
production:
  pipeline: page-image-workflow
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
  writeConfirmedImage2ProviderProfile(runDir);
  writeFileSync(join(deck, "2_backbone", "visual-style", "style_master.png"), LOCAL_PNG);
  writeFileSync(styleAsset(runDir, STYLE_MASTER_PROMPT), "Use a clear editorial visual system with no readable text.\n", "utf8");
  writeFileSync(join(runDir, "slide-specifications.md"), source(), "utf8");
  return { root, deck, runDir };
}

describe("Style Master process CLI", () => {
  it("plans a stale source-context successor without raw mutation or an inspect loop", () => {
    const value = fixture("style-master-cli-source-drift");
    try {
      const initialStyle = run(["style-master", "plan", value.runDir, "--candidate-count", "0"]);
      expect(initialStyle.status, initialStyle.stderr).toBe(0);
      const initialStylePlan = JSON.parse(initialStyle.stdout);
      const accepted = run([
        "style-master", "accept", value.runDir,
        "--plan-hash", initialStylePlan.plan_sha256,
        "--decision", "proceed",
        "--candidate-id", "local-existing",
      ]);
      expect(accepted.status, accepted.stderr).toBe(0);

      const initialRaw = run(["image2", "plan", value.runDir]);
      expect(initialRaw.status, initialRaw.stderr).toBe(0);
      const paths = pageImageWorkflowPaths(value.runDir);
      const stateBefore = readFileSync(join(value.deck, "_state", "state.yaml"));
      const rawPlanBefore = readFileSync(paths.target_raw_plan);
      const registryPath = join(value.deck, "2_backbone", "visual-style", "page-image-visual-language.yaml");
      writeFileSync(registryPath, readFileSync(registryPath, "utf8").replace("quiet depth", "quiet luminous depth"), "utf8");
      const sourcePath = join(value.runDir, "slide-specifications.md");
      writeFileSync(sourcePath, `${readFileSync(sourcePath, "utf8")}\n<!-- Style Master CLI successor -->\n`, "utf8");

      const blocked = run(["image2", "plan", value.runDir]);
      expect(blocked.status).toBe(1);
      expect(blocked.stdout).toBe("");
      expect(finalDiagnostic(blocked.stderr)).toMatchObject({
        diagnostic: {
          category: "artifact",
          reason: { kind: "target_style_master_stale" },
          next: { action: "plan_style_master_successor", requires_human: false },
        },
      });
      expect(readFileSync(join(value.deck, "_state", "state.yaml"))).toEqual(stateBefore);
      expect(readFileSync(paths.target_raw_plan)).toEqual(rawPlanBefore);

      const inspected = run(["style-master", "inspect", value.runDir]);
      expect(inspected.status, inspected.stderr).toBe(0);
      expect(JSON.parse(inspected.stdout)).toMatchObject({
        input_stale: true,
        terminal: true,
        next_action: "plan_style_master_successor",
      });
      const successor = run(["style-master", "plan", value.runDir, "--candidate-count", "0"]);
      expect(successor.status, successor.stderr).toBe(0);
      expect(JSON.parse(successor.stdout).plan_sha256).not.toBe(initialStylePlan.plan_sha256);
      expect(readFileSync(join(value.deck, "_state", "state.yaml"))).toEqual(stateBefore);
      expect(readFileSync(paths.target_raw_plan)).toEqual(rawPlanBefore);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

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

  it("rejects an undeclared or bypass-shaped input before plan publication", () => {
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

  it("rejects a comma-list endpoint before Page Image fetch or attempt creation", () => {
    const value = fixture("page-image-cli-comma-endpoint");
    const marker = join(value.root, "page-image-fetches.log");
    const preload = join(process.cwd(), "tests", "helpers", "fixtures", "mock_image_probe_fetch.mjs");
    const apiKey = "PAGE_IMAGE_COMMA_LIST_SECRET";
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
          operation: "target-page-image-generate",
          category: "provider",
          reason: { kind: "page_image_provider_credentials_unavailable" },
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

  it("reports PNG selection success without a JPEG replay surface", () => {
    const value = fixture("style-master-cli-projection");
    try {
      const planned = run(["style-master", "plan", value.runDir, "--candidate-count", "0"]);
      expect(planned.status, planned.stderr).toBe(0);
      const plan = JSON.parse(planned.stdout);
      const reviewed = run(["style-master", "review", value.runDir, "--plan-hash", plan.plan_sha256]);
      expect(reviewed.status, reviewed.stderr).toBe(0);

      const accepted = run([
        "style-master", "accept", value.runDir,
        "--plan-hash", plan.plan_sha256,
        "--decision", "proceed",
        "--candidate-id", "local-existing",
      ]);
      expect(accepted.status, accepted.stderr).toBe(0);
      const selection = resolveEffectiveStyleMasterSelection(value.deck, { runDir: value.runDir });
      expect(selection).toMatchObject({ ok: true, record: { plan_sha256: plan.plan_sha256 } });
      const result = JSON.parse(accepted.stdout);
      expect(result).toMatchObject({ replay: false, selection_sha256: selection.selection_sha256 });
      expect(Object.hasOwn(result, "presentation_jpeg_projection")).toBe(false);
      expect(readFileSync(join(value.deck, "2_backbone", "visual-style", "style_master.png"))).toEqual(LOCAL_PNG);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });
});
