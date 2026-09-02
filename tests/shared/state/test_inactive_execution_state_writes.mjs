// Tests: openspec/specs/node-specification/spec.md
// Tests: openspec/specs/playbook-execution/spec.md
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { initBundle } from "../../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import * as Pure from "../../../ppt_maker_harness/scripts/04-pure-image/index.mjs";
import * as Framed from "../../../ppt_maker_harness/scripts/03-framed-image/index.mjs";
import {
  createInitialState,
  readHistory,
  readState,
  repairKnownExecutionMismatch,
  resolveExactExecution,
  statePath,
  validateState,
  writeState,
} from "../../../ppt_maker_harness/scripts/shared/state/state.mjs";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const source = (workflow = "pure") => `---\nproduction:\n  pipeline: page-image-workflow\n  workflow: ${workflow}\n---\n`;

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "inactive-execution-state-"));
  const deck = join(root, "deck_state");
  const v1 = join(deck, "3_versions", "v1");
  const v2 = join(deck, "3_versions", "v2");
  initBundle(deck, null, "keynote", "dark-executive");
  writeFileSync(join(v1, "slide-specifications.md"), source());
  mkdirSync(v2, { recursive: true });
  writeFileSync(join(v2, "slide-specifications.md"), source());
  const state = createInitialState("state", "keynote", "dark-executive", {
    workflow: "pure",
  });
  state.run_version = "v2";
  state.continuation_target_version = "v2";
  state.production_identity.by_version["3_versions/v2"] = {
    workflow: "pure",
    source_epoch: 1,
  };
  writeState(deck, state);
  return { root, deck, v1, v2 };
}

function pollutedState(deck) {
  const state = structuredClone(readState(deck, { purpose: "observe" }));
  delete state.durable_state_present;
  return {
    ...state,
    code: "execution_run_version_mismatch",
    requested_run_version: "v2",
    active_run_version: "v2",
  };
}

async function invokeInactiveOperation(workflow, operation, runDir) {
  const input = operation === "prepareFramedProgressivePilotReview"
    ? { planHash: "0".repeat(64), batchHash: "0".repeat(64) }
    : {};
  try {
    await workflow[operation](runDir, input);
    throw new Error(`${operation} unexpectedly completed`);
  } catch (error) {
    expect(error).toMatchObject({ code: "execution_run_version_mismatch" });
  }
}

describe("inactive execution state writes", () => {
  it("separates a selected-run mismatch from durable state reads", () => {
    const value = fixture();
    try {
      const resolution = resolveExactExecution(value.deck, { runDir: value.v1 });
      expect(resolution).toMatchObject({
        ok: false,
        code: "execution_run_version_mismatch",
        requested_run_version: "v1",
        active_run_version: "v2",
      });
      const state = readState(value.deck, { purpose: "observe", runDir: value.v1 });
      expect(state).not.toHaveProperty("code");
      expect(state).not.toHaveProperty("requested_run_version");
      expect(state).not.toHaveProperty("active_run_version");
      expect(validateState(state)).toMatchObject({ valid: true });
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("rejects unknown diagnostic keys before creating a temporary state file", () => {
    const value = fixture();
    try {
      const before = readFileSync(statePath(value.deck));
      const candidate = structuredClone(readState(value.deck, { purpose: "observe" }));
      delete candidate.durable_state_present;
      candidate.code = "execution_run_version_mismatch";
      expect(() => writeState(value.deck, candidate, { expectedStateSha: sha256(before) }))
        .toThrow("STATE_CANDIDATE_INVALID");
      expect(readFileSync(statePath(value.deck))).toEqual(before);
      expect(readdirSync(join(value.deck, "_state")).filter((name) => name.startsWith(".state.yaml.tmp-"))).toEqual([]);
      const validCandidate = structuredClone(readState(value.deck, { purpose: "observe" }));
      expect(() => writeState(value.deck, validCandidate, { expectedStateSha: "0".repeat(64) }))
        .toThrow("CONFLICT: state precondition changed");
      expect(readFileSync(statePath(value.deck))).toEqual(before);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("repairs only the exact active BUG-066 signature and is idempotent", () => {
    const value = fixture();
    try {
      writeFileSync(statePath(value.deck), JSON.stringify(pollutedState(value.deck), null, 2));
      expect(repairKnownExecutionMismatch(value.deck, { runDir: value.v2 }))
        .toMatchObject({ ok: true, status: "repaired", run_version: "v2" });
      expect(validateState(readState(value.deck, { purpose: "observe" }))).toMatchObject({ valid: true });
      expect(readHistory(value.deck)).toHaveLength(1);
      const bytes = readFileSync(statePath(value.deck));
      expect(repairKnownExecutionMismatch(value.deck, { runDir: value.v2 }))
        .toMatchObject({ ok: true, status: "no-repair-needed", run_version: "v2" });
      expect(readFileSync(statePath(value.deck))).toEqual(bytes);
      expect(readHistory(value.deck)).toHaveLength(1);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("preserves broader, version-disagreed, inactive, source, and journal-fenced records", () => {
    const cases = [
      {
        label: "extra key",
        mutate(state) { state.unrelated = true; },
        run: "v2",
        code: "REPAIR_SIGNATURE_INVALID",
      },
      {
        label: "version disagreement",
        mutate(state) { state.requested_run_version = "v1"; },
        run: "v2",
        code: "REPAIR_SIGNATURE_INVALID",
      },
      {
        label: "inactive selection",
        mutate() {},
        run: "v1",
        code: "execution_run_version_mismatch",
      },
      {
        label: "source identity",
        mutate(_state, value) { writeFileSync(join(value.v2, "slide-specifications.md"), "# retained invalid source\n"); },
        run: "v2",
        code: "MARKER_INVALID",
      },
      {
        label: "journal fence",
        mutate(_state, value) {
          writeFileSync(join(value.deck, "_state", "gate-approval-journal.json"), JSON.stringify({ owner_token: "owner", new_state_sha256: "a".repeat(64) }));
        },
        run: "v2",
        code: "CONFLICT",
      },
    ];
    for (const testCase of cases) {
      const value = fixture();
      try {
        const state = pollutedState(value.deck);
        testCase.mutate(state, value);
        writeFileSync(statePath(value.deck), JSON.stringify(state, null, 2));
        const before = readFileSync(statePath(value.deck));
        expect(repairKnownExecutionMismatch(value.deck, { runVersion: testCase.run }))
          .toMatchObject({ ok: false, code: testCase.code });
        expect(readFileSync(statePath(value.deck))).toEqual(before);
        expect(existsSync(join(value.deck, "_state", "history.jsonl"))).toBe(false);
      } finally {
        rmSync(value.root, { recursive: true, force: true });
      }
    }
  });

  it("preflights every side-effecting Pure and Framed API before any inactive-run write", async () => {
    const value = fixture();
    try {
      const before = {
        state: readFileSync(statePath(value.deck)),
        v1Source: readFileSync(join(value.v1, "slide-specifications.md")),
        v2Source: readFileSync(join(value.v2, "slide-specifications.md")),
      };
      for (const workflow of [Pure, Framed]) {
        const map = workflow.PURE_IMAGE_OPERATION_MAP || workflow.FRAMED_IMAGE_OPERATION_MAP;
        for (const operation of map.side_effecting) {
          await invokeInactiveOperation(workflow, operation, value.v1);
        }
      }
      expect(readFileSync(statePath(value.deck))).toEqual(before.state);
      expect(readFileSync(join(value.v1, "slide-specifications.md"))).toEqual(before.v1Source);
      expect(readFileSync(join(value.v2, "slide-specifications.md"))).toEqual(before.v2Source);
      expect(existsSync(join(value.deck, "_state", "history.jsonl"))).toBe(false);
      expect(readdirSync(join(value.v1, "_generated")).filter((name) => name !== "README.md")).toEqual([]);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });
});
