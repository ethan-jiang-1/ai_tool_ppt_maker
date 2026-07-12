## Why

The framework's production core is reliable, but its executable contracts and teaching surface have drifted apart during rapid evolution: most playbook node gates are not actually parsed by `state.mjs`, standalone CLIs violate the constitutional JSON failure protocol, and active documentation still contains pre-`full-page` edit-chain rules, external-skill production paths, and broken navigation links. This change is needed now because those contradictions can make an agent choose an unsafe workflow even while the current test suite remains green.

## What Changes

- Make playbook nodes machine-readable and deterministically enforceable: parse the canonical node declaration format, require unique node identifiers, validate `requires` references, and make entry/exit conditions observable instead of silently passing.
- Reconcile the gate-condition catalog with every active playbook, distinguishing deterministic conditions from typed user/agent/CLI evidence, typed decision enums, and cross-node branch evidence; freeze a normative forty-node controller manifest including the missing restructure verification node.
- Version and validate the persisted state schema so repeated and nested playbook executions use isolated active working sets, parent controller snapshots survive switch/resume, and invalid statuses, stale timestamps, ambiguous legacy stacks, or renamed-node states are healed deterministically.
- Correct playbook routing so title/kicker/subtitle edits are classified by resolved render mode: `body+header-lock` uses Chain A, while `full-page` uses Chain B plus image regeneration and header review.
- Extend the constitutional JSON failure envelope to every supported standalone Node CLI, not only `ppt_flow.mjs`.
- Replace the circular `speaker_notes_injected` gate with a transactional current Stage-5 receipt tied to the source and atomically replaced output PPTX, and declare the directly imported `jszip` dependency explicitly.
- Synchronize active framework documentation with the current in-framework Stage 2, render policy, version-delta semantics, run-bundle initialization flow, and canonical lifecycle vocabulary.
- Add automated coherence checks for Markdown links, documented CLI flags, forbidden/stale production paths, edit-chain semantics, playbook node schemas, node uniqueness, condition resolution, and standalone CLI error envelopes.
- Clarify the naming hierarchy so lifecycle Phase, methodology Module, pipeline Stage, and playbook Node are not presented as competing phase systems.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `node-specification`: Require canonical machine-readable node declarations, unambiguous node lookup, unique identifiers, and real entry/exit gate parsing and validation.
- `playbook-execution`: Require every active playbook to use valid node schemas, resolvable dependencies/conditions, and resolved-render-mode-aware edit routing.
- `cli-surface`: Apply the JSON failure-envelope contract to all supported standalone framework CLIs and verify the final stderr line contract.
- `notes-injection`: Emit and validate a Stage-5 completion receipt instead of using a circular playbook-state proxy; align the standalone interface documentation and dependency declaration.
- `framework-charter`: Establish canonical lifecycle terminology and require active constitutional/methodology documents to agree with current runtime and render behavior.
- `framework-directory-layout`: Turn the existing cross-reference requirement into an automated full-framework Markdown link and stale-path validation contract.
- `commands-reference`: Require natural-language title-edit routing to branch on resolved render mode instead of assuming Chain A.

## Impact

- Affected runtime code: `PPTMAKER_FRAMEWORK/scripts/lib/state.mjs`, Stage 5 receipt handling, standalone CLI entry points under `PPTMAKER_FRAMEWORK/scripts/`, and shared validation/error helpers.
- Affected controller content: `PPTMAKER_FRAMEWORK/playbook/*.md`, including one new terminal verification node inside `restructure-slides.md`, and the gate-condition catalog in `charter/NODE-SPEC.md`.
- Affected documentation: framework root/charter/reference/workflow/script READMEs, active production and iteration methodology, templates, and `openspec/config.yaml` context that currently preserves obsolete assumptions.
- Affected tests: state/playbook execution tests, CLI error tests, documentation consistency tests, and new whole-framework coherence fixtures.
- Dependency manifest: declare `jszip` directly because Stage 5 imports it directly today instead of relying on transitive hoisting through `pptxgenjs`.
- No run-bundle layout change, no PPT content migration, no image regeneration, and no modification of `_generated/` artifacts are required.
