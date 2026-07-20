#!/usr/bin/env node
import "../../shared/cli/cli_bootstrap.mjs?entry=05-iteration/legacy-image2/make_contact_sheet.mjs";
import { runLegacyContactSheetCli } from "../index.mjs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const entry = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === resolve(entry)) {
  const { installStandaloneFailureEnvelope } = await import("../../shared/cli/cli_error.mjs");
  installStandaloneFailureEnvelope({ where: "make_contact_sheet" });
  await runLegacyContactSheetCli(process.argv);
}
