# Source scope and precedence

## 为什么 scope 是独立问题

同一个 `source_validation` 类别下，至少存在三种不同失效范围：

1. 一个 Page Source field 只影响一张 slide；
2. 一个 shared registry/config source 影响所有选择它的 slides；
3. 一个完整 package source 即使当前页面不选择其中某个 sibling，也可能按 contract 阻断整个解析。

如果 public diagnostic 只保留 reason code 或逐页 issues，就无法准确说明“改哪里”和“影响谁”。

## 当前解析优先级

Pure 和 Framed 的 source candidate 都按以下顺序解析：

```text
read slide-specifications.md bytes
  -> load and validate whole visual-language registry
  -> load and validate whole four-file presentation package
  -> parse every Page Source slide
       -> resolve selected identity reference
       -> resolve selected visual-language records
       -> resolve per-slide presentation projection
```

实现位置：

- candidate source read：
  `ppt_maker_harness/scripts/shared/image2/page_image_target_runtime.mjs:775-811`；
- Pure composition：`ppt_maker_harness/scripts/04-pure-image/index.mjs:605-624`；
- Framed composition：`ppt_maker_harness/scripts/03-framed-image/index.mjs:785-804`。

因此多故障 fixture 中，visual-language source failure 会先于 presentation 与 Page Source field failure；
presentation package-load failure会先于 per-slide parser issues。这一 precedence 是当前调用顺序产生的，
尚未发现一个跨 capability 的显式“source diagnostic precedence”规范。

## Visual Language：selected-record 语义与 whole-registry validation 的张力

Visual Config main spec 说 registry 应保留 selected-record invalidation，且“An unselected registry record
SHALL not invalidate a page”，见 `openspec/specs/visual-config/spec.md:22-27`。

隔离样本在 registry 中新增一个未被 Page Source 选择的 `unused-invalid` recipe，其 provider clause 含
禁用 token `headline`；页面仍选择原本合法的 `editorial-systems`。当前
`parsePageImageVisualLanguage()` 会先验证整个 registry 并抛
`content_overriding_visual_clause`，所以页面无法进入 selection：

```text
recipes.unused-invalid.provider_clause
  -> PageImageVisualLanguageError
  -> style_master_operation_failed / artifact / inspect
```

源码先完整 parse/verify 后才返回 registry：
`ppt_maker_harness/scripts/02-visual-system/internal/page_image_visual_language.mjs:364-397`。

这里至少存在一个需要澄清的契约张力：

- “unselected record 不影响 page”是否只约束 valid-record change 的 semantic digest；还是
- 也要求 invalid unselected record 不阻断 selected page。

本研究不先判定答案，但 public recovery 的影响范围取决于这个答案。若整个 registry 必须始终
schema-valid，diagnostic 应明确是 registry-level source failure；若 invalid unselected record 不应阻断，
当前行为本身是 CLI 之外的 resolver contract问题。

## Presentation：full-package validation 是明确要求

与 Visual Language 不同，presentation main spec 明确要求四个文件构成 one closed package，并在
projection 前验证完整 package，拒绝 missing/malformed/cross-file/cross-workflow facts，见
`openspec/specs/visual-config/spec.md:65-87`。

因此 Framed 解析可以被 malformed Pure sibling 阻断，反之亦然。这不是当然的误归因；它是当前
package contract 的预期 blast radius。public diagnostic仍需要指出 exact broken package source，而
不是笼统指向 `slide-specifications.md` 或 operation owner。

## Reference Material：selected profile source，却被复制成 per-slide issues

Reference resolver 只读取所选 profile directory 下的
`image2-reference-material.yaml`，见
`ppt_maker_harness/scripts/02-visual-system/internal/page_image_reference_material.mjs:222-256`。这本来是一个
shared selected-profile source root cause。

但 identity resolution 位于每张 slide 的 `resolveSelection()` 内；source parser 捕获异常后，为每张
slide 重新生成 issues。五页选择同一个 malformed registry 的隔离样本结果：

```text
1 malformed registry file
5 affected slides
6 owner parse issues per invocation
30 PageImageSourceError issues after aggregation
1988 characters in joined Error.message
```

如果把这些 issues 映射到现有 public shape，sanitizer 只保留前 20 个，`omitted_count: 10` 且
`truncated: true`。issue/byte bounds 见
`ppt_maker_harness/scripts/shared/cli/cli_error.mjs:299-355`。

这会把一个 shared source defect呈现成大量 slide-local `VISUAL BRIEF` defects，并且受 slide 顺序和
issue cap 影响。一个准确诊断可能需要区分：

- root source：selected profile registry；
- root reason：例如 invalid reference YAML；
- affected subjects：选择该 identity profile/role 的 slides；
- owner action：修复 shared registry，或在 selection 本身错误时修复 Page Source field。

如何表达尚未决定，但这四个维度不能由重复 message 可靠推导。

## Reference owner 还缺 physical source locator

Visual Asset Management main spec 要求 invalid registry bytes 产生 bounded diagnostic naming the
registry path，见 `openspec/specs/visual-asset-management/spec.md:11-16`。

当前 `loadPageImageReferenceMaterial()` 知道 exact registry path，却直接调用
`parsePageImageReferenceMaterial(raw, {expectedProfile})`；parse error issues 没有接收或附加该 physical
path。malformed YAML owner error包含 logical paths和 parser messages，但没有实际文件 locator。随后
source parser 又把它们全部改成 `slide-specifications.md / VISUAL BRIEF`。

实现证据：

- parse function：`page_image_reference_material.mjs:203-219`；
- loader exact path：同文件 `:243-256`；
- source rewrite：`page_image_source.mjs:670-700`。

因此这里存在两次不同的信息缺口：producer 未绑定 physical source，consumer-side aggregation又绑定
了错误 physical source。

## Reason code 不能单独确定 scope

`content_overriding_visual_clause` 可以来自 shared visual-language registry，也可以来自 selected identity
reference registry。相同 code 的 repair source、affected slides和 logical field path都不同。

`page_image_presentation_header_field_forbidden` 的 code 来自 presentation resolver，但修复 owner 是
Page Source header/class fields。反过来，`page_image_presentation_source_missing` 的修复 owner 是
presentation package file。

所以 code-to-category/action mapping若不同时携带 producer context和locator，会继续制造第二归因器。

## 待澄清的 precedence 问题

- whole registry invalid 与 Page Source field invalid 同时存在时，哪个是 earliest independent failure？
- shared source有多个 parse issues时，应保留首个 root parse failure，还是完整 bounded set？
- 一个 shared defect影响多页时，affected subjects 是必要 control fact，还是仅用于解释？
- presentation full-package failure 是否应在 `style-master inspect` 与 `image2 plan` 使用完全相同 next？
- unselected Visual Language invalid record 的规范语义到底是全局 source invalid，还是 selection-isolated？

这些问题必须在确定 diagnostic bridge 或 classifier 之前解决，否则相同 raw error会在不同入口得到
不稳定的影响范围和修复 source。
