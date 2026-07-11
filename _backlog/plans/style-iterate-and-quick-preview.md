# Plan: COMMANDS.md 缺两个探索型入口 — 视觉打磨 + 3页快览

> 类型: 设计 | 更新: 2026-07-11

## 背景 / 现状

`COMMANDS.md` 当前覆盖了 5 个 playbook，分两类：

| 类别 | Playbook | 场景 |
|------|----------|------|
| 全量创建 | `create-deck` | "帮我做一个PPT" |
| 迭代打磨 | `edit-text`, `edit-visual`, `edit-notes`, `restructure-slides` | 已有 PPTX 之后的修改 |

**缺少一整类："探索/实验"——还没到全量生产、也不是已有 PPTX 的修改，而是 pre-commitment 的轻量试探。**

具体缺两个入口：

1. **视觉方向打磨**：用户刚开一个 deck，想在 Phase 2 反复迭代 style master，直到视觉方向满意才锁定。当前 `create-deck` 的 `setup` node 是单次 generate → review → lock，实际迭代靠 agent 手动改 prompt 重跑 CLI，没有结构化 loop，state 也不追踪迭代轮次。

2. **3 页快览**：用户内容已经有了（slide-specifications.md 填写完毕），想在跑全量之前先出 3 张典型页看看效果。`ppt_flow.mjs pilot` **技术上完全能做这件事**（auto-select opener/body/closer → Stage 1+2 → contact sheet），但 COMMANDS.md 没有把这个能力暴露给用户。

两者在 `ppt_flow.mjs` 都有 CLI 支撑（`style-master` 命令 / `pilot` 命令），缺的是**用户意图 → CLI 命令之间的 playbook 层**。

## 决策 / 方案

### 方案 A：两个新 playbook（推荐）

#### A1. `iterate-style` playbook — 视觉方向打磨

独立 playbook，可被 `create-deck` 的 `setup` node 通过 `includes` 引用，也可单独入口（"我想先定视觉方向"）。

**Node 结构（4 nodes + loop）：**

```
start-iterate → tweak-prompt → generate → review-gate
                                      ↑          │
                                      └── RETRY ──┘
                                          LOCK → exit
```

| Node | 类型 | 做什么 |
|------|------|--------|
| `start-iterate` | MD | 读当前 `style-master-prompt.md` + `style_master.jpg`（若有）。若尚无 prompt，从 preset README 播种。确认迭代目标（用户最不满意的 1-3 个维度） |
| `tweak-prompt` | MD | Agent 按用户反馈改 `style-master-prompt.md`。大改动 → 先存 rejected 版到 `1_upstream_raw_material/style-master-iterations/`（方法论已有这个约定） |
| `generate` | CLI | `ppt_flow.mjs style-master <run-dir> --force --resolution 1k`（迭代用 1k 省时间，final lock 才升 2k） |
| `review-gate` | Gate | 用户看 `style_master.jpg`。三个出口：LOCK（满意，更新 state `visual_gate: approved`） / RETRY（回 `tweak-prompt`） / BACK（不满意方向，回 Phase 2.1 重选 medium/preset） |

**关键设计决定：**
- **迭代轮次记入 state**：`state.nodes.iterate_style.round = N`，方便 agent 判断是否陷入无限循环
- **1k first, 2k on lock**：迭代期间用 1k 分辨率省 API 费用和时间，用户 LOCK 后自动升到 `--resolution 2k` 跑最后一次
- **复用现有资产**：CLI 仍走 `generate_style_master.mjs`；review checklist 引用 `04-iterate-review-lock.md`；历史版存 `style-master-iterations/`（约定已存在于方法论）
- **无需新 CLI 代码**：`ppt_flow.mjs style-master` 已经够用。唯一可能需要的是 `ppt_flow.mjs` 里加一个 `--resolution` 默认值区分（迭代默认 1k，但这是 playbook 层的约定，不是 CLI 改动）

#### A2. `quick-preview` playbook — 3 页快览

轻量 playbook，内容就绪后、全量生产前的最后一道预览。

**Node 结构（3 nodes）：**

```
validate-ready → pilot-generate → review-preview
```

| Node | 类型 | 做什么 |
|------|------|--------|
| `validate-ready` | CLI | `ppt_flow.mjs validate <run-dir>` — 确认 slide-specs L3 齐全、style master 就位、gate approved |
| `pilot-generate` | CLI | `ppt_flow.mjs pilot <run-dir> [--count 3]` — 自动选 3 页代表页，Stage 1+2+3 pilot，产出 contact sheet |
| `review-preview` | Gate | 用户看 `pilot_final_contact_sheet.jpg`。三个出口：PROCEED（进全量 build） / RETRY（调某页 prompt 后重跑 pilot） / BACK（回 Phase 1/2 改内容/视觉方向） |

**关键设计决定：**
- **复用现有 `pilot` 命令 100%**——这个 playbook 本质上是给 `ppt_flow.mjs pilot` 包了一层 MD 引导
- **pilot 已做的事**：auto-select 3 slides (opener/body/closer)、run Stage 1、Stage 2 `--only`、render headers、contact sheet
- **pilot 不做的事**：不生成 PPTX（contact sheet 足够预览）。如果用户想要 3 页 PPTX，那是另一个需求（需改 Stage 3/4 支持 partial deck——当前架构不支持，也先不做）

### 方案 B：只更新 COMMANDS.md 路由表（更轻）

不加新 playbook，只在 COMMANDS.md 加两条路由，把意图直接映射到现有命令：

| 用户说 | 路由到 |
|--------|--------|
| "反复打磨视觉风格" | `edit-visual` playbook，scope=direction |
| "先出 3 页看看效果" | `ppt_flow.mjs pilot <run-dir>`（直接跑命令） |

**不推荐**：`edit-visual` 的语义是"已有 PPTX 的视觉修改"，强行用于 pre-production 视觉探索会混淆概念，agent 也容易跑错 node。

### 推荐：方案 A

理由：
- 两个场景确实需要结构化引导（尤其是 style-iterate 的 loop），不是一句 CLI 能解决的
- playbook 是轻量的——每个 30-50 行 markdown，核心逻辑已在 CLI 里
- 把"探索"提升为一等公民，而不是塞进"全量创建"或"迭代修改"的夹缝里
- 不改任何 CLI 代码——风险极低

## COMMANDS.md 更新

在"全量创建"和"迭代打磨"之间插入新段落：

```markdown
## 探索 & 预览

| 用户说 | Playbook | 说明 |
|--------|----------|------|
| "先定视觉方向，反复打磨 style master" | `iterate-style` | 4-node loop，1k 快迭代 → LOCK 升 2k |
| "视觉风格不满意，再调一版" | `iterate-style` | 从 review-gate 的 RETRY 进入 |
| "内容有了，先出 3 页典型页看看效果" | `quick-preview` | 自动选 opener/body/closer，出 contact sheet |
| "先预览一下再决定要不要全量" | `quick-preview` | pilot → review → PROCEED 进 build |
```

## 风险 / 取舍

| 风险 | 缓解 |
|------|------|
| `iterate-style` 的 loop 可能无限循环（用户永远不满意） | state 记 `round`，agent 在 round≥5 时主动建议：换 medium 方向、换 preset、或接受当前版 |
| `quick-preview` 的 contact sheet 不够直观（用户想要真 PPTX） | 明确告知用户这是 contact sheet，不是 PPTX。如果反馈强烈再考虑 partial PPTX（那是 Stage 3/4 的架构改动，不在本 plan 范围） |
| 两个新 playbook 增加了 agent 的选择负担 | 意图区分足够清晰：一个是"视觉还没定"，一个是"内容定了想看效果"。不会混淆 |
| `iterate-style` 依赖 agent 改 prompt 的质量 | agent 已有 `04-iterate-review-lock.md` 的 30+ 项 checklist 做参考；playbook 的 `tweak-prompt` node 会引用它 |

## 技术基础（已有资产，不需改动）

两个 playbook 依赖以下已有能力，**均不需改动**：

| 能力 | 位置 | 说明 |
|------|------|------|
| Style master 生成 | `ppt_flow.mjs style-master` → `generate_style_master.mjs` | 不检查 gate（只检查 bundle 结构），pre-gate 可跑 |
| Pilot 3 页预览 | `ppt_flow.mjs pilot` → `unified_pipeline.mjs --stage 1,2 --only` | 自动选 opener/body/closer，出 contact sheet。**检查 gate**（content_gate + visual_gate 必须 approved）——这对 `quick-preview` 是正确的（用户场景是"内容都有了"） |
| Playbook 栈 | `state.mjs` 的 `switchPlaybook()` / `resumePlaybook()` | 支持 mid-flow 切换到新 playbook 再恢复，`iterate-style` 可在 `create-deck` 的 `setup` node 中通过栈切换进入 |
| Shared node 复用 | `includes: [classify-change]` 模式 | 已有 4 个 playbook 共用 `classify-change.md`，新 playbook 可用同样模式 |
| State extra 字段 | `setNodeStatus(state, name, status, extra)` | `iterate-style` 的 `round` 计数直接存在 node extra 里，不需改 schema |
| 迭代历史 | `04-iterate-review-lock.md` + `1_upstream_raw_material/style-master-iterations/` | 已有方法论指导和历史版存放约定 |

## 落地关联

> **2026-07-11 定名（与 `agent-interaction-protocol` 对齐）**

本 plan **不再单独开 change**。探索 playbook 并入协议主 change：

| # | OpenSpec change 名 | 本 plan 贡献什么 |
|---|-------------------|----------------|
| **Change 1** | **`add-interaction-rhythm-and-explore-playbooks`** | 全部：`iterate-style` + `quick-preview` + COMMANDS「探索 & 预览」+ `playbook-execution` spec（放宽 exactly-six）；并与协议铁律 / BOOTSTRAP `open` 同 change 落地 |
| **Change 2** | **`guard-offpath-migrate-import-ux`** | **不含**本 plan（旁路迁移护栏，属协议 plan） |

Change 1 内本 plan 原清单仍成立：

1. 新建 `playbook/iterate-style.md`（~60 行）
2. 新建 `playbook/quick-preview.md`（~40 行）
3. 更新 `COMMANDS.md`（+15 行表格）
4. 更新 `openspec/specs/playbook-execution/spec.md`（放松"exactly six files" → 含探索 playbook）
5. **不改 CLI**；`round` 走 `setNodeStatus` extra，不改 state schema

Change 1 归档后本 plan → `_done/_closed_plans/`。
