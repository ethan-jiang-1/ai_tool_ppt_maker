## 1. Module ownership + SSOT surfaces

- [x] 1.1 In `state.mjs`: add `STATE_YAML_HEADER`, `STATE_DIR_README`, `ensureStateDirHints(deckDir)`; keep zero import of `bundle_layout.mjs`
- [x] 1.2 In `bundle_layout.mjs`: import `STATE_DIR` / `STATE_FILE` / `STATE_DIR_README` / `createInitialState` (and existing write helpers) from `state.mjs`; wire `_DIR_READMES[STATE_DIR]` + `dirs` mkdir
- [x] 1.3 Update `renderTree()`, file-header ASCII (history on-demand note), and `selfCheck()` to require `STATE_DIR`
- [x] 1.4 Sync human mirrors: `charter/CONSTITUTION.md` 权威树 + `AGENTS.md` Phase 0 示意树 + `BOOTSTRAP.md` 三层梯度半句

## 2. writeState header + init seeding + control-file breadcrumbs

- [x] 2.1 `writeState`: call `ensureStateDirHints`, then write `STATE_YAML_HEADER + toYaml(state)` every time
- [x] 2.2 `initBundle` end: if no `state.yaml`, `createInitialState` + `setNodeStatus(instantiation, completed)` + `writeState`; do not overwrite existing state
- [x] 2.3 Remove duplicate `writeState` from `bundle_layout` CLI `--init` after `initBundle`
- [x] 2.4 Update templates: init 内联 `deck-guide`「当前进度」、`template-deck-guide.md` 进度段、根 `_DIR_READMES['.']`、`project-metadata.yaml` leading `#` breadcrumb (no field merge)
- [x] 2.5 Confirm D10: `--check --structure-only` still passes on a legacy fixture missing `_state/` (or document why N/A if fixture cost too high—prefer one explicit test)

## 3. Tests + backlog

- [x] 3.1 Tests: `initBundle` → README + header yaml + readable `readState`; `renderTree`/`selfCheck` contain `_state`; double `writeState` keeps header; missing README healed on write
- [x] 3.2 `npm test` green（e2e 若未触及可跳过，但 unit 必须绿）
- [x] 3.3 `git mv` BUG-005 → `_done/_fixed_bugs/`；更新 bugs / fixed / `_done` 三个 README 索引
- [x] 3.4 Confirm design **Acceptance** 1–7（实现侧）全真；主 spec sync 留待 archive
