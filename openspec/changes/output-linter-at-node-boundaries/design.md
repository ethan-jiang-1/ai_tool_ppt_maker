## Context

Agent 在 MD 文件中产出结构化内容（YAML/JSON fence、frontmatter、slide specs 格式），但缺乏系统性输出校验。JS 管线代码要么产出正确要么 crash——不需要 lint。需要 lint 的只有一个场景：**agent 手写的 MD 文件中嵌入了结构化数据，可能格式松散**。

现有基础设施可直接复用：`yaml` npm 包、`state.mjs` 的 `checkEntry`/`checkExit` 框架、`cli_error.mjs` envelope、`DETERMINISTIC_CONDITIONS` 注册表。

## Goals / Non-Goals

**Goals:**
- 提供 `lint_output.mjs` 库，聚焦 agent 在 run bundle 中产出的 MD 文件
- 新增 `outputs_linted` boolean exit condition，在 node 边界关门验证
- `ppt_flow lint` CLI 供 agent 在 node 执行期间调用
- PDCA 由 playbook node 的 CLI step 指令驱动：agent 跑 lint → 读结果 → 修 → 重跑，最多 3 轮

**Non-Goals:**
- **不 lint JS 管线输出**（`_generated/` 下 JSON/PPTX、`_state/state.yaml`）
- **不 lint pure evidence produces**（无文件 produces ID）
- **不用 JS 循环实现 PDCA**——PDCA 是 agent 行为模式，由 playbook 指令驱动
- 不自动修复（linter 只检测，agent 修）
- 不在 playbook YAML 中加文件路径

## Decisions

### 1. 只 lint agent 手写的 MD 文件

**选择**: linter 只覆盖 `produces` 中有对应 MD 文件的 ID。所有 JS 管线输出和 pure evidence produces 跳过。

**理由**: JS 要么产出合法数据要么 throw。agent 手写 MD 才是格式风险来源。

**实际 produces→文件映射**（基于 `create-deck.md` 声明 + `deck_ai_sdlc_keynote` 文件系统验证）：

| produces ID | 实际文件 | validator |
|---|---|---|
| `deck-guide` | `deck-guide.md` | `lintMarkdown` |
| `core-metaphor` | `2_backbone/core-metaphor.md` | `lintMarkdown` |
| `core-formula` | `2_backbone/core-formula.md` | `lintMarkdown` |
| `slide-specifications-l1-l2-l4` | `slide-specifications.md` | `lintSlideSpecs`（`allowPlaceholders: true`） |
| `validated-slide-specifications` | `slide-specifications.md` | `lintSlideSpecs`（`allowPlaceholders: false`） |

未映射的 produces ID 跳过，返回 `{ ok: true, warnings: [{ rule: "no-file-to-lint" }] }`。

### 2. PDCA 由 playbook 驱动，不由 JS 循环

**选择**: agent 在 node 执行期间，按 playbook 的 CLI step 指令跑 `ppt_flow lint`。发现错误就修文件、重跑。`outputs_linted` condition 是最后关门验证。**不存在** `pdcaLintLoop()` JS 函数。

**理由**: 这个系统的编排器是 agent，不是 JS。playbook 就是"程序"——node steps 告诉 agent 做什么。PDCA loop 应该写在 playbook 的 step 指令里，而不是 JS 的 `for`/`while` 里。

**Playbook node 示意**（以 wave0 为例）：
```yaml
node: wave0
produces: [slide-specifications-l1-l2-l4]
exit:
  - slide_specs_exists
  - evidence:l1-l2-l4-complete
  - evidence:sources-collected
  - outputs_linted          # ← 关门 gate
```

```
**Step 1 — MD**: 完成 L1/L2/L4；L3 保持占位。
**Step 2 — MD**: 收集来源，记录 evidence。
**Step 3 — CLI**: 跑 ppt_flow lint --run-dir <runDir> --node wave0。
  如有 error → 修对应文件 → 重跑 lint（最多 3 轮）。
  3 轮仍 fail → hard stop，附 lint 报告给用户。
```

agent 执行到 Step 3 时：跑 CLI → 拿到 `[{ file, ok, errors, warnings }]` → 如果 `ok: false`，读 errors 修文件 → 再跑 CLI → 直到全部 `ok: true`。然后 `checkExit` 跑 `outputs_linted`（再验一次），pass → node complete。

### 3. `outputs_linted` 只返回 boolean

**选择**: condition 在 `CONDITIONS` 注册表中返回 `lintNodeProduces(...).every(r => r.ok)`。详细报告由 agent 通过 `ppt_flow lint` CLI 获取。

**理由**: `state.mjs:667` 的条件逻辑是 `if (!check())`——必须返回 boolean。返回对象永远是 truthy。

### 4. `checkExit`/`checkEntry` 自动注入 `nodeId` 和 `playbookDir` 到 ctx

**选择**: `checkExit` 和 `checkEntry` 已经收到 `playbookDir` 参数。在调用 `checkConditions` 前，将 `nodeName` 和 `playbookDir` 注入 ctx。这样 `outputs_linted` condition 不需要 agent 手动传这些值。

**修改点**（`state.mjs`）：
```javascript
export function checkExit(nodeName, playbookDir, state, ctx = {}) {
  const { node, validation } = readValidatedNode(nodeName, playbookDir, state);
  if (!node) return { pass: false, ... };
  return checkConditions(node.exit, node, state, { ...ctx, nodeId: nodeName, playbookDir });
}
```

### 5. Strict vs Tolerant 双模式

语法级错误（YAML 不可解析、frontmatter 不闭合）无论什么模式都 hard-fail。Schema 级偏差在 tolerant 模式下降级为 warning。agent 产出的 MD 默认用 tolerant 模式。

### 6. `lintSlideSpecs` 支持 context-aware 校验

同一文件 `slide-specifications.md` 被两个 node 产出：wave0（允许 placeholder）和 wave1（禁止）。`lintSlideSpecs` 接受 `{ allowPlaceholders }` 选项，由映射表传入。

### 7. CLI 命令设计

```
ppt_flow lint --file <path> [--tolerant] [--json]
ppt_flow lint --run-dir <path> --node <id> [--tolerant] [--json]
```

不提供 `--state`（state.yaml 是 JS 产出）。失败时走现有 CLI error envelope。`--json` 输出给 agent 解析用。

## Risks / Trade-offs

1. **[风险] produces→path 映射表不完整** → 缓解：只有 5 个 MD 文件映射，覆盖面小、易验证；未映射 ID 返回 warning 不阻塞
2. **[风险] agent 可能跳过 lint CLI step** → 缓解：`outputs_linted` gate 在 checkExit 必定执行，agent 跳过 step 也会被 gate 挡住
3. **[取舍] CLI 命令数从 12→13** → `cli-surface` spec 需全面更新
4. **[取舍] PDCA 不实现在 JS 层** → agent 控制循环节奏和修复策略，比 JS 自动循环更灵活；代价是 agent 可能不遵循 3 轮上限——由 playbook 指令约束
