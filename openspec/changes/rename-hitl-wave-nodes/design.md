## Context

PPTMAKER_FRAMEWORK 的 `create-deck` playbook 定义了 11 个有序 node。其中 5 个 node ID 使用了来自 DR workflow 的术语：`hitl1`/`hitl2`（Human-In-The-Loop）和 `wave0`/`wave1`/`wave2`。这些术语隐含"Agent 自主执行、人偶尔介入"的姿态，与 PPT maker 的"人持续协作"本质冲突。

MD Controller 体系通过 `playbook/*.md` 中的 YAML frontmatter + Markdown body 定义 node。**生产代码**（`md_controller_reader.mjs`、`state.mjs`）泛型解析 node ID——不硬编码具体名称。但**测试代码**和 **main specs** 中存在大量旧 node ID 硬编码。此变更需覆盖：framework 文档、main specs、测试文件三个层面。

## Goals / Non-Goals

**Goals:**
- 将 5 个 node ID 替换为反映协作姿态的动名词/checkpoint 命名
- 同步更新所有 requires 链、流程行、交叉引用
- NODE-SPEC.md 示例 node ID 同步更新
- main specs（`openspec/specs/`）中所有旧 node ID 引用彻底清除
- 测试文件中所有硬编码旧 node ID 同步更新

**Non-Goals:**
- 不改变任何 node 的 lifecycle_phase、method_module、entry/exit gate 逻辑
- 不改变 playbook 节点顺序或行为
- 不修改 `openspec/changes/archive/`（历史记录）
- 不迁移已有 run bundle 中的 `_state/state.yaml`
- 不改变 main spec 中示例 node ID 以外的任何需求语义

## Decisions

**1. 命名方案：动名词 + checkpoint 前缀**

| 旧名 | 新名 | 理由 |
|------|------|------|
| `hitl1` | `checkpoint-intake` | `checkpoint-` 触发 LLM "等待确认"姿态；`intake` 明确这是确认项目方向的闸门 |
| `hitl2` | `checkpoint-delivery` | 与 intake 对称；`delivery` 明确这是最终产出审查 |
| `wave0` | `authoring-slides` | `authoring` > `writing`——暗示创作意图和审美责任，不是批量输出 |
| `wave1` | `composing-prompts` | `composing` > `filling`——暗示视觉判断和风格呼应，不是机械填空 |
| `wave2` | `assembling-deck` | `assembling` > `building`——暗示零部件（spec/图/notes）已就绪，拼装成 PPTX |

三个 work node 使用不同动词（author/compose/assemble），避免 LLM 模糊处理为"三个差不多的阶段"。

**2. 生产代码不变，测试代码需同步**

`md_controller_reader.mjs` 和 `state.mjs` 按 node ID 字符串泛型处理——这些生产文件无需修改。但 5 个测试文件硬编码了旧 node ID（字符串字面量、fixture YAML、断言期望值），需全部替换为新名。

**3. main specs 通过 delta spec 彻底清理**

`openspec/specs/` 中 3 个 spec 文件存在旧 node ID 引用。所有引用（不论在 requirement 文本、scenario 标题还是 scenario 步骤中）必须替换为新名。不得残留任何旧名。手段只有 delta spec（MODIFIED Requirements——复制完整 requirement + scenario 块并替换旧名）。

**4. 变更范围：11 个文件**

```
层面 1 — Framework 文档（3 个 MD）
PPTMAKER_FRAMEWORK/playbook/create-deck.md
PPTMAKER_FRAMEWORK/charter/NODE-SPEC.md
PPTMAKER_FRAMEWORK/COMMANDS.md

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

**Alternatives considered:**
- **统一前缀（stage-/phase-）**：与 pipeline stage 和 lifecycle_phase 术语冲突
- **纯名词（content/prompts/production）**：太开放，LLM 不清楚动作边界
- **保留原样仅加注释**：不解决核心问题——LLM 读到 `wave` 就会倾向自主行为

## Risks / Trade-offs

- **[Risk] 跨文件引用遗漏** → 用 `grep -rn` 在全部三层（framework、openspec/specs、tests）验证旧 node ID 零残留（排除 archive）
- **[Risk] 测试全红** → 5 个测试文件必须先于或同步于 framework 文档更新；tasks 中测试更新独立成节，在验证前完成
- **[Risk] 旧 run bundle 的 state.yaml 包含旧 node ID** → 不影响。新 playbook 启动时使用新 ID；旧 run bundle 续跑时 `current_node` 是旧名但 validator 会因节点不存在而报错，Agent 按 session resume ritual 从新名重入
- **[Risk] archive 中大量旧名引用** → 不需修改。archive 是历史记录，修改会破坏 git 审计追踪的完整性
