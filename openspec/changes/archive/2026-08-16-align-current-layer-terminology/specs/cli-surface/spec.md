# CLI Surface Specification (delta)

## MODIFIED Requirements

### Requirement: CLI diagnostics validate the closed Framed header contract

For Framed planning, review, and finalization, the CLI producer SHALL classify
the earliest independent failure among closed source content/header fields,
transparent header preset/profile, protected composition, current compiled
input, provider page, and bound evidence. A header fit failure belongs to
bounded `source_validation`; missing browser/font capability belongs to
`environment`; a contradiction among checked-in deterministic contracts
belongs to `internal`. No diagnostic SHALL reintroduce a local body/callout
renderer, a text-free underlay rule, a force option, or provider-blaming for a
pre-submit failure.

#### Scenario: Framed header overflow is source validation

- **WHEN** current Framed header literals cannot fit their deterministic
  transparent header preset
- **THEN** the CLI emits one `source_validation` hard-stop and a source-repair
  action
- **AND** it does not offer browser internals, local body fallback, or provider
  retry
