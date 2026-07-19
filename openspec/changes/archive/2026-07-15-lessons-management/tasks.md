## 1. Core CLI Tool (lessons-management)

- [x] 1.1 Create `PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/lessons.mjs` with Node.js built-ins only (no external dependencies). Import `deckRoot`, `LESSONS_DIR` from `bundle_layout.mjs`. Implement hand-rolled argv parser for `list`, `add`, `check`, `search` subcommands. Follow `bundle_layout.mjs` CLI pattern (shebang, ESM imports, `_main()` entry).
- [x] 1.2 Implement `list <runDir>` subcommand: resolve deck root, read `_lessons/`, list `.md`/`.yaml` files (exclude `README.md`), extract first heading or frontmatter as summary, print count. Support `--json` for machine-readable output.
- [x] 1.3 Implement `add <runDir> --title <slug>` subcommand: create `_lessons/<title>.md` with 4-question template pre-filled, refuse to overwrite existing files, create `_lessons/` dir if absent.
- [x] 1.4 Implement `check <runDir>` subcommand: print a prominent reminder listing lesson files when they exist, or "No lessons yet" when empty. Exit 0 in both cases.
- [x] 1.5 Implement `search <runDir> <keyword>` subcommand: case-insensitive grep across all lesson files, print filename + matching line for each hit, "no matches" when nothing found.
- [x] 1.6 Add usage/help output for `lessons.mjs` (triggered by `--help` or no/invalid subcommand).

## 2. Status Integration (cli-surface)

- [x] 2.1 Add lesson count collection to `collectStatus()` in `ppt_flow.mjs`: read `_lessons/` directory, count files excluding `README.md`, store as `lessons_count`.
- [x] 2.2 Add `Lessons:` line to `printStatus()` in `ppt_flow.mjs`: show count when >0 with hint to run `lessons.mjs list`, show "none" when 0.
- [x] 2.3 Ensure `status --json` includes `lessons_count` integer field.

## 3. README and Template Updates (run-bundle-management)

- [x] 3.1 Update `LESSONS_DIR_README` constant in `bundle_layout.mjs`: add a copy-paste markdown template for new `.md` lessons showing the 4-question structure with placeholder text. Verify `selfCheck()` still passes after the change.
- [x] 3.2 Update `GUIDE_FILE` template in `bundle_layout.mjs`: make the "自留教训" section visually distinct from "当前进度", add reference to `lessons.mjs list` command. Verify `selfCheck()` and existing `test_bundle_layout.mjs` tests still pass.

## 4. Workflow Documentation (framework-charter)

- [x] 4.1 Update `PPTMAKER_FRAMEWORK/BOOTSTRAP.md`: add mandatory `_lessons/` scan to the resume ritual (alongside `_state`/status). The agent must list all lesson files and summarize key findings before proceeding.
- [x] 4.2 Update `PPTMAKER_FRAMEWORK/BOOTSTRAP.md`: add a section documenting user-triggered capture. When the user says "记住这个" / "下回别忘了" / "不容易总算调出来了" / "记下来", the agent SHALL immediately capture the relevant lesson using `lessons.mjs add` or by writing the file directly.
- [x] 4.3 Update `PPTMAKER_FRAMEWORK/charter/AGENT_CONTRACT.md` §4 (Phase gates): add instruction to offer lesson capture after multi-attempt error resolution, and confirm no uncaptured lessons at phase gate approval. Reference `lessons.mjs add` as preferred capture tool.
- [x] 4.4 Update `PPTMAKER_FRAMEWORK/AGENTS.md`: add explicit lesson-awareness steps — "Check `_lessons/`" at each Phase start, vendor/endpoint lesson flag before Phase 2, "Lesson worth capturing?" after error resolution, "Uncaptured lessons?" at phase gate approval. Reference `lessons.mjs check` and `lessons.mjs list`.

## 5. Tests

- [x] 5.1 Create `tests/test_lessons.mjs`: unit tests for `lessons.mjs` using temporary deck fixtures. Cover: list with lessons, list empty, list `--json`, add creates file with template, add creates `_lessons/` dir when absent, add refuses overwrite, add fails without `--title`, check with/without lessons, search with matches/no matches, search fails without keyword, missing dir handling.
- [x] 5.2 Add assertions to `tests/test_bundle_layout.mjs`: verify `LESSONS_DIR_README` includes the copy-paste template marker, verify `GUIDE_FILE` template includes `lessons.mjs list` reference.
- [x] 5.3 Update any existing tests that assert on `printStatus()` output or `collectStatus()` return shape to include the new `lessons_count` field.

## 6. Validation

- [x] 6.1 Run `node PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/lessons.mjs list deck_ai_sdlc_keynote/3_versions/v1` — verify it shows 2 lessons with summaries.
- [x] 6.2 Run `node PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/lessons.mjs add <test_runDir> --title "test-lesson"` — should create file with template; verify content.
- [x] 6.3 Run `node PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/lessons.mjs search deck_ai_sdlc_keynote/3_versions/v1 vendor` — verify it finds `vendor-reliability.md`.
- [x] 6.4 Run `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs status deck_ai_sdlc_keynote/3_versions/v1` — verify the `Lessons: 2` line appears.
- [x] 6.5 Run `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs status deck_ai_sdlc_keynote/3_versions/v1 --json` — verify `lessons_count: 2` in JSON output.
- [x] 6.6 Run `npm test` — verify all existing tests pass.
- [x] 6.7 Run `node PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs --self-check` — verify SSOT consistency.
