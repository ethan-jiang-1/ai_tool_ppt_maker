# Design: Project validate source/state observation

## 决策概览

| 决策 | 结论 | 拥有侧 |
|---|---|---|
| validate 两段投影 | source-only candidate parse → source/state identity binding，两段独立呈现 | JS（commandValidate + 既有 target runtime evaluator） |
| Source-invalid | 复用 Change 1 problem-fact 投影（`source_validation`/`edit_source`），优先于任何 state 结果 | JS（cli-surface 投影） |
| Source-valid/state-stale | exit 1 + reason `target_source_state_identity_mismatch` + owner rebind next + additive `source_valid: true` | JS（cli-surface envelope） |
| Source-valid/state-current | exit 0 + 既有 human text，无 additive observation | JS |
| `source_valid` 字段 | additive bounded boolean，仅 state-stale envelope 投影 true；省略规则明确；非授权 | cli-surface |
| H-2 | node-specification R18 `--check-gates` → `--validate-state`；state.mjs 头部注释同步 | MD⇔JS protocol |
| M-3（触及范围） | 触及 requirement 内 retired `mode` → selected workflow | MD⇔JS protocol |
| 零写入 | validate 不写 state/receipt/plan/`_generated/`，不初始化 provider | JS |

## 1. commandValidate 重构

现状（ppt_flow.mjs :888-900）：`operations.resolveSource(route.run_dir)` 一步完成
source parse + state 绑定；失败时 `emitFailed` 输出 message prose envelope（无分类/next）。

重构后：

```js
async function commandValidate(runDir) {
  const route = await resolveRunAdapter(runDir, "ppt_flow.validate.identity");
  if (!route) return 1;
  const operations = await targetImage2Operations(route.workflow);
  let candidate;
  try {
    candidate = operations.resolveCandidateSource(route.run_dir);   // source-only
  } catch (error) {
    return emitSourceValidationFailure("ppt_flow.validate.page-image", error);  // Change 1 投影
  }
  try {
    const source = operations.resolveSource(route.run_dir, { candidate });  // 绑定复用 candidate
    console.log(`✓ Target Page Image ${route.workflow} receipt validated: ${source.receipt.slides.length} slide(s)`);
    return 0;
  } catch (error) {
    if (error?.message === "TARGET_SOURCE_STATE_IDENTITY_MISMATCH") {
      return emitSourceStateStaleEnvelope(route, candidate);
    }
    throw error;
  }
}
```

- `resolveCandidateSource`：operations 表新增（adapter 已有 `resolveFramedTargetCandidateSource`/
  `resolvePureTargetCandidateSource`，只需在 targetImage2Operations 表暴露）。source-only，
  不触碰 state/evidence。
- `resolveSource({ candidate })`：既有 resolveTargetSourceContext 会重新 parse；为避免双 parse，
  理想是传 candidate 复用——但既有签名不接受；实现时选择最小改动：第二次调用仍走既有
  resolveSource（双 parse 代价可接受，validate 是离线命令），或者给 resolveTargetSourceContext
  加可选 candidate 参数。**决策**：最小改动优先——第二次调用既有 resolveSource；candidate 仅用于
  source-invalid 判定与 state-stale 时生成 `source_valid` 事实（slides 数、receipt sha）。
- `emitSourceValidationFailure`：复用 `projectProblemFactsDiagnostic`（Change 1 helper）——
  error 携带 problemFacts 时发出 `source_validation`/`edit_source` envelope；无 facts 时回退
  bounded internal（fail closed）。
- `emitSourceStateStaleEnvelope`：构造 final envelope：
  - `code: FAILED`、`message`/`hint` 有界文案；
  - `diagnostic: { schema, category: "artifact", operation: "validate",
    reason: { kind: "target_source_state_identity_mismatch" },
    source: { path: join(runDir, "slide-specifications.md") },
    subject: { kind: "page-image-validate", id: workflow },
    source_valid: true,
    next: { action: "repair_prerequisite", requires_human: false,
      default: "Rebind source/state identity through the owner (image2 plan), then rerun validate.",
      invocation: { program: "node", args: [__filename, "image2", "plan", runDir] } } }`
  - 单信封、exit 1、stdout 空由 cli_bootstrap 既有机制保证。
- **拆分投影的边界**：仅 `TARGET_SOURCE_STATE_IDENTITY_MISMATCH`（BUG-069 现场）进入
  state-stale envelope；`TARGET_SOURCE_STATE_WORKFLOW_MISMATCH`、
  `TARGET_SOURCE_STATE_DRAFT_REQUIRED` 等其他绑定错误保持既有 emitFailed 行为（不扩大范围）。
- 未知/其他 error：保持既有 emitFailed 行为（不扩大范围）。

## 2. `source_valid` additive 字段

- 只投影 `true`；其他 envelope 一律省略（source-invalid、state-current、其他命令均无此字段）。
- 兼容/cutover：schema 保持 unversioned `pptmaker-cli-diagnostic`；该字段是 producer 侧 additive
  输出，consumer（node-specification delta）明确容忍并视为非权威 observation；无双写双读。
- bounds：boolean 无文本风险；message/hint 保持有界。

## 3. H-2 / M-3 修正

- node-specification R18：`--check-gates` → `--validate-state`；"infer mode" → "infer a selected
  workflow"（触及范围内 M-3）。
- `state.mjs:69` 头部注释 `[--json|--check-gates]` → `[--json|--validate-state]`。
- 全仓 `--check-gates` grep 清零（实现注释 + spec）。
- 不做全仓 `mode` 术语扫荡（M-3 范围外项留给 legacy audit）。

## 4. 验证策略

- **进程矩阵**（tests_e2e/shared/workflow 或 process tier）：
  1. source-invalid：损坏 registry/语法 → validate exit 1、`source_validation`/`edit_source`、
     exact owner/locator、单信封、空 stdout。
  2. source-valid/state-current：完整合法 run → exit 0、human text。
  3. source-valid/state-stale：先建 evidence（style master + plan），改 source → validate
     exit 1、reason `target_source_state_identity_mismatch`、`source_valid: true`、rebind next、
     完整 fixture tree 字节不变、无 provider call。
  4. 优先级：同时 source-invalid + state-stale → source problem 胜出。
- **文本断言**：`--check-gates` 在 specs/实现注释中不再出现；`--validate-state` 一致。
- **回归**：`npm test`、`npm run test:sweep`、process tier、mock e2e、`openspec validate --strict`。

## 5. Policy 合规

- `human-centered-gates.md`：state-stale = `hard-stop`（protected invariant：source/state
  identity 绑定不绕过、零写入、零 provider），唯一恢复 = owner rebind 后重跑同一 checkpoint；
  `source_valid` 不改变分类。
- `agent-assistance-and-control.md`：validate 复用既有 source-only evaluator 与 Change 1
  投影，不建立第二 evaluator/authority。
- `simple-reliable-control.md`：净简化——把混叠失败拆成两段投影 + 一个 owner next；additive
  字段有明确投影/省略规则与消费者容忍条款。
