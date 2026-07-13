## Context

The framework already has a constitutional failure envelope: every hard CLI failure exits non-zero and writes exactly one JSON object as the final non-empty stderr line. That gets MD Controllers past the first reliability problem: detecting failure.

The remaining gap is diagnosis. Many failures happen after Markdown source has been transformed through Stage 1 JSON, prompts, image manifests, header-locked images, PPTX, or state. The Node side often knows the exact slide, field, source path, derived artifact, and rerun command at the moment it fails. If that context is not returned, the MD/Agent side has to infer the data lineage from prose and local memory.

## Goals / Non-Goals

**Goals:**

- Preserve the existing CLI envelope contract and extend it with optional diagnostic lineage.
- Make failures actionable for MD Controllers and humans: what failed, what source caused it, what derived artifact was involved, and what command should be run next.
- Audit every registered executable and every externally observable CLI return category, not only the happy `ppt_flow` wrapper path.
- Keep `--json` success output machine-clean by preventing human diagnostics from mixing into stdout JSON.
- Keep the implementation Node-only and dependency-free beyond current npm dependencies.

**Non-Goals:**

- Do not introduce a new CLI command or change the set of `ppt_flow` subcommands.
- Do not require every possible failure to have perfect line numbers; unknown fields stay absent rather than guessed.
- Do not make MD Controllers responsible for repairing deterministic syntax/format errors that JS can heal.
- Do not change the pipeline's source-vs-derived rule; diagnostics point to sources and artifacts but still require source edits and reruns.

## Decisions

1. Add diagnostic context under one optional `diagnostic` envelope object.

   Rationale: the existing top-level fields are stable and widely consumed. A nested object lets old consumers keep parsing the envelope while upgraded MD Controllers can inspect richer context.

   Shape:

   ```json
   {
     "ok": false,
     "code": "FAILED",
     "message": "slide S03 has invalid RENDER MODE",
     "hint": "Set RENDER MODE to full-page or body+header-lock, then rerun Stage 1.",
     "where": "stage1_build_inputs#parseSlideSpecs",
     "diagnostic": {
       "subject": { "kind": "slide", "id": "S03", "field": "RENDER MODE" },
       "source": { "path": "deck_x/3_versions/v1/slide-specifications.md", "line": 128 },
       "stage": "stage1",
       "artifacts": [
         { "role": "source", "path": "deck_x/3_versions/v1/slide-specifications.md" },
         { "role": "derived", "path": "deck_x/3_versions/v1/_generated/slide_plan.json" }
       ],
       "lineage": [
         { "role": "source", "path": "slide-specifications.md" },
         { "role": "derived", "path": "_generated/slide_plan.json" },
         { "role": "derived", "path": "_generated/page_prompts/_prompts.json" }
       ],
       "md_next": {
         "inspect": "deck_x/3_versions/v1/slide-specifications.md:128",
         "command": "node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs validate deck_x/3_versions/v1",
         "default": "Fix the named source field; do not edit _generated/ artifacts."
       }
     }
   }
   ```

2. Treat lineage as best-effort but never fabricated.

   The CLI SHALL include known context and omit unknown properties. It must not synthesize line numbers, slide IDs, or source paths from ambiguous text. This keeps diagnostics trustworthy.

3. Centralize envelope formatting, but add context at call sites.

   `lib/cli_error.mjs` should validate and bound the diagnostic object. Stage-specific code should create context where it has structured knowledge: Stage 1 while parsing markdown, Stage 2 while handling prompt/image manifest entries, header review while checking fingerprints, and `ppt_flow` while wrapping delegated failures.

4. Audit return paths as categories.

   The implementation should inventory registered executables and check these categories:

   - `--help`: exits zero, side-effect free, no failure envelope.
   - deterministic usage failure: exits non-zero, final envelope exists and is parseable.
   - contextual hard failure: final envelope includes diagnostic context when the script has a known subject/source.
   - delegated child failure: parent emits exactly one final envelope while preserving child diagnostic context.
   - success `--json`: stdout is parseable JSON with no prose preamble/trailer and stderr does not end in failure JSON.
   - success prose: no failure envelope and no misleading JSON-looking final stderr line.

5. Keep diagnostics secret-safe.

   Diagnostic fields may include file paths, slide IDs, stage names, artifact roles, and command strings. They must not include API keys, raw `.env` values, full external response bodies that may contain secrets, or unbounded prompt/content dumps.

## Risks / Trade-offs

- [Risk] Envelope bloat makes stderr noisy or brittle. → Mitigation: keep `diagnostic` optional, bounded, and structured; keep the human `message` and `hint` concise.
- [Risk] Parent wrappers drop useful child context. → Mitigation: delegated failure framing should parse child envelopes and copy safe diagnostic fields into the parent envelope.
- [Risk] Tests only cover one direct failure per executable. → Mitigation: add category tests for contextual failures and `--json` outputs in addition to the executable inventory test.
- [Risk] Line numbers are expensive for some parsers. → Mitigation: require line numbers only where the parser already knows or can cheaply compute them; otherwise source path plus field/slide is acceptable.
- [Risk] Diagnostics encourage editing `_generated/`. → Mitigation: `md_next.default` and hints must direct source edits and reruns, not derived-artifact patching.

## Migration Plan

1. Extend `formatCliError`, `emitCliError`, `parseCliErrorLine`, and delegated child framing to preserve optional bounded diagnostics.
2. Add small helper constructors for common diagnostics, especially slide-source and artifact-lineage cases.
3. Update contextual call sites in priority order: Stage 1 validation/parsing, `ppt_flow` gate blocks, Stage 2 prompt/image failures, header review, and delegated child failures.
4. Add CLI return audit tests before broad call-site refactoring so uncovered output paths fail visibly.
5. Update charter/protocol docs after implementation behavior is stable.

Rollback is straightforward: consumers can ignore `diagnostic`, and the existing required top-level envelope fields remain unchanged.

## Open Questions

- Should `diagnostic.md_next.command` be a single default command or an array of runnable commands when there are multiple valid recovery paths?
- Do we want `diagnostic.stage` values to be a closed enum now, or leave them as documented strings until more stage-specific diagnostics exist?
