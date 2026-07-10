## Why

主 spec 与实际框架 (现状) 存在多处不一致，coding agent 读到会混淆：

1. **State 存储** (已 sync, commit `6d76edc`): 旧单文件 `run-bundle-state.yaml` → `_state/` 目录 (`state.yaml` + `history.jsonl`)，对齐 `scripts/lib/state.mjs`。
2. **结构计数错误** (且 spec 之间自相矛盾):
   - framework-charter 说 charter/ "exactly three files"，实际 **4** 个 (多 `NODE-SPEC.md`——node-specification 强制要求它存在)。
   - framework-charter 说 root "exactly four subdirectories"，实际 **5** 个 (多 `playbook/`)。
   - playbook-execution 说 playbook/ "exactly five files"，实际 **6** 个 (多 shared node `classify-change.md`——其自身下一条又要求它存在)。
3. **命名/引用漂移**:
   - framework-charter 的 reference 文档用大写 `QUICK_START.md`，实际小写 `quick-start.md`。
   - node-specification scenario 引旧 playbook 名 `full-creation`、`chain-a.md`/`chain-b.md`，实际 `create-deck`、`edit-text`/`edit-visual`。
   - node-specification scenario 说 `unified_pipeline.mjs` 读 state，实际该脚本零 state 引用；读 state 的是 `ppt_flow.mjs state --check-gates`。
   - scenario 用 `visual_gate`，但 `_state/state.yaml` 的键是 `gates.visual`。

## What Changes

用 delta spec (MODIFIED/RENAMED/REMOVED/ADDED) 把 3 个主 spec 对齐现状：

- **framework-charter**: charter 3→4 文件 (RENAMED + MODIFIED)；root 4→5 子目录；reference 文档小写化；删已完成重组的 REMOVED 噪声段 (3 条)。
- **playbook-execution**: playbook 5→6 文件 (补 shared node `classify-change.md`)；state → `_state/state.yaml`；gate 命名 `visual_gate`→`gates.visual`；删 "coexists" 旧描述。
- **node-specification**: state → `_state/` (state.yaml + history.jsonl)，补 History append-only，删旧 corruption 需求；scenario 修 `full-creation`→`create-deck`、`chain-a/b`→`edit-text/edit-visual`、`unified_pipeline`→`ppt_flow`、`visual_gate`→`gates.visual`。

## Capabilities

### Modified Capabilities

- `framework-charter`: charter 文件数、root 子目录数、reference 文档命名对齐现状；删 REMOVED 噪声段
- `playbook-execution`: playbook 文件数含 shared node；state → `_state/state.yaml`；gate 键名对齐
- `node-specification`: state → `_state/` 目录 + history；scenario 中的 playbook/脚本/gate 命名对齐现状
