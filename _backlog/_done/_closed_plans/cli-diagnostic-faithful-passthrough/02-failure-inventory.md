# Failure inventory

## Error family shape

| Producer type | 顶层 `code` | `issues[]` | owner/source locator | 当前进入 CLI 前的形状 |
|---|---:|---:|---|---|
| `PageImageVisualLanguageError` | 否 | 是 | issue 可有 registry-relative `source`/`path` | 原样到达 Style Master/Image2 catch |
| `PageImageSourceError` | 否 | 是 | issue 有 Page Source locator、slide subject、field | 原样到达 catch |
| `PageImageReferenceMaterialError` | 否 | 是 | issue 可有 registry path、reference path、actual/expected | 经 source parser 时通常被聚合成 `PageImageSourceError` |
| `PageImagePresentationError` | 是 | 是 | `details.source` 可有 exact selected source | code 到达 catch；details 未进入当前 classifier |
| adapter/workflow errors | 通常是 | 不统一 | 依错误族而异 | 大多按顶层 code 的 prefix/set 分类 |

源码：

- Visual Language：`ppt_maker_harness/scripts/02-visual-system/internal/page_image_visual_language.mjs:34-40,62-70`。
- Page Source：`ppt_maker_harness/scripts/01-content/internal/page_image_source.mjs:81-87,122-138`。
- Reference Material：`ppt_maker_harness/scripts/02-visual-system/internal/page_image_reference_material.mjs:27-33,45-54`。
- Presentation：`ppt_maker_harness/scripts/02-visual-system/internal/page_image_presentation.mjs:45-52`。

这些 producer 并没有共同 error contract。相同的 `issues` 名称也不意味着相同的 public-safe shape。

## 信息在哪些步骤丢失

### 1. Visual Language parse

Visual clause normalization 抛 `PageImageVisualClauseError(code, message, context)`；registry parser 将其
转换成 issue `{code, message, path, actual: fullClause}`，见
`page_image_visual_language.mjs:135-170,173-193`。

这里已经出现一个重要差异：违规 token 只在 `message` prose 里，结构化 `actual` 是完整 clause。
因此“公开违规 token”不能从当前 fact shape 直接取得，除非解析 message 或公开完整 clause；两者都
尚未被证明符合 faithful/secret-safe 边界。

### 2. Reference Material 进入 Page Source parser

`createPageImageSourceResolver()` 在 `resolveSelection()` 中先解析 identity reference，再解析 visual
language，见 `page_image_reference_material.mjs:297-327`。随后 `resolveVisualBrief()` 对所有带
`issues[]` 的异常统一做如下转换：

- 仅复制 `detail.code` 和 `detail.message`；
- 丢弃 `detail.path`、`detail.actual`、`detail.expected`；
- source 固定成 Page Source document；
- subject field 固定成 `VISUAL BRIEF`。

源码：`page_image_source.mjs:670-700`。这一步会把 reference-registry defect 和真正的 Page Source
selection defect 合成同一种外观。它也包住 per-slide presentation resolution，所以会把 Framed
`SUBTITLE` / `PAGE CLASS` conflict 错标成 `VISUAL BRIEF`。同理，未登记 identity role 会丢掉
`VISUAL IDENTITY` field ownership。

### 3. CLI classifier

`styleMasterFailure()`：

```text
reason = normalize(error.code || "style_master_operation_failed")
```

随后任意 `style_master_*` 都进入 artifact/inspect，其他未登记 reason 进入 internal/report_internal。
源码：`ppt_maker_harness/scripts/ppt_flow.mjs:3159-3169,3304-3331`。

`targetPageImageFailure()`：

```text
reason = normalize(error.code || "page_image_operation_failed")
```

随后依赖 hard-coded sets/prefixes；未匹配 reason 进入 internal/report_internal。源码：同文件
`:1529-1537,1539-1611,1697-1707,1916-1927`。

这两个函数都不读取 `error.issues`、`error.details` 或 `error.cliDiagnostic`。

### 4. Public sanitizer

共享 CLI sanitizer 已支持 bounded `source`、`subject`、`reason`、`issues`、`lineage` 和 `next`，并对
数量和总字节设上限，见
`ppt_maker_harness/scripts/shared/cli/cli_error.mjs:97-227,256-355`。它还定义了
`attachCliDiagnostic()` / `diagnosticFromError()`，见同文件 `:501-508`，但仓库当前没有发现
`diagnosticFromError()` 的调用者。

“sanitizer 能接收某字段”不等于“任意 producer field 已获准公开”。它只说明 public envelope 已有
承载受支持事实的结构能力。

## 字段安全性并不均一

| 内部字段 | 当前内容实例 | 直接公开风险 |
|---|---|---|
| `issue.code` / `error.code` | `content_overriding_visual_clause` | 通常是 bounded token，但仍需登记语义与 owner |
| Page Source `source` | path + line/column + byte/range | public schema 只支持 path/line/column；range 不是现有 public field |
| registry `path` | `recipes...provider_clause` | 是逻辑 YAML path，不是现有 locator `{path}` 的同一语义 |
| `actual` visual clause | 完整 visual prose | 可能包含 author/config prose；不能因 sanitizer 可截断就默认公开 |
| presentation `details.actual` | `ENOENT` 或 YAML parser message | 错误类别混合 OS token和 parser prose，不能统一看成 safe scalar |
| reference `actual` | role clause、SHA、profile object 或 path | 类型和敏感度不稳定 |
| `Error.message` | 拼接的所有 issue prose | 可能含完整 clause、文件路径、parser/fs 文本；不是稳定 schema |
| `repair_hint` | Page Source 固定 hint | 对 reference registry 聚合场景会指错 owner |

CLI sanitizer 的 `SECRETISH_RE`、字符数和总字节限制能阻止部分明显泄露，但它不能判断某段普通视觉
prose是否应该公开，也不能修正错误 owner。源码：`cli_error.mjs:78-88,97-106,117-170`。

## 当前已知 failure classes

### Page Source owned

- 未登记 recipe/composition/motif/relationship。
- `VISUAL BRIEF` shape/order/enum/content ingress 错误。
- header/page-class/identity count/restriction 等 field-level 错误。

这些 error 已经有 slide/field locator；公开 CLI 当前完全丢失。

但经过 resolver catch 的 Page Source-owned selection error 是例外：未登记 identity role 的正确字段
应是 `VISUAL IDENTITY`，当前聚合却生成 `VISUAL BRIEF`。不能假设所有 `PageImageSourceError.issues`
都已具有正确 field ownership。

### Visual Config owned

- visual-language source unreadable/YAML/schema/record/cross-reference/clause 错误。
- presentation four-file package missing/YAML/schema/profile/cross-file/geometry 错误。
- Page Design System source failures已经有单独 classifier，形成一个可比较的已工作先例。

Presentation error 还分两条传播路径：package-load failure 直接保留顶层 code；per-slide
`resolvePageImagePresentation()` failure 会被 source parser 捕获并降级成无顶层 code 的
`PageImageSourceError`。同一 producer family 不能只按 class name 或 code presence 归纳。

### Visual Asset Management owned

- reference registry unavailable/invalid。
- profile/role 未登记。
- path escape/missing bytes/SHA mismatch。
- role clause 无效、subject count/restriction incompatible。

这类 failure 目前很可能先被 source parser 重新定位，因此需要分别审计 owner error 和聚合后的
Page Source error，不能只看 CLI catch 中拿到的对象。

### Operation/lifecycle owned

- Style Master plan/grant/attempt/head/selection failures。
- progressive raw plan/batch/grant/attempt/review/reconcile failures。

这些不是本轮 source/configuration fixture 的同一类事实。已有 classifier 为其中许多 error 绑定了
operation-specific next；调查不能为了统一形状而假定 source producer 自己拥有 lifecycle next。
