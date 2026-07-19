## Why

PPTMAKER_FRAMEWORK 的 `create-deck` playbook 中使用了 5 个 node ID：`hitl1`、`hitl2`、`wave0`、`wave1`、`wave2`。

**这些名字的问题不是审美，而是语义不透明。** `wave` 和 `HITL` 是来自另一套 workflow 系统（DR，长期静默自主执行）的内部术语。对不熟悉 DR 的人来说：

- `wave0`/`wave1`/`wave2` — 不说明每个阶段在做什么。三个编号式的名字之间没有语义区分度，Agent 容易将它们模糊处理为"三个差不多的阶段"而非三个职责不同的协作动作。
- `hitl1`/`hitl2` — HITL（Human-In-The-Loop）暗示人是从外部被拉入的，但 PPT maker 中的人从未离开过 loop。且两个 gate 的职责完全不同（一个确认 intake，一个审阅最终产出），但名字看不出区别。

**新名字自解释：** 看到 `authoring-slides` 就知道在写内容，看到 `composing-prompts` 就知道在构图，看到 `checkpoint-final-review` 就知道这是最终审阅闸门。不需要先理解 DR 的 wave/HITL 概念。

**应在 LLM 深度集成之前修正。** 一旦这些术语进入大量 Agent 执行实例和 run bundle 的 `_state/state.yaml`，改名成本（migration alias、向后兼容、conversation log 残留）将显著上升。

## What Changes

5 个 node ID 重命名。命名原则：**动名词说明动作，checkpoint 前缀说明是确认闸门。**

| 旧名 | 新名 | 为什么新名更好 |
|------|------|-------------|
| `hitl1` | `checkpoint-intake` | `checkpoint-` 明确这是确认闸门。`intake` 说明确认的是项目方向 |
| `hitl2` | `checkpoint-final-review` | 与 intake 对称。`final-review` 准确描述职责——审阅最终产出并做出 proceed/repair/redirect 决策 |
| `wave0` | `authoring-slides` | `authoring` 说明在创作阶段。节点产出 slide specifications（L1/L2/L4），后续 `producing-deck` 才生成最终页面 |
| `wave1` | `composing-prompts` | `composing` 说明需要视觉判断和风格呼应，不是机械填空 |
| `wave2` | `producing-deck` | `producing` 覆盖节点完整职责——图片生成、pilot、header review、PPTX build、notes 注入 |

三个 work node 使用三个不同动词（author / compose / produce），确保语义上不会混淆。

**配套变更：**
- playbook 流程行和所有 `requires`、`node_decision`、`entry` 条件中旧 node ID 同步替换
- node body 文字中引用旧 node ID 的描述同步替换
- NODE-SPEC.md 中所有示例 node ID 同步更新
- COMMANDS.md 路由表中旧名引用更新
- `state.mjs` 添加 `NODE_ALIASES` 条目并扩展 `applyNodeAliases()` 覆盖 `playbook_stack`
- 5 个测试文件中硬编码的旧名替换，dot-notation → bracket notation
- 3 个 main spec 中旧 node ID 引用通过 delta spec 更新

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `playbook-execution`: `create-deck` playbook 的 5 个 node ID 变更，requires 链更新
- `node-specification`: NODE-SPEC.md 示例更新；main spec 中 scenario 示例切换到新名；state migration alias 新增
- `notes-injection`: spec scenario "Circular wave2 proxy" 中的节点引用更新

注：`commands-reference` 的 spec 不含旧 node ID——仅 COMMANDS.md 文件本身更新，不涉及 spec 级需求变更。

## Impact

### 搜索与修改范围

本次变更**仅限以下 4 个目录**：

```
PPTMAKER_FRAMEWORK/   — framework 方法论、playbook、脚本
tests/                — 单元测试
tests_e2e/            — 端到端测试
openspec/specs/       — main specs（规范性需求）
```

**明确排除的目录：**

| 排除目录 | 原因 |
|---------|------|
| `openspec/changes/archive/` | 历史记录，修改会破坏审计完整性 |
| `deck_*/` | run bundle 数据实例，不属于 framework 源码 |
| `_backlog/` | 独立簿记系统。其中的 `suspended-output-linter-at-node-boundaries.md` 存在 wave0/wave1 引用，已评估：该文件处于 suspended 状态，不纳入本次变更 |
| `.claude/` | Claude 配置，不含 node ID 引用 |
| `node_modules/` | 第三方依赖 |

### 变更清单

**PPTMAKER_FRAMEWORK/（4 个文件）：**
- `PPTMAKER_FRAMEWORK/playbook/create-deck.md` — 主变更（~20 处：node 声明、heading、requires、流程行、body 文字）
- `PPTMAKER_FRAMEWORK/charter/NODE-SPEC.md` — 6 处示例 node ID
- `PPTMAKER_FRAMEWORK/COMMANDS.md` — 1 处路由文字
- `PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs` — NODE_ALIASES 新增 5 条映射 + `applyNodeAliases()` 扩展覆盖 `playbook_stack`

**openspec/specs/（3 个 MD，通过 delta spec 更新）：**
- `openspec/specs/playbook-execution/spec.md` — 1 处：create-deck 节点列表枚举
- `openspec/specs/node-specification/spec.md` — 15+ 处：scenario 示例中使用的旧 node ID；新增 migration alias 相关的 scenario
- `openspec/specs/notes-injection/spec.md` — 3 处："Circular wave2 proxy" scenario

**tests/ + tests_e2e/（5 个 .mjs）：**
- `tests/test_md_controller_reader.mjs` — 3 处：节点列表数组 + node ID 断言
- `tests_e2e/test-state-machine.mjs` — ~31 处：全路径硬编码旧名
- `tests/test_ppt_flow.mjs` — 3 处：旧名 fixture
- `tests/test_bundle_layout.mjs` — 2 处：旧名
- `tests/test_state_yaml.mjs` — ~12 处：旧名字符串 + dot-notation → bracket

### 旧名保留位置

以下位置**必须保留**旧 node ID（不参与"零残留"验证）：

| 位置 | 保留原因 |
|------|---------|
| `state.mjs` `NODE_ALIASES` 常量 | migration map 本身就是旧→新映射 |
| `openspec/specs/node-specification/spec.md` migration scenarios | 需要旧名定义"已知旧 ID 被正确迁移"的规范 |
| migration test fixtures | 需要旧名验证 alias 逻辑（含 pointer-only 和 playbook_stack 场景） |
| `openspec/changes/archive/` | 历史记录，不修改 |

### 不变的部分

- 所有 node 的 `lifecycle_phase`、`method_module`、`entry`/`exit` gate 逻辑——只改名，不改行为
- `state.yaml` schema——`current_node` 值通过 alias 自动迁移
