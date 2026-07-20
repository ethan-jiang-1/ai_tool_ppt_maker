## REMOVED Requirements

### Requirement: HTML-first preview, gates, build, and local refresh have explicit ordering

**Reason**: The previous ordering treated every incomplete quality plan as an unconditional Stage-4
block and did not define an auditable user continuation path.

**Migration**: Preview remains available before approval; ordinary build still requires approved or
waived current gate evidence. A user-forced build publishes current version-scoped waivers through
the existing gate authority, while identity, source validity, reset, journal, and CAS checks remain
non-overridable.

### Requirement: HTML review plans are immutable current artifacts

**Reason**: Pilot and `readCurrentPlan` used different body projections, and visual reconstruction
discarded composition evidence, making valid plans permanently stale.

**Migration**: Keep immutable canonical plan objects and manifest references. Centralize the projection
builder and pass the published composition evidence into every revalidation path.

## ADDED Requirements

### Requirement: HTML review readiness is guide-first with safe continuation

HTML-first orchestration SHALL compute stale ownership from deterministic content, visual-system,
page-visual, notes, delivery, and structural projections. It SHALL present a human-readable recommended
repair and an explicit continuation when the issue is reversible evidence/process risk. `build --force
--reason` SHALL publish current gate waivers through the existing gate publication authority before
local assembly; it SHALL not mutate approved evidence into approval, invoke Image2, or bypass reset,
journal, CAS, source-parse, or bundle-structure checks. Notes-only changes SHALL not stale content or
visual review projections.

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
- **AND** status exposes waived decision and incomplete evidence

#### Scenario: Unsafe identity remains a hard stop

- **WHEN** a plan hash, reset, journal, CAS precondition, or source version is ambiguous or mismatched
- **THEN** orchestration returns a conflict/stale diagnostic
- **AND** `--force` does not write or render

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
