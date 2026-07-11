## ADDED Requirements

### Requirement: checkBundle supports preview vs pipeline readiness

`bundle_layout.mjs` `checkBundle` SHALL support three readiness levels:

1. **structure** — canonical dirs/control files only (today's `requirePipelineReady=false`)
2. **preview** — structure plus `style_master.jpg` present; SHALL NOT require metadata `content_gate` / `visual_gate` to be approved or waived
3. **pipeline** — preview plus metadata gates ∈ {`approved`, `waived`} (today's `requirePipelineReady=true`)

Boolean `true`/`false` MAY remain as aliases for `pipeline`/`structure`. Callers that need style master without gates SHALL use `preview` (not `pipeline`).

#### Scenario: Preview ready with pending gates

- **WHEN** `checkBundle(runDir, 'preview')` (or equivalent) runs
- **AND** style master exists
- **AND** metadata gates are still `pending`
- **THEN** no gate-related violations are returned

#### Scenario: Pipeline ready still requires gates

- **WHEN** `checkBundle(runDir, 'pipeline')` or `checkBundle(runDir, true)` runs
- **AND** a metadata gate is `pending`
- **THEN** a gate-related violation is returned
