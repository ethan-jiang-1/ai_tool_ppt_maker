import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCanvas } from "@napi-rs/canvas";
import { describe, expect, it } from "vitest";

import { buildPureTargetRawPlan, resolvePureStyleMasterScope } from "../../../ppt_maker_harness/scripts/04-pure-image/index.mjs";
import { targetPageImageSubmitFactory } from "../../../ppt_maker_harness/scripts/shared/cli/command_support.mjs";
import { Image2ProviderProfileError } from "../../../ppt_maker_harness/scripts/shared/image2/provider_profile.mjs";
import {
  STYLE_MASTER_IMAGE,
  initBundle as initializeBundle,
  styleAsset,
} from "../../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import { acceptLocalStyleMasterFixture } from "../../helpers/accepted_style_master.mjs";
import { writeConfirmedImage2ProviderProfile } from "../../helpers/image2_provider_profile.mjs";

function localImageBytes() {
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAABHNCSVQICAgIfAhkiAAAAAFzUkdCAK7OHOkAAAANSURBVAiZY1AJyPoPAANYAd6lcnCEAAAAAElFTkSuQmCC",
    "base64",
  );
}

const VALID_PROVIDER_PNG = (() => {
  const image = createCanvas(2048, 1136);
  image.getContext("2d").fillRect(0, 0, 2048, 1136);
  return image.toBuffer("image/png");
})();

const EDITS_TRANSPORT = Object.freeze({
  http_operation: "edits",
  encoding: "multipart",
  width: 2048,
  height: 1152,
  dimension_multiple: 16,
  completion: "async-poll",
});

const SYNC_TRANSPORT = Object.freeze({
  http_operation: "generations",
  encoding: "json",
  width: 2000,
  height: 1125,
  dimension_multiple: 1,
  completion: "sync",
});

function source() {
  return `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: pure
---

## Slide 01: \`DeckGo\`

**TITLE**: Transport vector
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`
`;
}

async function fixture({ pageImageTransport = null } = {}) {
  const root = mkdtempSync(join(tmpdir(), "page-image-transport-"));
  const deck = join(root, "deck_page_image_transport");
  const runDir = join(deck, "3_versions", "v1");
  initializeBundle(deck, null, "keynote", "dark-executive");
  writeConfirmedImage2ProviderProfile(runDir, { pageImageTransport });
  writeFileSync(styleAsset(runDir, STYLE_MASTER_IMAGE), localImageBytes());
  writeFileSync(join(runDir, "slide-specifications.md"), source(), "utf8");
  await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir));
  return { root, deck, runDir };
}

function providerJsonResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(payload),
  };
}

describe("Page Image transport capability vector", () => {
  it("keeps omitted transport on generations JSON at 2000x1125", async () => {
    const value = await fixture();
    try {
      const plan = buildPureTargetRawPlan(value.runDir);
      expect(plan.provider_requests_by_slide.DeckGo.generation_profile.provider.transport).toEqual({
        http_operation: "generations",
        encoding: "json",
        width: 2000,
        height: 1125,
        dimension_multiple: 1,
        completion: "async-poll",
      });
      const requests = [];
      const submit = targetPageImageSubmitFactory(plan, {
        credentialResolver: () => ({ base_url: "https://image.example", api_key: "test-key" }),
        fetchImpl: async (url, options) => {
          requests.push({ url, contentType: options.headers["Content-Type"], body: JSON.parse(options.body) });
          return providerJsonResponse({ data: [{ b64_json: VALID_PROVIDER_PNG.toString("base64") }] });
        },
      });
      await submit({
        request: plan.provider_requests_by_slide.DeckGo,
        item: { slide_id: "DeckGo" },
        provider_idempotency_key: `page-image-workflow-${"a".repeat(64)}`,
      });
      expect(requests).toEqual([{
        url: "https://image.example/images/generations",
        contentType: "application/json",
        body: expect.objectContaining({ size: "2000x1125", n: 1 }),
      }]);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("submits bound edits multipart at the declared size without a second base URL", async () => {
    const value = await fixture({ pageImageTransport: EDITS_TRANSPORT });
    try {
      const plan = buildPureTargetRawPlan(value.runDir);
      expect(plan.provider_requests_by_slide.DeckGo.generation_profile.provider.transport).toEqual(EDITS_TRANSPORT);
      const requests = [];
      const submit = targetPageImageSubmitFactory(plan, {
        credentialResolver: () => ({ base_url: "https://image.example", api_key: "test-key" }),
        fetchImpl: async (url, options) => {
          requests.push({
            url,
            contentType: options.headers["Content-Type"] || null,
            isForm: options.body instanceof FormData,
            size: options.body instanceof FormData ? options.body.get("size") : null,
            model: options.body instanceof FormData ? options.body.get("model") : null,
          });
          return providerJsonResponse({ data: [{ b64_json: VALID_PROVIDER_PNG.toString("base64") }] });
        },
      });
      const bytes = await submit({
        request: plan.provider_requests_by_slide.DeckGo,
        item: { slide_id: "DeckGo" },
        provider_idempotency_key: `page-image-workflow-${"b".repeat(64)}`,
      });
      expect(bytes).toEqual(VALID_PROVIDER_PNG);
      expect(requests).toEqual([{
        url: "https://image.example/images/edits",
        contentType: null,
        isForm: true,
        size: "2048x1152",
        model: plan.provider_requests_by_slide.DeckGo.generation_profile.provider.model,
      }]);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("does not poll when bound completion is sync", async () => {
    const value = await fixture({ pageImageTransport: SYNC_TRANSPORT });
    try {
      const plan = buildPureTargetRawPlan(value.runDir);
      const requests = [];
      const submit = targetPageImageSubmitFactory(plan, {
        credentialResolver: () => ({ base_url: "https://image.example", api_key: "test-key" }),
        fetchImpl: async (url, options) => {
          requests.push({ url, method: options.method });
          return providerJsonResponse({ data: [{ task_id: "task_async_fixture" }] });
        },
      });
      const error = await submit({
        request: plan.provider_requests_by_slide.DeckGo,
        item: { slide_id: "DeckGo" },
        provider_idempotency_key: `page-image-workflow-${"c".repeat(64)}`,
      }).catch((caught) => caught);
      expect(error).toMatchObject({
        code: "PAGE_IMAGE_PROVIDER_RESPONSE_INVALID",
        page_image_known_failure: true,
      });
      expect(requests).toEqual([{ url: "https://image.example/images/generations", method: "POST" }]);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("rejects an illegal transport combo before plan or fetch", async () => {
    const value = await fixture();
    try {
      writeConfirmedImage2ProviderProfile(value.runDir, {
        pageImageTransport: {
          http_operation: "edits",
          encoding: "json",
          width: 2048,
          height: 1152,
          dimension_multiple: 16,
          completion: "async-poll",
        },
      });
      expect(() => buildPureTargetRawPlan(value.runDir)).toThrow(Image2ProviderProfileError);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });
});
