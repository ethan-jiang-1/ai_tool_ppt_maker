#!/usr/bin/env node
import "../../shared/cli/cli_bootstrap.mjs?entry=04-image-production/whole-page/generate_style_master.mjs";
import { runLegacyStyleMasterCli } from "../index.mjs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const entry = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === resolve(entry)) {
  const { installStandaloneFailureEnvelope } = await import("../../shared/cli/cli_error.mjs");
  installStandaloneFailureEnvelope({ where: "generate_style_master" });
  await runLegacyStyleMasterCli(process.argv, { executablePath: process.argv[1] });
}
