# Commands Reference Specification (delta)

## ADDED Requirements

### Requirement: Verb-collision decisions are registered and audited

The command reference SHALL register a verb-collision decision table that names
each shared verb (such as `plan`, `authorize`, `generate`, `review`, `accept`)
across the command families that use it (`image2`, `style-master`, and any
future command), and SHALL state which command owner and effect class each
occurrence belongs to. The document-command audit SHALL fail when a documented
verb collision is not present in the registered table, preventing the reference
from drifting away from the CLI's declared ownership.

#### Scenario: A shared verb has one registered owner per command family

- **WHEN** a verb appears in more than one command family
- **THEN** the decision table names each occurrence's owning command and effect
  class
- **AND** the document-command audit rejects an undocumented collision

#### Scenario: The reference cannot drift from the declared ownership

- **WHEN** documentation names a verb collision that the registered table does
  not contain
- **THEN** the document-command audit fails
- **AND** the reference is corrected to match the declared table rather than
  inferring ownership from prose
