import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { spawnSync } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createCanvas } from '@napi-rs/canvas';
import { initLegacyBundle } from '../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs';
import { generateLegacyStyleMaster } from '../../PPTMAKER_FRAMEWORK/scripts/05-iteration/index.mjs';
import { loadDeckSystem } from '../../PPTMAKER_FRAMEWORK/scripts/02-visual-system/internal/deck_system.mjs';
import { sha256File } from '../../PPTMAKER_FRAMEWORK/scripts/shared/identity/byte_hash.mjs';
import {
  image2AuthorizationProfileFingerprint,
  readState,
  recordImage2ProviderAuthorization,
  writeState,
} from '../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs';

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
    const mod = await import('../../PPTMAKER_FRAMEWORK/scripts/05-iteration/index.mjs');
    expect(mod.generateLegacyStyleMaster).toBeTypeOf('function');
  });

  it('emits a structured source diagnostic for an invalid run bundle', () => {
    const missing = join(tmpdir(), `deck_missing_style_${Date.now()}`, '3_versions', 'v1');
    const result = spawnSync('node', [
      'PPTMAKER_FRAMEWORK/scripts/05-iteration/legacy-image2/generate_style_master.mjs',
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
    initLegacyBundle(deck, null, 'keynote', 'dark-executive');
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

  function authorizeStyleMaster({ resolution = '2k', noDeckSystem = false } = {}) {
    const state = readState(deck, { purpose: 'execute', heal: false });
    state.playbook = 'create-deck';
    state.execution_id = 'exec-style-master';
    state.execution_started_at = '2024-01-01T00:00:00.000Z';
    state.run_version = 'v1';
    for (const record of Object.values(state.nodes)) {
      if (record && typeof record === 'object' && !record.by_version) {
        record.execution_id = state.execution_id;
        record.run_version = state.run_version;
      }
    }
    writeState(deck, state);
    const promptPath = join(deck, '2_backbone', 'visual-style', 'style-master-prompt.md');
    const deckSystemPath = join(deck, '2_backbone', 'visual-style', 'deck_system.txt');
    recordImage2ProviderAuthorization(deck, {
      runVersion: 'v1',
      operation: 'style-master',
      scope: { role: 'style-master' },
      profileFingerprint: image2AuthorizationProfileFingerprint({
        operation: 'style-master',
        profile: {
          model: 'gpt-image-2',
          resolution,
          style_prompt_sha256: sha256File(promptPath),
          deck_system_sha256: noDeckSystem ? null : sha256File(deckSystemPath),
        },
      }),
      maxSubmissions: 1,
    });
  }

  it('loadDeckSystem reads file', () => {
    const text = loadDeckSystem(join(deck, '2_backbone', 'visual-style', 'deck_system.txt'));
    expect(text).toContain('FORBIDDEN');
  });

  it('dry-run succeeds with deck_system present', async () => {
    const code = await generateLegacyStyleMaster({ runDir: v1, dryRun: true });
    expect(code).toBe(0);
  });

  it('includes deck_system in prompt when generating', async () => {
    /** @type {string|null} */
    let sentPrompt = null;
    globalThis.fetch = mockImageApi((body) => {
      sentPrompt = body.prompt;
    });

    authorizeStyleMaster({ resolution: '1k' });
    const code = await generateLegacyStyleMaster({
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

    authorizeStyleMaster({ resolution: '1k', noDeckSystem: true });
    const code = await generateLegacyStyleMaster({
      runDir: v1,
      force: true,
      resolution: '1k',
      noDeckSystem: true,
    });
    expect(code).toBe(0);
    expect(sentPrompt).toContain('STYLE PROMPT ONLY');
    expect(sentPrompt).not.toContain('FORBIDDEN: clipart');
  });

  it('reuses an existing style master without Image2 transport', async () => {
    const stylePath = join(deck, '2_backbone', 'visual-style', 'style_master.jpg');
    writeFileSync(stylePath, Buffer.from(tinyPngB64(), 'base64'));
    delete process.env.IMAGE2_API_KEY;
    delete process.env.IMAGE2_BASE_URL;
    globalThis.fetch = vi.fn(async () => { throw new Error('no-op style master must not submit'); });

    const code = await generateLegacyStyleMaster({ runDir: v1, force: false });
    expect(code).toBe(0);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
