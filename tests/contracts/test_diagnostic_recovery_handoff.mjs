import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const AGENT_CONTRACT_PATH = "ppt_maker_harness/charter/AGENT_CONTRACT.md";
const COMMANDS_PATH = "ppt_maker_harness/COMMANDS.md";
const NODE_SPEC_PATH = "ppt_maker_harness/charter/NODE-SPEC.md";
const CREATE_DECK_PATH = "ppt_maker_harness/playbook/create-deck.md";
const GUIDE_TEMPLATE_PATH = "ppt_maker_harness/workflow/00-setup/template-deck-guide.md";
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
  it("keeps human CLI success summaries separate from exact control identifiers", () => {
    const contract = readFileSync(AGENT_CONTRACT_PATH, "utf8");
    const handoff = headingSection(contract, "Human-facing CLI success handoff");

    expect(handoff).toMatch(/Purpose[\s\S]*Outcome[\s\S]*Next human action/i);
    expect(handoff).toMatch(/ppt_flow.*style-master.*image2/i);
    expect(handoff).toMatch(/ordinary success JSON/i);
    expect(handoff).toMatch(/raw 64-hex digest[\s\S]*status label/i);
    expect(handoff).toMatch(/exact identifier[\s\S]{0,220}explicitly requests/i);
    expect(handoff).toMatch(/display reference[\s\S]*never[\s\S]*selector/i);
    expect(handoff).toMatch(/nonzero CLI[\s\S]*producer-issued failure envelope[\s\S]*Diagnostic Recovery Handoff/i);
  });

  it("requires locatable, read-only Page Image inspection handoffs", () => {
    const contract = readFileSync(AGENT_CONTRACT_PATH, "utf8");
    const handoff = headingSection(contract, "Human inspection handoff");

    expect(handoff).toContain("ppt_flow image2 artifact-view <run-dir>");
    expect(handoff).toMatch(/Human Navigation Path/i);
    expect(handoff).toContain("_generated/nav/index.md");
    expect(handoff).toMatch(/short physical locator, artifact type, and inspection purpose/i);
    expect(handoff).toMatch(/never give a SHA-named storage locator/i);
    expect(handoff).toMatch(/stable\s+slide\/candidate IDs/i);
    expect(handoff).toMatch(/typed display references/i);
    expect(handoff).toMatch(/artifact unavailable[\s\S]*do not invent a reference/i);
    expect(handoff).toMatch(/abbreviated[\s\S]*reference\s+as a selector/i);
    expect(handoff).toMatch(/read target only/i);
    expect(handoff).toMatch(/neither selects a lifecycle\s+record nor[\s\S]{0,80}authorizes provider work, records a decision, or permits a hand edit[\s\S]{0,80}to/i);
    expect(handoff).toMatch(/Full SHA-256 values remain internal/i);
  });

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
