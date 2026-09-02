/**
 * file_size_gate.mjs — check that no Harness source file exceeds the line limit.
 *
 * Run: node ppt_maker_harness/scripts/shared/quality/file_size_gate.mjs
 * Intended use: CI / pre-commit hook to prevent accidental mega-files.
 *
 * Authority: _backlog/plans/quality-test-maint-improvement.md
 */
import { readFileSync, statSync, readdirSync } from "node:fs";
import { join, extname } from "node:path";

const HARNESS_DIR = new URL("../../", import.meta.url).pathname;
const LIMIT = 1500; // soft warning line
const HARD_LIMIT = 2500; // hard failure line

const SOURCE_DIRS = [
  "scripts",
  "contracts",
];

const EXTENSIONS = new Set([".mjs", ".js"]);

// Directories to skip entirely
const SKIP_DIRS = new Set(["node_modules", ".git"]);

function collectFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name) || entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(full));
    } else if (entry.isFile() && EXTENSIONS.has(extname(entry.name))) {
      results.push(full);
    }
  }
  return results;
}

function main() {
  const warnings = [];
  const errors = [];
  let totalFiles = 0;

  for (const subdir of SOURCE_DIRS) {
    const dir = join(HARNESS_DIR, subdir);
    if (!statSync(dir, { throwIfNoEntry: false })) continue;
    const files = collectFiles(dir);
    totalFiles += files.length;

    for (const file of files) {
      const content = readFileSync(file, "utf-8");
      const lines = content.split("\n").length;
      const rel = file.replace(HARNESS_DIR, "");

      if (lines > HARD_LIMIT) {
        errors.push(`  ${rel}: ${lines} lines (hard limit ${HARD_LIMIT})`);
      } else if (lines > LIMIT) {
        warnings.push(`  ${rel}: ${lines} lines (soft limit ${LIMIT})`);
      }
    }
  }

  if (warnings.length > 0) {
    console.log(`⚠  ${warnings.length} file(s) exceed soft limit (${LIMIT} lines):`);
    for (const w of warnings) console.log(w);
  }

  if (errors.length > 0) {
    console.log(`\n✗ ${errors.length} file(s) exceed hard limit (${HARD_LIMIT} lines):`);
    for (const e of errors) console.log(e);
    console.log(`\nResult: FAILED (${totalFiles} files checked)`);
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.log(`\nResult: WARNING (${totalFiles} files checked, ${warnings.length} over soft limit)`);
    process.exit(0);
  }

  console.log(`✓ All ${totalFiles} files within ${LIMIT} lines.`);
  process.exit(0);
}

main();