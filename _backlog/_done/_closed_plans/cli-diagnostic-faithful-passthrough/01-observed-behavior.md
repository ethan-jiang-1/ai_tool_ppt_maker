# Observed behavior

## 方法

调查使用 `initBundle()` 在系统临时目录分别建立 Pure 和 Framed run bundle。每个失败场景都独立
建立 fixture，然后执行：

```text
node ppt_maker_harness/scripts/ppt_flow.mjs style-master inspect <run-dir>
node ppt_maker_harness/scripts/ppt_flow.mjs style-master plan <run-dir> --candidate-count 0
node ppt_maker_harness/scripts/ppt_flow.mjs image2 plan <run-dir>
```

每次调用前后都对整个 deck fixture 建立快照。快照记录每个目录、symlink target，以及每个普通
文件的 mode、size 和 SHA-256；差异集合必须为空才记为 `tree_unchanged`。fixture 执行后删除。

## 公开结果总表

Pure 与 Framed 在下表四个场景中的结果一致，因此表中合并表示：

| 失败场景 | 边界处实际 error | `style-master inspect/plan` | `image2 plan` | 公开 source/issue | 文件树 |
|---|---|---|---|---|---|
| `VISUAL BRIEF` 选择未登记 recipe | `PageImageSourceError`, 只有 `issues[]` | `artifact`, `style_master_operation_failed`, `inspect` | `internal`, `page_image_operation_failed`, `report_internal` | 无 | 不变 |
| visual-language registry clause 含 `headline` | `PageImageVisualLanguageError`, 只有 `issues[]` | 同上 | 同上 | 无 | 不变 |
| presentation package 缺 selected workflow file | `PageImagePresentationError`, 有顶层 code | `internal`, 保留 `page_image_presentation_source_missing`, `report_internal` | 同左 | 无 | 不变 |
| identity reference registry role clause 含 `readable` | owner 先抛 `PageImageReferenceMaterialError`，parser 后抛 `PageImageSourceError` | 与无顶层 code 场景相同 | 与无顶层 code 场景相同 | 无 | 不变 |

所有 24 次调用都满足：exit status `1`、stdout 精确为空、stderr 最后一行是一个受支持的 JSON
failure envelope、文件树字节不变。

## 场景 1：Page Source 本身无效

fixture 将 `VISUAL BRIEF.recipe` 改成 `missing-recipe`。边界处 error 已经包含相当完整的 field-level
事实：

```json
{
  "name": "PageImageSourceError",
  "code": null,
  "issues": [{
    "code": "unregistered_visual_recipe",
    "source": { "path": "slide-specifications.md", "line": 10, "column": 1 },
    "subject": { "kind": "slide", "id": "DeckGo", "field": "VISUAL BRIEF" },
    "repair_hint": "repair the Page Image source field before requesting raw Image2 work"
  }]
}
```

但是 `styleMasterFailure()` 和 `targetPageImageFailure()` 都只读顶层 `error.code`，所以这些 issues
没有进入公开 envelope。源码依据：

- `PageImageSourceError` 只保存 `issues`：
  `ppt_maker_harness/scripts/01-content/internal/page_image_source.mjs:81-87`。
- field-level issue 本身含 source/subject/actual/expected/repair hint：同文件 `:122-138`。
- Style Master fallback：`ppt_maker_harness/scripts/ppt_flow.mjs:3159-3165,3304-3331`。
- Image2 fallback：同文件 `:1697-1704,1916-1927`。

这直接冲突于 content-parsing main spec 对 invalid visual ingress 的结果要求：应返回 field-level visual
repair action，并且不创建 receipt/route/provider input，见
`openspec/specs/content-parsing/spec.md:179-204`。

## 场景 2：Visual Language source 无效

fixture 把默认 recipe clause 的 `quiet depth` 改成 `quiet headline depth`。resolver error 是：

```json
{
  "name": "PageImageVisualLanguageError",
  "code": null,
  "issues": [{
    "code": "content_overriding_visual_clause",
    "path": "recipes.editorial-systems.provider_clause",
    "actual": "architectural editorial scene, layered amber and cobalt light, quiet headline depth"
  }]
}
```

当前公开 envelope 不保留 issue code、registry path 或 source owner。Style Master 的 next invocation
是 `style-master inspect`；对 `inspect` 本身，这一 invocation 与刚失败的命令具有相同失败前置条件。
对 `plan`，转去 `inspect` 后仍进入同一 fallback。因此这不是 owner 已证明可前进的恢复动作。

Visual Config main spec 要求 invalid selected visual source 返回 bounded source repair action，见
`openspec/specs/visual-config/spec.md:50-63`。当前结果把 source failure 分别公开成 artifact inspection 或
internal report。

## 场景 3：Presentation source 缓存了 code，仍被错误分类

fixture 删除 Pure 的 `pure-deck-visual-system.yaml` 或 Framed 的 `framed-header-profiles.yaml`。
`PageImagePresentationError` 与前两类不同：它有顶层 `code`、`details` 和 `issues`：

```json
{
  "name": "PageImagePresentationError",
  "code": "page_image_presentation_source_missing",
  "details": {
    "source": "<exact selected source path>",
    "actual": "ENOENT"
  }
}
```

CLI 因而保留了 `reason.kind`，但两个 classifier 都没有把 `page_image_presentation_*` 识别为
source/configuration failure，最终仍返回 `internal/report_internal`。这证明缺口不只是“typed error
没有顶层 code”。

Presentation package 是四文件完整包，并在 dependent planning 前完整验证：
`openspec/specs/visual-config/spec.md:65-106`。缺失或 malformed Pure system 还被明确要求保留 source、
existing evidence 和 source/configuration repair-and-rerun action：同 spec `:298-311`。

## 场景 4：Reference owner 在 parser 聚合时丢失

fixture 建立合法的 `test-agent/guide` identity reference，再把 registry 的 `role_clause` 改成
`readable label`。reference owner 原始 error 是：

```json
{
  "name": "PageImageReferenceMaterialError",
  "code": null,
  "issues": [{
    "code": "content_overriding_visual_clause",
    "path": "profiles.test-agent.roles.guide.role_clause",
    "actual": "readable label"
  }]
}
```

但 `parsePageImageSource()` 的 `resolveVisualBrief()` 捕获任意带 `issues[]` 的 error 后，只复制
`detail.code` 和 `detail.message`，并重新生成一个 source issue：

```json
{
  "name": "PageImageSourceError",
  "issues": [{
    "code": "content_overriding_visual_clause",
    "source": { "path": "slide-specifications.md", "line": 10, "column": 1 },
    "subject": { "kind": "slide", "id": "DeckGo", "field": "VISUAL BRIEF" }
  }]
}
```

原 registry path、`actual` 和 reference-material owner 都已在 CLI 之前消失。代码位置：
`ppt_maker_harness/scripts/01-content/internal/page_image_source.mjs:670-700`。

Visual Asset Management main spec 要求 invalid role clause 返回 owning bounded failure，且不推断其他
role 或使用历史成功结果，见 `openspec/specs/visual-asset-management/spec.md:53-83,110-117`。当前 parser
把 repair surface 指向 Page Source 的 `VISUAL BRIEF`，但改这个字段并不能修复 registry role clause。

## 补充场景：resolver catch 还会改错 Page Source field

又执行了 9 次隔离调用，覆盖一个 Framed header-field conflict，以及 Pure/Framed 的未登记 identity
role。三个命令的公开 fallback 与上表相同，stdout 为空，文件树仍全部不变。

### Framed opening subtitle

fixture 使用 `PAGE CLASS: opening`，同时提供 `SUBTITLE`。presentation owner 原始 code 是
`page_image_presentation_header_field_forbidden`，message 也明确指出 subtitle 是不允许的 Page Source
literal。按 Visual Config main spec，应在 raw planning 前返回 field-level Page Source repair，见
`openspec/specs/visual-config/spec.md:220-225`。

实际进入 Style Master scope 的 `PageImageSourceError` 却是：

```json
{
  "code": "page_image_presentation_header_field_forbidden",
  "source": { "path": "slide-specifications.md", "line": 10, "column": 1 },
  "subject": { "kind": "slide", "id": "DeckGo", "field": "VISUAL BRIEF" }
}
```

真正应定位的 source field 是 `SUBTITLE`（并需要关联 `PAGE CLASS`），不是 `VISUAL BRIEF`。因此即使
未来把该 issue 暴露给 CLI，当前聚合结果也还不是 faithful field-level fact。

### Unregistered identity role

fixture 建立合法的 `test-agent` registry，但 Page Source 选择 `test-agent/absent-role`。这次可修 owner
确实可以是 Page Source 的 `VISUAL IDENTITY` 字段；然而聚合结果仍把 subject field 写成
`VISUAL BRIEF`，并丢掉原 error 的 `actual: absent-role`。

这两个样本证明 `resolveVisualBrief()` 不是只把 registry source 错误误归给 Page Source；它也会把
本来属于 Page Source 的错误定位到错误字段。原因是同一个 catch 包住了 identity reference、visual
language selection 和 per-slide presentation resolution，然后无条件使用 `VISUAL BRIEF`。代码见：

- Pure resolver composition：`ppt_maker_harness/scripts/04-pure-image/index.mjs:605-624`。
- Framed resolver composition：`ppt_maker_harness/scripts/03-framed-image/index.mjs:785-804`。
- 统一 catch/rewrite：`ppt_maker_harness/scripts/01-content/internal/page_image_source.mjs:670-700`。
- presentation 原始 header-field details：
  `ppt_maker_harness/scripts/02-visual-system/internal/page_image_presentation.mjs:319-330`。

## 无写入结论的边界

本次 33 次调用证据只证明上述 provider-free failure fixture 在三个命令入口上没有改变 fixture 的目录或文件
字节。它不证明任意后续 lifecycle failure 都无写入，也不证明进程外环境没有 atime、日志或系统级
副作用。对本问题而言，可以确认没有 plan publication、state/receipt mutation 或 run-bundle 文件
变化。
