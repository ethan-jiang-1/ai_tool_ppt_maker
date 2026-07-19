#!/usr/bin/env node
import './lib/cli_bootstrap.mjs?entry=stage2_render_html.mjs';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CLI_ERROR_CODES, createCliNext, emitCliError } from './lib/cli_error.mjs';
import { buildHtmlPages, createCanonicalHtmlValidatedRunContext, publishHtmlPages, resolveHtmlSlideSelectors } from './lib/html_slide_renderer.mjs';

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
  if (options.help) { console.log('Usage: node stage2_render_html.mjs --run-dir <vN> [--only <slide-id>] [--variant effective|forced-fallback] [--dry-run]'); return; }
  const context = createCanonicalHtmlValidatedRunContext({ runDir: resolve(options.runDir) });
  const request = { ...(options.slideIds.length ? { slideIds: resolveHtmlSlideSelectors(context, options.slideIds) } : {}), ...(options.compositionVariant ? { compositionVariant: options.compositionVariant } : {}), ...(options.dryRun ? { dryRun: true } : {}) };
  const result = options.dryRun ? buildHtmlPages(context, request) : await publishHtmlPages(context, request);
  console.log(JSON.stringify({ ok: true, stage: 'stage2', dry_run: Boolean(options.dryRun), publication_scope: result.publication_scope, pages: result.pages.map(({ slide_id, html_sha256, composition_fingerprint }) => ({ slide_id, html_sha256, composition_fingerprint })) }));
  return result;
}

const entry = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === resolve(entry)) {
  const { installStandaloneFailureEnvelope } = await import('./lib/cli_error.mjs');
  installStandaloneFailureEnvelope({ where: 'stage2_render_html' });
  if (process.argv.includes('--help')) { console.log('Usage: node stage2_render_html.mjs --run-dir <vN> [--only <slide-id>] [--variant effective|forced-fallback] [--dry-run]'); process.exit(0); }
  main().catch((error) => { emitCliError({ code: error.message.startsWith('unsupported option') || error.message.includes('requires') ? CLI_ERROR_CODES.USAGE : CLI_ERROR_CODES.FAILED, message: 'Stage 2 HTML rendering failed.', hint: 'Repair the canonical run and rerun the local HTML renderer.', where: 'stage2_render_html.main', diagnostic: { version: 1, category: 'artifact', reason: { kind: 'html_render_failed' }, next: createCliNext('repair_prerequisite', { default: 'Inspect the structured source and local HTML runtime, then rerun Stage 2.' }) } }); process.exit(1); });
}
