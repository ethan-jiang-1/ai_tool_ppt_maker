## ADDED Requirements

### Requirement: BOOTSTRAP uses the Phase 0 environment interface

BOOTSTRAP SHALL present `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor` as the canonical user-facing environment command after dependencies are installed. It SHALL also document `node PPTMAKER_FRAMEWORK/scripts/00-setup/env-check.mjs` as the pre-install recovery invocation when Commander or another npm dependency is absent; this is the registered direct maintenance checker, not a competing normal workflow. Every active repair rerun and path reference SHALL use the appropriate one of those canonical paths. The old flat `scripts/env-check.mjs` path SHALL NOT remain.

The directory migration SHALL preserve all existing base/Image2 readiness modes, check names, copy-pasteable repair guidance, gate scope, and beginner-facing behavior.

#### Scenario: Beginner reruns base readiness

- **WHEN** BOOTSTRAP gives the final rerun command after a local repair
- **THEN** it uses the stable root `ppt_flow doctor` invocation
- **AND** the user does not need to know the direct Phase path

#### Scenario: Maintainer follows a direct environment example

- **WHEN** an active maintenance guide documents the standalone checker
- **THEN** it uses `scripts/00-setup/env-check.mjs`
- **AND** docs coherence rejects the old flat path

#### Scenario: Commander is not installed yet

- **WHEN** BOOTSTRAP is diagnosing a missing npm dependency before `ppt_flow.mjs` can load
- **THEN** it gives the direct `scripts/00-setup/env-check.mjs` recovery invocation
- **AND** it returns to canonical `ppt_flow doctor` guidance after dependencies are repaired

#### Scenario: Path migration preserves readiness semantics

- **WHEN** the Phase 0 checker runs from its new owner path
- **THEN** base READY/NOT READY, optional Image2 modes, warnings, and exits match the pre-migration contract
