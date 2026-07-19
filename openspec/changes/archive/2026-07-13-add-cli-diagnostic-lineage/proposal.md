## Why

The current JSON failure envelope lets MD Controllers detect that a CLI failed, but it often discards the structured context JS already knows: the failing slide or field, editable source, derived artifact chain, stage, and safest next action. Because Markdown reasoning and deterministic Node stages alternate throughout production, that loss forces MD to guess precisely when runtime context is most fragile.

## What Changes

- Extend the existing failure envelope with a versioned `diagnostic` object that explains the failure category, known cause, source-to-artifact lineage, and an MD-actionable next step.
- Require every registered CLI process that terminates non-zero under JS control to emit exactly one final failure envelope with at least a minimal diagnostic; contextual failures add source, subject, stage, reason, lineage, or bounded per-item issues when known, and catchable interruption is distinguished from a defect.
- Preserve backward compatibility: existing top-level `ok` / `code` / `message` / `hint` / `where` fields remain required, and parsers continue to accept legacy envelopes without `diagnostic`.
- Preserve diagnostic context across `ppt_flow` and other delegated CLI boundaries without exposing a second child envelope or recursively nesting envelopes, and make direct-entry failure output transactional so pre-envelope prose cannot bypass the policy.
- Audit the complete observable CLI surface: all directly executable scripts, all 12 `ppt_flow` commands, and each applicable return category (help, usage failure, contextual failure, delegated failure, catchable interruption, prose success, and JSON success).
- Keep the whole failure channel bounded, secret-safe, and useful to both humans and MD. Raw failure prose is replaced by a deterministic human rendering of the sanitized envelope; neither rendering nor envelope may contain credentials, raw `.env` content, stacks, unbounded prompts, raw child stdout/stderr, or raw provider bodies.
- Keep successful prose bytes and JSON shapes stable within explicit transaction bounds; live timing moves to registered progress events. Successful `--json` output remains clean stdout JSON; diagnostics are failure control messages, not a new success payload requirement.
- Make both sides discoverable at their real production entry points: repository-maintenance Agents are routed from root `AGENTS.md` to the CLI producer spec, while `bundle_layout.mjs` seeds a run-bundle `AGENTS.md` that routes runtime MD/Agents through `deck-guide.md` and the diagnostic consumer rules.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `cli-surface`: become the authoritative, code-discoverable producer contract for every framework CLI, including v1 diagnostics, exhaustive return auditing, and `ppt_flow` child preservation across all 12 commands.
- `node-specification`: remain the consumer contract for how MD Controllers interpret diagnostic evidence, distinguish automatic actions from human decisions, and avoid guessing or editing generated artifacts.
- `run-bundle-layout`: admit a generated `AGENTS.md` as a canonical deck-root control file for agent-agnostic run-bundle entry.
- `run-bundle-management`: require `initBundle` / `ppt_flow init` to produce the run-bundle Agent entry and keep it aligned with `CLAUDE.md` and `deck-guide.md`.

## Impact

- Affected code: `PPTMAKER_FRAMEWORK/scripts/shared/cli/cli_error.mjs`; the 11 current direct executables under `PPTMAKER_FRAMEWORK/scripts/`; child-process handling in `ppt_flow.mjs`; orchestration/error propagation in `unified_pipeline.mjs`; and run-bundle control-file production in `bundle_layout.mjs`.
- Affected tests: `tests/test_cli_error.mjs` plus focused Stage 1-5, environment, bundle-layout, style-master, contact-sheet, pipeline, and `ppt_flow` tests.
- Affected agent-discovery and governing docs: repository-root `AGENTS.md`, generated run-bundle `AGENTS.md` / `deck-guide.md`, producer-owned `workflow/00-setup/template-deck-guide.md`, `scripts/README.md`, the `cli_error.mjs` and MD-controller module headers, `charter/CONSTITUTION.md`, `NODE-SPEC.md`, `AGENT_CONTRACT.md`, and active command/runtime references that describe the minimal envelope.
- This is a framework-maintenance change to framework source. It does not authorize a deck-production Agent to mutate the soft bundle at runtime, and it never requires hand-editing run-bundle `_generated/` artifacts.
- Existing run bundles, including `deck_ai_sdlc_keynote`, are read-only evidence for this change and SHALL NOT be hand-patched; the durable fix is in producer-owned seeds and fresh-scaffold tests. This does not revoke the already-satisfied, narrowly scoped README golden-sample requirement in `run-bundle-management`, and this change does not alter those placement-map README seeds.
- No new runtime dependencies, no new CLI commands, no breaking top-level envelope change, and no production path outside Node.js ESM.
