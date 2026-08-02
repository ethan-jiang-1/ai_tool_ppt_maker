import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const AGENT_CONTRACT_PATH = "PPTMAKER_FRAMEWORK/charter/AGENT_CONTRACT.md";
const COMMANDS_PATH = "PPTMAKER_FRAMEWORK/COMMANDS.md";
const NODE_SPEC_PATH = "PPTMAKER_FRAMEWORK/charter/NODE-SPEC.md";
const CREATE_DECK_PATH = "PPTMAKER_FRAMEWORK/playbook/create-deck.md";
const GUIDE_TEMPLATE_PATH = "PPTMAKER_FRAMEWORK/workflow/00-setup/template-deck-guide.md";
const FOUR_PART_LABELS = [
  "What happened",
  "What it affects",
  "What the Agent can mechanically do",
  "The one human action or confirmation required",
];

function headingSection(text, heading) {
  const marker = `## ${heading}`;
  const start = text.indexOf(marker);
  expect(start, `${heading} heading`).toBeGreaterThan(-1);
  const rest = text.slice(start + marker.length);
  const nextHeading = rest.search(/\n## /u);
  return nextHeading === -1 ? rest : rest.slice(0, nextHeading);
}

describe("diagnostic recovery handoff", () => {
  it("defines exactly four bounded novice-facing parts in the canonical contract", () => {
    const contract = readFileSync(AGENT_CONTRACT_PATH, "utf8");
    const handoff = headingSection(contract, "Diagnostic Recovery Handoff");
    const labels = [...handoff.matchAll(/^\d\. \*\*([^*]+)\*\*/gmu)].map((match) => match[1]);

    expect(labels).toEqual(FOUR_PART_LABELS);
    expect(handoff).toMatch(/No human action is required\s+now/i);
    expect(handoff).toMatch(/requires_human/i);
    expect(handoff).toMatch(/raw stderr|child output|stack|secret/i);
    expect(handoff).toMatch(/does not (?:write|persist)[\s\S]{0,220}(?:state|receipt|grant|attempt|history|task projection)/i);
    expect(handoff).toMatch(/do not invent(?: a)? retry/i);
    expect(handoff).not.toMatch(/```(?:bash|sh|zsh)/i);
  });

  it("keeps recovery producer-first, then exact-run, locator, and bounded pre-install recovery", () => {
    const contract = readFileSync(AGENT_CONTRACT_PATH, "utf8");
    const handoff = headingSection(contract, "Diagnostic Recovery Handoff");

    expect(handoff).toMatch(
      /current valid CLI failure envelope\s*->\s*consume producer next[\s\S]{0,240}otherwise,\s*startable main entry \+ known exact run\s*->\s*state --json[\s\S]{0,240}otherwise,\s*startable main entry \+ no exact run\s*->\s*supported locator[\s\S]{0,240}otherwise,\s*pre-install or unavailable main entry\s*->\s*direct env-check/i,
    );
    expect(handoff).toMatch(/invalid, missing, or truncated envelope[\s\S]{0,220}not.*prose/i);
    expect(handoff).toMatch(/Direct `env-check`[\s\S]{0,300}does not.*locate a run/i);
    expect(handoff).toMatch(/(?:does not|never permits).*scan(?:ning)?\s+(?:production\s+)?`?deck_\*`?|no deck scanning/i);
  });

  it("keeps novice and Controller surfaces anchored to the canonical handoff", () => {
    const commands = readFileSync(COMMANDS_PATH, "utf8");
    const nodeSpec = readFileSync(NODE_SPEC_PATH, "utf8");
    const createDeck = readFileSync(CREATE_DECK_PATH, "utf8");
    const guideTemplate = readFileSync(GUIDE_TEMPLATE_PATH, "utf8");
    const commonRequests = commands.slice(
      commands.indexOf("## Common Requests"),
      commands.indexOf("## What Stays Safe"),
    );
    const stuckRow = commonRequests.split(/\r?\n/u).find((line) => line.includes('"I am stuck"'));

    expect(stuckRow).toMatch(/what happened[\s\S]*what it affects[\s\S]*mechanically[\s\S]*(?:decision|confirmation)/i);
    expect(commonRequests).not.toMatch(/(?:JSON|diagnostic\.|stderr|ppt_flow|\bnode\b|--[a-z])/i);
    expect(commands).toContain("charter/AGENT_CONTRACT.md#diagnostic-recovery-handoff");
    expect(nodeSpec).toContain("AGENT_CONTRACT.md#diagnostic-recovery-handoff");
    expect(nodeSpec).toMatch(/four parts[\s\S]*what\s+happened[\s\S]*what\s+it\s+affects[\s\S]*mechanically[\s\S]*(?:human\s+action|confirmation)/i);
    expect(createDeck).toContain("../charter/AGENT_CONTRACT.md#diagnostic-recovery-handoff");
    for (const label of FOUR_PART_LABELS) expect(guideTemplate).toContain(`**${label}**`);
    expect(guideTemplate).toMatch(/does not locate a run or select pre-install recovery/i);
  });
});
