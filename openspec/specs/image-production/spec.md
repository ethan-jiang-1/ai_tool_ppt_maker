## Purpose

Define Image Production as the active Page Image Workflow capability family.
## Requirements
### Requirement: Production final files use NN_slideID naming

The final-slide manifest SHALL name each production file `NN_slideID.png`,
where `NN` is the item's current `position` zero-padded to two digits and
`slideID` is the stable mnemonic `slide_id`. The final manifest validator SHALL
require this exact path shape, and PPTX assembly SHALL consume it. `slide_id`
remains the cross-version identity inside the filename; `NN` is only the current
position projection and changes with reordering.

#### Scenario: Final files carry position prefix

- **WHEN** a final manifest is created for ordered slides with positions 1..N
- **THEN** each item path is `NN_slideID.png` in position order
- **AND** the validator accepts those exact paths

#### Scenario: Non-prefixed final path is rejected

- **WHEN** a final manifest item path is not `NN_slideID.png` (for example
  `${slide_id}.png` only)
- **THEN** the final manifest validator reports an invalid item
- **AND** assembly does not accept the manifest

### Requirement: Current Page Image Workflow has one selected finalization publisher

For an exact current `page-image-workflow-v1` source/state/receipt tuple, the
selected `framed` or `pure` adapter SHALL be the sole publisher of
`page-image-final-slide-manifest-v1`. It SHALL publish only after the current
Complete Page Review has proceeded and all bound source, profile, provider-page,
and workflow facts remain current. A mismatch, stale evidence, or wrong
workflow owner SHALL hard-stop before final media or manifest publication.

Pure finalization SHALL publish the accepted provider page bytes and their
actual verified dimensions unchanged. Framed finalization SHALL publish the
current provider page combined with the deterministic local
kicker/title/subtitle overlay under the same evaluated profile used for its
review composite. Both adapters SHALL publish the same final-slide manifest
shape for shared delivery; neither adapter SHALL publish a PPTX, notes receipt,
or delivery decision.

#### Scenario: Pure preserves current provider page bytes

- **WHEN** a proceeded Pure Complete Page Review reaches finalization
- **THEN** the final manifest binds the accepted provider page bytes and actual
  dimensions unchanged
- **AND** finalization does not crop, resize, transcode, or invoke a Framed
  local renderer

#### Scenario: Framed finalization repeats its reviewed overlay

- **WHEN** a proceeded Framed Complete Page Review reaches finalization
- **THEN** finalization uses the same current local header profile and input as
  the production-equivalent composite under review
- **AND** it publishes no final manifest if the profile, header input, or raw
  provider page has drifted

### Requirement: Complete Page Review makes one complete-page decision

The selected workflow owner SHALL present one `proceed` or `repair` decision
for each complete page after deterministic preflight and required raw evidence
are available. For Framed, the decision surface SHALL present the exact
provider raw page beside a production-equivalent local-header composite. For
Pure, it SHALL present the exact provider page as the complete page. This
decision SHALL check source-required literal/data fidelity, readable
composition, and the policy-specific presentation facts; it SHALL not add a
second composite approval state.

A `repair` decision SHALL retain the existing owner-issued repair/rebuild
route. A `proceed` decision records normal page acceptance, not a waiver, and
does not replace the later final delivery review of final PNG, PPTX, notes, and
deck-level presentation quality.

#### Scenario: Framed review is not split into raw and composite approvals

- **WHEN** a reviewer receives complete Framed page evidence
- **THEN** the owner presents raw and composite together with one decision
- **AND** it does not require a second local-composite approval after proceed

#### Scenario: Pure review has no Framed control surface

- **WHEN** a reviewer receives complete Pure page evidence
- **THEN** the owner presents the provider page and its current bindings
- **AND** it does not expose Framed protected-zone, header-renderer, or
  composite controls

### Requirement: Pilot remains a preview-only sample and cost control

Pilot SHALL remain a selected-workflow sample/cost stage and SHALL reuse the
same current review representation that Complete Page Review would use for its
sampled pages: Framed raw plus production-equivalent composite, or Pure
provider page. Pilot SHALL not publish current accepted raw evidence, a final
manifest, PPTX, notes receipt, delivery decision, or a duplicate complete-page
approval state.

#### Scenario: Framed Pilot uses its current page representation

- **WHEN** a current Framed Pilot sample is prepared
- **THEN** it publishes preview-only raw and production-equivalent composite
  evidence bound to the same policy inputs
- **AND** it does not create final or accepted evidence

### Requirement: v2 finalization and evidence are unsupported

An adapter, compositor, Pilot publisher, or shared finalization reader SHALL
reject v2 source/state/receipt/raw/review/delivery evidence before artifact
publication. It SHALL not use a v2 compositor, evidence translator, fallback,
or migration reader as a current finalization route.

#### Scenario: v2 receipt cannot publish a current final manifest

- **WHEN** a v2 receipt is presented to current finalization
- **THEN** finalization returns the `unsupported-protocol/export` hard-stop before
  reading provider media or local-renderer inputs
- **AND** it does not write a final PNG, manifest, PPTX, notes, or delivery
  evidence
