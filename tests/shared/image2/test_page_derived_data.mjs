import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { canonicalJsonSha256 } from "../../../ppt_maker_harness/scripts/shared/identity/canonical_json.mjs";
import { sha256Bytes } from "../../../ppt_maker_harness/scripts/shared/identity/byte_hash.mjs";
import { createRawWorkPlan } from "../../../ppt_maker_harness/scripts/shared/image2/page_image_artifacts.mjs";
import { createProgressiveRawWorkPlan } from "../../../ppt_maker_harness/scripts/shared/image2/page_image_progressive_schema.mjs";
import {
  PAGE_DERIVED_DATA_ARTIFACT_SCHEMA,
  PAGE_DERIVED_DATA_INDEX_SCHEMA,
  PageDerivedDataError,
  publishPageDerivedData,
} from "../../../ppt_maker_harness/scripts/shared/image2/page_derived_data.mjs";
import { pageImageDerivedPagePaths, pageImageWorkflowPaths } from "../../../ppt_maker_harness/scripts/shared/run-bundle/page_image_paths.mjs";

const digest = (value) => sha256Bytes(Buffer.from(value, "utf8"));
const fixedDigest = (character) => character.repeat(64);
const hexAt = (index) => ["a", "b", "c", "d", "e", "f"][index % 6];

function fixtureRun(name) {
  const root = mkdtempSync(join(tmpdir(), `${name}-`));
  const runDir = join(root, "deck_derived", "3_versions", "v1");
  mkdirSync(runDir, { recursive: true });
  return { root, runDir, paths: pageImageWorkflowPaths(runDir) };
}

function inputFor(workflow, { ids = ["StoryGo", "ChartUp"], requestSuffix = "" } = {}) {
  const sourceSha = fixedDigest("a");
  const generationProfile = { provider: { model: "mock" }, output: { format: "png" } };
  const profileSha = canonicalJsonSha256(generationProfile);
  const pages = ids.map((slide_id, index) => {
    const pageClass = index === 0 ? "opening" : "standard";
    const presentation = {
      workflow,
      page_class: pageClass,
      profile_id: `${workflow}-${pageClass}`,
      binding_sha256: fixedDigest(hexAt(index + 2)),
      provenance: { profile_id: "selected-profile", defaults: "deck-defaults" },
      profile: { id: `${workflow}-${pageClass}`, permitted_fields: ["title"] },
      ...(workflow === "framed" ? {
        protected_composition: {
          coordinate_space: "normalized-canvas",
          reserved_header: { x: 0.04, y: 0.05, width: 0.92, height: 0.4 },
          body_safe: { x: 0, y: 0.45, width: 1, height: 0.55 },
        },
      } : {}),
    };
    return {
      slide_id,
      position: index + 1,
      page_class: pageClass,
      subject_restrictions: "none",
      header_policy: workflow === "framed"
        ? { local_header: { kicker: null, title: `Title ${index + 1}`, subtitle: null } }
        : { provider_visible: { kicker: null, title: `Title ${index + 1}`, subtitle: null } },
      provider_content: { items: [{ role: "body", literal: workflow === "framed" ? `Title ${index + 1}` : `Body ${index + 1}`, copy_policy: "exact" }] },
      visual_language: {
        presentation,
        projection: { recipe: "flat editorial", composition: "clear hierarchy", motifs: ["grid"] },
        identity_reference: { projection: { identity: "editorial" } },
      },
    };
  });
  const receipt = {
    schema: "page-image-workflow-source",
    pipeline: "page-image-workflow",
    workflow,
    source_sha256: sourceSha,
    slides: pages,
  };
  const providerInputs = Object.fromEntries(pages.map((page) => {
    const utf8 = workflow === "framed"
      ? JSON.stringify({
        schema: "page-image-framed-provider-input",
        slide_id: page.slide_id,
        subject_restrictions: page.subject_restrictions,
        protected_composition: page.visual_language.presentation.protected_composition,
        provider_rendered_content: page.provider_content,
        exact: `${workflow}-${page.slide_id}${requestSuffix}`,
      })
      : `{"exact":"${workflow}-${page.slide_id}${requestSuffix}"}`;
    return [page.slide_id, { utf8, sha256: digest(utf8) }];
  }));
  const coreSlides = pages.map((page, index) => ({
    schema: "page-image-core-slide-facts",
    workflow,
    source_receipt_sha256: sourceSha,
    slide_id: page.slide_id,
    position: page.position,
    canonical_semantic_sha256: fixedDigest(hexAt(index + 1)),
    provider_content_sha256: fixedDigest(hexAt(index + 2)),
    visual_selection_sha256: fixedDigest(hexAt(index + 3)),
    style_master_selection_sha256: fixedDigest("e"),
    generation_profile_sha256: profileSha,
    header_policy_sha256: fixedDigest(hexAt(index + 4)),
    page_presentation_sha256: page.visual_language.presentation.binding_sha256,
    subject_restrictions: page.subject_restrictions,
    provider_content: page.provider_content,
    header_policy: page.header_policy,
    visual_selection: page.visual_language,
  }));
  const bindings = pages.map((page, index) => ({
    compiled_provider_input_sha256: providerInputs[page.slide_id].sha256,
    provider_content_sha256: coreSlides[index].provider_content_sha256,
    visual_selection_sha256: coreSlides[index].visual_selection_sha256,
    style_master_selection_sha256: coreSlides[index].style_master_selection_sha256,
    generation_profile_sha256: profileSha,
    header_policy_sha256: coreSlides[index].header_policy_sha256,
    page_presentation_sha256: coreSlides[index].page_presentation_sha256,
    local_header_profile_sha256: workflow === "framed" ? fixedDigest(hexAt(index + 5)) : null,
    protected_composition_sha256: workflow === "framed" ? canonicalJsonSha256(page.visual_language.presentation.protected_composition) : null,
  }));
  const raw = createRawWorkPlan({
    source_receipt_sha256: sourceSha,
    workflow,
    ordered_slide_ids: ids,
    provider_profile_sha256: profileSha,
    authorization_scope_sha256: fixedDigest("f"),
    items: pages.map((page, index) => ({
      slide_id: page.slide_id,
      raw_contract_sha256: fixedDigest(hexAt(index + 1)),
      provider_input_binding: bindings[index],
    })),
  });
  const progressive = createProgressiveRawWorkPlan({
    run_version: "v1",
    source_receipt_sha256: sourceSha,
    source_epoch: 1,
    workflow,
    provider_profile_sha256: profileSha,
    effective_style_master_sha256: fixedDigest("e"),
    source_execution_sha256: fixedDigest("d"),
    ordered_slide_ids: ids,
    items: raw.items,
  });
  return {
    workflow,
    receipt,
    raw_work_plan: raw,
    progressive_raw_work_plan: progressive,
    page_image_core: { schema: "page-image-core-facts", workflow, source_receipt_sha256: sourceSha, slides: coreSlides },
    provider_requests_by_slide: Object.fromEntries(pages.map((page, index) => [page.slide_id, {
      schema: "page-image-target-raw-provider-request",
      slide_id: page.slide_id,
      raw_contract_sha256: raw.items[index].raw_contract_sha256,
      generation_profile: generationProfile,
      compiled_provider_input: { schema: "page-image-compiled-provider-input", ...providerInputs[page.slide_id] },
    }])),
    ...(workflow === "framed" ? {
      framed_header_html_by_slide: Object.fromEntries(pages.map((page) => [page.slide_id, `<!doctype html><html><body>${page.slide_id}</body></html>`])),
    } : {}),
  };
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

describe("page-derived data publisher", () => {
  it("writes independently indexed Pure artifacts and preserves the selected adapter's exact request bytes", () => {
    const { root, runDir, paths } = fixtureRun("derived-pure");
    const input = inputFor("pure");
    try {
      const report = publishPageDerivedData({ run_dir: runDir, ...input });
      const index = readJson(report.index);
      expect(index).toMatchObject({ schema: PAGE_DERIVED_DATA_INDEX_SCHEMA });
      expect(index.publication.workflow).toBe("pure");
      expect(index.payload.pages).toHaveLength(2);
      for (const [position, id] of input.raw_work_plan.ordered_slide_ids.entries()) {
        const pagePaths = pageImageDerivedPagePaths(runDir, id);
        expect(readJson(pagePaths.source_receipt)).toMatchObject({ schema: PAGE_DERIVED_DATA_ARTIFACT_SCHEMA, stage: "page-source-receipt", page: { slide_id: id, position: position + 1 } });
        const request = readJson(pagePaths.image2_request);
        const exact = input.provider_requests_by_slide[id].compiled_provider_input;
        expect(request.payload.canonical_utf8).toBe(exact.utf8);
        expect(request.payload.request_digest).toBe(exact.sha256);
        expect(digest(request.payload.canonical_utf8)).toBe(request.payload.request_digest);
        expect(existsSync(pagePaths.framed_header_html)).toBe(false);
        const pageIndex = readJson(pagePaths.artifact_index);
        expect(pageIndex.payload.artifact_references).not.toHaveProperty("framed_header_html");
        expect(Object.values(pageIndex.payload.artifact_references).every((reference) =>
          reference.path.startsWith(`pages/${id}/`) && /^[0-9a-f]{64}$/.test(reference.sha256))).toBe(true);
      }
      expect(report.root).toBe(paths.derived_root);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("writes Framed's exact renderer HTML with no sibling header controller", () => {
    const { root, runDir } = fixtureRun("derived-framed");
    const input = inputFor("framed", { ids: ["FrameGo"] });
    try {
      publishPageDerivedData({ run_dir: runDir, ...input });
      const pagePaths = pageImageDerivedPagePaths(runDir, "FrameGo");
      expect(readFileSync(pagePaths.framed_header_html, "utf8")).toBe(input.framed_header_html_by_slide.FrameGo);
      expect(existsSync(join(pagePaths.root, "framed-header.json"))).toBe(false);
      const index = readJson(pagePaths.artifact_index);
      expect(index.payload.artifact_references.framed_header_html).toMatchObject({ format: "html", path: "pages/FrameGo/framed-header.html" });
      const source = readJson(pagePaths.source_receipt);
      const layout = readJson(pagePaths.layout);
      const request = readJson(pagePaths.image2_request);
      const parsedRequest = JSON.parse(request.payload.canonical_utf8);
      expect(layout.payload.selected_presentation.profile_id).toBe("framed-opening");
      expect(source.payload.parsed_page.subject_restrictions).toBe("none");
      expect(layout.payload.selected_presentation.protected_composition).toEqual(
        input.receipt.slides[0].visual_language.presentation.protected_composition,
      );
      expect(parsedRequest).toMatchObject({
        subject_restrictions: "none",
        protected_composition: input.receipt.slides[0].visual_language.presentation.protected_composition,
        provider_rendered_content: { items: [{ literal: "Title 1" }] },
      });
      expect(parsedRequest).not.toHaveProperty("local_header");
      expect(parsedRequest).not.toHaveProperty("context_not_to_render");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects malformed candidates before replacement and never reads a stale manual tree", () => {
    const { root, runDir, paths } = fixtureRun("derived-atomic");
    const first = inputFor("pure", { ids: ["KeepGo"], requestSuffix: "-first" });
    const next = inputFor("pure", { ids: ["KeepGo"], requestSuffix: "-next" });
    try {
      publishPageDerivedData({ run_dir: runDir, ...first });
      writeFileSync(paths.derived_index, "manual stale output\n");
      next.provider_requests_by_slide.KeepGo.compiled_provider_input.sha256 = fixedDigest("f");
      expect(() => publishPageDerivedData({ run_dir: runDir, ...next })).toThrow(PageDerivedDataError);
      expect(readFileSync(paths.derived_index, "utf8")).toBe("manual stale output\n");

      const repaired = inputFor("pure", { ids: ["KeepGo"], requestSuffix: "-next" });
      publishPageDerivedData({ run_dir: runDir, ...repaired });
      const request = readJson(pageImageDerivedPagePaths(runDir, "KeepGo").image2_request);
      expect(request.payload.canonical_utf8).toBe(repaired.provider_requests_by_slide.KeepGo.compiled_provider_input.utf8);
      expect(readFileSync(paths.derived_index, "utf8")).not.toContain("manual stale output");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("keeps the prior publication when one staged write fails and rejects unsafe stable IDs", () => {
    const { root, runDir, paths } = fixtureRun("derived-failure");
    const first = inputFor("pure", { ids: ["KeepGo"] });
    try {
      publishPageDerivedData({ run_dir: runDir, ...first });
      const before = readFileSync(paths.derived_index);
      let writes = 0;
      expect(() => publishPageDerivedData({ run_dir: runDir, ...inputFor("pure", { ids: ["KeepGo", "BreakGo"], requestSuffix: "-later" }) }, {
        filesystem: {
          writeFileSync(...args) {
            writes += 1;
            if (writes === 6) throw new Error("injected staged write failure");
            return writeFileSync(...args);
          },
        },
      })).toThrow("injected staged write failure");
      expect(readFileSync(paths.derived_index)).toEqual(before);

      const unsafe = inputFor("pure", { ids: ["KeepGo"] });
      unsafe.receipt.slides[0].slide_id = "../Escape";
      expect(() => publishPageDerivedData({ run_dir: runDir, ...unsafe })).toThrow("safe stable slide ID");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
