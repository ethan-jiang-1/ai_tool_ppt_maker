## Why

The purpose of `_lessons/` is simple: **don't make the agent suffer through the same dead ends twice.** An agent wrestles with something — the user finally says "太难了，好不容易修好，记住这个" — or the agent itself, after 2+ attempts, finally figures it out. Either way, that hard-won insight should land in `_lessons/` so the next session picks it up and walks a straight line instead of repeating the same painful trial-and-error.

This already works when it happens. `deck_ai_sdlc_keynote/_lessons/` has two real lessons: one about which image vendor actually stays up, another about which Image2 endpoint worked. Those lessons were captured after real struggle — and they save real time when an agent reads them before guessing endpoints or picking vendors. But that only happens if the agent *remembers* to look.

The gap is that `_lessons/` is **passive infrastructure** — a directory with a README. The agent has to remember to check it, remember to write to it. Nothing structural prompts retrieval at session start, nothing prompts capture at the moment of triumph. The design is right; the operational loop is broken. This change closes that loop.

## What Changes

- **New CLI tool `lessons.mjs`** with `list`, `add`, `check`, and `search` subcommands. Operates on a run-dir, resolves to `deck_*/_lessons/`, and makes lesson operations trivially easy for the agent. This is the primary mechanism — the agent no longer needs to manually `ls`/`cat`/`grep` the `_lessons/` directory.
- **`ppt_flow.mjs status` integration** — status output gains a lesson line showing count and a hint to read them. This surfaces lessons every time the agent checks status (which happens at every session start and phase transition).
- **Workflow integration in charter docs** — `BOOTSTRAP.md` makes reading `_lessons/` a mandatory step when entering an existing deck, and documents user-triggered capture phrases. `AGENT_CONTRACT.md` adds a lesson capture obligation at phase gates. `AGENTS.md` adds explicit "check lessons" / "capture lessons?" steps at phase transitions and after error resolution.
- **README and deck-guide template updates** — `LESSONS_DIR_README` gains a copy-paste markdown template for new lessons. `GUIDE_FILE` template gains a prominent lessons section with the CLI command.

## Capabilities

### New Capabilities
- `lessons-management`: CLI tooling (`lessons.mjs`) for listing, adding, searching, and checking lessons in a run bundle's `_lessons/` directory. Owns the operational surface for agent-lesson interaction.

### Modified Capabilities
- `framework-charter`: BOOTSTRAP.md gains mandatory lesson retrieval step on deck entry and user-trigger capture phrases. AGENT_CONTRACT.md gains lesson capture obligation at phase gates. AGENTS.md gains explicit lesson check/capture workflow steps.
- `cli-surface`: `ppt_flow.mjs status` output gains a lesson count line and a hint when lessons exist.
- `run-bundle-management`: `LESSONS_DIR_README` gains a copy-paste lesson template. `GUIDE_FILE` template gains a more prominent lessons section with the `lessons.mjs` CLI command.

## Impact

- **New file**: `PPTMAKER_FRAMEWORK/scripts/lessons.mjs` — zero new dependencies, uses Node.js built-ins only (same pattern as `bundle_layout.mjs`)
- **Modified files**: `ppt_flow.mjs`, `BOOTSTRAP.md`, `AGENTS.md`, `AGENT_CONTRACT.md`, `bundle_layout.mjs`
- **Tests**: New unit tests in `tests/` for `lessons.mjs`; existing tests in `tests/test_bundle_layout.mjs` should continue to pass (only README template text changes)
- **Compatibility**: Fully backward-compatible. `lessons.mjs` is additive — existing decks with or without `_lessons/` continue to work. No migration required.
- **Control owner**: JS/CLI owns `lessons.mjs` and status integration (deterministic tooling). MD Controller owns the decision of when to read/write lessons (workflow instructions guide, not enforce).
