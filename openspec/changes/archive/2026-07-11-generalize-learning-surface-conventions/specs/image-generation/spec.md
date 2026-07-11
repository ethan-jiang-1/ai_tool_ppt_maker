## MODIFIED Requirements

### Requirement: Image2 smoke, persist secrets to .env, lessons to _learning/

Framework entry docs (`BOOTSTRAP.md` and Image2 SSOT `workflow/00-setup/03-tool-selection.md`) SHALL require: on missing credentials or first image failure, the agent tries multiple combinations (IMAGE2_*, aliases, BASE_URLS, `--base-url`, user URLs) and a cheap smoke (`style-master … --force --resolution 1k`) before telling a novice to self-configure.

On success, the **run bundle** retains in two **explicitly named** places:

1. **Secrets** → walk-up `.env` (prefer deck-root): working `IMAGE2_API_KEY` / `IMAGE2_BASE_URL`
2. **Non-secret lesson** → `deck_*/_lessons/image2-proven.yaml` as **one concrete lesson file** under `_lessons/` (self-retained lessons / read-before-guess). That file SHALL obey `_lessons/README` writing rules (one lesson, no secrets). Fields: `proven_at`, `base_url`, `via` (`env`|`cli`|`alias`|`user-provided`), optional `notes`; **no API key field**

Entry docs SHALL describe `_lessons/` as the general retained-lessons surface and SHALL treat `image2-proven.yaml` as an Image2 example entry, not as the definition of `_lessons/`. Next session SHOULD read `_lessons/` (including `image2-proven.yaml` when present) before guessing endpoints. The agent SHALL NOT leave proven combos only in chat, SHALL NOT put keys in `_lessons/`, and SHALL NOT invent non-canonical folders for these lessons.

#### Scenario: Smoke succeeds then bundle retains the lesson

- **WHEN** a smoke combination succeeds after earlier failures
- **THEN** `.env` has canonical `IMAGE2_*` for the winning combo
- **AND** `_lessons/image2-proven.yaml` exists without an API key field

#### Scenario: Novice is not left with a single hard failure

- **WHEN** doctor reports missing Image2 URL or the first smoke fails
- **THEN** entry docs direct further combinations before "configure the API yourself" as the only next step

#### Scenario: Persist docs name _lessons as general surface

- **WHEN** an agent follows BOOTSTRAP / `03-tool-selection` after a successful smoke
- **THEN** those docs tell them to write the non-secret receipt under `_lessons/` as one lesson among possible lessons (not under `_state/` or as chat-only)
- **AND** they do not describe `_lessons/` as an Image2-only directory
