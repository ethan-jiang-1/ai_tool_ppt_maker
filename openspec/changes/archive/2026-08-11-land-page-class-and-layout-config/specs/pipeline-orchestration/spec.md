## MODIFIED Requirements

### Requirement: Page Image invalidation is determined by current compiled inputs

The selected Page Image Workflow owner SHALL classify a requested change from
the direct current source receipt, normalized Page Class, selected
workflow-specific presentation projection and its provenance, compiled
provider-input digest, protected geometry, raw contract, generation profile,
local header profile, and final evidence bindings. It SHALL not classify a
change solely from a field name, task card, rendered file, conversation summary,
or an unselected class/profile source file.

Any change to Provider Content Schema, narrative context, visual direction,
generation profile, normalized Page Class, selected deck default, selected
workflow-specific profile, protected geometry, workflow, or a header literal
that is bound as Framed context not to render SHALL require raw rebuild and a
new Complete Page Review. A valid complete-package change only to an unselected
class or sibling profile SHALL leave the page's current compiled bindings and
lifecycle evidence intact. A malformed or cross-file-inconsistent sibling makes
the whole package a source/configuration hard-stop before classification or raw
planning; it SHALL preserve existing immutable evidence and SHALL NOT create a
raw rebuild, local refresh, authorization, or review. Framed local overlay
refresh is provider-free only when the compiled provider input, resolved
projection, protected geometry, raw contract, and local profile are all exactly
unchanged. Notes-only changes remain
delivery-owned, and structural or whole-workflow changes remain preview-first
exact-hash versioning work.

#### Scenario: Framed title change becomes raw rebuild

- **WHEN** a Framed title literal changes
- **THEN** the classifier observes the changed compiled provider-input digest
  and selects raw rebuild
- **AND** it does not present a provider-free header refresh

#### Scenario: Selected class-profile edit becomes raw rebuild

- **WHEN** a Framed page's selected class profile changes after its raw work
  has been prepared or reviewed
- **THEN** the classifier observes the changed resolved projection and selects raw rebuild
- **AND** it does not retain the former raw contract or Complete Page Review as current

#### Scenario: Unselected sibling edit changes no page binding

- **WHEN** a page uses `standard` and only the `opening` profile is edited
- **THEN** the classifier retains the page's existing compiled bindings and lifecycle evidence
- **AND** it does not select raw rebuild, local overlay refresh, authorization, or a synthetic review

#### Scenario: A malformed unselected sibling stops package evaluation without invalidation

- **WHEN** a page uses `standard` and the `opening` profile becomes malformed
- **THEN** the source/configuration evaluator stops before change classification or raw planning
- **AND** it preserves the page's existing immutable evidence without emitting a rebuild, refresh, authorization, or review

#### Scenario: Proven local overlay refresh remains provider-free

- **WHEN** a Framed local presentation change preserves every required
  provider-input, resolved-projection, geometry, raw-contract, and profile binding
- **THEN** the classifier routes to the selected local overlay owner
- **AND** it does not create authorization, provider work, or a synthetic Pilot route
