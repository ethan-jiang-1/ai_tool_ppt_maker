# deck_ai_sdlc_keynote — 这个 PPT 项目怎么用

> 当前版本：`v1`。先改源文件，再让管线重建；不要直接改 `_generated/`。

## 你改哪里

- 每页内容：`3_versions/v1/slide-specifications.md`
- 整体主线：`2_backbone/core-metaphor.md` + `2_backbone/core-formula.md`
- 视觉主干：`2_backbone/visual-style/`
- 原始材料：`1_upstream_raw_material/`

用户确认内容/视觉闸门后，把 `project-metadata.yaml` 中对应的 `content_gate` / `visual_gate` 改为 `approved`；若用户明确跳过则写 `waived`。Stage 2 会自动检查。

## 当前进度

查看 `3_versions/v1/_generated/`：有 `slide_plan.json` 表示 Stage 1 完成；有 `ppt/ai_sdlc_keynote.pptx` 表示交付物已生成。

## 从项目根目录运行

依赖在 **repo 根** 用 `npm install` 一次装好（`@napi-rs/canvas` / `pptxgenjs`）。

```bash
# 推荐：统一入口
node "/Users/bowhead/ai_tool_ppt_maker/PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs" doctor
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
