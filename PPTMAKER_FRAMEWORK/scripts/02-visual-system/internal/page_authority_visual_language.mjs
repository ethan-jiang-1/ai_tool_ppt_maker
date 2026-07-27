import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isAlias, isMap, isScalar, isSeq, parseDocument } from "yaml";
import { canonicalJsonSha256 } from "../../contracts/canonical_json.mjs";

export const PAGE_AUTHORITY_VISUAL_LANGUAGE_SCHEMA = "pptmaker-page-authority-visual-language-v1";
export const PAGE_AUTHORITY_TEXT_GUARD = "page-authority-text-guard-v1";
export const PAGE_AUTHORITY_VISUAL_LANGUAGE_RELATIVE_PATH = "2_backbone/visual-style/page-authority-visual-language.yaml";

export const PAGE_AUTHORITY_TEXT_GUARD_FORBIDDEN_TOKENS = Object.freeze([
  "annotation", "annotations", "banner", "banners", "callout", "callouts", "caption", "captions",
  "chart", "charts", "headline", "headlines", "label", "labels", "legend", "legends", "letter",
  "letters", "logo", "logos", "placard", "placards", "poster", "posters", "quote", "quotes",
  "readable", "sign", "signs", "subtitle", "subtitles", "table", "tables", "text", "title", "titles",
  "typography", "watermark", "watermarks", "word", "words", "write", "writing", "written",
]);
export const PAGE_AUTHORITY_TEXT_GUARD_FORBIDDEN_PAIRS = Object.freeze([
  ["speech", "bubble"], ["thought", "bubble"], ["page", "number"], ["source", "note"],
  ["hand", "written"], ["hand", "lettering"], ["text", "label"], ["diagram", "label"], ["axis", "label"],
].map((pair) => Object.freeze(pair)));

const AUTHORITIES = Object.freeze(["pure-image2", "framed-image2"]);
const SUBJECT_CLASSES = Object.freeze(["none", "amber-light-form"]);
const LOWER_KEBAB_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CHARACTER_GRAMMAR = "[a-z0-9 ,;:()./-]";
const TOP_LEVEL_KEYS = Object.freeze(["schema", "revision", "text_guard", "recipes", "compositions", "motifs"]);
const RECIPE_KEYS = Object.freeze(["provider_clause", "authorities", "composition_ids", "motif_ids", "identity_subject_classes"]);
const COMPOSITION_KEYS = Object.freeze(["provider_clause", "authorities", "min_motifs", "max_motifs"]);
const MOTIF_KEYS = Object.freeze(["provider_clause", "authorities", "recipe_ids", "composition_ids"]);

export class PageAuthorityVisualLanguageError extends Error {
  constructor(issues) {
    const list = Array.isArray(issues) ? issues : [issues];
    super(list.map((issue) => issue.message || String(issue)).join("; "));
    this.name = "PageAuthorityVisualLanguageError";
    this.issues = Object.freeze([...list]);
  }
}

export class PageAuthorityTextGuardError extends Error {
  constructor(code, message, context = "provider clause") {
    super(`${context}: ${message}`);
    this.name = "PageAuthorityTextGuardError";
    this.code = code;
    this.context = context;
  }
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

function issue(code, message, { source, path, actual, expected } = {}) {
  return {
    code,
    message,
    ...(source ? { source } : {}),
    ...(path ? { path } : {}),
    ...(actual !== undefined ? { actual } : {}),
    ...(expected !== undefined ? { expected } : {}),
  };
}

function nodeKind(node) {
  if (isAlias(node)) return "alias";
  if (isMap(node)) return "mapping";
  if (isSeq(node)) return "sequence";
  if (isScalar(node)) return "scalar";
  return "value";
}

function noYamlIndirection(node) {
  if (!node) return true;
  if (isAlias(node) || node.anchor || node.tag) return false;
  if (isMap(node)) return node.items.every((pair) => noYamlIndirection(pair.key) && noYamlIndirection(pair.value));
  if (isSeq(node)) return node.items.every((item) => noYamlIndirection(item));
  return true;
}

function plainString(node) {
  return isScalar(node) && node.type === "PLAIN" && !node.anchor && !node.tag && typeof node.value === "string";
}

function exactMap(node, expectedKeys, context, issues) {
  if (!isMap(node) || !noYamlIndirection(node)) {
    issues.push(issue("invalid_registry_mapping", `${context} must be one direct untagged mapping`, { path: context, actual: nodeKind(node) }));
    return new Map();
  }
  const pairs = new Map();
  for (const pair of node.items) {
    if (!plainString(pair.key)) {
      issues.push(issue("invalid_registry_key", `${context} keys must be unquoted direct strings`, { path: context }));
      continue;
    }
    if (!expectedKeys.includes(pair.key.value)) {
      issues.push(issue("unknown_registry_key", `${context} contains unknown key ${JSON.stringify(pair.key.value)}`, { path: context, actual: pair.key.value, expected: expectedKeys }));
      continue;
    }
    if (pairs.has(pair.key.value)) {
      issues.push(issue("duplicate_registry_key", `${context} repeats key ${JSON.stringify(pair.key.value)}`, { path: context, actual: pair.key.value }));
      continue;
    }
    pairs.set(pair.key.value, pair.value);
  }
  for (const key of expectedKeys) {
    if (!pairs.has(key)) issues.push(issue("missing_registry_key", `${context} is missing ${key}`, { path: context, expected: key }));
  }
  return pairs;
}

function normalizedTextGuardDigest() {
  return canonicalJsonSha256({
    id: PAGE_AUTHORITY_TEXT_GUARD,
    normalization: "ascii-lowercase-v1",
    printable_ascii: "U+0020-U+007E",
    character_grammar: CHARACTER_GRAMMAR,
    forbidden_tokens: PAGE_AUTHORITY_TEXT_GUARD_FORBIDDEN_TOKENS,
    forbidden_pairs: PAGE_AUTHORITY_TEXT_GUARD_FORBIDDEN_PAIRS,
  });
}

export const PAGE_AUTHORITY_TEXT_GUARD_DIGEST = normalizedTextGuardDigest();

/** Validate and normalize one provider-safe clause without performing I/O. */
export function normalizePageAuthorityTextGuard(value, { context = "provider clause" } = {}) {
  if (typeof value !== "string" || value.length === 0) {
    throw new PageAuthorityTextGuardError("empty_clause", "must be a non-empty string", context);
  }
  for (const character of value) {
    const point = character.codePointAt(0);
    if (point < 0x20 || point > 0x7e) {
      throw new PageAuthorityTextGuardError("non_printable_ascii", "must contain printable ASCII characters only", context);
    }
  }
  const normalized = value.toLowerCase();
  if (normalized !== normalized.trim() || normalized.includes("  ")) {
    throw new PageAuthorityTextGuardError("invalid_space", "must not have leading, trailing, or repeated spaces", context);
  }
  if (![...normalized].every((character) => /[a-z0-9 ,;:()./-]/.test(character))) {
    throw new PageAuthorityTextGuardError("invalid_character", `must use only ${CHARACTER_GRAMMAR}`, context);
  }
  const tokens = normalized.match(/[a-z0-9]+/g) || [];
  const forbidden = new Set(PAGE_AUTHORITY_TEXT_GUARD_FORBIDDEN_TOKENS);
  for (const token of tokens) {
    if (forbidden.has(token)) {
      throw new PageAuthorityTextGuardError("forbidden_token", `contains forbidden token ${JSON.stringify(token)}`, context);
    }
  }
  const pairs = new Set(PAGE_AUTHORITY_TEXT_GUARD_FORBIDDEN_PAIRS.map((pair) => pair.join("\u0000")));
  for (let index = 0; index < tokens.length - 1; index += 1) {
    const pair = `${tokens[index]}\u0000${tokens[index + 1]}`;
    if (pairs.has(pair)) {
      throw new PageAuthorityTextGuardError("forbidden_token_pair", `contains forbidden token pair ${JSON.stringify(tokens[index])} ${JSON.stringify(tokens[index + 1])}`, context);
    }
  }
  return normalized;
}

function parseScalar(node, context, issues, { id = false, guard = false, integer = false } = {}) {
  if (!plainString(node)) {
    issues.push(issue("invalid_registry_scalar", `${context} must be one unquoted direct scalar`, { path: context, actual: nodeKind(node) }));
    return null;
  }
  const value = node.value;
  if (id && !LOWER_KEBAB_ID.test(value)) {
    issues.push(issue("invalid_registry_id", `${context} must be a lower-kebab ID`, { path: context, actual: value }));
    return null;
  }
  if (integer) {
    issues.push(issue("invalid_registry_integer", `${context} must be a positive integer`, { path: context, actual: value }));
    return null;
  }
  if (guard) {
    try {
      return normalizePageAuthorityTextGuard(value, { context });
    } catch (error) {
      issues.push(issue(error.code || "invalid_text_guard", error.message, { path: context, actual: value }));
      return null;
    }
  }
  return value;
}

function parseInteger(node, context, issues, { positive = false } = {}) {
  if (!isScalar(node) || node.type !== "PLAIN" || node.anchor || node.tag || !Number.isInteger(node.value)) {
    issues.push(issue("invalid_registry_integer", `${context} must be an integer`, { path: context, actual: node?.value }));
    return null;
  }
  if ((positive && node.value < 1) || (!positive && node.value < 0)) {
    issues.push(issue("invalid_registry_integer", `${context} is out of range`, { path: context, actual: node.value }));
    return null;
  }
  return node.value;
}

function parseEnumSequence(node, context, issues, values, { allowEmpty = false } = {}) {
  if (!isSeq(node) || node.anchor || node.tag) {
    issues.push(issue("invalid_registry_sequence", `${context} must be an ordered YAML sequence`, { path: context, actual: nodeKind(node) }));
    return [];
  }
  const result = [];
  const seen = new Set();
  for (const item of node.items) {
    const value = parseScalar(item, context, issues, { id: values === null });
    if (!value) continue;
    if (values && !values.includes(value)) {
      issues.push(issue("invalid_registry_enum", `${context} contains unsupported value ${JSON.stringify(value)}`, { path: context, actual: value, expected: values }));
    }
    if (seen.has(value)) issues.push(issue("duplicate_registry_value", `${context} repeats ${JSON.stringify(value)}`, { path: context, actual: value }));
    seen.add(value);
    result.push(value);
  }
  if (!allowEmpty && result.length === 0) issues.push(issue("empty_registry_sequence", `${context} must not be empty`, { path: context }));
  return result;
}

function parseRecordMap(node, context, expectedKeys, issues, parseRecord) {
  if (!isMap(node) || !noYamlIndirection(node)) {
    issues.push(issue("invalid_registry_mapping", `${context} must be a direct mapping of lower-kebab IDs`, { path: context, actual: nodeKind(node) }));
    return {};
  }
  const records = {};
  for (const pair of node.items) {
    const id = parseScalar(pair.key, `${context} key`, issues, { id: true });
    if (!id) continue;
    if (Object.hasOwn(records, id)) {
      issues.push(issue("duplicate_registry_id", `${context} repeats ID ${JSON.stringify(id)}`, { path: context, actual: id }));
      continue;
    }
    const map = exactMap(pair.value, expectedKeys, `${context}.${id}`, issues);
    records[id] = parseRecord(map, `${context}.${id}`, issues);
  }
  return records;
}

function parseRecipeRecord(map, context, issues) {
  const providerClause = parseScalar(map.get("provider_clause"), `${context}.provider_clause`, issues, { guard: true });
  const authorities = parseEnumSequence(map.get("authorities"), `${context}.authorities`, issues, AUTHORITIES);
  const compositionIds = parseEnumSequence(map.get("composition_ids"), `${context}.composition_ids`, issues, null);
  const motifIds = parseEnumSequence(map.get("motif_ids"), `${context}.motif_ids`, issues, null, { allowEmpty: true });
  const identitySubjectClasses = parseEnumSequence(map.get("identity_subject_classes"), `${context}.identity_subject_classes`, issues, SUBJECT_CLASSES);
  return {
    provider_clause: providerClause,
    provider_clause_sha256: providerClause ? sha256(providerClause) : null,
    authorities,
    composition_ids: compositionIds,
    motif_ids: motifIds,
    identity_subject_classes: identitySubjectClasses,
  };
}

function parseCompositionRecord(map, context, issues) {
  const providerClause = parseScalar(map.get("provider_clause"), `${context}.provider_clause`, issues, { guard: true });
  const authorities = parseEnumSequence(map.get("authorities"), `${context}.authorities`, issues, AUTHORITIES);
  const minMotifs = parseInteger(map.get("min_motifs"), `${context}.min_motifs`, issues);
  const maxMotifs = parseInteger(map.get("max_motifs"), `${context}.max_motifs`, issues);
  if (minMotifs !== null && maxMotifs !== null && (minMotifs > maxMotifs || maxMotifs > 6)) {
    issues.push(issue("invalid_motif_bounds", `${context} must have 0 <= min_motifs <= max_motifs <= 6`, { path: context }));
  }
  return {
    provider_clause: providerClause,
    provider_clause_sha256: providerClause ? sha256(providerClause) : null,
    authorities,
    min_motifs: minMotifs,
    max_motifs: maxMotifs,
  };
}

function parseMotifRecord(map, context, issues) {
  const providerClause = parseScalar(map.get("provider_clause"), `${context}.provider_clause`, issues, { guard: true });
  const authorities = parseEnumSequence(map.get("authorities"), `${context}.authorities`, issues, AUTHORITIES);
  const recipeIds = parseEnumSequence(map.get("recipe_ids"), `${context}.recipe_ids`, issues, null);
  const compositionIds = parseEnumSequence(map.get("composition_ids"), `${context}.composition_ids`, issues, null);
  return {
    provider_clause: providerClause,
    provider_clause_sha256: providerClause ? sha256(providerClause) : null,
    authorities,
    recipe_ids: recipeIds,
    composition_ids: compositionIds,
  };
}

function verifyCrossReferences(registry, issues) {
  const { recipes, compositions, motifs } = registry;
  for (const [recipeId, recipe] of Object.entries(recipes)) {
    for (const compositionId of recipe.composition_ids) {
      if (!Object.hasOwn(compositions, compositionId)) {
        issues.push(issue("unknown_registry_reference", `recipes.${recipeId}.composition_ids references unknown composition ${JSON.stringify(compositionId)}`, { path: `recipes.${recipeId}.composition_ids`, actual: compositionId }));
      }
    }
    for (const motifId of recipe.motif_ids) {
      const motif = motifs[motifId];
      if (!motif) {
        issues.push(issue("unknown_registry_reference", `recipes.${recipeId}.motif_ids references unknown motif ${JSON.stringify(motifId)}`, { path: `recipes.${recipeId}.motif_ids`, actual: motifId }));
      } else if (!motif.recipe_ids.includes(recipeId)) {
        issues.push(issue("one_sided_registry_compatibility", `recipe ${JSON.stringify(recipeId)} and motif ${JSON.stringify(motifId)} must be mutually compatible`, { path: `recipes.${recipeId}.motif_ids`, actual: motifId }));
      }
    }
  }
  for (const [motifId, motif] of Object.entries(motifs)) {
    for (const recipeId of motif.recipe_ids) {
      const recipe = recipes[recipeId];
      if (!recipe) {
        issues.push(issue("unknown_registry_reference", `motifs.${motifId}.recipe_ids references unknown recipe ${JSON.stringify(recipeId)}`, { path: `motifs.${motifId}.recipe_ids`, actual: recipeId }));
      } else if (!recipe.motif_ids.includes(motifId)) {
        issues.push(issue("one_sided_registry_compatibility", `motif ${JSON.stringify(motifId)} and recipe ${JSON.stringify(recipeId)} must be mutually compatible`, { path: `motifs.${motifId}.recipe_ids`, actual: recipeId }));
      }
    }
    for (const compositionId of motif.composition_ids) {
      if (!Object.hasOwn(compositions, compositionId)) {
        issues.push(issue("unknown_registry_reference", `motifs.${motifId}.composition_ids references unknown composition ${JSON.stringify(compositionId)}`, { path: `motifs.${motifId}.composition_ids`, actual: compositionId }));
      }
    }
  }
}

/** Parse a registry string. Loading and canonical deck-path enforcement are separate. */
export function parsePageAuthorityVisualLanguage(raw, { source = PAGE_AUTHORITY_VISUAL_LANGUAGE_RELATIVE_PATH } = {}) {
  let document;
  try {
    document = parseDocument(raw, {
      version: "1.2",
      schema: "core",
      uniqueKeys: true,
      merge: false,
      keepSourceTokens: true,
    });
  } catch (error) {
    throw new PageAuthorityVisualLanguageError(issue("invalid_registry_yaml", error.message, { source }));
  }
  const issues = [...document.errors, ...document.warnings].map((problem) => issue("invalid_registry_yaml", problem.message.split("\n")[0], { source }));
  const root = exactMap(document.contents, TOP_LEVEL_KEYS, "registry", issues);
  const schema = parseScalar(root.get("schema"), "registry.schema", issues);
  const revision = parseInteger(root.get("revision"), "registry.revision", issues, { positive: true });
  const textGuard = parseScalar(root.get("text_guard"), "registry.text_guard", issues);
  if (schema !== PAGE_AUTHORITY_VISUAL_LANGUAGE_SCHEMA) {
    issues.push(issue("invalid_registry_schema", `registry.schema must equal ${PAGE_AUTHORITY_VISUAL_LANGUAGE_SCHEMA}`, { source, actual: schema, expected: PAGE_AUTHORITY_VISUAL_LANGUAGE_SCHEMA }));
  }
  if (textGuard !== PAGE_AUTHORITY_TEXT_GUARD) {
    issues.push(issue("invalid_text_guard_id", `registry.text_guard must equal ${PAGE_AUTHORITY_TEXT_GUARD}`, { source, actual: textGuard, expected: PAGE_AUTHORITY_TEXT_GUARD }));
  }
  const registry = {
    schema,
    revision,
    text_guard: textGuard,
    text_guard_digest: PAGE_AUTHORITY_TEXT_GUARD_DIGEST,
    audit: { whole_registry_sha256: sha256(raw) },
    recipes: parseRecordMap(root.get("recipes"), "recipes", RECIPE_KEYS, issues, parseRecipeRecord),
    compositions: parseRecordMap(root.get("compositions"), "compositions", COMPOSITION_KEYS, issues, parseCompositionRecord),
    motifs: parseRecordMap(root.get("motifs"), "motifs", MOTIF_KEYS, issues, parseMotifRecord),
  };
  verifyCrossReferences(registry, issues);
  if (issues.length > 0) throw new PageAuthorityVisualLanguageError(issues);
  return deepFreeze(registry);
}

/** Load only the canonical deck-backbone registry, never an override or generated copy. */
export function loadPageAuthorityVisualLanguage(deckDir) {
  if (typeof deckDir !== "string" || !deckDir) throw new TypeError("deckDir must be a non-empty path");
  const path = resolve(deckDir, PAGE_AUTHORITY_VISUAL_LANGUAGE_RELATIVE_PATH);
  let raw;
  try {
    raw = new TextDecoder("utf-8", { fatal: true }).decode(readFileSync(path));
  } catch (error) {
    throw new PageAuthorityVisualLanguageError(issue("registry_unavailable", `could not read Page Authority visual language registry: ${error.message}`, { source: path }));
  }
  return parsePageAuthorityVisualLanguage(raw, { source: PAGE_AUTHORITY_VISUAL_LANGUAGE_RELATIVE_PATH });
}

function selectionIssue(code, message, actual) {
  return issue(code, message, { actual });
}

/**
 * Resolve one source selection using only the trusted registry passed in by the
 * caller. Its semantic digest deliberately excludes unselected records and the
 * registry revision/audit digest.
 */
export function resolvePageAuthorityVisualLanguageSelection(registry, context) {
  if (!registry || typeof registry !== "object") throw new TypeError("registry must be a parsed Page Authority visual language registry");
  const authority = context?.authority;
  const brief = context?.visual_brief;
  const issues = [];
  if (!AUTHORITIES.includes(authority)) issues.push(selectionIssue("invalid_page_authority", "selection authority must be pure-image2 or framed-image2", authority));
  if (!brief || typeof brief !== "object") issues.push(selectionIssue("missing_visual_brief", "selection requires a parsed VISUAL BRIEF", brief));
  const recipe = registry.recipes?.[brief?.recipe];
  const composition = registry.compositions?.[brief?.composition];
  const motifs = Array.isArray(brief?.motifs) ? brief.motifs.map((id) => ({ id, record: registry.motifs?.[id] })) : [];
  if (!recipe) issues.push(selectionIssue("unregistered_visual_recipe", `VISUAL BRIEF selects unregistered recipe ${JSON.stringify(brief?.recipe)}`, brief?.recipe));
  if (!composition) issues.push(selectionIssue("unregistered_visual_composition", `VISUAL BRIEF selects unregistered composition ${JSON.stringify(brief?.composition)}`, brief?.composition));
  for (const motif of motifs) {
    if (!motif.record) issues.push(selectionIssue("unregistered_visual_motif", `VISUAL BRIEF selects unregistered motif ${JSON.stringify(motif.id)}`, motif.id));
  }
  if (issues.length > 0) throw new PageAuthorityVisualLanguageError(issues);

  for (const [kind, record, id] of [["recipe", recipe, brief.recipe], ["composition", composition, brief.composition], ...motifs.map((item) => ["motif", item.record, item.id])]) {
    if (!record.authorities.includes(authority)) {
      issues.push(selectionIssue("authority_ineligible_visual_selection", `${kind} ${JSON.stringify(id)} is not eligible for ${authority}`, { kind, id, authority }));
    }
  }
  if (!recipe.composition_ids.includes(brief.composition)) {
    issues.push(selectionIssue("incompatible_visual_composition", `recipe ${JSON.stringify(brief.recipe)} is not compatible with composition ${JSON.stringify(brief.composition)}`, brief.composition));
  }
  if (motifs.length < composition.min_motifs || motifs.length > composition.max_motifs) {
    issues.push(selectionIssue("invalid_visual_motif_count", `composition ${JSON.stringify(brief.composition)} requires ${composition.min_motifs}..${composition.max_motifs} motifs`, motifs.length));
  }
  for (const motif of motifs) {
    if (!recipe.motif_ids.includes(motif.id) || !motif.record.recipe_ids.includes(brief.recipe) || !motif.record.composition_ids.includes(brief.composition)) {
      issues.push(selectionIssue("incompatible_visual_motif", `motif ${JSON.stringify(motif.id)} is not compatible with the selected recipe/composition`, motif.id));
    }
  }
  const selectedIdentitySubjectClass = context.identity ? context.identity_subject_class : "none";
  if (context.identity && !SUBJECT_CLASSES.includes(selectedIdentitySubjectClass)) {
    issues.push(selectionIssue("identity_subject_class_unresolved", "a selected VISUAL IDENTITY must resolve a registered subject class before visual-language compilation", selectedIdentitySubjectClass));
  } else if (!recipe.identity_subject_classes.includes(selectedIdentitySubjectClass)) {
    issues.push(selectionIssue("incompatible_identity_subject_class", `recipe ${JSON.stringify(brief.recipe)} does not allow subject class ${JSON.stringify(selectedIdentitySubjectClass)}`, selectedIdentitySubjectClass));
  }
  if (issues.length > 0) throw new PageAuthorityVisualLanguageError(issues);

  const semantic = {
    schema: PAGE_AUTHORITY_VISUAL_LANGUAGE_SCHEMA,
    text_guard_digest: registry.text_guard_digest,
    authority,
    recipe: { id: brief.recipe, provider_clause_sha256: recipe.provider_clause_sha256 },
    composition: {
      id: brief.composition,
      provider_clause_sha256: composition.provider_clause_sha256,
      min_motifs: composition.min_motifs,
      max_motifs: composition.max_motifs,
    },
    motifs: motifs.map((motif) => ({ id: motif.id, provider_clause_sha256: motif.record.provider_clause_sha256 })),
    selected_identity_subject_class: selectedIdentitySubjectClass,
  };
  const projection = {
    schema: PAGE_AUTHORITY_VISUAL_LANGUAGE_SCHEMA,
    text_guard_digest: registry.text_guard_digest,
    registry_semantic_digest: canonicalJsonSha256(semantic),
    recipe: semantic.recipe,
    composition: { id: semantic.composition.id, provider_clause_sha256: semantic.composition.provider_clause_sha256 },
    motifs: semantic.motifs,
    selected_identity_subject_class: selectedIdentitySubjectClass,
  };
  return deepFreeze({
    projection,
    provider_clauses: {
      recipe: recipe.provider_clause,
      composition: composition.provider_clause,
      motifs: motifs.map((motif) => motif.record.provider_clause),
    },
    audit: {
      revision: registry.revision,
      whole_registry_sha256: registry.audit.whole_registry_sha256,
    },
  });
}

/** Adapter shape consumed by content-parsing without a reverse visual-system import. */
export function createPageAuthorityVisualLanguageResolver(registry) {
  return Object.freeze({
    resolveSelection(context) {
      return resolvePageAuthorityVisualLanguageSelection(registry, context);
    },
  });
}
