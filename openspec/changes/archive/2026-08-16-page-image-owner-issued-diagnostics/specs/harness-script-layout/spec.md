# Harness Script Layout Specification (delta)

## ADDED Requirements

### Requirement: Architecture guard rejects diagnostic owner bypass and second attributors

The current architecture guard SHALL detect, before a production route is
accepted: (1) a migrated source/config producer family whose owner/category/
reason/next is re-derived by `ppt_flow.mjs` code/prefix sets instead of the
producer-issued problem-fact contract (`diagnostic-facts`); (2) a second
business attributor that reconstructs owner or category from `Error.message`
prose or error class names; (3) re-entry of the retired
`page-authority-visual-language.yaml` path into current-layer specs or
guidance; and (4) re-entry of the retired consumer contract that branches on
top-level `code`/`hint` for recovery. The guard SHALL reject these patterns
with a safely planted violation proving detection, SHALL pass when the
violation is repaired, and SHALL NOT be escapable by moving the offending
pattern to a different file or module name.

#### Scenario: A planted second attributor is rejected

- **WHEN** the guard's negative fixture plants a code-prefix classifier for
  a migrated family
- **THEN** the guard fails the architecture check and names the offending
  pattern
- **AND** after the fixture is repaired the check passes

#### Scenario: The retired visual-language path cannot return

- **WHEN** a current-layer spec or guidance again references
  `page-authority-visual-language.yaml`
- **THEN** the guard rejects the re-entry regardless of which file hosts it
- **AND** no file rename or relocation escapes the guard scope
