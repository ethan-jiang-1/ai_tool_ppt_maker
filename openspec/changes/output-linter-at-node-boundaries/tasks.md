## 1. Core linter library

- [ ] 1.1 Create `PPTMAKER_FRAMEWORK/scripts/lib/lint_output.mjs` with `lintYaml(content, filePath?)` — parse via `yaml.parseDocument({ strict: false })`, return `{ ok, errors, warnings }`
- [ ] 1.2 Implement `lintMarkdown(content, filePath?)` — detect frontmatter block (`---...---`), parse body as YAML via lintYaml; unclosed → `ok: false`
- [ ] 1.3 Implement `lintSlideSpecs(content, filePath?, opts?)` — delegate to `stage1_build_inputs.mjs` `validateSpecs()` logic; support `{ allowPlaceholders }` for context-aware L3 validation
- [ ] 1.4 Implement `lintFile(filePath, opts?)` — auto-detect: `slide-specifications.md` → `lintSlideSpecs`, other `.md` → `lintMarkdown`, `.yaml`/`.yml` → `lintYaml`, unknown → skip with warning
- [ ] 1.5 Implement `PRODUCES_PATH_MAP` — 5 agent-authored MD file mappings with file path resolvers + validator + opts. All other produces IDs → skipped (pure evidence or JS pipeline output)
- [ ] 1.6 Implement `lintNodeProduces(runDir, nodeId, playbookDir)` — resolve node's produces from playbook index, map to files, batch lint, return `[{ file, ok, errors, warnings }]`

## 2. Exit condition integration

- [ ] 2.1 Add `"outputs_linted"` to `DETERMINISTIC_CONDITIONS` set in `md_controller_reader.mjs`
- [ ] 2.2 Implement `outputs_linted` in `CONDITIONS` in `state.mjs` — call `lintNodeProduces(ctx.runDir, ctx.nodeId, ctx.playbookDir)`, return `results.every(r => r.ok)`
- [ ] 2.3 Inject `nodeId` and `playbookDir` into ctx in `checkExit` and `checkEntry` — `{ ...ctx, nodeId: nodeName, playbookDir }` before `checkConditions`

## 3. Playbook node updates (create-deck.md)

- [ ] 3.1 Add `outputs_linted` to exit lists of: `instantiation` (deck-guide), `seed-topics` (core-metaphor, core-formula), `wave0` (slide-specifications-l1-l2-l4), `wave1` (validated-slide-specifications)
- [ ] 3.2 Add **Step N — CLI** to each of the 4 nodes: instruct agent to run `ppt_flow lint --run-dir <runDir> --node <nodeId>`, read output, fix errors, re-run (max 3 rounds); 3-round fail → hard-stop with report to user

## 4. CLI `lint` command

- [ ] 4.1 Add `lint` subcommand to `ppt_flow.mjs` with `--file`, `--run-dir` + `--node`, `--tolerant`, `--json`
- [ ] 4.2 Implement human-readable output: per-file ok/error/warning summary
- [ ] 4.3 Implement `--json` output: structured results on stdout; obey CLI error envelope on hard failure
- [ ] 4.4 Update command count from 12 to 13 in help text and header comment
- [ ] 4.5 Register `lint` in command-return audit test: help, usage failure, contextual failure, JSON success

## 5. Documentation updates

- [ ] 5.1 Add `outputs_linted` to Gate Conditions Catalog in `NODE-SPEC.md` — type "output validation", data source `lintNodeProduces()`, exit-only
- [ ] 5.2 Document PDCA lint protocol in NODE-SPEC.md: node body CLI step → agent runs lint → reads output → fixes → re-runs → 3-round max → gate closes at checkExit
- [ ] 5.3 Add `lint` command reference to `COMMANDS.md` with examples
- [ ] 5.4 Reference `ppt_flow lint` in `AGENT_CONTRACT.md` §7

## 6. Testing

- [ ] 6.1 Create `PPTMAKER_FRAMEWORK/tests/lint_output.test.mjs` — unit tests: all validators with valid/invalid inputs, strict/tolerant behavior, auto-detection, produces ID skip behavior, allowPlaceholders
- [ ] 6.2 Add integration tests for `ppt_flow lint` CLI — all modes, JSON output, error envelope, --help
- [ ] 6.3 Add test for `outputs_linted` condition via `checkExit` — node with valid/invalid produces; verify `nodeId` injected
- [ ] 6.4 Verify `npm test` full regression — all existing tests pass, command-return audit covers 13th command
