## MODIFIED Requirements

### Requirement: Migrate-import playbook guards off-path UX

`migrate-import` SHALL distinguish import normalization, ordinary structural versioning, and explicit legacy-to-HTML migration before writes. For explicit HTML migration, the Controller SHALL first obtain the selected migration route and preset, invoke the closed preparation operation, and show the returned projected candidate/checklist. The Agent then authors the complete structured candidate from the legacy material; the Controller SHALL not infer structured bodies from prompts or ask the human to reproduce deterministic source/control/asset scaffolding. An unprepared or incomplete preview result is a `guide`: the Controller follows its exact prepare or bounded authoring action and does not present it as comparison evidence or a decision gate.

HTML migration SHALL require a complete Agent-authored structured candidate, a complete proposed HTML deck/contact sheet, exact plan hash/old-side mode, and human confirmation before publication. After the human accepts, the Controller SHALL invoke the state owner's exact confirmation operation; it must succeed in atomically advancing `confirm-html-migration` to the bounded `apply-html-migration` record before normal apply. The Controller SHALL not direct the human to modify state or recreate this binding from prose. The old side SHALL use only current verified legacy evidence in `verified-current`; missing/stale evidence SHALL deterministically use `degraded-missing|degraded-stale` with diagnosis/placeholder, no old pixels/provider call/parity claim, and an optional separately authorized legacy-maintenance next action. The controller SHALL not mutate the legacy version, carry authorization, or treat ordinary structural publication as a migration renderer. Candidate identity/confinement conflicts, confirmation receipt drift, an exact hash/mode mismatch, and active/uncertain apply ownership remain hard stops because they protect authored work, target identity, and recovery. If apply reports a cross-host/uncertain migration journal, the Controller SHALL explain the exact target/staging risk, obtain confirmation that no migration apply is active, retain the opaque token internally, and invoke only `apply --recover-journal <token>` after the 300000-ms floor; a decline makes zero writes. Same-host proven-active ownership is never overridden.

#### Scenario: Agent receives a preparation-to-authoring handoff

- **WHEN** a markerless user selects explicit HTML migration and preparation succeeds
- **THEN** the Controller presents the candidate checklist and returns semantic slide-body authoring to the Agent
- **AND** it does not claim IMAGE PROMPT text was converted automatically

#### Scenario: Incomplete candidate is guided rather than silently prepared

- **WHEN** preview reports a preparation or authoring guide
- **THEN** the Controller follows the report's nearest legal action and reruns the same preview check
- **AND** it does not create a vNext, state decision, or provider request

#### Scenario: Legacy comparison evidence is stale

- **WHEN** migration preview has no current verified old-side pixels
- **THEN** the Controller presents the exact degraded mode with no old pixels and may offer separately authorized legacy maintenance
- **AND** does not silently regenerate old images

#### Scenario: Human confirmation obtains one durable binding

- **WHEN** the user accepts the exact complete preview hash and old-side mode
- **THEN** the Controller invokes the state-owned confirmation operation before
  apply and receives its exact apply-node result
- **AND** it does not hand-edit state or invoke normal apply if confirmation
  reports drift or a hard stop

#### Scenario: User declines uncertain migration recovery

- **WHEN** apply-journal ownership cannot be proven stopped and the human declines confirmation
- **THEN** the controller leaves journal/reservation/staging/visible versions unchanged
