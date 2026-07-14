## Why

`openspec/specs/node-specification/spec.md` 的 5 个 migration scenario 中残留了具体的旧 node ID（`hitl1`、`hitl2`、`wave0`、`wave1`、`wave2`、`verify-output`）以及被用作示例的 playbook 名（`edit-text`、`edit-visual`）。这些旧名已经通过 `rename-hitl-wave-nodes` 从全部 framework 代码、playbook、测试中清理干净，但作为 migration scenario 的 WHEN 输入遗留在 main spec 里。读者看到这些名字会困惑——"这是什么？是合法 node ID 吗？我在哪能找到？"。

`NODE_ALIASES` 常量在 `state.mjs` 中才是旧→新映射的权威源。Main spec 的职责是指定 migration 行为的契约——它应该描述机制（pointer-only、record merge、coexistence priority、stack migration），而不是穷举特定 playbook 的具体映射。现在清理，趁迁移代码刚完成、所有细节还记得。

## What Changes

- **删除** 4 个 create-deck 专用的 migration scenario（"covers the full create-deck rename"、"pointer-only migration preserves current_node"、"legacy and canonical keys coexist"、"playbook stack entries receive alias migration"）
- **新增** 1 个泛化的综合性 scenario "Playbook-scoped alias migration is comprehensive and idempotent"——用占位符 `⟨legacy-id⟩` / `⟨canonical-id⟩` 覆盖全部四种迁移维度（pointer-only、record key merge、canonical-priority coexistence、playbook_stack current_node + controller_nodes）
- **修改** 现有 "Known node rename is playbook-scoped" scenario——将 `edit-text`/`verify-output`/`edit-visual` 替换为 `⟨playbook⟩` / `⟨legacy-id⟩` / `⟨canonical-id⟩` 占位符
- 受影响范围：仅 `openspec/specs/node-specification/spec.md` 一个文件

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `node-specification`: 4 个含具体旧 node ID 的 migration scenario 被 1 个泛化 scenario 替换；1 个现有 scenario 中的具体旧名替换为占位符。迁移行为契约不变，仅清除词汇残留。

## Impact

- 修改文件：`openspec/specs/node-specification/spec.md`（约 40 行替换）
- 测试文件：`tests/test_state_yaml.mjs` 中 7 个含旧名的 migration test fixtures 不受影响——tests 需要具体值来验证 state.mjs 的 NODE_ALIASES 行为
- `state.mjs` 的 `NODE_ALIASES` 不变——它仍是旧→新映射的权威源
- 其他 spec 文件（`playbook-execution`、`notes-injection`）已在 `rename-hitl-wave-nodes` 中清理干净，不需要再动
