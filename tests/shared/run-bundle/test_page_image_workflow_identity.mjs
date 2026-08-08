import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { deliverTargetFinalSlideManifest } from "../../../ppt_maker_harness/scripts/05-delivery/index.mjs";
import {
  PageImageSourceError,
  parsePageImageSource,
} from "../../../ppt_maker_harness/scripts/01-content/internal/page_image_source.mjs";
import {
  createProgressiveRawWorkPlan,
  validateProgressiveRawWorkPlan,
} from "../../../ppt_maker_harness/scripts/shared/image2/page_image_progressive_schema.mjs";
import { pageImageWorkflowPaths } from "../../../ppt_maker_harness/scripts/shared/run-bundle/page_image_paths.mjs";
import {
  UNSUPPORTED_PROTOCOL_EXPORT_ACTION,
  evaluateReplacementIdentity,
} from "../../../ppt_maker_harness/scripts/shared/run-bundle/page_image_workflow_identity.mjs";
import { readState, writeState } from "../../../ppt_maker_harness/scripts/shared/state/state.mjs";
import { inspectWorkflow } from "../../../ppt_maker_harness/scripts/shared/workflow/inspect_workflow.mjs";
import { pageImageProviderInputBinding } from "../../helpers/page_image_provider_input_binding.mjs";

const digest = (letter) => letter.repeat(64);

describe("Page Image Workflow replacement identity", () => {
  it("short-circuits retained v2 source, state, and every lifecycle record before decoding", () => {
    const source = evaluateReplacementIdentity({
      sourceBytes: Buffer.from("---\nproduction:\n  pipeline: page-authority-image2-v2\n---\n", "utf8"),
    });
    const state = evaluateReplacementIdentity({
      stateBytes: Buffer.from("pipeline: page-authority-image2-v2\nmode: image2-page-authority-v2\n", "utf8"),
    });
    const records = [
      "page-authority-source-receipt-v2",
      "page-authority-raw-work-plan-v3",
      "page-authority-raw-complete-review-v3",
      "page-authority-final-slide-manifest-v2",
      "page-authority-delivery-receipt-v2",
    ];

    for (const identity of [source, state, ...records.map((schema) => evaluateReplacementIdentity({
      record: Buffer.from(JSON.stringify({ schema }), "utf8"),
      recordKind: "retained-record",
    }))]) {
      expect(identity).toMatchObject({
        ok: false,
        code: "UNSUPPORTED_PROTOCOL",
        owner_action: UNSUPPORTED_PROTOCOL_EXPORT_ACTION,
        byte_preserving: true,
      });
    }
  });

  it("stops parser and Controller inspection before any source receipt or derived owner can run", () => {
    const root = mkdtempSync(join(tmpdir(), "page-image-v2-source-"));
    const runDir = join(root, "deck_identity_source", "3_versions", "v1");
    const source = "---\nproduction:\n  pipeline: page-authority-image2-v2\n---\n\n# Retained source\n";
    try {
      mkdirSync(runDir, { recursive: true });
      writeFileSync(join(runDir, "slide-specifications.md"), source, "utf8");

      const parserError = (() => {
        try {
          parsePageImageSource(source);
          return null;
        } catch (error) {
          return error;
        }
      })();
      expect(parserError).toBeInstanceOf(PageImageSourceError);
      expect(parserError.issues[0]).toMatchObject({
        code: "UNSUPPORTED_PROTOCOL",
        owner_action: UNSUPPORTED_PROTOCOL_EXPORT_ACTION,
        byte_preserving: true,
      });

      expect(inspectWorkflow({ runDir })).toMatchObject({
        posture: "hard-stop",
        root_cause: { kind: "unsupported-protocol" },
        primary_action: { action_id: UNSUPPORTED_PROTOCOL_EXPORT_ACTION },
      });
      expect(existsSync(join(runDir, "_generated"))).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects a malformed current marker while allowing the repaired current plan at the same checkpoint", () => {
    expect(evaluateReplacementIdentity({ sourcePipeline: "page-image-workflow-v0" })).toMatchObject({
      ok: false,
      code: "CURRENT_PROTOCOL_IDENTITY_INVALID",
    });

    const repaired = createProgressiveRawWorkPlan({
      run_version: "v1",
      source_receipt_sha256: digest("a"),
      source_epoch: 1,
      workflow: "pure",
      provider_profile_sha256: digest("b"),
      effective_style_master_sha256: digest("c"),
      source_execution_sha256: digest("d"),
      ordered_slide_ids: ["DeckGo"],
      items: [{
        slide_id: "DeckGo",
        raw_contract_sha256: digest("e"),
        provider_input_binding: pageImageProviderInputBinding({ workflow: "pure" }),
      }],
    });
    expect(validateProgressiveRawWorkPlan(repaired)).toMatchObject({ ok: true });
    expect(validateProgressiveRawWorkPlan({ schema: "page-authority-raw-work-plan-v3" })).toMatchObject({
      ok: false,
      code: "UNSUPPORTED_PROTOCOL",
    });
  });

  it("keeps retained state and final-delivery inputs byte-preserved without mutation", async () => {
    const root = mkdtempSync(join(tmpdir(), "page-image-identity-"));
    const deckDir = join(root, "deck_identity_fixture");
    const runDir = join(deckDir, "3_versions", "v1");
    const statePath = join(deckDir, "_state", "state.yaml");
    const retainedState = Buffer.from("pipeline: page-authority-image2-v2\nmode: image2-page-authority-v2\n", "utf8");
    try {
      mkdirSync(join(deckDir, "_state"), { recursive: true });
      mkdirSync(runDir, { recursive: true });
      writeFileSync(statePath, retainedState);

      expect(readState(deckDir, { purpose: "observe" })).toMatchObject({
        replacement_required: true,
        unsupported_protocol: true,
      });
      expect(() => writeState(deckDir, { pipeline: "page-image-workflow-v1" })).toThrow(/UNSUPPORTED_PROTOCOL/);
      expect(readFileSync(statePath)).toEqual(retainedState);

      const paths = pageImageWorkflowPaths(runDir);
      await expect(deliverTargetFinalSlideManifest({
        runDir,
        manifest: { schema: "page-authority-final-slide-manifest-v2" },
        acceptedRawEvidence: {},
        finalBytesBySlide: {},
        notesBySlide: {},
        sourceEpoch: 1,
      })).rejects.toMatchObject({ code: "UNSUPPORTED_PROTOCOL" });
      expect(existsSync(paths.final_root)).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
