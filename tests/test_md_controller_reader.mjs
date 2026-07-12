import { describe, it, expect } from "vitest";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  buildPlaybookIndex,
  controllerNodeIds,
  parseControllerFile,
  validatePlaybookIndex,
} from "../PPTMAKER_FRAMEWORK/scripts/lib/md_controller_reader.mjs";

const PLAYBOOK_DIR = "PPTMAKER_FRAMEWORK/playbook";

export const EXPECTED_CONTROLLER_MANIFEST = Object.freeze({
  "create-deck": ["instantiation", "hitl1", "setup", "seed-topics", "wave0", "wave1", "wave2", "hitl2", "readiness", "rerun", "final"],
  "edit-text": ["classify-change", "stage-text", "verify-text-output"],
  "edit-visual": ["classify-change", "pilot", "confirm", "regenerate", "verify-visual-output"],
  "edit-notes": ["classify-change", "inject-notes", "verify-notes"],
  "restructure-slides": ["classify-change", "new-version", "regenerate-affected", "verify-restructure-output"],
  "quick-preview": ["validate-ready", "pilot-generate", "review-preview"],
  "iterate-style": ["start-iterate", "tweak-prompt", "generate", "review-gate"],
  "migrate-import": ["intake-source", "align-bundle", "inventory-map", "early-show", "reaffirm-gates", "handoff"],
  "probe-image-channels": ["intake", "run-probe", "show-report", "confirm-write"],
});

function fixtureDir(tag) {
  const dir = join(tmpdir(), `md_controller_reader_${tag}_${Date.now()}_${Math.random().toString(16).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe("MD Controller reader characterization", () => {
  it("parses fenced YAML nodes rather than only document frontmatter", () => {
    const parsed = parseControllerFile(join(PLAYBOOK_DIR, "create-deck.md"));
    expect(parsed.playbook).toBe("create-deck");
    expect(parsed.nodes.map((node) => node.id)).toContain("wave0");
    expect(parsed.nodes.find((node) => node.id === "wave0")?.entry).toContain("gate_approved:content");
  });

  it("the live MD Controller registry matches the forty-node manifest and validates cleanly", () => {
    const index = buildPlaybookIndex(PLAYBOOK_DIR);
    const result = validatePlaybookIndex(index);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
    expect(index.nodesById.size).toBe(40);
    for (const [playbook, ids] of Object.entries(EXPECTED_CONTROLLER_MANIFEST)) {
      expect(controllerNodeIds(index, playbook), playbook).toEqual(ids);
      for (const id of ids) {
        const node = index.nodesById.get(id);
        expect(node, `${playbook}/${id}`).toBeDefined();
        expect(node.lifecyclePhase).toMatch(/^(0|1|2|2\.7|3|4)$/);
        expect(node.methodModule).toMatch(/^(00-setup|01-visual|02-content|03-prompts|04-production|05-iteration)$/);
        expect(node.steps.length).toBeGreaterThan(0);
      }
    }
  });

  it("rejects undeclared decisions, reserved ids, impossible ordering, and dependency cycles", () => {
    const dir = fixtureDir("invalid");
    try {
      writeFileSync(join(dir, "bad.md"), `---\nplaybook: bad\nincludes: []\n---\n\n\`\`\`yaml\nnode: header-review\nlifecycle_phase: 4\nmethod_module: 05-iteration\nrequires: [later]\nentry: [node_status:header-review:completed]\nexit: [user_decision_recorded]\ndecisions: [yes]\n\`\`\`\n\n**Step 1 — GATE**: choose\n\n\`\`\`yaml\nnode: later\nphase: 04\nrequires: [header-review]\nentry: [node_decision:header-review:no]\nexit: []\n\`\`\`\n\n## Step 1 — MD\nlater\n`);
      writeFileSync(join(dir, "duplicate.md"), `---\nplaybook: duplicate\nincludes: []\n---\n\n\`\`\`yaml\nnode: later\nlifecycle_phase: 4\nmethod_module: 05-iteration\nrequires: []\nentry: []\nexit: []\n\`\`\`\n\n**Step 1 — MD**: duplicate\n`);
      const result = validatePlaybookIndex(buildPlaybookIndex(dir));
      expect(result.valid).toBe(false);
      expect(result.errors.some((error) => error.rule === "reserved-id")).toBe(true);
      expect(result.errors.some((error) => error.rule === "requires-order")).toBe(true);
      expect(result.errors.some((error) => error.rule === "dependency-cycle")).toBe(true);
      expect(result.errors.some((error) => error.rule === "decision-value")).toBe(true);
      expect(result.errors.some((error) => error.rule === "self-entry")).toBe(true);
      expect(result.errors.some((error) => error.rule === "legacy-phase")).toBe(true);
      expect(result.errors.some((error) => error.rule === "duplicate-id")).toBe(true);
      expect(result.errors.some((error) => error.rule === "steps")).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
