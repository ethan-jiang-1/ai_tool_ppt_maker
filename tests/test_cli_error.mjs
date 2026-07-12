import { describe, it, expect, vi, afterEach } from "vitest";
import {
  CLI_ERROR_CODES,
  EXECUTABLE_INVENTORY,
  formatCliError,
  emitCliError,
  parseCliErrorLine,
  createChildStderrFramer,
  normalizeDelegatedExit,
} from "../PPTMAKER_FRAMEWORK/scripts/lib/cli_error.mjs";
import { spawnSync } from "node:child_process";

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

  it("parseCliErrorLine accepts only the constitutional envelope", () => {
    expect(parseCliErrorLine(JSON.stringify({ ok: false, code: "FAILED", message: "x", hint: "y", where: "z" }))).toBeTruthy();
    expect(parseCliErrorLine('{"ok":false}')).toBeNull();
    expect(parseCliErrorLine("plain prose")).toBeNull();
  });

  it("every registered executable has side-effect-free help and one final failure envelope", () => {
    const failureArgs = {
      "bundle_layout.mjs": ["--structure-only"],
      "env-check.mjs": ["--smoke", "--probe-vendors"],
      "generate_style_master.mjs": [],
      "make_contact_sheet.mjs": [],
      "ppt_flow.mjs": ["nosuch"],
      "stage1_build_inputs.mjs": [],
      "stage2_generate_images.mjs": [],
      "stage3_lock_headers.mjs": [],
      "stage4_build_pptx.mjs": [],
      "stage5_inject_notes.mjs": [],
      "unified_pipeline.mjs": [],
    };
    expect(Object.keys(failureArgs).sort()).toEqual([...EXECUTABLE_INVENTORY].sort());
    for (const script of EXECUTABLE_INVENTORY) {
      const path = `PPTMAKER_FRAMEWORK/scripts/${script}`;
      const help = spawnSync("node", [path, "--help"], { encoding: "utf8", timeout: 10000 });
      expect(help.status, `${script} --help\n${help.stderr}`).toBe(0);
      expect(help.stderr).not.toMatch(/"ok"\s*:\s*false/);
      const failed = spawnSync("node", [path, ...failureArgs[script]], { encoding: "utf8", timeout: 10000 });
      expect(failed.status, `${script} deterministic failure`).not.toBe(0);
      const lines = failed.stderr.split(/\r?\n/).filter((line) => line.trim());
      const envelopeLines = lines.filter((line) => parseCliErrorLine(line));
      expect(envelopeLines, `${script} stderr:\n${failed.stderr}`).toHaveLength(1);
      expect(parseCliErrorLine(lines.at(-1)), `${script} final stderr line`).toBeTruthy();
    }
  }, 30000);

  it("frames fragmented/no-newline child envelopes and suppresses only the final JSON", () => {
    const relayed = [];
    const framer = createChildStderrFramer({ relay: (line) => relayed.push(line) });
    framer.push("diagnostic one\n{\"ok\":false,\"code\":\"FAILED\",");
    framer.push("\"message\":\"boom\",\"hint\":\"retry\",\"where\":\"child\"}");
    const result = framer.finish();
    expect(relayed.join("")).toContain("diagnostic one");
    expect(relayed.join("")).not.toContain('"ok":false');
    expect(result.childError).toMatchObject({ code: "FAILED", message: "boom" });
    expect(normalizeDelegatedExit(0, result.childError)).toBe(1);
  });

  it("relays prose-only and oversized child stderr with bounded fallback", () => {
    const relayed = [];
    const framer = createChildStderrFramer({ relay: (line) => relayed.push(line), maxCandidateBytes: 64 });
    framer.push("x".repeat(200));
    framer.push("\nplain failure");
    const result = framer.finish();
    expect(result.childError).toBeNull();
    expect(result.fallback.length).toBeLessThanOrEqual(4096);
    expect(relayed.join("").length).toBeGreaterThan(0);
    expect(normalizeDelegatedExit(null, null)).toBe(1);
  });
});
