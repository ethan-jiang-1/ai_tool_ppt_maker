import { describe, it, expect, vi, afterEach } from "vitest";
import {
  CLI_ERROR_CODES,
  formatCliError,
  emitCliError,
} from "../PPTMAKER_FRAMEWORK/scripts/lib/cli_error.mjs";

describe("cli_error", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exports the closed code set", () => {
    expect(Object.values(CLI_ERROR_CODES).sort()).toEqual(
      [
        "FAILED",
        "GATE_BLOCKED",
        "STATE_CORRUPTED",
        "TITLE_REVIEW_REQUIRED",
        "UNCAUGHT",
        "USAGE",
      ].sort()
    );
  });

  it("formatCliError builds ok:false envelope", () => {
    const env = formatCliError({
      code: CLI_ERROR_CODES.USAGE,
      message: "bad flag",
      hint: "see --help",
      where: "ppt_flow.init",
    });
    expect(env).toEqual({
      ok: false,
      code: "USAGE",
      message: "bad flag",
      hint: "see --help",
      where: "ppt_flow.init",
    });
  });

  it("rejects empty required fields", () => {
    expect(() =>
      formatCliError({
        code: CLI_ERROR_CODES.FAILED,
        message: "",
        hint: "x",
        where: "ppt_flow.x",
      })
    ).toThrow(/message/);
  });

  it("rejects illegal code", () => {
    expect(() =>
      formatCliError({
        code: "NOPE",
        message: "x",
        hint: "y",
        where: "ppt_flow.x",
      })
    ).toThrow(/illegal code/);
  });

  it("emitCliError writes one JSON line to stderr", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    emitCliError({
      code: CLI_ERROR_CODES.FAILED,
      message: "boom",
      hint: "retry",
      where: "ppt_flow.test",
    });
    expect(spy).toHaveBeenCalledTimes(1);
    const line = spy.mock.calls[0][0];
    expect(JSON.parse(line)).toMatchObject({
      ok: false,
      code: "FAILED",
      message: "boom",
    });
  });
});
