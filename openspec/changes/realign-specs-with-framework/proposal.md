## Why

The main OpenSpec set is meant to be a controlled description of the framework, but five checked-in specifications currently fail its own structural validator: required scenarios are missing and `workflow-inspection` still has a placeholder purpose. A specification that cannot be validated cannot reliably serve as the maintenance authority.

The terminology audit confirmed that `legacy-image2-first` is still a shared code protocol value, not merely obsolete prose. The project is early enough that retaining a compatibility reader would only perpetuate this false historical model. The protocol itself must be removed rather than documented more carefully.

## What Changes

- Repair every currently invalid main requirement by preserving its existing behavior and adding the missing executable scenario.
- Replace the placeholder `workflow-inspection` purpose with its actual read-only workflow-observation responsibility.
- Make complete main-spec validation an explicit required OpenSpec/framework-maintenance verification step, so a future invalid requirement or placeholder purpose is caught before archive.
- Replace `legacy-image2-first` with canonical `whole-page-image2-v1` across source markers, state, controller ownership, transitions, receipts, CLI/status, playbooks, and tests.
- Make `whole-page-image2-v1` explicit in new whole-page sources; delete markerless/legacy-maintenance input, reader, migration, and routing paths rather than retaining aliases.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `framework-charter`: Make the existing Agent resume requirement structurally valid and audit active terminology without altering established production semantics.
- `node-specification`: Make the existing generic workflow-control retirement requirement structurally valid.
- `playbook-execution`: Make the existing Controller-to-inspection delegation requirement structurally valid.
- `cli-surface`: Make the existing resume-card projection requirement structurally valid.
- `workflow-inspection`: Replace its placeholder purpose and make its first two existing requirements structurally valid.
- `content-parsing`: Require explicit current pipeline markers and reject markerless/legacy source.
- `run-bundle-layout`: Define explicit whole-page source identity and remove markerless layout interpretation.
- `run-bundle-management`: Seed and validate explicit whole-page sources only.
- `pipeline-orchestration`: Route the renamed whole-page adapter and remove historical maintenance behavior.
- `image-generation`: Own only the current whole-page Image2 generation path.
- `pptx-assembly`: Replace legacy whole-page receipt lineage with current whole-page lineage.
- `notes-injection`: Replace legacy whole-page notes lineage with current whole-page lineage.
- `commands-reference`: Describe the existing first-class whole-page creation route and only the current state-owned production-mode transition commands.

## Impact

This is intentionally breaking framework repository maintenance. It affects `PPTMAKER_FRAMEWORK/`, `openspec/`, `tests/`, and `tests_e2e/`. It changes source and persisted protocol values and deletes compatibility behavior; existing run bundles using markerless/legacy data are unsupported and must be recreated. It does not treat `deck_*`, `dpt_*`, or generated artifacts as migration fixtures.

OpenSpec validation failure is a framework-maintenance hard-stop before implementation/archival: it protects the reliability of specifications as controlled inputs and identifies the exact invalid spec. It is not a package-test or deck-production gate and does not alter a run bundle.
