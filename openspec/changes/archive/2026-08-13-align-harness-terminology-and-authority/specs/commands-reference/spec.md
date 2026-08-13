## ADDED Requirements

### Requirement: Discovery guidance distinguishes the catalog from MD Controllers

Active discovery guidance SHALL call `intent-routes.json` the Intent Route
Catalog and SHALL describe it as a closed first-safe-handoff catalog. It SHALL
describe `playbook/` as the home of MD Controllers and their normative
controller manifest. The catalog SHALL not be described as a Controller,
parser, dispatcher, authorization record, or workflow state machine, and the
playbook home SHALL not be reduced to an intent-routing appendix.

#### Scenario: An Agent routes a natural-language request

- **WHEN** an Agent follows active discovery guidance for a user request
- **THEN** it uses the Intent Route Catalog only for the first safe handoff and
  reaches the existing MD Controller boundary where applicable
- **AND** it does not mistake either source for a second lifecycle controller
