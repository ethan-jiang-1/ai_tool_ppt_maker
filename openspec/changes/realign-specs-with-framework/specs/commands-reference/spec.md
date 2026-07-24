## MODIFIED Requirements

### Requirement: COMMANDS.md covers full-deck creation
COMMANDS.md SHALL route "帮我做一个PPT" through BOOTSTRAP, explicit/default production-mode selection, scoped doctor profile, and the corresponding complete `create-deck` path through intake, content, visual direction, real-artifact review, production, PPTX/notes, and final review. It SHALL state that new decks default to `image2-only` and explain that `html-only` is the local deterministic route while `html-then-image2` adds required bounded visual-slot refinement after HTML delivery. It SHALL present whole-page Image2 as a first-class production choice, not as modern refinement or a legacy downgrade, and SHALL disclose provider readiness/cost plus exact operation/IDs/profile/count before each chargeable Image2 action without treating init, doctor, a live probe, or a prior batch as provider authorization.

#### Scenario: First-time user creates a PPT
- **WHEN** a user requests a new deck without another mode preference
- **THEN** COMMANDS routes to `create-deck` and the complete Image2-primary path
- **AND** identifies the provider-readiness/authorization boundary before chargeable work

#### Scenario: First-time user requests local production
- **WHEN** the user explicitly chooses `html-only`
- **THEN** COMMANDS routes to the complete local HTML path without Image2 prerequisites

#### Scenario: Whole-page creation uses the current protocol
- **WHEN** COMMANDS names an `image2-only` deck
- **THEN** it identifies `whole-page-image2-v1` as that source's explicit pipeline
- **AND** it routes cross-pipeline work only through the current `state --*-production-mode-transition` operations

## REMOVED Requirements

### Requirement: COMMANDS documents explicit legacy migration without automatic conversion
**Reason**: The historical migration Controller, command, comparison modes, and compatibility guidance are removed rather than relabeled.

**Migration**: COMMANDS routes a valid current run through the state-owned production-mode transition and routes unsupported old runs to recreation.
