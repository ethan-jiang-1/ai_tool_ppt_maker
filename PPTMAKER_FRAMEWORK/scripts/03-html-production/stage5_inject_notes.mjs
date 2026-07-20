#!/usr/bin/env node
import "../shared/cli/cli_bootstrap.mjs?entry=03-html-production/stage5_inject_notes.mjs";
import { runStage5Cli } from "./index.mjs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const entry = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === resolve(entry)) {
  const { installStandaloneFailureEnvelope } = await import("../shared/cli/cli_error.mjs");
  installStandaloneFailureEnvelope({ where: "stage5_inject_notes" });
  await runStage5Cli(process.argv, { executablePath: process.argv[1] });
}
