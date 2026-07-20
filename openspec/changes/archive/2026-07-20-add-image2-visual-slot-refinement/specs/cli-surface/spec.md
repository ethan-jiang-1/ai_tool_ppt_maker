## MODIFIED Requirements

### Requirement: CLI surface preserves command names

The `ppt_flow` CLI SHALL expose exactly 15 top-level commands: the existing `doctor`, `init`, `status`, `approve`, `style-master`, `validate`, `pilot`, `build`, `refresh`, `new-version`, `test`, `state`, `slides`, and `migrate-html`, plus `image2`. Existing command arguments remain compatible. `image2` SHALL expose only closed `plan`, `authorize`, `generate`, `accept`, `use-html`, `cleanup`, and unknown-submit resolution operations for marked HTML-first runs; it is the sole modern refinement CLI entry.

#### Scenario: Help lists the complete surface
- **WHEN** `ppt_flow --help` runs
- **THEN** all 15 command names, including `image2`, are listed once

#### Scenario: Markerless deck invokes modern command
- **WHEN** a markerless run invokes `ppt_flow image2`
- **THEN** it fails before provider loading with an ownership diagnostic

### Requirement: The complete ppt_flow command surface has return-audit coverage

The command-return registry SHALL cover exactly the 15 registered top-level commands, including `image2`. Its closed refinement operations SHALL audit help, markerless rejection, current-delivery eligibility, plan/authorization drift, duplicate or unknown attempt handling, candidate identity, promotion conflict/recovery, cleanup ambiguity, and success; every applicable category shall have an explicit case or not-applicable reason. Set mismatch SHALL fail.

#### Scenario: Image2 command is not audited
- **WHEN** `image2` is registered without its closed operation return cases
- **THEN** the return audit fails and names the missing command/operation
