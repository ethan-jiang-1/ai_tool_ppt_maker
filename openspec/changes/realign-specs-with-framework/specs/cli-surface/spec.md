## MODIFIED Requirements

### Requirement: CLI surface preserves command names
The `ppt_flow` CLI SHALL expose exactly 14 top-level commands: `doctor`, `init`, `status`, `approve`, `style-master`, `validate`, `pilot`, `build`, `refresh`, `new-version`, `test`, `state`, `slides`, and `image2`. Cross-pipeline page-authority work SHALL be exposed only by the closed `state --*-production-mode-transition` operations. There SHALL be no top-level `migrate-html` or `production-mode-transition` command and no compatibility help entry for either removed surface.

#### Scenario: Help lists the complete current surface
- **WHEN** `ppt_flow --help` runs
- **THEN** the 14 current command names are listed exactly once
- **AND** no removed migration or top-level transition command is advertised

#### Scenario: Existing init invocation remains valid
- **WHEN** an Agent runs `ppt_flow init deck_demo --deck-type keynote --style dark-executive`
- **THEN** a run bundle is created using the compatible invocation shape and the current `image2-only` default

### Requirement: CLI exposes a closed versioned production-transition protocol
`ppt_flow state` SHALL expose mutually exclusive `--prepare-production-mode-transition <html-only|html-then-image2|image2-only>`, `--preview-production-mode-transition`, `--confirm-production-mode-transition --plan-hash <hash>`, `--apply-production-mode-transition --plan-hash <hash>`, `--confirm-production-mode-transition-recovery <owner-token>`, and `--recover-production-mode-transition [owner-token]` operations. They SHALL delegate to the state-owned transaction and selected adapter; they SHALL not accept `--force`, caller-supplied lineage paths, old-side migration modes, or legacy migration fields.

Prepare and preview SHALL remain local and non-writing with respect to source state and visible versions. Confirmation is the first state write and binds the exact source execution, target mode/intake, candidate inputs, anticipated target version, and plan hash to the `production-mode-transition/apply-production-mode-transition` execution. Apply SHALL rederive that hash before publication. An Image2 target reports the later normal authorization/pilot/build boundary and does not submit a provider request during transition.

Recovery SHALL operate only on the exact transition journal or one exact visible receipt. Same-host proven-dead recovery is automatic only after the existing 60000-ms floor; cross-host or otherwise uncertain recovery requires the state-owned no-active-apply confirmation after the 300000-ms floor. A live owner is non-overridable. No removed migration Controller, node, receipt, scratch owner, or command may start or finish a transition.

#### Scenario: HTML-to-Image2 preview is offline
- **WHEN** a valid HTML source previews an explicitly authored `image2-only` candidate
- **THEN** CLI returns the exact target mode, plan hash, and later Image2 authorization boundary
- **AND** it makes no provider request or target version write

#### Scenario: Image2-to-HTML selects the target mode
- **WHEN** a consistent Image2 source prepares an `html-then-image2` candidate
- **THEN** CLI preserves the source and reports the selected HTML target mode rather than silently choosing `html-only`

#### Scenario: Confirmation flags conflict
- **WHEN** a caller mixes transition operations, JSON, gate recovery, delivery review, or another state operation
- **THEN** CLI returns one `USAGE` envelope before source, state, candidate, or target mutation

#### Scenario: Apply lacks current confirmation
- **WHEN** apply receives a missing, stale, or mismatched plan hash
- **THEN** CLI hard-stops before reservation or publication and directs the Controller to the exact preview checkpoint

#### Scenario: Declining an unconfirmed transition is non-writing
- **WHEN** the Controller does not call confirmation after displaying an exact preview
- **THEN** the source execution, current node, and authoritative source mode remain unchanged
- **AND** no transition execution or target version is created

#### Scenario: Recovery grammar is closed
- **WHEN** a caller combines recovery with another operation or supplies an invalid owner token
- **THEN** CLI returns one `USAGE` envelope before state, journal, staging, source, or target mutation

#### Scenario: Uncertain recovery requires durable confirmation
- **WHEN** an old-enough uncertain journal is recovered without a current matching recovery-confirmation record
- **THEN** CLI hard-stops before takeover and names the closed confirmation form
- **AND** a stale confirmation cannot be replayed after journal or plan drift

#### Scenario: Confirm creates only the current transition record
- **WHEN** the Controller confirms an exact production-mode transition preview
- **THEN** state starts `production-mode-transition/apply-production-mode-transition` with the bound source execution, target mode/version, and plan hash
- **AND** it creates no removed migration field or node

#### Scenario: Confirmation binds target intake
- **WHEN** the Controller confirms a transition preview with explicit target topic, audience, and success criteria
- **THEN** the plan binds those target-intake fields and target handoff records only new target intake evidence
- **AND** a source Controller decision cannot satisfy the target intake node

### Requirement: Resume-card action displays derive from one inspection projection
`state` and `status` SHALL retain non-empty public `workflow_summary` and `suggested_next` fields, but each SHALL be a display adaptation of the same `workflow_inspection.primary_action` in that response. `eligible_candidates` MAY remain as a bounded diagnostic field, but SHALL not select a route, override the primary action, or expose an alternate mutation command. The shared state card retains raw cursor context but SHALL not independently evaluate a resume/next action.

#### Scenario: State and status display the same primary action
- **WHEN** `state` and `status` render a response for the same workflow-inspection projection
- **THEN** each derives its public resume-card action from that response's `primary_action`
- **AND** neither display field or eligible candidate selects an alternate route

## REMOVED Requirements

### Requirement: Legacy-to-HTML migration has preview and exact apply commands
**Reason**: The markerless/legacy source-to-HTML path, its top-level command, scratch owner, old-side modes, confirmation nodes, and receipt continuation are intentionally unsupported.

**Migration**: Recreate unsupported old runs or use the current state-owned production-mode transition from a valid explicit source.
