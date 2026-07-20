## ADDED Requirements

### Requirement: Refinement is optional, bounded, and authorization-gated

Only a marked HTML-first run with current `html-delivery-review: proceed` SHALL be eligible for modern refinement. The Agent SHALL recommend at most 2-4 slides with one named, no-text visual slot each and show the expected setup and page attempt count. The system SHALL derive an immutable deterministic plan hash from run/version, selected stable slide IDs, slot bindings, profile, style-reference status, and attempt count. It SHALL submit no provider request until a human authorizes that exact plan. Authorization SHALL atomically allocate one single-use random authorization ID and its attempt IDs; those random IDs SHALL not alter the plan hash. Scope expansion, retry, stale plan, changed binding/profile, or new version SHALL require a fresh plan and authorization.

#### Scenario: User ends after HTML delivery
- **WHEN** the user declines optional refinement
- **THEN** the HTML delivery remains complete and no refinement plan, authorization, pending node, or lazy derived directory is created

### Requirement: Chargeable attempts are persisted and never blindly retried

Each setup or page generation SHALL have a persisted random attempt ID before submission and transition only through `planned`, `submitting`, `submitted`, `failed`, or `unknown-submit`. A crash or timeout after `submitting` SHALL reconcile only through provider-safe evidence bound to that ID. If proof is unavailable, the attempt SHALL be `unknown-submit`, block automatic resubmission, and require a human decision to retain the reconciled result or abandon the attempt; abandoning cannot reopen it and any replacement requires a fresh plan and authorization. Partial failure SHALL preserve completed candidates and HTML fallback for other slides.

#### Scenario: Submit outcome is unknown after crash
- **WHEN** recovery finds a `submitting` page attempt without reconcilable provider evidence
- **THEN** it records `unknown-submit` and does not issue another provider request

### Requirement: Candidate review and source promotion are separate transactions

Candidate bytes, SHA, receipt, and same-geometry comparison preview SHALL be derived evidence under version-owned `_generated/image2_refinement/`. The comparison SHALL use public Phase-3 review-only composition to place the candidate in its resolved HTML slot geometry/crop and SHALL not become a current delivery manifest. A human SHALL independently `accept` a candidate or `use-html` for each slide. Accept SHALL journal, validate candidate identity and current applicability, atomically promote bytes to the version source asset root, commit the existing selection binding, write a bounded Phase-4-owned version-source provenance record without extending the v2 asset-manifest schema, and invoke only public local composition operations. Promotion SHALL stale the former HTML delivery review and require a current final review before status reports deck completion. `use-html` SHALL retain the HTML fallback and not delete a candidate. Accepted assets SHALL remain byte-verifiable source after `_generated/` deletion.

#### Scenario: User accepts one page
- **WHEN** a current reviewed candidate is accepted
- **THEN** only that page gains a promoted source asset and locally recomposed final-slide evidence without another provider submit

### Requirement: Setup, cleanup, and vNext preserve ownership boundaries

Style-reference setup SHALL be a separately counted plan attempt whose successful bytes/provenance become version source under the designated style-reference root. Failed or unknown setup SHALL block dependent attempts. Cleanup SHALL be explicit and hash-bound, retain at most one recent rejected candidate plus provenance per slide in the derived refinement root, never delete accepted source, and fail closed on ambiguous review ordering. vNext SHALL re-evaluate copied source bindings and style-reference freshness but SHALL not inherit candidates, scratch plans, attempt authorization, or unresolved refinement review.

#### Scenario: Structural vNext is published
- **WHEN** a clean target version is created from a refined source version
- **THEN** it re-evaluates source applicability without copying candidate or authorization state and makes no remote call

### Requirement: Refinement provenance and promotion recovery are canonical

The only refinement-specific version-source provenance file SHALL be `overrides/visual-style/image2-refinement.yaml` with schema `pptmaker-image2-refinement-provenance-v1`. It SHALL bind the current style-reference and accepted slots by stable asset ID, selection `accepted_for`/output SHA, accepted candidate SHA, safe profile fingerprint, plan hash, and authorization/attempt IDs; it SHALL contain no credential, prompt body, provider response body, or absolute path. It SHALL not replace the v2 asset manifest or `primary_visual.selection` authority.

Accept SHALL first reject an active gate-approval journal or pending HTML-production reset, then use one exclusive canonical journal in `_scratch/image2_refinement/` that binds the old/new SHA of source provenance, asset manifest, slide specifications, and state plus the exact candidate and target asset ID. Its state commit SHALL use expected-state CAS. Recovery SHALL wait for those existing state fences to clear, then either finish exactly the bound source/state commits or fail closed; it SHALL not scan directories, choose a candidate by recency, create another provider attempt, or delete accepted source bytes.

#### Scenario: Promotion crashes after source write
- **WHEN** recovery finds the journal with bound new source bytes and old state bytes
- **THEN** it validates all bound SHAs, completes only the planned state/local-recomposition transition, and never submits another provider request
