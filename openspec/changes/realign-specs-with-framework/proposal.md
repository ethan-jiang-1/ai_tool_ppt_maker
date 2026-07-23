## Why

The main OpenSpec set is meant to be a controlled description of the framework, but five checked-in specifications currently fail its own structural validator: required scenarios are missing and `workflow-inspection` still has a placeholder purpose. A specification that cannot be validated cannot reliably serve as the maintenance authority.

The accompanying terminology audit found a crucial constraint: the current main specs already distinguish first-class `image2-only` production from historical markerless compatibility. `legacy-image2-first` remains an actual shared code protocol value, not merely obsolete prose. Replacing that protocol in a documentation-cleanup change would make the specs less faithful to the running system.

## What Changes

- Repair every currently invalid main requirement by preserving its existing behavior and adding the missing executable scenario.
- Replace the placeholder `workflow-inspection` purpose with its actual read-only workflow-observation responsibility.
- Make complete main-spec validation an explicit required OpenSpec/framework-maintenance verification step, so a future invalid requirement or placeholder purpose is caught before archive.
- Perform a bounded terminology audit of active new-run guidance. Correct only wording that actually misclassifies first-class `image2-only` work as historical maintenance; retain existing `legacy-image2-first` references where they name the current code protocol or a historical compatibility reader.
- Record protocol renaming as explicitly out of scope: any future change from `legacy-image2-first` requires a separate proposal covering source-marker normalization, controller ownership, state, transitions, receipts, CLI, and compatibility fixtures.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `framework-charter`: Make the existing Agent resume requirement structurally valid and audit active terminology without altering established production semantics.
- `node-specification`: Make the existing generic workflow-control retirement requirement structurally valid.
- `playbook-execution`: Make the existing Controller-to-inspection delegation requirement structurally valid.
- `cli-surface`: Make the existing resume-card projection requirement structurally valid.
- `workflow-inspection`: Replace its placeholder purpose and make its first two existing requirements structurally valid.

## Impact

This is OpenSpec/framework-maintenance work. It affects `openspec/` and, only if the terminology audit finds a proven wording defect, its owning framework document and focused documentation test. It does not modify package verification, `deck_*`, `dpt_*`, source formats, state schemas, receipt schemas, provider behavior, generated artifacts, or production-mode routing.

OpenSpec validation failure is a framework-maintenance hard-stop before implementation/archival: it protects the reliability of specifications as controlled inputs and identifies the exact invalid spec. It is not a package-test or deck-production gate and does not alter a run bundle.
