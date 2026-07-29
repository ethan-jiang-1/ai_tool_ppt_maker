#!/usr/bin/env node
import "../shared/cli/cli_bootstrap.mjs?entry=00-setup/env-check.mjs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const entry = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === resolve(entry)) {
  const { installStandaloneFailureEnvelope } = await import("../shared/cli/cli_error.mjs");
  installStandaloneFailureEnvelope({ where: "env-check" });
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log("Usage: node env-check.mjs [--json] [--image2] [--smoke] [--probe-vendors]");
  } else {
    const { runEnvironmentCheckCli } = await import("./index.mjs");
    await runEnvironmentCheckCli(process.argv);
  }
}
