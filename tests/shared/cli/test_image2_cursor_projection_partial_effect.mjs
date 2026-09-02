// Tests: openspec/specs/cli-surface/spec.md
// Tests: openspec/specs/diagnostic-facts/spec.md
import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCanvas } from "@napi-rs/canvas";

vi.mock("../../../ppt_maker_harness/scripts/shared/cli/cli_artifact_view.mjs", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    advanceProgressiveControllerCheckpoint: async () => {
      const error = new Error("TARGET_PROGRESSIVE_CHECKPOINT_NODE_UNKNOWN");
      error.code = "TARGET_PROGRESSIVE_CHECKPOINT_NODE_UNKNOWN";
      throw error;
    },
  };
});

import { initBundle } from "../../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import { resolvePureStyleMasterScope } from "../../../ppt_maker_harness/scripts/04-pure-image/index.mjs";
import { commandImage2 } from "../../../ppt_maker_harness/scripts/shared/cli/commands/image2.mjs";
import { acceptLocalStyleMasterFixture } from "../../helpers/accepted_style_master.mjs";

const cleanupRoots = [];

afterEach(() => {
  while (cleanupRoots.length > 0) rmSync(cleanupRoots.pop(), { recursive: true, force: true });
});

describe("image2 cursor projection partial-effect", () => {
  it("keeps a persisted plan as partial-effect when cursor projection fails", async () => {
    const root = mkdtempSync(join(tmpdir(), "image2-cursor-partial-"));
    cleanupRoots.push(root);
    const deck = join(root, "deck_image2_cursor_partial");
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

**TITLE**: Cursor partial-effect
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

    const logs = [];
    const errors = [];
    const logSpy = vi.spyOn(console, "log").mockImplementation((line) => { logs.push(String(line)); });
    const errSpy = vi.spyOn(console, "error").mockImplementation((line) => { errors.push(String(line)); });
    let code;
    try {
      code = await commandImage2("plan", runDir, {});
    } finally {
      logSpy.mockRestore();
      errSpy.mockRestore();
    }

    expect(code).toBe(1);
    const report = JSON.parse(logs.at(-1));
    expect(report.state).toBe("partial-effect");
    expect(report.partial.cursor_projection.status).toBe("failed");
    expect(report.effect).toBeTruthy();
    const envelope = JSON.parse(errors.filter((line) => line.startsWith("{")).at(-1));
    expect(envelope.diagnostic.category).not.toBe("internal");
    expect(envelope.diagnostic.next.action).not.toBe("report_internal");
    expect(envelope.diagnostic.reason.kind).toBe("progressive_checkpoint_projection_failed");
  });
});
