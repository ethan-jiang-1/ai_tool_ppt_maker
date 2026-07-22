import fs from "node:fs";
import path from "node:path";
import { isAlias, isMap, isScalar, parseDocument } from "yaml";
import { checkDeckRootControls } from "./bundle_layout.mjs";

export const RUN_BUNDLE_SCHEMA = "pptmaker-run-bundle-v1";
export const RUN_BUNDLE_FILE = "RUN_BUNDLE.md";

const MANIFEST_FIELDS = Object.freeze(["schema", "deck_root", "framework_root", "framework_relation"]);
const FRAMEWORK_SENTINELS = Object.freeze([
  "scripts/ppt_flow.mjs",
  "scripts/shared/run-bundle/bundle_layout.mjs",
  "scripts/shared/state/state.mjs",
]);

function guide(subject, code) {
  return Object.freeze({ kind: "guide", subject, code });
}

function canonicalDirectory(candidate) {
  try {
    if (!candidate || !fs.statSync(candidate).isDirectory()) return null;
    return fs.realpathSync.native(candidate);
  } catch {
    return null;
  }
}

function regularFile(candidate) {
  try {
    const stat = fs.lstatSync(candidate);
    return stat.isFile() && !stat.isSymbolicLink();
  } catch {
    return false;
  }
}

function normalizedRelation(relation) {
  if (typeof relation !== "string" || !relation || relation.includes("\\") || path.posix.isAbsolute(relation)) return null;
  if (relation === "." || relation !== path.posix.normalize(relation)) return null;
  if (relation.split("/").some((segment) => !segment || segment === ".")) return null;
  return relation;
}

function canonicalAbsolute(value) {
  if (typeof value !== "string" || !path.isAbsolute(value)) return null;
  const normalized = path.resolve(value);
  return normalized === value ? normalized : null;
}

function sameRecord(left, right) {
  return left.schema === right.schema &&
    left.deck_root === right.deck_root &&
    left.framework_root === right.framework_root &&
    left.framework_relation === right.framework_relation;
}

function parseManifestRecord(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(String(text));
  if (!match) return null;
  const document = parseDocument(match[1], { uniqueKeys: true, merge: false });
  if (document.errors.length > 0 || !isMap(document.contents) || document.contents.items.length !== MANIFEST_FIELDS.length) return null;

  const fields = {};
  for (const pair of document.contents.items) {
    if (!isScalar(pair.key) || !isScalar(pair.value) || isAlias(pair.key) || isAlias(pair.value) || pair.key.anchor || pair.value.anchor) return null;
    if (typeof pair.key.value !== "string" || typeof pair.value.value !== "string" || Object.hasOwn(fields, pair.key.value)) return null;
    fields[pair.key.value] = pair.value.value;
  }
  if (!MANIFEST_FIELDS.every((field) => Object.hasOwn(fields, field)) || fields.schema !== RUN_BUNDLE_SCHEMA) return null;
  const deckRoot = canonicalAbsolute(fields.deck_root);
  const frameworkRoot = canonicalAbsolute(fields.framework_root);
  const relation = normalizedRelation(fields.framework_relation);
  if (!deckRoot || !frameworkRoot || !relation || deckRoot === frameworkRoot) return null;
  return Object.freeze({
    schema: RUN_BUNDLE_SCHEMA,
    deck_root: deckRoot,
    framework_root: frameworkRoot,
    framework_relation: relation,
  });
}

function frameworkDirectory(candidate) {
  const directory = canonicalDirectory(candidate);
  if (!directory) return Object.freeze({ status: "unavailable" });
  if (!FRAMEWORK_SENTINELS.every((relativePath) => regularFile(path.join(directory, relativePath)))) {
    return Object.freeze({ status: "unverified", directory });
  }
  return Object.freeze({ status: "verified", directory });
}

function deckCandidate(candidate, manifest, source, requireDeclaredRoot = false) {
  const directory = canonicalDirectory(candidate);
  if (!directory) return Object.freeze({ status: "unavailable" });
  if (requireDeclaredRoot && directory !== manifest.deck_root) return Object.freeze({ status: "unverified" });
  const cardPath = path.join(directory, RUN_BUNDLE_FILE);
  if (!regularFile(cardPath)) return Object.freeze({ status: "unverified" });
  let diskManifest;
  try {
    diskManifest = parseManifestRecord(fs.readFileSync(cardPath, "utf8"));
  } catch {
    return Object.freeze({ status: "unverified" });
  }
  if (!diskManifest) return Object.freeze({ status: "unverified" });
  if (!sameRecord(manifest, diskManifest)) return Object.freeze({ status: "conflict" });
  if (checkDeckRootControls(directory).length > 0) return Object.freeze({ status: "unverified" });
  return Object.freeze({ status: "verified", directory, source });
}

function originalCardCandidate(originalCardPath, manifest) {
  if (originalCardPath == null) return Object.freeze({ status: "unavailable" });
  if (!regularFile(originalCardPath)) return Object.freeze({ status: "unverified" });
  let originalManifest;
  try {
    originalManifest = parseManifestRecord(fs.readFileSync(originalCardPath, "utf8"));
  } catch {
    return Object.freeze({ status: "unverified" });
  }
  if (!originalManifest) return Object.freeze({ status: "unverified" });
  if (!sameRecord(manifest, originalManifest)) return Object.freeze({ status: "conflict" });
  return deckCandidate(path.dirname(originalCardPath), manifest, "card-parent");
}

function deckGuide(result) {
  return guide("deck_root", `deck_root_${result.status}`);
}

function resolveDeck(manifest, originalCardPath, requestedDeckRoot) {
  const declared = deckCandidate(manifest.deck_root, manifest, "declared", true);
  if (declared.status === "verified" || declared.status === "conflict" || declared.status === "unverified") return declared;

  const original = originalCardCandidate(originalCardPath, manifest);
  if (original.status === "verified" || original.status === "conflict" || original.status === "unverified") return original;
  if (requestedDeckRoot == null) return declared;
  return deckCandidate(requestedDeckRoot, manifest, "requested");
}

function requestedFrameworkCandidate(requestedFrameworkRoot) {
  return requestedFrameworkRoot == null ? Object.freeze({ status: "unavailable" }) : frameworkDirectory(requestedFrameworkRoot);
}

function frameworkGuide(direct, relation, requested) {
  if (direct.status === "unavailable" && relation.status === "unavailable" && requested.status === "unavailable") {
    return guide("framework_root", "framework_root_unavailable");
  }
  return guide("framework_root", "framework_root_unverified");
}

function resolveFramework(manifest, deck, requestedFrameworkRoot) {
  const direct = frameworkDirectory(manifest.framework_root);
  const requested = requestedFrameworkCandidate(requestedFrameworkRoot);
  if (deck.source !== "declared") {
    if (direct.status === "verified" && direct.directory !== deck.directory) {
      return Object.freeze({ kind: "resolved", directory: direct.directory, source: "declared" });
    }
    if (requested.status === "verified" && requested.directory !== deck.directory) {
      return Object.freeze({ kind: "resolved", directory: requested.directory, source: "requested" });
    }
    return frameworkGuide(direct, { status: "unavailable" }, requested);
  }

  const relationPath = path.resolve(deck.directory, ...manifest.framework_relation.split("/"));
  const relation = frameworkDirectory(relationPath);
  if (direct.status === "verified" && direct.directory === deck.directory) return guide("framework_root", "framework_root_unverified");
  if (relation.status === "verified" && relation.directory === deck.directory) return guide("framework_root", "framework_root_unverified");
  if (direct.status === "verified" && relation.status === "verified" && direct.directory !== relation.directory) {
    return guide("framework_root", "framework_root_conflict");
  }
  if (direct.status === "verified") return Object.freeze({ kind: "resolved", directory: direct.directory, source: "declared" });
  if (relation.status === "verified") return Object.freeze({ kind: "resolved", directory: relation.directory, source: "relation" });
  if (requested.status === "verified" && requested.directory !== deck.directory) {
    return Object.freeze({ kind: "resolved", directory: requested.directory, source: "requested" });
  }
  return frameworkGuide(direct, relation, requested);
}

export function canonicalFrameworkRoot(frameworkRoot) {
  const result = frameworkDirectory(frameworkRoot);
  if (result.status !== "verified") {
    throw new Error(`framework root is ${result.status}: ${frameworkRoot}`);
  }
  return result.directory;
}

export function normalizedFrameworkRelation(deckRoot, frameworkRoot) {
  const relation = path.relative(deckRoot, frameworkRoot).split(path.sep).join("/");
  if (!normalizedRelation(relation)) {
    throw new Error(`framework root must be distinct from deck root: ${frameworkRoot}`);
  }
  return relation;
}

export function renderRunBundle({ deckName, deckRoot, frameworkRoot, frameworkRelation }) {
  const record = {
    schema: RUN_BUNDLE_SCHEMA,
    deck_root: canonicalAbsolute(deckRoot),
    framework_root: canonicalAbsolute(frameworkRoot),
    framework_relation: normalizedRelation(frameworkRelation),
  };
  if (!record.deck_root || !record.framework_root || record.deck_root === record.framework_root || !record.framework_relation) {
    throw new Error("RUN_BUNDLE.md requires canonical distinct roots and a normalized relation");
  }
  return `---
schema: ${RUN_BUNDLE_SCHEMA}
deck_root: ${JSON.stringify(record.deck_root)}
framework_root: ${JSON.stringify(record.framework_root)}
framework_relation: ${JSON.stringify(record.framework_relation)}
---

# ${deckName} - Continue this PPT deck

Give this file to your local PPT Agent and say what you want to continue or change. It contains
local filesystem locations for this deck and its framework, which can reveal local path names.
Current workflow status is always read from state/status after those locations are verified.
`;
}

export function parseRunBundleManifest(text) {
  const record = parseManifestRecord(text);
  if (!record) throw new Error("RUN_BUNDLE.md manifest is invalid");
  return record;
}

export function resolveRunBundleLocator({
  manifestText,
  originalCardPath = null,
  requestedDeckRoot = null,
  requestedFrameworkRoot = null,
}) {
  const manifest = parseManifestRecord(manifestText);
  if (!manifest) return guide("manifest", "manifest_invalid");
  const deck = resolveDeck(manifest, originalCardPath, requestedDeckRoot);
  if (deck.status !== "verified") return deckGuide(deck);
  const framework = resolveFramework(manifest, deck, requestedFrameworkRoot);
  if (framework.kind !== "resolved") return framework;
  return Object.freeze({
    kind: "resolved",
    deckDir: deck.directory,
    frameworkDir: framework.directory,
    deckSource: deck.source,
    frameworkSource: framework.source,
  });
}
