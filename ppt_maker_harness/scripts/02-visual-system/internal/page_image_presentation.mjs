import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { isAlias, isMap, isScalar, isSeq, parseDocument, stringify } from "yaml";

import { canonicalJsonSha256 } from "../../contracts/canonical_json.mjs";
import { PROBLEM_OWNER, attachProblemFacts, toProblemFacts } from "../../shared/diagnostic/problem_fact.mjs";
import {
  BACKBONE_DIR,
  BACKBONE_STYLE_SUBDIR,
  FRAMED_HEADER_PROFILES_FILE,
  OVERRIDES_SUBDIR,
  PAGE_CLASS_CATALOG_FILE,
  PAGE_IMAGE_CLASSES,
  PAGE_IMAGE_DECK_DEFAULTS_FILE,
  PAGE_IMAGE_PRESENTATION_SUBDIR,
  PURE_DECK_VISUAL_SYSTEM_FILE,
  pageImagePresentationAsset,
} from "../../shared/run-bundle/bundle_layout.mjs";
import { parsePureDeckVisualProfile } from "./pure_deck_visual_system.mjs";
import {
  PAGE_IMAGE_PRESENTATION_ARTIFACT_ROLE,
  PAGE_IMAGE_PRESENTATION_SCHEMA,
  hasCurrentPageImagePresentationEnvelope,
} from "../../shared/page-image/page_image_presentation_envelope.mjs";

export {
  PAGE_IMAGE_PRESENTATION_ARTIFACT_ROLE,
  PAGE_IMAGE_PRESENTATION_SCHEMA,
  hasCurrentPageImagePresentationEnvelope,
};
export const PAGE_IMAGE_PRESENTATION_FILES = Object.freeze([
  PAGE_CLASS_CATALOG_FILE,
  PAGE_IMAGE_DECK_DEFAULTS_FILE,
  PURE_DECK_VISUAL_SYSTEM_FILE,
  FRAMED_HEADER_PROFILES_FILE,
]);

const WORKFLOWS = Object.freeze(["framed", "pure"]);
const HEADER_FIELDS = Object.freeze(["kicker", "title", "subtitle"]);
const PAGE_CLASS_CATALOG_SCHEMA = "pptmaker-page-image-class-catalog";
const PAGE_IMAGE_DECK_DEFAULTS_SCHEMA = "pptmaker-page-image-deck-defaults";
const PURE_DECK_VISUAL_SYSTEM_SCHEMA = "pptmaker-pure-deck-visual-system";
const FRAMED_HEADER_PROFILES_SCHEMA = "pptmaker-framed-header-profiles";
const PROFILE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class PageImagePresentationError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "PageImagePresentationError";
    this.code = code;
    this.details = Object.freeze({ ...details });
    this.issues = Object.freeze([{ code, message, ...details }]);
    attachProblemFacts(this, toProblemFacts([{
      code,
      message,
      source: details.source || null,
      ...(details.field ? { subject: { field: details.field } } : {}),
    }], { owner: PROBLEM_OWNER.PRESENTATION }));
  }
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function exactKeys(value, keys, label) {
  if (!isRecord(value) || Object.keys(value).length !== keys.length || !keys.every((key) => Object.hasOwn(value, key))) {
    throw new PageImagePresentationError("page_image_presentation_shape_invalid", `${label} must contain exactly ${keys.join(", ")}`);
  }
  return value;
}

function directYaml(node) {
  if (!node) return true;
  if (isAlias(node) || node.anchor || node.tag) return false;
  if (isMap(node)) return node.items.every((pair) => directYaml(pair.key) && directYaml(pair.value));
  if (isSeq(node)) return node.items.every((item) => directYaml(item));
  return true;
}

function isWithin(root, candidate) {
  const relation = relative(root, candidate);
  return relation === "" || (!relation.startsWith(`..${sep}`) && relation !== ".." && !isAbsolute(relation));
}

function selectedSourcePath(runDir, filename) {
  if (typeof runDir !== "string" || !runDir) throw new TypeError("runDir must be a non-empty path");
  const resolvedRunDir = resolve(runDir);
  const deckDir = resolve(resolvedRunDir, "..", "..");
  const relativePath = join(BACKBONE_STYLE_SUBDIR, PAGE_IMAGE_PRESENTATION_SUBDIR, filename);
  const overridePath = resolve(resolvedRunDir, OVERRIDES_SUBDIR, relativePath);
  const backbonePath = resolve(deckDir, BACKBONE_DIR, relativePath);
  const sourcePath = resolve(pageImagePresentationAsset(resolvedRunDir, filename));
  if (sourcePath !== overridePath && sourcePath !== backbonePath) {
    throw new PageImagePresentationError("page_image_presentation_source_path_invalid", "Page Image presentation source must resolve through the canonical override-or-backbone path", { actual: sourcePath });
  }
  const ownerDir = sourcePath === overridePath ? resolvedRunDir : deckDir;
  return { sourcePath, ownerDir, presentationDir: dirname(sourcePath) };
}

function readConfinedSource(runDir, filename) {
  const selected = selectedSourcePath(runDir, filename);
  let stat;
  try {
    stat = lstatSync(selected.sourcePath);
  } catch (error) {
    throw new PageImagePresentationError("page_image_presentation_source_missing", `Page Image presentation source is unavailable: ${filename}`, { source: selected.sourcePath, actual: error.code });
  }
  if (!stat.isFile()) {
    throw new PageImagePresentationError("page_image_presentation_source_invalid", `Page Image presentation source must be one regular file: ${filename}`, { source: selected.sourcePath });
  }
  let ownerReal;
  let presentationReal;
  let sourceReal;
  try {
    ownerReal = realpathSync.native(selected.ownerDir);
    presentationReal = realpathSync.native(selected.presentationDir);
    sourceReal = realpathSync.native(selected.sourcePath);
  } catch (error) {
    throw new PageImagePresentationError("page_image_presentation_source_unavailable", `Page Image presentation source cannot be resolved safely: ${filename}`, { source: selected.sourcePath, actual: error.code });
  }
  if (!isWithin(ownerReal, presentationReal) || sourceReal !== join(presentationReal, filename)) {
    throw new PageImagePresentationError("page_image_presentation_source_escape", `Page Image presentation source escapes its selected owner: ${filename}`, { source: selected.sourcePath });
  }
  try {
    return { raw: new TextDecoder("utf-8", { fatal: true }).decode(readFileSync(selected.sourcePath)), sourcePath: selected.sourcePath };
  } catch (error) {
    throw new PageImagePresentationError("page_image_presentation_source_unreadable", `Page Image presentation source is not valid UTF-8: ${filename}`, { source: selected.sourcePath, actual: error.code });
  }
}

function parseSourceDocument({ raw, sourcePath }, filename, schema, keys) {
  let document;
  try {
    document = parseDocument(raw, { version: "1.2", schema: "core", uniqueKeys: true, merge: false, keepSourceTokens: true });
  } catch (error) {
    throw new PageImagePresentationError("page_image_presentation_yaml_invalid", `${filename} could not be parsed`, { source: sourcePath });
  }
  if (document.errors.length || document.warnings.length || !directYaml(document.contents)) {
    throw new PageImagePresentationError("page_image_presentation_yaml_invalid", `${filename} must be direct YAML without aliases, tags, anchors, or warnings`, { source: sourcePath });
  }
  const value = document.toJS();
  exactKeys(value, keys, filename);
  if (value.schema !== schema || Object.hasOwn(value, "revision") || Object.hasOwn(value, "version")) {
    throw new PageImagePresentationError("page_image_presentation_schema_invalid", `${filename} must declare the unversioned ${schema} schema`, { source: sourcePath, expected: schema, actual: value.schema });
  }
  return { value, sourcePath };
}

function requiredProfileId(value, label) {
  if (typeof value !== "string" || !PROFILE_ID.test(value)) {
    throw new PageImagePresentationError("page_image_presentation_profile_invalid", `${label} must be a lower-kebab profile identifier`, { actual: value });
  }
  return value;
}

function validateCatalog(document) {
  const { value } = document;
  if (value.default !== "standard" || !isRecord(value.classes) ||
    Object.keys(value.classes).length !== PAGE_IMAGE_CLASSES.length ||
    !PAGE_IMAGE_CLASSES.every((pageClass) => Object.hasOwn(value.classes, pageClass))) {
    throw new PageImagePresentationError("page_image_presentation_catalog_invalid", "page-class catalog must define the closed classes with default standard", { source: document.sourcePath });
  }
  const classes = {};
  for (const pageClass of PAGE_IMAGE_CLASSES) {
    const binding = exactKeys(value.classes[pageClass], WORKFLOWS, `classes.${pageClass}`);
    classes[pageClass] = { pure: requiredProfileId(binding.pure, `classes.${pageClass}.pure`), framed: requiredProfileId(binding.framed, `classes.${pageClass}.framed`) };
  }
  return deepFreeze({ default: value.default, classes });
}

function validateDeckDefaults(document) {
  const { value } = document;
  if (!isRecord(value.typography) || !isRecord(value.colour_roles) ||
    Object.keys(value.typography).length !== 1 || !Object.hasOwn(value.typography, "density") ||
    !["compact", "balanced", "generous"].includes(value.typography.density) ||
    Object.keys(value.colour_roles).length !== 4 ||
    !["primary_text", "secondary_text", "accent", "surface"].every((key) => Object.hasOwn(value.colour_roles, key)) ||
    value.colour_roles.primary_text === value.colour_roles.secondary_text ||
    value.colour_roles.accent !== "accent" || value.colour_roles.surface !== "neutral") {
    throw new PageImagePresentationError("page_image_presentation_defaults_invalid", "deck defaults must provide typography density and colour roles", { source: document.sourcePath });
  }
  return deepFreeze({ typography: { ...value.typography }, colour_roles: { ...value.colour_roles } });
}

function validatePureProfiles(document, catalog) {
  if (!isRecord(document.value.profiles) || Object.keys(document.value.profiles).length === 0) {
    throw new PageImagePresentationError("page_image_presentation_pure_profiles_invalid", "Pure presentation source must provide profiles", { source: document.sourcePath });
  }
  const expectedProfileIds = new Set(PAGE_IMAGE_CLASSES.map((pageClass) => catalog.classes[pageClass].pure));
  if (Object.keys(document.value.profiles).length !== expectedProfileIds.size ||
    Object.keys(document.value.profiles).some((profileId) => !expectedProfileIds.has(profileId))) {
    throw new PageImagePresentationError("page_image_presentation_pure_profiles_invalid", "Pure presentation profiles must exactly match catalog bindings", { source: document.sourcePath });
  }
  const profiles = {};
  for (const profileId of expectedProfileIds) {
    const profile = document.value.profiles[profileId];
    if (!isRecord(profile)) {
      throw new PageImagePresentationError("page_image_presentation_pure_profile_missing", `Pure profile ${profileId} is missing`, { source: document.sourcePath });
    }
    try {
      profiles[profileId] = parsePureDeckVisualProfile(stringify(profile), { source: document.sourcePath });
    } catch (error) {
      throw new PageImagePresentationError("page_image_presentation_pure_profile_invalid", error.message, { source: document.sourcePath, profile_id: profileId });
    }
  }
  return deepFreeze(profiles);
}

function finitePositive(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function validateFramedProfile(profile, profileId, source) {
  exactKeys(profile, ["permitted_fields", "canvas", "font_families", "theme", "header_region", "fields"], `Framed profile ${profileId}`);
  if (!Array.isArray(profile.permitted_fields) || profile.permitted_fields.length === 0 ||
    new Set(profile.permitted_fields).size !== profile.permitted_fields.length ||
    !profile.permitted_fields.includes("title") || profile.permitted_fields.some((field) => !HEADER_FIELDS.includes(field))) {
    throw new PageImagePresentationError("page_image_presentation_framed_profile_invalid", `Framed profile ${profileId} has an invalid permitted header field set`, { source, profile_id: profileId });
  }
  exactKeys(profile.canvas, ["css_width", "css_height", "capture_width", "capture_height"], `Framed profile ${profileId}.canvas`);
  if (!Object.values(profile.canvas).every(finitePositive)) {
    throw new PageImagePresentationError("page_image_presentation_framed_profile_invalid", `Framed profile ${profileId} canvas must use positive dimensions`, { source, profile_id: profileId });
  }
  if (!Array.isArray(profile.font_families) || profile.font_families.length === 0 || profile.font_families.some((value) => typeof value !== "string" || !value)) {
    throw new PageImagePresentationError("page_image_presentation_framed_profile_invalid", `Framed profile ${profileId} needs direct font families`, { source, profile_id: profileId });
  }
  exactKeys(profile.theme, ["text", "muted_text", "kicker", "contrast"], `Framed profile ${profileId}.theme`);
  exactKeys(profile.theme.contrast, ["kind", "color", "opacity", "offset_x", "offset_y", "blur"], `Framed profile ${profileId}.theme.contrast`);
  if (![profile.theme.text, profile.theme.muted_text, profile.theme.kicker, profile.theme.contrast.color].every((value) => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)) ||
    profile.theme.contrast.kind !== "text-shadow" || !Number.isFinite(profile.theme.contrast.opacity) || profile.theme.contrast.opacity <= 0 || profile.theme.contrast.opacity > 0.6 ||
    ![profile.theme.contrast.offset_x, profile.theme.contrast.offset_y, profile.theme.contrast.blur].every(Number.isFinite)) {
    throw new PageImagePresentationError("page_image_presentation_framed_profile_invalid", `Framed profile ${profileId} has invalid minimal contrast facts`, { source, profile_id: profileId });
  }
  if (!isRecord(profile.header_region) || !isRecord(profile.fields)) {
    throw new PageImagePresentationError("page_image_presentation_framed_profile_invalid", `Framed profile ${profileId} has invalid geometry facts`, { source, profile_id: profileId });
  }
  exactKeys(profile.header_region, ["x", "y", "width", "height"], `Framed profile ${profileId}.header_region`);
  const headerRegion = profile.header_region;
  if (![headerRegion.x, headerRegion.y, headerRegion.width, headerRegion.height].every(Number.isFinite) ||
    headerRegion.x < 0 || headerRegion.y < 0 || headerRegion.width <= 0 || headerRegion.height <= 0 ||
    headerRegion.x + headerRegion.width > profile.canvas.css_width || headerRegion.y + headerRegion.height >= profile.canvas.css_height) {
    throw new PageImagePresentationError("page_image_presentation_framed_profile_invalid", `Framed profile ${profileId} has an invalid header region`, { source, profile_id: profileId });
  }
  for (const field of HEADER_FIELDS) {
    exactKeys(profile.fields[field], ["x", "y", "width", "height", "font_size", "line_height", "weight", "color", "max_lines"], `Framed profile ${profileId}.fields.${field}`);
    const facts = profile.fields[field];
    if (![facts.x, facts.y, facts.width, facts.height, facts.font_size, facts.line_height, facts.weight, facts.max_lines].every(finitePositive) ||
      typeof facts.color !== "string" || !/^#[0-9a-f]{6}$/i.test(facts.color) || facts.x + facts.width > profile.canvas.css_width || facts.y + facts.height > profile.canvas.css_height) {
      throw new PageImagePresentationError("page_image_presentation_framed_profile_invalid", `Framed profile ${profileId} has an invalid ${field} local field`, { source, profile_id: profileId });
    }
    if (profile.permitted_fields.includes(field) && (facts.x < headerRegion.x || facts.y < headerRegion.y || facts.x + facts.width > headerRegion.x + headerRegion.width || facts.y + facts.height > headerRegion.y + headerRegion.height)) {
      throw new PageImagePresentationError("page_image_presentation_framed_profile_invalid", `Framed profile ${profileId} has a permitted ${field} field outside its header region`, { source, profile_id: profileId });
    }
  }
}

function protectedComposition(profile) {
  const reservedHeader = Object.freeze({
    x: profile.header_region.x / profile.canvas.css_width,
    y: profile.header_region.y / profile.canvas.css_height,
    width: profile.header_region.width / profile.canvas.css_width,
    height: profile.header_region.height / profile.canvas.css_height,
  });
  return Object.freeze({
    coordinate_space: "normalized-canvas",
    reserved_header: reservedHeader,
    body_safe: Object.freeze({
      x: 0,
      y: reservedHeader.y + reservedHeader.height,
      width: 1,
      height: 1 - reservedHeader.y - reservedHeader.height,
    }),
  });
}

function validateFramedProfiles(document, catalog) {
  if (!isRecord(document.value.profiles) || Object.keys(document.value.profiles).length === 0) {
    throw new PageImagePresentationError("page_image_presentation_framed_profiles_invalid", "Framed presentation source must provide profiles", { source: document.sourcePath });
  }
  const expectedProfileIds = new Set(PAGE_IMAGE_CLASSES.map((pageClass) => catalog.classes[pageClass].framed));
  if (Object.keys(document.value.profiles).length !== expectedProfileIds.size ||
    Object.keys(document.value.profiles).some((profileId) => !expectedProfileIds.has(profileId))) {
    throw new PageImagePresentationError("page_image_presentation_framed_profiles_invalid", "Framed presentation profiles must exactly match catalog bindings", { source: document.sourcePath });
  }
  const profiles = {};
  for (const profileId of expectedProfileIds) {
    const profile = document.value.profiles[profileId];
    validateFramedProfile(profile, profileId, document.sourcePath);
    profiles[profileId] = deepFreeze({ id: profileId, ...profile });
  }
  return deepFreeze(profiles);
}

/** Load and validate the complete selected version Page Image presentation package. */
export function loadPageImagePresentationPackage(runDir) {
  const catalogDocument = parseSourceDocument(readConfinedSource(runDir, PAGE_CLASS_CATALOG_FILE), PAGE_CLASS_CATALOG_FILE, PAGE_CLASS_CATALOG_SCHEMA, ["schema", "default", "classes"]);
  const defaultsDocument = parseSourceDocument(readConfinedSource(runDir, PAGE_IMAGE_DECK_DEFAULTS_FILE), PAGE_IMAGE_DECK_DEFAULTS_FILE, PAGE_IMAGE_DECK_DEFAULTS_SCHEMA, ["schema", "typography", "colour_roles"]);
  const pureDocument = parseSourceDocument(readConfinedSource(runDir, PURE_DECK_VISUAL_SYSTEM_FILE), PURE_DECK_VISUAL_SYSTEM_FILE, PURE_DECK_VISUAL_SYSTEM_SCHEMA, ["schema", "profiles"]);
  const framedDocument = parseSourceDocument(readConfinedSource(runDir, FRAMED_HEADER_PROFILES_FILE), FRAMED_HEADER_PROFILES_FILE, FRAMED_HEADER_PROFILES_SCHEMA, ["schema", "profiles"]);
  const catalog = validateCatalog(catalogDocument);
  const defaults = validateDeckDefaults(defaultsDocument);
  const pureProfiles = validatePureProfiles(pureDocument, catalog);
  const framedProfiles = validateFramedProfiles(framedDocument, catalog);
  return deepFreeze({
    catalog,
    defaults,
    pure_profiles: pureProfiles,
    framed_profiles: framedProfiles,
    sources: {
      catalog: catalogDocument.sourcePath,
      defaults: defaultsDocument.sourcePath,
      pure: pureDocument.sourcePath,
      framed: framedDocument.sourcePath,
    },
  });
}

/** Resolve one class and workflow to the only allowed presentation projection. */
export function resolvePageImagePresentation({ package: presentationPackage, workflow, pageClass = "standard", headerPolicy = null } = {}) {
  if (!presentationPackage || typeof presentationPackage !== "object") throw new TypeError("a validated Page Image presentation package is required");
  if (!WORKFLOWS.includes(workflow)) throw new PageImagePresentationError("page_image_presentation_workflow_invalid", "presentation workflow must be framed or pure", { actual: workflow });
  if (!PAGE_IMAGE_CLASSES.includes(pageClass)) throw new PageImagePresentationError("page_image_presentation_class_invalid", "presentation page class is not supported", { actual: pageClass, expected: PAGE_IMAGE_CLASSES });
  const profileId = presentationPackage.catalog.classes[pageClass][workflow];
  const profile = workflow === "pure" ? presentationPackage.pure_profiles[profileId] : presentationPackage.framed_profiles[profileId];
  if (!profile) throw new PageImagePresentationError("page_image_presentation_profile_missing", `selected ${workflow} profile is unavailable`, { page_class: pageClass, profile_id: profileId });
  if (workflow === "framed" && headerPolicy?.local_header) {
    for (const field of HEADER_FIELDS) {
      if (headerPolicy.local_header[field] !== null && !profile.permitted_fields.includes(field)) {
        throw new PageImagePresentationError("page_image_presentation_header_field_forbidden", `PAGE CLASS ${pageClass} does not permit a Framed ${field} literal; repair Page Source`, { page_class: pageClass, profile_id: profileId, field });
      }
    }
  }
  const binding = {
    schema: PAGE_IMAGE_PRESENTATION_SCHEMA,
    artifact_role: PAGE_IMAGE_PRESENTATION_ARTIFACT_ROLE,
    workflow,
    page_class: pageClass,
    profile_id: profileId,
    defaults: presentationPackage.defaults,
    profile,
    ...(workflow === "framed" ? { protected_composition: protectedComposition(profile) } : {}),
  };
  return deepFreeze({
    ...binding,
    provenance: {
      defaults: presentationPackage.sources.defaults,
      profile: workflow === "pure" ? presentationPackage.sources.pure : presentationPackage.sources.framed,
      catalog: presentationPackage.sources.catalog,
    },
    binding_sha256: canonicalJsonSha256(binding),
  });
}
