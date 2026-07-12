## Why

用户（可能是小白）不应被迫理解“渲染模式”这种内部概念——他只需要提供 kicker/title/subtitle。今天 content 页一旦走 `full-page`，prompt 只说 `render all text`，没有统一的 header 位置、字号和左对齐纪律，导致图像模型跨页漂移。正确方向是：新 deck 默认用 full-page 完整生成，并给 content full-page 注入统一 header 软契约；真正漂移或必须保证清晰的页，再升级为脚本 header-lock。

这是一个明确的质量赌注：新 deck 默认从“脚本保证 header 清晰”翻到“提示词尽量稳定”。因此 header-lock 不是罕见 escape hatch，而是一等的按需硬兜底；默认翻转必须同时带可执行、可验证的 pilot header gate，不能只写在风险说明里。

## What Changes

- **新 deck 默认 `full-page`。** `--init` 在现有 YAML frontmatter 中写入有效的、未注释的 `render.default: full-page`。旧 deck 若完全没有 `render` 键，继续按 VISUAL TYPE 派生，保持结果不变。由此，`render` 键是否存在是明确的新旧行为分界，不再让“缺失”同时代表两种语义。
- **新增版本级 render 策略和固定级联。** Stage 1 按每页显式 `RENDER MODE` > `render.header-lock` 例外表 > hero 类型守卫 > `render.default` 的顺序解析。VISUAL TYPE 派生不是同一条 policy 级联的末档，而是仅在整个 `render` 键缺失时启用的 legacy 分支。
- **规范化 hero VISUAL TYPE。** `Title / Opener`、`Section Divider / Bridge`、现有模板使用的 `Section Divider`、`Closer` 都映射为 canonical hero 类型。hero 守卫保证 `render.default: body+header-lock` 不会误锁封面、分隔和结尾，除非逐页显式设置或例外表点名。
- **content full-page 注入统一 Header Placement 契约。** 对非 hero full-page 页，Stage 1 使用结构化 header 文字和 `visual_config.mjs` 返回的同一套 header band、position/font geometry 组装 prompt。契约固定采用“top-left header band”等语义描述 + canvas/px 数值的混合格式，并要求 body visual 退出该 band。alignment 明确为 Stage 3 现有的固定左对齐 invariant，不虚构为 `color_palette.json` 可配置字段；本 change 不修改 palette schema。
- **hero full-page 也由结构化字段提供准确文字。** hero 页不注入固定 band，但 Stage 1 仍注入 present kicker/title/subtitle 的 exact-text contract，让用户无需把标题重复写进 IMAGE PROMPT；自由的是构图，不是文字内容。
- **Stage 3 只服从 resolved mode。** 任意来源解析为 `body+header-lock` 的页都叠加 header；任意来源解析为 `full-page` 的页都透传。Stage 3 不根据 `render_mode_source` 判断是否“按需”。
- **body-lock raw prompt 不再包含 header 文字。** 它只声明顶部硬保留区和“Stage 3 后画 header”，不把 kicker/title/subtitle 值发给图像模型。这样修改 deterministic header 不改变 raw-image generation fingerprint，Chain A 才真正成立。
- **编辑链按实际文字所有者分类。** 修改 body+header-lock 页的 kicker/title/subtitle 仍是 Chain A；修改 full-page 页的这些文字是 Chain B，必须重生该页图片并使用 `--force-images`。full-page → header-lock 同样是 Chain B。
- **官方 `refresh --kind title` 变为 mode-aware。** 允许用 `--only` / `--all` 声明受影响页。纯 body-lock 继续 Chain A；命中 full-page 且当前图片尚未按新 header 输入 pilot/review 时，命令 fail-loud 并给出精确 pilot 命令，不生成一个标题仍旧的“成功”PPTX。review evidence 当前后，refresh 复用已审图片完成 Stage 3/4/5。
- **Stage 2 增加 raw-image provenance。** 每张图记录 final prompt、style reference、resolution、model 等生成语义的 fingerprint 和 image content hash；只有 image 和 current manifest 同时存在才允许 `skipped-exists`。header approval 绑定实际审过的 image hash/profile，正式 build 不得在同一流水线里悄悄重生这些页。
- **pilot header gate 成为正式、可恢复、机器可执行的生产 gate。** 有一张 content full-page 就审至少一张，有两张以上就审至少两张；任何后续 changed full-page header 还必须逐页重审或明确接受风险。review evidence 绑定当前 source、generation profile 和实际 image bytes；build、production Stage 2 与 Stage 4 都校验，未解决或未显式接受不得生产。

## Capabilities

### New Capabilities
<!-- 无新增 capability。 -->

### Modified Capabilities
- `content-parsing`: 解析既有 YAML frontmatter 中的 render policy；明确 policy/legacy 分支、hero canonicalization、级联和可追溯 source；为 content full-page 注入 header placement contract。
- `header-lock`: 明确 Stage 3 仅由 resolved `render_mode` 驱动，并与 full-page 软契约共享可配置 header geometry。
- `image-generation`: 为 raw images 建立 generation manifest，使缓存复用与 header review 可验证。
- `pipeline-orchestration`: 调整自动 pilot 代表页选择，并把 header review evidence 纳入 production readiness。
- `cli-surface`: 保持命令数量不变；扩展 `refresh --kind title` 的 selector/mode-aware 路由，并扩展现有 `approve` 为 `approve <run-dir> header` 记录 pilot header evidence。
- `playbook-execution`: 把 content full-page header 稳定度纳入 pilot 的显式 review gate 和失败后的升级流程，并防止手工 `--only` 绕过该 gate。

## Impact

- **代码**：`stage1_build_inputs.mjs` 与共享 hero/header helpers；`stage2_generate_images.mjs`/`unified_pipeline.mjs`（provenance、production/assembly checks）；`ppt_flow.mjs`（pilot selector、approve header、mode-aware refresh/build）；state helper（version-scoped evidence）；`bundle_layout.mjs`/初始化模板。Stage 3 绘制机制不变。
- **配置契约**：扩展 `slide-specifications.md` 文档开头可选的 YAML frontmatter，新增 closed `render` mapping；无 frontmatter 也视为 `render` 缺失。只解析开头 frontmatter，正文中的 `---` 保持 Markdown 分隔线语义。保留现有及未知顶层键，但 `render` 内只允许 `default` / `header-lock`，拼写错误必须 fail-loud。`render.header-lock` 必须是 trim 后非空、唯一、无歧义的 slide id 数组。
- **兼容性**：整个 `render` 键缺失 = legacy VISUAL TYPE 派生；`render` 键存在 = policy 行为，且 `default` 缺失时默认 `full-page`。新 `--init` deck 一定写入有效 policy。
- **产物**：`layout_contract.render_mode_source` 使用 `explicit` / `policy:exception` / `derived:hero_type` / `policy:default` / `derived:visual_type`。所有 full-page 继续保持 `header_safe_zone: 0`；content 的软 band 只存在于 assembled prompt，避免改变现有 layout field 的硬保留区语义。
- **编辑链/CLI**：full-page header 文字修改及 full-page ↔ header-lock 切换均为 Chain B，需要 pilot Stage 2 重生受影响图片并刷新 header review evidence；body+header-lock header 文字修改仍为 Chain A。`refresh --kind title` 不再无条件走 1,3,4,5。
- **文档**：同步通用 slide template、全部 deck-type templates、Stage 1/3/生产哲学、AGENTS/BOOTSTRAP、bundle README 和 change-classifier，移除“每页必须显式 RENDER MODE”的旧指导。
- **测试**：policy/legacy 分支、closed frontmatter schema、hero aliases、content/hero prompt contracts、image provenance/cache、validation WARN、init seeds、pilot selector、编辑链和 review gate 回归。
- **不在范围**：BUG-009 仍是独立轨道；本 change 只清楚记录依赖关系。
