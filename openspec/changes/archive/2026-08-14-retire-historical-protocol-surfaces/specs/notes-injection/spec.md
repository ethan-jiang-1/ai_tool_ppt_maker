## MODIFIED Requirements

### Requirement: Notes completion consumes only current Page Image delivery

Notes extraction and injection SHALL consume only the declared current final
manifest and its matching assembly receipt. A present foreign, unreadable,
incomplete, or cross-lineage delivery record that cannot establish exact
declared-current production identity SHALL emit the typed
`current_protocol_invalid` cause and project the owner-issued
`production-protocol` `current-protocol-invalid` hard-stop with
`repair-current-protocol-identity` of kind `repair` before notes mutation. It
SHALL preserve that input's bytes, SHALL not define a duplicate action schema,
and SHALL not treat the record as a fallback, migration, conversion, export, or
compatibility input.

An otherwise attributable current delivery lineage that merely lacks a derived
receipt field or required current output, or whose derived delivery media has
drifted, retains its existing delivery-owner rebuild action. This requirement
does not translate that current recovery into protocol repair.

#### Scenario: Current completion writes a current notes receipt

- **WHEN** replacement finalization and assembly have published valid current
  evidence
- **THEN** Notes Injection writes a receipt bound to that delivery lineage
- **AND** it does not use an unregistered artifact to fill a missing slide

#### Scenario: Invalid delivery identity cannot mutate notes

- **WHEN** Notes Injection receives a foreign or cross-lineage delivery record
  that cannot establish declared-current production identity
- **THEN** it returns the shared `production-protocol` repair action before
  reading or writing notes delivery artifacts
- **AND** the input bytes remain unchanged and no compatibility reader,
  conversion, or provider work occurs

#### Scenario: Attributable current delivery drift remains rebuild work

- **WHEN** current final-manifest and receipt facts attribute one current lineage
  but required derived JPEG media is missing, corrupt, or drifted
- **THEN** Notes Injection returns the existing delivery-owner rebuild action
- **AND** it does not recategorize the current lineage as invalid protocol
