---
playbook: migrate-import
description: 导入素材、整理旧 bundle，或将 markerless deck 显式迁移为 clean HTML vNext
supported_pipelines: [html-first-v1, legacy-image2-first]
includes: []
---

# Playbook: Migrate / Import

## Nodes

### intake-migration

```yaml
node: intake-migration
lifecycle_phase: 0
method_module: 00-setup
requires: []
produces: [migration-plan]
decisions: [new-import, align-bundle, html-vnext, stop]
entry: []
exit: [user_decision_recorded, user_evidence:success-criteria-confirmed]
```

**Step 1 — MD**: Inventory source/target/pipeline and explain each reversible strategy. `html-vnext` never mutates the markerless source version.

**Step 2 — GATE**: Record exact strategy and success criteria before copy, scratch render, or version publication.

### map-migration-inputs

```yaml
node: map-migration-inputs
lifecycle_phase: 0
method_module: 00-setup
requires: [intake-migration]
produces: [source-control-asset-map]
entry: []
exit: [evidence:assets-mapped, user_evidence:mapping-confirmed]
```

**Step 1 — MD**: Show source/control/asset mapping. Generated legacy images remain comparison evidence, never HTML target source.

**Step 2 — GATE**: Confirm the map; do not infer structured body from legacy prompt prose.

### preview-html-migration

```yaml
node: preview-html-migration
lifecycle_phase: 3
method_module: 03-html-production
requires: [map-migration-inputs]
produces: [html-migration-plan, proposed-contact-sheet]
entry: []
exit: [evidence:migration-preview-current]
```

**Step 1 — MD**: Author a complete candidate under `_scratch/html-migration/projected-run/`, preserving valid IDs/spoken keys/notes and using complete HTML source/control/assets.

**Step 2 — CLI**: Run `ppt_flow migrate-html <source-run-dir> preview`. Show exact `old_side_mode`, anticipated target, source diff, complete proposed contact sheet, and plan hash. Degraded old-side modes show no stale/missing pixels or parity claim.

### confirm-html-migration

```yaml
node: confirm-html-migration
lifecycle_phase: 3
method_module: 03-html-production
requires: [preview-html-migration]
produces: [migration-apply-decision]
decisions: [apply, revise, decline]
entry: []
exit: [user_decision_recorded]
```

**Step 1 — GATE**: Bind the user's decision to the exact mode/hash. `revise` rebuilds the candidate/preview; `decline` publishes nothing.

### apply-html-migration

```yaml
node: apply-html-migration
lifecycle_phase: 3
method_module: 03-html-production
requires: [confirm-html-migration]
produces: [clean-html-target]
entry: [node_decision:confirm-html-migration:apply]
exit: [evidence:migration-target-published]
```

**Step 1 — CLI**: With this exact active source execution, run `migrate-html apply --plan-hash <hash> --old-side-mode <mode>`. The hidden target rerenders canonical reset-null output and must match preview before no-replace publication.

**Step 2 — MD**: On apply journal conflict, use only its owner/age/token recovery action. Same-host dead after 60s may recover automatically; cross-host/uncertain after 5m requires explicit human no-active-process confirmation and exact token. Never delete journal/reservation/staging manually; absent-target recovery performs owned cleanup and full rerender.

### migration-target-review

```yaml
node: migration-target-review
lifecycle_phase: 3
method_module: 03-html-production
requires: [apply-html-migration]
produces: [target-review-continuation]
entry: []
exit: [evidence:migration-handoff-completed]
```

**Step 1 — CLI**: Complete the exact receipt-bound state handoff from source migration execution to target HTML continuation. A crash before handoff is observed as non-writing `migration_handoff_pending`; mismatch is replacement-required.

**Step 2 — MD**: Target starts reset-null with content/visual/delivery reviews pending. Open target artifacts, publish new gates, build, and perform final review; no source approval is inherited.
