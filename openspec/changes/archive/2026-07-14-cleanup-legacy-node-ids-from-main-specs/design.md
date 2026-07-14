## Context

`rename-hitl-wave-nodes` 完成后，`openspec/specs/node-specification/spec.md` 的 "State schema is explicitly versioned and migrated" requirement 中新增了 4 个 create-deck 专用的 migration scenario，使用具体旧 node ID（`hitl1`、`hitl2`、`wave0`、`wave1`、`wave2`）。同时，更早的 `edit-text`/`edit-visual` 迁移也遗留了 `verify-output` 在 "Known node rename is playbook-scoped" scenario 里。

这些旧名在全部 framework 代码、playbook、NODE-SPEC.md 中已经不存在。Main spec 是规范权威——任何旧名残留都会让读者困惑"这是什么？合法吗？在哪定义？"。`state.mjs` 的 `NODE_ALIASES` 是旧→新映射的唯一权威源；main spec 不需要、也不应该穷举每个 playbook 的具体映射。

目标：用占位符替换所有具体旧名，合并 4 个 create-deck 专用 scenario 为 1 个泛化 scenario。零新功能，零行为变更。

## Goals / Non-Goals

**Goals:**
- `openspec/specs/node-specification/spec.md` 中零具体旧 node ID 残留
- 所有 migration 行为契约通过占位符保持可测试
- 合并后场景覆盖 pointer-only、record key merge、canonical-priority coexistence、playbook_stack migration 四个维度
- `npm test` 全绿（测试文件不改——测试需要具体值验证 `NODE_ALIASES`）

**Non-Goals:**
- 不修改 `state.mjs` 的 `NODE_ALIASES` 常量
- 不修改任何测试文件
- 不修改其他 spec 文件
- 不删除任何 migration 行为——只替换词汇、不改变契约

## Decisions

**1. 占位符方案：`⟨description⟩` 角括号**

迁移 scenario 中出现的具体 node ID 和 playbook 名全部替换为占位符：

| 具体旧名（将被替换） | 替换为 |
|----------|--------|
| `hitl1`, `hitl2`, `wave0`, `wave1`, `wave2`, `verify-output` | `⟨legacy-id⟩` |
| `checkpoint-intake`, `checkpoint-final-review`, `authoring-slides`, `composing-prompts`, `producing-deck` | `⟨canonical-id⟩` |
| 具体的 playbook 名（`edit-text`、`edit-visual`） | 叙事化——用 "a playbook whose NODE_ALIASES entry..." 和 "a different playbook" 代替 |

选用角括号因为它不冲突于 YAML/Markdown 的 backtick 和引号语法，一看就知道是 placeholder，不会被误读为真实值。

**2. 合并策略：4→1**

4 个 create-deck 专用 scenario 本质上是同一个 alias migration 机制的四个维度：
- 全量映射（5 个旧名 → 5 个新名）
- Pointer-only（有 pointer 无 record）
- Coexistence（新旧 key 共存，canonical 优先）
- Playbook_stack（栈条目也迁移）

合并后 1 个 scenario 覆盖全部四个维度，用占位符表达。

**Alternatives considered:**
- 不合并，只替换占位符 → 4 个 scenario 几乎一样，冗余
- 全删不补 → 丢失 pointer-only / stack 的规范覆盖，risk 太大
- 用 backtick `<legacy-id>` 而非角括号 → backtick 在 spec 中通常表示 literal 值，会产生 "这是真实 node ID" 的误导

**3. 保留 scenarios 列表**

最终 "State schema is explicitly versioned and migrated" requirement 下保留：
- "Known node rename is playbook-scoped" (MODIFIED — 泛化 edit-text/edit-visual 示例)
- "Playbook-scoped alias migration is comprehensive and idempotent" (NEW — 合并 4 个 create-deck scenarios)
- "Migration is idempotent" (不变)
- "Legacy execution ID is stable" (不变)
- "Scalar legacy decision is not upgraded to human approval" (不变)
- "Workflow start is not overwritten by a new playbook" (不变)
- "Incomplete execution is not silently replaced" (不变)

## Risks / Trade-offs

- **[Risk] 占位符太抽象，读者不明白具体机制** → scenario 的 THEN 从句保留了具体的 `mergeMissing` 语义、`current_node` 迁移、`controller_nodes` key 迁移、diagnostics 检查——机制描述完整；具体映射值参考 `state.mjs` 的 `NODE_ALIASES` 即可
- **[Risk] 某个 future change 不理解 spec 需要"已知旧 ID 被正确迁移"这个规范而写错代码** → `NODE_ALIASES` 本身 + 测试文件中的具体 fixture 提供实现真理；spec 只定义行为契约，不需要枚举实例
