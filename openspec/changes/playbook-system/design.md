## Context

PPTMAKER_FRAMEWORK 的 Agent 执行逻辑目前全在散文文档中. Agent 需从 35KB AGENTS.md 自行推导执行顺序, 没有结构化的进/出条件, 没有持久化的进度跟踪. 这导致三类问题: (1) Agent 跳过 gate 直接跑生产, (2) 前置条件不满足时盲目执行 (如缺 style_master 跑 Stage 2), (3) 中断后无法续跑.

## Goals / Non-Goals

**Goals:**
- 定义 Node 规格宪法: Node 解剖结构、State Schema、Playbook 组织规则
- 创建 5 个 Playbook MD Controller: full-creation, chain-a, chain-b, chain-c, structural
- 定义 run-bundle-state.yaml 作为 MD⇔CLI 共享状态
- 重构 COMMANDS.md 为路由表
- 不做代码逻辑修改——现有脚本已有的功能不变, 只是加 state 写入

**Non-Goals:**
- 不重写任何 .mjs 脚本的管线逻辑
- 不改变 run bundle 目录结构
- 不创建新的 npm 依赖

## Decisions

### 1. Node 解剖结构

每个 node 是一个 MD 片段, 由 frontmatter 和 body 组成:

```yaml
---
node: <kebab-case-name>
playbook: <playbook-name>
phase: <00-05>
requires: [<node-name>, ...]       # 前置 node 必须 completed
optional-deps: [<node-name>, ...]   # 有更好, 没有也可以
produces: [<file-or-gate>, ...]     # 产出物
entry:                             # ENTRY GATE
  - <condition>
  - <condition>
exit:                              # EXIT GATE
  - <condition>
  - <condition>
shared: false                      # true = 可被多个 playbook 引用
---
```

Node body 是 Markdown——Agent 读它执行. 每 step 标注类型: `## Step N — MD` 或 `## Step N — CLI`.

### 2. State Schema: run-bundle-state.yaml

放在 run bundle 根目录 (`deck_<name>/`). 结构与 node frontmatter 对应:

```yaml
# run-bundle-state.yaml
playbook: full-creation
current_node: content-design
started_at: 2026-07-10T14:00:00Z
updated_at: 2026-07-10T14:23:00Z

nodes:
  instantiation:   { status: completed, started: ..., completed: ... }
  hitl1:           { status: completed, decision: proceed }
  setup:           { status: completed }
  seed-topics:     { status: completed, topic_count: 5 }
  wave0:           { status: completed, sources: 12 }
  content-design:  { status: in_progress }
  wave1:           { status: pending }
  wave2:           { status: pending }
  hitl2:           { status: pending }
  readiness:       { status: pending }
  final:           { status: pending }

gates:
  content: pending
  visual:  pending

deck:
  name: my_deck
  type: keynote
  style: dark-executive
```

node status 枚举: `pending → in_progress → completed | skipped | failed`

### 3. Playbook 设计

#### full-creation.md (全量创建, ~11 nodes)

Node 命名沿 DPT 11 phases:

```
instantiation  →  hitl1    →  setup  →  seed-topics
     ↓                                     ↓
wave0  ←───────────────────────────────────┘
  ↓
wave1 → wave2 → hitl2 → readiness → rerun → final
```

每个 node 的 body 不重写方法论——只写"读哪个文件, 跑哪个命令, 怎么验":

```markdown
---
node: wave0
playbook: full-creation
phase: 04
requires: [seed-topics]
produces: wave0-artifacts, foundation-sources
entry:
  - run_bundle_exists
  - seed_topics_complete
exit:
  - wave0_sources_collected
  - wave0_evidence_indexed
---
# wave0: Foundation Shared Reference

## Step 1 — MD
读 workflow/02-content/04-create-content-assets.md
为每个 topic 收集 foundation source metadata (source, key claim, extract)

## Step 2 — CLI
node scripts/unified_pipeline.mjs --run-dir <dir> --stage 1

## Step 3 — Gate
人工审查 wave0 收集的 source, 确认齐全. 更新 state: node wave0 → completed
```

#### chain-a/b/c/structural (迭代, ~2-5 nodes each)

这些 playbook 更短, 但同样有 entry gate (检查要改的东西存在) 和 exit gate (验证结果).

### 4. COMMANDS.md 重构

从速查表变路由表:

```markdown
| 用户说 | Playbook | 入口参数 |
|--------|----------|---------|
| "帮我做一个PPT" | full-creation | — |
| "第5页标题改一下" | chain-a | slide=5, field=title |
| "换个配色" | chain-b | scope=all, pilot=true |
| "备注改一下" | chain-c | — |
| "加一页案例" | structural | action=add, position=end |
```

### 5. State 的读写

- **MD 侧** (Agent): 读 state 判断当前 node 和进度. 写 state 标记 node 完成/gate 通过
- **CLI 侧** (.mjs 脚本): 读 state 验证 entry 条件. 写 state 记录产出物路径和执行时间
- **格式**: YAML——人可读, .mjs 用 `js-yaml` 或手写 parser (轻量)
- **位置**: `deck_<name>/run-bundle-state.yaml`

### 6. shared node 机制

有些 node 被多个 playbook 引用. frontmatter 设 `shared: true`:

```yaml
---
node: classify-change
shared: true
---
```
playbook 引用 shared node 时不复制, 而是 `includes: [classify-change]`.

## Risks / Trade-offs

**[R] State 文件写入竞争** — MD 和 CLI 可能同时写 state
→ 写操作只更新自己负责的字段 (node status 和 gates). Agent 写之前先读最新 state

**[R] Agent 不读 state 直接跳到后面 node**
→ entry gate 显式检查前一个 node 的 status. 如果 `requires` 的 node 不是 completed, Agent 被指示先完成它

**[R] Node 数量过多让 playbook 膨胀**
→ shared node 复用. 迭代 playbook (chain-a/b/c) 只定义差异 node, 公共 node 走 include
