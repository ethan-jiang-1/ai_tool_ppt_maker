import { describe, expect, it } from "vitest";

import {
  createInitialState,
  prepareStateWrite,
  startPlaybook,
  validateState,
} from "../../../ppt_maker_harness/scripts/shared/state/state.mjs";

describe("current playbook stack contract", () => {
  it("rejects a missing stack instead of normalizing it during a state write", () => {
    const state = createInitialState("deck", "keynote", "dark-executive", {
      workflow: "pure",
    });
    delete state.playbook_stack;

    expect(validateState(state)).toMatchObject({
      valid: false,
      errors: expect.arrayContaining(["playbook_stack must be an array"]),
    });
    expect(() => prepareStateWrite(state)).toThrow("STATE_PLAYBOOK_STACK_INVALID: playbook_stack must be an array");
    expect(() => startPlaybook(state, "create-deck", { replace: true, runVersion: "v1" }))
      .toThrow("STATE_PLAYBOOK_STACK_INVALID: playbook_stack must be an array");
  });

  it("rejects an incomplete frame before a state mutation", () => {
    const state = createInitialState("deck", "keynote", "dark-executive", {
      workflow: "framed",
    });
    state.playbook_stack = [{ playbook: "create-deck" }];

    expect(validateState(state)).toMatchObject({
      valid: false,
      errors: expect.arrayContaining(["playbook_stack[0] missing canonical run_version"]),
    });
    expect(() => prepareStateWrite(state)).toThrow("STATE_PLAYBOOK_STACK_INVALID: playbook_stack[0] missing canonical run_version");
  });
});
