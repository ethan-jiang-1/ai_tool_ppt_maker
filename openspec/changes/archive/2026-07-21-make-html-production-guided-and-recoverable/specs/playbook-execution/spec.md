## MODIFIED Requirements

### Requirement: playbook/ directory contains the registered MD controllers

`PPTMAKER_FRAMEWORK/playbook/` SHALL contain eleven active ordered MD Controllers: the existing ten
controllers plus `image2-refine.md`, and shared node `classify-change.md`.
`legacy-image2-maintenance` remains markerless Phase 5; `probe-image-channels` remains Phase 0.
`image2-refine` SHALL serve only a marked HTML-first run. Normal entry requires current
`html-delivery-review: proceed` with complete evidence; explicit user entry MAY instead begin with offline
`image2 plan --force --reason` when current final-slide/slot identity is valid and the resulting
version-scoped prerequisite waiver becomes authoritative. It SHALL not be entered by fresh create,
ordinary local iteration, or markerless maintenance, and no prerequisite waiver authorizes provider
generation.

#### Scenario: Agent lists available controllers

- **WHEN** the playbook index is built
- **THEN** it contains eleven ordered controllers, including optional modern refinement and legacy maintenance as distinct owners

#### Scenario: HTML deck selects legacy controller

- **WHEN** an HTML-first run attempts to enter `legacy-image2-maintenance`
- **THEN** entry validation fails with a pipeline-ownership diagnostic

#### Scenario: User explicitly enters refinement before complete delivery evidence

- **WHEN** current HTML final-slide/slot inputs are identifiable and the user accepts the displayed prerequisite risk with a reason
- **THEN** the controller may create only the offline prerequisite-waived plan
- **AND** it still requires exact authorization before any provider operation

### Requirement: Gates are enforced at node boundaries

At a gate boundary, the MD Controller SHALL show what is missing/stale, the recommended repair command,
and the explicit continuation command when the risk is reversible. It SHALL consume producer-owned CLI
diagnostics rather than parse prose or edit state. A continuation SHALL persist a bounded human reason
and remain visibly `waived`, with completeness reported independently; it SHALL not infer approval from
successful rendering. Hard-stop
conditions SHALL explain the protected invariant and the safe recovery route.

No node SHALL transition to completed until its exit conditions are met. HTML preview composition MAY
run while gates are pending and SHALL not waive them. For HTML-first runs, the Controller SHALL present
the exact ordered content projection before content approval and production-equivalent
representative/affected-page artifacts before visual approval. JS SHALL require current version-scoped
`html-content-review` and `html-visual-review` approval or explicit waiver decisions for Stage 4;
metadata mirrors alone SHALL not satisfy them. For markerless legacy, existing
style-master/pilot/header artifact presentation, metadata readiness, and preview-versus-production
semantics SHALL remain compatible. No branch's evidence SHALL satisfy the other branch.

#### Scenario: HTML preview is available before approval

- **WHEN** HTML gates are pending but source/runtime checks pass
- **THEN** the Controller may show current preview artifacts
- **AND** cannot complete delivery or infer approval from successful rendering alone

#### Scenario: HTML content changes after review

- **WHEN** the ordered reviewed content fingerprint changes
- **THEN** approval or waiver freshness becomes stale and the owning node cannot complete without a current decision

#### Scenario: Legacy preview remains compatible

- **WHEN** a markerless deck has a style master and pending gates
- **THEN** pilot preview may run without waiving gates

#### Scenario: Content evidence is stale

- **WHEN** a build observes stale content or visual evidence with valid source and version identity
- **THEN** the Controller presents the recommended preview/approve route and a reasoned force route
- **AND** it does not silently choose either path for the user

#### Scenario: User chooses the recommended repair

- **WHEN** the user follows the displayed preview and approval action
- **THEN** the Controller rechecks the exact current plan and continues when approved
- **AND** no conversation-only decision is treated as state evidence

#### Scenario: User chooses explicit continuation

- **WHEN** the user supplies the declared waiver/force reason
- **THEN** the Controller invokes the owning public CLI operation
- **AND** status reports the waived decision and independently computed evidence completeness separately from approved readiness

#### Scenario: Hard-stop transaction conflict

- **WHEN** an active journal, reset fence, mismatched plan identity, or corrupted state is reported
- **THEN** the Controller explains the protected invariant and recovery action
- **AND** does not offer a force path that could overwrite or guess ownership

### Requirement: HTML final review is bound to current delivery evidence

Every HTML controller that can publish a new contact sheet/PPTX/notes SHALL finish through current
`html-delivery-review`. The Controller SHALL show current delivery artifacts, record exact typed
decision `proceed|repair|redirect`, require and persist a concise reason for repair/redirect or forced
proceed, and route the decision before completion. JS SHALL bind/validate the decision against current
nullable HTML-production reset ID, HTML delivery digest, every reviewable artifact actually present,
and every lineage receipt required by the selected decision mode. Conversation memory, a pre-reset
decision, or a prior execution's node completion SHALL not substitute for current evidence. Markerless
legacy final-review behavior remains under its existing controller/state semantics.

After obtaining the decision, the Controller SHALL invoke `ppt_flow state <run-dir>
--record-delivery-review <decision>`. It SHALL add `--reason <text>` only for repair/redirect, except
that an explicit evidence-risk continuation uses `proceed --force --reason <text>`. Normal proceed
and `repair|redirect` require complete current delivery evidence. Forced proceed requires current reviewable target-version
PPTX/contact-sheet bytes and records missing/stale lineage as an evidence waiver; absent reviewable
artifacts or unsafe identity remains a hard stop. The one public call SHALL atomically record system
evidence and the current final-review node decision. The Controller SHALL not call `setNodeDecision`
again, hand-edit state, call the JS module through ad hoc code, or pass digest/SHA/path arguments.

Repair reason SHALL enter shared pipeline-first classification and its owning repair node. Create-deck
redirect SHALL reset to `checkpoint-intake` and downstream current-execution records; iteration redirect
SHALL ask for exact target
`edit-text|edit-visual|edit-notes|restructure-slides|create-deck|stop` before switching. `stop` persists
`waiting_for: user:resume-or-replace`; HTML redirect SHALL reject legacy maintenance. A conflict/stale
result SHALL return to current status/artifact presentation rather than record the conversation alone.

#### Scenario: Local notes refresh completes technically

- **WHEN** Stage 5 publishes current notes after an HTML notes edit
- **THEN** the edit controller still shows the current result and records a new evidence-bound delivery decision before completion

#### Scenario: Prior execution said proceed

- **WHEN** a new HTML delivery digest differs from the prior reviewed digest
- **THEN** the prior decision cannot complete the current controller

#### Scenario: Controller persists proceed through public state route

- **WHEN** the user accepts the current shown delivery
- **THEN** the Controller calls the closed state evidence operation with normal or explicitly forced `proceed`
- **AND** completion relies on the resulting evidence-referenced node decision, not chat memory or a second write

#### Scenario: Forced proceed lacks reviewable artifacts

- **WHEN** the user requests forced proceed but current target PPTX/contact-sheet bytes cannot be shown
- **THEN** the Controller explains the protected review-identity invariant and recommends rebuilding artifacts
- **AND** it does not offer state editing as a continuation

#### Scenario: Redirect does not guess a controller

- **WHEN** the user rejects current delivery and asks to take a different direction
- **THEN** the Controller records redirect plus reason, remains incomplete, and follows create-deck re-intake or the exact iteration target prompt
- **AND** it does not infer or switch controller solely from prose
