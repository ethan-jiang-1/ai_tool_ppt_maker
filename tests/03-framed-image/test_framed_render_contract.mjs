import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';

import { createCanvas } from '@napi-rs/canvas';

import {
  createFramedRenderContractForTesting,
  describeFramedFrame,
} from '../../ppt_maker_harness/scripts/03-framed-image/internal/framed_render_contract.mjs';
import { captureHtmlPngBatch } from '../../ppt_maker_harness/scripts/03-framed-image/internal/capture_runtime.mjs';
import { FRAMED_TEXT_FRAME_STANDARD_V1 } from '../../ppt_maker_harness/scripts/03-framed-image/internal/text_frame.mjs';
import {
  discoverRuntimePackages,
  inspectHtmlRuntime,
  launchPinnedChromium,
} from '../../ppt_maker_harness/scripts/00-setup/index.mjs';

const textFrame = Object.freeze({
  preset: 'standard-v1',
  kicker: 'Context',
  title: 'Frame & contract',
  subtitle: 'One normalized visual source',
  callout: 'Checked-in local rendering only',
});

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

async function privatePageSpec({ slideId = 'DeckGo', frame = textFrame } = {}) {
  let capturedPages = null;
  const contract = createFramedRenderContractForTesting({
    resolveRuntime: async () => ({ ok: true }),
    captureBatch: async ({ pages }) => {
      capturedPages = pages;
      return { ok: true, pages: pages.map((page) => ({ id: page.id })) };
    },
  });
  await contract.verifyFrames([{ slide_id: slideId, text_frame: frame }]);
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

describe('Framed render contract', () => {
  it('derives description, document, and safe zones from the one normalized preset', async () => {
    const frame = describeFramedFrame({ slide_id: 'DeckGo', text_frame: textFrame });
    const variant = FRAMED_TEXT_FRAME_STANDARD_V1.variants.callout_present;

    expect(frame).toMatchObject({
      schema: 'pptmaker-framed-render-contract-v1',
      slide_id: 'DeckGo',
      layout: {
        canvas: FRAMED_TEXT_FRAME_STANDARD_V1.canvas,
        theme: FRAMED_TEXT_FRAME_STANDARD_V1.theme,
        variant: 'callout_present',
        panels: variant.panels,
      },
      render_profile: { render_profile_digest: expect.any(String) },
    });
    expect(frame.layout.fields).toEqual([
      { id: 'kicker', text: 'Context', ...variant.fields.kicker },
      { id: 'title', text: 'Frame & contract', ...variant.fields.title },
      { id: 'subtitle', text: 'One normalized visual source', ...variant.fields.subtitle },
      { id: 'callout', text: 'Checked-in local rendering only', ...variant.fields.callout },
    ]);
    expect(frame.layout.safe_zones).toEqual(variant.panels.map((panel, index) => ({
      panel_id: panel.id,
      rectangle: variant.reserved_underlay_rectangles[index],
    })));

    let capturedPages = null;
    const contract = createFramedRenderContractForTesting({
      resolveRuntime: async () => ({ ok: true }),
      captureBatch: async ({ pages }) => {
        capturedPages = pages;
        return { ok: true, pages: pages.map((page) => ({ id: page.id })) };
      },
    });
    const proof = await contract.verifyFrames([{ slide_id: 'DeckGo', text_frame: textFrame }]);

    expect(proof).toMatchObject({
      render_profile_digest: frame.render_profile.render_profile_digest,
      pages: [{ slide_id: 'DeckGo', render_profile_digest: frame.render_profile.render_profile_digest }],
    });
    expect(capturedPages).toHaveLength(1);
    expect(capturedPages[0]).toMatchObject({
      id: 'DeckGo',
      expectedLeafMarkers: ['kicker', 'title', 'subtitle', 'callout'],
      layout: {
        panels: variant.panels,
        panel_safe_zones: frame.layout.safe_zones,
      },
    });
    expect(capturedPages[0].html).toContain('Frame &amp; contract');
    expect(capturedPages[0].html).toContain("font-family:'Source Sans 3','Noto Sans SC'");
    expect(capturedPages[0].html).toContain('background:rgba(245, 240, 235, 0.96)');
    expect(capturedPages[0].html).not.toContain('Arial');
  });

  it('proves an ordered finite batch under one pinned browser process', async () => {
    let launches = 0;
    const contract = createFramedRenderContractForTesting({
      resolveRuntime: async () => {
        return pinnedRuntime();
      },
      captureBatch: (input) => captureHtmlPngBatch({
        ...input,
        launch: async (...args) => {
          launches += 1;
          return launchPinnedChromium(...args);
        },
      }),
    });

    const proof = await contract.verifyFrames([
      { slide_id: 'DeckGo', text_frame: { ...textFrame, callout: null } },
      {
        slide_id: 'EastWest',
        text_frame: {
          preset: 'standard-v1',
          kicker: null,
          title: '\u5df2\u68c0\u9a8c\u7684\u4e2d\u6587\u6807\u9898',
          subtitle: null,
          callout: '\u6bcf\u4e2a\u5b57\u4f53\u90fd\u6765\u81ea\u68c0\u67e5\u8fc7\u7684\u672c\u5730\u5b57\u5e93',
        },
      },
      {
        slide_id: 'MixedNow',
        text_frame: {
          preset: 'standard-v1',
          kicker: null,
          title: 'Verified mixed \u4e2d\u6587 title',
          subtitle: null,
          callout: null,
        },
      },
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
    const contract = createFramedRenderContractForTesting({
      resolveRuntime: pinnedRuntime,
      captureBatch: captureHtmlPngBatch,
    });
    for (const [slideId, title] of [
      ['WideW', 'W'.repeat(28)],
      ['ManyLines', 'A precise phrase that repeats enough times to exceed the two line title limit under the normalized layout and must stop before final output is captured'],
    ]) {
      await expect(contract.verifyFrames([{
        slide_id: slideId,
        text_frame: { preset: 'standard-v1', kicker: null, title, subtitle: null, callout: null },
      }])).rejects.toMatchObject({
        code: 'framed_text_fit_failed',
        message: expect.stringContaining('scroll overflow'),
      });
    }
  }, 20_000);

  it('fails closed for private capture invariant violations and denies network requests', async () => {
    const failures = [
      {
        name: 'missing panel',
        mutate: (page) => {
          page.html = page.html.replace('data-pm-panel="header"', 'data-pm-panel="different"');
        },
        error: 'panel header is missing',
      },
      {
        name: 'field geometry mismatch',
        mutate: (page) => {
          page.layout.fields.find((field) => field.id === 'title').x += 1;
        },
        error: 'field title x expected',
      },
      {
        name: 'leaf marker mismatch',
        mutate: (page) => {
          page.expectedLeafMarkers.push('unexpected');
        },
        error: 'leaf marker set mismatch',
      },
      {
        name: 'noncustom fallback',
        mutate: (page) => {
          page.html = page.html.replace("font-family:'Source Sans 3','Noto Sans SC'", 'font-family:Arial,sans-serif');
        },
        error: 'did not use bundled custom font',
      },
      {
        name: 'missing selected font',
        mutate: (page) => {
          page.html = page.html.replaceAll(/data:font\/woff2;base64,[A-Za-z0-9+/=]+/g, 'data:font/woff2;base64,AAAA');
        },
        error: 'did not use bundled custom font',
      },
      {
        name: 'wrong capture geometry',
        mutate: (page) => {
          page.html = page.html.replace('.pm-slide{position:relative;width:1000px', '.pm-slide{position:relative;width:999px');
        },
        error: 'slide geometry width expected',
      },
      {
        name: 'line-count limit',
        mutate: (page) => {
          page.layout.fields.find((field) => field.id === 'title').max_lines = 0;
        },
        error: 'field title exceeds 0 rendered lines',
      },
    ];

    for (const failure of failures) {
      const page = await privatePageSpec();
      failure.mutate(page);
      const result = await capturePrivatePage(page);
      expect(result.ok, failure.name).toBe(false);
      expect(result.error, failure.name).toContain(failure.error);
    }

    const networkPage = await privatePageSpec();
    networkPage.html = networkPage.html.replace('</main>', '<img src="https://pptmaker.invalid/blocked.png" alt=""> </main>');
    const network = await capturePrivatePage(networkPage);
    expect(network.ok, network.error).toBe(true);
    expect(network.pages[0].network.routeAttempts.some((attempt) => (
      attempt.kind === 'request' && attempt.value.includes('pptmaker.invalid/blocked.png')
    ))).toBe(true);
    expect(network.pages[0].network.serviceWorkers).toBe('blocked');
  }, 30_000);

  it('closes private browser resources after both per-page and whole-batch timeouts', async () => {
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
  }, 10_000);

  it('composes all accepted underlays as one batch and never returns a partial result', async () => {
    let launches = 0;
    const contract = createFramedRenderContractForTesting({
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
      { slide_id: 'DeckGo', text_frame: { ...textFrame, callout: null }, verified_raw: verifiedRaw('#18324a') },
      {
        slide_id: 'EastWest',
        text_frame: { ...textFrame, title: 'Second verified final', callout: 'The batch stays atomic' },
        verified_raw: verifiedRaw('#7d4d28'),
      },
    ]);

    expect(launches).toBe(1);
    expect(Object.keys(result.final_bytes_by_slide)).toEqual(['DeckGo', 'EastWest']);
    expect(result.final_bytes_by_slide.DeckGo).toBeInstanceOf(Buffer);
    expect(result.final_bytes_by_slide.EastWest).toBeInstanceOf(Buffer);

    const failedContract = createFramedRenderContractForTesting({
      resolveRuntime: async () => ({ ok: true }),
      captureBatch: async () => ({
        ok: false,
        phase: 'EastWest:geometry',
        error: 'simulated second-page failure',
        pages: [{ id: 'DeckGo', bytes: Buffer.from('partial') }],
      }),
    });
    await expect(failedContract.composePages([
      { slide_id: 'DeckGo', text_frame: { ...textFrame, callout: null }, verified_raw: verifiedRaw('#18324a') },
      { slide_id: 'EastWest', text_frame: { ...textFrame, title: 'Second verified final' }, verified_raw: verifiedRaw('#7d4d28') },
    ])).rejects.toMatchObject({
      code: 'framed_render_contract_invariant_failed',
      message: expect.stringContaining('simulated second-page failure'),
    });
  }, 20_000);
});
