# Image Production Specification (delta)

## MODIFIED Requirements

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
- **AND** it does not expose Framed Reserved Header Region, header-renderer,
  or composite controls
