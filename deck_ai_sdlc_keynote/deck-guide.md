# deck_ai_sdlc_keynote — 这个 PPT 项目怎么用

> 当前版本：`v1`。先改源文件，再让管线重建；不要直接改 `_generated/`。
> 本 deck 已从旧框架迁入现行三层树；交付物以迁移/管线产物为准。

## 你改哪里

- 每页内容：`3_versions/v1/slide-specifications.md`
- 整体主线：`2_backbone/core-metaphor.md` + `2_backbone/core-formula.md`
- 视觉主干：`2_backbone/visual-style/`
- 原始材料：`1_upstream_raw_material/`

## 闸门（双写）

用户确认内容/视觉后：

1. **Pipeline gates**（Stage 2 检查）：把 `project-metadata.yaml` 的 `content_gate` / `visual_gate` 写成 `approved`（或明确跳过则 `waived`）
2. **Playbook gates**：同步 `_state/state.yaml` 的 `gates.content` / `gates.visual`

推荐一条命令双写：

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs approve deck_ai_sdlc_keynote/3_versions/v1 content
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs approve deck_ai_sdlc_keynote/3_versions/v1 visual
```

## 当前进度

- **Playbook / 闸门**：看 `_state/state.yaml`（或 `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state deck_ai_sdlc_keynote/3_versions/v1 [--check-gates]`）
- **管线产物**：看 `3_versions/v1/_generated/`
  - 有 `ppt/deck.pptx` → 交付 PPTX 已在（迁移备份；重跑 Stage 4 会按管线命名覆盖）
  - 有 `preview/contact_sheet.jpg` → 样张/联系表
  - 有 `slide_plan.json` → Stage 1 已解析（可按需补跑 Stage 1；**不以缺 slide_plan 否定已有 pptx**）
  - 详见 `_generated/MIGRATED.md`

## 从项目根目录运行

依赖在 **repo 根** 用 `npm install` 一次装好（`@napi-rs/canvas` / `pptxgenjs` / `yaml`）。

```bash
# 推荐：统一入口
node "/Users/bowhead/ai_tool_ppt_maker/PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs" doctor
node "/Users/bowhead/ai_tool_ppt_maker/PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs" state "/Users/bowhead/ai_tool_ppt_maker/deck_ai_sdlc_keynote/3_versions/v1"
node "/Users/bowhead/ai_tool_ppt_maker/PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs" pilot "/Users/bowhead/ai_tool_ppt_maker/deck_ai_sdlc_keynote/3_versions/v1"
node "/Users/bowhead/ai_tool_ppt_maker/PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs" build "/Users/bowhead/ai_tool_ppt_maker/deck_ai_sdlc_keynote/3_versions/v1"

# 等价：直接跑管线（Expert）
node "/Users/bowhead/ai_tool_ppt_maker/PPTMAKER_FRAMEWORK/scripts/unified_pipeline.mjs" --run-dir "/Users/bowhead/ai_tool_ppt_maker/deck_ai_sdlc_keynote/3_versions/v1" --stage 1
node "/Users/bowhead/ai_tool_ppt_maker/PPTMAKER_FRAMEWORK/scripts/unified_pipeline.mjs" --run-dir "/Users/bowhead/ai_tool_ppt_maker/deck_ai_sdlc_keynote/3_versions/v1" --stage 2 --only opener_id,content_id,closer_id --resolution 1k
node "/Users/bowhead/ai_tool_ppt_maker/PPTMAKER_FRAMEWORK/scripts/unified_pipeline.mjs" --run-dir "/Users/bowhead/ai_tool_ppt_maker/deck_ai_sdlc_keynote/3_versions/v1" --stage 2 --resolution 2k --force-images
node "/Users/bowhead/ai_tool_ppt_maker/PPTMAKER_FRAMEWORK/scripts/unified_pipeline.mjs" --run-dir "/Users/bowhead/ai_tool_ppt_maker/deck_ai_sdlc_keynote/3_versions/v1" --stage 3,4,5

# 新建干净版本（不复制旧图片/PPTX）
node "/Users/bowhead/ai_tool_ppt_maker/PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs" --new-version "/Users/bowhead/ai_tool_ppt_maker/deck_ai_sdlc_keynote/3_versions/v1"
```

用户只需告诉 Agent 想改什么；Agent 负责选择最小重跑链。
