import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCanvas } from "@napi-rs/canvas";

import { describe, expect, it } from "vitest";

import {
  buildPureTargetRawPlan,
  readPureTargetStoredPlanContext,
  resolvePureStyleMasterScope,
  resolvePureTargetCandidateSource,
} from "../../../PPTMAKER_FRAMEWORK/scripts/04-pure-image/index.mjs";
import { targetPageAuthoritySubmitFactory } from "../../../PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs";
import { canonicalJsonSha256 } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/identity/canonical_json.mjs";
import { buildTargetRawGenerationProfile } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_target_runtime.mjs";
import { styleMasterStorePaths } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/image2/style_master_store.mjs";
import {
  STYLE_MASTER_IMAGE,
  STYLE_MASTER_PROMPT,
  initBundle,
  styleAsset,
} from "../../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs";
import { pageAuthorityImage2Paths } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/page_authority_paths.mjs";
import { readState, statePath } from "../../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";
import { acceptLocalStyleMasterFixture } from "../../helpers/accepted_style_master.mjs";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function localImageBytes(variant = 0) {
  return Buffer.from(variant === 0
    ? "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAABHNCSVQICAgIfAhkiAAAAAFzUkdCAK7OHOkAAAANSURBVAiZY1AJyPoPAANYAd6lcnCEAAAAAElFTkSuQmCC"
    : "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAABHNCSVQICAgIfAhkiAAAAAFzUkdCAK7OHOkAAAANSURBVAiZY8hyUPkPAAO0Ac51OmnoAAAAAElFTkSuQmCC", "base64");
}

const VALID_PROVIDER_PNG = (() => {
  const image = createCanvas(2000, 1125);
  image.getContext("2d").fillRect(0, 0, 2000, 1125);
  return image.toBuffer("image/png");
})();

function source() {
  return `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: pure
---

## Slide 01: \`DeckGo\`

**TITLE**: Immutable Style Master binding
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

async function fixture({ accepted = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), "style-master-raw-binding-"));
  const deck = join(root, "deck_style_master_raw_binding");
  const runDir = join(deck, "3_versions", "v1");
  initBundle(deck, null, "keynote", "dark-executive");
  writeFileSync(styleAsset(runDir, STYLE_MASTER_IMAGE), localImageBytes());
  writeFileSync(join(runDir, "slide-specifications.md"), source(), "utf8");
  const result = accepted
    ? await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(runDir))
    : null;
  return { root, deck, runDir, paths: pageAuthorityImage2Paths(runDir), result };
}

function candidateReceipt(value) {
  return resolvePureTargetCandidateSource(value.runDir).receipt;
}

function sourceEpoch(value) {
  return readState(value.deck, { purpose: "observe", runVersion: "v1" })
    .page_authority_target_evidence.by_version["3_versions/v1"].source_epoch;
}

function captureError(action) {
  try {
    action();
  } catch (error) {
    return error;
  }
  throw new Error("expected action to fail");
}

describe("accepted Style Master raw binding", () => {
  it("blocks missing selection before source or raw-plan materialization", async () => {
    const value = await fixture();
    try {
      const stateBefore = readFileSync(statePath(value.deck));
      const error = captureError(() => buildPureTargetRawPlan(value.runDir));

      expect(error).toMatchObject({
        code: "target_style_master_unavailable",
        next_action: "inspect_style_master",
      });
      expect(readFileSync(statePath(value.deck))).toEqual(stateBefore);
      expect(existsSync(value.paths.target_source_receipt)).toBe(false);
      expect(existsSync(value.paths.target_raw_plan)).toBe(false);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("keeps immutable selected bytes when the compatibility payload drifts", async () => {
    const value = await fixture({ accepted: true });
    try {
      const before = buildTargetRawGenerationProfile({
        runDir: value.runDir,
        deckDir: value.deck,
        receipt: candidateReceipt(value),
      });
      writeFileSync(styleAsset(value.runDir, STYLE_MASTER_IMAGE), localImageBytes(1));
      const after = buildTargetRawGenerationProfile({
        runDir: value.runDir,
        deckDir: value.deck,
        receipt: candidateReceipt(value),
      });

      expect(after.style_master_reference.bytes).toEqual(before.style_master_reference.bytes);
      expect(after.style_master_reference.bytes).not.toEqual(localImageBytes(1));
      expect(after.style_master_reference.candidate_sha256).toBe(sha256(before.style_master_reference.bytes));
      expect(after.provider_profile_sha256).toBe(before.provider_profile_sha256);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("submits the plan-bound immutable bytes after compatibility payload drift", async () => {
    const value = await fixture({ accepted: true });
    try {
      const plan = buildPureTargetRawPlan(value.runDir);
      const referenceBytes = Buffer.from(plan.style_master_reference.bytes);
      writeFileSync(styleAsset(value.runDir, STYLE_MASTER_IMAGE), localImageBytes(1));
      let providerBody = null;
      let providerIdempotencyKey = null;
      const submit = targetPageAuthoritySubmitFactory(plan, {
        credentialResolver: () => ({ base_url: "https://image.example", api_key: "test-key" }),
        fetchImpl: async (_url, options) => {
          providerBody = JSON.parse(options.body);
          providerIdempotencyKey = options.headers["Idempotency-Key"];
          return {
            ok: true,
            status: 200,
            text: async () => JSON.stringify({ data: [{ b64_json: VALID_PROVIDER_PNG.toString("base64") }] }),
          };
        },
      });

      await submit({
        request: plan.provider_requests_by_slide.DeckGo,
        item: { slide_id: "DeckGo" },
        provider_idempotency_key: `page-authority-v3-${"a".repeat(64)}`,
      });
      expect(providerBody.image).toBe(`data:image/png;base64,${referenceBytes.toString("base64")}`);
      expect(providerBody.image).not.toContain(localImageBytes(1).toString("base64"));
      expect(providerIdempotencyKey).toBe(`page-authority-v3-${"a".repeat(64)}`);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("treats selection replacement as raw rebuild debt without advancing source epoch", async () => {
    const value = await fixture({ accepted: true });
    try {
      const first = buildPureTargetRawPlan(value.runDir);
      const rawPlanBefore = readFileSync(value.paths.target_raw_plan);
      expect(sourceEpoch(value)).toBe(1);

      writeFileSync(styleAsset(value.runDir, STYLE_MASTER_IMAGE), localImageBytes(1));
      const replacement = await acceptLocalStyleMasterFixture(resolvePureStyleMasterScope(value.runDir));
      const stateAfterSelection = readFileSync(statePath(value.deck));
      expect(replacement.accepted.selection_sha256).not.toBe(value.result.accepted.selection_sha256);

      const error = captureError(() => readPureTargetStoredPlanContext(value.runDir));
      expect(error).toMatchObject({
        code: "target_raw_plan_stale",
        next_action: "rebuild_target_raw_plan",
      });
      expect(readFileSync(value.paths.target_raw_plan)).toEqual(rawPlanBefore);
      expect(readFileSync(statePath(value.deck))).toEqual(stateAfterSelection);
      expect(sourceEpoch(value)).toBe(first.source_epoch);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("routes style-intent, context, and immutable-byte drift to Style Master without raw mutation", async () => {
    const intent = await fixture({ accepted: true });
    const context = await fixture({ accepted: true });
    const bytes = await fixture({ accepted: true });
    try {
      buildPureTargetRawPlan(intent.runDir);
      const intentRawPlan = readFileSync(intent.paths.target_raw_plan);
      const intentState = readFileSync(statePath(intent.deck));
      writeFileSync(styleAsset(intent.runDir, STYLE_MASTER_PROMPT), "A changed visual direction.\n", "utf8");
      expect(captureError(() => readPureTargetStoredPlanContext(intent.runDir))).toMatchObject({
        code: "target_style_master_stale",
        next_action: "inspect_style_master",
      });
      expect(readFileSync(intent.paths.target_raw_plan)).toEqual(intentRawPlan);
      expect(readFileSync(statePath(intent.deck))).toEqual(intentState);
      expect(sourceEpoch(intent)).toBe(1);

      buildPureTargetRawPlan(context.runDir);
      const contextRawPlan = readFileSync(context.paths.target_raw_plan);
      const contextState = readFileSync(statePath(context.deck));
      const registryPath = join(context.deck, "2_backbone", "visual-style", "page-authority-visual-language.yaml");
      writeFileSync(registryPath, readFileSync(registryPath, "utf8").replace("quiet depth", "quiet luminous depth"));
      expect(captureError(() => buildTargetRawGenerationProfile({
        runDir: context.runDir,
        deckDir: context.deck,
        receipt: candidateReceipt(context),
      }))).toMatchObject({
        code: "target_style_master_stale",
        next_action: "inspect_style_master",
      });
      expect(readFileSync(context.paths.target_raw_plan)).toEqual(contextRawPlan);
      expect(readFileSync(statePath(context.deck))).toEqual(contextState);
      expect(sourceEpoch(context)).toBe(1);

      buildPureTargetRawPlan(bytes.runDir);
      const bytesRawPlan = readFileSync(bytes.paths.target_raw_plan);
      const bytesState = readFileSync(statePath(bytes.deck));
      const candidatePath = styleMasterStorePaths(bytes.runDir, {
        plan_sha256: bytes.result.plan.plan_sha256,
        candidate_id: "local-existing",
        candidate_media_type: "image/png",
      }).candidate_image;
      writeFileSync(candidatePath, localImageBytes(1));
      expect(captureError(() => readPureTargetStoredPlanContext(bytes.runDir))).toMatchObject({
        code: "target_style_master_stale",
        next_action: "inspect_style_master",
      });
      expect(readFileSync(bytes.paths.target_raw_plan)).toEqual(bytesRawPlan);
      expect(readFileSync(statePath(bytes.deck))).toEqual(bytesState);
      expect(sourceEpoch(bytes)).toBe(1);
    } finally {
      rmSync(intent.root, { recursive: true, force: true });
      rmSync(context.root, { recursive: true, force: true });
      rmSync(bytes.root, { recursive: true, force: true });
    }
  });

  it("treats a legacy raw profile without selection binding as rebuild debt", async () => {
    const value = await fixture({ accepted: true });
    try {
      buildPureTargetRawPlan(value.runDir);
      const stored = JSON.parse(readFileSync(value.paths.target_raw_plan, "utf8"));
      const compatibilityBytes = readFileSync(styleAsset(value.runDir, STYLE_MASTER_IMAGE));
      const legacyProfile = {
        schema: "page-authority-target-raw-generation-profile-v1",
        provider: { provider: "image2", model: "gpt-image-2", api_revision: "page-authority-image2-v2" },
        output: { format: "png", width: 2000, height: 1125 },
        reference_transport: { style_master: "image-reference-v1", identity_reference: "none" },
        effective_style_master: { sha256: sha256(compatibilityBytes), bytes: compatibilityBytes.length },
      };
      const legacyProviderProfileSha = canonicalJsonSha256(legacyProfile);
      const legacyPlan = {
        ...stored,
        provider_profile_sha256: legacyProviderProfileSha,
        authorization_scope_sha256: canonicalJsonSha256({
          source_receipt_sha256: stored.source_receipt_sha256,
          workflow: stored.workflow,
          provider_profile_sha256: legacyProviderProfileSha,
          ordered_slide_ids: stored.ordered_slide_ids,
          raw_contracts_by_slide: Object.fromEntries(stored.items.map((item) => [item.slide_id, item.raw_contract_sha256])),
        }),
      };
      writeFileSync(value.paths.target_raw_plan, `${JSON.stringify(legacyPlan)}\n`);
      const legacyBytes = readFileSync(value.paths.target_raw_plan);
      const stateBefore = readFileSync(statePath(value.deck));

      expect(captureError(() => readPureTargetStoredPlanContext(value.runDir))).toMatchObject({
        code: "target_raw_plan_stale",
        next_action: "rebuild_target_raw_plan",
      });
      expect(readFileSync(value.paths.target_raw_plan)).toEqual(legacyBytes);
      expect(readFileSync(statePath(value.deck))).toEqual(stateBefore);
      expect(sourceEpoch(value)).toBe(1);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });
});
