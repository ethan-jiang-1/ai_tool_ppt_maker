import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { isAlias, isMap, isScalar, isSeq, parseDocument } from "yaml";
import { canonicalJsonSha256 } from "../../contracts/canonical_json.mjs";
import {
  normalizePageImageVisualClause,
  resolvePageImageVisualLanguageSelection,
} from "./page_image_visual_language.mjs";

export const PAGE_IMAGE_REFERENCE_REGISTRY_SCHEMA = "pptmaker-image2-reference-registry";
export const PAGE_IMAGE_REFERENCE_ROOT = "2_backbone/visual-style/assets/reference";
export const AMBER_AGENT_MODEL_SHEET_SHA256 = "f71a7ed8ec8f69e10ffbe2997e81f123d46515b5608de61afc155d6b3ed6c756";

const LOWER_KEBAB_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SHA256_RE = /^[a-f0-9]{64}$/;
const RESTRICTIONS = Object.freeze(["none", "no-generic-metal-robot", "no-identity-subject"]);
const PROFILE_KEYS = Object.freeze([
  "subject_class",
  "maximum_identity_subjects",
  "compatible_restrictions",
  "incompatible_restrictions",
  "roles",
]);
const ROLE_KEYS = Object.freeze(["reference_path", "reference_sha256", "role_clause"]);

export class PageImageReferenceMaterialError extends Error {
  constructor(issues) {
    const list = Array.isArray(issues) ? issues : [issues];
    super(list.map((item) => item.message || String(item)).join("; "));
    this.name = "PageImageReferenceMaterialError";
    this.issues = Object.freeze([...list]);
  }
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

function problem(code, message, { path, actual, expected } = {}) {
  return {
    code,
    message,
    ...(path ? { path } : {}),
    ...(actual !== undefined ? { actual } : {}),
    ...(expected !== undefined ? { expected } : {}),
  };
}

function directYaml(node) {
  if (!node) return true;
  if (isAlias(node) || node.anchor || node.tag) return false;
  if (isMap(node)) return node.items.every((pair) => directYaml(pair.key) && directYaml(pair.value));
  if (isSeq(node)) return node.items.every((item) => directYaml(item));
  return true;
}

function plainString(node) {
  return isScalar(node) && node.type === "PLAIN" && !node.anchor && !node.tag && typeof node.value === "string";
}

function exactMap(node, expected, context, issues) {
  if (!isMap(node) || !directYaml(node)) {
    issues.push(problem("invalid_reference_mapping", `${context} must be a direct untagged mapping`, { path: context }));
    return new Map();
  }
  const found = new Map();
  for (const pair of node.items) {
    if (!plainString(pair.key)) {
      issues.push(problem("invalid_reference_key", `${context} keys must be direct unquoted strings`, { path: context }));
      continue;
    }
    const key = pair.key.value;
    if (!expected.includes(key)) {
      issues.push(problem("unknown_reference_key", `${context} contains unknown key ${JSON.stringify(key)}`, { path: context, actual: key, expected }));
      continue;
    }
    if (found.has(key)) {
      issues.push(problem("duplicate_reference_key", `${context} repeats key ${JSON.stringify(key)}`, { path: context, actual: key }));
      continue;
    }
    found.set(key, pair.value);
  }
  for (const key of expected) if (!found.has(key)) issues.push(problem("missing_reference_key", `${context} is missing ${key}`, { path: context, expected: key }));
  return found;
}

function parseString(node, context, issues, { id = false, sha = false, visualClause = false } = {}) {
  if (!plainString(node)) {
    issues.push(problem("invalid_reference_scalar", `${context} must be an unquoted direct scalar`, { path: context }));
    return null;
  }
  const value = node.value;
  if (id && !LOWER_KEBAB_ID.test(value)) {
    issues.push(problem("invalid_reference_id", `${context} must be a lower-kebab ID`, { path: context, actual: value }));
    return null;
  }
  if (sha && !SHA256_RE.test(value)) {
    issues.push(problem("invalid_reference_sha256", `${context} must be a lowercase SHA-256`, { path: context, actual: value }));
    return null;
  }
  if (visualClause) {
    try {
      return normalizePageImageVisualClause(value, { context });
    } catch (error) {
      issues.push(problem(error.code || "invalid_reference_role_clause", error.message, { path: context, actual: value }));
      return null;
    }
  }
  return value;
}

function parseRestrictionSequence(node, context, issues) {
  if (!isSeq(node) || node.anchor || node.tag) {
    issues.push(problem("invalid_reference_sequence", `${context} must be an ordered sequence`, { path: context }));
    return [];
  }
  const result = [];
  const seen = new Set();
  for (const item of node.items) {
    const value = parseString(item, context, issues);
    if (!value) continue;
    if (!RESTRICTIONS.includes(value)) issues.push(problem("invalid_reference_restriction", `${context} contains unsupported restriction ${JSON.stringify(value)}`, { path: context, actual: value, expected: RESTRICTIONS }));
    if (seen.has(value)) issues.push(problem("duplicate_reference_restriction", `${context} repeats ${JSON.stringify(value)}`, { path: context, actual: value }));
    seen.add(value);
    result.push(value);
  }
  return result;
}

function parseRoles(node, context, issues) {
  if (!isMap(node) || !directYaml(node)) {
    issues.push(problem("invalid_reference_roles", `${context} must be a direct mapping of role IDs`, { path: context }));
    return {};
  }
  const roles = {};
  for (const pair of node.items) {
    const roleId = parseString(pair.key, `${context} role ID`, issues, { id: true });
    if (!roleId) continue;
    const role = exactMap(pair.value, ROLE_KEYS, `${context}.${roleId}`, issues);
    const referencePath = parseString(role.get("reference_path"), `${context}.${roleId}.reference_path`, issues);
    const referenceSha = parseString(role.get("reference_sha256"), `${context}.${roleId}.reference_sha256`, issues, { sha: true });
    const roleClause = parseString(role.get("role_clause"), `${context}.${roleId}.role_clause`, issues, { visualClause: true });
    if (
      !referencePath
      || isAbsolute(referencePath)
      || referencePath.includes("\\")
      || referencePath.includes("/")
      || referencePath === "model-sheet.png"
      || !/^[a-z0-9]+(?:-[a-z0-9]+)*\.png$/.test(referencePath)
    ) {
      issues.push(problem("invalid_reference_path", `${context}.${roleId}.reference_path must name one clean PNG inside its profile directory`, { path: `${context}.${roleId}.reference_path`, actual: referencePath }));
    }
    roles[roleId] = {
      reference_path: referencePath,
      reference_sha256: referenceSha,
      role_clause: roleClause,
      role_clause_sha256: roleClause ? sha256(roleClause) : null,
    };
  }
  if (Object.keys(roles).length === 0) issues.push(problem("empty_reference_roles", `${context} must register at least one clean provider role`, { path: context }));
  return roles;
}

function parseProfiles(node, issues) {
  if (!isMap(node) || !directYaml(node)) {
    issues.push(problem("invalid_reference_profiles", "profiles must be a direct mapping of profile IDs", { path: "profiles" }));
    return {};
  }
  const profiles = {};
  for (const pair of node.items) {
    const profileId = parseString(pair.key, "profiles profile ID", issues, { id: true });
    if (!profileId) continue;
    const profile = exactMap(pair.value, PROFILE_KEYS, `profiles.${profileId}`, issues);
    const subjectClass = parseString(profile.get("subject_class"), `profiles.${profileId}.subject_class`, issues, { id: true });
    const maximum = profile.get("maximum_identity_subjects");
    const maximumSubjects = isScalar(maximum) && maximum.type === "PLAIN" && !maximum.anchor && !maximum.tag && Number.isInteger(maximum.value)
      ? maximum.value : null;
    if (maximumSubjects !== 1) issues.push(problem("invalid_reference_subject_limit", `profiles.${profileId}.maximum_identity_subjects must equal 1`, { path: `profiles.${profileId}.maximum_identity_subjects`, actual: maximum?.value, expected: 1 }));
    const compatible = parseRestrictionSequence(profile.get("compatible_restrictions"), `profiles.${profileId}.compatible_restrictions`, issues);
    const incompatible = parseRestrictionSequence(profile.get("incompatible_restrictions"), `profiles.${profileId}.incompatible_restrictions`, issues);
    for (const restriction of compatible) {
      if (incompatible.includes(restriction)) issues.push(problem("overlapping_reference_restriction", `profiles.${profileId} lists ${restriction} as both compatible and incompatible`, { path: `profiles.${profileId}` }));
    }
    profiles[profileId] = {
      subject_class: subjectClass,
      maximum_identity_subjects: maximumSubjects,
      compatible_restrictions: compatible,
      incompatible_restrictions: incompatible,
      roles: parseRoles(profile.get("roles"), `profiles.${profileId}.roles`, issues),
    };
  }
  if (Object.keys(profiles).length === 0) issues.push(problem("empty_reference_profiles", "profiles must register at least one profile", { path: "profiles" }));
  return profiles;
}

export function parsePageImageReferenceMaterial(raw, { expectedProfile = null } = {}) {
  let document;
  try {
    document = parseDocument(raw, { version: "1.2", schema: "core", uniqueKeys: true, merge: false, keepSourceTokens: true });
  } catch (error) {
    throw new PageImageReferenceMaterialError(problem("invalid_reference_yaml", error.message));
  }
  const issues = [...document.errors, ...document.warnings].map((error) => problem("invalid_reference_yaml", error.message.split("\n")[0]));
  const root = exactMap(document.contents, ["schema", "profiles"], "reference registry", issues);
  const schema = parseString(root.get("schema"), "reference registry.schema", issues);
  if (schema !== PAGE_IMAGE_REFERENCE_REGISTRY_SCHEMA) issues.push(problem("invalid_reference_schema", `reference registry.schema must equal ${PAGE_IMAGE_REFERENCE_REGISTRY_SCHEMA}`, { actual: schema, expected: PAGE_IMAGE_REFERENCE_REGISTRY_SCHEMA }));
  const profiles = parseProfiles(root.get("profiles"), issues);
  if (expectedProfile && (Object.keys(profiles).length !== 1 || !Object.hasOwn(profiles, expectedProfile))) {
    issues.push(problem("reference_profile_location_mismatch", `a registry under ${expectedProfile} must declare only that profile`, { actual: Object.keys(profiles), expected: expectedProfile }));
  }
  if (issues.length > 0) throw new PageImageReferenceMaterialError(issues);
  return deepFreeze({ schema, profiles });
}

function profileDirectory(deckDir, profileId) {
  if (!LOWER_KEBAB_ID.test(profileId || "")) throw new PageImageReferenceMaterialError(problem("invalid_reference_id", "profile ID must be a lower-kebab ID", { actual: profileId }));
  const root = resolve(deckDir, PAGE_IMAGE_REFERENCE_ROOT);
  const directory = resolve(root, profileId);
  const relation = relative(root, directory);
  if (!relation || relation.startsWith(`..${sep}`) || relation === ".." || isAbsolute(relation)) {
    throw new PageImageReferenceMaterialError(problem("reference_path_escape", "profile directory escapes the Page Image reference root", { actual: profileId }));
  }
  return directory;
}

function verifyAmberModelSheet(profileId, directory) {
  if (profileId !== "amber-agent") return;
  const path = resolve(directory, "model-sheet.png");
  if (!existsSync(path)) throw new PageImageReferenceMaterialError(problem("missing_model_sheet", "amber-agent doctrine model sheet is missing", { path }));
  const actual = sha256(readFileSync(path));
  if (actual !== AMBER_AGENT_MODEL_SHEET_SHA256) {
    throw new PageImageReferenceMaterialError(problem("amber_model_sheet_sha_mismatch", "amber-agent doctrine model sheet checksum differs from the verified reference source", { path, actual, expected: AMBER_AGENT_MODEL_SHEET_SHA256 }));
  }
}

/** Load the sole selected profile registry, never an HTML catalog or version override. */
export function loadPageImageReferenceMaterial(deckDir, profileId) {
  if (typeof deckDir !== "string" || !deckDir) throw new TypeError("deckDir must be a non-empty path");
  const directory = profileDirectory(deckDir, profileId);
  const path = resolve(directory, "image2-reference-material.yaml");
  let raw;
  try {
    raw = new TextDecoder("utf-8", { fatal: true }).decode(readFileSync(path));
  } catch (error) {
    throw new PageImageReferenceMaterialError(problem("reference_registry_unavailable", `could not read Page Image image2 reference registry: ${error.message}`, { path }));
  }
  const material = parsePageImageReferenceMaterial(raw, { expectedProfile: profileId });
  verifyAmberModelSheet(profileId, directory);
  return deepFreeze({ ...material, profile_directory: directory });
}

/** Resolve one source identity to verified provider bytes and a path-free raw projection. */
export function resolvePageImageIdentityReference({ deckDir, identity, identity_subject_count, subject_restrictions } = {}) {
  if (!identity || typeof identity !== "object" || Array.isArray(identity)) throw new TypeError("identity must be a parsed {profile, role} pair");
  const profileId = identity.profile;
  const roleId = identity.role;
  if (!LOWER_KEBAB_ID.test(profileId || "") || !LOWER_KEBAB_ID.test(roleId || "")) {
    throw new PageImageReferenceMaterialError(problem("invalid_reference_identity", "identity profile and role must be lower-kebab IDs", { actual: identity }));
  }
  const material = loadPageImageReferenceMaterial(deckDir, profileId);
  const profile = material.profiles[profileId];
  const role = profile?.roles?.[roleId];
  if (!profile) throw new PageImageReferenceMaterialError(problem("unregistered_identity_profile", `VISUAL IDENTITY selects unregistered profile ${JSON.stringify(profileId)}`, { actual: profileId }));
  if (!role) throw new PageImageReferenceMaterialError(problem("unregistered_identity_role", `VISUAL IDENTITY selects unregistered role ${JSON.stringify(roleId)}`, { actual: roleId }));
  if (identity_subject_count !== "one" || identity_subject_count > profile.maximum_identity_subjects) {
    throw new PageImageReferenceMaterialError(problem("identity_subject_count_incompatible", `profile ${JSON.stringify(profileId)} permits exactly one identity subject`, { actual: identity_subject_count, expected: "one" }));
  }
  if (!RESTRICTIONS.includes(subject_restrictions) || profile.incompatible_restrictions.includes(subject_restrictions) || !profile.compatible_restrictions.includes(subject_restrictions)) {
    throw new PageImageReferenceMaterialError(problem("identity_restriction_incompatible", `profile ${JSON.stringify(profileId)} is incompatible with ${JSON.stringify(subject_restrictions)}`, { actual: subject_restrictions, expected: profile.compatible_restrictions }));
  }
  const referencePath = resolve(material.profile_directory, role.reference_path);
  const relation = relative(material.profile_directory, referencePath);
  if (relation.startsWith(`..${sep}`) || relation === ".." || isAbsolute(relation) || !existsSync(referencePath)) {
    throw new PageImageReferenceMaterialError(problem("reference_path_escape", "selected role reference is unavailable outside its profile directory", { actual: role.reference_path }));
  }
  const actualSha = sha256(readFileSync(referencePath));
  if (actualSha !== role.reference_sha256) {
    throw new PageImageReferenceMaterialError(problem("reference_sha_mismatch", `selected role ${JSON.stringify(roleId)} does not match its registered bytes`, { actual: actualSha, expected: role.reference_sha256 }));
  }
  const projection = {
    profile: profileId,
    role: roleId,
    reference_sha256: actualSha,
    role_clause_sha256: role.role_clause_sha256,
    subject_class: profile.subject_class,
    identity_subject_count,
    subject_restrictions,
  };
  return deepFreeze({
    projection,
    provider_reference: { path: referencePath, sha256: actualSha, role_clause: role.role_clause },
  });
}

/** Compose identity and visual-language resolution without giving content-parsing a filesystem dependency. */
export function createPageImageSourceResolver({ deckDir, visualLanguage } = {}) {
  if (!visualLanguage) throw new TypeError("visualLanguage must be a parsed Page Image visual language registry");
  return Object.freeze({
    resolveSelection(context) {
      const identity = context.identity
        ? resolvePageImageIdentityReference({
          deckDir,
          identity: context.identity,
          identity_subject_count: context.identity_subject_count,
          subject_restrictions: context.subject_restrictions,
        })
        : null;
      const visualLanguageResolution = resolvePageImageVisualLanguageSelection(visualLanguage, {
        ...context,
        identity_subject_class: identity?.projection.subject_class,
      });
      return deepFreeze({
        ...visualLanguageResolution,
        identity_reference: identity ? {
          projection: identity.projection,
          provider_reference: identity.provider_reference,
        } : null,
      });
    },
  });
}

export function identityReferenceProjectionSha256(projection) {
  return canonicalJsonSha256(projection);
}
