import { basename, join, resolve } from "node:path";
import { emitFailed, emitUsage, HARNESS_DIR } from "../command_support.mjs";
import { commandResult } from "../command_result.mjs";
import { DECK_TYPE_TEMPLATES, STYLE_PRESETS, VERSIONS_DIR, initBundle } from "../../run-bundle/bundle_layout.mjs";

// ---------------------------------------------------------------------------
// Command: init
// ---------------------------------------------------------------------------

const STYLE_PRESETS_SORTED = () => [...STYLE_PRESETS].sort();
const DECK_TYPES_SORTED = () => Object.keys(DECK_TYPE_TEMPLATES).sort();

function renderInitText(result) {
  const lines = [`✓ Initialized ${result.facts.resolved}`];
  for (const line of result.facts.log) lines.push(`  - ${line}`);
  lines.push("  production_identity: unbound until the source workflow is selected and accepted by State");
  lines.push(`\nNext: ppt_flow.mjs status ${result.facts.v1Path}`);
  return lines.join("\n");
}

/**
 * init — Create a conformant run bundle.
 * @param {string} deckDir
 * @param {{deckType: string, style: string}} opts
 */
export function commandInit(deckDir, { deckType, style }) {
  const resolved = resolve(deckDir);

  if (!basename(resolved).startsWith("deck_")) {
    console.error("✗ Deck directory must start with 'deck_'.");
    return emitUsage(
      "ppt_flow.init",
      "Deck directory must start with 'deck_'.",
      "Pass a path whose basename starts with deck_, e.g. deck_mydeck"
    );
  }
  if (
    HARNESS_DIR === resolved ||
    resolved.startsWith(HARNESS_DIR + "/")
  ) {
    console.error("✗ A run bundle must live outside ppt_maker_harness/.");
    return emitUsage(
      "ppt_flow.init",
      "A run bundle must live outside ppt_maker_harness/.",
      "Create the deck directory next to (not inside) ppt_maker_harness/"
    );
  }
  if (!(deckType in DECK_TYPE_TEMPLATES)) {
    const allowed = DECK_TYPES_SORTED().join(", ");
    console.error(`✗ Unknown deck-type: ${deckType}. Allowed: ${allowed}`);
    return emitUsage(
      "ppt_flow.init.deck-type",
      `Unknown deck-type: ${deckType}`,
      `Allowed: ${allowed}`
    );
  }
  if (!STYLE_PRESETS.includes(style)) {
    const allowed = STYLE_PRESETS_SORTED().join(", ");
    console.error(`✗ Unknown style: ${style}. Allowed: ${allowed}`);
    return emitUsage(
      "ppt_flow.init.style",
      `Unknown style: ${style}`,
      `Allowed: ${allowed}`
    );
  }

  let log;
  try {
    log = initBundle(resolved, HARNESS_DIR, deckType, style);
  } catch (err) {
    console.error(`✗ ${err.message}`);
    emitFailed("ppt_flow.init", err.message, "Fix the reported init error and retry");
    return 1;
  }

  const ownerResult = commandResult({
    operation: "init",
    state: "success",
    effect: { deckDir: resolved, deckType, style },
    facts: { resolved, log, v1Path: join(resolved, VERSIONS_DIR, "v1") },
  });
  console.log(renderInitText(ownerResult));
  return 0;
}
