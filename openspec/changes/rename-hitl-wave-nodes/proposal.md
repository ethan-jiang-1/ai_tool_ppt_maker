## Why

PPTMAKER_FRAMEWORK 的 playbook node 使用了 `hitl1`/`hitl2`/`wave0`/`wave1`/`wave2` 五个术语。这些术语来自 DR（长期静默自主执行）workflow——`wave` 暗示 Agent 自主冲刺的区间，`HITL` 暗示人从 loop 外部被偶尔拉进来。但 PPT maker 的本质是持续人机协作打磨 UX：人从来没离开过 loop，每一步都在交互。用错术语会让 LLM 产生错误的行为弧度——它读到 `wave0` 会倾向于批量自主完成，而非与人类逐页协作打磨。应在 LLM 集成之前修正这些核心概念名，否则后续所有 Agent 行为都建立在错误姿态上。

## What Changes

- `hitl1` → `checkpoint-intake`：人确认项目方向，`checkpoint-` 前缀触发 LLM 进入"等待确认"姿态
- `hitl2` → `checkpoint-delivery`：人审查最终产出，与 intake 对称
- `wave0` → `authoring-slides`：动名词 `authoring` 锁死"人-Agent 协作创作"姿态，区别于批量写作
- `wave1` → `composing-prompts`：动名词 `composing` 暗示审美判断，区别于机械填空
- `wave2` → `assembling-deck`：动名词 `assembling` 暗示零部件组装，而非自主构建
- playbook 流程行、所有 `requires` 链同步更新
- NODE-SPEC.md 示例 node ID 同步更新
- COMMANDS.md 路由文字中一处 `hitl2` 引用更新
- 5 个测试文件（`.mjs`）中硬编码的旧 node ID 同步更新
- 3 个 main spec 中所有旧 node ID 引用彻底清除，仅保留新名

## Capabilities

### New Capabilities

无。纯重命名，不引入新能力。

### Modified Capabilities

- `playbook-execution`: `create-deck` playbook 的 5 个 node ID 变更，requires 链更新
- `node-specification`: NODE-SPEC.md 示例 node ID 更新；main spec 中所有 scenario 示例从旧名切换到新名
- `notes-injection`: spec scenario "Circular wave2 proxy" 中的 `wave2` 节点引用更新

注：`commands-reference` 的 spec 不含旧 node ID——仅 COMMANDS.md 文件本身更新，不涉及 spec 级需求变更。

## Impact

**Framework 文档（3 个 MD）：**
- `PPTMAKER_FRAMEWORK/playbook/create-deck.md` — 主变更文件（node 定义、requires、流程行）
- `PPTMAKER_FRAMEWORK/charter/NODE-SPEC.md` — 示例 node ID 更新
- `PPTMAKER_FRAMEWORK/COMMANDS.md` — 一行路由文字

**Main specs（3 个 MD，通过 delta spec 更新）：**
- `openspec/specs/playbook-execution/spec.md` — 节点列表枚举
- `openspec/specs/node-specification/spec.md` — 15+ scenario 示例中的旧名
- `openspec/specs/notes-injection/spec.md` — "Circular wave2 proxy" scenario

**测试文件（5 个 .mjs）：**
- `tests/test_md_controller_reader.mjs` — 硬编码节点列表 + wave0
- `tests_e2e/test-state-machine.mjs` — 全路径硬编码旧名
- `tests/test_ppt_flow.mjs` — hitl1 fixture
- `tests/test_bundle_layout.mjs` — wave0
- `tests/test_state_yaml.mjs` — wave0/hitl1/hitl2

**不变的部分：**
- 生产 `.mjs` 代码（`md_controller_reader.mjs`、`state.mjs`）——泛型解析 node ID，不硬编码具体名称
- `state.yaml` schema——`current_node` 值自然使用新 ID
- `openspec/changes/archive/`——历史记录，不修改
