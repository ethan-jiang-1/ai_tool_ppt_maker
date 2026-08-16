# Image Generation Specification (delta)

## ADDED Requirements

### Requirement: Image2 planning reports source/config preconditions through the source owner

When `image2 plan` (or its provider-free preflight) fails on a Page Source,
Visual Language, Presentation, or Reference Material precondition, the Image2
operation SHALL report the producer-issued problem fact (per
`diagnostic-facts`) with one nearest legal source-owner next action, and
SHALL NOT classify the known source/config defect as `internal` or
`report_internal`. The operation SHALL NOT rewrite the source fact, SHALL NOT
guess a source or action when the fact is unknown or unsafe, and SHALL make
no plan publication, receipt, grant, attempt, or provider call.

#### Scenario: Plan fails on an identity reference defect

- **WHEN** `image2 plan` fails because a selected identity profile role is
  unregistered or its clause is invalid
- **THEN** the envelope names the reference registry/Page Source field
  repair with one exact next
- **AND** it does not emit `internal`/`report_internal` and creates no
  receipt or provider input
