#!/usr/bin/env node
/**
 * ppt_flow.mjs — Node.js ESM pipeline script (split entry).
 *
 * Thin entry: registers the closed ppt_flow inventory and lazily dispatches to
 * shared/cli/commands/*.mjs. Shared glue lives in shared/cli/command_support.mjs.
 * This is the default human/agent entry point.
 *
 * Command inventory authority: the program.command(...) registrations in this
 * file are the inventory; `--help` output is runtime truth; and
 * ppt_maker_harness/COMMANDS.md is the novice-facing discovery reference
 * (commands-reference capability). Do not add a
 * prose command enumeration here — the command-surface contract guard rejects
 * comment-block command inventories in this entry file.
 *
 * Hard failures: JSON envelope on last non-empty stderr line (shared/cli/cli_error.mjs).
 */

import "./shared/cli/cli_bootstrap.mjs?entry=ppt_flow.mjs";

import { existsSync } from "node:fs";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Command, Option } from "commander";
import {
  CLI_ERROR_CODES,
  CLI_DIAGNOSTIC_SCHEMA,
  createCliNext,
  emitRetiredImage2LiveFlagUsage,
  exitCliError,
  setCliOutputMode,
} from "./shared/cli/cli_error.mjs";
import {
  DECK_TYPE_TEMPLATES,
  STYLE_PRESETS,
} from "./shared/run-bundle/bundle_layout.mjs";
import { exitUsage, exitWithCode } from "./shared/cli/cli_diagnostics.mjs";

import {
  COMMAND_CONTRACTS,
  renderContractBlock,
} from "./shared/cli/command_result.mjs";

const __filename = fileURLToPath(import.meta.url);

const STYLE_PRESETS_SORTED = () => [...STYLE_PRESETS].sort();
const DECK_TYPES_SORTED = () => Object.keys(DECK_TYPE_TEMPLATES).sort();

async function main() {
  const program = new Command();
  program.exitOverride();

  program
    .name("ppt_flow.mjs")
    .description("One friendly entry point for the complete PPT workflow.")
    .addHelpText(
      "after",
      `
Examples:
  ppt_flow.mjs doctor
  ppt_flow.mjs init deck_mydeck --deck-type pitch --style tech-startup
  ppt_flow.mjs status deck_mydeck/3_versions/v1
  ppt_flow.mjs validate deck_mydeck/3_versions/v1
  ppt_flow.mjs style-master plan deck_mydeck/3_versions/v1 --candidate-count 2
  ppt_flow.mjs image2 plan deck_mydeck/3_versions/v1
  ppt_flow.mjs build deck_mydeck/3_versions/v1
  ppt_flow.mjs refresh deck_mydeck/3_versions/v1 --kind title --only slide_03
  ppt_flow.mjs slides list deck_mydeck/3_versions/v1
  ppt_flow.mjs slides move deck_mydeck/3_versions/v1 7 --after 3
  ppt_flow.mjs new-version deck_mydeck/3_versions/v1 --name v2
  ppt_flow.mjs test
  ppt_flow.mjs state deck_mydeck/3_versions/v1 --json
`
    );

  // ---- doctor ----
  program
    .command("doctor")
    .description("Check offline local runtime")
    .addOption(new Option("--smoke").hideHelp())
    .addOption(new Option("--probe-vendors").hideHelp())
    .addHelpText("after", renderContractBlock(COMMAND_CONTRACTS.doctor))
    .action(async (opts) => {
      if (opts.smoke || opts.probeVendors) {
        emitRetiredImage2LiveFlagUsage("ppt_flow.doctor.arguments");
        process.exit(1);
      }
      const { commandDoctor } = await import("./shared/cli/commands/doctor.mjs");
      const code = await commandDoctor();
      if (code === null) {
        process.exit(1);
        return;
      }
      exitWithCode(
        code,
        "ppt_flow.doctor",
        `doctor exited ${code}`,
        "Fix env issues reported by env-check, then re-run doctor"
      );
    });

  // ---- preflight ----
  program
    .command("preflight")
    .description("Check exact-run operation readiness with zero network and zero write")
    .argument("<run_dir>", "Path to the exact version dir")
    .option("--operation <operation>", "Run-bound Page Image operation: framed-local-refresh|raw-generation|full-build")
    .addHelpText("after", renderContractBlock(COMMAND_CONTRACTS.preflight))
    .action(async (runDir, opts) => {
      const { commandPreflight } = await import("./shared/cli/commands/preflight.mjs");
      const code = await commandPreflight(runDir, { operation: opts.operation });
      if (code === null) {
        process.exit(1);
        return;
      }
      exitWithCode(
        code,
        "ppt_flow.preflight",
        `preflight exited ${code}`,
        "Fix env / Image2 channel issues reported by env-check, then re-run preflight"
      );
    });

  // ---- probe ----
  program
    .command("probe")
    .description("Live connectivity probe of the confirmed Call Shape bound to the exact run")
    .argument("<run_dir>", "Path to the exact version dir")
    .addOption(new Option("--smoke").hideHelp())
    .addOption(new Option("--probe-vendors").hideHelp())
    .addHelpText("after", renderContractBlock(COMMAND_CONTRACTS.probe))
    .action(async (runDir, opts) => {
      if (opts.smoke || opts.probeVendors) {
        emitRetiredImage2LiveFlagUsage("ppt_flow.probe.arguments");
        process.exit(1);
      }
      const { commandProbe } = await import("./shared/cli/commands/probe.mjs");
      const code = await commandProbe(runDir);
      if (code === null) {
        process.exit(1);
        return;
      }
      exitWithCode(
        code,
        "ppt_flow.probe",
        `probe exited ${code}`,
        "Fix env / Image2 channel issues, then re-run probe"
      );
    });

  // ---- init ----
  program
    .command("init")
    .description("Create a conformant run bundle")
    .argument("<deck_dir>", "Target deck directory (must start with deck_)")
    .requiredOption(
      "--deck-type <type>",
      `Deck type: ${DECK_TYPES_SORTED().join(", ")}`
    )
    .requiredOption(
      "--style <style>",
      `Style preset: ${STYLE_PRESETS_SORTED().join(", ")}`
    )
    .addHelpText("after", renderContractBlock(COMMAND_CONTRACTS.init))
    .action(async (deckDir, opts) => {
      const { commandInit } = await import("./shared/cli/commands/init.mjs");
      const code = commandInit(deckDir, {
        deckType: opts.deckType,
        style: opts.style,
      });
      process.exit(code);
    });

  // ---- status ----
  program
    .command("status")
    .description("Show gates, artifacts, playbook breakpoint, and next action")
    .argument(
      "<run_dir>",
      "Path to version dir (e.g., deck_xxx/3_versions/v1)"
    )
    .option("--json", "Output machine-readable JSON")
    .addHelpText("after", renderContractBlock(COMMAND_CONTRACTS.status))
    .action(async (runDir, opts) => {
      if (opts.json) setCliOutputMode("json");
      const { commandStatus } = await import("./shared/cli/commands/status.mjs");
      const code = await commandStatus(runDir, { json: opts.json ?? false });
      process.exit(code);
    });

  // ---- validate ----
  program
    .command("validate")
    .description("Validate slide specs before image generation")
    .argument("<run_dir>", "Path to version dir")
    .addHelpText("after", renderContractBlock(COMMAND_CONTRACTS.validate))
    .action(async (runDir) => {
      const { commandValidate } = await import("./shared/cli/commands/validate.mjs");
      const code = await commandValidate(runDir);
      process.exit(code);
    });

  // ---- build ----
  program
    .command("build")
    .description("Build the complete final deck")
    .argument("<run_dir>", "Path to version dir")
    .addHelpText("after", renderContractBlock(COMMAND_CONTRACTS.build))
    .action(async (runDir) => {
      const { commandBuild } = await import("./shared/cli/commands/build.mjs");
      const code = await commandBuild(runDir);
      process.exit(code);
    });

  // ---- refresh ----
  program
    .command("refresh")
    .description("Run the smallest safe edit chain")
    .argument("<run_dir>", "Path to version dir")
    .option(
      "--kind <kind>",
      "Edit scope: title, visual, or notes",
      "title"
    )
    .option("--only <ids>", "For title/visual: comma-separated slide IDs")
    .option("--all", "For title/visual: explicitly select all pages")
    .addHelpText("after", renderContractBlock(COMMAND_CONTRACTS.refresh))
    .action(async (runDir, opts) => {
      if (!["title", "visual", "notes"].includes(opts.kind)) {
        exitUsage("ppt_flow.refresh.kind", "--kind must be title, visual, or notes.", "Pass a supported refresh kind");
      }
      const { commandRefresh } = await import("./shared/cli/commands/refresh.mjs");
      const code = await commandRefresh(runDir, {
        kind: opts.kind,
        only: opts.only || null,
        all: opts.all ?? false,
      });
      process.exit(code);
    });

  // ---- slides ----
  program
    .command("slides")
    .description("Preview stable-ID edits or apply an exact confirmed structural plan")
    .argument("<subcommand>", "list, resolve, normalize, move, delete, insert, or apply-plan")
    .argument("<run_dir>", "Path to current version dir")
    .argument("[selectors...]", "Slide selectors for resolve/move/delete")
    .option("--after <selector>", "Place target after snapshot selector")
    .option("--before <selector>", "Place target before snapshot selector")
    .option("--to <edge>", "Place target at start or end")
    .option("--source <path>", "Insert source containing one complete slide block")
    .option("--plan <path>", "Persisted exact structural plan under current _scratch/")
    .option("--apply", "Apply the confirmed preview")
    .option("--plan-sha256 <hash>", "Exact hash from the confirmed preview")
    .option("--json", "Output one machine-readable report")
    .addHelpText("after", renderContractBlock(COMMAND_CONTRACTS.slides))
    .action(async (subcommand, runDir, selectors, opts) => {
      const allowed = new Set(["list", "resolve", "normalize", "move", "delete", "insert", "apply-plan"]);
      if (!allowed.has(subcommand)) {
        exitUsage("ppt_flow.slides.subcommand", `unknown slides subcommand ${JSON.stringify(subcommand)}`, `Use one of: ${[...allowed].join(", ")}`);
      }
      if (opts.json) setCliOutputMode("json");
      const args = selectors || [];
      if (subcommand === "resolve" && args.length === 0) {
        exitUsage("ppt_flow.slides.resolve", "resolve requires at least one selector", "Pass one or more position, ID, or title selectors");
      }
      if (subcommand === "move" && args.length !== 1) {
        exitUsage("ppt_flow.slides.move", "move requires exactly one target selector", "Pass one target plus --after, --before, or --to");
      }
      if (subcommand === "delete" && args.length === 0) {
        exitUsage("ppt_flow.slides.delete", "delete requires at least one selector", "Pass one or more snapshot selectors");
      }
      if (subcommand === "insert" && !opts.source) {
        exitUsage("ppt_flow.slides.insert", "insert requires --source", "Pass --source <one-slide-block.md>");
      }
      if (subcommand === "apply-plan" && !opts.plan) {
        exitUsage("ppt_flow.slides.apply-plan", "apply-plan requires --plan", "Pass a plan file inside the current version _scratch/");
      }
      if (opts.to && !["start", "end"].includes(opts.to)) {
        exitUsage("ppt_flow.slides.to", "--to must be start or end", "Pass --to start or --to end");
      }
      const { commandSlides } = await import("./shared/cli/commands/slides.mjs");
      const code = await commandSlides(subcommand, runDir, args, {
        after: opts.after,
        before: opts.before,
        to: opts.to,
        source: opts.source,
        plan: opts.plan,
        apply: opts.apply ?? false,
        planSha256: opts.planSha256 || null,
        json: opts.json ?? false,
      });
      process.exit(code);
    });

  // ---- paginate ----
  program
    .command("paginate")
    .description("Preview or publish one exact narrative page plan")
    .argument("<subcommand>", "plan or apply")
    .argument("<run_dir>", "Path to current version dir")
    .option("--candidate <path>", "Agent-authored narrative candidate under current _scratch/")
    .option("--plan <path>", "Persisted exact narrative plan under current _scratch/")
    .option("--plan-sha256 <hash>", "Exact hash from the confirmed preview")
    .option("--json", "Output one machine-readable report")
    .addHelpText("after", renderContractBlock(COMMAND_CONTRACTS.paginate))
    .action(async (subcommand, runDir, opts) => {
      if (opts.json) setCliOutputMode("json");
      const { commandPaginate } = await import("./shared/cli/commands/paginate.mjs");
      const code = await commandPaginate(subcommand, runDir, {
        candidate: opts.candidate || null,
        plan: opts.plan,
        planSha256: opts.planSha256 || null,
        json: opts.json ?? false,
      });
      process.exit(code);
    });

  // ---- new-version ----
  program
    .command("new-version")
    .description("Create a clean downstream version")
    .argument("<run_dir>", "Path to source version dir")
    .option("--name <name>", "Explicit version name, e.g. v3")
    .addHelpText("after", renderContractBlock(COMMAND_CONTRACTS["new-version"]))
    .action(async (runDir, opts) => {
      const { commandNewVersion } = await import("./shared/cli/commands/new-version.mjs");
      const code = await commandNewVersion(runDir, {
        name: opts.name || null,
      });
      process.exit(code);
    });

  // ---- reset-unproduced-v1 ----
  program
    .command("reset-unproduced-v1")
    .description("Abandon an unpublished unique v1 page structure and restore the authoring draft")
    .argument("<run_dir>", "Path to the exact v1 version dir")
    .option("--confirm-abandon", "Deck Author confirms abandoning this unpublished v1 structure")
    .option("--json", "Output one machine-readable report")
    .addHelpText("after", renderContractBlock(COMMAND_CONTRACTS["reset-unproduced-v1"]))
    .action(async (runDir, opts) => {
      if (opts.json) setCliOutputMode("json");
      const { commandResetUnproducedV1 } = await import("./shared/cli/commands/reset-unproduced-v1.mjs");
      const code = commandResetUnproducedV1(runDir, {
        confirmAbandon: Boolean(opts.confirmAbandon),
        json: opts.json ?? false,
      });
      process.exit(code);
    });

  // ---- test ----
  program
    .command("test")
    .description("Run bounded core verification")
    .addHelpText("after", renderContractBlock(COMMAND_CONTRACTS.test))
    .action(async () => {
      const { commandTest } = await import("./shared/cli/commands/test.mjs");
      const code = await commandTest();
      process.exit(code);
    });

  // ---- state ----
  program
    .command("state")
    .description("Show current Page Image state")
    .argument("<runDir>", "Path to version directory")
    .option("--json", "JSON output")
    .option("--validate-state", "Validate persisted state and evidence without writing")
    .option("--repair-known-execution-mismatch", "Repair only the exact BUG-066 execution-mismatch state signature")
    .addHelpText("after", renderContractBlock(COMMAND_CONTRACTS.state))
    .action(async (runDir, opts) => {
      const { commandState } = await import("./shared/cli/commands/state.mjs");
      await commandState(runDir, opts);
    });

  // ---- style-master (candidate lifecycle before page raw work) ----
  program
    .command("style-master")
    .description("Current Page Image Style Master candidate lifecycle")
    .argument("<operation>", "inspect, plan, authorize, generate, review, accept, or abandon")
    .argument("<run_dir>", "Path to the exact version dir")
    .option("--plan-hash <sha256>", "Exact current Style Master plan hash")
    .option("--candidate-count <count>", "New generated candidate count: 0 through 4")
    .option("--decision <decision>", "Visual-direction decision: proceed, repair, or redirect")
    .option("--candidate-id <slot-id>", "Eligible reviewed candidate ID for proceed")
    .option("--reason <text>", "Bounded human reason for exact unknown-plan abandonment")
    .option("--json", "Output one machine-readable report")
    .addHelpText("after", "\ninspect -> plan -> authorize -> generate -> review -> accept\nA zero-generated local plan skips authorize and generate.\n")
    .addHelpText("after", renderContractBlock(COMMAND_CONTRACTS["style-master"]))
    .action(async (operation, runDir, opts) => {
      if (opts.json) setCliOutputMode("json");
      const { commandStyleMaster } = await import("./shared/cli/commands/style-master.mjs");
      const code = await commandStyleMaster(operation, runDir, opts);
      process.exit(code);
    });

  // ---- image2 (Page Image raw lifecycle) ----
  program
    .command("image2")
    .description("Receipt-bound progressive Page Image lifecycle")
    .argument("<operation>", "plan, pilot, expansion, authorize, generate, pilot-review, pilot-accept, review, accept, or reconcile")
    .argument("<run_dir>", "Path to the exact version dir")
    .option("--plan-hash <sha256>", "Exact current progressive full-plan hash")
    .option("--batch-hash <sha256>", "Exact current progressive batch hash")
    .option("--attempt-sha256 <sha256>", "Exact submitted progressive attempt hash for reconciliation")
    .option("--slide-id <formal-id>", "Repeat an exact formal slide ID for Pilot scope", (value, previous) => [...(previous || []), value])
    .option("--decision <decision>", "Pilot: proceed, repair, or redirect; Complete Page Review: proceed or repair")
    .option("--json", "Output one machine-readable success report")
    .addHelpText("after", "\nplan -> pilot | expansion -> authorize -> generate (one item) -> pilot-review/pilot-accept | Complete Page Review -> build\nPilot accepts repeated exact --slide-id values; all paid work requires exact plan and batch hashes.\n")
    .addHelpText("after", renderContractBlock(COMMAND_CONTRACTS.image2))
    .action(async (operation, runDir, opts) => {
      if (opts.json) setCliOutputMode("json");
      const { commandImage2 } = await import("./shared/cli/commands/image2.mjs");
      const code = await commandImage2(operation, runDir, {
        ...opts,
        slotExplicit: false,
      });
      process.exit(code);
    });

  // ---- artifacts ----
  program
    .command("artifacts")
    .description("Rebuild the current Human Navigation Path")
    .argument("<run_dir>", "Path to the exact version dir")
    .addHelpText("after", renderContractBlock(COMMAND_CONTRACTS.artifacts))
    .action(async (runDir) => {
      const { commandArtifacts } = await import("./shared/cli/commands/artifacts.mjs");
      const code = await commandArtifacts(runDir);
      process.exit(code);
    });

  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    if (
      err?.code === "commander.helpDisplayed" ||
      err?.code === "commander.versionDisplayed"
    ) {
      process.exit(0);
    }
    console.error("✗ Command arguments are invalid.");
    exitCliError(
      {
        code: CLI_ERROR_CODES.USAGE,
        message: "Command arguments are invalid.",
        hint: "Run with --help for usage",
        where: "ppt_flow.main",
        diagnostic: { schema: CLI_DIAGNOSTIC_SCHEMA, category: "usage", operation: "parse-command", next: createCliNext("fix_arguments", { invocation: { program: "node", args: [__filename, "--help"] }, default: "Inspect --help, correct the command arguments, then rerun." }) },
      },
      1
    );
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const invokedPath = process.argv[1];
const isMain =
  invokedPath &&
  (invokedPath === __filename ||
    invokedPath === resolve(__filename) ||
    (basename(invokedPath) === "ppt_flow.mjs" && existsSync(invokedPath)));

if (isMain) {
  const { installStandaloneFailureEnvelope } = await import("./shared/cli/cli_error.mjs");
  installStandaloneFailureEnvelope({ where: "ppt_flow.main" });
  await main().catch((err) => {
    console.error(`✗ Fatal error: ${err.message}`);
    exitCliError(
      {
        code: CLI_ERROR_CODES.UNCAUGHT,
        message: "ppt_flow failed unexpectedly.",
        hint: "Inspect the command location and report the Harness failure.",
        where: "ppt_flow.main",
        diagnostic: { schema: CLI_DIAGNOSTIC_SCHEMA, category: "internal", operation: "run-command", next: createCliNext("report_internal", { default: "Inspect ppt_flow.mjs without relying on captured exception prose, then report the defect." }) },
      },
      1
    );
  });
}
