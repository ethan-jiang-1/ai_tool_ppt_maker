## ADDED Requirements

### Requirement: Active framework guidance separates slide identity from order

Active root, charter, workflow, reference, scripts README, slide-template, and authoring guidance SHALL consistently define formal `slide_id` as stable page identity and physical slide-block order as the source of derived 1-based `position`. Human-facing examples SHALL display `position + slide_id + title` and SHALL explain that current position remains convenient for conversation while formal ID remains valid across insert, delete, reorder, title edit, and render-engine changes. No active guidance SHALL describe a compound value such as `07_UXGap`, a PowerPoint XML ID, or a position-prefixed filename as the source identity.

New-page guidance SHALL require an Agent-authored `SUBJECT + MOVE` BlockCase mnemonic containing 5–8 ASCII letters: five or six letters preferred and seven or eight accepted only when materially clearer, with examples such as `UXGap` and `AICost`. It SHALL reject one-word page categories, embedded page numbers, random tokens, and forced consonant compression as authoring strategies. New template/init sources SHALL declare `identity.scheme: mnemonic-v1`; existing sources without it and unique legacy IDs SHALL be described as readable compatibility identities that ordinary structural editing does not silently migrate.

Guidance SHALL state that render identity is keyed by stable slide ID, engine, artifact kind, and fingerprint rather than position; `_generated/` remains framework-owned and any cross-version reuse is verified materialization, never manual copying or editing. Cross-version automatic materialization SHALL be described as applying to expensive verified raw renders, while cheap target-local outputs are rebuilt. A file that is only `legacy-located` SHALL not be described as verified current provenance.

Structural guidance SHALL distinguish source-only version publication from production refresh: apply is bound to the confirmed preview plan, publishes vNext through hidden staging, and never silently invokes a remote renderer. Missing/stale raw artifacts SHALL be reported as `needs_render` and rebuilt only through an explicitly authorized Generated Image Rebuild. Guidance SHALL provide the escape ladder of heading-only current-version repair, same-deck vNext, explicit rebuild in vNext, and recommending a new deck when audience, goal, or narrative materially changes.

Guidance MAY recommend Git as a source/control safety and audit layer, but SHALL keep run-bundle `v1/v2` as the user-facing work version and SHALL NOT make Git or tracking `_generated/` a prerequisite of structural correctness. Concrete Git detection and installation guidance remains owned by a separate environment/bootstrap change.

#### Scenario: Agent authors a new deck

- **WHEN** active template or authoring guidance asks the Agent to choose slide IDs
- **THEN** it requests a durable two-block mnemonic independent of current position and title wording
- **AND** prefers a clear six-letter form over an unreadable five-letter compression
- **AND** writes the supported identity-scheme marker for a mnemonic-native source

#### Scenario: Existing deck still has numbered IDs

- **WHEN** guidance discusses a legacy ID such as `s07_problem` after it moves
- **THEN** it displays the current position separately and treats the old ID as stable compatibility text
- **AND** does not instruct ordinary reorder to rename every legacy ID

#### Scenario: Structural path documentation agrees on reuse

- **WHEN** active workflow or charter guidance describes reorder/delete-only work
- **THEN** it says verified expensive raw renders may be materialized into the clean next version while Stage 3 and later cheap outputs are rebuilt locally
- **AND** it preserves the prohibitions on hand-editing or manually copying `_generated/`

#### Scenario: Dual-render guidance consumes one identity model

- **WHEN** active guidance mentions future multiple render engines
- **THEN** it uses `(slide_id, render_engine, artifact_kind, fingerprint)` as logical artifact identity
- **AND** does not define an engine-specific slide ID or ordering model

#### Scenario: Structural apply finds an unproven render

- **WHEN** active guidance describes a vNext whose required raw render cannot be verified
- **THEN** it instructs the Agent to report `needs_render` and seek explicit Generated Image Rebuild authorization when cost is material
- **AND** does not claim structure authorization also authorized remote rendering

#### Scenario: Work no longer belongs in the same deck

- **WHEN** audience, objective, or narrative changes materially rather than merely shifting pages
- **THEN** guidance allows the Agent to recommend a new deck instead of forcing preservation in the current version chain
- **AND** presents that product choice to the user before forking
