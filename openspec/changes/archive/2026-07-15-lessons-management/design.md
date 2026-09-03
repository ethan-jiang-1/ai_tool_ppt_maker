## Context

The `_lessons/` mechanism is well-designed as a convention (directory, README, writing rules) and constitutionally protected, but it is **passive**. The agent must remember to check it and write to it — there is no structural trigger. This change adds three layers: a CLI tool (`lessons.mjs`) to make operations easy, status visibility so lessons surface at every check, and workflow instructions so capture/retrieval become explicit steps.

## Goals / Non-Goals

**Goals:**
- Give the agent a trivially easy CLI for listing, adding, searching, and checking lessons
- Surface lesson count in `ppt_flow.mjs status` so lessons are visible at every session start
- Make lesson scanning a mandatory, prominent step in the BOOTSTRAP resume ritual
- Add explicit capture triggers (user phrases, multi-attempt fixes, phase gates) to workflow docs
- Add a copy-paste lesson template to `_lessons/README.md`

**Non-Goals:**
- No automated "pain detector" — capture remains agent-initiated
- No framework-level `_lessons/` (that remains `_backlog/learning/`)
- No database or external service — everything stays filesystem-native
- No changes to the run-bundle layout or structure gradient
- No changes to `_state/` or playbook execution

## Decisions

### Decision 1: CLI as the primary mechanism

**Choice**: Build a standalone `lessons.mjs` CLI (like `bundle_layout.mjs` or `ppt_flow.mjs`) rather than embedding lesson operations into `ppt_flow.mjs`.

**Rationale**: Lesson management is a distinct responsibility from pipeline flow. A separate tool keeps the surface clean and follows the existing pattern (e.g., `env-check.mjs`, `bundle_layout.mjs`). It also means `lessons.mjs` can be used independently — an agent can run `lessons.mjs list` without invoking the full status machinery.

**Alternatives considered**:
- Add `ppt_flow lessons <subcommand>` — would bloat `ppt_flow.mjs` and couple lesson management to the flow controller. Rejected.
- Pure documentation (no code) — the existing approach. Proven insufficient. Rejected.

**Control owner**: JS/CLI (deterministic file operations). MD Controller decides *when* to call it.

### Decision 2: Path resolution via bundle_layout imports

**Choice**: `lessons.mjs` imports `deckRoot()` and `LESSONS_DIR` from `bundle_layout.mjs` rather than hardcoding paths.

**Rationale**: `bundle_layout.mjs` is the SSOT for all run-bundle paths. Hardcoding `_lessons` or deck-root resolution logic would create a second, drift-prone path authority. This follows the pattern used by `ppt_flow.mjs` and all other framework scripts.

**Control owner**: JS (path constants owned by `run-bundle-layout`).

### Decision 3: Status integration via direct readdir, not subprocess

**Choice**: `ppt_flow.mjs status` collects lesson count by directly reading `_lessons/` (using `fs.readdirSync`) rather than shelling out to `lessons.mjs`.

**Rationale**: `ppt_flow.mjs` already imports `deckRoot()` and `LESSONS_DIR` from `bundle_layout.mjs`. A `readdirSync` call is trivial and avoids subprocess overhead. The `lessons.mjs` tool is for agent interaction, not for programmatic consumption by sibling scripts.

**Control owner**: JS/CLI (deterministic count).

### Decision 4: Lesson template in README, not a separate file

**Choice**: Add the copy-paste template to the existing `LESSONS_DIR_README` constant rather than creating a separate `TEMPLATE.md` file in `_lessons/`.

**Rationale**: A single README is scannable; a separate template file clutters the directory. The README already contains writing rules — the template is a natural extension. The agent reads the README to understand the rules and finds the template right there.

**Control owner**: JS (template text in `bundle_layout.mjs` constant).

### Decision 5: No new npm dependencies

**Choice**: `lessons.mjs` uses only Node.js built-ins (`fs`, `path`).

**Rationale**: The tool does simple file I/O and string parsing. No parsing library, no CLI framework needed. This keeps the dependency footprint zero and follows the `bundle_layout.mjs` pattern.

**Control owner**: JS.

## Verification Strategy

### Unit tests (`tests/`)

- **`tests/test_lessons.mjs`**: New test file covering:
  - `lessons.mjs list` on a temp deck fixture (with and without lessons)
  - `lessons.mjs list --json` output format
  - `lessons.mjs add` creating a file with correct template content
  - `lessons.mjs add` creating `_lessons/` directory when absent
  - `lessons.mjs add` refusing to overwrite, and failing when `--title` is missing
  - `lessons.mjs check` with and without lessons
  - `lessons.mjs search` with matches and no matches, and failing when keyword is missing
  - Path resolution edge cases (missing dir, non-deck path)
  - Test fixtures: use `tests/fixtures/` with minimal deck structures, not real `deck_*` data

### Integration tests

- **`tests/test_bundle_layout.mjs`**: Existing tests should continue to pass; add assertions for template presence in `LESSONS_DIR_README` and `GUIDE_FILE`
- **`ppt_flow.mjs status`**: Verify lesson count appears correctly in human and JSON output

### E2E tests

- Not required for this change. The behavior is additive and the existing `tests_e2e/` coverage of `ppt_flow status` will naturally exercise the new lesson count line.

### Manual verification

- Run `lessons.mjs list deck_ai_sdlc_bpm_keynote/3_versions/v1` — should show 2 lessons
- Run `lessons.mjs add <test_runDir> --title "test"` — should create file
- Run `ppt_flow.mjs status deck_ai_sdlc_bpm_keynote/3_versions/v1` — should show "Lessons: 2"

## Risks / Trade-offs

- **Agent still needs to choose to write**: We add capture triggers to docs, but the agent must still execute them. No code can force a lesson to be written. Mitigation: the prominent status display and CLI ease lower the barrier significantly.
- **Template staleness**: If the 4-question format evolves, the template in `LESSONS_DIR_README` and the one in `lessons.mjs add` could drift. Mitigation: `lessons.mjs add` SHALL import the template from `bundle_layout.mjs` (which exports `LESSONS_DIR_README`) or read it from a single shared constant, ensuring one source of truth.
