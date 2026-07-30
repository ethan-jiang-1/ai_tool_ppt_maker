## MODIFIED Requirements

### Requirement: Framed Text Frame has one deterministic preset

Visual Config SHALL resolve `standard-v1` to one normalized set of canvas, capture, panel, field,
typography, palette, line-limit, and reserved-underlay facts. The normalized preset SHALL exclude
duplicate or unconsumed facts and SHALL be the only source from which Framed raw geometry and final
frame pixels are compiled. Caller-owned geometry, fonts, colors, markup, or capture options SHALL be
rejected.

Fit before provider authorization SHALL be established by the current Framed browser evaluator using
the same normalized preset and render profile used for final composition. A width estimate, caller
assertion, or previously supplied preflight object SHALL NOT authorize raw work.

#### Scenario: Text overflow stops raw work

- **WHEN** the current Framed browser evaluator cannot prove that resolved Frame text fits `standard-v1`
- **THEN** planning returns the source-repair hard-stop before provider authorization or raw-plan materialization
- **AND** no estimated-width result or caller assertion may override it

#### Scenario: Preset facts compile to one visual frame

- **WHEN** the same normalized `standard-v1` facts are used for raw planning and final composition
- **THEN** both operations resolve the same panel, field, typography, palette, and safe-zone geometry
- **AND** no second hard-coded frame style participates in either result

## ADDED Requirements

### Requirement: Framed render profile has one canonical identity

The Framed owner SHALL construct one canonical render-profile identity from the normalized preset,
versioned layout compiler, checked-in font render inventory, font-selection algorithm, pinned browser
runtime, and capture profile. The identity SHALL exclude source Text Frame literals, page measurements,
the per-page selected font subset, underlay bytes, host paths, and temporary runtime values.

Every Framed raw contract SHALL bind the resulting `render_profile_digest`. A pixel-relevant profile
change SHALL make dependent raw and final evidence stale through its owning interface; a Text
Frame-only edit SHALL NOT change the profile or create provider debt by itself.

#### Scenario: Canonical profile is host-independent

- **WHEN** equivalent render-profile facts are constructed with different object insertion order or host paths
- **THEN** they produce the same canonical render-profile digest

#### Scenario: Pixel-relevant profile drift invalidates evidence

- **WHEN** the normalized preset, compiler, font render inventory, font selection, pinned runtime, or capture identity changes
- **THEN** the render-profile digest changes and dependent Framed evidence becomes stale
- **AND** the runtime does not silently rebind previously accepted underlay bytes

#### Scenario: Text-only edit preserves provider-free eligibility

- **WHEN** only current Text Frame literals change and all raw-contract and render-profile facts remain current
- **THEN** the render-profile digest remains unchanged
- **AND** the edit remains eligible for the owning provider-free local refresh path
