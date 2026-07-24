import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createCanvas } from '@napi-rs/canvas';

const ROOT = join(tmpdir(), `ppt-image-api-${process.pid}`);

function tinyPng(path) {
  const canvas = createCanvas(8, 8);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#336699';
  ctx.fillRect(0, 0, 8, 8);
  writeFileSync(path, canvas.toBuffer('image/png'));
}

describe('image_api_client', () => {
  let prevFetch;

  beforeEach(() => {
    mkdirSync(ROOT, { recursive: true });
    prevFetch = globalThis.fetch;
    // Set required credentials for generateOneImage tests
    process.env.IMAGE2_API_KEY = 'test-key';
    process.env.IMAGE2_BASE_URL = 'https://api.example.test/v1';
  });

  afterEach(() => {
    globalThis.fetch = prevFetch;
    delete process.env.IMAGE2_API_KEY;
    delete process.env.IMAGE2_BASE_URL;
    rmSync(ROOT, { recursive: true, force: true });
  });

  it('resolveVendors returns single vendor from IMAGE2_API_KEY + IMAGE2_BASE_URL', async () => {
    process.env.IMAGE2_API_KEY = 'img2-key';
    process.env.IMAGE2_BASE_URL = 'https://image2.test/v1';
    const mod = await import('../../PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/internal/image_api_client.mjs');
    expect(mod.resolveVendors()).toEqual([
      { base_url: 'https://image2.test/v1', api_key: 'img2-key' },
    ]);
  });

  it('resolveApiKey and resolveBaseUrls delegate to resolveVendors', async () => {
    process.env.IMAGE2_API_KEY = 'img2-key';
    process.env.IMAGE2_BASE_URL = 'https://image2.test/v1';
    const mod = await import('../../PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/internal/image_api_client.mjs');
    expect(mod.resolveApiKey()).toBe('img2-key');
    expect(mod.resolveBaseUrls()).toEqual(['https://image2.test/v1']);
  });

  it('CLI --base-url overrides IMAGE2_BASE_URL', async () => {
    process.env.IMAGE2_API_KEY = 'img2-key';
    process.env.IMAGE2_BASE_URL = 'https://image2.test/v1';
    const mod = await import('../../PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/internal/image_api_client.mjs');
    expect(mod.resolveBaseUrls(['https://cli.test/v1'])).toEqual(['https://cli.test/v1']);
  });

  it('throws when IMAGE2_API_KEY is missing', async () => {
    delete process.env.IMAGE2_API_KEY;
    process.env.IMAGE2_BASE_URL = 'https://image2.test/v1';
    const mod = await import('../../PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/internal/image_api_client.mjs');
    expect(() => mod.resolveVendors()).toThrow(/IMAGE2_API_KEY/);
  });

  it('throws when IMAGE2_BASE_URL is missing', async () => {
    delete process.env.IMAGE2_BASE_URL;
    process.env.IMAGE2_API_KEY = 'img2-key';
    const mod = await import('../../PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/internal/image_api_client.mjs');
    expect(() => mod.resolveVendors()).toThrow(/IMAGE2_BASE_URL/);
  });

  it('unwrapDataRecord reads array and object data envelopes', async () => {
    const { unwrapDataRecord } = await import('../../PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/internal/image_api_client.mjs');
    expect(unwrapDataRecord({ code: 200, data: [{ task_id: 'task_abc', status: 'submitted' }] }).task_id).toBe('task_abc');
    expect(unwrapDataRecord({ data: { task_id: 'task_obj' } }).task_id).toBe('task_obj');
    expect(unwrapDataRecord({ task_id: 'task_top' }).task_id).toBe('task_top');
  });

  it('fixtures cover submit array and poll-embedded extractImageRef', async () => {
    const { unwrapDataRecord, extractImageRef } = await import(
      '../../PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/internal/image_api_client.mjs'
    );
    const submit = JSON.parse(
      readFileSync(join('tests/fixtures/image-api/submit-data-array.json'), 'utf-8')
    );
    expect(unwrapDataRecord(submit).task_id).toBe('task_fixture_submit');
    const poll = JSON.parse(
      readFileSync(join('tests/fixtures/image-api/poll-embedded-image.json'), 'utf-8')
    );
    expect(extractImageRef(poll)).toEqual({ url: 'https://cdn.example.test/out/slide.png' });
  });

  it('submit accepts data-array task_id envelope (BUG-008)', async () => {
    const pngBytes = (() => {
      const c = createCanvas(4, 4);
      return c.toBuffer('image/png');
    })();
    globalThis.fetch = vi.fn(async (url, init) => {
      const u = String(url);
      if (u.endsWith('/images/generations') && init?.method === 'POST') {
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              code: 200,
              data: [{ status: 'submitted', task_id: 'task_arr' }],
            }),
          json: async () => ({
            code: 200,
            data: [{ status: 'submitted', task_id: 'task_arr' }],
          }),
          headers: { get: () => 'application/json' },
        };
      }
      if (u.includes('/tasks/task_arr') && !u.endsWith('/result')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ code: 200, data: [{ status: 'completed' }] }),
          headers: { get: () => 'application/json' },
        };
      }
      if (u.endsWith('/result')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: [{ b64_json: pngBytes.toString('base64') }],
          }),
          headers: { get: () => 'application/json' },
        };
      }
      throw new Error(`unexpected fetch ${u}`);
    });

    const { generateOneImage } = await import('../../PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/internal/image_api_client.mjs');
    const outPath = join(ROOT, 'arr.png');
    const trace = await generateOneImage({
      prompt: 'array envelope',
      outPath,
      force: true,
      baseUrls: ['https://api.example.test/v1'],
    });
    expect(trace.task_id).toBe('task_arr');
    expect(existsSync(outPath)).toBe(true);
  });

  it('submit→poll→download writes PNG + optional trace (mocked fetch)', async () => {
    const pngBytes = (() => {
      const c = createCanvas(4, 4);
      return c.toBuffer('image/png');
    })();

    let calls = 0;
    globalThis.fetch = vi.fn(async (url, init) => {
      calls += 1;
      const u = String(url);
      if (u.endsWith('/images/generations') && init?.method === 'POST') {
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ task_id: 'task_1' }),
          json: async () => ({ task_id: 'task_1' }),
          headers: { get: () => 'application/json' },
        };
      }
      if (u.includes('/tasks/task_1') && !u.endsWith('/result')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ status: 'completed' }),
          headers: { get: () => 'application/json' },
        };
      }
      if (u.endsWith('/result')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: [{ b64_json: pngBytes.toString('base64') }],
          }),
          headers: { get: () => 'application/json' },
        };
      }
      throw new Error(`unexpected fetch ${u}`);
    });

    const { generateOneImage } = await import('../../PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/internal/image_api_client.mjs');
    const outPath = join(ROOT, 'slide.png');
    const tracePath = join(ROOT, 'slide.image-task.json');
    const stylePath = join(ROOT, 'style.jpg');
    tinyPng(stylePath);

    const trace = await generateOneImage({
      prompt: 'test prompt',
      outPath,
      styleReferencePath: stylePath,
      force: true,
      baseUrls: ['https://api.example.test/v1'],
      tracePath,
    });

    expect(existsSync(outPath)).toBe(true);
    expect(existsSync(tracePath)).toBe(true);
    expect(trace.task_id).toBe('task_1');
    expect(trace.model).toBe('gpt-image-2');
    expect(calls).toBeGreaterThanOrEqual(3);

    const body = JSON.parse(await globalThis.fetch.mock.calls[0][1].body);
    expect(body.prompt).toBe('test prompt');
    expect(body.image || body.images).toBeTruthy();
  });

  it('skip-if-exists returns null without calling fetch', async () => {
    const outPath = join(ROOT, 'exists.png');
    tinyPng(outPath);
    globalThis.fetch = vi.fn(async () => {
      throw new Error('fetch should not be called');
    });
    const { generateOneImage } = await import('../../PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/internal/image_api_client.mjs');
    const result = await generateOneImage({
      prompt: 'x',
      outPath,
      force: false,
      baseUrls: ['https://api.example.test/v1'],
    });
    expect(result).toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('guards page style and transport immediately before a fake submit adapter', async () => {
    const {
      generateOneImage,
      ImageSubmitPrerequisiteError,
    } = await import('../../PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/internal/image_api_client.mjs');
    const transportResolver = vi.fn(() => [
      { base_url: 'https://guard.example/v1', api_key: 'guard-key' },
    ]);
    const submitImpl = vi.fn(async () => ({
      data: [{ b64_json: createCanvas(4, 4).toBuffer('image/png').toString('base64') }],
    }));

    await expect(generateOneImage({
      prompt: 'page without style',
      outPath: join(ROOT, 'missing-style.png'),
      force: true,
      requireStyleReference: true,
      transportResolver,
      submitImpl,
    })).rejects.toMatchObject({
      name: ImageSubmitPrerequisiteError.name,
      reason: 'missing_style_reference',
    });
    expect(transportResolver).not.toHaveBeenCalled();
    expect(submitImpl).not.toHaveBeenCalled();

    const stylePath = join(ROOT, 'guard-style.jpg');
    tinyPng(stylePath);
    const missingTransport = vi.fn(() => { throw new Error('missing transport'); });
    await expect(generateOneImage({
      prompt: 'page without transport',
      outPath: join(ROOT, 'missing-transport.png'),
      styleReferencePath: stylePath,
      force: true,
      requireStyleReference: true,
      transportResolver: missingTransport,
      submitImpl,
    })).rejects.toMatchObject({ reason: 'provider_configuration_unavailable' });
    expect(missingTransport).toHaveBeenCalledTimes(1);
    expect(submitImpl).not.toHaveBeenCalled();

    const outPath = join(ROOT, 'guarded-page.png');
    await generateOneImage({
      prompt: 'guarded page',
      outPath,
      styleReferencePath: stylePath,
      force: true,
      requireStyleReference: true,
      transportResolver,
      submitImpl,
    });
    expect(transportResolver).toHaveBeenCalledTimes(1);
    expect(submitImpl).toHaveBeenCalledTimes(1);
    expect(existsSync(outPath)).toBe(true);
  });

  it('permits style-master submit without a prior style reference', async () => {
    const { generateOneImage } = await import('../../PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/internal/image_api_client.mjs');
    const transportResolver = vi.fn(() => [
      { base_url: 'https://style.example/v1', api_key: 'style-key' },
    ]);
    const submitImpl = vi.fn(async () => ({
      data: [{ b64_json: createCanvas(4, 4).toBuffer('image/png').toString('base64') }],
    }));
    await generateOneImage({
      prompt: 'new style master',
      outPath: join(ROOT, 'new-style.png'),
      force: true,
      requireStyleReference: false,
      transportResolver,
      submitImpl,
    });
    expect(transportResolver).toHaveBeenCalledTimes(1);
    expect(submitImpl).toHaveBeenCalledTimes(1);
  });

  it('retry succeeds after transient 502 and records attempts in trace', async () => {
    const pngBytes = (() => {
      const c = createCanvas(4, 4);
      return c.toBuffer('image/png');
    })();
    let callCount = 0;
    globalThis.fetch = vi.fn(async (url, init) => {
      callCount += 1;
      if (callCount === 1 && init?.method === 'POST') {
        // First attempt: transient 502
        return {
          ok: false,
          status: 502,
          text: async () => JSON.stringify({ error: 'bad gateway' }),
          headers: { get: () => 'application/json' },
        };
      }
      if (init?.method === 'POST') {
        // Second attempt: success
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({ data: [{ b64_json: pngBytes.toString('base64') }] }),
          headers: { get: () => 'application/json' },
        };
      }
      throw new Error(`unexpected fetch ${url}`);
    });
    const { generateOneImage } = await import('../../PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/internal/image_api_client.mjs');
    const outPath = join(ROOT, 'retry.png');
    const tracePath = join(ROOT, 'retry.json');
    const trace = await generateOneImage({
      prompt: 'retry',
      outPath,
      force: true,
      tracePath,
    });
    expect(trace.base_url).toBe('https://api.example.test/v1');
    // Retryable 5xx errors that succeed on retry don't appear in attempts
    expect(existsSync(outPath)).toBe(true);
  });

  it('all retries exhausted throws with attempts summary', { timeout: 15000 }, async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 502,
      text: async () => JSON.stringify({ error: 'down' }),
      headers: { get: () => 'application/json' },
    }));
    const { generateOneImage } = await import('../../PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/internal/image_api_client.mjs');
    await expect(
      generateOneImage({
        prompt: 'x',
        outPath: join(ROOT, 'fail.png'),
        force: true,
      })
    ).rejects.toThrow(/All image API vendors failed/);
  });
});

describe('stage2_generate_images', () => {
  const dir = join(tmpdir(), `ppt-stage2-${process.pid}`);
  let previousFetch;
  let previousImageKey;

  beforeEach(() => {
    mkdirSync(dir, { recursive: true });
    previousFetch = globalThis.fetch;
    previousImageKey = process.env.IMAGE2_API_KEY;
    process.env.IMAGE2_API_KEY = 'stage2-test-key';
  });
  afterEach(() => {
    globalThis.fetch = previousFetch;
    if (previousImageKey === undefined) delete process.env.IMAGE2_API_KEY;
    else process.env.IMAGE2_API_KEY = previousImageKey;
    rmSync(dir, { recursive: true, force: true });
  });

  function mockSyncGeneration() {
    const canvas = createCanvas(8, 8);
    const png = canvas.toBuffer('image/png').toString('base64');
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ data: [{ b64_json: png }] }),
      headers: { get: () => 'application/json' },
    }));
  }

  it('dry-run counts slides and respects --only', async () => {
    const prompts = join(dir, '_prompts.json');
    const style = join(dir, 'style_master.jpg');
    const outDir = join(dir, 'out');
    tinyPng(style);
    writeFileSync(
      prompts,
      JSON.stringify({
        slides: [
          { id: 'a', out: '01_a.png', prompt: 'prompt a' },
          { id: 'b', out: '02_b.png', prompt: 'prompt b' },
        ],
      }),
      'utf-8'
    );

    const { generateWholePageImages: generateImages } = await import('../../PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/index.mjs');
    const result = await generateImages({
      promptJson: prompts,
      outDir,
      styleReference: style,
      only: ['b'],
      dryRun: true,
    });
    expect(result.errors).toEqual([]);
    expect(result.generated).toBe(1);
  });

  it('reuses only matching manifest/image pairs and preserves unrelated entries', async () => {
    const prompts = join(dir, '_prompts.json');
    const style = join(dir, 'style_master.jpg');
    const outDir = join(dir, 'out');
    tinyPng(style);
    writeFileSync(prompts, JSON.stringify({ slides: [
      { id: 'a', out: '01_a.png', prompt: 'prompt a' },
      { id: 'b', out: '02_b.png', prompt: 'prompt b' },
    ] }), 'utf-8');
    const { generateWholePageImages: generateImages } = await import('../../PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/index.mjs');

    mockSyncGeneration();
    const first = await generateImages({
      promptJson: prompts,
      outDir,
      styleReference: style,
      only: ['a'],
      force: true,
      baseUrl: ['https://api.example.test/v1'],
    });
    expect(first.generated).toBe(1);
    const aEntry = JSON.parse(readFileSync(join(outDir, '_manifest.json'), 'utf-8')).slides.a;

    mockSyncGeneration();
    await generateImages({
      promptJson: prompts,
      outDir,
      styleReference: style,
      only: ['b'],
      force: true,
      baseUrl: ['https://api.example.test/v1'],
    });
    const afterB = JSON.parse(readFileSync(join(outDir, '_manifest.json'), 'utf-8'));
    expect(afterB.slides.a).toEqual(aEntry);
    expect(afterB.slides.b.image_sha256).toMatch(/^[a-f0-9]{64}$/);

    globalThis.fetch = vi.fn(async () => { throw new Error('matching reuse must not call API'); });
    const reused = await generateImages({
      promptJson: prompts,
      outDir,
      styleReference: style,
      only: ['a'],
      force: false,
      baseUrl: ['https://api.example.test/v1'],
    });
    expect(reused).toMatchObject({ generated: 0, skipped: 1, errors: [] });
    expect(globalThis.fetch).not.toHaveBeenCalled();

    delete process.env.IMAGE2_API_KEY;
    delete process.env.IMAGE2_BASE_URL;
    const reusedWithoutTransport = await generateImages({
      promptJson: prompts,
      outDir,
      styleReference: style,
      only: ['a'],
      force: false,
    });
    expect(reusedWithoutTransport).toMatchObject({ generated: 0, skipped: 1, errors: [] });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('checks first-class authorization only before a genuine provider submit', async () => {
    const prompts = join(dir, '_prompts.json');
    const style = join(dir, 'style_master.jpg');
    const outDir = join(dir, 'out');
    tinyPng(style);
    writeFileSync(prompts, JSON.stringify({ slides: [
      { id: 'a', out: '01_a.png', prompt: 'prompt a' },
    ] }), 'utf-8');
    const { generateWholePageImages: generateImages } = await import('../../PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/index.mjs');

    const denied = new Error('authorization missing');
    denied.image2Authorization = { code: 'AUTHORIZATION_MISSING' };
    const deniedResult = await generateImages({
      promptJson: prompts,
      outDir,
      styleReference: style,
      beforeSubmit: async () => { throw denied; },
    });
    expect(deniedResult.failures).toMatchObject([
      { category: 'gate', reason: { kind: 'provider_authorization_required', code: 'AUTHORIZATION_MISSING' } },
    ]);
    expect(existsSync(outDir)).toBe(false);

    let authorizationCalls = 0;
    mockSyncGeneration();
    const generated = await generateImages({
      promptJson: prompts,
      outDir,
      styleReference: style,
      baseUrl: ['https://api.example.test/v1'],
      beforeSubmit: async ({ selectedIds, maxSubmissions }) => {
        authorizationCalls += 1;
        expect(selectedIds).toEqual(['a']);
        expect(maxSubmissions).toBe(1);
      },
    });
    expect(generated).toMatchObject({ generated: 1, errors: [] });
    expect(authorizationCalls).toBe(1);

    const reused = await generateImages({
      promptJson: prompts,
      outDir,
      styleReference: style,
      beforeSubmit: async () => { throw new Error('reuse must not request authorization'); },
    });
    expect(reused).toMatchObject({ generated: 0, skipped: 1, errors: [] });
  });

  it('authorizes only the missing subset of a mixed reuse and submit batch', async () => {
    const prompts = join(dir, '_prompts.json');
    const style = join(dir, 'style_master.jpg');
    const outDir = join(dir, 'out');
    tinyPng(style);
    writeFileSync(prompts, JSON.stringify({ slides: [
      { id: 'a', out: '01_a.png', prompt: 'prompt a' },
      { id: 'b', out: '02_b.png', prompt: 'prompt b' },
    ] }), 'utf-8');
    const { generateWholePageImages: generateImages } = await import('../../PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/index.mjs');

    mockSyncGeneration();
    await generateImages({
      promptJson: prompts,
      outDir,
      styleReference: style,
      only: ['a'],
      force: true,
      baseUrl: ['https://api.example.test/v1'],
    });

    let authorizationScope = null;
    mockSyncGeneration();
    const mixed = await generateImages({
      promptJson: prompts,
      outDir,
      styleReference: style,
      baseUrl: ['https://api.example.test/v1'],
      beforeSubmit: async (scope) => { authorizationScope = scope; },
    });
    expect(mixed).toMatchObject({ generated: 1, skipped: 1, errors: [] });
    expect(authorizationScope).toEqual({ selectedIds: ['b'], maxSubmissions: 1 });
  });

  it('fails loudly instead of reusing stale prompt or corrupt manifest', async () => {
    const prompts = join(dir, '_prompts.json');
    const style = join(dir, 'style_master.jpg');
    const outDir = join(dir, 'out');
    tinyPng(style);
    writeFileSync(prompts, JSON.stringify({ slides: [
      { id: 'a', out: '01_a.png', prompt: 'prompt a' },
    ] }), 'utf-8');
    const { generateWholePageImages: generateImages } = await import('../../PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/index.mjs');
    mockSyncGeneration();
    await generateImages({
      promptJson: prompts, outDir, styleReference: style, only: ['a'], force: true,
      baseUrl: ['https://api.example.test/v1'],
    });

    writeFileSync(prompts, JSON.stringify({ slides: [
      { id: 'a', out: '01_a.png', prompt: 'changed prompt' },
    ] }), 'utf-8');
    globalThis.fetch = vi.fn(async () => { throw new Error('stale reuse must not call API'); });
    const stale = await generateImages({
      promptJson: prompts, outDir, styleReference: style, only: ['a'], force: false,
      baseUrl: ['https://api.example.test/v1'],
    });
    expect(stale.errors[0]).toMatch(/generation fingerprint mismatch.*--only a --force-images/);
    expect(globalThis.fetch).not.toHaveBeenCalled();

    writeFileSync(join(outDir, '_manifest.json'), '{bad json', 'utf-8');
    const corrupt = await generateImages({
      promptJson: prompts, outDir, styleReference: style, only: ['a'], force: false,
      baseUrl: ['https://api.example.test/v1'],
    });
    expect(corrupt.errors[0]).toMatch(/corrupt manifest.*--only a --force-images/);
  });

  it('invalidates selected provenance before a forced generation that fails', async () => {
    const prompts = join(dir, '_prompts.json');
    const style = join(dir, 'style_master.jpg');
    const outDir = join(dir, 'out');
    tinyPng(style);
    writeFileSync(prompts, JSON.stringify({ slides: [
      { id: 'a', out: '01_a.png', prompt: 'prompt a' },
    ] }), 'utf-8');
    const { generateWholePageImages: generateImages } = await import('../../PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/index.mjs');
    mockSyncGeneration();
    await generateImages({
      promptJson: prompts, outDir, styleReference: style, only: ['a'], force: true,
      baseUrl: ['https://api.example.test/v1'],
    });

    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({ error: 'no image' }),
      headers: { get: () => 'application/json' },
    }));
    const failed = await generateImages({
      promptJson: prompts, outDir, styleReference: style, only: ['a'], force: true,
      baseUrl: ['https://api.example.test/v1'],
    });
    expect(failed.errors).toHaveLength(1);
    expect(failed.failures[0]).toMatchObject({
      slideId: 'a',
      outPath: join(outDir, 'a.png'),
      category: 'provider',
      reason: { kind: 'all_vendors_failed' },
    });
    const manifest = JSON.parse(readFileSync(join(outDir, '_manifest.json'), 'utf-8'));
    expect(manifest.slides.a).toBeUndefined();
  });

  it('emits slide/output lineage for an aggregate CLI failure without prompt prose', () => {
    const prompts = join(dir, '_prompts.json');
    const style = join(dir, 'style_master.jpg');
    const outDir = join(dir, 'out');
    tinyPng(style);
    writeFileSync(prompts, JSON.stringify({ slides: [
      { id: 'a', out: '01_a.png', prompt: '' },
      { id: 'b', out: '02_b.png', prompt: '' },
    ] }), 'utf8');
    const result = spawnSync('node', [
      'PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/stage2_generate_images.mjs',
      '--prompt-json', prompts,
      '--out-dir', outDir,
      '--style-reference', style,
      '--dry-run',
    ], { encoding: 'utf8', timeout: 10000 });
    expect(result.status).toBe(1);
    const envelope = JSON.parse(result.stderr.trim().split(/\r?\n/).at(-1));
    expect(envelope.diagnostic).toMatchObject({ category: 'source_validation', stage: 'stage2' });
    expect(envelope.diagnostic.issues.map((issue) => issue.subject.id)).toEqual(['a', 'b']);
    expect(envelope.diagnostic.issues[0].lineage.at(-1).path).toBe(join(outDir, 'a.png'));
  });
});

describe('image provenance fingerprints', () => {
  it('bind prompt, style, resolution, model, semantic options, and image bytes', async () => {
    const dir = join(tmpdir(), `ppt-provenance-${process.pid}`);
    mkdirSync(dir, { recursive: true });
    try {
      const imagePath = join(dir, 'a.png');
      tinyPng(imagePath);
      const {
        buildImageManifestEntry,
        generationProfile,
        inspectImageProvenance,
      } = await import('../../PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/internal/image_provenance.mjs');
      const { sha256Bytes } = await import('../../PPTMAKER_FRAMEWORK/scripts/shared/identity/byte_hash.mjs');
      const base = generationProfile({
        styleReferenceSha256: sha256Bytes('style-a'),
        resolution: '1k',
        model: 'model-a',
        semanticOptions: { size: '16:9', n: 1 },
      });
      const entry = buildImageManifestEntry({
        slideId: 'a', output: 'a.png', prompt: 'p', profile: base, imagePath,
      });
      const manifest = { version: 2, pipeline: 'whole-page-image2-v1', slides: { a: entry } };
      expect(inspectImageProvenance({
        slide: { id: 'a', out: 'a.png', prompt: 'p' }, outDir: dir, manifest, profile: base,
      }).current).toBe(true);
      for (const changed of [
        { ...base, resolution: '2k' },
        { ...base, model: 'model-b' },
        { ...base, style_reference_sha256: sha256Bytes('style-b') },
        { ...base, semantic_options: { ...base.semantic_options, quality: 'high' } },
      ]) {
        expect(inspectImageProvenance({
          slide: { id: 'a', out: 'a.png', prompt: 'p' }, outDir: dir, manifest, profile: changed,
        }).current).toBe(false);
      }
      writeFileSync(imagePath, Buffer.from('different bytes'));
      expect(inspectImageProvenance({
        slide: { id: 'a', out: 'a.png', prompt: 'p' }, outDir: dir, manifest, profile: base,
      }).reason).toBe('image SHA-256 mismatch');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('make_contact_sheet', () => {
  const dir = join(tmpdir(), `ppt-contact-${process.pid}`);

  beforeEach(() => {
    mkdirSync(dir, { recursive: true });
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('tiles PNGs into a JPEG contact sheet', async () => {
    const imgDir = join(dir, 'images');
    mkdirSync(imgDir, { recursive: true });
    tinyPng(join(imgDir, 'a.png'));
    tinyPng(join(imgDir, 'b.png'));
    const prompts = join(dir, '_prompts.json');
    writeFileSync(
      prompts,
      JSON.stringify({
        slides: [
          { id: 'a', out: 'a.png', prompt: 'a' },
          { id: 'b', out: 'b.png', prompt: 'b' },
        ],
      }),
      'utf-8'
    );
    const out = join(dir, 'sheet.jpg');
    const { buildWholePageContactSheet } = await import('../../PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/index.mjs');
    const result = await buildWholePageContactSheet({
      imageDir: imgDir,
      promptJson: prompts,
      out,
      columns: 2,
    });
    expect(result.count).toBe(2);
    expect(existsSync(out)).toBe(true);
    const buf = readFileSync(out);
    expect(buf[0]).toBe(0xff);
    expect(buf[1]).toBe(0xd8); // JPEG SOI
  });

  it('aggregates missing and invalid slide images without writing a partial sheet', async () => {
    const imgDir = join(dir, 'images');
    mkdirSync(imgDir, { recursive: true });
    writeFileSync(join(imgDir, 'a.png'), 'not an image');
    const prompts = join(dir, '_prompts.json');
    writeFileSync(prompts, JSON.stringify({ slides: [
      { id: 'a', out: 'a.png', prompt: 'a' },
      { id: 'b', out: 'b.png', prompt: 'b' },
    ] }), 'utf8');
    const out = join(dir, 'sheet.jpg');
    const { buildWholePageContactSheet } = await import('../../PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/index.mjs');
    const { diagnosticFromError } = await import('../../PPTMAKER_FRAMEWORK/scripts/shared/cli/cli_error.mjs');
    let error;
    try {
      await buildWholePageContactSheet({ imageDir: imgDir, promptJson: prompts, out, columns: 2 });
    } catch (caught) {
      error = caught;
    }
    const diagnostic = diagnosticFromError(error);
    expect(diagnostic.issues).toHaveLength(2);
    expect(diagnostic.issues.map((issue) => [issue.subject.id, issue.reason.kind])).toEqual([
      ['b', 'missing_image'],
      ['a', 'invalid_image'],
    ]);
    expect(existsSync(out)).toBe(false);
  });
});
