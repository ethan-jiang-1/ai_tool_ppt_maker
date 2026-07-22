import { parse as parseYaml } from "yaml";

export const RUN_BUNDLE_SCHEMA = "pptmaker-run-bundle-v1";
export const RUN_BUNDLE_FILE = "RUN_BUNDLE.md";

export function normalizedFrameworkRelation(deckDir, frameworkDir, pathApi) {
  const relation = pathApi.relative(pathApi.resolve(deckDir), pathApi.resolve(frameworkDir));
  return (relation || ".").split(pathApi.sep).join("/");
}

export function renderRunBundle({ deckName, deckRoot, frameworkRoot, frameworkRelation }) {
  return `---
schema: ${RUN_BUNDLE_SCHEMA}
deck_root: ${JSON.stringify(deckRoot)}
framework_root: ${JSON.stringify(frameworkRoot)}
framework_relation: ${JSON.stringify(frameworkRelation)}
---

# ${deckName} - Continue this PPT deck

Give this file to your local PPT Agent and say what you want to continue or change. This card
contains local locations for the deck and its framework; current workflow status is always read
from state/status after those locations are verified.
`;
}

export function parseRunBundleManifest(text, pathApi) {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(String(text));
  if (!match) throw new Error("RUN_BUNDLE.md is missing its manifest frontmatter");
  const value = parseYaml(match[1]);
  const keys = ["schema", "deck_root", "framework_root", "framework_relation"];
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length !== keys.length || !keys.every((key) => Object.hasOwn(value, key))) {
    throw new Error("RUN_BUNDLE.md manifest must contain only its closed locator fields");
  }
  if (value.schema !== RUN_BUNDLE_SCHEMA) throw new Error("RUN_BUNDLE.md has an unsupported schema");
  if (![value.deck_root, value.framework_root].every((entry) => typeof entry === "string" && pathApi.isAbsolute(entry))) {
    throw new Error("RUN_BUNDLE.md roots must be absolute paths");
  }
  if (typeof value.framework_relation !== "string" || !value.framework_relation) {
    throw new Error("RUN_BUNDLE.md framework_relation is missing");
  }
  return Object.freeze({
    deck_root: pathApi.resolve(value.deck_root),
    framework_root: pathApi.resolve(value.framework_root),
    framework_relation: value.framework_relation,
  });
}
