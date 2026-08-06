#!/usr/bin/env node
import "../shared/cli/cli_bootstrap.mjs?entry=00-setup/env-check.mjs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const entry = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === resolve(entry)) {
  const { installStandaloneFailureEnvelope } = await import("../shared/cli/cli_error.mjs");
  installStandaloneFailureEnvelope({ where: "env-check" });
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(`Usage: node env-check.mjs [--json] [--mode <mode>] [--operation <operation>] [--smoke | --probe-vendors]

Options:
  --json                    Emit one env-check-v1 JSON report on stdout
  --mode <mode>             Page Authority mode: image2-page-authority-v2
  --operation <operation>   framed-local-refresh, raw-generation, or full-build
  --smoke                   One live first-channel diagnostic submit
  --probe-vendors           One live diagnostic submit per resolved channel`);
  } else {
    const { runEnvironmentCheckCli } = await import("./index.mjs");
    await runEnvironmentCheckCli(process.argv);
  }
}
