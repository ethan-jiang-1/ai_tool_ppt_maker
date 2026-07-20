#!/usr/bin/env node
import "../shared/cli/cli_bootstrap.mjs?entry=03-html-production/stage1_build_inputs.mjs";
import { runStage1Inputs } from "./index.mjs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HELP = "Usage: node stage1_build_inputs.mjs --spec <path> [--spec <path2>] [--out <dir>] [--style-dir <dir>] [--deck-system <file>] [--color-palette <file>] [--validate]";

const entry = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === resolve(entry)) {
  const { installStandaloneFailureEnvelope } = await import("../shared/cli/cli_error.mjs");
  installStandaloneFailureEnvelope({ where: "stage1_build_inputs" });
  if (process.argv.includes("--help")) {
    console.log(HELP);
    process.exit(0);
  }
  await runStage1Inputs(process.argv.slice(2), { executablePath: process.argv[1] });
}
