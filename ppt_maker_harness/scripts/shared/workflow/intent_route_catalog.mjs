/**
 * Static discovery catalog reader. Agent language interpretation and every
 * lifecycle handoff remain outside this module and outside the CLI runtime.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const INTENT_ROUTE_CATALOG_SCHEMA = "pptmaker-intent-routes";

const CATALOG_PATH = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "playbook", "intent-routes.json");
const TERMINAL_ROUTE_ID = "orientation-unrouted-intent";
const ROUTE_FIELDS = [
  "id",
  "kind",
  "required_context",
  "entry",
  "first_safe_step",
  "risk_boundary",
  "fallback",
  "visibility",
].sort();
const INITIAL_ROUTE_IDS = new Set([
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
  TERMINAL_ROUTE_ID,
]);
const KINDS = new Set(["foundation", "work", "orientation"]);
const RISK_BOUNDARIES = new Set(["no-remote", "confirm-live-diagnostic", "owner-issued-authorization"]);
const CONTEXT_TOKEN = /^[a-z][a-z0-9-]*$/;
const ROUTE_ID = /^[a-z][a-z0-9-]*$/;
const DISCOVERY_IMPLEMENTATION_TEXT = /(?:\bppt_flow\b|\bnode\b|--[a-z]|\bsha(?:256)?\b|\bhash\b|\bgrant\b|\bauthoriz(?:e|ation)\b|\s->\s)/i;

function invalid(message) {
  throw new Error(`INTENT_ROUTE_CATALOG_INVALID: ${message}`);
}

function exactKeys(value, keys, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid(`${label} must be an object`);
  if (Object.keys(value).sort().join("\n") !== keys.join("\n")) invalid(`${label} has an unsupported field shape`);
}

function requireDiscoveryLabel(value, field, id) {
  if (typeof value !== "string" || !value.trim()) invalid(`${id}.${field} must be a non-empty discovery label`);
  if (DISCOVERY_IMPLEMENTATION_TEXT.test(value)) invalid(`${id}.${field} contains implementation grammar`);
  return value;
}

function validateFallbackGraph(routesById) {
  for (const route of routesById.values()) {
    const seen = new Set();
    let current = route;
    while (current.fallback !== null) {
      if (seen.has(current.id)) invalid(`fallback cycle begins at ${route.id}`);
      seen.add(current.id);
      current = routesById.get(current.fallback);
      if (!current) invalid(`${route.id} has an unknown fallback`);
    }
    if (current.id !== TERMINAL_ROUTE_ID) invalid(`${route.id} does not terminate at Route Gap`);
  }
}

/** Validate the checked-in, closed discovery data without selecting a route. */
export function validateIntentRouteCatalog(value) {
  exactKeys(value, ["routes", "schema"], "catalog");
  if (value.schema !== INTENT_ROUTE_CATALOG_SCHEMA) invalid("schema is unsupported");
  if (!Array.isArray(value.routes) || value.routes.length !== INITIAL_ROUTE_IDS.size) invalid("routes must be the closed initial inventory");

  const routesById = new Map();
  for (const route of value.routes) {
    exactKeys(route, ROUTE_FIELDS, "route");
    if (typeof route.id !== "string" || !ROUTE_ID.test(route.id) || !INITIAL_ROUTE_IDS.has(route.id) || routesById.has(route.id)) {
      invalid("route IDs must be unique members of the initial inventory");
    }
    if (!KINDS.has(route.kind)) invalid(`${route.id}.kind is unsupported`);
    if (!Array.isArray(route.required_context) || new Set(route.required_context).size !== route.required_context.length || route.required_context.some((token) => typeof token !== "string" || !CONTEXT_TOKEN.test(token))) {
      invalid(`${route.id}.required_context is invalid`);
    }
    requireDiscoveryLabel(route.entry, "entry", route.id);
    requireDiscoveryLabel(route.first_safe_step, "first_safe_step", route.id);
    if (!RISK_BOUNDARIES.has(route.risk_boundary)) invalid(`${route.id}.risk_boundary is unsupported`);
    if (typeof route.visibility !== "boolean" || route.visibility !== true) invalid(`${route.id}.visibility must remain public`);
    if (route.fallback !== null && (typeof route.fallback !== "string" || !INITIAL_ROUTE_IDS.has(route.fallback))) invalid(`${route.id}.fallback is invalid`);
    if (route.fallback === null && route.id !== TERMINAL_ROUTE_ID) invalid("only Route Gap may terminate discovery");
    routesById.set(route.id, Object.freeze({ ...route, required_context: Object.freeze([...route.required_context]) }));
  }
  if (routesById.size !== INITIAL_ROUTE_IDS.size || [...INITIAL_ROUTE_IDS].some((id) => !routesById.has(id))) invalid("initial route inventory is incomplete");
  if (routesById.get(TERMINAL_ROUTE_ID)?.fallback !== null) invalid("Route Gap must terminate discovery");
  validateFallbackGraph(routesById);
  return Object.freeze({ schema: value.schema, routes: Object.freeze([...routesById.values()]) });
}

/** Read and validate static catalog data for documentation or contract checks. */
export function readIntentRouteCatalog(path = CATALOG_PATH) {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    invalid(`cannot read catalog: ${error.message}`);
  }
  return validateIntentRouteCatalog(parsed);
}
