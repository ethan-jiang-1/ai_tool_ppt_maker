# Node 规格宪法

> 本文定义 Playbook 体系中 **Node** 的解剖结构、State Schema、和执行规则.
> 这是整个 MD Controller 体系的基石——所有 playbook 和 CLI 脚本都按此规格读写 state.

## Node 解剖

每个 Node 是一个 Markdown 文件, 由 **YAML frontmatter** (元数据) 和 **Markdown body** (执行步骤) 组成.

### Frontmatter 字段

```yaml
---
node: <kebab-case>           # Node 唯一标识
playbook: <playbook-name>    # 所属 playbook (shared node 此项为空)
phase: <00-05>               # 对应 Phase
requires:                    # 前置 node, 必须 completed 才能进
  - <node-name>
optional-deps:               # 可选前置, 有更好没有也可以
  - <node-name>
produces:                    # 产出物 (文件 / gate 决策 / state 字段)
  - <artifact-name>
entry:                       # ENTRY GATE: 进场前必须满足的条件
  - <condition>
exit:                        # EXIT GATE: 出场前必须满足的条件
  - <condition>
shared: false                # true = 可被多个 playbook 通过 includes 引用
---
```

### Body 结构

Node body 是 Agent 读取的执行指令. 每步标注类型:

```markdown
## Step N — MD
Agent 读方法论文档、做创意判断、人机交互.
引用 workflow/ 下的文件, 不重复其内容.

## Step N — CLI
调脚本. 写完整命令 + 参数占位符.
node scripts/<script>.mjs --arg <value>
```

## State Schema

State 文件 `run-bundle-state.yaml` 放在 run bundle 根目录 (`deck_<name>/`). 与 `project-metadata.yaml` **共存**: state 管执行进度, metadata 管静态配置.

```yaml
# run-bundle-state.yaml
playbook: full-creation       # 当前 playbook
current_node: wave0           # 当前执行到的 node
started_at: 2026-07-10T14:00:00Z
updated_at: 2026-07-10T14:23:00Z

nodes:                        # 每个 node 的状态
  instantiation:
    status: completed
    started: 2026-07-10T14:00:00Z
    completed: 2026-07-10T14:05:00Z
  hitl1:
    status: completed
    decision: proceed          # node 特有字段可选
  wave0:
    status: in_progress

gates:                        # 人审 gate
  content: pending             # pending | approved | waived
  visual:  pending

deck:                         # 静态 deck 信息 (从 metadata 镜像)
  name: my_deck
  type: keynote
  style: dark-executive
```

### Node Status 枚举

| Status | 含义 |
|--------|------|
| `pending` | 未开始 |
| `in_progress` | 正在执行 |
| `completed` | 所有 exit 条件满足 |
| `skipped` | 用户明确跳过 |
| `failed` | 阻塞, 需人工干预 |

### Gate Status 枚举

| Status | 含义 |
|--------|------|
| `pending` | 等待人审 |
| `approved` | 人审通过 |
| `waived` | 用户明确跳过 |

## Playbook 规则

### Node 串联

Playbook 是**有序 node 序列**. Agent 按 playbook 中 node 出现的顺序执行. 每个 node 的 `requires` 字段声明前置依赖——如果前置 node 不是 `completed`, Agent 必须先完成它.

### Shared Node

`shared: true` 的 node 可被多个 playbook 引用. Playbook 通过 frontmatter 的 `includes` 字段声明:

```yaml
---
playbook: chain-a
includes: [classify-change]
---
```

引用的 shared node 行为上等同于写在 playbook 里, 但不复制内容.

### CLI ⇔ MD 协议

- **MD → CLI**: Agent 执行 CLI step 前, 确保 `entry` 条件满足. 将 `run-bundle-state.yaml` 路径传给脚本
- **CLI → MD**: 脚本执行后写 state (node status, 产出物路径, 时间戳). 如果 entry 条件不满足, 脚本拒绝执行并报告缺失条件
- **State 读写**: 写操作只更新自己负责的字段. 读操作前先加载最新 state

## 示例: 一个完整的 Node

```markdown
---
node: wave0
playbook: full-creation
phase: 04
requires: [seed-topics]
produces: [wave0-artifacts, foundation-sources]
entry:
  - run_bundle_exists
  - seed_topics_complete
exit:
  - wave0_sources_collected
  - wave0_evidence_indexed
---

# wave0: Foundation Shared Reference

## Step 1 — MD
读 workflow/02-content/04-create-content-assets.md.
为每个 topic 收集 foundation source metadata.

## Step 2 — CLI
node scripts/unified_pipeline.mjs --run-dir <dir> --stage 1

## Step 3 — Gate
人工审查收集的 source. 确认齐全后更新 state: node wave0 → completed
```
