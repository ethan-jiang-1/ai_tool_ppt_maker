## ADDED Requirements

### Requirement: Commands route page-authority changes to versioned transition

COMMANDS.md and the change classifier SHALL distinguish a request to change final page authority from a
refresh, ordinary structural version, style iteration, or quality-improvement request.  After resolving
the exact source mode/pipeline, an `html-* <-> image2-only` request SHALL route to the
`migrate-import` versioned transition workflow: explicit target mode, candidate authoring, preview,
exact confirmation, clean vNext, target registration, and target-owned production.

Guidance SHALL explain that the transition preserves the source version and does not promise an in-place
conversion.  For an HTML target it SHALL state that current work is operational compatibility only and
does not evaluate or improve HTML visual quality.  For an Image2 target it SHALL disclose the normal
post-publication Image2 authorization and quality-review boundary.  A vague request to make HTML look
better SHALL remain a future HTML quality/iteration concern and SHALL not start a production-mode
transition.

#### Scenario: User asks to change renderer

- **WHEN** a user asks to move a current HTML deck to whole-page Image2
- **THEN** guidance routes to explicit target authoring and versioned transition preview rather than `refresh` or an in-place mode setter

#### Scenario: User asks to improve HTML appearance

- **WHEN** a user asks only for better HTML visual quality
- **THEN** guidance does not claim this transition change implements that quality work or create a cross-pipeline candidate
