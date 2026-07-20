## MODIFIED Requirements

### Requirement: Unified pipeline orchestrates stages

`PPTMAKER_FRAMEWORK/scripts/03-html-production/unified_pipeline.mjs` SHALL remain the registered marker-first direct orchestration adapter and SHALL delegate each stage to the selected complete public Phase interface. The exact cross-owner process-adapter allowlist SHALL be root `ppt_flow.mjs`, Phase-0 `env-check.mjs`, and Phase-3 `unified_pipeline.mjs`, `stage1_build_inputs.mjs`, and `stage4_build_pptx.mjs`; these adapters SHALL import no Phase private implementation. Env-check SHALL preserve base plus explicitly selected Image2 modes without introducing a Phase-0-to-Phase-5 edge. Stage 1 SHALL preserve marked-source validation and markerless input-building modes; Stage 4 SHALL preserve `--run-dir` branch classification and legacy artifact flags. Stage 5 SHALL remain an ordinary Phase-3 adapter over an import-safe Phase-3 notes/PPTX operation, which Phase 5 MAY consume only through `03-html-production/index.mjs`. `unified_pipeline.mjs` SHALL support shared `--dry-run` and slide selection without embedding stage implementations. The Phase 3 HTML interface SHALL use structured Stage 1, HTML page Stage 2, local compositor Stage 3, common final-slide Stage 4, and Stage 5 notes without loading `.env`, provider credentials, style master, or legacy generator/contact-sheet code. The Phase 5 markerless interface SHALL retain `.env`/Image2 Stage 2, legacy contact sheet, header-lock Stage 3, and existing relevant `--force-images` behavior. Dry-run SHALL describe only the selected branch and remain write/remote-free.

#### Scenario: HTML dry run is credential-free

- **WHEN** a marked run invokes any dry-run stage selection through the relocated unified adapter
- **THEN** the plan names only local HTML stages and does not load Image2 environment configuration

#### Scenario: Legacy Stage 2 delegates in-framework

- **WHEN** a markerless run selects Stage 2 through the relocated unified adapter
- **THEN** orchestration retains the Phase 5 legacy `stage2_generate_images.mjs` plus `make_contact_sheet.mjs` ownership
- **AND** the adapter does not import their private implementation directly
