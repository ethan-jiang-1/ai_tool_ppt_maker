import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { TextDecoder } from "node:util";
import { isAlias, isMap, isScalar, parseDocument } from "yaml";

import { canonicalJsonSha256 } from "../identity/canonical_json.mjs";
import {
  deckRoot,
  image2ProviderProfileAsset,
  image2ProviderProfileOverrideAsset,
} from "../run-bundle/bundle_layout.mjs";
import { isPageImageVersionDir } from "../run-bundle/page_image_paths.mjs";
import { isImage2ProviderProfileId } from "./runtime_profile_id.mjs";

export const IMAGE2_PROVIDER_PROFILE_SCHEMA = "pptmaker-image2-provider-profile";
export const IMAGE2_PROVIDER_OPERATIONS = Object.freeze([
  "style-master-text-generation",
  "page-image-reference-generation",
]);
export const IMAGE2_PROMPT_BUDGET_UNITS = Object.freeze([
  "unicode-code-points",
  "utf16-code-units",
  "utf8-bytes",
]);
export const IMAGE2_PROVIDER_PROMPT_SAFETY_MAX_UTF8_BYTES = 32_768;
export const PAGE_IMAGE_OPERATION = "page-image-reference-generation";
export const DEFAULT_PAGE_IMAGE_TRANSPORT = Object.freeze({
  http_operation: "generations",
  encoding: "json",
  width: 2000,
  height: 1125,
  dimension_multiple: 1,
  completion: "async-poll",
});

const OPERATION_SET = new Set(IMAGE2_PROVIDER_OPERATIONS);
const UNIT_SET = new Set(IMAGE2_PROMPT_BUDGET_UNITS);
const PAGE_IMAGE_TRANSPORT_KEYS = Object.freeze([
  "http_operation",
  "encoding",
  "width",
  "height",
  "dimension_multiple",
  "completion",
]);
const UTF8_DECODER = new TextDecoder("utf-8", { fatal: true });

export class Image2ProviderProfileError extends Error {
  constructor(code, message, { source = null } = {}) {
    super(message);
    this.name = "Image2ProviderProfileError";
    this.code = code;
    if (source !== null) this.source = source;
  }
}

export class Image2PromptBudgetError extends Error {
  constructor(code, message, { measurement = null } = {}) {
    super(message);
    this.name = "Image2PromptBudgetError";
    this.code = code;
    if (measurement !== null) this.measurement = measurement;
  }
}

function failProfile(code, message, options = undefined) {
  throw new Image2ProviderProfileError(code, message, options);
}

function exactKeys(value, keys) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)) &&
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function freeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const entry of Object.values(value)) freeze(entry);
  return Object.freeze(value);
}

function sourceLocator(deckDir, sourcePath) {
  const root = resolve(deckDir);
  const relation = relative(root, sourcePath).split(sep).join("/");
  return relation && !relation.startsWith("../") && relation !== ".." ? relation : null;
}

function assertConfinedRegularFile(deckDir, sourcePath, source) {
  let stat;
  try {
    stat = lstatSync(sourcePath);
  } catch (error) {
    if (error?.code === "ENOENT") failProfile("image2_provider_profile_missing", "Image2 provider profile source is missing", { source });
    failProfile("image2_provider_profile_unreadable", "Image2 provider profile source is unreadable", { source });
  }
  if (!stat.isFile() || stat.isSymbolicLink()) {
    failProfile("image2_provider_profile_unsafe", "Image2 provider profile source must be a confined regular file", { source });
  }
  let realRunDir;
  let realSource;
  try {
    realRunDir = realpathSync(deckDir);
    realSource = realpathSync(sourcePath);
  } catch {
    failProfile("image2_provider_profile_unreadable", "Image2 provider profile source is unreadable", { source });
  }
  const relation = relative(realRunDir, realSource);
  if (!relation || relation === ".." || relation.startsWith(`..${sep}`) || isAbsolute(relation)) {
    failProfile("image2_provider_profile_unsafe", "Image2 provider profile source escapes its Run Bundle", { source });
  }
}

function directYamlNode(node) {
  if (node === null || node === undefined) return true;
  if (isAlias(node)) return false;
  if (node.anchor || node.tag) return false;
  if (isScalar(node)) return true;
  if (!isMap(node)) return false;
  return node.items.every((pair) => isScalar(pair.key) && typeof pair.key.value === "string" &&
    pair.key.value !== "<<" && !pair.key.anchor && !pair.key.tag && directYamlNode(pair.value));
}

function parseDirectYaml(bytes, source) {
  let text;
  try {
    text = UTF8_DECODER.decode(bytes);
  } catch {
    failProfile("image2_provider_profile_utf8_invalid", "Image2 provider profile source must be valid UTF-8", { source });
  }
  let document;
  try {
    document = parseDocument(text, { merge: false, prettyErrors: false, strict: true, uniqueKeys: true });
  } catch {
    failProfile("image2_provider_profile_yaml_invalid", "Image2 provider profile source must use direct YAML mappings and scalars", { source });
  }
  if (document.errors.length > 0 || document.warnings.length > 0 || document.directives?.yaml?.explicit || !directYamlNode(document.contents)) {
    failProfile("image2_provider_profile_yaml_invalid", "Image2 provider profile source must use direct YAML mappings and scalars", { source });
  }
  const value = document.toJS({ mapAsMap: false, maxAliasCount: 0 });
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    failProfile("image2_provider_profile_shape_invalid", "Image2 provider profile source must be one mapping", { source });
  }
  return value;
}

function pendingProfile(value, source) {
  if (!exactKeys(value, ["schema", "profile_id", "endpoint_profile", "owner_declaration", "operations"]) ||
    value.schema !== IMAGE2_PROVIDER_PROFILE_SCHEMA || value.profile_id !== null || value.endpoint_profile !== null ||
    !exactKeys(value.owner_declaration, ["authority", "status"]) ||
    value.owner_declaration.authority !== "deck-author" || value.owner_declaration.status !== "pending" ||
    !exactKeys(value.operations, IMAGE2_PROVIDER_OPERATIONS) ||
    IMAGE2_PROVIDER_OPERATIONS.some((operation) => value.operations[operation] !== null)) {
    return false;
  }
  failProfile("image2_provider_profile_pending", "Image2 provider profile declaration is pending", { source });
}

export function isLegalPageImageTransport(value) {
  if (!exactKeys(value, PAGE_IMAGE_TRANSPORT_KEYS)) return false;
  const pairingOk = (value.http_operation === "generations" && value.encoding === "json")
    || (value.http_operation === "edits" && value.encoding === "multipart");
  return pairingOk
    && Number.isSafeInteger(value.width) && value.width > 0
    && Number.isSafeInteger(value.height) && value.height > 0
    && (value.dimension_multiple === 1 || value.dimension_multiple === 16)
    && value.width % value.dimension_multiple === 0
    && value.height % value.dimension_multiple === 0
    && (value.completion === "sync" || value.completion === "async-poll");
}

export function pageImageTransportRequestSize(transport) {
  return `${transport.width}x${transport.height}`;
}

function resolvePageImageTransport(value, source) {
  const resolved = value === undefined ? DEFAULT_PAGE_IMAGE_TRANSPORT : value;
  if (!isLegalPageImageTransport(resolved)) {
    failProfile("image2_provider_profile_shape_invalid", "Image2 provider profile has an invalid operation declaration", { source });
  }
  return freeze({
    http_operation: resolved.http_operation,
    encoding: resolved.encoding,
    width: resolved.width,
    height: resolved.height,
    dimension_multiple: resolved.dimension_multiple,
    completion: resolved.completion,
  });
}

function validateOperation(operation, value, source) {
  const isPageImage = operation === PAGE_IMAGE_OPERATION;
  const keys = isPageImage && Object.hasOwn(value || {}, "transport")
    ? ["route_id", "model", "prompt_budget", "transport"]
    : ["route_id", "model", "prompt_budget"];
  if (!OPERATION_SET.has(operation) || !exactKeys(value, keys) ||
    (!isPageImage && Object.hasOwn(value || {}, "transport")) ||
    !isImage2ProviderProfileId(value.route_id) || typeof value.model !== "string" || !value.model.trim() ||
    !exactKeys(value.prompt_budget, ["limit", "unit"]) ||
    !Number.isSafeInteger(value.prompt_budget.limit) || value.prompt_budget.limit <= 0 ||
    !UNIT_SET.has(value.prompt_budget.unit)) {
    failProfile("image2_provider_profile_shape_invalid", "Image2 provider profile has an invalid operation declaration", { source });
  }
  const resolved = {
    operation,
    route_id: value.route_id,
    model: value.model,
    prompt_budget: freeze({ limit: value.prompt_budget.limit, unit: value.prompt_budget.unit }),
  };
  if (isPageImage) resolved.transport = resolvePageImageTransport(value.transport, source);
  return freeze(resolved);
}

function confirmedProfile(value, source) {
  if (!exactKeys(value, ["schema", "profile_id", "endpoint_profile", "owner_declaration", "operations"]) ||
    value.schema !== IMAGE2_PROVIDER_PROFILE_SCHEMA || !isImage2ProviderProfileId(value.profile_id) ||
    !isImage2ProviderProfileId(value.endpoint_profile) || !exactKeys(value.owner_declaration, ["authority", "status"]) ||
    value.owner_declaration.authority !== "deck-author" || value.owner_declaration.status !== "confirmed" ||
    !exactKeys(value.operations, IMAGE2_PROVIDER_OPERATIONS)) {
    return false;
  }
  const operations = {};
  for (const operation of IMAGE2_PROVIDER_OPERATIONS) operations[operation] = validateOperation(operation, value.operations[operation], source);
  const normalized = {
    schema: IMAGE2_PROVIDER_PROFILE_SCHEMA,
    profile_id: value.profile_id,
    endpoint_profile: value.endpoint_profile,
    owner_declaration: { authority: "deck-author", status: "confirmed" },
    operations,
  };
  return freeze({ ...normalized, profile_sha256: canonicalJsonSha256(normalized) });
}

function selectProfileSource(runDir, deckDir) {
  const overridePath = image2ProviderProfileOverrideAsset(runDir);
  const overrideLocator = sourceLocator(deckDir, overridePath);
  try {
    lstatSync(overridePath);
    return { path: overridePath, source: overrideLocator };
  } catch (error) {
    if (error?.code !== "ENOENT") return { path: overridePath, source: overrideLocator };
  }
  const backbonePath = image2ProviderProfileAsset(runDir);
  return { path: backbonePath, source: sourceLocator(deckDir, backbonePath) };
}

export function resolveImage2ProviderProfile(runDir) {
  const resolvedRunDir = resolve(runDir || "");
  const root = deckRoot(resolvedRunDir);
  if (!runDir || !isPageImageVersionDir(resolvedRunDir)) {
    failProfile("image2_provider_profile_run_invalid", "Image2 provider profile requires an exact Run Bundle");
  }
  const selected = selectProfileSource(resolvedRunDir, root);
  assertConfinedRegularFile(root, selected.path, selected.source);
  let bytes;
  try {
    bytes = readFileSync(selected.path);
  } catch {
    failProfile("image2_provider_profile_unreadable", "Image2 provider profile source is unreadable", { source: selected.source });
  }
  const value = parseDirectYaml(bytes, selected.source);
  pendingProfile(value, selected.source);
  const profile = confirmedProfile(value, selected.source);
  if (!profile) {
    failProfile("image2_provider_profile_shape_invalid", "Image2 provider profile must be the exact pending or confirmed shape", { source: selected.source });
  }
  return profile;
}

export function selectImage2ProviderOperation(profile, operation) {
  if (!profile || typeof profile !== "object" || !OPERATION_SET.has(operation) || !profile.operations?.[operation]) {
    failProfile("image2_provider_profile_operation_invalid", "Image2 provider profile does not declare the required operation");
  }
  const selected = profile.operations[operation];
  const selectedOperation = {
    profile_id: profile.profile_id,
    profile_sha256: profile.profile_sha256,
    endpoint_profile: profile.endpoint_profile,
    route_id: selected.route_id,
    operation,
    model: selected.model,
    prompt_budget: freeze({ ...selected.prompt_budget }),
  };
  if (selected.transport) selectedOperation.transport = freeze({ ...selected.transport });
  return freeze(selectedOperation);
}

export function evaluateImage2PromptBudget({ prompt, operationProfile } = {}) {
  const bytes = Buffer.isBuffer(prompt) || prompt instanceof Uint8Array
    ? Buffer.from(prompt)
    : typeof prompt === "string"
      ? Buffer.from(prompt, "utf8")
      : null;
  if (!bytes || bytes.length === 0) {
    throw new Image2PromptBudgetError("image2_prompt_invalid", "Image2 prompt budget requires exact nonempty UTF-8 bytes");
  }
  let text;
  try {
    text = UTF8_DECODER.decode(bytes);
  } catch {
    throw new Image2PromptBudgetError("image2_prompt_utf8_invalid", "Image2 prompt budget requires valid UTF-8 bytes");
  }
  if (!operationProfile || typeof operationProfile !== "object" || !OPERATION_SET.has(operationProfile.operation) ||
    !Number.isSafeInteger(operationProfile.prompt_budget?.limit) || operationProfile.prompt_budget.limit <= 0 ||
    !UNIT_SET.has(operationProfile.prompt_budget.unit)) {
    throw new Image2PromptBudgetError("image2_prompt_budget_invalid", "Image2 prompt budget requires one validated operation profile");
  }
  if (bytes.length > IMAGE2_PROVIDER_PROMPT_SAFETY_MAX_UTF8_BYTES) {
    throw new Image2PromptBudgetError("image2_prompt_safety_overflow", "Image2 prompt exceeds the Harness UTF-8 safety ceiling");
  }
  const { limit, unit } = operationProfile.prompt_budget;
  const measured = unit === "utf8-bytes"
    ? bytes.length
    : unit === "utf16-code-units"
      ? text.length
      : Array.from(text).length;
  const measurement = freeze({ operation: operationProfile.operation, limit, unit, measured });
  if (measured > limit) {
    throw new Image2PromptBudgetError("image2_prompt_budget_overflow", "Image2 prompt exceeds the declared operation budget", { measurement });
  }
  return freeze({ utf8_bytes: bytes.length, measurement });
}
