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
