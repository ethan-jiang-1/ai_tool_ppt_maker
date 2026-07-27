## MODIFIED Requirements

### Requirement: Cross-pipeline production-mode transitions are versioned state transactions
The state owner SHALL expose one CAS-bound transition transaction for an exact supported source run whose authoritative mode/pipeline differs from the requested target mode/pipeline. A transaction has the closed plan kinds `mode-transition` and `legacy-adoption`. Both bind the source execution/version/mode/pipeline, anticipated clean target version, target mode/pipeline, confined candidate receipts, exact plan hash, explicitly authored target-intake object and digest, and the existing target-user `transition_confirmation` decision. `legacy-adoption` additionally binds the immutable legacy observation digest and explicit adoption-matrix digest. The named confirmation command is an exact plan-hash transaction commit of the selected target intake, not a policy `confirm` gate or risk waiver. It SHALL use the active Controller execution and existing atomic state writer; it SHALL NOT create a deck-global transition authority, a second mode map, or a new reserved evidence node.

`legacy-adoption` SHALL be prepared only after the direct observer classifies the exact source/state pair as `recognized-legacy`. Its target mode and pipeline SHALL be exactly `image2-page-authority` / `page-authority-image2-v1`; it SHALL not accept a caller-selected target mode. The observer's `current` result SHALL leave the existing Page Authority lifecycle authoritative. `current-pair-corrupt` and `unsupported-or-corrupt` are hard-stops owned by the Page Authority repair owner or repair/export owner respectively. No observer, state reader, confirmation, or transaction path may infer adoption from a prompt, pixel, generated artifact, metadata, history, or a partial source/state pair.

Prepare/preview SHALL not write state or replace the source execution. Only the exact plan-hash commit SHALL CAS-capture the complete source Controller context into the existing `playbook_stack` and activate the bounded `production-mode-transition/apply-production-mode-transition` execution. A cross-pipeline suspension frame SHALL be the sole active stack entry while the transaction runs and SHALL contain the active source execution plus its complete ordered pre-existing ordinary parent stack, exact source run version/mode/pipeline, anticipated target version, exact plan hash, plan kind, and a closed `transition-suspended` disposition. Those copied values are receipt bindings only: the source and target `production_mode.by_version` records remain the sole routing authority.

On verified target registration, state SHALL append an exact receipt-linked source execution archive to reference-only history, remove the temporary suspension frame, and start a fresh target `create-deck` execution through a closed target-baseline handoff. That handoff SHALL write only new target records required by the existing dependency graph: `instantiation`, `checkpoint-intake`, the mode-specific author/configuration nodes, and the exact target-intake decision/evidence binding. It SHALL then set the active node to `preview-content` for HTML, `authorize-image2-style-master` for whole-page Image2, or `authorize-page-authority-raw` for a Page Authority adoption target. It SHALL not invoke init, copy source Controller records, or create a target gate, review, delivery decision, provider authorization, raw manifest, final manifest, PPTX/notes receipt, refinement record, or final completion. If owned recovery proves no target became visible, state SHALL remove only the active transition execution and restore the complete captured source Controller context before requiring a fresh preview.

The only transition active-node record SHALL be `production-mode-transition/apply-production-mode-transition`. Its schema-closed fields SHALL bind the exact plan hash, plan kind, source execution ID/version, source mode/pipeline, target version/mode/pipeline, transition-candidate receipt digest, valid `transition_target_intake` object/digest pair, and exact `transition_confirmation: { kind: "user", decision: "proceed", at: <valid ISO-8601> }`. A `legacy-adoption` record SHALL additionally bind only the observer and matrix SHA-256 values required by its preview. The confirmation command SHALL atomically create that record only after revalidating the preview. Before apply, recovery, registration, or handoff, the state owner SHALL revalidate the complete decision tuple and, for adoption, its observation/matrix tuple; an absent, malformed, or mismatched tuple hard-stops before journal, reservation, staging, target, or provider mutation. It SHALL carry neither a `reason` nor `waived`/continuation semantics, and target handoff SHALL map the recorded decision time into the new target `checkpoint-intake` decision/evidence rather than inventing a later user decision. Apply, recovery, and registration/handoff SHALL consume only that record plus the exact transition plan/receipt. They SHALL not reuse or write a retired migration node, old-side mode, source-migration field, or HTML-migration receipt authority.

The source version's mode, source, generated work, approvals, delivery review, refinement work, and existing history events SHALL remain unchanged through prepare, preview, decline, stale confirmation, collision, and failed apply. A visible target receives its authoritative mode only after the state owner verifies the target marker and exact transition success receipt. Target records SHALL not inherit source review, provider authorization, reset, completion, raw/final artifact, prompt, provider request, or generated evidence. An adoption target SHALL start with `source_epoch: 1` and empty Page Authority raw/review/final/delivery evidence, with every target slide marked as needing later separately authorized raw generation. `transition_apply_current` is entry-only and passes only for the exact active current transition record and bindings. `transition_publish_or_recovery_recorded` is exit-only and passes only inside atomic terminal finalization with a matching target receipt plus completed selected-mode registration and target handoff, or a verified no-visible-target recovery that restored the source. Generic node completion, CLI prose, a visible target without completed handoff, or a retired record SHALL never satisfy either condition.

For an old-enough cross-host or owner-uncertain journal, recovery takeover SHALL require a separate closed `no-active-apply` fact attestation that binds the exact opaque token and journal bytes, source execution/version, target version, and plan hash. It remains inside the recovery `hard-stop`, not a policy `confirm` or waiver: it carries no risk reason, cannot waive a live/uncertain writer, and does not establish target-intake approval. Journal, plan, source/target identity, observation/matrix binding, or state-CAS drift invalidates that attestation. A human conversation, stale attestation, or token alone SHALL not authorize takeover.

#### Scenario: Transition preparation preserves the source
- **WHEN** an `html-only` or `html-then-image2` source prepares an `image2-only` target
- **THEN** transition scratch records only candidate work and state/source nodes/generated tree remain unchanged

#### Scenario: Stale confirmation is rejected
- **WHEN** a source mode, candidate receipt, anticipated target, or expected state identity changes after preview
- **THEN** confirmation or apply fails before target reservation/publication and directs the Controller to a fresh preview

#### Scenario: Visible target receives distinct authority
- **WHEN** a confirmed transaction publishes a verified target with its matching marker and receipt
- **THEN** state registers only the target version's selected mode and declared Controller handoff
- **AND** source approvals, provider authority, and completion remain source-version history

#### Scenario: Recovery sees an ambiguous target
- **WHEN** recovery finds a visible target without the exact transition receipt or with a conflicting target mode
- **THEN** it hard-stops without deleting or rewriting either version and names the state-owned inspection/recovery action

#### Scenario: Transition-active state retains a source execution without resuming it
- **WHEN** a confirmed cross-pipeline transaction is applying or awaiting recovery
- **THEN** the source Controller-node snapshot remains in a run-bound `transition-suspended` stack frame
- **AND** generic resume cannot select it

#### Scenario: Completed handoff archives the source before target work
- **WHEN** a confirmed cross-pipeline transaction publishes, registers, and hands off its target
- **THEN** state creates only receipt-bound target baseline records and starts the target's declared next node
- **AND** no baseline record is byte-copied from the source execution or contains source execution authority

#### Scenario: A caller targets a different execution version
- **WHEN** active state is bound to `v2` and state, resume, or a node writer is invoked for `v1`
- **THEN** it reports `execution_run_version_mismatch` without exposing v2's Controller progress or changing state

#### Scenario: Uncertain recovery attestation cannot be replayed
- **WHEN** an uncertain-owner no-active-apply attestation was recorded and the journal bytes, plan, source execution, or target identity changes
- **THEN** recovery rejects it before takeover and requires a new exact inspection and fact attestation
- **AND** it does not treat the prior attestation as a waiver or force path

#### Scenario: Transition apply entry cannot be forged
- **WHEN** an ordinary or retired Controller execution reaches `apply-production-mode-transition`
- **THEN** `transition_apply_current` fails unless the exact state-owned production-mode confirmation is active for the selected source version

#### Scenario: Transition apply exit requires durable outcome
- **WHEN** an apply command prints success but no matching transition success receipt, completed selected-mode registration, and target handoff were atomically persisted
- **THEN** `transition_publish_or_recovery_recorded` fails and the active apply node remains in progress

#### Scenario: Terminal finalization replaces rather than completes apply
- **WHEN** state atomically completes verified target registration and baseline handoff, or proves no target and restores the captured source
- **THEN** it respectively starts the target execution or restores the source execution without a completed transition apply node
- **AND** the terminal outcome cannot be replayed as generic Controller completion

#### Scenario: Legacy adoption starts a fresh Page Authority evidence boundary
- **WHEN** a recognized legacy source confirms an exact adoption plan and its target is published
- **THEN** the target has `image2-page-authority` with `source_epoch: 1` and resumes at `authorize-page-authority-raw`
- **AND** it contains no inherited raw/review/final/provider/delivery evidence or provider submission
