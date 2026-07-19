#!/usr/bin/env node
import "./lib/cli_bootstrap.mjs?entry=stage3_compose_slides.mjs";
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CLI_ERROR_CODES, createCliNext, emitCliError } from './lib/cli_error.mjs';
import { composeHtmlSlidesVerified, createCanonicalHtmlValidatedRunContext, publishHtmlFinalSlides, resolveHtmlSlideSelectors } from './lib/html_slide_renderer.mjs';

function parseArgs(argv) {
  const options = { slideIds: [] }; const allowed = new Set(['--run-dir', '--only', '--variant', '--dry-run', '--help']);
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]; if (!allowed.has(arg)) throw new Error(`unsupported option ${arg}`);
    if (arg === '--help') options.help = true;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--run-dir' || arg === '--only' || arg === '--variant') { const value = argv[++index]; if (!value) throw new Error(`${arg} requires a value`); if (arg === '--run-dir') options.runDir = value; else if (arg === '--only') options.slideIds.push(value); else options.compositionVariant = value; }
  }
  if (!options.help && !options.runDir) throw new Error('--run-dir is required');
  return options;
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) { console.log('Usage: node stage3_compose_slides.mjs --run-dir <vN> [--only <slide-id>] [--variant effective|forced-fallback] [--dry-run]'); return; }
  const context = createCanonicalHtmlValidatedRunContext({ runDir: resolve(options.runDir) });
  const request = { ...(options.slideIds.length ? { slideIds: resolveHtmlSlideSelectors(context, options.slideIds) } : {}), ...(options.compositionVariant ? { compositionVariant: options.compositionVariant } : {}), ...(options.dryRun ? { dryRun: true } : {}) };
  const result = options.dryRun ? await composeHtmlSlidesVerified(context, request) : await publishHtmlFinalSlides(context, request);
  console.log(JSON.stringify({ ok: true, stage: 'stage3', dry_run: Boolean(options.dryRun), final_slides: result.final_slides.map(({ slide_id, png_sha256, width, height }) => ({ slide_id, png_sha256, width, height })) }));
  return result;
}

const entry = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === resolve(entry)) {
  const { installStandaloneFailureEnvelope } = await import('./lib/cli_error.mjs');
  installStandaloneFailureEnvelope({ where: 'stage3_compose_slides' });
  if (process.argv.includes('--help')) { console.log('Usage: node stage3_compose_slides.mjs --run-dir <vN> [--only <slide-id>] [--variant effective|forced-fallback] [--dry-run]'); process.exit(0); }
  main().catch((error) => { emitCliError({ code: error.message.startsWith('unsupported option') || error.message.includes('requires') ? CLI_ERROR_CODES.USAGE : CLI_ERROR_CODES.FAILED, message: 'Stage 3 HTML composition failed.', hint: 'Repair the local HTML page evidence and rerun the compositor.', where: 'stage3_compose_slides.main', diagnostic: { version: 1, category: 'artifact', reason: { kind: 'html_composition_failed' }, next: createCliNext('repair_prerequisite', { default: 'Inspect Stage 2 HTML pages and rerun Stage 3 locally.' }) } }); process.exit(1); });
}
