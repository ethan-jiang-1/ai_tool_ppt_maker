## Why

`_state/` 是 playbook 执行进度的真相源（`state.mjs` + `NODE-SPEC`），但在 run bundle 文件系统层几乎隐形：无 README、无 YAML 注释、不在 `renderTree()` / 头部布局图 / `deck-guide.md` / 根 README 里。Agent 与人类撞见该目录时只能全库搜。根因是 scaffolding 契约缺失——目录靠 `writeState` 副作用出现，从未被当作一等 bundle 目录对待（BUG-005）。

另有入口分叉：`bundle_layout --init` 会写 state，`ppt_flow init` 只调 `initBundle` 往往不写——同一「初始化」体验不一致。

## What Changes

- 将 `_state/` 升为 **一等 scaffold 目录**：`_DIR_READMES`、`initBundle` 建目录、`renderTree()`、文件头 ASCII、`CONSTITUTION` 权威树快照、`AGENTS.md` 示意树
- `_state/README.md`（中文大白话，与其他目录 README 同风）：用途 + 字段一览 + 指针 + 与 metadata 共存
- `state.yaml`：**每次** `writeState` 顶部重打稳定 `#` header（`toYaml` 全量重写，注释不能只写一次）
- `writeState` **ensure** README（旧 bundle 下次写入自愈）
- `initBundle` **统一播种**初始 state（消除两入口分叉）；CLI `--init` 去掉重复 write
- `deck-guide.md`（init 内联）+ `workflow/00-setup/template-deck-guide.md`「进度」对齐提到 `_state`
- 根 README + `project-metadata.yaml` 顶部 comment breadcrumb（**不**合并双闸门）
- `BOOTSTRAP.md` 三层梯度补半句 `_state/`（执行进度）
- 测试 + 归档 BUG-005

**非 BREAKING**：不改 state 字段语义；`checkBundle` **不**因缺 `_state` 而对新旧 deck 一刀切失败（见 design D10）。

## Capabilities

### New Capabilities

_无。_

### Modified Capabilities

- `run-bundle-management`：`_state/` 进 SSOT 树与 init；README/guide/metadata breadcrumb；self-check
- `node-specification`：每次 `writeState` 带 header；ensure README；正文单一来源
- `playbook-execution`：init 可先播种；playbook start 校验/补建；共存说明进 scaffold 文案

## Impact

| 影响面 | 说明 |
|--------|------|
| `scripts/lib/state.mjs` | header 常量、README 正文常量、`ensureStateDirHints`、`writeState` |
| `scripts/bundle_layout.mjs` | import state 常量；dirs / `_DIR_READMES` / `renderTree` / 头图 / guide+metadata / `initBundle` 播种；CLI 去重 |
| `charter/CONSTITUTION.md` | 权威树快照加 `_state/`（`renderTree` 人读镜像） |
| `AGENTS.md` / `BOOTSTRAP.md` | 示意树 / 入口一句 |
| `workflow/00-setup/template-deck-guide.md` | 与 init guide 进度线索对齐 |
| `tests/` | bundle_layout + state 可发现性 |
| `_backlog/bugs/BUG-005` | 归档 |

**Out of scope**：合并双闸门；改 playbook MD；改 state schema；强制旧 `deck-guide` 重写；`history.jsonl` 必选 scaffold；`checkBundle` 强制要求 `_state`（D10）。
