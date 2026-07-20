## Context

PPTMAKER_FRAMEWORK 的 `create-deck` playbook 定义了 11 个有序 node。其中 5 个 node ID 使用了来自 DR workflow 的术语：`hitl1`/`hitl2`（Human-In-The-Loop）和 `wave0`/`wave1`/`wave2`。这些术语对不熟悉 DR 的人来说语义不透明——`wave` 不说明在做什么，`HITL` 不说明人在确认什么。相比之下，新名自解释：看到 `authoring-slides` 就知道在写内容，看到 `checkpoint-intake` 就知道这是项目方向的确认点。

MD Controller 体系通过 `playbook/*.md` 中的 YAML frontmatter + Markdown body 定义 node 的**声明**。但 node ID 同时也是持久化工作流协议的一部分——`_state/state.yaml` 中 `current_node`、`nodes` 的 key、`playbook_stack` 里的嵌套执行快照都存储 node ID。因此重命名不仅是文档层变更，还需要在 `state.mjs` 中添加 migration alias，确保已有 run bundle 断线续跑时旧名被自动映射到新名。

**搜索与修改仅限 4 个目录：** `PPTMAKER_FRAMEWORK/`、`tests/`、`tests_e2e/`、`openspec/specs/`。`deck_*/`、`_backlog/`、`openspec/changes/archive/`、`.claude/`、`node_modules/` 一律排除。（`_backlog/plans/suspended-output-linter-at-node-boundaries.md` 中存在 wave0/wave1 引用，已评估——该文件处于 suspended 状态，不属于活跃规范，不纳入本次变更。）

## Goals / Non-Goals

**Goals:**
- 将 5 个 node ID 替换为自解释的动名词/checkpoint 命名
- 同步更新所有 requires 链、流程行、交叉引用、NODE-SPEC.md 示例
- 在 `state.mjs` 中添加 migration alias，确保已有 run bundle 断线续跑不中断
- main specs 和测试中所有旧 node ID 引用同步更新

**Non-Goals:**
- 不改变任何 node 的 lifecycle_phase、method_module、entry/exit gate 逻辑
- 不改变 playbook 节点顺序或行为
- 不修改 `openspec/changes/archive/`
- 不修改 `_backlog/` 中的 suspended plan

## Decisions

**1. 命名方案：动名词 + checkpoint 前缀**

| 旧名 | 新名 | 理由 |
|------|------|------|
| `hitl1` | `checkpoint-intake` | `checkpoint-` 明确这是确认闸门，不是把人从外部拉进来。`intake` 说明确认的是项目方向 |
| `hitl2` | `checkpoint-final-review` | 与 intake 对称。`final-review` 准确反映节点职责——审阅最终产出并选择 proceed/repair/redirect（真正的交付 checklist 在后续 readiness） |
| `wave0` | `authoring-slides` | `authoring` > `writing`——暗示创作意图和审美责任。节点实际写 L1/L2/L4 slide specifications |
| `wave1` | `composing-prompts` | `composing` > `filling`——暗示视觉判断和风格呼应，区别于机械套模板 |
| `wave2` | `producing-deck` | `producing` > `assembling`——节点实际包含图片生成、pilot、header review、PPTX build 和 notes 注入，远大于 assembly |

三个 work node 使用三个不同动词（author / compose / produce），确保不会模糊处理为"三个差不多的阶段"。

**Alternatives considered:**
- `checkpoint-delivery`：被否决——节点职责是审阅+决策，不是交付。`checkpoint-final-review` 更准确
- `assembling-deck`：被否决——节点范围远超组装。`producing-deck` 覆盖生图、pilot、build、notes 全流程
- `authoring-slide-specs`：被否决——太冗长。`authoring-slides` 在 PPT 语境下足够清晰

**2. State migration（阻断级——必须实现）**

`state.mjs` 已有 `NODE_ALIASES` 机制（当前用于 `edit-text`/`edit-visual` 的 `verify-output` 迁移）。需新增 `create-deck` 条目：

```js
"create-deck": Object.freeze({
  "hitl1": "checkpoint-intake",
  "hitl2": "checkpoint-final-review",
  "wave0": "authoring-slides",
  "wave1": "composing-prompts",
  "wave2": "producing-deck",
}),
```

现有 `applyNodeAliases()` 的覆盖范围和缺陷：

| 场景 | 当前行为 | 需要的行为 |
|------|---------|-----------|
| 顶层 `current_node` 匹配旧名，且 `nodes[legacyId]` 存在 | 迁移 ✓ | 不变 |
| 顶层 `current_node` 匹配旧名，但 `nodes[legacyId]` **不存在**（pointer-only） | **漏口：不迁移** | 必须迁移 |
| `nodes` 中的旧 key | 迁移 ✓ | 不变 |
| `playbook_stack[].current_node` | **不迁移** | 必须迁移 |
| `playbook_stack[].controller_nodes` 的旧 key | **不迁移** | 必须迁移 |

**Pointer-only 迁移必须与 record 迁移解耦。** 当前逻辑 `if (!state.nodes?.[legacyId]) continue;` 导致没有 node record 时 pointer 一起被跳过。修复：无条件迁移匹配的 `current_node`；有旧 record 时才合并 record。

**扩展 `applyNodeAliases()` 需要明确的实现决策：**

1. **执行顺序**：`healState()` 必须按此顺序执行三个阶段：(a) `normalizePlaybookStack()` — 先将 stack 修复为 plain-object array（处理 null、非对象 entry、非字符串字段）；(b) `applyNodeAliases()` — 在已规范化的结构上迁移旧名，此时 `playbook_stack` 已是干净数组、`controller_nodes` 已是 object、`current_node`/`playbook` 已是字符串，无需防御非结构化数据；(c) `restrictActiveWorkingSet()` — 最后校验迁移后的 `current_node` 在 playbook index 中合法。**若未来调整 `healState()` 的阶段顺序，必须重新评估此依赖。**

2. **Stack 迁移**：遍历 `playbook_stack` 每个条目（此时已被 normalize 修复为 plain-object array），若其 `playbook` 在 `NODE_ALIASES` 中有定义：
   - 无条件迁移 `current_node`（pointer-only 模式——解耦自 record 存在性）
   - 对 `controller_nodes` 的 key 应用 alias 映射（有旧 record 时合并）
   - 采用与顶层一致的 `mergeMissing` 语义：canonical key 优先，只从 legacy key 补**顶层缺失字段**（浅合并——若 canonical 已有 `evidence` 对象，legacy 的 evidence 不被合并；仅 canonical 完全没有某字段时才从 legacy 继承）。execution ID 由 healer 按所属 execution 规范化，timestamps 按兼容性规则清理

3. **幂等性**：legacy 和 canonical key 同时存在时，canonical record 优先。已在步骤 2 中通过 `mergeMissing(canonical, legacy)` 保证。

**3. 旧名残留策略**

旧名不得出现在 controllers、正常示例和规范性 canonical ID 中。但以下位置**必须保留**旧名：

| 位置 | 原因 |
|------|------|
| `state.mjs` `NODE_ALIASES` 常量 | migration map 本身就是旧→新映射 |
| `openspec/specs/node-specification/spec.md` migration scenarios | 需要旧名定义"已知旧 ID 被正确迁移"的规范 |
| migration test fixtures（含 pointer-only 和 playbook_stack 场景） | 需要旧名验证 alias 逻辑正确 |
| `openspec/changes/archive/` | 历史记录，不改 |

验证 grep 调整：controllers 和正常 scenario 示例中零残留；migration map、migration scenarios、legacy test fixtures 中允许且必须保留。

**4. 变更范围：12 个文件**

```
层面 1 — Framework（4 个文件）
PPTMAKER_FRAMEWORK/playbook/create-deck.md       — node 声明、requires、流程行
PPTMAKER_FRAMEWORK/charter/NODE-SPEC.md          — 示例 node ID
PPTMAKER_FRAMEWORK/COMMANDS.md                   — 路由文字
PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs         — NODE_ALIASES + applyNodeAliases 扩展

层面 2 — Main specs（3 个 MD，通过 delta spec）
openspec/specs/playbook-execution/spec.md
openspec/specs/node-specification/spec.md
openspec/specs/notes-injection/spec.md

层面 3 — 测试文件（5 个 .mjs）
tests/test_md_controller_reader.mjs
tests_e2e/test-state-machine.mjs
tests/test_ppt_flow.mjs
tests/test_bundle_layout.mjs
tests/test_state_yaml.mjs
```

## Risks / Trade-offs

- **[Risk] 旧 run bundle 断线续跑中断** → 通过 `NODE_ALIASES` 自动迁移旧 `current_node` 和 `nodes` key。补 `playbook_stack` 覆盖后，嵌套执行快照也安全
- **[Risk] 新 node ID 含 hyphen** → JavaScript dot notation（`nodes.wave0`）对新名无效，必须改用 bracket notation（`nodes['authoring-slides']`）。生产代码已全用 bracket；测试文件中约 8 处 dot access 需转换
- **[Risk] 跨文件引用遗漏** → 验证 grep 限 4 个目录，排除 NODE_ALIASES 常量、migration scenarios in main specs、migration test fixtures、archive
- **[Risk] 测试全红** → 12 个文件需协调更新；tasks 中按依赖排序，验证置最后
