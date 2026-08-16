# Public shape compatibility

## 问题

相邻计划使用了“保留 issues path/token/source fact”与“faithful passthrough”等措辞。但内部四个
producer family 的 issue shape 与 public `pptmaker-cli-diagnostic.issues[]` 并不相同。必须先验证：
把真实内部 issues 原样交给现有 sanitizer 后，哪些事实实际能存活。

## Public issue 接受的字段

`sanitizeIssue()` 只读取：

```text
message
subject { kind, id?, field? }
source { path, line?, column? }
reason { kind, actual?, expected? }
lineage[]
```

其他字段被静默丢弃。源码：
`ppt_maker_harness/scripts/shared/cli/cli_error.mjs:214-227`。顶层 diagnostic 另有一个
`reason`，同样只支持 `{kind, actual?, expected?}`，见同文件 `:161-170,256-283`。

内部 issue 常见字段则是：

- Page Source：`severity/code/message/source/subject/actual/expected/repair_hint`；
- Visual Language：`code/message/source?/path?/actual?/expected?`；
- Presentation：`code/message/...details`，其中 `source` 是 string；
- Reference Material：`code/message/path?/actual?/expected?`。

因此同名 `issues[]` 不是同一个 schema。

## 实验

对四个真实 error fixture，构造一个合法的
`source_validation/edit_source` diagnostic，把 `error.issues` 不做转换地传给
`sanitizeCliDiagnostic()`。

| Error family | 原始关键事实 | sanitizer 后实际保留 |
|---|---|---|
| `PageImageSourceError` | code、message、slide/field、source line、repair hint | message、slide/field、source path/line/column |
| `PageImageVisualLanguageError` | code、message、logical path、完整 clause actual | 只有 message |
| `PageImagePresentationError` | code、message、absolute selected source string、`ENOENT` | 只有 message |
| `PageImageReferenceMaterialError` | code、message、logical path、role-clause actual | 只有 message |

代表性 Visual Language 输入：

```json
{
  "code": "content_overriding_visual_clause",
  "message": "recipes.editorial-systems.provider_clause: must not prescribe source content token \"headline\"",
  "path": "recipes.editorial-systems.provider_clause",
  "actual": "architectural editorial scene, layered amber and cobalt light, quiet headline depth"
}
```

sanitizer 输出：

```json
{
  "message": "recipes.editorial-systems.provider_clause: must not prescribe source content token \"headline\""
}
```

这不是 secret filtering 导致的偶然丢弃，而是字段形状不匹配：internal `code` 没有映射到 public
`reason.kind`，internal `path` 既不是 `{path}` locator，也没有 public logical-field slot，internal
`actual` 没有嵌套到 `reason.actual`。

## 直接含义

### 原样 passthrough 不成立

在当前 schema 下，直接传 `error.issues` 会产生“看似有 issues、实则只剩 prose”的结果。consumer
仍只能读 message，而 main spec 明确禁止 consumer 从 prose 派生 recovery。因此这条路径既不 faithful，
也不能满足 machine-consumable owner fact。

### 转换不是无语义搬运

要让现有 public shape表达同等事实，至少要决定：

- internal code 是顶层 `diagnostic.reason.kind`，还是每个 issue 的 `reason.kind`；
- physical source file 是 `diagnostic.source`，还是 issue `source`；
- logical registry path 应映射到 `subject.field`，另一个字段，还是不公开；
- `actual/expected` 哪些类型可进入 public reason；
- 多个不同 code 的 issues 如何与单一顶层 reason 共存。

这些决定涉及 owner、聚合和安全语义，不是 mechanical passthrough。

### Public schema 可能足够，也可能不足

现有 schema 已能表达 physical locator、subject field、bounded reason 和多个 issues；Page Source issue
的大部分定位事实可以映射进去。但它没有明确的 logical YAML path、producer owner 或 typed source
kind字段。是否通过现有 `subject`/`lineage` 组合表达，还是需要 public additive field，必须由 spec 决定；
本研究不预选答案。

## Code 也不是唯一 owner key

静态 inventory 还显示 `content_overriding_visual_clause` 同时由 Visual Language registry 和 identity
Reference Material 产生；`missing_visual_brief` 同时可能来自 Page Source grammar 和 visual selection。
因此即使所有 error 都加顶层 code，单凭 code 仍不能唯一恢复 source owner 或 locator。

当前代码中至少有 38 个 Visual Language issue code、21 个 Presentation code 和 31 个 Reference
Material code；Page Source 另有 grammar/field issue family及从 resolver 转入的 code。这个规模也说明
仅靠不断扩充 `ppt_flow.mjs` prefix/set classifier 会形成第二份容易漂移的 taxonomy。

## 现有测试说明的 public 预期

shared CLI 测试明确用 public issue shape：

```js
{
  message,
  subject: { kind, id, field },
  source: { path, line },
  reason: { kind, actual, expected },
  lineage
}
```

并断言额外 nested field 被忽略、issues 最多 20、inspect 最多 16、总 diagnostic 不超过 16 KiB，见
`tests/shared/cli/test_process_cli_error.mjs:158-185`。因此内部 issue 若要进入 public surface，必须先
成为这个已登记 shape，不能靠对象字段恰好同名。

## 尚未决定

- 是否应建立一个共享 problem-fact contract。
- contract 应属于哪个 capability/module。
- public schema 是否需要加字段。
- 多 issue 如何选择 top-level reason和 exact next。
- 哪些原始 message/actual/path 应被省略或替换成 bounded摘要。

可以确定的只有：现状既不是 raw passthrough，也没有现成的 shape-compatible bridge。
