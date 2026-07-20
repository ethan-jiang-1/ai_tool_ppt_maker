import { afterEach, describe, expect, it, vi } from "vitest";
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  CLI_BOUNDS,
  CLI_DIAGNOSTIC_CATEGORIES,
  CLI_ERROR_CODES,
  CLI_JSON_REPORT_SCHEMAS,
  CLI_NEXT_ACTIONS,
  EXECUTABLE_INVENTORY,
  PPT_FLOW_COMMAND_INVENTORY,
  createChildOutputCollector,
  createCliNext,
  emitCliError,
  formatCliError,
  normalizeDelegatedExit,
  parseCliErrorLine,
  renderCliHumanError,
  sanitizeCliDiagnostic,
  validateCliJsonReport,
} from "../../../PPTMAKER_FRAMEWORK/scripts/shared/cli/cli_error.mjs";

const ROOT = resolve(import.meta.dirname, "..", "..", "..");
const SCRIPTS = join(ROOT, "PPTMAKER_FRAMEWORK", "scripts");
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

  it("builds a mandatory bounded v1 envelope and discards stack", () => {
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
        version: 1,
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

  it("accepts legacy envelopes but discards legacy stack and malformed v1", () => {
    const legacy = parseCliErrorLine(JSON.stringify({
      ok: false, code: "FAILED", message: "x", hint: "y", where: "z", stack: "SECRET_STACK",
    }));
    expect(legacy).toEqual({ ok: false, code: "FAILED", message: "x", hint: "y", where: "z" });
    const malformed = parseCliErrorLine(JSON.stringify({
      ...legacy,
      diagnostic: { version: 1, category: "provider", next: { action: "rerun", requires_human: "no", default: "retry" } },
    }));
    expect(malformed).toEqual(legacy);
  });

  it("falls back the whole diagnostic when required v1 fields are malformed", () => {
    const diagnostic = sanitizeCliDiagnostic({
      version: 1,
      category: "gate",
      next: { action: "approve", requires_human: false, default: "approve it" },
      source: { path: "/tmp/source.md" },
    });
    expect(diagnostic).toEqual({
      version: 1,
      category: "internal",
      next: {
        action: "report_internal",
        requires_human: false,
        default: "Inspect the named command location and report the framework failure.",
      },
    });
  });

  it("sanitizes all leaf shapes, token grammars, bounds, and aggregate omission", () => {
    const issues = Array.from({ length: 25 }, (_, index) => ({
      message: `invalid field ${index}`,
      subject: { kind: "slide", id: `s${index}`, field: "RENDER MODE" },
      source: { path: `/tmp/spec ${index}.md`, line: index + 1 },
      reason: { kind: "invalid_enum", actual: "image_direct", expected: ["full-page", "body+header-lock"] },
      lineage: [{ kind: "source", path: `/tmp/spec ${index}.md`, stage: "input" }],
      nested: { ignored: true },
    }));
    const diagnostic = sanitizeCliDiagnostic({
      version: 1,
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

  it("omits credential-bearing invocation and safe-domain sentinel values", () => {
    const diagnostic = sanitizeCliDiagnostic({
      version: 1,
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
    expect(parseCliErrorLine(spy.mock.calls[0][0])?.diagnostic?.version).toBe(1);
  });

  it("recursively detects exactly the registered direct CLI candidates", () => {
    const exceptions = new Map([
      ["shared/cli/cli_bootstrap.mjs", "shared bootstrap inspects argv but is not a public CLI"],
      ["shared/cli/cli_error.mjs", "shared diagnostic producer is not a direct entry"],
      ["contracts/framework_architecture.mjs", "architecture checker is an import-only contract"],
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

  it("matches the exact 15-command ppt_flow registry", () => {
    const source = readFileSync(join(SCRIPTS, "ppt_flow.mjs"), "utf8");
    const commands = [...source.matchAll(/\.command\("([^"]+)"\)/g)].map((match) => match[1]);
    expect(commands).toEqual(PPT_FLOW_COMMAND_INVENTORY);
  });

  it("has explicit return-category audits for every executable and ppt_flow command", () => {
    const categories = ["help", "usage", "contextual", "delegated", "interruption", "prose_success", "json_success"];
    const focused = (file, test) => ({ probe: { file, test } });
    const na = (reason) => ({ notApplicable: reason });
    const executableAudit = Object.fromEntries(EXECUTABLE_INVENTORY.map((entry) => [entry, {
      help: focused("tests/shared/cli/test_cli_error.mjs", "every registered executable has side-effect-free help"),
      usage: focused("tests/shared/cli/test_cli_error.mjs", "every registered executable has side-effect-free help"),
      contextual: focused({
        "shared/run-bundle/bundle_layout.mjs": "tests/shared/run-bundle/test_bundle_layout.mjs",
        "00-setup/env-check.mjs": "tests/00-setup/test_env_check.mjs",
        "05-iteration/legacy-image2/generate_style_master.mjs": "tests/05-iteration/test_generate_style_master.mjs",
        "shared/run-bundle/lessons.mjs": "tests/shared/run-bundle/test_lessons.mjs",
        "05-iteration/legacy-image2/make_contact_sheet.mjs": "tests/05-iteration/test_image_generation.mjs",
        "ppt_flow.mjs": "tests/contracts/test_ppt_flow.mjs",
        "03-html-production/stage1_build_inputs.mjs": "tests/03-html-production/test_stage1_build_inputs.mjs",
        "05-iteration/legacy-image2/stage2_generate_images.mjs": "tests/05-iteration/test_image_generation.mjs",
        "03-html-production/stage2_render_html.mjs": "tests/03-html-production/test_html_stage_clis.mjs",
        "03-html-production/stage3_compose_slides.mjs": "tests/03-html-production/test_html_stage_clis.mjs",
        "05-iteration/legacy-image2/stage3_lock_headers.mjs": "tests/05-iteration/test_stage3_lock_headers.mjs",
        "03-html-production/stage4_build_pptx.mjs": "tests/03-html-production/test_stage4_build_pptx.mjs",
        "03-html-production/stage5_inject_notes.mjs": "tests/03-html-production/test_stage5_inject_notes.mjs",
        "03-html-production/unified_pipeline.mjs": "tests/03-html-production/test_unified_pipeline.mjs",
      }[entry], "structured contextual failure"),
      delegated: entry === "ppt_flow.mjs" ? focused("tests/shared/cli/test_cli_error.mjs", "suppresses child failure prose") : na("Executable does not own a subprocess boundary."),
      interruption: focused("tests/shared/cli/test_cli_error.mjs", "handles catchable interruption once"),
      prose_success: focused("tests/shared/cli/test_cli_error.mjs", "every registered executable has side-effect-free help"),
      json_success: ["00-setup/env-check.mjs", "ppt_flow.mjs", "shared/run-bundle/lessons.mjs"].includes(entry) ? focused(entry === "00-setup/env-check.mjs" ? "tests/00-setup/test_env_check.mjs" : entry === "ppt_flow.mjs" ? "tests/contracts/test_ppt_flow.mjs" : "tests/shared/run-bundle/test_lessons.mjs", "documented JSON output") : na("No documented JSON success mode."),
    }]));
    const delegatedCommands = new Set(["doctor", "style-master", "validate", "pilot", "build", "refresh", "test"]);
    const commandAudit = Object.fromEntries(PPT_FLOW_COMMAND_INVENTORY.map((entry) => {
      const commandProbeFile = entry === "migrate-html" ? "tests/05-iteration/test_html_migration.mjs" : "tests/contracts/test_ppt_flow.mjs";
      const commandProbeName = entry === "migrate-html" ? "migrate-html preview/apply/recovery" : `ppt_flow ${entry} contextual behavior`;
      return [entry, {
        help: focused("tests/contracts/test_ppt_flow.mjs", "audits help and deterministic usage"),
        usage: entry === "test" ? na("The no-argument test command has no command-specific usage failure.") : focused("tests/contracts/test_ppt_flow.mjs", "audits help and deterministic usage"),
        contextual: focused(commandProbeFile, commandProbeName),
        delegated: delegatedCommands.has(entry) ? focused("tests/shared/cli/test_cli_error.mjs", "suppresses child failure prose") : na("Command does not delegate to a child process."),
        interruption: focused("tests/shared/cli/test_cli_error.mjs", "handles catchable interruption once"),
        prose_success: focused(commandProbeFile, entry === "migrate-html" ? "migrate-html preview/apply/recovery" : `ppt_flow ${entry} success`),
        json_success: ["status", "state"].includes(entry) ? focused("tests/contracts/test_ppt_flow.mjs", `${entry} --json`) : na("No documented JSON success mode."),
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

  it("suppresses child failure prose and preserves only registered supported v1 evidence", () => {
    const collector = createChildOutputCollector({ registered: true });
    collector.pushStdout("CHILD_STDOUT_SENTINEL\n");
    collector.pushStderr("CHILD_STDERR_SENTINEL\n");
    collector.pushStderr(JSON.stringify(formatCliError({
      code: CLI_ERROR_CODES.FAILED,
      message: "safe child summary",
      hint: "safe child hint",
      where: "stage2",
      diagnostic: {
        version: 1,
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
    expect(() => validateCliJsonReport({ allPass: false, checks: [] }, CLI_JSON_REPORT_SCHEMAS.ENV_CHECK)).toThrow(/env-check-v1/);
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
        version: 1,
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
      expect(parsed?.diagnostic).toMatchObject({ version: 1, category: "internal" });
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
      writeFileSync(path, `import "${pathToFileURL(BOOTSTRAP).href}?entry=json.mjs";\nimport { setCliOutputMode, registerCliJsonReport, emitCliError, CLI_ERROR_CODES } from "${helperUrl}";\nsetCliOutputMode("json");\nregisterCliJsonReport({ ready: false, checks: [{ id: "local", status: "fail" }] });\nconsole.log(JSON.stringify({ incidental: "INCIDENTAL_JSON_SENTINEL" }));\nemitCliError({ code: CLI_ERROR_CODES.FAILED, message: "Readiness check failed.", hint: "Repair local prerequisites.", where: "probe.json", diagnostic: { version: 1, category: "environment", next: { action: "repair_environment", requires_human: false, default: "Repair local prerequisites, then rerun." } } });\nprocess.exit(1);\n`);
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
      const imageUrl = pathToFileURL(join(SCRIPTS, "05-iteration", "legacy-image2", "internal", "image_api_client.mjs")).href;
      const helperUrl = pathToFileURL(join(SCRIPTS, "shared", "cli", "cli_error.mjs")).href;
      writeFileSync(path, `import "${pathToFileURL(BOOTSTRAP).href}?entry=provider.mjs";\nimport { generateOneImage } from "${imageUrl}";\nimport { emitCliError, CLI_ERROR_CODES } from "${helperUrl}";\nprocess.env.IMAGE2_API_KEY = "CREDENTIAL_SENTINEL";\nprocess.env.IMAGE2_BASE_URL = "https://provider.example/v1";\nglobalThis.fetch = async () => ({ ok: false, status: 502, text: async () => JSON.stringify({ error: "PROVIDER_BODY_SENTINEL" }) });\ntry { await generateOneImage({ prompt: "PROMPT_SENTINEL", outPath: "${join(dir, "out.png")}", force: true }); } catch (error) { emitCliError({ code: CLI_ERROR_CODES.FAILED, message: "Image provider failed.", hint: "Repair provider availability.", where: "provider.probe", diagnostic: { version: 1, category: "provider", reason: { kind: error.reason || "provider_failure", actual: error.status || null }, next: { action: "repair_environment", requires_human: false, default: "Repair provider availability without exposing credentials, then rerun." } } }); process.exit(1); }\n`);
      const result = spawnSync("node", [path], { encoding: "utf8", timeout: 10000 });
      expect(result.status).toBe(1);
      expect(`${result.stdout}${result.stderr}`).not.toMatch(/CREDENTIAL_SENTINEL|PROMPT_SENTINEL|PROVIDER_BODY_SENTINEL|at generateOneImage/);
      expect(envelopeLines(result.stderr)[0].diagnostic).toMatchObject({ category: "provider", reason: { kind: "all_vendors_failed" } });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 15000);

  it("every registered executable has side-effect-free help and one final v1 failure envelope", () => {
    const failureArgs = {
      "shared/run-bundle/bundle_layout.mjs": ["--structure-only"],
      "00-setup/env-check.mjs": ["--smoke", "--probe-vendors"],
      "05-iteration/legacy-image2/generate_style_master.mjs": [],
      "shared/run-bundle/lessons.mjs": ["nosuch"],
      "05-iteration/legacy-image2/make_contact_sheet.mjs": [],
      "ppt_flow.mjs": ["nosuch"],
      "03-html-production/stage1_build_inputs.mjs": [],
      "05-iteration/legacy-image2/stage2_generate_images.mjs": [],
      "03-html-production/stage2_render_html.mjs": [],
      "03-html-production/stage3_compose_slides.mjs": [],
      "05-iteration/legacy-image2/stage3_lock_headers.mjs": [],
      "03-html-production/stage4_build_pptx.mjs": [],
      "03-html-production/stage5_inject_notes.mjs": [],
      "03-html-production/unified_pipeline.mjs": [],
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
      expect(envelopes[0].diagnostic?.version, `${script} diagnostic`).toBe(1);
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
      expect(envelopes).toHaveLength(1);
      expect(envelopes[0].diagnostic.category).toBe("interrupted");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
