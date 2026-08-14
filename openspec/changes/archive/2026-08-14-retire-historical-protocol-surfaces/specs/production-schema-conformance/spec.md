## ADDED Requirements

### Requirement: Active production surfaces have no retired protocol residue

The provider-free production-schema conformance sweep SHALL inspect only
`ppt_maker_harness/`, `tests/`, `tests_e2e/`, `openspec/specs/`, and
`openspec/config.yaml` for three semantic residue categories: a numeric `vN`
identity coupled to a production source, state, receipt, plan, evidence, route,
adapter, candidate, or acceptance role; the retired compound invalid-protocol
action; and an affirmative claim that invalid protocol identity is read,
migrated, converted, adopted, exported, or handled through fallback. It SHALL
reject such an occurrence with its exact active path and bounded category. It
SHALL not read any `openspec/changes/` content, Backlog history, Run Bundle
production data, research data, or `_generated/` outputs.

The repository adapter SHALL enumerate every regular file under the declared
roots. It SHALL scan `.mjs`, `.md`, `.json`, `.yaml`, `.css`, `.html`, and `.txt`
as active text; it SHALL enumerate checked-in `.woff2` font assets as known
binary inputs without decoding them. Any other extension SHALL be an
unclassified coverage failure until explicitly admitted as text or binary.

The sweep SHALL distinguish ordinary structural snapshot notation such as a Run
Bundle `vN` directory or an exact requested/active execution-version mismatch
from production protocol identity. Structural notation remains valid only where
the owning run-bundle/version contract uses it; it SHALL not become an exception
for a production-role-coupled numeric identity. JavaScript `export` syntax,
unrelated-domain compatibility language, and normative specification text that
defines or forbids a residue category SHALL remain valid. The sweep is
repository verification only and SHALL not be called by production startup,
mutate a bundle, or contact a provider.

#### Scenario: A retired protocol category is planted in an active snapshot

- **WHEN** a focused test constructs a retired literal from neutral fragments
  and plants a production-role-coupled numeric identity, competing action, or
  affirmative invalid-input recovery claim in supplied active-surface text
- **THEN** the conformance sweep reports the exact active path and category and
  fails without a scanner exception for its own test
- **AND** restoring the exact synthetic or temporary input passes without a
  write or provider call

#### Scenario: A structural version literal is not misclassified

- **WHEN** a valid active run-bundle test or guidance document names a normal
  `vN` structural snapshot directory or an exact execution-version mismatch
- **THEN** the sweep accepts that structural usage
- **AND** it does not treat the literal as an alternate production protocol

#### Scenario: Generic language is not a residue category

- **WHEN** active source contains JavaScript `export` syntax, unrelated-domain
  compatibility wording, or normative specification text that defines or
  forbids a residue category
- **THEN** the sweep accepts that occurrence
- **AND** it does not use a zero-token policy as a substitute for claim
  classification

#### Scenario: A new text surface cannot silently escape the scan

- **WHEN** a focused coverage control supplies a regular file with an
  unclassified text-like extension under a declared active root
- **THEN** the repository adapter reports its exact path as an unclassified
  coverage failure
- **AND** restoring the declared text/binary classification makes the same
  coverage checkpoint pass
