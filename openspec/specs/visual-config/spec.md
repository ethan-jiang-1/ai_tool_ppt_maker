## Purpose

Define the Page Authority visual-language registry and fixed Framed Text Frame
inputs. The registry is the current source of visual selection and frame data.
## Requirements
### Requirement: Page Authority visual language is a closed registry selection

Visual Config SHALL own
`2_backbone/visual-style/page-authority-visual-language.yaml`. It SHALL validate
registered recipes, compositions, motifs, compatibility, and authority eligibility,
then compile only selected canonical clauses. Unregistered IDs, generated copies,
free provider prose, and caller-owned path overrides SHALL be rejected.

#### Scenario: Selected registry facts have local invalidation

- **WHEN** a registry change affects only an unselected record
- **THEN** the unchanged slide's selected-language digest remains unchanged
- **AND** its raw image contract is not invalidated for that reason

### Requirement: Visual language and roles pass a deterministic no-text guard

Every provider clause and selected role clause SHALL pass the versioned Page
Authority text guard. The guard SHALL reject text-bearing instructions, unregistered
free prose, and invalid character or token forms before receipt compilation.

#### Scenario: Text-bearing registry instruction is rejected

- **WHEN** a clause includes a forbidden text-bearing instruction or invalid form
- **THEN** validation hard-stops before receipt compilation
- **AND** it reports the violated guard rule

### Requirement: Framed Text Frame has one deterministic preset

Visual Config SHALL resolve `standard-v1` to fixed canvas, capture dimensions,
rectangles, theme/fonts, opacity, and callout variants. It SHALL prove fit before
provider authorization and reject caller-owned geometry, fonts, and colors.

#### Scenario: Text overflow stops raw work

- **WHEN** resolved Frame text cannot fit `standard-v1`
- **THEN** preflight returns the frame repair action before provider authorization
- **AND** no underlay request is submitted

### Requirement: Visual configuration owns current Page Authority tokens

Visual configuration SHALL retain only the tokens and frame data consumed by Page
Authority and SHALL NOT retain retired production semantics.

#### Scenario: A Framed page is finalized

- **WHEN** a current Framed Page Authority slide is composed
- **THEN** its frame inputs come from current Page Authority visual configuration

### Requirement: TARGET Framed visual semantics have one Framed workflow owner

Shared visual language and closed registry selection SHALL remain available to
both target workflows. For workflow `framed`, the Framed adapter SHALL be the
sole owner of `standard-v1`, deterministic fit preflight, reserved underlay
rectangles, text-free raw constraints, and local Text Frame composition inputs.
For workflow `pure`, those Framed-specific facts SHALL NOT be added to the Pure
raw plan or shared raw mechanics.

A Framed fit or no-text violation SHALL be detected before provider work and
return the owning deterministic repair action. A frame preset change SHALL
invalidate the related underlay/raw tuple; it SHALL NOT be classified as a
text-only local refresh.

#### Scenario: Framed preflight blocks invalid content early

- **WHEN** a target Framed source exceeds deterministic Text Frame fit or requires semantic body text
- **THEN** the Framed owner rejects it before raw authorization with one repair-or-whole-version-switch action
- **AND** it does not silently change the slide or version to Pure

#### Scenario: Pure target plan has no Framed runtime semantics

- **WHEN** a valid target Pure source is compiled into a raw plan
- **THEN** the plan carries Pure display/raw contract facts and no Text Frame preset or reserved-underlay requirement
- **AND** shared raw mechanics can consume it without a Framed branch
