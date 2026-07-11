import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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
  let prevKey;
  let prevBase;

  beforeEach(() => {
    mkdirSync(ROOT, { recursive: true });
    prevFetch = globalThis.fetch;
    prevKey = process.env.OPENAI_API_KEY;
    prevBase = process.env.OPENAI_BASE_URL;
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.OPENAI_BASE_URL = 'https://api.example.test/v1';
    delete process.env.APIMART_API_KEY;
    delete process.env.APIMART_BASE_URL;
    delete process.env.APIMART_BASE_URLS;
    delete process.env.IMAGE2_API_KEY;
    delete process.env.IMAGE2_BASE_URL;
    delete process.env.IMAGE2_BASE_URLS;
  });

  afterEach(() => {
    globalThis.fetch = prevFetch;
    if (prevKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = prevKey;
    if (prevBase === undefined) delete process.env.OPENAI_BASE_URL;
    else process.env.OPENAI_BASE_URL = prevBase;
    delete process.env.IMAGE2_API_KEY;
    delete process.env.IMAGE2_BASE_URL;
    delete process.env.IMAGE2_BASE_URLS;
    rmSync(ROOT, { recursive: true, force: true });
  });

  it('bridges OPENAI_* credentials and resolves base URLs', async () => {
    const mod = await import('../PPTMAKER_FRAMEWORK/scripts/image_api_client.mjs');
    mod.bridgeCredentials();
    expect(process.env.APIMART_API_KEY).toBe('test-key');
    expect(mod.resolveBaseUrls()).toEqual(['https://api.example.test/v1']);
    expect(mod.resolveBaseUrls(['https://mirror.test/v1'])).toEqual(['https://mirror.test/v1']);
  });

  it('prefers IMAGE2_* over aliases and errors when base URL missing', async () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_BASE_URL;
    delete process.env.APIMART_API_KEY;
    delete process.env.APIMART_BASE_URL;
    delete process.env.APIMART_BASE_URLS;
    process.env.IMAGE2_API_KEY = 'img2-key';
    process.env.IMAGE2_BASE_URL = 'https://image2.test/v1';
    const mod = await import('../PPTMAKER_FRAMEWORK/scripts/image_api_client.mjs');
    expect(mod.resolveApiKey()).toBe('img2-key');
    expect(mod.resolveBaseUrls()).toEqual(['https://image2.test/v1']);
    delete process.env.IMAGE2_BASE_URL;
    delete process.env.IMAGE2_BASE_URLS;
    delete process.env.APIMART_BASE_URL;
    delete process.env.APIMART_BASE_URLS;
    delete process.env.OPENAI_BASE_URL;
    expect(() => mod.resolveBaseUrls()).toThrow(/IMAGE2_BASE_URL/);
    delete process.env.IMAGE2_API_KEY;
  });

  it('unwrapDataRecord reads array and object data envelopes', async () => {
    const { unwrapDataRecord } = await import('../PPTMAKER_FRAMEWORK/scripts/image_api_client.mjs');
    expect(unwrapDataRecord({ code: 200, data: [{ task_id: 'task_abc', status: 'submitted' }] }).task_id).toBe('task_abc');
    expect(unwrapDataRecord({ data: { task_id: 'task_obj' } }).task_id).toBe('task_obj');
    expect(unwrapDataRecord({ task_id: 'task_top' }).task_id).toBe('task_top');
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

    const { generateOneImage } = await import('../PPTMAKER_FRAMEWORK/scripts/image_api_client.mjs');
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

    const { generateOneImage } = await import('../PPTMAKER_FRAMEWORK/scripts/image_api_client.mjs');
    const outPath = join(ROOT, 'slide.png');
    const tracePath = join(ROOT, 'slide.apimart-task.json');
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
    const { generateOneImage } = await import('../PPTMAKER_FRAMEWORK/scripts/image_api_client.mjs');
    const result = await generateOneImage({
      prompt: 'x',
      outPath,
      force: false,
      baseUrls: ['https://api.example.test/v1'],
    });
    expect(result).toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});

describe('stage2_generate_images', () => {
  const dir = join(tmpdir(), `ppt-stage2-${process.pid}`);

  beforeEach(() => {
    mkdirSync(dir, { recursive: true });
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

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

    const { generateImages } = await import('../PPTMAKER_FRAMEWORK/scripts/stage2_generate_images.mjs');
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
    tinyPng(join(imgDir, '01_a.png'));
    tinyPng(join(imgDir, '02_b.png'));
    const prompts = join(dir, '_prompts.json');
    writeFileSync(
      prompts,
      JSON.stringify({
        slides: [
          { id: 'a', out: '01_a.png', prompt: 'a' },
          { id: 'b', out: '02_b.png', prompt: 'b' },
        ],
      }),
      'utf-8'
    );
    const out = join(dir, 'sheet.jpg');
    const { makeContactSheet } = await import('../PPTMAKER_FRAMEWORK/scripts/make_contact_sheet.mjs');
    const result = await makeContactSheet({
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
});
