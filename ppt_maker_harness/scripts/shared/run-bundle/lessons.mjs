#!/usr/bin/env node
/**
 * lessons.mjs — lesson management CLI for run-bundle _lessons/ directories.
 *
 * Subcommands:
 *   list   <runDir> [--json]       List all lessons with summaries
 *   add    <runDir> --title <slug>  Scaffold a new lesson from template
 *   check  <runDir>                Print a reminder to read existing lessons
 *   search <runDir> <keyword>      Case-insensitive grep across lessons
 *
 * Zero external dependencies. Uses Node.js built-ins only.
 * Imports path constants from bundle_layout.mjs (SSOT for run-bundle paths).
 */

import "../cli/cli_bootstrap.mjs?entry=shared/run-bundle/lessons.mjs";
import { CLI_ERROR_CODES, createCliNext, emitCliError } from "../cli/cli_error.mjs";

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { deckRoot, LESSONS_DIR } from "./bundle_layout.mjs";
import { verifyDeckHarnessBinding } from "./run_bundle_locator.mjs";

const __filename = fileURLToPath(import.meta.url);

function resolveBoundDeckRoot(runDir, where) {
  const root = deckRoot(runDir);
  const binding = verifyDeckHarnessBinding(root);
  if (binding.kind === "resolved") return binding.deckDir;
  emitCliError({
    code: CLI_ERROR_CODES.FAILED,
    message: "RUN_BUNDLE.md does not verify this Deck's exact local PPT Maker Harness identity.",
    hint: "Preserve the existing Bundle unchanged; reconstruct a new current Bundle before resuming this content.",
    where,
    diagnostic: {
      version: 1,
      category: "gate",
      operation: "verify-harness-binding",
      source: { path: root },
      reason: { kind: "harness_binding_invalid", actual: binding.code },
      next: createCliNext("repair_prerequisite", {
        requiresHuman: true,
        default: "Confirm reconstruction of a new current Run Bundle; preserve the existing Bundle unchanged.",
      }),
    },
  });
  return null;
}

// ---------------------------------------------------------------------------
// Lesson helpers
// ---------------------------------------------------------------------------

/** List lesson files (excluding README.md). Returns sorted filenames. */
function listLessonFiles(lessonsDir) {
  if (!fs.existsSync(lessonsDir) || !fs.statSync(lessonsDir).isDirectory()) {
    return [];
  }
  return fs
    .readdirSync(lessonsDir, { withFileTypes: true })
    .filter(
      (e) =>
        e.isFile() &&
        e.name !== "README.md" &&
        (e.name.endsWith(".md") || e.name.endsWith(".yaml"))
    )
    .map((e) => e.name)
    .sort();
}

/** Extract a summary from a .md lesson file (first # heading or filename). */
function mdSummary(filePath, filename) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const match = content.match(/^#\s+(.+)$/m);
    return match ? match[1].trim() : filename;
  } catch {
    return filename;
  }
}

/** Extract a summary from a .yaml lesson file (first # comment or filename). */
function yamlSummary(filePath, filename) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const match = content.match(/^#\s*(.+)$/m);
    return match ? match[1].trim() : filename;
  } catch {
    return filename;
  }
}

/** Get summary for any lesson file. */
function lessonSummary(lessonsDir, filename) {
  const fp = path.join(lessonsDir, filename);
  if (filename.endsWith(".yaml")) {
    return yamlSummary(fp, filename);
  }
  return mdSummary(fp, filename);
}

/** 4-question template for new .md lessons. */
function lessonTemplate(title) {
  return `# ${title}

**遇到什么:**

**怎么试的:**

**结论:**

**下次先看哪:**
`;
}

// ---------------------------------------------------------------------------
// Subcommand: list
// ---------------------------------------------------------------------------

function cmdList(runDir, asJson) {
  const root = resolveBoundDeckRoot(runDir, "lessons.list.binding");
  if (!root) return 1;
  const lessonsDir = path.join(root, LESSONS_DIR);
  const files = listLessonFiles(lessonsDir);

  if (asJson) {
    const items = files.map((f) => ({
      file: f,
      summary: lessonSummary(lessonsDir, f),
    }));
    console.log(JSON.stringify(items, null, 2));
  } else {
    if (files.length === 0) {
      console.log("0 lessons");
    } else {
      for (const f of files) {
        console.log(`  ${f} — ${lessonSummary(lessonsDir, f)}`);
      }
      console.log(`\n${files.length} lesson${files.length === 1 ? "" : "s"}`);
    }
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Subcommand: add
// ---------------------------------------------------------------------------

function cmdAdd(runDir, title) {
  if (!title) {
    console.error("✗ --title is required for add.");
    emitCliError({
      code: CLI_ERROR_CODES.USAGE,
      message: "Missing required --title for add.",
      hint: "Provide a kebab-case slug: lessons add <runDir> --title \"my-lesson\"",
      where: "lessons.add.title",
      diagnostic: { version: 1, category: "usage", operation: "add" },
    });
    return 1;
  }

  const root = resolveBoundDeckRoot(runDir, "lessons.add.binding");
  if (!root) return 1;
  const lessonsDir = path.join(root, LESSONS_DIR);
  const filePath = path.join(lessonsDir, `${title}.md`);

  if (fs.existsSync(filePath)) {
    console.error(`✗ Lesson file already exists: ${title}.md`);
    emitCliError({
      code: CLI_ERROR_CODES.FAILED,
      message: `Lesson file "${title}.md" already exists.`,
      hint: "Choose a different title or review the existing lesson.",
      where: "lessons.add.exists",
      diagnostic: {
        version: 1,
        category: "structure",
        operation: "add",
        subject: { kind: "lesson", id: title },
        source: { path: filePath },
      },
    });
    return 1;
  }

  fs.mkdirSync(lessonsDir, { recursive: true });
  fs.writeFileSync(filePath, lessonTemplate(title), "utf-8");
  console.log(`✓ Created: ${filePath}`);
  return 0;
}

// ---------------------------------------------------------------------------
// Subcommand: check
// ---------------------------------------------------------------------------

function cmdCheck(runDir) {
  const root = resolveBoundDeckRoot(runDir, "lessons.check.binding");
  if (!root) return 1;
  const lessonsDir = path.join(root, LESSONS_DIR);
  const files = listLessonFiles(lessonsDir);

  if (files.length === 0) {
    console.log("No lessons yet — nothing to review.");
  } else {
    console.log(`=== _lessons/ — ${files.length} lesson${files.length === 1 ? "" : "s"} to review ===\n`);
    for (const f of files) {
      console.log(`  ${f}`);
    }
    console.log("\n⚠ Read these before proceeding — avoid re-learning the same dead ends.");
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Subcommand: search
// ---------------------------------------------------------------------------

function cmdSearch(runDir, keyword) {
  if (!keyword) {
    console.error("✗ A search keyword is required.");
    emitCliError({
      code: CLI_ERROR_CODES.USAGE,
      message: "Missing search keyword.",
      hint: "Provide a keyword: lessons search <runDir> <keyword>",
      where: "lessons.search.keyword",
      diagnostic: { version: 1, category: "usage", operation: "search" },
    });
    return 1;
  }

  const root = resolveBoundDeckRoot(runDir, "lessons.search.binding");
  if (!root) return 1;
  const lessonsDir = path.join(root, LESSONS_DIR);
  const files = listLessonFiles(lessonsDir);
  const lower = keyword.toLowerCase();
  let found = false;

  for (const f of files) {
    const fp = path.join(lessonsDir, f);
    try {
      const lines = fs.readFileSync(fp, "utf-8").split("\n");
      for (const line of lines) {
        if (line.toLowerCase().includes(lower)) {
          console.log(`${f}: ${line.trim()}`);
          found = true;
        }
      }
    } catch {
      // skip unreadable files
    }
  }

  if (!found) {
    console.log("no matches");
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------

function printHelp() {
  console.log(`Usage: node lessons.mjs <command> [options]

Commands:
  list   <runDir> [--json]       List all lessons with summaries
  add    <runDir> --title <slug>  Create a new lesson from template
  check  <runDir>                Print reminder to read existing lessons
  search <runDir> <keyword>      Search lessons (case-insensitive)

Examples:
  node ppt_maker_harness/scripts/shared/run-bundle/lessons.mjs list deck_x/3_versions/v1
  node ppt_maker_harness/scripts/shared/run-bundle/lessons.mjs add deck_x/3_versions/v1 --title "font-fix"
  node ppt_maker_harness/scripts/shared/run-bundle/lessons.mjs check deck_x/3_versions/v1
  node ppt_maker_harness/scripts/shared/run-bundle/lessons.mjs search deck_x/3_versions/v1 vendor`);
}

// ---------------------------------------------------------------------------
// CLI entry
// ---------------------------------------------------------------------------

function _main() {
  const argv = process.argv.slice(2);

  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  const subcommand = argv[0];
  const args = argv.slice(1);

  // Parse remaining flags
  let runDir = null;
  let title = null;
  let asJson = false;
  let keyword = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--json") {
      asJson = true;
    } else if (arg === "--title") {
      title = args[++i] || null;
    } else if (!runDir && !arg.startsWith("--")) {
      runDir = arg;
    } else if (runDir && !arg.startsWith("--") && subcommand === "search") {
      keyword = arg;
    }
  }

  if (!runDir) {
    console.error("✗ A run directory is required.");
    printHelp();
    process.exit(1);
  }

  let exitCode = 0;
  switch (subcommand) {
    case "list":
      exitCode = cmdList(runDir, asJson);
      break;
    case "add":
      exitCode = cmdAdd(runDir, title);
      break;
    case "check":
      exitCode = cmdCheck(runDir);
      break;
    case "search":
      exitCode = cmdSearch(runDir, keyword);
      break;
    default:
      console.error(`✗ Unknown subcommand: ${subcommand}`);
      printHelp();
      exitCode = 1;
  }

  process.exit(exitCode);
}

const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const { installStandaloneFailureEnvelope } = await import("../cli/cli_error.mjs");
  installStandaloneFailureEnvelope({ where: "lessons" });
  _main();
}
