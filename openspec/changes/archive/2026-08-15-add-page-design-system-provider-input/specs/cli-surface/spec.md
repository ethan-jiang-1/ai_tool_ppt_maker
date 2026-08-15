## ADDED Requirements

### Requirement: Page Design System failures retain source-owner CLI recovery

When a direct current `image2` operation compiles or recompiles the selected
Pure or Framed adapter, the CLI producer SHALL classify exactly
`page_design_system_source_unavailable`,
`page_design_system_source_invalid`, `page_design_system_source_escape`,
`page_design_system_source_unreadable`,
`page_design_system_source_too_large`, and
`page_design_system_source_utf8_invalid` as `source_validation`. The bounded
diagnostic SHALL retain the resolver's exact declared reason kind and use the
existing non-human `edit_source` action. If the resolver supplies a safe
selected-source locator, the producer MAY project only that bounded path
through the existing `source` and `next.inspect` fields. It SHALL not project
exception prose, design-system text, digest, selection origin, raw provider
input, or another undeclared field.

`pure_provider_input_too_large` and `framed_provider_input_too_large`, introduced
by the 32,768-byte local compiler bound, SHALL use the same existing
`source_validation` / `edit_source` recovery rather than `provider` or generic
`internal` recovery. Because those overflow errors combine multiple source and
configuration inputs and supply no exact attributable owner locator, the
producer SHALL omit `source` and `next.inspect` unless one exact safe owner
locator is available; it SHALL NOT default either field to
`slide-specifications.md` or another merely available source. Missing locator
scope remains unknown rather than inferred. `page_design_system_run_dir_invalid`,
a malformed derived raw contract, or another compiler-contract contradiction
SHALL retain the existing bounded `internal` / `report_internal` route. This
requirement adds no command, route, diagnostic-envelope field, action value,
Controller branch, retry, waiver, or provider operation.

#### Scenario: Unsafe selected source points to source repair

- **WHEN** `image2 plan`, authorization preflight, or generation preflight
  reaches a selected Page Design System source that is unsafe, unreadable,
  invalid UTF-8, or over the source-byte limit
- **THEN** the CLI emits the existing secret-safe `source_validation` envelope
  with the exact declared reason kind and non-human `edit_source` action
- **AND** it performs no plan publication, grant, attempt, provider
  initialization, provider request, or lifecycle mutation

#### Scenario: Canonical input overflow is not blamed on the provider

- **WHEN** the selected Pure or Framed compiler produces final canonical input
  larger than 32,768 UTF-8 bytes
- **THEN** the CLI emits the existing bounded `source_validation` /
  `edit_source` recovery before provider initialization
- **AND** it does not classify the local limit as provider failure, truncate
  author text, add a command option, expose the canonical input, or attribute
  the overflow to `slide-specifications.md` without an exact owner locator

#### Scenario: Compiler contradiction remains an internal failure

- **WHEN** a direct `image2` operation encounters an invalid resolver invocation
  or a derived adapter contract contradiction rather than a source-owned defect
- **THEN** the CLI retains its existing bounded `internal` /
  `report_internal` diagnostic
- **AND** it does not direct the Agent to edit a source that cannot repair the
  defect or create a second recovery route
