## MODIFIED Requirements

### Requirement: status surfaces playbook position and lesson count

`ppt_flow.mjs status` human output SHALL include a compact Playbook section with at least active `playbook` and `current_node` from `_state` (via `readState` with default heal). Successful `status --json` SHALL include `playbook` and `current_node` fields on the JSON object. If `_state` is missing and heal seeds a default, status SHALL still report the seeded position rather than omitting those fields silently. Status MAY also print or JSON-include `workflow_summary` by calling the same resume-card helper with a status snapshot.

`ppt_flow.mjs status` human output SHALL also include a `Lessons` line showing the count of lesson files in `deck_*/_lessons/` (excluding `README.md`). When lessons exist, the line SHALL display the count and a hint to run `lessons.mjs list` to review them. When no lessons exist, the line SHALL display "none." Status `--json` SHALL include a `lessons_count` integer field. The lesson count SHALL be collected by reading the `_lessons/` directory; it SHALL NOT require `lessons.mjs` as a subprocess.

#### Scenario: status shows lesson count when lessons exist

- **WHEN** Agent runs `ppt_flow.mjs status <runDir>` on a deck with 2 lesson files
- **THEN** human output includes "Lessons: 2 (run `lessons.mjs list` to review)"
- **AND** `status --json` includes `"lessons_count": 2`

#### Scenario: status shows no lessons

- **WHEN** Agent runs `ppt_flow.mjs status <runDir>` on a deck with no `_lessons/` or an empty one
- **THEN** human output includes "Lessons: none"
- **AND** `status --json` includes `"lessons_count": 0`

#### Scenario: status shows playbook breakpoint

- **WHEN** Agent runs `ppt_flow.mjs status <runDir>` on a deck with `_state/state.yaml`
- **THEN** human output mentions the active playbook and current_node

#### Scenario: status JSON includes playbook fields

- **WHEN** Agent runs `ppt_flow.mjs status <runDir> --json` on a deck with `_state/state.yaml`
- **THEN** the JSON includes `playbook` and `current_node`
