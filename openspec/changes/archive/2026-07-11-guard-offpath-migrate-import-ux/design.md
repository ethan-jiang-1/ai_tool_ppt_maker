## Context

触发（CLS-001）：迁移已完成 deck 时 agent 静默长跑、不 show 视觉，直到 PPTX 才暴露。

| 已有（Change 1 · 已 archive） | 仍缺 |
|------------------------------|------|
| §11 交互节律 + BOOTSTRAP show | 旁路无 playbook |
| `iterate-style` / `quick-preview` | 「旧资产 → 宪法树」无结构化节点 |
| `create-deck` 全量闸门 | 「已经做过了 → 可跳过 show」误解 |

本 change = **Change 2** `guard-offpath-migrate-import-ux`（当前唯一活跃 change）。  
主 spec 基数：Change 1 已 sync → 七控制器 + classify；本 change 加到**八控制器 + classify**。

旧布局线索（`reference/version-log.md`）：扁平 `v{n}/`、`_build/`→`_generated/`——方法论只指导映射，**不写自动迁移器**。

## Goals / Non-Goals

**Goals:**

1. 「迁移/导入已有 deck」有唯一 playbook，禁止即兴裸奔
2. 强制：早期可见赢、长任务心跳、gate 前 show（视觉 **与** 内容）、禁止「已做过就跳过」
3. 与 `create-deck` / 探索 / `edit-*` 边界清晰；可 handoff / `switchPlaybook`
4. 零 CLI 代码；apply 按 Copy Deck 照抄

**Non-Goals:**

- 自动 `mv` 旧树脚本
- 任意非 deck 仓库结构
- 改 Stage 2/pilot 执法
- 重写 §11

## Decisions

### D1 — 产物：方法论 + playbook + COMMANDS + BOOTSTRAP 指针

协议已在 CONTRACT；本 change 只补 off-path **实例**。

### D2 — 名：`migrate-import`

覆盖「旧 bundle 升级 / 外部素材导入宪法树」。

### D3 — 节点链

```
intake-source → align-bundle → inventory-map → early-show → reaffirm-gates → handoff
```

| Node | 节律硬要求 |
|------|------------|
| `intake-source` | 给出 **D4 三种迁法** 候选 + 推荐；确认源路径与目标 `deck_*` |
| `align-bundle` | `init` 或 `check --structure-only`；向用户报心跳 |
| `inventory-map` | 先出映射表让用户**认**，再搬；分段 checkpoint；禁止搬完才汇报 |
| `early-show` | **必须** open 至少一样：优先目标或源侧 `style_master.jpg`/样张；否则降级（prompt / 结构树 / 旧 PPT 页预览） |
| `reaffirm-gates` | content：**open** `slide-specifications.md`（或大纲）再谈批；visual：**open** 图再 `approve` 双写；可切 `iterate-style` |
| `handoff` | 建议 `quick-preview` 或 `build`；禁止未 show/未心跳就开长 Stage 2 |

### D4 — 三种迁法（intake 候选，recognition ≫ recall）

| 代号 | 策略 | 适用 |
|------|------|------|
| **A 新 init + 迁入** | `ppt_flow init deck_NEW …`，再把源资产拷/映射进新树 | 源很乱、或非 `deck_*` 命名 |
| **B 原地升三层** | 已有 `deck_*`，按 version-log 把扁平/`_build` 映射到 `2_backbone` + `3_versions/v1` + `_generated` | 旧框架 run bundle |
| **C 素材导入** | 只有 PPTX/图/markdown 碎片 → init 后填 `1_upstream` + 再走内容/视觉 | 无完整旧 bundle |

Agent **必须**列出 A/B/C + 推荐 + 为什么，让用户选；不得默认闷头选一种。

### D5 — 与其它 playbook 边界

| 意图 | 走 |
|------|-----|
| 从零做 | `create-deck` |
| 打磨视觉 / 3 页预览 | `iterate-style` / `quick-preview` |
| 已有资产进宪法树 | **`migrate-import`** |
| 已交付 PPTX 上改 | `edit-*`（迁移完成且 gates 后） |

中途大改视觉 → `switchPlaybook(iterate-style)` → `resumePlaybook`。

### D6 — 方法论路径

**`workflow/00-setup/05-migrate-import-existing-deck.md`**（勿用 `04-`，已有 `04-conventions.md`）。  
`00-setup/README.md` 核心文档表加一行。

### D7 — Spec 基数（Change 1 已 archive）

只改 `playbook-execution`：八 MD Controllers + `classify-change`；COMMANDS 旁路；ADDED migrate 要求。  
archive 时更新 Purpose。

### D8 — BOOTSTRAP

在「你的角色」或「铁律」附近加短段（见 D10.4 原文）。

### D9 — Acceptance

1. playbook + `05-…` 方法论 + COMMANDS 路由  
2. 含 early-show、reaffirm（content+visual show）、心跳、D4 三选  
3. BOOTSTRAP 指针  
4. 零 CLI diff；Copy Deck 一致  
5. delta 与实现一致  

### D10 — Copy Deck（apply 照抄）

#### D10.1 — COMMANDS「旁路 / 迁移」

插在「探索 & 预览」与「迭代打磨」之间：

```markdown
## 旁路 / 迁移

> 已有 deck、旧布局、或外部素材要迁进本框架宪法树——**不是**从零 `create-deck`，也**不能**跳过 show/gate。
> 全程遵守 AGENT_CONTRACT §11。迁法在 playbook 里以 A/B/C 候选让用户认。

| 用户说 | Playbook | 说明 |
|--------|----------|------|
| "把已有的 deck 迁到新框架" | `migrate-import` | 对齐目录 + 早期 show + 重申闸门 |
| "导入以前的 PPT/素材进这个项目" | `migrate-import` | 同上 |
| "旧版 run bundle 要升到三层结构" | `migrate-import` | 映射旧路径；禁止静默裸奔 |
```

#### D10.2 — `migrate-import.md`（版式对齐 `iterate-style.md`）

```markdown
---
playbook: migrate-import
description: 旁路——迁移/导入已有 deck（强制 show + 闸门）
includes: []
---

# Playbook: 旁路 — 迁移 / 导入

> 把已有资产迁进宪法树。禁止静默长跑、禁止只描述不 open、禁止「以前做过了」就跳过 gate。
> 方法论：`workflow/00-setup/05-migrate-import-existing-deck.md`。
> §11 全程有效。

## Nodes

### intake-source
→ 定源、目标、迁法

```yaml
node: intake-source
phase: 00
requires: []
produces: [migration_plan]
entry: []
exit: [strategy_chosen]
```

**Step 1 — MD**: 确认源路径与目标 `deck_*` 名。
**Step 2 — MD**: 给出迁法 **A / B / C**（见 D4）+ 推荐 + 理由；用户选。
**Step 3 — MD**: 写清成功标准（结构对齐、early-show 完成、gates 重申）。

### align-bundle
→ 对齐/校验宪法树

```yaml
node: align-bundle
phase: 00
requires: [intake-source]
produces: [run_bundle_aligned]
entry: [strategy_chosen]
exit: [structure_ok]
```

**Step 1 — MD**: 心跳——告知用户正在对齐结构。
**Step 2 — CLI**: 策略 A/C → `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs init deck_<NAME> --deck-type … --style …`；策略 B → `node PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs --check <run-dir> --structure-only`。缺目录按宪法补，不自创结构。

### inventory-map
→ 盘点与映射

```yaml
node: inventory-map
phase: 00
requires: [align-bundle]
produces: [asset_map]
entry: [structure_ok]
exit: [assets_mapped]
```

**Step 1 — MD**: 列出源资产 → 目标路径映射表（旧 `style/`→`2_backbone/visual-style/`；slide 源→`3_versions/v1/slide-specifications.md`；`_build`→`_generated` 等）。
**Step 2 — MD**: 用户确认映射后再搬；每完成一类资产 checkpoint 一次。禁止静默搬完再汇报。
**Step 3 — MD**: 提醒：绝不手改 `_generated/` 当源。

### early-show
→ 第一步看得见的赢

```yaml
node: early-show
phase: 00
requires: [inventory-map]
produces: [first_visible_win]
entry: [assets_mapped]
exit: [user_saw_artifact]
```

**Step 1 — MD**: 若存在 `style_master.jpg`（目标或源）或样张 → **必须 open**。
**Step 2 — MD**: 否则降级 show：open `2_backbone/visual-style/style-master-prompt.md` / 展示 `bundle_layout` 树 / 打开旧 PPT 首页（环境允许时）。
**Step 3 — Gate**: 有可展示图却只文字描述 → **不得** completed。

### reaffirm-gates
→ 重申 content + visual

```yaml
node: reaffirm-gates
phase: 00
requires: [early-show]
produces: [gates_reaffirmed]
entry: [user_saw_artifact]
exit: [gates_ok]
```

**Step 1 — MD**: content——**open** `3_versions/v1/slide-specifications.md`（或等价大纲）；用户认方向。
**Step 2 — MD**: visual——**open** `2_backbone/visual-style/style_master.jpg`（若无则说明并建议 `iterate-style`）。
**Step 3 — CLI/State**: 用户满意 → `ppt_flow.mjs approve <run-dir> content` 与/或 `visual`，并 `setGate` + `writeState`（双写）。
**Step 4 — MD**: 视觉不满意 → `switchPlaybook(iterate-style)`；回来后 `resumePlaybook`。

### handoff
→ 下一步

```yaml
node: handoff
phase: 00
requires: [reaffirm-gates]
produces: [next_action]
entry: [gates_ok]
exit: [handed_off]
```

**Step 1 — MD**: 推荐 `quick-preview`（gates 已批）或说明何时 `build`。
**Step 2 — MD**: 若用户要全量生图：先说明耗时与 checkpoint 计划；禁止静默开长 Stage 2。
```

#### D10.3 — 方法论页 `05-migrate-import-existing-deck.md` 大纲

1. 何时用 / 何时不用（vs create-deck / edit-*）  
2. A/B/C 迁法表（同 D4）  
3. 六节点与 §11 对照  
4. 旧→新路径（引用 version-log v1.1→v1.2）  
5. 禁止清单：静默长跑；只描述不 open；跳过 gate；手改 `_generated/`；当 create-deck 重做却不 show  
6. 完成后：`quick-preview` → `build`  

#### D10.4 — BOOTSTRAP 可贴句

```markdown
### 已有 deck / 素材要迁入？

不要当「特殊通道」跳过 show 与闸门。走 [COMMANDS.md](COMMANDS.md)「旁路 / 迁移」→ playbook `migrate-import`（方法论：`workflow/00-setup/05-migrate-import-existing-deck.md`）。全程遵守 AGENT_CONTRACT §11。
```

放在「你的角色」之后或「正式构建」之前。

#### D10.5 — README 索引行

| `05-migrate-import-existing-deck.md` | 旁路：迁移/导入已有 deck（强制 show + 闸门） | 8 min |

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 迁法爆炸 | 锁死 A/B/C |
| 以为可跳过 gate | reaffirm + COMMANDS 文案 |
| 文件名撞 `04-conventions` | 用 `05-` |
| 自动迁移器诱惑 | Non-Goal |
| early-show 无图 | 降级 show 写死 |

## Migration Plan

纯文档。Rollback = 删新文件 + 还原 COMMANDS/BOOTSTRAP/README。

## Open Questions

_无（D1–D10 已关闭）。_
