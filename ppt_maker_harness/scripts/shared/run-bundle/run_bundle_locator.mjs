import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isAlias, isMap, isScalar, parseDocument } from "yaml";
import { checkDeckRootControls } from "./bundle_layout.mjs";

export const RUN_BUNDLE_SCHEMA = "pptmaker-run-bundle-v2";
export const RUN_BUNDLE_FILE = "RUN_BUNDLE.md";

const MANIFEST_FIELDS = Object.freeze([
  "schema",
  "deck_root",
  "harness_root",
  "harness_relation",
]);
const HARNESS_SENTINELS = Object.freeze([
  "scripts/ppt_flow.mjs",
  "scripts/shared/run-bundle/bundle_layout.mjs",
  "scripts/shared/state/state.mjs",
]);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_HARNESS_ROOT = path.resolve(__dirname, "..", "..", "..");

function hardStop(code) {
  return Object.freeze({ kind: "hard-stop", subject: "harness_binding", code });
}

function canonicalDirectory(candidate) {
  try {
    if (typeof candidate !== "string" || !path.isAbsolute(candidate)) return null;
    const stat = fs.lstatSync(candidate);
    if (!stat.isDirectory()) return null;
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

function canonicalAbsolute(value) {
  if (typeof value !== "string" || !path.isAbsolute(value)) return null;
  const normalized = path.resolve(value);
  return normalized === value ? normalized : null;
}

function normalizedRelation(relation) {
  if (typeof relation !== "string" || !relation || relation.includes("\\") || path.posix.isAbsolute(relation)) return null;
  if (relation === "." || relation !== path.posix.normalize(relation)) return null;
  if (relation.split("/").some((segment) => !segment || segment === ".")) return null;
  return relation;
}

function isInside(candidate, parent) {
  return candidate === parent || candidate.startsWith(`${parent}${path.sep}`);
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
  const harnessRoot = canonicalAbsolute(fields.harness_root);
  const harnessRelation = normalizedRelation(fields.harness_relation);
  if (!deckRoot || !harnessRoot || !harnessRelation || deckRoot === harnessRoot) return null;

  return Object.freeze({
    schema: RUN_BUNDLE_SCHEMA,
    deck_root: deckRoot,
    harness_root: harnessRoot,
    harness_relation: harnessRelation,
  });
}

function verifiedHarness(candidate) {
  const directory = canonicalDirectory(candidate);
  if (!directory) return Object.freeze({ status: "unavailable" });
  if (!HARNESS_SENTINELS.every((relativePath) => regularFile(path.join(directory, relativePath)))) {
    return Object.freeze({ status: "unverified", directory });
  }
  return Object.freeze({ status: "verified", directory });
}

export function canonicalHarnessRoot(harnessRoot) {
  const declared = canonicalAbsolute(harnessRoot);
  const result = verifiedHarness(declared);
  if (!declared || result.status !== "verified" || result.directory !== declared) {
    throw new Error(`harness root is ${result.status}: ${harnessRoot}`);
  }
  return result.directory;
}

export function currentHarnessRoot() {
  return canonicalHarnessRoot(LOCAL_HARNESS_ROOT);
}

export function normalizedHarnessRelation(deckRoot, harnessRoot) {
  const canonicalDeckRoot = canonicalDirectory(deckRoot);
  const canonicalHarness = canonicalHarnessRoot(harnessRoot);
  if (!canonicalDeckRoot || canonicalAbsolute(deckRoot) !== canonicalDeckRoot || isInside(canonicalDeckRoot, canonicalHarness)) {
    throw new Error(`deck root must be canonical and outside harness root: ${deckRoot}`);
  }
  const relation = path.relative(canonicalDeckRoot, canonicalHarness).split(path.sep).join("/");
  if (!normalizedRelation(relation)) {
    throw new Error(`harness root must be distinct from deck root: ${harnessRoot}`);
  }
  return relation;
}

export function renderRunBundle({ deckName, deckRoot, harnessRoot, harnessRelation }) {
  const canonicalDeckRoot = canonicalDirectory(deckRoot);
  const declaredDeckRoot = canonicalAbsolute(deckRoot);
  const canonicalHarness = canonicalHarnessRoot(harnessRoot);
  if (canonicalHarness !== currentHarnessRoot()) {
    throw new Error("RUN_BUNDLE.md must bind to this local PPT Maker Harness root");
  }
  const normalized = normalizedRelation(harnessRelation);
  const expectedRelation = canonicalDeckRoot ? normalizedHarnessRelation(canonicalDeckRoot, canonicalHarness) : null;
  if (!canonicalDeckRoot || declaredDeckRoot !== canonicalDeckRoot || !normalized || normalized !== expectedRelation) {
    throw new Error("RUN_BUNDLE.md requires canonical distinct roots and their exact normalized relation");
  }

  return `---
schema: ${RUN_BUNDLE_SCHEMA}
deck_root: ${JSON.stringify(canonicalDeckRoot)}
harness_root: ${JSON.stringify(canonicalHarness)}
harness_relation: ${JSON.stringify(normalized)}
---

# ${deckName} - Continue this PPT deck

Give this file to your local PPT Agent and say what you want to continue or change. It contains
local filesystem locations for this deck and its PPT Maker Harness, which can reveal local path names.
Current workflow status is always read from state/status after those locations are verified.
`;
}

export function parseRunBundleManifest(text) {
  const record = parseManifestRecord(text);
  if (!record) throw new Error("RUN_BUNDLE.md does not contain a current local Harness binding");
  return record;
}

/**
 * Verify the one local binding for a Deck root already derived by a caller.
 * This is read-only: it never repairs, relocates, selects another Harness, or
 * writes a locator/state/artifact record.
 */
export function verifyDeckHarnessBinding(deckRoot) {
  const deckDir = canonicalDirectory(deckRoot);
  if (!deckDir) return hardStop("deck_root_unavailable");

  const cardPath = path.join(deckDir, RUN_BUNDLE_FILE);
  if (!regularFile(cardPath)) return hardStop("locator_missing_or_unverified");

  let manifest;
  try {
    manifest = parseManifestRecord(fs.readFileSync(cardPath, "utf8"));
  } catch {
    return hardStop("locator_missing_or_unverified");
  }
  if (!manifest) return hardStop("locator_contract_invalid");
  if (manifest.deck_root !== deckDir) return hardStop("deck_root_conflict");
  if (checkDeckRootControls(deckDir).length > 0) return hardStop("deck_root_unverified");

  const directHarness = verifiedHarness(manifest.harness_root);
  if (directHarness.status !== "verified" || directHarness.directory !== manifest.harness_root) {
    return hardStop("harness_root_unverified");
  }
  const localHarness = verifiedHarness(LOCAL_HARNESS_ROOT);
  if (localHarness.status !== "verified" || directHarness.directory !== localHarness.directory) {
    return hardStop("harness_root_conflict");
  }
  if (isInside(deckDir, directHarness.directory)) return hardStop("deck_inside_harness");

  const relationPath = path.resolve(deckDir, ...manifest.harness_relation.split("/"));
  const relationHarness = verifiedHarness(relationPath);
  if (relationHarness.status !== "verified" || relationHarness.directory !== directHarness.directory) {
    return hardStop("harness_relation_conflict");
  }

  return Object.freeze({
    kind: "resolved",
    deckDir,
    harnessDir: directHarness.directory,
  });
}
