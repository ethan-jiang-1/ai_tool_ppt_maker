## ADDED Requirements

### Requirement: Header-Lock is a legacy whole-page stage
Header-Lock SHALL remain a Stage 3 capability of the legacy `whole-page-image2-v1` adapter. Only that
legacy adapter may initiate its execution for a managed run. A resolved
`page-authority-image2-v1` / `image2-page-authority` source/state pair SHALL be rejected before a
Header-Lock call, legacy slide-plan input, or `header_locked/` publication is assembled. The standalone
Stage 3 script remains a legacy interface and SHALL not be advertised, selected, or wrapped as a Page
Authority finalization or refresh path; Page Authority publishes only through `finalizePage(...)`.

#### Scenario: Page Authority cannot enter Header-Lock

- **WHEN** a managed run resolves to the exact Page Authority source/state pair and a caller attempts a
  Header-Lock operation or legacy Stage 3 adapter selection
- **THEN** the route returns the Page Authority finalization/recovery diagnostic before reading legacy
  raw inputs or writing `header_locked/`
- **AND** it does not treat a compatible-looking generated file, slide plan, or render-mode value as
  authority to invoke Header-Lock
