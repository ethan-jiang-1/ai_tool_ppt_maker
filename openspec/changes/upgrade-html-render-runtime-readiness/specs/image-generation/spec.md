## MODIFIED Requirements

### Requirement: Image2 smoke, persist secrets to .env, lessons to _lessons/

Framework entry docs (`BOOTSTRAP.md` and Image2 SSOT `workflow/00-setup/03-tool-selection.md`) SHALL require the Agent to verify `IMAGE2_API_KEY` and `IMAGE2_BASE_URL` through offline `doctor --image2` before offering a live diagnostic. `doctor --smoke` SHALL be the cheap first-vendor channel diagnostic; entry docs SHALL disclose its one expected provider submit and obtain human confirmation before invocation. `style-master ... --force --resolution 1k` SHALL NOT be presented as an interchangeable channel-health probe because it creates a real production reference asset.

When image-path symptoms persist, entry docs SHALL offer channel体检 in plain language. Before `doctor --probe-vendors`, they SHALL disclose the locally resolved vendor count and one submit per vendor and obtain confirmation. Declining either live probe SHALL make zero provider submits and SHALL NOT invalidate offline readiness evidence. Probe success SHALL prove channel health only and SHALL NOT authorize later production work.

After a successful confirmed probe and separate confirmation to retain the result, the **run bundle** retains:

1. **Secrets in `.env`** (walk-up, prefer deck-root): `IMAGE2_API_KEY` and `IMAGE2_BASE_URL` values.
2. **Non-secret lesson** -> `deck_*/_lessons/image2-proven.yaml` under `_lessons/` (read-before-guess). Fields: `proven_at`, `base_url`, `via` (`env`|`cli`), optional `notes`; **no API key field**.

Entry docs SHALL describe `_lessons/` as the general retained-lessons surface and SHALL treat `image2-proven.yaml` as an Image2 example entry, not the definition of `_lessons/`. Next session SHOULD read `_lessons/` before guessing endpoints. The Agent SHALL NOT auto-write `.env` or `_lessons` from a probe, leave proven combinations only in chat, put keys in `_lessons/`, or invent non-canonical lesson folders.

#### Scenario: Smoke succeeds then bundle retains the lesson

- **WHEN** a confirmed smoke succeeds with valid credentials
- **AND** the human separately confirms retaining the working result
- **THEN** `.env` retains the working `IMAGE2_API_KEY` and `IMAGE2_BASE_URL`
- **AND** `_lessons/image2-proven.yaml` exists without an API key field

#### Scenario: Novice is not left with a single hard failure

- **WHEN** offline Image2 readiness reports missing URL/key or a confirmed smoke fails
- **THEN** entry docs offer concrete credential remediation or a confirmed channel-health diagnostic before leaving "configure the API yourself" as the only next step
- **AND** no live diagnostic starts before its submit count is disclosed and confirmed

#### Scenario: Persist docs name _lessons as general surface

- **WHEN** an Agent follows BOOTSTRAP or `03-tool-selection` after a successful confirmed smoke
- **THEN** those docs offer the non-secret receipt under `_lessons/` as one lesson among possible lessons, not under `_state/` or as chat-only
- **AND** they do not describe `_lessons/` as an Image2-only directory

#### Scenario: User declines channel diagnosis

- **WHEN** the Agent discloses the expected `--smoke` or `--probe-vendors` submit count and the human declines
- **THEN** the Agent does not invoke the live flag or style-master as a substitute probe
- **AND** no probe-derived `.env` or `_lessons` write occurs
