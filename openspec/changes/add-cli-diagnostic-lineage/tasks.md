## 1. Return Audit Coverage

- [ ] 1.1 Expand `tests/test_cli_error.mjs` to register CLI return categories for every `EXECUTABLE_INVENTORY` entry: help, deterministic usage failure, contextual failure when available, success prose, and documented `--json` output. Capability: `cli-surface`. Edit chain: pipeline-script.
- [ ] 1.2 Add tests that `formatCliError` and `parseCliErrorLine` accept optional bounded `diagnostic` objects while preserving the existing required top-level fields. Capability: `cli-surface`. Edit chain: pipeline-script.
- [ ] 1.3 Add clean-stdout JSON probes for documented JSON-returning commands, including at least `env-check --json` and `ppt_flow status/state --json` on a temporary run bundle. Capability: `cli-surface`. Edit chain: pipeline-script.
- [ ] 1.4 Add secret-safety assertions showing diagnostic envelopes do not expose API key values or raw `.env` contents on image-related failures. Capability: `cli-surface`. Edit chain: pipeline-script.

## 2. Envelope Core

- [ ] 2.1 Extend `PPTMAKER_FRAMEWORK/scripts/lib/cli_error.mjs` so `formatCliError`, `emitCliError`, `exitCliError`, and `parseCliErrorLine` preserve optional `diagnostic` data and reject or bound unsafe values. Capability: `cli-surface`. Edit chain: pipeline-script.
- [ ] 2.2 Extend delegated child stderr framing so parsed child `diagnostic` context can be preserved in the parent envelope without leaking a second JSON line. Capability: `cli-surface`. Edit chain: pipeline-script.
- [ ] 2.3 Add small Node-only helper functions for common diagnostics: source path/line, slide subject, artifact lineage, delegated command fallback, and MD next action. Capability: `cli-surface`. Edit chain: pipeline-script.

## 3. Contextual Call Sites

- [ ] 3.1 Add diagnostic lineage to Stage 1 validation/parsing failures where slide id, source field, source path, or markdown line is known. Cover with `tests/test_stage1_build_inputs.mjs`. Capabilities: `cli-surface`, `node-specification`, `content-parsing`. Edit chain: pipeline-script.
- [ ] 3.2 Add diagnostic `md_next` context to `ppt_flow` gate blocks, header-review blocks, and usage failures that already know the run directory, gate, selected slides, or rerun command. Cover with `tests/test_ppt_flow.mjs` and `tests/test_header_review.mjs`. Capabilities: `cli-surface`, `node-specification`. Edit chain: pipeline-script.
- [ ] 3.3 Add slide/artifact lineage to Stage 2 prompt/image failures without exposing credentials or raw provider bodies. Cover with `tests/test_image_generation.mjs`. Capabilities: `cli-surface`, `image-generation`. Edit chain: pipeline-script.
- [ ] 3.4 Add contextual diagnostics to standalone Stage 3/4/5 source/artifact failures where the script can identify missing images, slide plans, PPTX files, or notes receipt inputs. Cover with the matching stage tests. Capabilities: `cli-surface`, `header-lock`, `pptx-assembly`, `notes-injection`. Edit chain: pipeline-script.
- [ ] 3.5 Audit remaining registered executables (`bundle_layout.mjs`, `generate_style_master.mjs`, `make_contact_sheet.mjs`, `unified_pipeline.mjs`) and add diagnostic context for known run-dir, style-master, contact-sheet, or delegated-stage failures. Capability: `cli-surface`. Edit chain: pipeline-script.

## 4. Protocol Docs And Verification

- [ ] 4.1 Update `PPTMAKER_FRAMEWORK/charter/CONSTITUTION.md` and `PPTMAKER_FRAMEWORK/charter/NODE-SPEC.md` to document the optional `diagnostic` object as part of the CLI-to-MD protocol. Capabilities: `cli-surface`, `node-specification`. Edit chain: pipeline-script.
- [ ] 4.2 Update any affected command reference or agent contract text that currently describes only the minimal envelope fields. Capabilities: `cli-surface`, `node-specification`. Edit chain: pipeline-script.
- [ ] 4.3 Run `openspec validate add-cli-diagnostic-lineage --strict` and the focused Vitest suite for CLI, Stage 1, Stage 2, header review, and relevant standalone stage scripts. Capability: `cli-surface`. Edit chain: pipeline-script.
