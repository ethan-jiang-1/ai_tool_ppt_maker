import { writeSync } from "node:fs";

const STATE_SYMBOL = Symbol.for("pptmaker.cli.transaction.v1");
const LIMIT = 1024 * 1024;

export function normalizedCliPath(value) {
  if (typeof value !== "string" || !value) return "";
  return value.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/+/g, "/");
}

export function normalizedCliBasename(value) {
  const normalized = normalizedCliPath(value);
  return normalized.slice(normalized.lastIndexOf("/") + 1);
}

export function cliEntryMatches(entry, argv1 = process.argv[1]) {
  const expected = normalizedCliPath(entry);
  const actual = normalizedCliPath(argv1);
  if (!expected) return false;
  if (!expected.includes("/")) return normalizedCliBasename(actual) === expected;
  return actual === expected || actual.endsWith(`/scripts/${expected}`);
}

function genericDiagnostic(category) {
  const action = category === "usage" ? "fix_arguments" : category === "interrupted" ? "rerun" : "report_internal";
  return {
    version: 1,
    category,
    next: {
      action,
      requires_human: false,
      default: action === "fix_arguments"
        ? "Correct the command arguments, then rerun."
        : action === "rerun"
          ? "Rerun the command when execution can continue."
          : "Inspect the named command location and report the Harness failure.",
    },
  };
}

function genericEnvelope(entry, category = "internal", code = "FAILED") {
  return {
    ok: false,
    code,
    message: category === "interrupted" ? "Command execution was interrupted." : "Command failed before a contextual diagnostic was registered.",
    hint: category === "usage" ? "Run with --help and correct the arguments." : "Inspect the command location and retry only after the cause is understood.",
    where: entry.replace(/\.mjs$/, ""),
    diagnostic: genericDiagnostic(category),
  };
}

function asBuffer(chunk, encoding) {
  if (typeof chunk === "string") return Buffer.from(chunk, typeof encoding === "string" ? encoding : "utf8");
  if (Buffer.isBuffer(chunk)) return chunk;
  if (ArrayBuffer.isView(chunk)) return Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength);
  throw new TypeError("The chunk argument must be a string or Buffer-like value");
}

function writeAll(fd, value) {
  if (!value) return;
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(String(value));
  let offset = 0;
  while (offset < buffer.length) offset += writeSync(fd, buffer, offset, buffer.length - offset);
}

function renderHuman(envelope) {
  const lines = [`${envelope.code}: ${envelope.message}`, `Where: ${envelope.where}`];
  for (const issue of envelope.diagnostic?.issues || []) {
    const parts = [issue.message];
    if (issue.subject) parts.push([issue.subject.kind, issue.subject.id, issue.subject.field].filter(Boolean).join(":"));
    if (issue.source) parts.push(`${issue.source.path}${issue.source.line ? `:${issue.source.line}` : ""}`);
    lines.push(`- ${parts.filter(Boolean).join(" | ")}`);
  }
  if (envelope.diagnostic?.omitted_count) lines.push(`Additional issues omitted: ${envelope.diagnostic.omitted_count}`);
  if (envelope.diagnostic?.next?.default) lines.push(`Next: ${envelope.diagnostic.next.default}`);
  const inspect = envelope.diagnostic?.next?.inspect?.[0];
  if (inspect) lines.push(`Inspect: ${inspect.path}${inspect.line ? `:${inspect.line}` : ""}`);
  const invocation = envelope.diagnostic?.next?.invocation;
  if (invocation) lines.push(`Run: ${[invocation.program, ...invocation.args].map((arg) => /^[A-Za-z0-9_./:@%+=,-]+$/.test(arg) ? arg : JSON.stringify(arg)).join(" ")}`);
  return `${lines.join("\n")}\n`;
}

function install(entry) {
  if (globalThis[STATE_SYMBOL]?.installed) return globalThis[STATE_SYMBOL];
  const stdoutWrite = process.stdout.write;
  const stderrWrite = process.stderr.write;
  const originalExit = process.exit.bind(process);
  const state = {
    installed: true,
    entry,
    outputMode: "human",
    pendingEnvelope: null,
    safeReport: null,
    activeChild: null,
    committed: false,
    restored: false,
    streams: {
      stdout: { chunks: [], bytes: 0, overflow: false },
      stderr: { chunks: [], bytes: 0, overflow: false },
    },
  };
  globalThis[STATE_SYMBOL] = state;

  const capture = (name, chunk, encoding, callback) => {
    let cb = callback;
    let enc = encoding;
    if (typeof encoding === "function") {
      cb = encoding;
      enc = undefined;
    }
    const buffer = asBuffer(chunk, enc);
    const stream = state.streams[name];
    const remaining = Math.max(0, LIMIT - stream.bytes);
    if (remaining) stream.chunks.push(buffer.subarray(0, remaining));
    stream.bytes += buffer.length;
    if (buffer.length > remaining) stream.overflow = true;
    if (typeof cb === "function") process.nextTick(cb);
    return !stream.overflow;
  };
  process.stdout.write = function (chunk, encoding, callback) { return capture("stdout", chunk, encoding, callback); };
  process.stderr.write = function (chunk, encoding, callback) { return capture("stderr", chunk, encoding, callback); };

  const restore = () => {
    if (state.restored) return;
    state.restored = true;
    process.stdout.write = stdoutWrite;
    process.stderr.write = stderrWrite;
    process.exit = originalExit;
  };
  state.writeSafeStderr = (text) => writeAll(2, text);

  const commit = (rawCode) => {
    if (state.committed) return;
    state.committed = true;
    restore();
    const overflow = state.streams.stdout.overflow || state.streams.stderr.overflow;
    const code = overflow ? 1 : Number.isInteger(rawCode) ? rawCode : process.exitCode || 0;
    if (code === 0) {
      writeAll(1, Buffer.concat(state.streams.stdout.chunks));
      writeAll(2, Buffer.concat(state.streams.stderr.chunks));
      return;
    }
    let envelope = state.pendingEnvelope || genericEnvelope(entry,
      /usage|unknown (?:command|option)|required|missing mandatory|too many arguments|only applies|choose only one|option .* argument/i.test(Buffer.concat(state.streams.stderr.chunks).toString("utf8")) ? "usage" : "internal",
      state.pendingEnvelope?.code || "FAILED");
    if (overflow) {
      envelope = genericEnvelope(entry, "internal", "FAILED");
      envelope.message = "CLI output exceeded the transaction capture bound.";
      envelope.diagnostic.truncated = true;
      envelope.diagnostic.reason = { kind: "stream_capture_overflow" };
    }
    if (state.outputMode === "json" && state.safeReport) writeAll(1, state.safeReport);
    if (state.outputMode === "human") writeAll(2, renderHuman(envelope));
    writeAll(2, `${JSON.stringify(envelope)}\n`);
  };
  state.commit = commit;

  process.exit = function (code) {
    const requested = code === undefined ? process.exitCode || 0 : Number(code);
    const finalCode = state.streams.stdout.overflow || state.streams.stderr.overflow ? 1 : requested;
    commit(finalCode);
    originalExit(finalCode);
  };
  process.on("beforeExit", (code) => {
    if (state.streams.stdout.overflow || state.streams.stderr.overflow) process.exitCode = 1;
    if (!state.committed && (process.exitCode || code) === 0) commit(0);
  });
  process.on("exit", (code) => commit(code));
  process.on("uncaughtException", () => {
    if (!state.pendingEnvelope) state.pendingEnvelope = genericEnvelope(entry, "internal", "UNCAUGHT");
    process.exit(1);
  });
  process.on("unhandledRejection", () => {
    if (!state.pendingEnvelope) state.pendingEnvelope = genericEnvelope(entry, "internal", "UNCAUGHT");
    process.exit(1);
  });
  for (const [signal, code] of [["SIGINT", 130], ["SIGTERM", 143]]) {
    process.on(signal, () => {
      try { state.activeChild?.kill?.(signal); } catch {}
      state.pendingEnvelope = genericEnvelope(entry, "interrupted", "FAILED");
      process.exit(code);
    });
  }
  return state;
}

const entry = new URL(import.meta.url).searchParams.get("entry");
if (cliEntryMatches(entry)) install(entry);
