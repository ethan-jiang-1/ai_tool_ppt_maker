## MODIFIED Requirements

### Requirement: probe-image-channels playbook runs doctor channel体检

`probe-image-channels.md` SHALL remain the shared Phase-0 / `00-setup` Image2 environment-diagnostic controller. It SHALL orchestrate: intake -> offline Image2 presence/resolver-count inspection -> disclose expected provider submissions -> obtain human confirmation -> run `ppt_flow doctor --probe-vendors` with background/progress relay when long -> show Summary -> optional confirm-write only after separate human confirmation (`.env` plus `_lessons/image2-proven.yaml` with `via: env`, no secrets). It SHALL NOT auto-write `.env` or `_lessons`. The current credential SSOT normally resolves one canonical entry; the playbook SHALL NOT imply that this change adds a new multi-vendor configuration format.

The disclosure SHALL state that `--probe-vendors` makes exactly one submit per resolved vendor and name the total count. If another current playbook proposes `doctor --smoke`, it SHALL disclose exactly one expected first-vendor submit and obtain confirmation under the same rule. Declining SHALL make zero live calls and SHALL NOT invalidate offline base/Image2-presence evidence.

When the user wants a report without configuration changes, the Agent MAY omit confirm-write after presenting a confirmed live-probe report; report-only intent SHALL NOT bypass confirmation for the provider submits themselves. After confirm-write, the playbook SHALL verify the saved presence offline with `doctor --image2` and SHALL NOT automatically run the current optional follow-up `doctor --smoke`. A follow-up smoke is allowed only when the saved combination was not covered by the report or the human explicitly asks, after a new one-submit disclosure and confirmation. A successful probe SHALL prove channel health only. It SHALL NOT approve legacy production, create page-refinement authorization/state, or authorize a later provider attempt.

#### Scenario: Channel probe intent selects probe-image-channels

- **WHEN** the user asks which Image2 drawing channels are working
- **THEN** routing selects `probe-image-channels`
- **AND** the playbook resolves and discloses the submit count before offering the live report

#### Scenario: User confirms all-vendor probe

- **WHEN** the shared resolver supplies three ordered entries through a compatible or injected resolution seam
- **AND** the Agent discloses that the probe will make three provider submits
- **AND** the user confirms
- **THEN** the playbook runs `doctor --probe-vendors`, relays progress, and shows the report before any `.env` or `_lessons` write

#### Scenario: User declines live diagnosis

- **WHEN** the user declines after the expected provider-submit count is disclosed
- **THEN** the Agent does not invoke `--probe-vendors` or `--smoke`
- **AND** zero provider submits occur

#### Scenario: Report-only short path skips confirm-write

- **WHEN** the user confirms the disclosed live probe but wants only a report and no configuration change
- **THEN** the Agent presents the probe report
- **AND** does not write `.env` or `_lessons`

#### Scenario: Channel health does not authorize page work

- **WHEN** a confirmed live probe succeeds
- **THEN** no legacy build approval or modern page-refinement authorization is created
- **AND** any later provider-generating action remains subject to its own gate or future authorization contract

#### Scenario: Confirm-write does not silently submit again

- **WHEN** a confirmed `--probe-vendors` report is followed by a confirmed configuration write
- **THEN** the playbook runs offline `doctor --image2` to verify saved presence
- **AND** it does not invoke `doctor --smoke` unless a new one-submit disclosure and confirmation occur for an uncovered or explicitly requested probe
