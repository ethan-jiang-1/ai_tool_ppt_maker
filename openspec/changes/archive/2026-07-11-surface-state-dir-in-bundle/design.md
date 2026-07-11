## Context

BUG-005：`_state/` 在框架知识层处处存在，在 run bundle 文件系统层像「突然冒出的数据目录」。

现状：

| 事实 | 含义 |
|------|------|
| `STATE_DIR` 只在 `state.mjs` | bundle SSOT 不知道它 |
| `writeState` → `toYaml` 全量重写 | 注释必须每次重打 |
| `parseYaml` 已跳过 `#` | header 方案可行 |
| `--init` CLI 写 state；`ppt_flow init` 不写 | 入口分叉 |
| `checkBundle` 不扫 deck 根白名单 | `_state` 不会被判 unexpected；缺它也不会 fail |
| metadata gates vs `_state` gates | 双轨并存；本 change 只加 breadcrumb |

`bundle_layout.mjs` **已** `import { writeState, setNodeStatus } from './lib/state.mjs'`。README/header 正文必须落在 `state.mjs`（或仅被它导出的常量），由 `bundle_layout` **单向** import——禁止 `state.mjs` import `bundle_layout`（循环依赖）。

## Goals / Non-Goals

**Goals:**

1. Bundle 内打开 `_state/` 即可懂：是什么、权威在哪、别乱手改
2. SSOT 树与真实布局一致（代码树 + CONSTITUTION + AGENTS）
3. 新 init 完整；旧 bundle 下次 `writeState` 自愈 README + header
4. `ppt_flow init` ≡ `bundle_layout --init` 对 `_state/` 的结果

**Non-Goals:**

- 合并双闸门 / 改 schema / 改 playbook MD
- 全仓迁移脚本；重写已有 `deck-guide.md`（`_writeIfAbsent` 不覆盖）
- 强制 scaffold 空的 `history.jsonl`
- 把 `template-deck-guide.md` 与 init 内联 guide 合并成单一代码生成器（只对齐进度线索，见 D11）
- 让 `checkBundle` 因缺 `_state` 失败（见 D10）

## Decisions

### D1 — 归类：scaffolding discoverability

功能已有；修的是 **bundle 层契约与就近 breadcrumb**。不新开 capability。

### D2 — `_state/` 一等 scaffold 目录

| 表面 | 动作 |
|------|------|
| `initBundle` `dirs` | `mkdir` `_state/` |
| `_DIR_READMES[STATE_DIR]` | 写 README（正文来自 state.mjs 导出） |
| `renderTree()` + 文件头 ASCII | 列出 `_state/state.yaml`；注明 `history.jsonl` **按需**生成 |
| `selfCheck` | `tree.includes(STATE_DIR)` |
| `CONSTITUTION.md` 权威树 | apply 时与 `renderTree` 对齐（framework-charter 已要求镜像；不另开 delta） |
| `AGENTS.md` Phase 0 树 | 加 `_state/` |

### D3 — 模块所有权（防循环依赖）

**`state.mjs` 拥有：**

- `STATE_YAML_HEADER`（每次 write 前置的 `#` 块）
- `STATE_DIR_README`（README 正文，中文大白话）
- `ensureStateDirHints(deckDir)`（mkdir + README if absent）
- `writeState`：先 `ensureStateDirHints`，再 `header + toYaml`

**`bundle_layout.mjs` 拥有：**

- 从 `state.mjs` import `STATE_DIR`, `STATE_FILE`, `STATE_DIR_README`, `writeState`, `createInitialState`, `setNodeStatus`, …
- `_DIR_READMES[STATE_DIR] = STATE_DIR_README`（或 `.replace` 若需 `{NAME}`——默认正文无 deck 名亦可）
- `renderTree` / 头图 / guide / metadata 模板 / `initBundle` 播种

**禁止：** `state.mjs` → `bundle_layout.mjs`。

### D4 — YAML header 每次重打

稳定英文 header（代码旁注释风），至少含：

- 文件身份（playbook execution state）
- 指针：`charter/NODE-SPEC.md`、`scripts/lib/state.mjs`、`ppt_flow state`
- 字段名一览（不复制 NODE-SPEC 长文）
- 与 `project-metadata.yaml` 共存一句 + `see README.md`

**拒绝：** 仅首次写入时加 header。

### D5 — 初始 state 形状（钉死）

`initBundle` 末尾，若 `state.yaml` **不存在**：

```text
state = createInitialState(deckName, deckType||'', style||'')
setNodeStatus(state, 'instantiation', 'completed')
writeState(deckDir, state)
```

与今日 `--init` CLI 行为对齐（instantiation 标 completed），并补上 CLI 手写对象里缺的 `playbook_stack`（`createInitialState` 自带）。

若文件已存在：**不覆盖**（避免二次 init 擦进度）。

`bundle_layout` CLI `--init`：**删除** `initBundle` 之后的重复 `writeState`。

### D6 — 文案边界

| 产物 | 语言/内容 |
|------|-----------|
| `_state/README.md` | 中文；用途、谁读写、字段短表、指针、勿手改、与 metadata 共存 |
| `state.yaml` header | 英文 `#` 行 |
| `deck-guide`「当前进度」 | 增加 `_state/state.yaml` + `ppt_flow state <v1> [--check-gates]`；保留 `_generated/` 提示 |
| 根 README | 三层 + `_state/` |
| `project-metadata.yaml` | 顶部 `#`：pipeline gates 在此；playbook 进度/gates 在 `_state/`——**字段不变** |

### D7 — Spec 边界

| Capability | 职责 |
|------------|------|
| `run-bundle-management` | 树、init、README 落盘、guide/root/metadata breadcrumb、self-check |
| `node-specification` | header、ensure README、单一正文源 |
| `playbook-execution` | init 可先有 state；start 时缺则建、有则用；共存文案 |

`framework-charter`：**不**另开 delta——CONSTITUTION 更新是既有「快照跟随 `renderTree`」义务的 apply 动作。

### D8 — 测试

| 用例 | 断言 |
|------|------|
| `initBundle`（或 ppt_flow init） | 有 `_state/README.md`；`state.yaml` 以 `#` 开头；`readState` 可读 |
| `renderTree` / `--self-check` | 含 `_state` |
| 两次 `writeState` | header 仍在 |
| 仅有 yaml、无 README | `writeState` 后出现 README |
| 入口 | `ppt_flow init` 与逻辑上等价的 `initBundle` 均产出 state（至少单测 `initBundle`） |

建议：`tests/test_bundle_layout.mjs`（树/init）+ 新建或扩展 `tests/test_state.mjs`（header/ensure）。

### D9 — `history.jsonl`

不预建。`renderTree` / README 写明 append-only、首次 `appendHistory` 才出现。

### D10 — `checkBundle` 不强制 `_state`

缺 `_state/` 的旧 deck **不得**仅因此被 `--check --structure-only` 判失败（避免本 change 变成大规模 break）。可发现性靠 init + write 自愈，不靠 check 鞭打。

若未来要强制，另开 change。

### D11 — 框架侧 guide 模板与 init 内联文案对齐

真实 init 写的是 `initBundle` **内联** `deck-guide` 字符串；另有一份给人/Expert 看的 `workflow/00-setup/template-deck-guide.md`。两者今日已是近亲双源。

本 change **两者都改**「进度」相关段落，都提到 `_state/state.yaml`（及可选 `ppt_flow state`），避免修了 init、模板仍教人只看 `_generated/`。

`BOOTSTRAP.md` 三层梯度那一句：加半句 `_state/` = 执行进度（不展开树），减少入口文档继续隐形。

不把整个 template-deck-guide 重写成与内联 100% 字节相同——只保证 **进度/结构线索不互相矛盾**。

## Acceptance（apply 完成时）

1. `initBundle` / `ppt_flow init` 后：有 `_state/README.md` + 带 `#` header 的 `state.yaml`
2. 打印树 / `renderTree()` 含 `_state`
3. 新 `deck-guide.md` 与 `template-deck-guide.md` 均提及 `_state/state.yaml`；新 metadata 含指向 `_state` 的 `#` 注释
4. 连续两次 `writeState`，文件仍以 `#` header 开头且 `readState` 正确
5. 无 README 的临时 `_state/`：`writeState` 后出现 README
6. `bundle_layout.mjs --self-check` 通过；`npm test` 绿；`state.mjs` 无对 `bundle_layout` 的 import
7. BUG-005 已归档

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 循环依赖 | D3 单向 import |
| header/README 与 NODE-SPEC 漂移 | 只留字段名 + 指针 |
| init 内联 guide vs template-deck-guide 再漂移 | D11 两处都改进度段；不追求字节级同一生成器 |
| 旧 guide 无新句 | `_writeIfAbsent`；接受（Non-Goal） |
| 有人把 check 加成必检 `_state` | D10 明确禁止本 change 做 |
| init 标 instantiation completed 与「未开 playbook」直觉冲突 | 保持现网 CLI 行为；README 可注明脚手架已完成 instantiation |

## Migration Plan

- 新 bundle：init 即完整
- 旧 bundle：下次 `writeState` 补 header + README；无写入则不动
- Rollback：还原两脚本与文档树；已写 hint 文件可留

## Open Questions

_无（D1–D11 已关闭）。_
