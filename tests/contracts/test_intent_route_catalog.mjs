import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import * as catalogModule from "../../PPTMAKER_FRAMEWORK/scripts/shared/workflow/intent_route_catalog.mjs";
import {
  INTENT_ROUTE_CATALOG_SCHEMA,
  readIntentRouteCatalog,
  validateIntentRouteCatalog,
} from "../../PPTMAKER_FRAMEWORK/scripts/shared/workflow/intent_route_catalog.mjs";

const FRAMEWORK = "PPTMAKER_FRAMEWORK";
const CATALOG_PATH = join(FRAMEWORK, "playbook", "intent-routes-v1.json");
const TERMINAL_ROUTE = "orientation-unrouted-intent";
const ROUTE_IDS = [
  "foundation-local-runtime",
  "foundation-provider-readiness",
  "foundation-channel-probe",
  "work-new",
  "work-resume",
  "work-change",
  "work-change-text",
  "work-change-visual",
  "work-change-notes",
  "work-change-structure",
  "orientation-locate-run",
  "orientation-diagnostic",
  "orientation-env-recovery",
  TERMINAL_ROUTE,
].sort();
const ROUTE_FIELDS = [
  "entry",
  "fallback",
  "first_safe_step",
  "id",
  "kind",
  "required_context",
  "risk_boundary",
  "visibility",
].sort();
const KINDS = new Set(["foundation", "work", "orientation"]);
const RISK_BOUNDARIES = new Set([
  "no-remote",
  "confirm-live-diagnostic",
  "owner-issued-authorization",
]);
const LEAF_PLAYBOOKS = new Map([
  ["work-change-text", "edit-text.md"],
  ["work-change-visual", "edit-visual.md"],
  ["work-change-notes", "edit-notes.md"],
  ["work-change-structure", "restructure-slides.md"],
]);

function readCatalog() {
  return JSON.parse(readFileSync(CATALOG_PATH, "utf8"));
}

function assertFallbacksTerminate(routesById) {
  for (const route of routesById.values()) {
    const seen = new Set();
    let current = route;
    while (current.fallback !== null) {
      expect(seen.has(current.id), `fallback cycle from ${route.id}`).toBe(false);
      seen.add(current.id);
      current = routesById.get(current.fallback);
      expect(current, `missing fallback from ${route.id}`).toBeDefined();
    }
    expect(current.id, `fallback terminal from ${route.id}`).toBe(TERMINAL_ROUTE);
  }
}

function frameworkTextFiles(directory, files = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) frameworkTextFiles(path, files);
    else if (entry.isFile() && /\.(?:mjs|md|json)$/u.test(entry.name) && statSync(path).size < 2_000_000) files.push(path);
  }
  return files;
}

describe("intent route catalog", () => {
  it("defines the closed, discovery-only public catalog", () => {
    expect(existsSync(CATALOG_PATH), CATALOG_PATH).toBe(true);
    const catalog = readCatalog();
    expect(readIntentRouteCatalog()).toEqual(catalog);
    expect(INTENT_ROUTE_CATALOG_SCHEMA).toBe(catalog.schema);
    expect(Object.keys(catalog).sort()).toEqual(["routes", "schema"]);
    expect(catalog.schema).toBe("pptmaker-intent-routes-v1");
    expect(Array.isArray(catalog.routes)).toBe(true);
    expect(catalog.routes.map(({ id }) => id).sort()).toEqual(ROUTE_IDS);

    const routesById = new Map(catalog.routes.map((route) => [route.id, route]));
    expect(routesById.size).toBe(ROUTE_IDS.length);
    for (const route of catalog.routes) {
      expect(Object.keys(route).sort(), route.id).toEqual(ROUTE_FIELDS);
      expect(typeof route.id).toBe("string");
      expect(route.id).toMatch(/^[a-z][a-z0-9-]*$/);
      expect(KINDS.has(route.kind), route.id).toBe(true);
      expect(Array.isArray(route.required_context), route.id).toBe(true);
      expect(new Set(route.required_context).size, route.id).toBe(route.required_context.length);
      for (const token of route.required_context) expect(token, route.id).toMatch(/^[a-z][a-z0-9-]*$/);
      expect(typeof route.entry, route.id).toBe("string");
      expect(route.entry.trim(), route.id).not.toBe("");
      expect(typeof route.first_safe_step, route.id).toBe("string");
      expect(route.first_safe_step.trim(), route.id).not.toBe("");
      expect(RISK_BOUNDARIES.has(route.risk_boundary), route.id).toBe(true);
      expect(typeof route.visibility, route.id).toBe("boolean");
      expect(route.visibility, route.id).toBe(true);
      expect(route.fallback === null || typeof route.fallback === "string", route.id).toBe(true);

      // The catalog labels a discovery handoff; it cannot encode executable
      // grammar, credentials/grants, hashes, or a lifecycle state sequence.
      const discoveryLabels = [route.entry, route.first_safe_step, ...route.required_context].join(" ");
      expect(discoveryLabels, route.id).not.toMatch(/(?:\bppt_flow\b|\bnode\b|--[a-z]|\bsha(?:256)?\b|\bhash\b|\bgrant\b|\bauthoriz(?:e|ation)\b|\s->\s)/i);
    }

    expect(routesById.get(TERMINAL_ROUTE)?.fallback).toBeNull();
    expect(catalog.routes.filter((route) => route.fallback === null).map(({ id }) => id)).toEqual([TERMINAL_ROUTE]);
    assertFallbacksTerminate(routesById);

    for (const [routeId, playbook] of LEAF_PLAYBOOKS) {
      expect(routesById.get(routeId)?.entry).toContain("playbook");
      expect(existsSync(join(FRAMEWORK, "playbook", playbook)), `${routeId} -> ${playbook}`).toBe(true);
    }
  });

  it("rejects malformed static catalog data without exposing an execution seam", () => {
    const catalog = readCatalog();
    expect(() => validateIntentRouteCatalog({ ...catalog, extra: true })).toThrow("INTENT_ROUTE_CATALOG_INVALID");
    expect(() => validateIntentRouteCatalog({
      ...catalog,
      routes: catalog.routes.map((route) => route.id === "work-change" ? { ...route, fallback: "work-change" } : route),
    })).toThrow("INTENT_ROUTE_CATALOG_INVALID");
    expect(() => validateIntentRouteCatalog({
      ...catalog,
      routes: catalog.routes.map((route) => route.id === "work-new" ? { ...route, first_safe_step: "node ppt_flow.mjs init" } : route),
    })).toThrow("INTENT_ROUTE_CATALOG_INVALID");
    expect(Object.keys(catalogModule).sort()).toEqual([
      "INTENT_ROUTE_CATALOG_SCHEMA",
      "readIntentRouteCatalog",
      "validateIntentRouteCatalog",
    ]);
  });

  it("keeps intent routing Agent-owned, exact-run-bound, and non-persistent", () => {
    const catalog = readCatalog();
    const routesById = new Map(catalog.routes.map((route) => [route.id, route]));
    expect(routesById.get("work-change")).toMatchObject({
      required_context: ["exact-run"],
      entry: "change classifier",
      first_safe_step: "classify requested change",
      fallback: "orientation-locate-run",
    });
    expect(routesById.get("work-resume")).toMatchObject({
      required_context: ["exact-run"],
      entry: "resume inspection",
      first_safe_step: "inspect exact run",
      fallback: "orientation-locate-run",
    });
    expect(routesById.get("foundation-provider-readiness")).toMatchObject({
      required_context: ["exact-run", "selected-operation"],
      entry: "foundation readiness",
      first_safe_step: "establish applicable owner readiness",
    });

    const agentContract = readFileSync(join(FRAMEWORK, "charter", "AGENT_CONTRACT.md"), "utf8");
    const classifier = readFileSync(join(FRAMEWORK, "playbook", "classify-change.md"), "utf8");
    const discovery = `${agentContract}\n${classifier}`;
    expect(discovery).toMatch(/explicit requested change\s*->\s*classify-change/i);
    expect(discovery).toMatch(/otherwise resume\s*->\s*state --json\s*->\s*workflow_inspection\.primary_action/i);
    expect(discovery).toMatch(/without an\s+exact run[\s\S]{0,280}RUN_BUNDLE\.md/i);
    expect(discovery).toMatch(/do not scan\s+`?deck_\*`?|never scan\s+`?deck_\*`?/i);
    expect(discovery).toMatch(/doctor --run-dir <run-dir> --operation raw-generation/i);
    expect(discovery).toMatch(/direct\s+`?env-check`?[\s\S]{0,180}(?:pre-install|unavailable\s+main entry)/i);
    expect(discovery).toMatch(/Route Gap[\s\S]{0,220}(?:no persistent record|does not write|non-persistent)/i);

    const persistenceTokens = frameworkTextFiles(FRAMEWORK)
      .filter((path) => /(?:scripts|playbook|charter)\//u.test(path))
      .filter((path) => readFileSync(path, "utf8").includes("selected_route_id"));
    expect(persistenceTokens).toEqual([]);
  });

  it("renders common requests for novices without protocol mechanics", () => {
    const commands = readFileSync(join(FRAMEWORK, "COMMANDS.md"), "utf8");
    const tableStart = commands.indexOf("## Common Requests");
    const tableEnd = commands.indexOf("## What Stays Safe");
    const commonRequests = commands.slice(tableStart, tableEnd);
    expect(tableStart).toBeGreaterThan(-1);
    expect(tableEnd).toBeGreaterThan(tableStart);
    expect(commonRequests).toContain("| You can ask |");
    expect(commonRequests).toContain("| What you get |");
    expect(commonRequests).toContain("| Your meaningful decision |");
    expect(commonRequests).toContain("| Typical timing |");
    expect((commonRequests.match(/^\|/gm) || []).length).toBeGreaterThanOrEqual(12);
    expect(commonRequests).toMatch(/setup|make a presentation|continue this presentation|I am stuck/i);
    expect(commonRequests).toMatch(/short local work|human decision|provider-variable work/i);
    expect(commonRequests).not.toMatch(/(?:foundation-local-runtime|work-change|orientation-|ppt_flow|\bnode\b|--[a-z]|\bsha(?:256)?\b|\bhash\b|\bgrant\b|lifecycle)/i);
  });
});
