## Context

触发（CLS-001）：迁移已完成 deck 时 agent 静默长跑、不 show 视觉，直到 PPTX 才暴露。

| 已有（Change 1） | 仍缺 |
|------------------|------|
| §11 交互节律 + BOOTSTRAP show | 旁路流程无 playbook |
| `iterate-style` / `quick-preview` | 「把旧东西迁进宪法树」无结构化节点 |
| `create-deck` 全量闸门 | 迁移被误当成「已经做过了 → 可跳过 show」 |

本 change = **Change 2** `guard-offpath-migrate-import-ux`。  
依赖：Change 1 已 apply（铁律 + 探索入口可用）；archive/sync 可并行，不阻塞本 change 的 MD 落地。

旧布局线索（version-log）：扁平 `v{n}/`、`_build/`→`_generated/`、style 目录探测——方法论只**指导人工/agent 映射**，不写自动迁移器。

## Goals / Non-Goals

**Goals:**

1. 用户说「迁移/导入已有 deck」有唯一 playbook，不即兴裸奔
2. 迁移路径强制：早期可见赢、长任务心跳、gate 前 show、禁止「已做过就跳过呈现」
3. 与 `create-deck` / `iterate-style` / `quick-preview` 边界清晰；可 handoff
4. 零 CLI 代码

**Non-Goals:**

- 自动 `mv` 旧树到新树的脚本
- 支持任意非 deck 仓库结构（只覆盖「已有 PPT/deck 资产 → 本框架 run bundle」）
- 修改 Stage 2/pilot 执法逻辑
- 重写 §11

## Decisions

### D1 — 产物形态：方法论页 + 一个 playbook + COMMANDS

与 Change 1 同模式：协议已在 CONTRACT；本 change 只补 **off-path 实例**。

### D2 — Playbook 名：`migrate-import`

覆盖「迁移旧 bundle / 导入已有素材进宪法树」。不叫 `migrate` 以免像纯数据迁移工具。

### D3 — 节点链（强制节律）

```
intake-source → align-bundle → inventory-map → early-show → reaffirm-gates → handoff
```

| Node | 必须遵守的节律 |
|------|----------------|
| `intake-source` | 2–3 种迁法候选 + 推荐（recognition）；确认源路径与目标 `deck_*` |
| `align-bundle` | `init` 或 `--check --structure-only`；心跳：告诉用户在对齐结构 |
| `inventory-map` | 盘点→映射表给用户认；禁止静默搬完再汇报；大任务分段 checkpoint |
| `early-show` | **第一步可见赢**：有 `style_master.jpg`/样张则 **open**；否则降级 show（prompt/结构树/旧 PPTX 页） |
| `reaffirm-gates` | 即使「内容以前做过」也要重申 content/visual：有图则 open，再 `approve` 双写；不满意 → `iterate-style` |
| `handoff` | 建议 `quick-preview` 或 `build`；禁止未 show 就开长 Stage 2 |

### D4 — 与其它 playbook 边界

| 意图 | 走 |
|------|-----|
| 从零做 PPT | `create-deck` |
| 只打磨视觉 / 3 页预览 | `iterate-style` / `quick-preview` |
| 已有资产要进本框架树 | **`migrate-import`** |
| 已有 PPTX 上改字/图 | `edit-*`（迁移完成且 gates 后） |

迁移中途需要大改视觉 → `switchPlaybook(iterate-style)`，完后 resume。

### D5 — 方法论页路径

`PPTMAKER_FRAMEWORK/workflow/00-setup/04-migrate-import-existing-deck.md`

内容：触发语、节点摘要、旧→新路径对照（引用 version-log）、**禁止清单**（静默长跑、只描述不 open、跳过 gate、手改 `_generated/`）、完成后指针。

`workflow/00-setup/README.md` 加一行索引。

### D6 — BOOTSTRAP 指针

在入口或「已知限制」附近加短句：已有 deck/素材迁入 → 读 COMMANDS「旁路 / 迁移」→ `migrate-import`；不要当成可以跳过 show 的特殊通道。

### D7 — Spec

只改 `playbook-execution`：

- 注册 MD Controllers：**八**个 + `classify-change`（九文件）
- COMMANDS 增加旁路段
- ADDED：off-path migrate playbook 须含 early-show + reaffirm-gates

Change 1 若尚未 archive，本 delta 以 **apply 后的真实目录（已含 iterate/quick）** 为基数写「八个控制器」。

### D8 — Copy Deck（apply 照抄）

#### D8.1 — COMMANDS 段

```markdown
## 旁路 / 迁移

> 已有 deck、旧布局、或外部素材要迁进本框架宪法树——**不是**从零 `create-deck`，也**不能**跳过 show/gate。
> 全程遵守 AGENT_CONTRACT §11。

| 用户说 | Playbook | 说明 |
|--------|----------|------|
| "把已有的 deck 迁到新框架" | `migrate-import` | 对齐目录 + 早期 show + 重申闸门 |
| "导入以前的 PPT/素材进这个项目" | `migrate-import` | 同上 |
| "旧版 run bundle 要升到三层结构" | `migrate-import` | 映射旧路径；禁止静默裸奔 |
```

#### D8.2 — `migrate-import.md` 骨架要点

Frontmatter：`playbook: migrate-import`；`description: 旁路——迁移/导入已有 deck（强制 show + 闸门）`；`includes: []`。

各 node 的 Step 必须写明：open / checkpoint / 禁止静默。`reaffirm-gates` LOCK 双写与 Change 1 D13.2 相同（`approve` + `_state` setGate）。

`early-show` 失败条件：有可展示图却只文字描述 → 不得标 completed。

#### D8.3 — 方法论页必备小节

1. 何时用 / 何时不用  
2. 与 create-deck / edit-* / 探索 playbook 边界  
3. 节点与 §11 对照表  
4. 旧路径 → 新路径（`2_backbone/visual-style/`、`3_versions/v1/`、`_generated/`）  
5. 禁止清单  
6. 完成后建议 `quick-preview`

### D9 — Acceptance

1. `migrate-import.md` + 方法论页存在；COMMANDS 可路由到  
2. Playbook 含 early-show + reaffirm-gates + 心跳要求  
3. BOOTSTRAP 有旁路指针  
4. 零 CLI diff  
5. playbook-execution delta 与实现一致  

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 迁法太多 playbook 写不完 | intake 只给 2–3 候选策略；细节放方法论 |
| 用户以为迁移可跳过 gate | reaffirm-gates 强制；COMMANDS 文案写明 |
| 与 Change 1 未 archive 的 spec 基数混乱 | D7：以磁盘真实 playbook 列表为准 |
| 想做自动迁移器 scope 膨胀 | Non-Goal；方法论只指导 |

## Migration Plan

纯文档。Rollback = 删 playbook/方法论 + 还原 COMMANDS/BOOTSTRAP。

## Open Questions

_无（D1–D9 已关闭）。_
