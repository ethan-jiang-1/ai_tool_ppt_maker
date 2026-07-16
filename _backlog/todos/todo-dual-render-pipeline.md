# TODO: dual-render-pipeline

> 状态: 待设计 | 优先级: 中 | 更新: 2026-07-16
> 上游: `_backlog/plans/slide-identity-and-sequence-editing.md` | 下游: —

## Why

目前 PPT 产出只有一条路：GPT Image2 生图 → 整页图片塞进 PPTX。这条路视觉表达强，但慢且贵。

另一条路是 **HTML 渲染**——把 slide 内容渲染成 HTML 再截图/导出进 PPTX。这条路快、便宜、文字清晰稳定，适合文字密集型 deck。

两条路各有适用场景，不应该二选一——**应该两路都留着，让用户在 project 级别选择**。

## 现状对齐

- **Path A（Image2）已实现且成熟**：`stage2_generate_images.mjs` → `image_api_client.mjs` → Image2 API 生图 → `_generated/images/` → `build` 组装 PPTX
- **Path B（HTML渲染）完全不存在**：没有任何 HTML render engine、screenshot driver、HTML→PPTX 的代码
- `ppt_flow.mjs` 目前只有一条管线（`unified_pipeline.mjs`），没有"选路"概念
- `BOOTSTRAP.md` 已知限制里写了「Slides 是整页图片（设计选择，不是缺陷）」——但如果加了 HTML 路，这个就不再是唯一设计了
- `deck_*/3_versions/v1/slide-specifications.md` 有 `render.default` field，目前只支持 `full-page` / `body+header-lock`（都是 Image2 路）

## Current Direction

在 project metadata 或 slide spec frontmatter 加 `render.engine` 字段：
- `image2` — 走现有管线（默认，保持兼容）
- `html` — 走 HTML 渲染管线（新）

两条管线：
1. **共享上游**：slide spec 解析、prompt 生成（语义层是同一套）
2. **分叉在 Stage 2**：Image2 走 API 生图；HTML 走 headless browser 渲染 + 截图
3. **下游合流**：都产 PNG，都用同一个 `build` 组装 PPTX

页面身份和页序不由本 TODO 重新定义。两路都消费共同的 stable slide model：
- `slide_id` 是跨重排/跨版本稳定身份
- `position` 是当前 deck 的可变顺序
- artifact 以 `(slide_id, render_engine, artifact_kind, fingerprint)` 寻址；至少区分 `raw-render` 与 `final-slide`
- build 按当前 position 排序，再按 resolved engine 选取该 ID 的产物

这意味着仅重排页面时，两路已验证的昂贵 raw render 可 materialize；Stage 3 final 与后续便宜产物在 target 本地重跑，不能因为 `07 -> 03` 就重新跑 Image2 或远端 HTML。只能定位旧文件的 `legacy-located` 状态不等于 verified provenance。

结构 apply、impact 和 materialization 均不得暗中调用 renderer。缺失或无法证明的 engine/kind artifact 先报告 `needs_render`，再由用户明确授权的 refresh 产生远端成本；双渲染的 sequential/parallel 策略不能绕过这个授权边界。

后续可扩展：
- **per-slide override**：某页用 image2、某页用 html（混合 deck）
- **sequential vs parallel 选择权给用户**：`--render-mode sequential|parallel`（sequential = 先 html 产草稿快看 → 再到 image2 精修；parallel = 两路同时跑）
- **CLI 入口**：`ppt_flow.mjs build --engine html|image2|both`

## Design Questions

1. HTML render engine 用什么？Puppeteer/Playwright 截屏？还是直接用 pptxgenjs 原生排版（不经过图片）？
2. HTML 模板系统怎么设计——跟 visual preset 的 `deck_system.txt` 是什么关系？是另写一套 CSS 主题，还是从 `deck_system.txt` 编译出 CSS？
3. Per-slide override 的时候，同一页 html 版和 image2 版共存（两个文件），build 时选哪个？
4. "用户选 sequential vs parallel"这个交互放哪？intake 时问？还是 CLI flag？
5. HTML 路的中文支持天然比 Image2 好——这个差异要不要在 intake 时就提示用户？

## 与页面增删重排计划的关系

详见 [`../plans/slide-identity-and-sequence-editing.md`](../plans/slide-identity-and-sequence-editing.md)。两件事一起设计、分两个 change 实施：

1. 先落 stable slide ID、derived position、结构编辑事务和 ID-keyed artifact resolution。
2. 再实现 Image2 / HTML 两个 render adapter。
3. sequential / parallel / per-slide override 只决定显式 refresh 时生成与选择哪种 artifact，不改变页面身份、顺序模型或结构阶段的零远端调用规则。

如果反过来先做双渲染，两套 renderer 很容易各自继承 `NN_<id>.png` 的顺序耦合，后续重排需要同时迁移两套路由、缓存和 review evidence。

## Non-Goals

- 不删 Image2 路
- 不要求 HTML 路做到 Image2 同等的视觉丰富度（它是速度/成本换质量）
- 不改变现有 `_generated/` 目录结构（HTML 产物另放子目录）

## Next Step

先从页面计划起 OpenSpec change `add-stable-slide-identity-and-order-editing`。其 stable model / artifact interface 定稿后，再起 `add-dual-render-pipeline` 做详细设计。
