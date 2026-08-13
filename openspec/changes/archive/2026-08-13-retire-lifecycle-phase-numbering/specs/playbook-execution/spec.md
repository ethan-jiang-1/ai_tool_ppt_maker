## MODIFIED Requirements

### Requirement: Registered playbooks pass machine validation

Every active controller/shared node SHALL pass the canonical node-specification
validator. The validator SHALL bind the expected controller/shared-node
inventory, globally unique IDs, exact order, pipeline ownership, valid
`method_module` values, includes/requires, conditions, decisions,
selected-workflow `draft_route_nodes`, and existing target-module ownership
rules. Its checked-in normative manifest SHALL bind the controller/shared-node
inventory, exact controller-node order, supported-pipeline declarations, and
selected-workflow `draft_route_nodes`. A node MAY declare `draft_route: true`
only when the manifest places it in the exact create-deck workflow's unbound
source-to-first-raw route. Validation SHALL reject missing, extra, duplicated,
sibling-workflow, post-raw, or non-create-deck draft-route entries and SHALL
not rely on a stale hard-coded count alone. The optional key SHALL be either
absent or the literal Boolean `true`; explicit `false`, strings, numbers, null,
and duplicate YAML keys SHALL be rejected rather than normalized into a second
representation of non-routability.

`method_module` SHALL be the only bound lifecycle-location declaration. The
validator SHALL NOT require, normalize, derive a lifecycle decision from, or
emit a lifecycle-specific diagnostic for numeric `lifecycle_phase` or legacy
`phase` metadata. This requirement does not determine the reader's general
handling of otherwise unconsumed node-frontmatter keys.

#### Scenario: Draft-route projection matches playbooks

- **WHEN** the Harness indexes the updated create-deck playbook and controller manifest
- **THEN** each workflow's ordered `draft_route_nodes` begins with the shared workflow-selection node and exactly matches its applicable content, visual-system, selected Style Master, and first-raw nodes declared `draft_route: true`
- **AND** unknown, sibling, post-raw, and non-create-deck nodes cannot become draft-routable through manifest drift

#### Scenario: Draft-route declaration has one canonical form

- **WHEN** a node declares `draft_route` as false, a string, number, null, or duplicate key
- **THEN** canonical node parsing fails before Controller indexing or draft routing
- **AND** absence remains the only representation of a node that is not draft-routable

#### Scenario: Method module is the only lifecycle binding

- **WHEN** a registered node declares a valid `method_module` and omits
  `lifecycle_phase`
- **THEN** the canonical validator accepts its lifecycle location subject to the
  existing module, adapter, and workflow ownership checks
- **AND** it produces no numeric lifecycle-derived field or phase-specific
  diagnostic

### Requirement: probe-image-channels playbook runs doctor channel体检

`probe-image-channels.md` SHALL remain the shared `00-setup` Image2
environment-diagnostic controller. It SHALL orchestrate intake, offline
presence/resolver-count inspection, disclosure of expected provider
submissions, human confirmation, `ppt_flow doctor --probe-vendors` with
background/progress relay when long, and a bounded Summary. Optional
configuration writing requires a separate human confirmation and SHALL not
write secrets automatically. The current credential source normally resolves
one canonical entry; the playbook SHALL NOT imply an alternate multi-vendor
configuration format.

The disclosure SHALL state that `--probe-vendors` makes exactly one submission
per resolved channel and name the total count. If another current playbook
proposes `doctor --smoke`, it SHALL disclose exactly one expected first-channel
submission and obtain confirmation under the same rule. Declining SHALL make
zero live calls and SHALL NOT invalidate offline foundation evidence.

After an optional configuration write, the playbook SHALL report the saved
decision without automatically invoking a second readiness command. A later
verification request enters the normal foundation route, or the documented
direct recovery entry only when the normal entry is unavailable. A successful
probe proves channel health only; it SHALL not approve production, create page
authorization/state, or authorize a later provider attempt.

#### Scenario: Channel probe intent selects probe-image-channels

- **WHEN** the user asks which Image2 drawing channels are working
- **THEN** routing selects `probe-image-channels`
- **AND** the playbook resolves and discloses the submit count before offering the live report

#### Scenario: User confirms all-vendor probe

- **WHEN** the shared resolver supplies three ordered entries
- **AND** the Agent discloses that the probe will make three provider submits
- **AND** the user confirms
- **THEN** the playbook runs `doctor --probe-vendors`, relays progress, and shows the report before any `.env` or `_lessons` write

#### Scenario: User declines live diagnosis

- **WHEN** the user declines after the expected provider-submit count is disclosed
- **THEN** the Agent does not invoke `--probe-vendors` or `--smoke`
- **AND** zero provider submits occur

#### Scenario: Report-only short path skips confirm-write

- **WHEN** the user confirms the disclosed live probe but wants only a report
- **THEN** the Agent presents the probe report
- **AND** it does not write configuration or a lesson

#### Scenario: Channel health does not authorize page work

- **WHEN** a confirmed live probe succeeds
- **THEN** no production authorization or page-refinement state is created
- **AND** any later provider-generating action remains subject to its owner
  gate and exact authorization contract

#### Scenario: Confirm-write does not trigger a hidden recheck

- **WHEN** a confirmed `--probe-vendors` report is followed by a confirmed configuration write
- **THEN** the playbook reports that write without invoking another doctor or
  provider probe
- **AND** a later check requires an explicit route and any new live work needs
  a new disclosure and confirmation
