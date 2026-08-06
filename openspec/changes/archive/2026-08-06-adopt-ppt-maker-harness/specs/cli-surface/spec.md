## ADDED Requirements

### Requirement: Direct CLI is exposed from the canonical Harness root

Every documented direct production CLI entrypoint SHALL be invoked from
`ppt_maker_harness/` and SHALL identify that location as the PPT Maker Harness.
The retired `PPTMAKER_FRAMEWORK/` command path SHALL not remain documented,
accepted as an alias, or resolved as a fallback. Existing `ppt_flow`,
`PPTMAKER_*`, and `pptmaker-*` namespaces SHALL remain unchanged.

#### Scenario: An Agent receives a direct CLI command

- **WHEN** active guidance or a CLI diagnostic names the production entrypoint
- **THEN** it uses `node ppt_maker_harness/scripts/ppt_flow.mjs <command>`
- **AND** it does not direct the Agent to the retired Framework-root path

## MODIFIED Requirements

### Requirement: Non-v2 CLI requests fail before execution

When a run-scoped command derives a Deck root whose locator is missing,
malformed, v1, Framework-named, conflicting, or not verified at its declared
local Harness root, the CLI producer SHALL emit one bounded unsupported-binding
diagnostic before state reads or mutation, provider initialization,
generated-artifact reads, review publication, or production work. It SHALL use
the shared binding evaluator and SHALL not select a fallback Harness or convert
the Bundle. When that binding is valid but the source/state pair is non-v2, the
existing unsupported-protocol diagnostic SHALL occur before provider
initialization, generated-artifact reads, review publication, or state mutation.

`bundle_layout --check --structure-only` remains a non-authoritative layout
inspection: it may report structure without a current binding, but it SHALL not
read state, select a run, or perform an execution action.

#### Scenario: A legacy binding is fenced before state inspection

- **WHEN** a run requests status, validate, build, refresh, slides, new-version,
  state, Style Master, Image2, normal bundle validation, or another registered
  run operation and its Deck card is not a verified v2 local Harness binding
- **THEN** the CLI returns only the bounded unsupported-binding next action
- **AND** it does not invoke a decoder, migration operation, provider, or
  source/state/generated-artifact mutation

#### Scenario: A non-v2 source/state pair remains fenced after binding

- **WHEN** a verified v2-bound Bundle has a non-v2 source/state pair and
  requests a production operation
- **THEN** the CLI returns only the existing unsupported-protocol next action
- **AND** it does not invoke a decoder, migration operation, provider, or state
  mutation

#### Scenario: Structure-only layout inspection stays non-authoritative

- **WHEN** a user checks an old Bundle with `--structure-only`
- **THEN** the CLI reports the layout result without a current binding
- **AND** it does not resume, initialize, or mutate that Bundle
