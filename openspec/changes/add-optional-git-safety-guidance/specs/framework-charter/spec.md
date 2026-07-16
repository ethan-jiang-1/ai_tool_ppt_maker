## ADDED Requirements

### Requirement: Charter separates deck work versions from optional Git audit

Active framework guidance SHALL define `deck_*/3_versions/vN/` and the Structural Versioning Path as the user-visible deck work-version authority. Git SHALL be described only as an optional source/control audit, comparison, and recovery enhancement. It SHALL not be described as a second slide order source, a replacement for clean vNext publication, a render/cache identity source, or a condition for pipeline correctness.

The guidance SHALL preserve the source/derived boundary: source/control Markdown and required state/control files may be tracked according to the user-owned repository policy; `_generated/` remains reproducible derived output and SHALL not be proposed for forced tracking. The framework SHALL not tell users to use `git add -f _generated/` or a Git commit in place of Structural Versioning Path.

#### Scenario: Reader distinguishes version and audit responsibilities

- **WHEN** an Agent or human reads active charter/startup guidance about versions and safety
- **THEN** it can distinguish deck `vN` as the work-version path from Git as optional source audit/recovery
- **AND** it sees that structural publication and later refresh authorization remain independent of commits

#### Scenario: Generated outputs stay derived under optional Git guidance

- **WHEN** active guidance discusses using Git with a run bundle
- **THEN** it retains the rule that `_generated/` is rebuilt from source and not hand-edited or force-tracked
- **AND** it keeps version-local scratch files separate from tracked source/control policy

