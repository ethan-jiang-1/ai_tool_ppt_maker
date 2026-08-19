import { afterEach, describe, expect, it, vi } from "vitest";
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  CLI_BOUNDS,
  CLI_DIAGNOSTIC_SCHEMA,
  CLI_DIAGNOSTIC_CATEGORIES,
  CLI_ERROR_CODES,
  CLI_JSON_REPORT_SCHEMAS,
  CLI_NEXT_ACTIONS,
  EXECUTABLE_INVENTORY,
  PPT_FLOW_COMMAND_INVENTORY,
  buildDelegatedDiagnostic,
  createChildOutputCollector,
  createCliNext,
  emitCliError,
  formatCliError,
  hasSupportedCliDiagnostic,
  normalizeDelegatedExit,
  parseCliErrorLine,
  renderCliHumanError,
  sanitizeCliDiagnostic,
  validateCliJsonReport,
} from "../../../ppt_maker_harness/scripts/shared/cli/cli_error.mjs";

const ROOT = resolve(import.meta.dirname, "..", "..", "..");
const SCRIPTS = join(ROOT, "ppt_maker_harness", "scripts");
const BOOTSTRAP = join(SCRIPTS, "shared", "cli", "cli_bootstrap.mjs");

function recursiveMjs(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) files.push(...recursiveMjs(path));
    else if (entry.endsWith(".mjs")) files.push(path);
  }
  return files;
}

function envelopeLines(stderr) {
  return stderr.split(/\r?\n/).filter(Boolean).map(parseCliErrorLine).filter(Boolean);
}

describe("cli_error", () => {
  afterEach(() => vi.restoreAllMocks());

  it("exports the closed code/category/action sets", () => {
    expect(Object.values(CLI_ERROR_CODES).sort()).toEqual([
      "FAILED", "GATE_BLOCKED", "STATE_CORRUPTED", "TITLE_REVIEW_REQUIRED", "UNCAUGHT", "USAGE",
    ].sort());
    expect(CLI_DIAGNOSTIC_CATEGORIES).toEqual([
      "usage", "source_validation", "structure", "artifact", "gate", "environment",
      "provider", "delegated", "interrupted", "internal",
    ]);
    expect(CLI_NEXT_ACTIONS).toContain("edit_source");
    expect(CLI_NEXT_ACTIONS).toContain("report_internal");
  });

  it("builds a mandatory bounded current envelope and discards stack", () => {
    const env = formatCliError({
      code: CLI_ERROR_CODES.USAGE,
      message: "bad flag",
      hint: "see --help",
      where: "ppt_flow.init",
      stack: "STACK_SENTINEL",
    });
    expect(env).toMatchObject({
      ok: false,
      code: "USAGE",
      message: "bad flag",
      diagnostic: {
        schema: CLI_DIAGNOSTIC_SCHEMA,
        category: "usage",
        next: { action: "fix_arguments", requires_human: false },
      },
    });
    expect(env).not.toHaveProperty("stack");
    expect(Buffer.byteLength(JSON.stringify(env))).toBeLessThanOrEqual(CLI_BOUNDS.envelopeBytes);
  });

  it("keeps top-level validation strict", () => {
    expect(() => formatCliError({ code: "NOPE", message: "x", hint: "y", where: "z" })).toThrow(/illegal code/);
    expect(() => formatCliError({ code: CLI_ERROR_CODES.FAILED, message: "", hint: "y", where: "z" })).toThrow(/message/);
  });

  it("rejects incomplete or malformed envelopes", () => {
    const incomplete = parseCliErrorLine(JSON.stringify({
      ok: false, code: "FAILED", message: "x", hint: "y", where: "z", stack: "SECRET_STACK",
    }));
    expect(incomplete).toBeNull();
    const malformed = parseCliErrorLine(JSON.stringify({
      ok: false, code: "FAILED", message: "x", hint: "y", where: "z",
      diagnostic: { schema: CLI_DIAGNOSTIC_SCHEMA, category: "provider", next: { action: "rerun", requires_human: "no", default: "retry" } },
    }));
    expect(malformed).toBeNull();
    const versioned = parseCliErrorLine(JSON.stringify({
      ok: false, code: "FAILED", message: "x", hint: "y", where: "z",
      diagnostic: { version: 1, category: "provider", next: { action: "rerun", requires_human: false, default: "retry" } },
    }));
    expect(versioned).toBeNull();
  });

  it("preserves structured consumer facts when producer prose changes", () => {
    const diagnostic = {
      schema: CLI_DIAGNOSTIC_SCHEMA,
      category: "source_validation",
      next: createCliNext("edit_source", {
        default: "Repair the current source and rerun the plan checkpoint.",
      }),
    };
    const first = parseCliErrorLine(JSON.stringify({
      ok: false,
      code: "FAILED",
      message: "Framed proof could not establish text fit.",
      hint: "The layout proof stopped before provider work.",
      where: "ppt_flow.image2.target.plan",
      diagnostic,
    }));
    const second = parseCliErrorLine(JSON.stringify({
      ok: false,
      code: "FAILED",
      message: "A different human summary.",
      hint: "Different explanatory wording.",
      where: "ppt_flow.image2.target.plan",
      diagnostic,
    }));

    expect(hasSupportedCliDiagnostic(first)).toBe(true);
    expect(hasSupportedCliDiagnostic(second)).toBe(true);
    expect(first?.diagnostic).toEqual(second?.diagnostic);
    expect(second?.diagnostic).toMatchObject({
      category: "source_validation",
      next: { action: "edit_source", requires_human: false },
    });
  });

  it("falls back the whole diagnostic when required current fields are malformed", () => {
    const diagnostic = sanitizeCliDiagnostic({
      schema: CLI_DIAGNOSTIC_SCHEMA,
      category: "gate",
      next: { action: "approve", requires_human: false, default: "approve it" },
      source: { path: "/tmp/source.md" },
    });
    expect(diagnostic).toEqual({
      schema: CLI_DIAGNOSTIC_SCHEMA,
      category: "internal",
      next: {
        action: "report_internal",
        requires_human: false,
        default: "Inspect the named command location and report the Harness failure.",
      },
    });
  });

  it("sanitizes all leaf shapes, token grammars, bounds, and aggregate omission", () => {
    const issues = Array.from({ length: 25 }, (_, index) => ({
      message: `invalid field ${index}`,
      subject: { kind: "slide", id: `s${index}`, field: "RENDER MODE" },
      source: { path: `/tmp/spec ${index}.md`, line: index + 1 },
      reason: { kind: "invalid_enum", actual: "invalid-mode", expected: ["framed", "pure"] },
      lineage: [{ kind: "source", path: `/tmp/spec ${index}.md`, stage: "input" }],
      nested: { ignored: true },
    }));
    const diagnostic = sanitizeCliDiagnostic({
      schema: CLI_DIAGNOSTIC_SCHEMA,
      category: "source_validation",
      stage: "stage1",
      operation: "validate-specs",
      ignored: true,
      issues,
      next: createCliNext("edit_source", {
        inspect: Array.from({ length: 20 }, (_, index) => ({ path: `/tmp/spec ${index}.md`, line: index + 1 })),
        invocation: { program: "node", args: ["script.mjs", "--run-dir", "/tmp/deck with spaces"] },
        default: "Fix the named source fields, then rerun validation.",
      }),
    });
    expect(diagnostic.issues).toHaveLength(20);
    expect(diagnostic.omitted_count).toBe(5);
    expect(diagnostic.next.inspect).toHaveLength(16);
    expect(diagnostic.truncated).toBe(true);
    expect(diagnostic).not.toHaveProperty("ignored");
    expect(Buffer.byteLength(JSON.stringify(diagnostic))).toBeLessThanOrEqual(CLI_BOUNDS.diagnosticBytes);
  });

  it("projects the additive source_valid observation only as literal true", () => {
    const base = {
      schema: CLI_DIAGNOSTIC_SCHEMA,
      category: "artifact",
      reason: { kind: "target_source_state_identity_mismatch" },
      next: { action: "repair_prerequisite", requires_human: false, default: "Rebind source/state identity, then rerun validate." },
    };
    expect(sanitizeCliDiagnostic({ ...base, source_valid: true }).source_valid).toBe(true);
    expect(sanitizeCliDiagnostic({ ...base, source_valid: false })).not.toHaveProperty("source_valid");
    expect(sanitizeCliDiagnostic({ ...base, source_valid: "yes" })).not.toHaveProperty("source_valid");
    expect(sanitizeCliDiagnostic({ ...base })).not.toHaveProperty("source_valid");
  });

  it("omits credential-bearing invocation and safe-domain sentinel values", () => {
    const diagnostic = sanitizeCliDiagnostic({
      schema: CLI_DIAGNOSTIC_SCHEMA,
      category: "provider",
      reason: { kind: "request_failed", actual: "RAW_PROVIDER_BODY_SENTINEL" },
      next: {
        action: "repair_environment",
        requires_human: false,
        default: "API_KEY_SENTINEL must not be released",
        invocation: { program: "node", args: ["script.mjs", "--token", "ACCESS_TOKEN_SENTINEL"] },
      },
    });
    expect(JSON.stringify(diagnostic)).not.toMatch(/SENTINEL/);
    expect(diagnostic.category).toBe("internal");
  });

  it("emits immediately without a direct transaction", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    emitCliError({ code: CLI_ERROR_CODES.FAILED, message: "boom", hint: "retry", where: "unit" });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(parseCliErrorLine(spy.mock.calls[0][0])?.diagnostic?.schema).toBe(CLI_DIAGNOSTIC_SCHEMA);
  });

  it("recursively detects exactly the registered direct CLI candidates", () => {
    const exceptions = new Map([
      ["shared/cli/cli_bootstrap.mjs", "shared bootstrap inspects argv but is not a public CLI"],
      ["shared/cli/cli_error.mjs", "shared diagnostic producer is not a direct entry"],
      ["contracts/harness_architecture.mjs", "architecture checker is an import-only contract"],
    ]);
    const detected = recursiveMjs(SCRIPTS).filter((path) => {
      const rel = relative(SCRIPTS, path).replaceAll("\\", "/");
      if (exceptions.has(rel)) return false;
      const source = readFileSync(path, "utf8");
      return /cli_bootstrap\.mjs\?entry=/.test(source) ||
        /installStandaloneFailureEnvelope/.test(source) ||
        /\.parseAsync\(process\.argv\)/.test(source);
    }).map((path) => relative(SCRIPTS, path).replaceAll("\\", "/")).sort();
    expect(detected).toEqual([...EXECUTABLE_INVENTORY].sort());
  });

  it("requires every direct executable to use the matching literal first import", () => {
    for (const entry of EXECUTABLE_INVENTORY) {
      const source = readFileSync(join(SCRIPTS, entry), "utf8");
      const firstImport = source.match(/^import\s+[^;]+;/m)?.[0];
      const bootstrapSpecifier = relative(dirname(join(SCRIPTS, entry)), BOOTSTRAP).replaceAll("\\", "/");
      expect(firstImport, entry).toBe(`import "${bootstrapSpecifier.startsWith(".") ? bootstrapSpecifier : `./${bootstrapSpecifier}`}?entry=${entry}";`);
    }
  });

  it("matches the current Page Image ppt_flow registry", () => {
    const source = readFileSync(join(SCRIPTS, "ppt_flow.mjs"), "utf8");
    const commands = [...source.matchAll(/\.command\("([^"]+)"\)/g)].map((match) => match[1]);
    expect(commands).toEqual(PPT_FLOW_COMMAND_INVENTORY);
  });

  it("has explicit return-category audits for every executable and ppt_flow command", () => {
    const categories = ["help", "usage", "contextual", "delegated", "interruption", "prose_success", "json_success"];
    const focused = (file, test) => ({ probe: { file, test } });
    const na = (reason) => ({ notApplicable: reason });
    const CLI_ERROR_FILE = "tests/shared/cli/test_process_cli_error.mjs";
    const CLI_SURFACE_FILE = "tests/contracts/test_cli_surface.mjs";
    const CLI_HELP = "every registered executable has side-effect-free help and one final current failure envelope";
    const CLI_DELEGATED = "suppresses child failure prose and preserves only registered current evidence";
    const CLI_INTERRUPTION = "handles catchable interruption once without reporting an internal defect";
    const CLI_SURFACE_CASE = "has no retired command and rejects undeclared observation and execution without writes";
    const executableAudit = Object.fromEntries(EXECUTABLE_INVENTORY.map((entry) => {
      const contextual = {
        "shared/run-bundle/bundle_layout.mjs": focused("tests/shared/run-bundle/test_page_image_layout.mjs", "reports malformed progressive page-production topology without selecting or cleaning it"),
        "00-setup/env-check.mjs": focused("tests/00-setup/test_process_env_check.mjs", "rejects version suffixes outside the narrow allowlist"),
        "shared/run-bundle/lessons.mjs": focused("tests/shared/run-bundle/test_process_lessons.mjs", "hard-stops a locatorless Deck before creating a lesson"),
        "ppt_flow.mjs": focused(CLI_SURFACE_FILE, CLI_SURFACE_CASE),
      }[entry];
      const jsonSuccess = {
        "00-setup/env-check.mjs": focused("tests/00-setup/test_process_env_check.mjs", "produces JSON with --json"),
        "ppt_flow.mjs": focused(CLI_SURFACE_FILE, CLI_SURFACE_CASE),
        "shared/run-bundle/lessons.mjs": focused("tests/shared/run-bundle/test_process_lessons.mjs", "supports --json output"),
      }[entry];
      return [entry, {
        help: focused(CLI_ERROR_FILE, CLI_HELP),
        usage: focused(CLI_ERROR_FILE, CLI_HELP),
        contextual: contextual || na("No registered contextual failure case exists for this executable; its failure surface is asserted by its owning owner suite."),
        delegated: entry === "ppt_flow.mjs" ? focused(CLI_ERROR_FILE, CLI_DELEGATED) : na("Executable does not own a subprocess boundary."),
        interruption: focused(CLI_ERROR_FILE, CLI_INTERRUPTION),
        prose_success: focused(CLI_ERROR_FILE, CLI_HELP),
        json_success: jsonSuccess || na("No documented JSON success mode."),
      }];
    }));
    const delegatedCommands = new Set(["doctor", "validate", "build", "refresh", "test"]);
    const commandFile = {
      "style-master": "tests/contracts/test_process_style_master_cli.mjs",
      "image2": "tests/shared/cli/test_process_target_diagnostics.mjs",
      "slides": "tests/01-content/test_target_structural_cli.mjs",
      "status": "tests/shared/cli/test_process_target_diagnostics.mjs",
      "state": "tests/shared/cli/test_process_target_diagnostics.mjs",
      "validate": "tests/shared/cli/test_process_target_diagnostics.mjs",
      "build": "tests/shared/cli/test_process_target_diagnostics.mjs",
      "refresh": "tests/shared/cli/test_process_target_diagnostics.mjs",
      "doctor": "tests/00-setup/test_process_env_check.mjs",
      "init": "tests/shared/run-bundle/test_page_image_layout.mjs",
      "new-version": "tests/01-content/test_clean_page_image_new_version_cli.mjs",
      "reset-unproduced-v1": "tests/shared/cli/test_process_reset_unproduced_v1.mjs",
      "paginate": "tests/01-content/test_narrative_page_plan_cli.mjs",
      "preflight": CLI_SURFACE_FILE,
      "probe": CLI_SURFACE_FILE,
      "artifacts": "tests/contracts/test_human_artifact_reference_cli.mjs",
      "test": CLI_SURFACE_FILE,
    };
    const commandCase = {
      "tests/contracts/test_process_style_master_cli.mjs": {
        contextual: "plans a stale source-context successor without raw mutation or an inspect loop",
        success: "reports PNG selection success without a JPEG replay surface",
        usage: "rejects an undeclared or bypass-shaped input before plan publication",
      },
      "tests/shared/cli/test_process_target_diagnostics.mjs": {
        contextual: "short-circuits an unfit Framed source, preserves owner boundaries, and succeeds after the same plan repair",
        success: "runs the fixed Pure progressive CLI forms one item at a time",
        usage: "rejects retired and bypassing progressive forms before mutation or provider initialization",
      },
      "tests/01-content/test_target_structural_cli.mjs": {
        contextual: "publishes a same-workflow v2 vNext through the exact preview hash with no provider work",
        success: "publishes a same-workflow v2 vNext through the exact preview hash with no provider work",
        usage: "fails persisted apply-plan replay after target selection-map drift without mutation",
      },
      "tests/01-content/test_clean_page_image_new_version_cli.mjs": {
        contextual: "creates a clean target that validates through the draft route",
        success: "creates a clean target that validates through the draft route",
        usage: "hard-stops an undeclared source before creating a successor",
      },
      "tests/shared/cli/test_process_reset_unproduced_v1.mjs": {
        contextual: "hard-stops irreversible evidence without writes",
        success: "resets unproduced unique v1 and republishes as initial-draft",
        usage: "rejects missing confirm flag and non-v1 run-dir without writes",
      },
      "tests/01-content/test_narrative_page_plan_cli.mjs": {
        contextual: "previews then publishes only through its exact hash with no provider work",
        success: "previews then publishes only through its exact hash with no provider work",
        usage: "documents preview and exact narrative publication in public help",
      },
      "tests/contracts/test_human_artifact_reference_cli.mjs": {
        contextual: "projects a matching-binding pending Style Master successor before stale raw inspection and preserves failed-view bytes",
        success: "rebuilds a current Pure partial view without state mutation or provider work",
        usage: "lists the explicit operation in public help and hard-stops an undeclared marker before writing a view",
      },
      "tests/00-setup/test_process_env_check.mjs": {
        contextual: "rejects version suffixes outside the narrow allowlist",
        success: "produces text output by default",
        usage: "fails when no ancestor has the packages",
      },
      "tests/shared/run-bundle/test_page_image_layout.mjs": {
        contextual: "rejects missing, malformed, retired-mode, and source-disagreeing identity records without mutation",
        success: "initializes a current authoring draft without guessing its workflow",
        usage: "reports malformed progressive page-production topology without selecting or cleaning it",
      },
      [CLI_SURFACE_FILE]: {
        contextual: CLI_SURFACE_CASE,
        success: CLI_SURFACE_CASE,
        usage: CLI_SURFACE_CASE,
      },
    };
    const commandAudit = Object.fromEntries(PPT_FLOW_COMMAND_INVENTORY.map((entry) => {
      const file = commandFile[entry];
      const probe = commandCase[file];
      return [entry, {
        help: focused(file, probe.success),
        usage: focused(file, probe.usage),
        contextual: focused(file, probe.contextual),
        delegated: delegatedCommands.has(entry) ? focused(CLI_ERROR_FILE, CLI_DELEGATED) : na("Command does not delegate to a child process."),
        interruption: focused(CLI_ERROR_FILE, CLI_INTERRUPTION),
        prose_success: focused(file, probe.success),
        json_success: ["status", "state", "image2", "reset-unproduced-v1"].includes(entry) ? focused(file, probe.success) : na("No documented JSON success mode."),
      }];
    }));
    expect(Object.keys(executableAudit).sort()).toEqual([...EXECUTABLE_INVENTORY].sort());
    expect(Object.keys(commandAudit)).toEqual(PPT_FLOW_COMMAND_INVENTORY);
    for (const record of [...Object.values(executableAudit), ...Object.values(commandAudit)]) {
      expect(Object.keys(record)).toEqual(categories);
      for (const value of Object.values(record)) {
        expect(value.probe || value.notApplicable).toBeTruthy();
        if (value.probe) {
          expect(typeof value.probe.file).toBe("string");
          expect(typeof value.probe.test).toBe("string");
          expect(statSync(join(ROOT, value.probe.file)).isFile()).toBe(true);
          const source = readFileSync(join(ROOT, value.probe.file), "utf8");
          const resolved = [...source.matchAll(/(?:it|test)(?:\.each\([^)]*\))?\(\s*[`"']([^`"']+)[`"']/g)]
            .map((match) => match[1])
            .includes(value.probe.test);
          expect(resolved, `${value.probe.file} has no real test case "${value.probe.test}"`).toBe(true);
        } else {
          expect(value.notApplicable.length).toBeGreaterThan(20);
        }
      }
    }
  });

  it("finds no direct fd/device/inherited-child bypass outside the bootstrap commit", () => {
    const violations = [];
    for (const path of recursiveMjs(SCRIPTS)) {
      const rel = relative(SCRIPTS, path).replaceAll("\\", "/");
      const source = readFileSync(path, "utf8");
      if (rel !== "lib/cli_bootstrap.mjs" && /\bwriteSync\s*\(\s*[12]\s*,|\/dev\/(?:stdout|stderr)/.test(source)) violations.push(rel);
      if (/stdio\s*:\s*["']inherit["']/.test(source)) violations.push(`${rel}:stdio-inherit`);
    }
    expect(violations).toEqual([]);
  });

  it("suppresses child failure prose and preserves only registered current evidence", () => {
    const collector = createChildOutputCollector({ registered: true });
    collector.pushStdout("CHILD_STDOUT_SENTINEL\n");
    collector.pushStderr("CHILD_STDERR_SENTINEL\n");
    collector.pushStderr(JSON.stringify(formatCliError({
      code: CLI_ERROR_CODES.FAILED,
      message: "safe child summary",
      hint: "safe child hint",
      where: "stage2",
      diagnostic: {
        schema: CLI_DIAGNOSTIC_SCHEMA,
        category: "artifact",
        subject: { kind: "slide", id: "s03" },
        source: { path: "/tmp/slide-specifications.md", line: 12 },
        next: createCliNext("repair_prerequisite", { default: "Rerun the prerequisite stage." }),
      },
    })));
    const result = collector.finish(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toBe("");
    expect(result.childError?.diagnostic).toMatchObject({ category: "artifact", subject: { id: "s03" } });
    expect(normalizeDelegatedExit(0, result.childError)).toBe(1);
  });

  it("preserves a valid delegated doctor producer action and fails closed otherwise", () => {
    const child = parseCliErrorLine(JSON.stringify(formatCliError({
      code: CLI_ERROR_CODES.FAILED,
      message: "raw readiness is unavailable",
      hint: "repair the selected environment prerequisite",
      where: "env-check.raw-generation",
      diagnostic: {
        schema: CLI_DIAGNOSTIC_SCHEMA,
        category: "environment",
        stage: "foundation",
        operation: "raw-generation-readiness",
        subject: { kind: "environment", id: "raw-generation" },
        source: { path: "ppt_maker_harness/scripts/00-setup/env-check.mjs", line: 1 },
        reason: { kind: "missing_credential" },
        issues: [{ message: "Image provider credential is unavailable." }],
        lineage: [{ kind: "script", path: "ppt_maker_harness/scripts/00-setup/env-check.mjs", stage: "foundation" }],
        next: createCliNext("repair_environment", {
          default: "Configure the selected raw-generation environment, then rerun this exact readiness check.",
          invocation: { program: "node", args: ["env-check.mjs", "--operation", "raw-generation"] },
        }),
      },
    })));
    const expected = child?.diagnostic;
    const preserved = buildDelegatedDiagnostic({
      invocation: { program: "node", args: ["env-check.mjs", "--operation", "raw-generation"] },
      childError: child,
      operation: "doctor",
      next: createCliNext("inspect", { default: "Generic parent advice must not replace the producer action." }),
    });
    expect(preserved).toMatchObject({
      category: expected?.category,
      stage: expected?.stage,
      operation: expected?.operation,
      subject: expected?.subject,
      source: expected?.source,
      reason: expected?.reason,
      issues: expected?.issues,
      lineage: expected?.lineage,
      next: expected?.next,
      delegated: { invocation: { program: "node" }, child_where: "env-check.raw-generation" },
    });

    for (const [label, childError, overflow] of [
      ["missing", null, false],
      ["malformed", { ok: false, code: "FAILED", message: "CHILD_PROSE_SENTINEL", hint: "CHILD_PROSE_SENTINEL", where: "child" }, false],
      ["truncated", child, true],
    ]) {
      const closed = buildDelegatedDiagnostic({
        invocation: { program: "node", args: ["env-check.mjs"] },
        childError,
        overflow,
        operation: "doctor",
        next: createCliNext("inspect", { default: "CHILD_PROSE_SENTINEL" }),
      });
      expect(closed, label).toMatchObject({
        category: "delegated",
        next: { action: "report_internal", requires_human: false },
      });
      expect(JSON.stringify(closed), label).not.toContain("CHILD_PROSE_SENTINEL");
      if (overflow) expect(closed, label).toMatchObject({ truncated: true });
    }
  });

  it("replays successful child bytes and fails closed on overflow", () => {
    const success = createChildOutputCollector();
    success.pushStdout("ok\n");
    success.pushStderr("note\n");
    expect(success.finish(0)).toMatchObject({ code: 0, stdout: "ok\n", stderr: "note\n", overflow: false });
    const overflow = createChildOutputCollector({ maxBytes: 8 });
    overflow.pushStdout("x".repeat(20));
    expect(overflow.finish(0)).toMatchObject({ code: 0, stdout: "", stderr: "", overflow: true });
  });

  it("renders registered delegated progress as soon as a fragmented frame completes", () => {
    const progress = [];
    const collector = createChildOutputCollector({
      registered: true,
      onProgress: (event, fields) => progress.push({ event, fields }),
    });
    const frame = JSON.stringify({
      pptmaker_cli_progress: 1,
      event: "item_start",
      fields: { stage: "stage2", index: 1, total: 2, id: "s01" },
    });
    collector.pushStderr(frame.slice(0, 20));
    expect(progress).toEqual([]);
    collector.pushStderr(`${frame.slice(20)}\nordinary child note\n`);
    expect(progress).toEqual([{ event: "item_start", fields: { stage: "stage2", index: 1, total: 2, id: "s01" } }]);
    expect(collector.finish(0)).toMatchObject({ stderr: "ordinary child note\n", overflow: false });
  });

  it("schema-validates documented JSON failure reports", () => {
    expect(validateCliJsonReport({
      allPass: false,
      foundationOk: true,
      checks: [{ check: "api_key", status: "fail", detail: "missing", fix: "configure locally" }],
      smoke: false,
      probeVendors: false,
    }, CLI_JSON_REPORT_SCHEMAS.ENV_CHECK)).toMatchObject({ allPass: false });
    expect(() => validateCliJsonReport({ allPass: false, checks: [] }, CLI_JSON_REPORT_SCHEMAS.ENV_CHECK)).toThrow(/env-check/);
    expect(validateCliJsonReport({ corrupted: true, error_count: 2 }, CLI_JSON_REPORT_SCHEMAS.STATE_FAILURE)).toEqual({ corrupted: true, error_count: 2 });
    expect(() => validateCliJsonReport({ corrupted: "yes", error_count: 2 }, CLI_JSON_REPORT_SCHEMAS.STATE_FAILURE)).toThrow(/state-failure/);
  });

  it("renders deterministic human guidance from sanitized fields only", () => {
    const envelope = formatCliError({
      code: CLI_ERROR_CODES.FAILED,
      message: "Stage validation failed",
      hint: "Fix source",
      where: "stage1.validate",
      diagnostic: {
        schema: CLI_DIAGNOSTIC_SCHEMA,
        category: "source_validation",
        issues: [{ message: "invalid mode", subject: { kind: "slide", id: "s03" }, source: { path: "/tmp/spec.md", line: 9 } }],
        next: createCliNext("edit_source", {
          inspect: [{ path: "/tmp/spec.md", line: 9 }],
          invocation: { program: "node", args: ["script.mjs", "/tmp/deck with spaces"] },
          default: "Fix the named source field, then rerun.",
        }),
      },
    });
    const human = renderCliHumanError(envelope);
    expect(human).toContain("s03");
    expect(human).toContain("/tmp/spec.md:9");
    expect(human).toContain('"/tmp/deck with spaces"');
    expect(Buffer.byteLength(human)).toBeLessThanOrEqual(CLI_BOUNDS.humanBytes);
  });

  it("transactions preserve success bytes and discard all pre-failure sentinels", () => {
    const dir = mkdtempSync(join(tmpdir(), "pptmaker-cli-probe-"));
    try {
      const bootstrapUrl = pathToFileURL(BOOTSTRAP).href;
      const successPath = join(dir, "success.mjs");
      writeFileSync(successPath, `import "${bootstrapUrl}?entry=success.mjs";\nprocess.stdout.write("success\\n");\nprocess.stderr.write("note\\n");\n`);
      const success = spawnSync("node", [successPath], { encoding: "utf8" });
      expect(success).toMatchObject({ status: 0, stdout: "success\n", stderr: "note\n" });

      const failurePath = join(dir, "failure.mjs");
      writeFileSync(failurePath, `import "${bootstrapUrl}?entry=failure.mjs";\nconsole.log("DIRECT_STDOUT_SENTINEL");\nconsole.error("DIRECT_STDERR_SENTINEL");\nthrow new Error("THROWN_STACK_SENTINEL");\n`);
      const failure = spawnSync("node", [failurePath], { encoding: "utf8" });
      expect(failure.status).not.toBe(0);
      expect(`${failure.stdout}${failure.stderr}`).not.toMatch(/SENTINEL/);
      const parsed = parseCliErrorLine(failure.stderr.trim().split(/\r?\n/).at(-1));
      expect(parsed?.diagnostic).toMatchObject({ schema: CLI_DIAGNOSTIC_SCHEMA, category: "internal" });
      expect(envelopeLines(failure.stderr)).toHaveLength(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("shares process-global mode state and preserves write callbacks on success", () => {
    const dir = mkdtempSync(join(tmpdir(), "pptmaker-cli-write-"));
    try {
      const path = join(dir, "write.mjs");
      const helperUrl = pathToFileURL(join(SCRIPTS, "shared", "cli", "cli_error.mjs")).href;
      writeFileSync(path, `import "${pathToFileURL(BOOTSTRAP).href}?entry=write.mjs";\nimport { CLI_TRANSACTION_SYMBOL } from "${helperUrl}";\nconst before = globalThis[CLI_TRANSACTION_SYMBOL];\nconst returned = process.stdout.write("write-ok", "utf8", () => process.stderr.write("callback-ok\\n"));\nprocess.stdout.write(String(returned) + ":" + String(before === globalThis[CLI_TRANSACTION_SYMBOL]) + "\\n");\n`);
      const result = spawnSync("node", [path], { encoding: "utf8" });
      expect(result.status).toBe(0);
      expect(result.stdout).toBe("write-oktrue:true\n");
      expect(result.stderr).toBe("callback-ok\n");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("releases only registered JSON failure reports and the final envelope", () => {
    const dir = mkdtempSync(join(tmpdir(), "pptmaker-cli-json-"));
    try {
      const path = join(dir, "json.mjs");
      const helperUrl = pathToFileURL(join(SCRIPTS, "shared", "cli", "cli_error.mjs")).href;
      writeFileSync(path, `import "${pathToFileURL(BOOTSTRAP).href}?entry=json.mjs";\nimport { setCliOutputMode, registerCliJsonReport, emitCliError, CLI_ERROR_CODES, CLI_DIAGNOSTIC_SCHEMA } from "${helperUrl}";\nsetCliOutputMode("json");\nregisterCliJsonReport({ ready: false, checks: [{ id: "local", status: "fail" }] });\nconsole.log(JSON.stringify({ incidental: "INCIDENTAL_JSON_SENTINEL" }));\nemitCliError({ code: CLI_ERROR_CODES.FAILED, message: "Readiness check failed.", hint: "Repair local prerequisites.", where: "probe.json", diagnostic: { schema: CLI_DIAGNOSTIC_SCHEMA, category: "environment", next: { action: "repair_environment", requires_human: false, default: "Repair local prerequisites, then rerun." } } });\nprocess.exit(1);\n`);
      const result = spawnSync("node", [path], { encoding: "utf8" });
      expect(result.status).toBe(1);
      expect(JSON.parse(result.stdout)).toEqual({ ready: false, checks: [{ id: "local", status: "fail" }] });
      expect(`${result.stdout}${result.stderr}`).not.toContain("INCIDENTAL_JSON_SENTINEL");
      expect(envelopeLines(result.stderr)).toHaveLength(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("fails closed when a direct stream exceeds the transaction bound", () => {
    const dir = mkdtempSync(join(tmpdir(), "pptmaker-cli-overflow-"));
    try {
      const path = join(dir, "overflow.mjs");
      writeFileSync(path, `import "${pathToFileURL(BOOTSTRAP).href}?entry=overflow.mjs";\nprocess.stdout.write("OVERFLOW_SENTINEL".repeat(70000));\n`);
      const result = spawnSync("node", [path], { encoding: "utf8", maxBuffer: 2 * 1024 * 1024 });
      expect(result.status).toBe(1);
      expect(result.stdout).toBe("");
      expect(result.stderr).not.toContain("OVERFLOW_SENTINEL");
      const envelope = envelopeLines(result.stderr)[0];
      expect(envelope.diagnostic).toMatchObject({ category: "internal", truncated: true, reason: { kind: "stream_capture_overflow" } });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("covers post-bootstrap evaluation failures but not pre-evaluation link failures", () => {
    const dir = mkdtempSync(join(tmpdir(), "pptmaker-cli-link-"));
    try {
      const dependency = join(dir, "dependency.mjs");
      writeFileSync(dependency, `throw new Error("DEPENDENCY_STACK_SENTINEL");\n`);
      const evaluated = join(dir, "evaluated.mjs");
      writeFileSync(evaluated, `import "${pathToFileURL(BOOTSTRAP).href}?entry=evaluated.mjs";\nawait import("./dependency.mjs");\n`);
      const caught = spawnSync("node", [evaluated], { encoding: "utf8" });
      expect(caught.status).not.toBe(0);
      expect(`${caught.stdout}${caught.stderr}`).not.toContain("DEPENDENCY_STACK_SENTINEL");
      expect(envelopeLines(caught.stderr)).toHaveLength(1);

      const linked = join(dir, "linked.mjs");
      writeFileSync(linked, `import "${pathToFileURL(BOOTSTRAP).href}?entry=linked.mjs";\nimport "./missing-before-evaluation.mjs";\n`);
      const uncaughtBoundary = spawnSync("node", [linked], { encoding: "utf8" });
      expect(uncaughtBoundary.status).not.toBe(0);
      expect(envelopeLines(uncaughtBoundary.stderr)).toHaveLength(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("withholds credential, prompt, provider body, and stack sentinels from the full provider failure channel", () => {
    const dir = mkdtempSync(join(tmpdir(), "pptmaker-provider-secret-"));
    try {
      const path = join(dir, "provider.mjs");
      const rawMechanicsUrl = pathToFileURL(join(SCRIPTS, "shared", "image2", "page_image_raw_mechanics.mjs")).href;
      const helperUrl = pathToFileURL(join(SCRIPTS, "shared", "cli", "cli_error.mjs")).href;
      writeFileSync(path, `import "${pathToFileURL(BOOTSTRAP).href}?entry=provider.mjs";\nimport { PageImageRawMechanicsError } from "${rawMechanicsUrl}";\nimport { emitCliError, CLI_ERROR_CODES, CLI_DIAGNOSTIC_SCHEMA } from "${helperUrl}";\nprocess.env.IMAGE2_API_KEY = "CREDENTIAL_SENTINEL";\nprocess.env.IMAGE2_BASE_URL = "https://provider.example/v1";\ntry { throw new PageImageRawMechanicsError("raw_submit_failed", "PROMPT_SENTINEL PROVIDER_BODY_SENTINEL"); } catch (error) { emitCliError({ code: CLI_ERROR_CODES.FAILED, message: "Image provider failed.", hint: "Repair provider availability.", where: "provider.probe", diagnostic: { schema: CLI_DIAGNOSTIC_SCHEMA, category: "provider", reason: { kind: error.code || "provider_failure", actual: "PROVIDER_BODY_SENTINEL" }, next: { action: "repair_environment", requires_human: false, default: "Repair provider availability without exposing credentials, then rerun." } } }); process.exit(1); }\n`);
      const result = spawnSync("node", [path], { encoding: "utf8", timeout: 10000 });
      expect(result.status).toBe(1);
      expect(`${result.stdout}${result.stderr}`).not.toMatch(/CREDENTIAL_SENTINEL|PROMPT_SENTINEL|PROVIDER_BODY_SENTINEL|PageImageRawMechanicsError/);
      expect(envelopeLines(result.stderr)[0].diagnostic).toMatchObject({ category: "provider", reason: { kind: "raw_submit_failed" } });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 15000);

  it("every registered executable has side-effect-free help and one final current failure envelope", () => {
    const failureArgs = {
      "shared/run-bundle/bundle_layout.mjs": ["--structure-only"],
      "00-setup/env-check.mjs": ["--smoke", "--probe-vendors"],
      "shared/run-bundle/lessons.mjs": ["nosuch"],
      "ppt_flow.mjs": ["nosuch"],
    };
    expect(Object.keys(failureArgs).sort()).toEqual([...EXECUTABLE_INVENTORY].sort());
    for (const script of EXECUTABLE_INVENTORY) {
      const path = join(SCRIPTS, script);
      const help = spawnSync("node", [path, "--help"], { encoding: "utf8", timeout: 10000 });
      expect(help.status, `${script} --help\n${help.stderr}`).toBe(0);
      expect(help.stderr).not.toMatch(/"ok"\s*:\s*false/);
      const failed = spawnSync("node", [path, ...failureArgs[script]], { encoding: "utf8", timeout: 10000 });
      expect(failed.status, `${script} deterministic failure`).not.toBe(0);
      const envelopes = envelopeLines(failed.stderr);
      expect(envelopes, `${script} stderr:\n${failed.stderr}`).toHaveLength(1);
      expect(envelopes[0].diagnostic?.schema, `${script} diagnostic`).toBe(CLI_DIAGNOSTIC_SCHEMA);
      expect(parseCliErrorLine(failed.stderr.split(/\r?\n/).filter(Boolean).at(-1)), `${script} final stderr line`).toBeTruthy();
    }
  }, 30000);

  it("handles catchable interruption once without reporting an internal defect", async () => {
    const dir = mkdtempSync(join(tmpdir(), "pptmaker-cli-signal-"));
    try {
      const path = join(dir, "signal.mjs");
      writeFileSync(path, `import "${pathToFileURL(BOOTSTRAP).href}?entry=signal.mjs";\nsetInterval(() => {}, 1000);\n`);
      const child = spawn("node", [path], { stdio: ["ignore", "pipe", "pipe"] });
      let stderr = "";
      child.stderr.setEncoding("utf8");
      child.stderr.on("data", (chunk) => { stderr += chunk; });
      await new Promise((resolveReady) => setTimeout(resolveReady, 100));
      child.kill("SIGTERM");
      const result = await new Promise((resolveExit) => child.on("exit", (code, signal) => resolveExit({ code, signal })));
      expect(result.code === 143 || result.signal === "SIGTERM").toBe(true);
      const envelopes = envelopeLines(stderr);
      expect(envelopes, stderr).toHaveLength(1);
      expect(envelopes[0].diagnostic.category).toBe("interrupted");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
