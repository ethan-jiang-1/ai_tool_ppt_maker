# Retired Local Composition Capability

## Purpose

This capability has no current production requirements. Page Authority Framed
finalization owns current deterministic local text composition. Historical source
and state pairs remain read-only observer/adoption input and cannot invoke a
production adapter.

## Requirements

### Requirement: Local composition retirement remains enforced
A historical Header-Lock source or state pair SHALL be handled only by the read-only observer/adoption
boundary, which SHALL NOT register a current command, state transition, generated-artifact owner, or
production adapter.

#### Scenario: A current route is resolved
- **WHEN** a user requests current production work
- **THEN** Page Authority owns the operation and no retired local-composition choice is offered
