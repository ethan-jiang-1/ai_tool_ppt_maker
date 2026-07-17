# 专题 02: Slide 内容与 Layout 模型

> 总控: [`../html-first-progressive-rendering.md`](../html-first-progressive-rendering.md)
> 状态: 决策完成 | 更新: 2026-07-17

## 当前缺口

当前 L2 `CONCEPT` 只表达认知意图，准确 body 文案和构图通常藏在自由文本 L3 `IMAGE PROMPT` 中。HTML 如果解析 prompt 猜测正文，会形成第二套内容真相，也无法稳定校验容量。

新 deck 必须显式声明：

```yaml
production:
  pipeline: html-first-v1
```

每页新增机器可读、Agent authoring 的 `SLIDE BODY` YAML：

- `CONCEPT` 继续服务叙事与创意判断。
- `SLIDE BODY` 是准确可见内容和 layout 的唯一执行真相。
- 新 deck 不再要求 `IMAGE PROMPT`。
- 旧 deck 保留原字段和旧解析路径，不由 JS 猜测迁移。

## 示例

````markdown
## Slide 05: `UXGap`

**KICKER**: THE GAP
**TITLE**: Buyers cannot discover capabilities that data does not describe.

**CONCEPT**:
- MUST communicate: ...
- MUST NOT: ...
- Bridge from previous: ...
- Bridge to next: ...

**SLIDE BODY**:
```yaml
schema_version: 1
family: split
mode: text-visual
text:
  heading: What buyers see
  bullets:
    - Generic capability claims
    - PDF-only specifications
callout: Discovery is now a data problem.
primary_visual:
  placement: right
  brief: A precision part emerging from an orderly data lattice
  fit: cover
  focal_point: [0.5, 0.5]
  fallback:
    kind: icon-composition
    asset_ids: [precision-part, data-lattice]
  selection: null
```
````

## Layout family registry

v1 只支持经过测试的 family，不允许每页任意 HTML：

| Family | 典型用途 |
|---|---|
| `hero` | opener、divider、closer；可有满版主视觉，文字仍由 HTML overlay |
| `split` | 左右双栏、文字 + 主视觉 |
| `cards` | 2-4 个并列要点或原则 |
| `kpi` | 1-3 个大数字及解释 |
| `comparison` | before/after、option 对照、风险/缓解 |
| `flow` | 3-5 步流程或机制 |
| `timeline` | 阶段、里程碑、路线图 |
| `data` | 图表、证据、趋势与标注 |
| `quote` | 案例、引语、关键证言 |
| `visual-focus` | 一个主要视觉 + 少量结构化说明 |

每个 family 的完整字段和容量合同由 [`02a-layout-family-contracts.md`](02a-layout-family-contracts.md) 单独拥有。本文件只固定共同规则：

- 允许与必填字段
- 列表、卡片、步骤和数据系列数量
- 可用主视觉位置
- 字体与几何容量限制
- fallback renderer
- overflow 检查

`VISUAL TYPE` 继续表达叙事职责，`family` 只表达确定性布局结构。`data` family 使用固定版本的 ECharts SVG renderer 并禁用动画；精确数据图表不得交给 Image2。

## 主视觉区

- 一页最多一个 `primary_visual`。
- `brief` 不得包含需要准确呈现的文字、数字、流程标签、图表刻度或品牌标志。
- `fallback` 必须能由本地 CSS、SVG、图标、图表或已登记资产生成完整 HTML 成品。
- `selection: null` 表示使用 HTML fallback。
- 接受 Image2 后，`selection` 是 `{asset_id, accepted_for, output_sha256}`，其中 `accepted_for` 绑定当前 visual contract fingerprint；它不指向 `_generated` 路径。
- Image2 prompt 由 `brief + CONCEPT + visual_config + slot geometry` 派生，不从另一份手写 body prompt 读取内容。
- Image2 输出不得含可见文字。`fit` v1 只允许 `cover`；`focal_point` 是 `[0..1, 0..1]`，让确定性 compositor 在标准生成画幅裁入不同 slot 时保留主体。

即使 `hero` 使用满版主视觉，kicker/title/subtitle 仍由 HTML overlay；Image2 不重新取得标题所有权。

### Visual contract fingerprint

Stage 1 对每个主视觉区计算 renderer-neutral 的 `visual_contract_fingerprint`，覆盖：

- `brief`、`placement`、`fit`、`focal_point`
- family 与 resolved slot geometry
- 影响视觉语义的 `CONCEPT.MUST communicate/MUST NOT`
- family registry 为该 slot 声明的 visual-config dependency projection（只含影响构图或期望画面风格的 tokens）

dependency projection 必须是 versioned、可测试的 allowlist，不能对整份 config 粗暴 hash。fingerprint 不覆盖 position、header/body 精确文字、speaker notes、Image2 model/profile、style reference 或生成时 reference assets。精确正文若改变了主视觉应表达的语义，Agent 必须同步更新 `brief` 或 `CONCEPT`，而不是让 JS 猜正文是否相关。

`selection.accepted_for` 必须等于当前 visual contract fingerprint 才生效；不匹配时保留 source 中的历史 selection，但 resolver 返回 `stale` 并使用 HTML fallback，直到用户重新接受或清除 selection。Image2 特有输入另形成 `generation_fingerprint = visual_contract_fingerprint + derived prompt + provider profile + style-reference SHA + declared reference-asset SHAs`；它用于候选 provenance 和去重，不决定已经由用户接受的正式资产是否继续生效。这样 Change 2 可以在没有 Image2 配置时独立完成，Change 4 再实现生成合同。

## Overflow 策略

HTML renderer 可以正常换行，但不得：

- 截断或省略正文
- 无限缩小字号
- 自动增加页面
- 自动改变叙事结构

超出 family 容量时阻断 final publication，并报告：

```text
position + slide_id + family + overflow slot + measured/allowed capacity
```

Change 2 先以 schema 数量和 Unicode grapheme 数量做结构 preflight；Change 3 的固定 browser profile 再执行像素级 overflow 测量。任一层失败都不得发布。Agent 可以缩短文案或更换 family。拆页会改变页序和叙事，必须进入 Structural Versioning Path 并由用户确认。

## Schema 验收边界

- 所有准确文字只出现于结构化 header/body 字段，不藏在 visual brief。
- family validator 对未知字段、错误类型和超量集合 fail closed。
- 结构化 source 经过 parse/serialize 后保留其他 Markdown 字节和 speaker notes。
- reorder 只改变 position projection，不改变 body/visual contract fingerprint。
- legacy 与 `production.pipeline: html-first-v1` 两个解析分支明确隔离，不静默混用。使用独立 `production` mapping，现有 `render.default/header-lock` 继续只属于 legacy Image2 render policy；HTML-first source 出现旧 render policy 时 fail closed 并要求显式迁移清理。
