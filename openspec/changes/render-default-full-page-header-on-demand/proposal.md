## Why

用户（可能是小白）不想管"渲染模式"这种内部概念——他只想填标题/副标题/kicker 的文字，其余交给系统。今天 `full-page` 的 prompt 只说 `render all text`，**没有任何 header 位置/字号纪律**：标题往哪放全靠作者在 IMAGE PROMPT 散文里手写，于是图像模型每页把 header 画得忽大忽小、忽上忽下——**这才是用户产生"我要 header 控制"诉求的根因**。正确的解法不是让用户预先去选模式，而是默认把 header 用提示词做稳，个别真飘的页才用脚本硬锁兜底。

## What Changes

- **默认 `full-page`，整册。** 新 deck 播种 `default: full-page`；用户面永远只填 kicker/headline/subtitle 文字，看不到 "render mode / header-lock" 这些词。
- **新增 deck 级 render 策略源 + 级联。** 在 `3_versions/v{n}/slide-specifications.md` 顶部 frontmatter 加一个可选 `render:` 块（`default:` + `header-lock:` 例外表）。Stage 1 按精确度递减解析：每页显式 RENDER MODE > 整册 `header-lock` 例外表 > 整册 `default` > VISUAL TYPE 派生（仅作旧 deck 向后兼容的兜底）。`layout_contract.render_mode_source` 增加 `policy:default` / `policy:exception` 取值，保持可追溯。
- **full-page prompt 注入统一 Header Placement 契约（核心新增）。** 把结构化的 kicker/headline/subtitle + 位置/字号/对齐，从与 header-lock **完全同源**的几何（`color_palette.json` 的 `header_lock.position/size`，经 `visual_config.mjs`）拼进 full-page prompt，取代"作者散文里手写标题位置"的旧做法。跨页 header 因此稳定一致。
- **`header-lock` 降级为按需补丁。** 不再由 VISUAL TYPE 默认触发；仅当用户抱怨某页 header 飘/位置不对，把该页加入 `header-lock:` 例外表时才启用。Agent 可在 contact sheet 视觉闸门主动指出明显漂移并建议锁定，但**绝不替用户预先配置**。Stage 3 叠加机制本身不变。
- **统一心智模型（写进 design）。** full-page = 同一套 header 几何当"软约束"（AI 画）；header-lock = 同一套几何当"硬叠加"（脚本画）。某页 full-page→header-lock **位置不变**，只是从"请 AI 画在这"变成"AI 别画、脚本画在这"。

## Capabilities

### New Capabilities
<!-- 无新增 capability——全部映射到注册表已有 identifier。 -->

### Modified Capabilities
- `content-parsing`: Stage 1 新增 deck 级 render 策略解析 + 级联优先级（默认 `full-page`）；full-page prompt 组装新增与 header-lock 同源的 Header Placement 契约；`render_mode_source` 增加 `policy:*` 取值。
- `header-lock`: 角色由"VISUAL TYPE 默认选中的模式"改为"按需（例外表）启用的硬兜底"；明确其 header 几何与 full-page 软约束同源（同一 SSOT，仅强制力度不同）。Stage 3 叠加与透传机制不变。

## Impact

- **代码**：`stage1_build_inputs.mjs`（新 frontmatter 策略解析器、`determineRenderMode` 级联、`buildLayoutContract` 的 source 取值、`assemblePrompt` 的 full-page 分支注入 Header Placement 契约）。`visual_config.mjs` / `color_palette.json` 作为 header 几何 SSOT 被 full-page 路径复用（读取面扩大，schema 不变）。`stage3_lock_headers.mjs` 机制不变。
- **产物/契约**：`slide-specifications.md` 新增可选 `render:` frontmatter 块；`slide_plan.json` 的 `layout_contract.render_mode_source` 扩展取值。旧 deck（无 frontmatter）走 VISUAL TYPE 派生兜底，**向后兼容**。
- **测试**：`content-parsing` 回归（级联优先级、full-page Header Placement 契约、旧 deck 兜底）。
- **不在本提案范围**：BUG-009（`stage3` `_loadImageToCanvas` 同步解码出空白图）是独立轨道，仅在关联处引用，不并入。
- **文档**：BOOTSTRAP / AGENTS 里"80% body+header-lock、20% full-page"的旧描述需随之校准（默认已翻转为 full-page）。
