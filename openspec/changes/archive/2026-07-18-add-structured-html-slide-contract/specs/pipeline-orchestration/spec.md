## ADDED Requirements

### Requirement: HTML-first source validation is available before HTML-first production

Change 2 SHALL expose exactly three general-purpose, Stage-1-equivalent write-free HTML-first validation routes: `ppt_flow.mjs validate <run-dir>`, `stage1_build_inputs.mjs --validate --spec <run-dir>/slide-specifications.md`, and `unified_pipeline.mjs --run-dir <run-dir> --stage 1 --dry-run`. Edit-specific structural preview may invoke the same local validation core only as part of a concrete source transaction under `slide-identity-and-ordering`; it is not a fourth general validation entry, cannot publish a plan, and cannot substitute alternate run/config/catalog inputs. Direct HTML-first validation SHALL accept exactly that one canonical `--spec` and SHALL reject additional specs plus `--out`, `--style-dir`, `--color-palette`, or `--deck-system` overrides through the existing usage envelope, so validation and publication cannot resolve different control inputs. The sole generated-artifact publication route SHALL be literal `unified_pipeline.mjs --run-dir <run-dir> --stage 1` without `--dry-run`; it atomically rebuilds only the existing structured `_generated/slide_plan.json` projection without legacy prompt files. All HTML-first validation and canonical Stage-1 routes SHALL run without dotenv search, provider/model/style-reference prerequisite resolution, or remote-call setup. A non-validation direct `stage1_build_inputs.mjs` invocation that detects the marker SHALL fail with existing code `FAILED`, category `gate`, and `reason.kind: html_first_projection_requires_run_dir`, directing the caller to the canonical unified Stage-1 route rather than honoring arbitrary `--out` as a second publication authority.

For a marked source, the direct validator SHALL reject the legacy `--input` alias, repeated/combined `--spec` values, and every unknown option with the existing `USAGE` envelope before reading alternate control inputs. The markerless branch SHALL retain the existing `--input` alias, multi-input behavior, and legacy option compatibility.

Until a later owning change installs the HTML renderer and provider-neutral delivery path, direct `generate_style_master.mjs --run-dir <run-dir>`, `ppt_flow style-master`, `ppt_flow approve <run-dir> header`, public pilot, build, every refresh kind, and any `unified_pipeline --stage` selection containing legacy Stage 2-5 SHALL perform a shared leading-frontmatter marker probe before run readiness, dotenv/credential/provider-prerequisite resolution, implicit Stage-1 refresh, output/state writes, or any selected stage. They SHALL fail through the existing CLI envelope code `FAILED` with diagnostic category `gate` and `reason.kind: html_first_delivery_unavailable`. The diagnostic SHALL use `cli_error.mjs`, direct maintainers to validation/canonical Stage 1 only, and SHALL not suggest removing the marker or silently use the legacy pipeline. Malformed leading frontmatter SHALL flow to the normal write-free source-validation diagnostic before those prerequisites rather than be treated as a legacy omission. Standalone Stage 2-5 CLIs consume explicit artifact arguments rather than a run-directory source and are unchanged; this change does not claim they can infer a source marker they are not given. Content/visual gate approval and structural source preview/apply remain governed by their existing non-delivery authorities.

The existing structural source preview/apply path MAY operate on HTML-first source under `slide-identity-and-ordering`, but legacy cross-version raw-render materialization SHALL detect an HTML-first target and return the same unavailable-delivery reason before target Stage 1, prompt lookup, artifact copy, state write, or local Stage 3-5 work. Source publication and production materialization remain separate authorizations.

#### Scenario: Structured source validates locally

- **WHEN** a valid HTML-first source runs the explicit parse/validate path
- **THEN** schema, family, capacity/font, asset, selection, and fingerprint validation can complete locally
- **AND** zero remote calls or production images are created

#### Scenario: Stage 1-only projection is the sole write-enabled path

- **WHEN** canonical `unified_pipeline --run-dir <run-dir> --stage 1` without `--dry-run` processes a valid HTML-first source
- **THEN** it atomically rebuilds only the existing `slide_plan.json` projection
- **AND** it writes no legacy prompt manifest/twins or downstream artifacts

#### Scenario: Stage 1 dry-run is validation-only

- **WHEN** `unified_pipeline --run-dir <run-dir> --stage 1 --dry-run` processes an HTML-first source
- **THEN** it performs the same local source/config/catalog/font/fingerprint validation without publishing a temp or final plan
- **AND** every source, control, generated, and state byte remains unchanged

#### Scenario: Direct Stage 1 cannot publish to an arbitrary output

- **WHEN** non-validation `stage1_build_inputs.mjs` receives an HTML-first canonical source plus any `--out`
- **THEN** it returns `html_first_projection_requires_run_dir` before creating the output path
- **AND** only the canonical unified Stage-1 route can publish `_generated/slide_plan.json`

#### Scenario: Direct validation cannot substitute control inputs

- **WHEN** direct Stage-1 `--validate` detects HTML-first source and also receives a second spec or any explicit output/style/palette/deck-system path
- **THEN** it returns the existing usage envelope before resolving alternate control bytes
- **AND** the canonical source's run context remains the only validation authority

#### Scenario: HTML-first validation does not accept legacy aliases or unknown flags

- **WHEN** a marked source is passed to direct Stage 1 with `--input` or an unknown option
- **THEN** it returns the existing `USAGE` envelope before source/config/catalog resolution
- **AND** markerless legacy invocations retain their existing alias and option behavior

#### Scenario: Invalid Stage 1 leaves the prior projection intact

- **WHEN** canonical write-enabled unified Stage 1 fails source, config, catalog, or fingerprint validation
- **THEN** any prior `slide_plan.json` bytes remain unchanged and no temp file remains published
- **AND** when `_generated/` did not exist before the invocation, the failed attempt does not create the directory or any other generated/state path
- **AND** the failure uses the existing source/artifact diagnostic authority

#### Scenario: Input drift before atomic publish aborts

- **WHEN** source, effective palette, geometry-registry bytes, any verified font-authority input, either manifest, or any validated manifest asset changes after Stage 1 reads it but before final `slide_plan.json` rename, or an asset no longer passes the same realpath/regular-file confinement check
- **THEN** Stage 1 detects the input-receipt mismatch and fails without replacing the prior plan
- **AND** it leaves the pre-existing generated directory/file set unchanged apart from cleanup of its own hidden temp path
- **AND** the next action is a clean Stage-1 rerun rather than publishing mixed-snapshot evidence

#### Scenario: Build fails before legacy Stage 2

- **WHEN** a user invokes pilot, build, or production refresh on an HTML-first source during Change 2
- **THEN** orchestration emits the existing `FAILED` envelope with reason `html_first_delivery_unavailable` before readiness, implicit Stage 1, dotenv/Image2/style-reference resolution, or any stage
- **AND** no legacy prompt, provider submit, screenshot, PPTX, or production state is created or changed

#### Scenario: Dry-run does not imply HTML-first delivery availability

- **WHEN** `unified_pipeline --run-dir <html-first-run> --stage <selection>` contains any of Stages 2-5 and also uses `--dry-run`
- **THEN** it returns the same unavailable-delivery diagnostic before stage planning
- **AND** it does not advertise the legacy stages as a viable future route for that source branch

#### Scenario: Legacy style/header preparation is unavailable for the branch

- **WHEN** direct `generate_style_master.mjs`, `ppt_flow style-master`, or `ppt_flow approve <run-dir> header` targets an HTML-first source
- **THEN** it returns `html_first_delivery_unavailable` before Stage 1, Image2/style-reference/header-review prerequisites, metadata writes, or generated writes
- **AND** content/visual approval remains a separate existing human-control action rather than proof of delivery readiness

#### Scenario: Structural source edit does not enter legacy materialization

- **WHEN** an HTML-first structural apply has published a valid target version and legacy structural materialization is requested for it
- **THEN** materialization returns `html_first_delivery_unavailable` before Stage 1 or generated/state writes
- **AND** the already-published source version remains valid and unchanged

#### Scenario: Legacy production remains unchanged

- **WHEN** a source has no HTML-first pipeline marker
- **THEN** existing pilot/build/refresh routing and prerequisites remain unchanged
