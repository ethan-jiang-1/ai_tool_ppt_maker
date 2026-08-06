import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";

export const INVENTORY_SCHEMA = "pptmaker-development-verification-core-v1";
export const CORE_LIMITS = Object.freeze({ maxEntries: 16, maxFileBytes: 1024 * 1024, maxFiles: 256, maxTotalBytes: 8 * 1024 * 1024 });
const SAFE_ROOTS = ["tests/contracts/", "ppt_maker_harness/scripts/contracts/", "ppt_maker_harness/scripts/shared/cli/"];
const PROHIBITED_NODE = /^(?:node:)?(?:child_process|cluster|dgram|dns|http2?|https|net|tls|module)$/;
const PROHIBITED_SURFACE = /(?:canvas|chromium|playwright|pptx|echarts|html[_-]?(?:render|composit)|provider|image_api_client|browser)/i;
const TEST_ENTRY = /^tests\/.+\/(?:test_[^/]+|test-[^/]+)\.mjs$/;

function fail(code, detail, nextAction) { return { ok: false, code, detail, next_action: nextAction }; }
function normalized(path) { return String(path).replaceAll("\\", "/"); }
function inside(root, candidate) { return candidate === root || candidate.startsWith(`${root}${sep}`); }
function token(type, value) { return { type, value }; }

/** A deliberately small lexer. Template interpolation is recursively scanned as code. */
function tokenize(source, start = 0, end = source.length) {
  const out = [];
  let i = start;
  const whitespace = /\s/;
  const identStart = /[A-Za-z_$]/;
  const ident = /[A-Za-z0-9_$]/;
  const regexPrefix = new Set(["(", "[", "{", "=", ":", ",", ";", "!", "&&", "||", "??", "?", "return", "=>"]);
  if (start === 0 && source.startsWith("#!")) {
    const newline = source.indexOf("\n");
    if (newline < 0 || newline >= end) return out;
    i = newline + 1;
  }
  const readString = (quote) => {
    let value = "";
    i += 1;
    while (i < end) {
      const ch = source[i++];
      if (ch === "\\") { value += ch + (source[i++] || ""); continue; }
      if (ch === quote) return value;
      value += ch;
    }
    throw new Error("unterminated string literal");
  };
  const readTemplate = () => {
    i += 1;
    while (i < end) {
      if (source[i] === "\\") { i += 2; continue; }
      if (source[i] === "`") { i += 1; return; }
      if (source[i] !== "$" || source[i + 1] !== "{") { i += 1; continue; }
      i += 2;
      const expressionStart = i;
      let depth = 1;
      while (i < end && depth) {
        const ch = source[i];
        if (ch === "'" || ch === '"') { readString(ch); continue; }
        if (ch === "`") { readTemplate(); continue; }
        if (ch === "/" && source[i + 1] === "/") { i += 2; while (i < end && source[i] !== "\n") i += 1; continue; }
        if (ch === "/" && source[i + 1] === "*") { const close = source.indexOf("*/", i + 2); if (close < 0) throw new Error("unterminated comment"); i = close + 2; continue; }
        if (ch === "{") depth += 1;
        if (ch === "}") depth -= 1;
        i += 1;
      }
      if (depth) throw new Error("unterminated template expression");
      out.push(...tokenize(source, expressionStart, i - 1));
    }
    throw new Error("unterminated template literal");
  };
  const readRegex = () => {
    i += 1;
    let inClass = false;
    while (i < end) {
      const ch = source[i++];
      if (ch === "\\") { i += 1; continue; }
      if (ch === "[") inClass = true;
      else if (ch === "]") inClass = false;
      else if (ch === "/" && !inClass) { while (i < end && /[A-Za-z]/.test(source[i])) i += 1; return; }
    }
    throw new Error("unterminated regular expression");
  };
  while (i < end) {
    const ch = source[i];
    if (whitespace.test(ch)) { i += 1; continue; }
    if (ch === "/" && source[i + 1] === "/") { i += 2; while (i < end && source[i] !== "\n") i += 1; continue; }
    if (ch === "/" && source[i + 1] === "*") { const close = source.indexOf("*/", i + 2); if (close < 0) throw new Error("unterminated comment"); i = close + 2; continue; }
    if (ch === "/" && (!out.length || regexPrefix.has(out.at(-1)?.value))) { readRegex(); continue; }
    if (ch === "'" || ch === '"') { out.push(token("string", readString(ch))); continue; }
    if (ch === "`") { readTemplate(); continue; }
    if (identStart.test(ch)) { let value = ch; i += 1; while (i < end && ident.test(source[i])) value += source[i++]; out.push(token("id", value)); continue; }
    if (["=>", "&&", "||", "??"].includes(source.slice(i, i + 2))) {
      out.push(token("punct", source.slice(i, i + 2)));
      i += 2;
      continue;
    }
    out.push(token("punct", ch)); i += 1;
  }
  return out;
}

function statementEnd(tokens, index) {
  while (index < tokens.length && tokens[index].value !== ";") index += 1;
  return index;
}

export function collectStaticSpecifiers(source, { prohibitRuntimeSurfaces = true, allowDynamic = false } = {}) {
  let tokens;
  try { tokens = tokenize(source); } catch (error) { return fail("unclassifiable-syntax", error.message, "use literal static ESM imports only"); }
  const specifiers = [];
  for (let i = 0; i < tokens.length; i += 1) {
    const current = tokens[i];
    if (prohibitRuntimeSurfaces && current.type === "id" && ["require", "createRequire", "fetch", "WebSocket"].includes(current.value)) return fail("prohibited-surface", `${current.value} is not permitted in core`, "move this dependency to an opt-in tier");
    if (current.type !== "id" || (current.value !== "import" && current.value !== "export")) continue;
    const next = tokens[i + 1];
    if (current.value === "import") {
      if (!next || next.value === "(") {
        if (allowDynamic) continue;
        return fail("dynamic-import", "dynamic import is not permitted in core", "use one literal static import or move the test to an opt-in tier");
      }
      if (next.value === "." && tokens[i + 2]?.value === "meta") { i += 2; continue; }
      if (next.type === "string") {
        const end = statementEnd(tokens, i + 2);
        if (tokens.slice(i + 2, end).some((item) => item.value === "assert" || item.value === "with")) return fail("import-attributes", "import attributes are not permitted in core", "remove import attributes from the core closure");
        specifiers.push(next.value); i = end; continue;
      }
      let from = -1;
      const end = statementEnd(tokens, i + 1);
      for (let cursor = i + 1; cursor < end; cursor += 1) if (tokens[cursor].value === "from") { from = cursor; break; }
      if (from < 0 || tokens[from + 1]?.type !== "string") return fail("unclassifiable-import", "import must have one literal source", "use a supported literal static import");
      if (tokens.slice(from + 2, end).some((item) => item.value === "assert" || item.value === "with")) return fail("import-attributes", "import attributes are not permitted in core", "remove import attributes from the core closure");
      specifiers.push(tokens[from + 1].value); i = end; continue;
    }
    const end = statementEnd(tokens, i + 1);
    if (next?.value === "*") {
      const fromIndex = tokens[i + 2]?.value === "as" ? i + 4 : i + 2;
      if (tokens[fromIndex]?.value !== "from" || tokens[fromIndex + 1]?.type !== "string") return fail("unclassifiable-export", "export-from must have one literal source", "use a supported literal export-from form");
      specifiers.push(tokens[fromIndex + 1].value); i = end; continue;
    }
    if (next?.value === "{") {
      let from = -1;
      for (let cursor = i + 1; cursor < end; cursor += 1) if (tokens[cursor].value === "from") { from = cursor; break; }
      if (from >= 0) {
        if (tokens[from + 1]?.type !== "string") return fail("unclassifiable-export", "export-from must have one literal source", "use a supported literal export-from form");
        specifiers.push(tokens[from + 1].value);
      }
      i = end; continue;
    }
    if (["const", "let", "var", "function", "class", "async", "default"].includes(next?.value)) { i = end; continue; }
    return fail("unclassifiable-export", "export form is not admitted to core", "use a declaration export or supported literal export-from form");
  }
  return { ok: true, specifiers };
}

export function validateInventoryData(data, limits = CORE_LIMITS) {
  if (!data || typeof data !== "object" || Array.isArray(data) || Object.keys(data).sort().join("\n") !== ["budget_ms", "entries", "schema"].join("\n")) return fail("inventory-shape", "inventory must contain exactly schema, budget_ms, entries", "restore the checked-in core inventory schema");
  if (data.schema !== INVENTORY_SCHEMA || data.budget_ms !== 60000 || !Array.isArray(data.entries) || !data.entries.length) return fail("inventory-shape", "inventory schema, budget, or entries are invalid", "restore the checked-in core inventory values");
  if (data.entries.length > limits.maxEntries) return fail("inventory-limit", `inventory has more than ${limits.maxEntries} entries`, "move excess tests to an opt-in tier");
  if (data.entries.some((entry) => typeof entry !== "string") || data.entries.join("\n") !== [...data.entries].sort().join("\n") || new Set(data.entries).size !== data.entries.length) return fail("inventory-entries", "entries must be unique lexical strings", "sort and deduplicate the core inventory");
  return { ok: true };
}

function validateEntry(root, entry) {
  if (!TEST_ENTRY.test(entry) || entry.includes("\\") || entry.includes("..") || entry.startsWith("/")) return fail("entry-path", `unsupported core entry ${entry}`, "use one repository-relative tests/**/test_*.mjs entry");
  const path = resolve(root, entry);
  if (!inside(resolve(root), path) || !existsSync(path) || !statSync(path).isFile()) return fail("entry-path", `missing core entry ${entry}`, "restore one existing repository test entry");
  return { ok: true, path };
}

function resolveSpecifier(root, importer, specifier) {
  if (specifier === "vitest") return { ok: true, external: true };
  if (specifier.startsWith("node:")) {
    if (PROHIBITED_NODE.test(specifier)) return fail("prohibited-node", `${specifier} is not permitted in core`, "move process or network work to an opt-in tier");
    return { ok: true, external: true };
  }
  if (!specifier.startsWith(".")) return fail("bare-import", `${specifier} is not an admitted core runtime`, "use exact vitest or a safe node: builtin only");
  if (!specifier.endsWith(".mjs") || specifier.includes("?") || specifier.includes("#")) return fail("local-resolution", `${specifier} must be an exact relative .mjs path`, "use an exact relative .mjs import");
  const path = resolve(dirname(importer), specifier);
  const relativePath = normalized(relative(root, path));
  if (relativePath.startsWith("../") || !SAFE_ROOTS.some((prefix) => relativePath.startsWith(prefix))) return fail("local-root", `${specifier} resolves outside the core-safe roots`, "move the dependency behind an admitted public seam");
  if (!existsSync(path) || !statSync(path).isFile()) return fail("local-resolution", `missing local module ${specifier}`, "restore the exact relative .mjs module");
  return { ok: true, path };
}

export function auditInventoryObject(data, { root = process.cwd(), limits = CORE_LIMITS } = {}) {
  const inventory = validateInventoryData(data, limits);
  if (!inventory.ok) return inventory;
  const rootPath = resolve(root);
  const queue = [];
  for (const entry of data.entries) {
    const checked = validateEntry(rootPath, entry);
    if (!checked.ok) return checked;
    queue.push(checked.path);
  }
  const visited = new Set();
  let totalBytes = 0;
  while (queue.length) {
    const path = queue.shift();
    if (visited.has(path)) continue;
    const size = statSync(path).size;
    if (size > limits.maxFileBytes) return fail("file-limit", `${normalized(relative(rootPath, path))} exceeds ${limits.maxFileBytes} bytes`, "reduce the audited module below the core file limit");
    visited.add(path);
    if (visited.size > limits.maxFiles) return fail("closure-limit", `closure exceeds ${limits.maxFiles} files`, "move excess dependencies to an opt-in tier");
    totalBytes += size;
    if (totalBytes > limits.maxTotalBytes) return fail("closure-limit", `closure exceeds ${limits.maxTotalBytes} bytes`, "reduce the core closure or move a test to an opt-in tier");
    const source = readFileSync(path, "utf8");
    if (PROHIBITED_SURFACE.test(normalized(relative(rootPath, path)))) return fail("prohibited-surface", `${normalized(relative(rootPath, path))} is a visual/provider surface`, "move the test to an opt-in tier");
    const scanned = collectStaticSpecifiers(source);
    if (!scanned.ok) return scanned;
    for (const specifier of scanned.specifiers) {
      if (PROHIBITED_SURFACE.test(specifier)) return fail("prohibited-surface", `${specifier} is not permitted in core`, "move the visual/provider dependency to an opt-in tier");
      const edge = resolveSpecifier(rootPath, path, specifier);
      if (!edge.ok) return edge;
      if (!edge.external) queue.push(edge.path);
    }
  }
  return { ok: true, entries: data.entries, files: [...visited].map((path) => normalized(relative(rootPath, path))).sort(), total_bytes: totalBytes };
}

export function readAndAuditCoreInventory({ root = process.cwd(), inventoryPath = "tests/contracts/development-verification-core-v1.json", limits = CORE_LIMITS } = {}) {
  const path = resolve(root, inventoryPath);
  let data;
  try { data = JSON.parse(readFileSync(path, "utf8")); } catch (error) { return fail("inventory-shape", `cannot read core inventory: ${error.message}`, "restore valid checked-in core inventory JSON"); }
  return auditInventoryObject(data, { root, limits });
}

export function hasVisualEngineClosure(source) {
  return PROHIBITED_SURFACE.test(source);
}
