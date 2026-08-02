## ADDED Requirements

### Requirement: Active Pure Pilot prose names Page Authority raw evidence

Current `create-deck` Controller guidance and the active
`playbook-execution` specification SHALL describe Pure Pilot review evidence
as Pure raw page bytes. They SHALL preserve the current separation of Framed
and Pure evidence: each workflow exposes only its own evidence and the
owner-issued decision action, without sibling-workflow controls.

The active Pure Pilot prose SHALL not use a retired production label. This is
an active-documentation requirement only; it SHALL not alter raw evidence,
bindings, Pilot/Expansion gates, authorization, provider behavior, state, or
the Controller route.

#### Scenario: A Pure Pilot is presented

- **WHEN** the selected Pure workflow reaches partial Pilot review
- **THEN** the Controller presents the owner-issued action with the exact Pure
  raw page bytes and their current bindings
- **AND** it does not expose Framed Text Frame, safe-zone, compositor, or
  sibling-workflow controls

#### Scenario: Active documentation passes the existing retirement audit

- **WHEN** current framework guidance and main specifications are audited
- **THEN** the existing process-document coherence check finds no retired
  production label in the current Pure Pilot descriptions
- **AND** no exception, alternate route, or new validation layer is required
