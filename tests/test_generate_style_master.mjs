import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { spawnSync } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createCanvas } from '@napi-rs/canvas';
import { initBundle } from '../PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs';
import { generateStyleMaster } from '../PPTMAKER_FRAMEWORK/scripts/generate_style_master.mjs';
import { loadDeckSystem } from '../PPTMAKER_FRAMEWORK/scripts/lib/deck_system.mjs';

function tinyPngB64() {
  const canvas = createCanvas(8, 8);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#112233';
  ctx.fillRect(0, 0, 8, 8);
  return canvas.toBuffer('image/png').toString('base64');
}

function mockImageApi(onSubmit) {
  const b64 = tinyPngB64();
  return vi.fn(async (url, init) => {
    const u = String(url);
    if (u.includes('/images/generations') && init?.method === 'POST') {
      onSubmit?.(JSON.parse(init.body));
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ task_id: 't1' }),
        json: async () => ({ task_id: 't1' }),
      };
    }
    if (u.includes('/tasks/')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: 'completed',
          data: { result: { images: [{ b64_json: b64 }] } },
        }),
      };
    }
    return { ok: false, status: 404, text: async () => '', json: async () => ({}) };
  });
}

describe('generate_style_master', () => {
  it('module exports expected functions', async () => {
    const mod = await import('../PPTMAKER_FRAMEWORK/scripts/generate_style_master.mjs');
    expect(mod.generateStyleMaster).toBeTypeOf('function');
  });

  it('emits a structured source diagnostic for an invalid run bundle', () => {
    const missing = join(tmpdir(), `deck_missing_style_${Date.now()}`, '3_versions', 'v1');
    const result = spawnSync('node', [
      'PPTMAKER_FRAMEWORK/scripts/generate_style_master.mjs',
      '--run-dir', missing,
      '--dry-run',
    ], { encoding: 'utf8', timeout: 10000 });
    expect(result.status).toBe(1);
    const envelope = JSON.parse(result.stderr.trim().split(/\r?\n/).at(-1));
    expect(envelope.diagnostic.category).toBe('structure');
    expect(envelope.diagnostic.source.path).toBe(missing);
    expect(envelope.diagnostic.next.invocation).toMatchObject({ program: 'node' });
  });
});

describe('style master deck_system injection', () => {
  let deck;
  let v1;
  let prevFetch;

  beforeEach(() => {
    deck = join(tmpdir(), `deck_sm_${Date.now()}`);
    initBundle(deck, null, 'keynote', 'dark-executive');
    v1 = join(deck, '3_versions', 'v1');
    const vs = join(deck, '2_backbone', 'visual-style');
    writeFileSync(join(vs, 'style-master-prompt.md'), 'STYLE PROMPT ONLY\n');
    writeFileSync(join(vs, 'deck_system.txt'), 'FORBIDDEN: clipart\n');
    prevFetch = globalThis.fetch;
    process.env.IMAGE2_API_KEY = 'k';
    process.env.IMAGE2_BASE_URL = 'https://api.example.test/v1';
  });

  afterEach(() => {
    globalThis.fetch = prevFetch;
    delete process.env.IMAGE2_API_KEY;
    delete process.env.IMAGE2_BASE_URL;
    rmSync(deck, { recursive: true, force: true });
  });

  it('loadDeckSystem reads file', () => {
    const text = loadDeckSystem(join(deck, '2_backbone', 'visual-style', 'deck_system.txt'));
    expect(text).toContain('FORBIDDEN');
  });

  it('dry-run succeeds with deck_system present', async () => {
    const code = await generateStyleMaster({ runDir: v1, dryRun: true });
    expect(code).toBe(0);
  });

  it('includes deck_system in prompt when generating', async () => {
    /** @type {string|null} */
    let sentPrompt = null;
    globalThis.fetch = mockImageApi((body) => {
      sentPrompt = body.prompt;
    });

    const code = await generateStyleMaster({
      runDir: v1,
      force: true,
      resolution: '1k',
    });
    expect(code).toBe(0);
    expect(sentPrompt).toContain('STYLE PROMPT ONLY');
    expect(sentPrompt).toContain('FORBIDDEN: clipart');
  });

  it('--no-deck-system skips injection', async () => {
    /** @type {string|null} */
    let sentPrompt = null;
    globalThis.fetch = mockImageApi((body) => {
      sentPrompt = body.prompt;
    });

    const code = await generateStyleMaster({
      runDir: v1,
      force: true,
      resolution: '1k',
      noDeckSystem: true,
    });
    expect(code).toBe(0);
    expect(sentPrompt).toContain('STYLE PROMPT ONLY');
    expect(sentPrompt).not.toContain('FORBIDDEN: clipart');
  });
});
