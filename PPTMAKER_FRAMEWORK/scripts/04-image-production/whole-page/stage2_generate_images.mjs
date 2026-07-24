#!/usr/bin/env node
import "../../shared/cli/cli_bootstrap.mjs?entry=04-image-production/whole-page/stage2_generate_images.mjs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const entry = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === resolve(entry)) {
  const { installStandaloneFailureEnvelope } = await import("../../shared/cli/cli_error.mjs");
  installStandaloneFailureEnvelope({ where: "stage2_generate_images" });
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(`Usage: stage2_generate_images.mjs [options]

Stage 2: generate slide images (in-framework Node, no skills)

Options:
  --prompt-json <path>      Stage 1 _prompts.json
  --out-dir <path>          Output directory for PNGs
  --style-reference <path>  style_master.jpg path
  --resolution <res>        1k | 2k | 4k (default: "2k")
  --model <name>            Image model (default: "gpt-image-2")
  --only <id>               Slide id to generate (repeatable)
  --force                   Regenerate even if PNG exists
  --prompt-is-final         Do not mutate prompt text (Stage 1 already assembled)
  --base-url <url>          API base URL (repeatable)
  --dry-run                 Print plan only
  -h, --help                display help for command`);
  } else {
    const { runWholePageImageGenerationCli } = await import("../index.mjs");
    await runWholePageImageGenerationCli(process.argv);
  }
}
