## ADDED Requirements

### Requirement: Stale selected Style Master routes to replacement planning before raw rebuild

When a selected Page Image workflow has a current validated source candidate
but its required Style Master selection is stale because the selected
visual/source context drifted, raw-plan evaluation SHALL stop before source
epoch, raw-plan, batch, grant, attempt, provider request, or Page Image
evidence mutation. It SHALL return the existing Style Master owner's one
provider-free replacement-planning action for the same exact version and
workflow. The raw owner SHALL not treat the prior selection as current,
construct a replacement raw plan, or require a human authorization before the
replacement Style Master plan exists.

The recovery route SHALL preserve prior source receipts, raw plans, grants,
attempts, reviews, accepted raw bytes, final media, and delivery records as
immutable historical evidence. It does not relax the existing requirements for
current Style Master acceptance, exact raw authorization, provider work, or
Complete Page Review after the new selection is made.

#### Scenario: Pure visual-system drift stops at Style Master replacement planning

- **WHEN** a current Pure source candidate changes its selected visual-system
  projection and the existing Style Master selection no longer binds that
  projection
- **THEN** raw planning returns only the replacement Style Master planning
  action before source-epoch or raw-work publication
- **AND** it does not reuse the prior selection, mutate state, or initialize a
  provider request

#### Scenario: Framed visual-language drift keeps raw work blocked

- **WHEN** a current Framed source candidate changes visual-language facts and
  its existing Style Master selection is stale
- **THEN** raw planning returns only the replacement Style Master planning
  action for that same Framed version
- **AND** it does not create a target source receipt, raw authorization,
  attempt, or Page Image evidence
