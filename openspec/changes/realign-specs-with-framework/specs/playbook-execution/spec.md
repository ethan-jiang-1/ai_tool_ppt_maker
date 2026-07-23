## MODIFIED Requirements

### Requirement: Playbook controller delegates workflow control to inspection
After it has resolved a semantic intent and exact run, the MD Controller SHALL use the workflow-entry inspection result for resume, small refresh, structural change, and recovery observation/routing. Greenfield creation SHALL first use the direct `init` entry, then consume inspection only after the exact run exists. The Controller SHALL retain intent interpretation, creative work, human communication, and playbook sequencing, but SHALL not reconstruct direct-owner mode/gate/recovery rules or turn a resume action into a substitute for a requested mutation.

#### Scenario: Existing-run Controller delegates observation
- **WHEN** a Controller has resolved an exact run for resume, refresh, structural change, or recovery observation
- **THEN** it uses the workflow-entry inspection result for workflow control
- **AND** it retains the requested mutation with its direct owner rather than substituting a resume action
