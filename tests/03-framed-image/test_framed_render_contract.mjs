import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';

import { createCanvas } from '@napi-rs/canvas';

import {
  createFramedHeaderOverlayContractForTesting,
  describeFramedHeaderOverlay,
} from '../../ppt_maker_harness/scripts/03-framed-image/internal/framed_render_contract.mjs';
import { captureHtmlPngBatch } from '../../ppt_maker_harness/scripts/03-framed-image/internal/capture_runtime.mjs';
import { FRAMED_HEADER_OVERLAY_STANDARD_V1 } from '../../ppt_maker_harness/scripts/03-framed-image/internal/header_overlay.mjs';
import {
  discoverRuntimePackages,
  inspectHtmlRuntime,
  launchPinnedChromium,
} from '../../ppt_maker_harness/scripts/00-setup/index.mjs';

const localHeader = Object.freeze({
  kicker: 'Context',
  title: 'Header overlay contract',
  subtitle: 'Three deterministic local fields',
});

function headerInput(local_header = localHeader) {
  return { frame_preset: 'standard-v1', local_header };
}

function verifiedRaw(color) {
  const canvas = createCanvas(2048, 1136);
  const context = canvas.getContext('2d');
  context.fillStyle = color;
  context.fillRect(0, 0, 2048, 1136);
  const bytes = canvas.toBuffer('image/png');
  return Object.freeze({
    bytes,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  });
}

async function pinnedRuntime() {
  const packages = await discoverRuntimePackages();
  const runtime = await inspectHtmlRuntime({
    playwrightRoot: packages.playwright?.root,
    playwrightVersion: packages.playwright?.version,
  });
  expect(runtime.ok, runtime.error).toBe(true);
  return runtime;
}

async function privatePageSpec({ slideId = 'DeckGo', local_header = localHeader, withRaw = false } = {}) {
  let capturedPages = null;
  const contract = createFramedHeaderOverlayContractForTesting({
    resolveRuntime: async () => ({ ok: true }),
    captureBatch: async ({ pages }) => {
      capturedPages = pages;
      return { ok: true, pages: pages.map((page) => ({ id: page.id, bytes: Buffer.from('test') })) };
    },
  });
  const page = { slide_id: slideId, ...headerInput(local_header) };
  if (withRaw) {
    await contract.composePages([{ ...page, verified_raw: verifiedRaw('#18324a') }]);
  } else {
    await contract.verifyHeaderOverlays([page]);
  }
  return structuredClone(capturedPages[0]);
}

async function capturePrivatePage(page, options = {}) {
  return captureHtmlPngBatch({
    runtimeEvidence: await pinnedRuntime(),
    pages: [page],
    ...options,
  });
}

function hangingBrowserTracker() {
  const tracker = { browser_closes: 0, context_closes: 0 };
  const page = {
    setContent: async () => new Promise(() => {}),
    close: async () => {},
  };
  const context = {
    route: async () => {},
    on: () => {},
    addInitScript: async () => {},
    newPage: async () => page,
    close: async () => { tracker.context_closes += 1; },
  };
  return {
    tracker,
    launch: async () => ({
      newContext: async () => context,
      close: async () => { tracker.browser_closes += 1; },
    }),
  };
}

describe('Framed header-overlay contract', () => {
  it('derives a transparent three-field overlay and protected geometry from one normalized preset', async () => {
    const overlay = describeFramedHeaderOverlay({ slide_id: 'DeckGo', ...headerInput() });

    expect(overlay).toMatchObject({
      schema: 'pptmaker-framed-header-overlay-contract-v1',
      slide_id: 'DeckGo',
      header_overlay: { preset: 'standard-v1', ...localHeader },
      layout: {
        canvas: FRAMED_HEADER_OVERLAY_STANDARD_V1.canvas,
        theme: FRAMED_HEADER_OVERLAY_STANDARD_V1.theme,
        protected_geometry: FRAMED_HEADER_OVERLAY_STANDARD_V1.protected_geometry,
      },
      render_profile: { render_profile_digest: expect.any(String) },
    });
    expect(overlay.layout.fields).toEqual([
      { id: 'kicker', text: localHeader.kicker, ...FRAMED_HEADER_OVERLAY_STANDARD_V1.fields.kicker },
      { id: 'title', text: localHeader.title, ...FRAMED_HEADER_OVERLAY_STANDARD_V1.fields.title },
      { id: 'subtitle', text: localHeader.subtitle, ...FRAMED_HEADER_OVERLAY_STANDARD_V1.fields.subtitle },
    ]);
    expect(overlay.layout).not.toHaveProperty('panels');

    let capturedPages = null;
    const contract = createFramedHeaderOverlayContractForTesting({
      resolveRuntime: async () => ({ ok: true }),
      captureBatch: async ({ pages }) => {
        capturedPages = pages;
        return { ok: true, pages: pages.map((page) => ({ id: page.id })) };
      },
    });
    const proof = await contract.verifyHeaderOverlays([{ slide_id: 'DeckGo', ...headerInput() }]);

    expect(proof).toMatchObject({
      render_profile_digest: overlay.render_profile.render_profile_digest,
      pages: [{ slide_id: 'DeckGo', render_profile_digest: overlay.render_profile.render_profile_digest }],
    });
    expect(capturedPages).toHaveLength(1);
    expect(capturedPages[0]).toMatchObject({
      id: 'DeckGo',
      expectedLeafMarkers: ['kicker', 'title', 'subtitle'],
      layout: {
        protected_geometry: FRAMED_HEADER_OVERLAY_STANDARD_V1.protected_geometry,
        overlay: { transparent: true, requires_full_canvas_provider_page: false },
      },
    });
    expect(capturedPages[0].html).toContain('data-pm-overlay="transparent-header"');
    expect(capturedPages[0].html).toContain('background:transparent;background-image:none');
    expect(capturedPages[0].html).not.toContain('data-pm-panel');
    expect(capturedPages[0].html).not.toContain('object-fit:cover');
  });

  it('rejects callouts, body, and arbitrary local-rendering fields before browser work', async () => {
    for (const local_header of [
      { ...localHeader, callout: 'This must be provider-rendered' },
      { ...localHeader, body: 'This must be provider-rendered' },
    ]) {
      expect(() => describeFramedHeaderOverlay({ slide_id: 'DeckGo', ...headerInput(local_header) }))
        .toThrow(/local_header accepts only kicker, title, subtitle/);
    }
    const contract = createFramedHeaderOverlayContractForTesting({
      resolveRuntime: async () => { throw new Error('browser must not start'); },
    });
    await expect(contract.verifyHeaderOverlays([{
      slide_id: 'DeckGo',
      frame_preset: 'standard-v1',
      local_header: { ...localHeader, callout: 'blocked' },
    }])).rejects.toMatchObject({ code: 'framed_header_overlay_input_invalid' });
  });

  it('proves an ordered finite batch under one pinned browser process', async () => {
    let launches = 0;
    const contract = createFramedHeaderOverlayContractForTesting({
      resolveRuntime: async () => pinnedRuntime(),
      captureBatch: (input) => captureHtmlPngBatch({
        ...input,
        launch: async (...args) => {
          launches += 1;
          return launchPinnedChromium(...args);
        },
      }),
    });

    const proof = await contract.verifyHeaderOverlays([
      { slide_id: 'DeckGo', ...headerInput({ kicker: null, title: 'Verified header', subtitle: null }) },
      { slide_id: 'EastWest', ...headerInput({ kicker: null, title: '\u5df2\u68c0\u9a8c\u7684\u4e2d\u6587\u6807\u9898', subtitle: null }) },
      { slide_id: 'MixedNow', ...headerInput({ kicker: null, title: 'Verified mixed \u4e2d\u6587 title', subtitle: null }) },
    ]);

    expect(launches).toBe(1);
    expect(proof.pages.map((page) => page.slide_id)).toEqual(['DeckGo', 'EastWest', 'MixedNow']);
    for (const page of proof.pages) {
      expect(page.capture).toMatchObject({
        png: { width: 2000, height: 1125, sha256: expect.any(String) },
        layout: { slide: { width: 1000, height: 562.5 } },
        network: { serviceWorkers: 'blocked' },
      });
      expect(page.capture.layout.markers).toEqual(page.layout.fields.map((field) => field.id));
      expect(Object.keys(page.capture.fonts)).toEqual(page.layout.fields.map((field) => field.id));
    }
  }, 20_000);

  it('rejects the known wide-token regression and text that exceeds the line budget', async () => {
    const contract = createFramedHeaderOverlayContractForTesting({
      resolveRuntime: pinnedRuntime,
      captureBatch: captureHtmlPngBatch,
    });
    for (const [slideId, title] of [
      ['WideW', 'W'.repeat(28)],
      ['ManyLines', 'A precise phrase that repeats enough times to exceed the two line title limit under the normalized layout and must stop before final output is captured'],
    ]) {
      await expect(contract.verifyHeaderOverlays([{
        slide_id: slideId,
        ...headerInput({ kicker: null, title, subtitle: null }),
      }])).rejects.toMatchObject({
        code: 'framed_text_fit_failed',
        message: expect.stringContaining('scroll overflow'),
      });
    }
  }, 20_000);

  it('fails closed for opaque-overlay, crop, font, and private-capture invariant violations', async () => {
    const failures = [
      {
        name: 'opaque overlay',
        page: () => privatePageSpec(),
        mutate: (page) => {
          page.html = page.html.replace('background:transparent;background-image:none', 'background:rgba(0,0,0,.8);background-image:none');
        },
        error: 'header overlay must remain transparent',
      },
      {
        name: 'opaque panel',
        page: () => privatePageSpec(),
        mutate: (page) => {
          page.html = page.html.replace('</section></main>', '<section data-pm-panel="header"></section></section></main>');
        },
        error: 'opaque local panel is forbidden',
      },
      {
        name: 'provider crop',
        page: () => privatePageSpec({ withRaw: true }),
        mutate: (page) => {
          page.html = page.html.replace('object-fit:fill;clip-path:none;transform:none', 'object-fit:cover;clip-path:none;transform:none');
        },
        error: 'provider page must remain continuous without crop or transform',
      },
      {
        name: 'field geometry mismatch',
        page: () => privatePageSpec(),
        mutate: (page) => {
          page.layout.fields.find((field) => field.id === 'title').x += 1;
        },
        error: 'field title x expected',
      },
      {
        name: 'noncustom fallback',
        page: () => privatePageSpec(),
        mutate: (page) => {
          page.html = page.html.replace("font-family:'Source Sans 3','Noto Sans SC'", 'font-family:Arial,sans-serif');
        },
        error: 'did not use bundled custom font',
      },
      {
        name: 'line-count limit',
        page: () => privatePageSpec(),
        mutate: (page) => {
          page.layout.fields.find((field) => field.id === 'title').max_lines = 0;
        },
        error: 'field title exceeds 0 rendered lines',
      },
    ];

    for (const failure of failures) {
      const page = await failure.page();
      failure.mutate(page);
      const result = await capturePrivatePage(page);
      expect(result.ok, failure.name).toBe(false);
      expect(result.error, failure.name).toContain(failure.error);
    }
  }, 30_000);

  it('denies network requests and closes private browser resources after timeouts', async () => {
    const networkPage = await privatePageSpec();
    networkPage.html = networkPage.html.replace('</main>', '<img src="https://pptmaker.invalid/blocked.png" alt=""></main>');
    const network = await capturePrivatePage(networkPage);
    expect(network.ok, network.error).toBe(true);
    expect(network.pages[0].network.routeAttempts.some((attempt) => (
      attempt.kind === 'request' && attempt.value.includes('pptmaker.invalid/blocked.png')
    ))).toBe(true);
    expect(network.pages[0].network.serviceWorkers).toBe('blocked');

    const page = await privatePageSpec();
    for (const deadlines of [
      { pageTimeoutMs: 20, batchTimeoutMs: 500 },
      { pageTimeoutMs: 500, batchTimeoutMs: 20 },
    ]) {
      const { tracker, launch } = hangingBrowserTracker();
      const result = await captureHtmlPngBatch({
        runtimeEvidence: { test_only: true },
        pages: [page],
        launch,
        ...deadlines,
      });
      expect(result).toMatchObject({ ok: false, error: expect.stringContaining('timed out') });
      expect(tracker).toEqual({ browser_closes: 1, context_closes: 1 });
    }
  }, 20_000);

  it('composes all accepted provider pages as one batch and never returns a partial result', async () => {
    let launches = 0;
    const contract = createFramedHeaderOverlayContractForTesting({
      resolveRuntime: pinnedRuntime,
      captureBatch: (input) => captureHtmlPngBatch({
        ...input,
        launch: async (...args) => {
          launches += 1;
          return launchPinnedChromium(...args);
        },
      }),
    });
    const result = await contract.composePages([
      { slide_id: 'DeckGo', ...headerInput({ kicker: null, title: 'First header', subtitle: null }), verified_raw: verifiedRaw('#18324a') },
      { slide_id: 'EastWest', ...headerInput({ kicker: null, title: 'Second verified final', subtitle: null }), verified_raw: verifiedRaw('#7d4d28') },
    ]);

    expect(launches).toBe(1);
    expect(Object.keys(result.final_bytes_by_slide)).toEqual(['DeckGo', 'EastWest']);
    expect(result.final_bytes_by_slide.DeckGo).toBeInstanceOf(Buffer);
    expect(result.final_bytes_by_slide.EastWest).toBeInstanceOf(Buffer);

    const failedContract = createFramedHeaderOverlayContractForTesting({
      resolveRuntime: async () => ({ ok: true }),
      captureBatch: async () => ({
        ok: false,
        phase: 'EastWest:geometry',
        error: 'simulated second-page failure',
        pages: [{ id: 'DeckGo', bytes: Buffer.from('partial') }],
      }),
    });
    await expect(failedContract.composePages([
      { slide_id: 'DeckGo', ...headerInput({ kicker: null, title: 'First header', subtitle: null }), verified_raw: verifiedRaw('#18324a') },
      { slide_id: 'EastWest', ...headerInput({ kicker: null, title: 'Second verified final', subtitle: null }), verified_raw: verifiedRaw('#7d4d28') },
    ])).rejects.toMatchObject({
      code: 'framed_header_overlay_contract_invariant_failed',
      message: expect.stringContaining('simulated second-page failure'),
    });
  }, 20_000);
});
