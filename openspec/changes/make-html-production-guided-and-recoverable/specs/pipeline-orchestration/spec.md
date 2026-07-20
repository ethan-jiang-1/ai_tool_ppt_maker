## MODIFIED Requirements

### Requirement: HTML-first preview, gates, build, and local refresh have explicit ordering

HTML-first orchestration SHALL compute stale ownership from deterministic content, visual-system,
page-visual, notes, delivery, and structural projections. It SHALL present a human-readable recommended
repair and an explicit continuation when the issue is reversible evidence/process risk. `build --force
--reason` SHALL publish current gate waivers through the existing gate publication authority before
local assembly; it SHALL not mutate approved evidence into approval, invoke Image2, or bypass reset,
journal, CAS, source-parse, or bundle-structure checks. Final PPTX publication SHALL require no reset
transaction pending plus authoritative current-version/current-reset `html-content-review` and
`html-visual-review` decisions whose recorded projections and evidence are current; a current explicit
waiver may satisfy the decision requirement while status still reports incomplete evidence. Metadata
gate mirrors alone SHALL not authorize delivery. HTML preview/final-slide composition MAY run while
gates are pending but not while canonical reset is `deletion_pending`. Review requests SHALL declare
the exact `effective|forced-fallback` composition variant; only effective objects enter delivery
manifests and Stage 4. Local Slide Rebuild, Local Deck Rebuild, Notes-Only Refresh, and Structural
Versioning materialization SHALL compute the smallest stale set from source ownership and current
manifest/fingerprint evidence. No local path SHALL create or invoke Image2 refinement. Notes-only
changes SHALL not stale content or visual review projections.

#### Scenario: Pilot plan is approved after revalidation

- **WHEN** pilot publishes a content or visual plan and the same current plan is read back
- **THEN** body projection, plan hash, reset ID, and logical version verify identically
- **AND** a complete plan can be approved with its exact hash

#### Scenario: Visual plan revalidation has composition evidence

- **WHEN** `readCurrentPlan` rebuilds a visual review plan
- **THEN** it loads the same shown composition/final-slide evidence used by pilot
- **AND** it does not mark all slides missing merely because the caller omitted a composition argument

#### Scenario: User forces a reversible gate continuation

- **WHEN** current source and reset identity are valid but content/visual evidence is pending or incomplete
- **THEN** orchestration records a bounded current waiver with reason and proceeds with local build
- **AND** status exposes the waived decision and independently computed evidence completeness

#### Scenario: Forced build is unnecessary

- **WHEN** both current HTML gates already satisfy readiness and the user invokes `build --force --reason`
- **THEN** orchestration records no new waiver and reports `force_not_needed`
- **AND** local build proceeds through the ordinary current-evidence path

#### Scenario: Forced build is dry-run

- **WHEN** a user invokes `build --force --reason --dry-run`
- **THEN** orchestration reports the prospective waiver/check set and local build plan
- **AND** it writes no state, metadata, or generated artifact

#### Scenario: Unsafe identity remains a hard stop

- **WHEN** a plan hash, reset, journal, CAS precondition, or source version is ambiguous or mismatched
- **THEN** orchestration returns a conflict/stale diagnostic
- **AND** `--force` does not write or render

#### Scenario: Visual gate reviews production-equivalent pixels

- **WHEN** an HTML visual gate is pending
- **THEN** orchestration may create representative pages/final slides/contact sheet through the production compositor
- **AND** final PPTX publication requires an approved or explicitly waived current gate decision

#### Scenario: Ordinary copy edit is local

- **WHEN** one slide's visible copy changes without global visual-system or fallback changes
- **THEN** Local Slide Rebuild recomposes that slide and downstream delivery locally
- **AND** it does not stale unrelated visual-system approval
- **AND** it stales content approval when the reviewed content fingerprint changes

#### Scenario: Global visual config change requires representative review

- **WHEN** an HTML visual-system fingerprint changes
- **THEN** Local Deck Rebuild produces current representatives for every current component recipe key before full delivery
- **AND** the previous visual gate cannot authorize Stage 4

#### Scenario: Metadata says approved without current HTML evidence

- **WHEN** metadata gate scalars are approved but current-version HTML gate records are missing or stale
- **THEN** preview may run but Stage 4 remains blocked

#### Scenario: Forced fallback is composed for review

- **WHEN** a selected-current slide needs fallback review
- **THEN** preview explicitly composes the forced-fallback variant
- **AND** delivery continues to resolve only the effective variant

### Requirement: HTML review plans are immutable current artifacts

Content and visual review planning SHALL serialize immutable canonical JSON under the scope-owned
`html_production/preview/plans/<plan-hash>.json` and publish current references only through the atomic
preview manifest. The plan hash SHALL cover canonical bytes excluding its own hash field. Every plan
SHALL bind exact `schema: pptmaker-html-review-plan-v1`, `publication_scope:
canonical-run|migration-preview`, nullable `html_production_reset_id` (current state value for canonical,
null for migration preview), pipeline, normalized logical run version, `kind: content|visual`,
`approvable`, current fingerprints/outstanding evidence, exact input receipts, and referenced artifact
confined paths/SHAs. Content plans SHALL include the complete ordered human-reviewed projection. Visual
plans SHALL include system coverage, page visual dependencies, and shown effective/forced-fallback
preview references. Scoped plans missing any outstanding evidence SHALL set `approvable: false` and
list it; they cannot publish approval but remain eligible for an explicit waiver after the current
source/reset/version projection is verified. Ordinary approval SHALL resolve only a `canonical-run`
plan referenced by a same-reset `canonical-run` current preview manifest and revalidate reset
ID/plan/artifact bytes/receipts. Migration-preview plans remain comparison evidence even if internally
complete. Failure diagnostics SHALL not echo authored content.

The schema-closed `preview/manifest.json` SHALL contain exact `schema:
pptmaker-html-preview-manifest-v1`, `publication_scope: canonical-run|migration-preview`, nullable
`html_production_reset_id` (current state value for canonical, null for migration preview),
pipeline/logical run version, plus independent nullable current references `review_plans.content`,
`review_plans.visual`, `contact_sheets.visual_review`, and `contact_sheets.delivery`. Each non-null
reference SHALL bind confined path, SHA-256, owning plan/review/delivery digest, and applicable
composition variants of the same scope/reset epoch. One atomic owner commit SHALL revalidate and
preserve unaffected current references, clear every stale/deleted/incompatible or
cross-scope/cross-reset carried reference, and update only the intended slots. Approval SHALL use only
the matching canonical/current-reset `review_plans.<gate>` slot; final delivery review SHALL use only
canonical/current-reset `contact_sheets.delivery`.

#### Scenario: Content plan survives process exit

- **WHEN** content review planning completes
- **THEN** the exact shown projection and plan hash are recoverable from current confined files

#### Scenario: Referenced preview changes

- **WHEN** a visual plan's referenced image bytes no longer match
- **THEN** approval fails stale and publishes no gate evidence

#### Scenario: Old plan remains as immutable storage

- **WHEN** a newer preview manifest replaces the current plan reference
- **THEN** the old plan cannot be approved even if its object file remains

#### Scenario: Migration plan is complete but non-authoritative

- **WHEN** a migration-preview review plan is internally complete and approvable
- **THEN** ordinary approval rejects its scope and publishes no target-version gate evidence

#### Scenario: Content and visual plans coexist

- **WHEN** a current content plan is followed by visual-plan publication with unchanged content inputs
- **THEN** one preview manifest retains both independently verified current plan references

#### Scenario: Delivery sheet update preserves current review refs

- **WHEN** delivery contact sheet publishes and current review plan inputs remain fresh
- **THEN** only `contact_sheets.delivery` changes and current plan slots remain valid

#### Scenario: Carried visual plan becomes stale during content update

- **WHEN** content-plan publication discovers the carried visual plan no longer verifies
- **THEN** the same manifest commit clears the visual slot rather than preserving false current evidence

## ADDED Requirements

### Requirement: Review projections separate notes from visual/content ownership

The content review projection SHALL reuse `content_review_fingerprint_v1` and exclude notes, runtime,
source locators, and selection transport. A notes projection SHALL cover notes source only. Visual-system
and page-visual projections SHALL retain their existing disjoint ownership. Raw source SHA MAY be kept
as provenance but SHALL not alone determine content/visual gate freshness.

#### Scenario: Notes-only edit uses the notes owner

- **WHEN** only a speaker note changes
- **THEN** content and visual projections remain equal
- **AND** the controller recommends Stage 5 and delivery review only

#### Scenario: Visible copy edit stales content only

- **WHEN** one slide's reviewed visible body changes without visual-system or fallback changes
- **THEN** content review becomes stale
- **AND** unrelated visual-system coverage remains current

### Requirement: Review-plan revalidation preserves canonical evidence ownership

Current plan references SHALL remain immutable hash-addressed objects. Every revalidation SHALL use the
same canonical projection builder, current reset/version, and shown composition/final-slide evidence;
it SHALL clear stale cross-scope/cross-reset references through the existing atomic manifest owner.
Diagnostics SHALL identify bounded expected/actual projection paths without echoing authored prose.

#### Scenario: Body projection is serialized consistently

- **WHEN** a slide contains callout or primary-visual fields
- **THEN** pilot and read-back use the same body field set
- **AND** `content_fingerprint` matches when source bytes and plan inputs are unchanged

#### Scenario: Old plan object remains stored but cannot approve

- **WHEN** the manifest points to a newer plan
- **THEN** the older immutable object remains available for audit
- **AND** approval rejects it as non-current without mutating the gate
