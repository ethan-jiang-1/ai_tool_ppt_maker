## MODIFIED Requirements

### Requirement: Gates are enforced at node boundaries

No node SHALL transition to `completed` until its exit gate conditions are met. Gates that require human judgment (the `content` and `visual` gates, tracked under `gates` in `_state/state.yaml`, with pipeline readiness also reflected in `project-metadata.yaml` `content_gate`/`visual_gate`) SHALL remain `pending` until the human explicitly approves or waives them (via Agent conversation or `scripts/ppt_flow.mjs approve`).

For **production** image generation (full `build`, or `unified_pipeline` Stage 2 **without** `--preview`), CLI validation SHALL require metadata gates `approved` or `waived` (pipeline readiness via `checkBundle`). For **preview** generation (`ppt_flow pilot` and Stage 2 **with** `--preview`), CLI validation SHALL require style master but SHALL NOT require gates approved/waived, and SHALL NOT write `waived` to unlock preview.

For playbook nodes that review visual artifacts (style master, pilot contact sheet, and equivalent)—including `create-deck` setup, `iterate-style` review-gate, `quick-preview` review-preview, and `edit-visual` pilot review—the agent SHALL present/open the artifact to the user before treating the human judgment as satisfied. Description alone SHALL NOT complete the gate when the file exists.

#### Scenario: Production Stage 2 blocked by pending visual gate

- **WHEN** Agent attempts full `build` or non-preview Stage 2 while a required metadata gate is `pending`
- **THEN** the CLI refuses with a gate-related failure

#### Scenario: Preview Stage 2 allowed while gates pending

- **WHEN** Agent runs `ppt_flow pilot` (or Stage 2 with `--preview`) while metadata gates are `pending`
- **AND** style master exists
- **THEN** the CLI allows generation for the preview subset
- **AND** does not mutate gate fields to `waived`

#### Scenario: Visual review gate requires show

- **WHEN** a playbook review node is evaluating `style_master.jpg` or a pilot contact sheet that exists on disk
- **THEN** the agent opens or presents that artifact to the user before recording approval
- **AND** does not mark the gate approved based only on a textual description of the image

### Requirement: Explore playbooks cover pre-commitment style and pilot preview

`iterate-style.md` SHALL define a loop for iterating the style master before full production lock: read/tweak prompt → generate via existing `ppt_flow.mjs style-master` at 1k while iterating → human review with open image → RETRY, BACK, or LOCK. On LOCK it SHALL approve the visual gate via existing approve flow and MAY regenerate at 2k; if entered via playbook stack from `create-deck`, it SHALL resume the prior playbook afterward. It SHALL record iteration `round` in node status extra when available and SHOULD advise a direction change or accept when round ≥ 5.

`quick-preview.md` SHALL define validate → `ppt_flow.mjs pilot` → human review of the contact sheet (open required) with PROCEED / RETRY / BACK exits. It SHALL allow pilot while content/visual gates are still `pending` (preview ≠ approved). It SHALL NOT instruct the agent to `--waive` gates merely to unlock pilot. It SHALL note that full `build` / non-preview Stage 2 remain blocked until gates are `approved` or explicitly `waived`. Neither explore playbook SHALL require new CLI commands beyond existing `ppt_flow` flags (`pilot --force-images`, `doctor --smoke` as optional). Recommended ordering: lock visual (optionally via `iterate-style`) before committing to full `build`; `quick-preview` MAY run earlier for look-and-feel sampling when style master exists.

#### Scenario: User iterates style master

- **WHEN** user wants to refine visual direction before locking
- **THEN** Agent loads `iterate-style` and runs generate/review until LOCK or BACK
- **AND** uses existing `style-master` / `approve` CLI rather than ad-hoc scripts

#### Scenario: Quick preview without waiving gates

- **WHEN** content or visual gate is still pending and user wants a 3-page look
- **AND** style master exists
- **THEN** Agent loads `quick-preview`, runs validate and pilot without writing `waived`
- **AND** presents the contact sheet
- **AND** does not treat the preview as content/visual approval for full build

#### Scenario: Full build still needs gates after preview

- **WHEN** gates remain pending after a successful quick-preview
- **THEN** Agent MUST NOT run full `build` until approve or explicit waive
