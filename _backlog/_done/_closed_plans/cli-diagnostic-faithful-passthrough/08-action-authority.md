# Action authority

## 核心区别

调查必须分开两个问题：

1. **Problem-fact fidelity**：reason、source、subject、path、actual/expected 在跨层时是否保真；
2. **Recovery fidelity**：当前 operation 的一个合法 next action 是否由 owner 提供并被 CLI/consumer保留。

当前 source/config errors主要具备第 1 类内部事实，但没有统一的机器化第 2 类动作。因此“把 typed
error 忠实传到 CLI”本身不能自动产生 exact next。

## 各 error family 实际携带什么

| Family | problem code/facts | machine next | 备注 |
|---|---|---|---|
| `PageImageSourceError` | `issues[]`，含 code/subject/source/repair prose | 无 | `repair_hint` 是 string，不是 action contract |
| `PageImageVisualLanguageError` | `issues[]` | 无 | 无 category、source action、operation scope |
| `PageImagePresentationError` | 顶层 code + details + issue | 无 | exact source 有时存在于 details |
| `PageImageReferenceMaterialError` | `issues[]` | 无 | selected registry path并非始终绑定 |
| `StyleMasterPlanError` | 顶层 code +可选 details | 通常无 | lifecycle projection成功结果另有 `next_action` |
| `ProgressiveRawOwnerError` | 顶层 code +可选 details | 可选 `next_action` | action 是 domain owner shape，不是 CLI `next` shape |
| `PageImageTargetRuntimeError` | 顶层 code | 可选 `next_action` | 只在部分 runtime branch使用 |

构造器证据：

- source/config：
  `page_image_source.mjs:81-87`、`page_image_visual_language.mjs:34-40`、
  `page_image_presentation.mjs:45-52`、`page_image_reference_material.mjs:27-33`；
- Style Master：`ppt_maker_harness/scripts/shared/image2/style_master_plan.mjs:76-86`；
- progressive raw：
  `ppt_maker_harness/scripts/shared/image2/page_image_progressive_raw_owner.mjs:64-75`；
- target runtime：
  `ppt_maker_harness/scripts/shared/image2/page_image_target_runtime.mjs:86-92`。

## 当前 CLI 如何得到 next

### Style Master

`styleMasterFailure()` 根据 code 的 exact values和 prefixes自行决定 public category/next。fallback
`style_master_operation_failed` 因为也以 `style_master_` 开头，必然进入 generic artifact/inspect branch，
而不是 unknown/internal branch：

```text
missing error.code
  -> style_master_operation_failed
  -> reason.startsWith("style_master_")
  -> category artifact
  -> next inspect
```

源码：`ppt_maker_harness/scripts/ppt_flow.mjs:3159-3169,3304-3331`。

这解释了 self-loop 的机械成因，但不证明正确 next 已经存在于下层 error；事实上 source/config error
没有 machine next可供保留。

### Target image2

`targetPageImageFailure()` 对大多数 code 也通过 hard-coded sets/prefixes决定 category/next。无 code
fallback 进入 internal/report_internal，见 `ppt_flow.mjs:1529-1611,1697-1707,1916-1927`。

对 `progressive_raw*`，CLI 会读取 `error.next_action`，但主要使用它的 presence、`action_id` 和
`requires_human` 来再次映射 public action；并非把 domain action原样作为 public `next`。见同文件
`:1709-1759`。

### Delegated child

只有 child 已经发出完整 `pptmaker-cli-diagnostic` 时，parent 才能真正做到 exact public next
passthrough。该情形两端共享同一 public schema，与同进程 domain error不是同一种边界。规范：
`openspec/specs/cli-surface/spec.md:46-75`。

## Main spec 的语言与机器事实之间仍有空档

Source/config main specs多次要求 owner“returns bounded source repair action”或“field-level repair action”：

- Visual Language：`openspec/specs/visual-config/spec.md:50-63`；
- Presentation package：同 spec `:96-106,210-225,298-311`；
- Page Source visual ingress：
  `openspec/specs/content-parsing/spec.md:179-204`；
- Reference identity semantics：
  `openspec/specs/visual-asset-management/spec.md:110-117`。

但当前 module error contracts没有共同 action field，也没有 public diagnostic。可能的解释包括：

- “returns action”是端到端 CLI outcome要求，而不是低层 error shape；
- operation adapter应把 problem fact 与 operation action组合；
- 当前实现尚未落实 main spec；
- 不同 capability本来就允许不同组合点。

在没有 design/spec澄清前，不能默认某个解释。

## 现有 `attachCliDiagnostic()` 不是已证明的答案

共享 helper 提供 `attachCliDiagnostic(error, diagnostic)` 和 `diagnosticFromError(error)`，见
`ppt_maker_harness/scripts/shared/cli/cli_error.mjs:501-508`。

仓库搜索结果：

- `attachCliDiagnostic()` 只在 delivery notes runtime中使用；
- `diagnosticFromError()` 除定义外没有调用者；
- `ppt_flow` 的 Style Master/Image2 catch不读取 `error.cliDiagnostic`。

因此它目前不是一个端到端工作的通用 bridge。并且让低层 source resolver直接附着完整 CLI
diagnostic会让它同时拥有 public schema和 operation next，是否符合 boundary model仍需论证。

## 对研究问题的约束

任何后续方案都必须明确回答：

1. problem fact 在哪个模块成为稳定 machine contract；
2. domain operation next 在哪个 owner产生；
3. domain next 到 public CLI action是否需要映射，映射规则由谁拥有；
4. source/config precondition failure是否应绕过 Style Master/progressive lifecycle classifier；
5. unknown/unsafe fact如何 fail closed，而不把已知 source defect改写成虚假 lifecycle story；
6. 同一 source fact在 `style-master` 与 `image2` 入口是否共享 next，还是只共享 problem facts。

在这些问题解决前，“CLI 不再维护第二个归因器”是目标描述，不是完整可实施设计。
