## ADDED Requirements

### Requirement: MD Controller playbooks are housed by the Harness

MD Controller playbooks and their normative controller inventory SHALL reside
under `ppt_maker_harness/playbook/`. Their move to the Harness SHALL preserve
the external Agent's ownership of intent interpretation, sequencing, creative
work, and user communication; the Harness SHALL not be represented as a
persisted Agent or a Run Bundle identity.

#### Scenario: Agent begins controller work

- **WHEN** an Agent locates an active playbook after resolving an exact run
- **THEN** it reads the playbook from the canonical Harness root
- **AND** it preserves existing state, gate, and direct-owner boundaries
