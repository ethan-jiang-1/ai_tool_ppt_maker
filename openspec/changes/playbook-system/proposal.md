## Why

PPTMAKER_FRAMEWORK 当前所有 Agent 执行逻辑散落在散文文档中——35KB `AGENTS.md` 是唯一的手册, Agent 必须从中自行推导"我现在该做什么". 这导致三类严重问题:

1. **幻觉**: Agent 跳过 Phase gate 直接跑生产管线; 在 `style_master.jpg` 还没生成时就执行 Stage 2; 忘记在 `project-metadata.yaml` 中标记 gate 状态
2. **不可续**: 执行被中断 (对话结束、上下文溢出) 后, Agent 不知道自己做到哪了——进度全在它的"记忆"里, 没有落盘. 下一个 session 的 Agent 从零开始, 重复工作
3. **质量不可审**: 没有结构化的 entry/exit criteria. "这个 Phase 算完成了"的判断标准是人审, 但 Agent 经常不等人审就推进

根本原因: **参考文档不等于执行控制器**. Agent 需要的是结构化的"剧本"——每一步有明确的进场条件 (缺什么?)、执行步骤 (读哪个文件? 跑哪个命令?)、出场验收 (产出物齐了吗? gate 过了吗?).

这套体系的灵感来自 DPT_FRAMEWORK 的三层执行模型: MD phase node (控制器) → JS Engine gate (验证) → transitions.chain.json (路由). MD 不是文档——它是控制面, 告诉 Agent 这一步的目标、允许动作、gate 命令、通过/失败处理.

## What Changes

### 1. 新建 `charter/NODE-SPEC.md` — Node 规格宪法

定义 Node 的解剖结构——这是整个 playbook 体系的基石:

- **Node frontmatter**: `node` (名字), `playbook` (所属), `phase` (对应), `requires` (前置 node), `produces` (产出物), `entry` (进场条件), `exit` (出场条件), `shared` (是否可被多个 playbook 引用)
- **Node body**: 结构化的 step 序列, 每步标注类型 `MD` (Agent 读方法论文档/做创意/人审) 或 `CLI` (调脚本)
- **Entry Gate**: 进场前检查条件 (如 `run_bundle_exists`, `style_master_locked`). 不满足→Agent 被告知缺什么, 先去补
- **Exit Gate**: 出场前验收条件 (如 `pptx_exists`, `visual_gate: approved`). 不满足→不允许标记 completed, 必须回退
- **Shared Node**: `shared: true` 的 node 可被多个 playbook 引用而不复制

### 2. 定义 Run Bundle State Schema

State 文件 `deck_<name>/run-bundle-state.yaml` 是 MD 和 CLI 之间的**共用语言**. 两边都读它、写它. Agent 打开 state 就知道当前在哪个 playbook 的哪个 node, CLI 脚本执行前验证 entry 条件, 执行后写产出物路径.

```
run-bundle-state.yaml
├── playbook + current_node + timestamps
├── nodes: { <name>: { status, started, completed, ... } }
│   status ∈ pending | in_progress | completed | skipped | failed
├── gates: { content, visual }
│   status ∈ pending | approved | waived
└── deck: { name, type, style }
```

### 3. 新建 `playbook/` 目录

5 个 MD Controller 文件, 每个是一串有序 node. Agent 读它就像读剧本——按步执行, 不过 gate 不前进:

| Playbook | 用途 | Nodes | 触发条件 |
|----------|------|-------|---------|
| `full-creation.md` | 全量创建 | ~11 | "帮我做一个PPT" |
| `chain-a.md` | 纯文本修改 | ~3 | "改标题/kicker/subtitle" |
| `chain-b.md` | 视觉修改 | ~5 | "换图/换颜色/改布局" |
| `chain-c.md` | 备注修改 | ~2 | "备注改一下" |
| `structural.md` | 结构变更 | ~3 | "加一页/删一页/重排" |

Node 命名沿 DPT 的 11 phases: instantiation → hitl1 → setup → seed-topics → wave0 → wave1 → wave2 → hitl2 → readiness → rerun → final. 这 11 个名字已经过实战检验.

### 4. 重构 `COMMANDS.md` 为路由表

从被动速查表转为主动路由: 用户一句话 → playbook 名 + 入口参数. Agent 读 COMMANDS.md 判断该调哪个 playbook, 然后读取对应 playbook 文件开始执行.

### 5. CLI 脚本适配

现有脚本 (`bundle_layout.mjs`, `unified_pipeline.mjs`, `env-check.mjs`) 增加 state 读写——执行前验证 entry 条件, 执行后写 node status. 逻辑不变, 只加 state I/O.

## Capabilities

### New Capabilities

- `node-specification`: Node 规格宪法 (charter/NODE-SPEC.md)——定义 node 解剖结构、state schema、playbook 组织规则、CLI⇔MD 协议. 这是整个 playbook 体系的宪法
- `playbook-execution`: MD Controller 执行体系 (playbook/ 目录)——5 个结构化的 Agent 执行剧本, 每个由有序 node 组成. State 持久化到 run-bundle-state.yaml

### Modified Capabilities

- `commands-reference`: COMMANDS.md 从被动速查表重构为主动路由表——用户意图 → playbook 调度
- `framework-charter`: charter/ 目录新增 NODE-SPEC.md
- `pipeline-orchestration`: 现有管线脚本增加 state 读写 (入口验证 + 出口记录)
- `environment-check`: env-check.mjs 输出写入 state

## Impact

| 影响面 | 说明 |
|--------|------|
| `charter/NODE-SPEC.md` | 新建, ~200 行: Node 规格 + State Schema + Playbook 规则 |
| `playbook/` | 新建目录, 5 个 MD Controller (~20-50 行/个) |
| `COMMANDS.md` | 重构为路由表 |
| `scripts/env-check.mjs` | check 结果写入 state |
| `scripts/bundle_layout.mjs` | init 后写 state |
| `scripts/unified_pipeline.mjs` | 每 stage 执行前后读写 state |
| `openspec/config.yaml` | capability 注册表更新 |
| `openspec/specs/` | 新建 `node-specification/` 和 `playbook-execution/` spec |
