import { describe, it, expect } from "vitest";
import {
  PRODUCTION_MODES,
  PRODUCTION_PAGE_AUTHORITIES,
  PRODUCTION_REFINEMENT_POLICIES,
  PRODUCTION_STYLE_MASTER_POLICIES,
  canonicalVersionKey,
  classifyProductionModeTransition,
  inspectProductionMode,
  isProductionMode,
  normalizeProductionMode,
  normalizeRunVersion,
  pipelineFromSourceMarker,
  productionModeFromSourceMarker,
  productionPolicyForMode,
} from "../../../PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/production_mode.mjs";

const HTML = "html-first-v1";
const WHOLE_PAGE = "whole-page-image2-v1";

describe("production_mode vocabulary", () => {
  it("exposes the closed three-mode vocabulary", () => {
    expect([...PRODUCTION_MODES]).toEqual(["html-only", "html-then-image2", "image2-only"]);
  });

  it("isProductionMode rejects everything outside the closed set without coercion", () => {
    for (const mode of PRODUCTION_MODES) expect(isProductionMode(mode)).toBe(true);
    const bad = ["", "html", "image2", "image2-first", "whole-page-image2-v1", "html-first-v1", "HTML-ONLY", "html_only", null, undefined, 0, 1, true, {}, [], "html-only "];
    for (const value of bad) expect(isProductionMode(value)).toBe(false);
  });

  it("normalizeProductionMode returns the canonical string or null, and rejects retired aliases", () => {
    expect(normalizeProductionMode("image2-only")).toBe("image2-only");
    expect(normalizeProductionMode("html-only")).toBe("html-only");
    expect(normalizeProductionMode("html-then-image2")).toBe("html-then-image2");
    expect(normalizeProductionMode("legacy")).toBeNull();
    expect(normalizeProductionMode(undefined)).toBeNull();
  });
});

describe("productionPolicyForMode exact mappings", () => {
  it("maps html-only -> html pipeline, html authority, disabled refinement, reserved adapter", () => {
    expect(productionPolicyForMode("html-only")).toEqual({
      ok: true,
      mode: "html-only",
      pipeline: HTML,
      page_authority: "html",
      refinement_policy: "disabled",
      style_master_policy: "reserved-html-adapter",
    });
  });

  it("maps html-then-image2 -> html pipeline, html authority, required refinement, reserved adapter", () => {
    expect(productionPolicyForMode("html-then-image2")).toEqual({
      ok: true,
      mode: "html-then-image2",
      pipeline: HTML,
      page_authority: "html",
      refinement_policy: "required",
      style_master_policy: "reserved-html-adapter",
    });
  });

  it("maps image2-only to the current whole-page pipeline, image2 authority, n/a refinement, and current style master", () => {
    expect(productionPolicyForMode("image2-only")).toEqual({
      ok: true,
      mode: "image2-only",
      pipeline: WHOLE_PAGE,
      page_authority: "image2",
      refinement_policy: "not-applicable",
      style_master_policy: "current",
    });
  });

  it("fails closed with a typed result for any invalid mode", () => {
    for (const bad of ["whole-page-image2-v1", "html-first-v1", "", null, undefined, 42, {}, []]) {
      const result = productionPolicyForMode(bad);
      expect(result.ok).toBe(false);
      expect(result.code).toBe("INVALID_PRODUCTION_MODE");
      expect(result.actual).toBe(bad);
      expect(result.valid_modes).toEqual([...PRODUCTION_MODES]);
    }
  });

  it("keeps every derived field within its declared closed enum", () => {
    for (const mode of PRODUCTION_MODES) {
      const p = productionPolicyForMode(mode);
      expect(PRODUCTION_PAGE_AUTHORITIES).toContain(p.page_authority);
      expect(PRODUCTION_REFINEMENT_POLICIES).toContain(p.refinement_policy);
      expect(PRODUCTION_STYLE_MASTER_POLICIES).toContain(p.style_master_policy);
    }
  });
});

describe("source marker normalization", () => {
  it("accepts the explicit whole-page marker", () => {
    const r = pipelineFromSourceMarker({ branch: WHOLE_PAGE, issues: [] });
    expect(r).toEqual({ ok: true, pipeline: WHOLE_PAGE, branch: WHOLE_PAGE });
  });

  it("keeps the explicit html-first-v1 branch stable", () => {
    const r = pipelineFromSourceMarker({ branch: HTML, issues: [] });
    expect(r).toEqual({ ok: true, pipeline: HTML, branch: HTML });
  });

  it("fails closed on invalid/unknown/missing markers", () => {
    expect(pipelineFromSourceMarker({ branch: "invalid", issues: ["x"] }).code).toBe("MARKER_INVALID");
    expect(pipelineFromSourceMarker({ branch: "bogus", issues: [] }).code).toBe("MARKER_UNKNOWN");
    expect(pipelineFromSourceMarker(null).code).toBe("MARKER_MISSING");
    expect(pipelineFromSourceMarker(undefined).code).toBe("MARKER_MISSING");
  });

  it("productionModeFromSourceMarker maps explicit markers to their modes", () => {
    expect(productionModeFromSourceMarker({ branch: HTML, issues: [] })).toEqual({
      ok: true,
      mode: "html-only",
      pipeline: HTML,
      branch: HTML,
    });
    expect(productionModeFromSourceMarker({ branch: WHOLE_PAGE, issues: [] })).toEqual({
      ok: true,
      mode: "image2-only",
      pipeline: WHOLE_PAGE,
      branch: WHOLE_PAGE,
    });
    expect(productionModeFromSourceMarker({ branch: "invalid", issues: ["e"] }).ok).toBe(false);
  });
});

describe("run version resolution", () => {
  it("normalizes path or bare version to vN", () => {
    expect(normalizeRunVersion("v2")).toBe("v2");
    expect(normalizeRunVersion("deck_x/3_versions/v7")).toBe("v7");
    expect(normalizeRunVersion("/tmp/deck/3_versions/v1")).toBe("v1");
    expect(normalizeRunVersion("3_versions/v4")).toBe("v4");
    expect(normalizeRunVersion("deck_root")).toBeNull();
    expect(normalizeRunVersion("v0")).toBeNull();
    expect(normalizeRunVersion("v01")).toBeNull();
    expect(normalizeRunVersion("")).toBeNull();
    expect(normalizeRunVersion(null)).toBeNull();
  });

  it("canonicalVersionKey is 3_versions/vN", () => {
    expect(canonicalVersionKey("v3")).toBe("3_versions/v3");
    expect(canonicalVersionKey("deck/3_versions/v3")).toBe("3_versions/v3");
    expect(canonicalVersionKey("nope")).toBeNull();
  });
});

function stateWith(map) {
  return { production_mode: { by_version: map } };
}

describe("inspectProductionMode exact-version inspection", () => {
  it("returns only the exact version's mode and policy", () => {
    const state = stateWith({
      "3_versions/v1": { mode: "html-only" },
      "3_versions/v2": { mode: "image2-only" },
    });
    const r = inspectProductionMode({ state, runVersion: "v2", sourceMarker: { branch: WHOLE_PAGE, issues: [] } });
    expect(r.ok).toBe(true);
    expect(r.run_version).toBe("v2");
    expect(r.mode).toBe("image2-only");
    expect(r.policy.pipeline).toBe(WHOLE_PAGE);
    expect(r.consistent).toBe(true);
  });

  it("accepts runDir path and resolves the exact version, ignoring deck-global values", () => {
    const state = stateWith({ "3_versions/v2": { mode: "html-then-image2" } });
    const r = inspectProductionMode({ state, runDir: "deck/3_versions/v2", sourceMarker: { branch: HTML, issues: [] } });
    expect(r.ok).toBe(true);
    expect(r.mode).toBe("html-then-image2");
  });

  it("MODE_MISSING when the exact version has no record", () => {
    const state = stateWith({ "3_versions/v1": { mode: "html-only" } });
    const r = inspectProductionMode({ state, runVersion: "v2", sourceMarker: { branch: HTML, issues: [] } });
    expect(r).toMatchObject({ ok: false, code: "MODE_MISSING", run_version: "v2", version_key: "3_versions/v2" });
  });

  it("MODE_INVALID when the record holds an unknown mode", () => {
    const state = stateWith({ "3_versions/v1": { mode: "html-first-v1" } });
    const r = inspectProductionMode({ state, runVersion: "v1", sourceMarker: { branch: HTML, issues: [] } });
    expect(r.ok).toBe(false);
    expect(r.code).toBe("MODE_INVALID");
  });

  it("MODE_RECORD_MALFORMED when the record is not a mapping", () => {
    const state = stateWith({ "3_versions/v1": "html-only" });
    const r = inspectProductionMode({ state, runVersion: "v1", sourceMarker: { branch: HTML, issues: [] } });
    expect(r.code).toBe("MODE_RECORD_MALFORMED");
  });

  it("transition_required when mode pipeline differs from the source marker", () => {
    const state = stateWith({ "3_versions/v1": { mode: "image2-only" } });
    const r = inspectProductionMode({ state, runVersion: "v1", sourceMarker: { branch: HTML, issues: [] } });
    expect(r).toMatchObject({ ok: false, code: "transition_required", mode: "image2-only" });
    expect(r.source_pipeline).toBe(HTML);
    expect(r.derived_pipeline).toBe(WHOLE_PAGE);
  });

  it("RUN_VERSION_INVALID when the caller names no canonical version", () => {
    const r = inspectProductionMode({ state: stateWith({}), runDir: "deck_root", sourceMarker: { branch: HTML, issues: [] } });
    expect(r.code).toBe("RUN_VERSION_INVALID");
  });

  it("rejects noncanonical state shapes without throwing", () => {
    expect(inspectProductionMode({ state: null, runVersion: "v1", sourceMarker: { branch: HTML, issues: [] } }).code).toBe("MODE_MISSING");
    expect(inspectProductionMode({ state: { production_mode: "x" }, runVersion: "v1", sourceMarker: { branch: HTML, issues: [] } }).code).toBe("MODE_MISSING");
    expect(inspectProductionMode({ state: { production_mode: { by_version: [] } }, runVersion: "v1", sourceMarker: { branch: HTML, issues: [] } }).code).toBe("MODE_MISSING");
  });
});

describe("classifyProductionModeTransition", () => {
  it("allows html-only <-> html-then-image2 as an atomic same-pipeline transition", () => {
    const a = classifyProductionModeTransition({ fromMode: "html-only", toMode: "html-then-image2" });
    expect(a).toMatchObject({ ok: true, kind: "same-pipeline", allowed: true, pipeline: HTML });
    const b = classifyProductionModeTransition({ fromMode: "html-then-image2", toMode: "html-only" });
    expect(b).toMatchObject({ ok: true, kind: "same-pipeline", allowed: true, pipeline: HTML });
  });

  it("rejects every html-* <-> image2-only pair as cross-pipeline transition_required", () => {
    for (const [from, to] of [
      ["html-only", "image2-only"],
      ["image2-only", "html-only"],
      ["html-then-image2", "image2-only"],
      ["image2-only", "html-then-image2"],
    ]) {
      const r = classifyProductionModeTransition({ fromMode: from, toMode: to });
      expect(r).toMatchObject({ ok: false, kind: "cross-pipeline", allowed: false, code: "transition_required" });
      expect(r.from_pipeline).not.toBe(r.to_pipeline);
    }
  });

  it("treats from===to as an idempotent no-op", () => {
    for (const mode of PRODUCTION_MODES) {
      const r = classifyProductionModeTransition({ fromMode: mode, toMode: mode });
      expect(r).toMatchObject({ ok: true, kind: "no-op", allowed: true });
    }
  });

  it("flags sourcePipeline mismatch even within an allowed transition", () => {
    const r = classifyProductionModeTransition({
      fromMode: "html-only",
      toMode: "html-then-image2",
      sourcePipeline: WHOLE_PAGE,
    });
    expect(r.ok).toBe(false);
    expect(r.code).toBe("transition_required");
  });

  it("validates sourcePipeline when it matches the shared pipeline", () => {
    const r = classifyProductionModeTransition({
      fromMode: "html-only",
      toMode: "html-then-image2",
      sourcePipeline: HTML,
    });
    expect(r.ok).toBe(true);
    expect(r.source_checked).toBe(true);
  });

  it("fails closed for invalid from/to modes", () => {
    expect(classifyProductionModeTransition({ fromMode: "html", toMode: "html-only" }).code).toBe("INVALID_FROM_MODE");
    expect(classifyProductionModeTransition({ fromMode: "html-only", toMode: "html" }).code).toBe("INVALID_TO_MODE");
    expect(classifyProductionModeTransition({ fromMode: null, toMode: null }).code).toBe("INVALID_FROM_MODE");
  });
});

describe("explicit whole-page marker", () => {
  it("the policy and marker helper agree on whole-page-image2-v1", () => {
    const policy = productionPolicyForMode("image2-only");
    expect(policy.pipeline).toBe(WHOLE_PAGE);
    const resolved = productionModeFromSourceMarker({ branch: WHOLE_PAGE, issues: [] });
    expect(resolved).toMatchObject({ mode: "image2-only", pipeline: WHOLE_PAGE });
  });
});
