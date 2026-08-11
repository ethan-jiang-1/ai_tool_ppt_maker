## ADDED Requirements

### Requirement: Image2 planning has one provider-free derived-data publication checkpoint

For a valid current Page Image Workflow candidate, `image2 plan` SHALL compile
the exact selected-workflow raw-plan candidate, publish its complete C5
derived-data chain, and only then expose the existing next action for
authorization or review. The publisher is deterministic JS work owned by the
existing planning route; the MD Controller continues to own intent and
conversation, and no separate command, approval, state field, gate, retry, or
recovery controller is introduced.

The publication checkpoint is a guide-only inspection result under the existing
plan path, not a confirm or approval. Its failure is an integrity hard-stop for
that plan materialization only: the existing owning diagnostic SHALL name the
nearest source/configuration/publication repair action, and planning SHALL not
continue to authorization, provider initialization, or a second acceptance
surface.

#### Scenario: Planning publishes before existing authorization

- **WHEN** `image2 plan` compiles a valid current Framed or Pure candidate
- **THEN** the complete derived-data chain is available before the route exposes
  its existing authorization next action
- **AND** no provider request, grant, attempt, review decision, or extra human
  confirmation is created

#### Scenario: Publication failure leaves no alternate control path

- **WHEN** the derived-data chain cannot be fully materialized for a candidate
- **THEN** the route returns the existing owner-issued direct repair action and
  exposes neither authorization nor a partial plan as current
- **AND** it does not add a waiver, a retry state, or a C5-specific review
