#!/usr/bin/env node
import "../../shared/cli/cli_bootstrap.mjs?entry=05-iteration/legacy-image2/stage3_lock_headers.mjs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const entry = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === resolve(entry)) {
  const { installStandaloneFailureEnvelope } = await import("../../shared/cli/cli_error.mjs");
  installStandaloneFailureEnvelope({ where: "stage3_lock_headers" });
  const { runLegacyHeaderLockCli } = await import("../index.mjs");
  await runLegacyHeaderLockCli(process.argv);
}
