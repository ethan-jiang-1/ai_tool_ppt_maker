# Plan: Agent Interaction Protocol — 让"小白也能和强 AI 一起把事做对"成为一等设计

> 类型: 设计 | 更新: 2026-07-11

## 背景 / 现状

触发：一次"迁移已完成 deck"的会话体验割裂——agent 闷头长跑（一个子 agent 静默 13 分钟）、全程只用文字描述、直到"要出 PPTX"用户才发现自己**从没看过任何视觉**。用户把反馈上升到原理层：这是一个**"交互前进、边做边收集需求、双向建立信心"**的过程，尤其**第一次 UX 不能没有反馈**。

现状判断（回答"是微调还是 bug"）：
- **框架方法论已经写了这套哲学**（BOOTSTRAP：用户做选择题 / 2-3 候选 / 闸门不可跳 / Medium before color / pilot 先看再 build）→ **不是设计缺失**。
- 缺的是三类洞：协议未固化成硬规则、off-path 流程无护栏、bug 拖垮反馈仪器（见"根因"）。
- **结论：微调 + 修 bug，不是重写。**

## 核心视角：小白 × 陌生的强 AI × 要把事做对

真正要 enable 的，是处在**三重不对称**里的小白用户：

| 不对称 | 小白的处境 | 协议要做的 |
|--------|-----------|-----------|
| **信息** | 不知道该给 AI 什么、给多少 | AI 主动**产出具体候选让用户"认"**，而不是问抽象问题让用户"想"（**recognition ≫ recall**） |
| **能力** | 不知道 AI 能干什么——不知道就不会开口要 | 用**小步实物**证明能力（show, don't claim）；在**该用到时**顺带亮"我还能做 X"（渐进披露） |
| **信任** | 陌生、冷启动，还不敢托付 | 信任靠**一串小而可验证的正确步子**攒出来；早期小步低风险易纠偏，对齐后再放长步 |

一句话：**AI 扛"把事做对"的责任，小白只需要「认 / 纠」。** 用户不该被迫懂术语、也不该被迫先想清楚——他是**对着 AI 给他看的东西**一点点把需求勾出来的。

## 根因（三类洞，均非地基）

1. **协议未固化成硬规则**：框架只说"**描述**候选 / 告诉推荐"，从没说"必须把**真实视觉** `open` 给用户看"（show ≠ tell）；没有"长任务不许失联、要给可见 checkpoint"；没有"早期小步、对齐后放长步"的信心校准模型。
2. **off-path 流程无护栏**：`create-deck` 有完整 UX 闸门，但**"迁移/导入"这类流程没有方法论页**，agent 即兴发挥就跳过了"呈现视觉 / checkpoint"。（本次迁移即是。）
3. **bug 拖垮反馈仪器**：BUG-003/004（`ppt_flow` 崩 → doctor/status 死，**已修复**）、BUG-006（env-check 误报 NOT READY，**已修复** / `fix-env-check-deps-walkup`）。反馈仪器不可靠时，协议再好也传不出去。

## 设计原则（8 条 · AGENT_CONTRACT 铁律候选）

1. **产出可"认"的东西，别出考题。** 每步给 2-3 个具体候选 + 我的推荐 + 为什么；用户挑/改，不让他从零生成。
2. **Show, don't tell。** 视觉、样张一律 `open`/渲染给用户看——描述不能替代看见。
3. **默认 + 可逆。** 永远给合理默认（"拿不准我先按 X，随时可改"），小白不因"不知道"卡住；早期一切廉价可重来。
4. **在相关时刻亮能力。** 用到某能力时顺带说"我还能做 X，要不要"——小白无法索取自己不知道存在的东西。
5. **长任务给心跳。** 绝不静默长跑；对小白，沉默 = 坏了 / 走丢了。要有可见 checkpoint。
6. **信心校准步长。** 早期小步、多确认、低风险；对齐 / 信任涨上来，步子放长、少打断。步长是**变量**不是常量。
7. **每个 checkpoint 都指向"对不对"。** 明确把每次停顿框成"我们还指着正确的方向吗"，让循环的目的 = 收敛到正确。
8. **第一步先给一个看得见的赢。** 首次交互就产出一个用户能快速判断的实物，证明"这东西懂我"。

## 方案（分层落地，走 OpenSpec）

**P0 — 协议固化（doc · 核心）**
- `charter/AGENT_CONTRACT.md` 增一条铁律「**交互节律**」，把上面 8 条压成最短可执行规则（重点：show-don't-tell、长任务心跳、信心校准步长、recognition ≫ recall）。
- `BOOTSTRAP.md` 把"呈现视觉"从隐含变显式：**每个 gate 前必须 `open` 实物**（style_master、pilot contact sheet），而非仅"描述"。

**P1 — 覆盖 off-path 流程**
- 新增 `migrate/import` 方法论页 + playbook 骨架，套用同样的 gate + show 节律（杜绝本次的"迁移就裸奔"）。
- **纳入既有 `style-iterate-and-quick-preview`**：它的 `iterate-style`（视觉 loop）+ `quick-preview`（3 页 pilot）正是本协议在"视觉 / 预览"上的**具体实例**——不重复，直接作为 P0 的第一批落地样板。

**P2 — 修反馈仪器（bug）**
- 003/004 已修；确保 **BUG-006** 进修复队列。

## 风险 / 取舍

| 风险 | 缓解 |
|------|------|
| 协议太重，每步都停 → 拖慢 | 靠"信心校准步长"：只有早期 / 未对齐才高频；对齐后自动放长。步长是变量 |
| pre-key 时无图可 show | 降级 show：preset 缩略图、母版 prompt、结构草图；有 key 后立刻升级真图 |
| 8 条塞进铁律 → AGENT_CONTRACT 膨胀 | 铁律只放最短可执行版；完整原理留本 plan + workflow 方法论页 |
| 与既有 preview plan 重叠 | 明确从属：本 plan = 原理 / 协议；preview plan = 具体实例（落地时后者是前者第一批 change） |

## 落地关联

> **2026-07-11 定名（与 `style-iterate-and-quick-preview` 对齐）**

| # | OpenSpec change 名 | 范围 | 状态 |
|---|-------------------|------|------|
| **Change 1** | **`add-interaction-rhythm-and-explore-playbooks`** | 协议铁律 + BOOTSTRAP 显式 `open` + `iterate-style` / `quick-preview` + COMMANDS「探索」+ 对应 specs | 待 propose |
| **Change 2** | **`guard-offpath-migrate-import-ux`** | **目的**：旁路「迁移/导入」今天无方法论 → agent 即兴跳过呈现与 checkpoint。补方法论页 + playbook，强制同一套 gate + show，禁止裸奔 | Change 1 之后；待设计细化 |

说明：

1. Change 1 = 本 plan 的 **P0** + preview plan 的全部实例（探索 playbook）。**不**含 migrate。
2. Change 2 = 本 plan 原 **P1 的 migrate 部分**；preview 不再单独成 change。
3. **P2（BUG-006）已修完归档**（`fix-env-check-deps-walkup`），本 plan 不再跟踪。
4. 多为 doc / playbook markdown，零或极少 CLI。Change 1 落地后：本 plan + `style-iterate-and-quick-preview` 一并 `git mv` → `_done/_closed_plans/`（migrate 若尚未做，可在关闭本 plan 时把 Change 2 指针留在 `_closed_plans` 卡片或另开短 plan）。
