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
    const wantsImage2 = process.argv.some((arg) => ["--image2", "--smoke", "--probe-vendors"].includes(arg));
    const providerApi = wantsImage2 ? await import("../04-image-production/index.mjs") : null;
    await runEnvironmentCheckCli(process.argv, providerApi ? {
      providerApi: {
        inspect: providerApi.inspectWholePageProvider,
        defaults: providerApi.wholePageProviderDefaults,
        classify: providerApi.classifyWholePageProviderResponse,
        host: providerApi.wholePageProviderHost,
      },
    } : undefined);
  }
}
