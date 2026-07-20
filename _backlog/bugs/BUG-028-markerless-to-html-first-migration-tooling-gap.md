# BUG-028: markerless → html-first 迁移全过程无自动化工具

> 严重级别: P0 | 发现: 2026-07-21 | 状态: 活跃

## 症状
将一个 markerless（legacy-image2-first）deck 迁移到 html-first-v1 需要以下手工步骤，
每一步都可能出错且无工具辅助：

1. 新建 vNext 版本（`--new-version`）
2. 改写 slide-specifications.md：移除 IMAGE PROMPT，新增 `production.pipeline` marker +
   `identity.scheme`，为每页创作 SLIDE BODY YAML
3. 迁移 color_palette.json：添加完整的 `html_first` 段（8 palette keys + 10 typography roles
   + spacing + 10 component specs + image_language）
4. 创建 `visual-style/assets/` + `asset-manifest.yaml`（v2 schema）
5. 更新 state.yaml：schema v3 + `pipeline: html-first-v1` + gate records
6. 更新 project-metadata.yaml：添加 `html_content_gate` / `html_visual_gate`
7. 更新 deck-guide.md / CLAUDE.md 为 HTML-first 模板
8. 处理 backbone 白名单违规（agent-portrayal.md 等）

`migrate-html preview/apply` 命令存在但针对的是已有 structured source 的 deck，不适用于
从 IMAGE PROMPT 格式的 markerless deck 迁移。

## 根因
框架文档 `05-migrate-import-existing-deck.md` 描述了三种迁移入口，但 "markerless -> HTML clean
vNext" 路径的 "Agent 为每张保留页编写完整 structured block" 没有任何工具支撑——
Agent 需要手工完成所有 slide body YAML 创作、palette 迁移、state 重构。

## 复现
1. 取任意 markerless deck（有 IMAGE PROMPT，无 `production.pipeline`）
2. 试图迁移到 html-first-v1
3. 每步都需手工操作，反复试错

## 修复关联
依赖 BUG-016～022 修复后，提供端到端 `ppt_flow migrate-legacy <run-dir>` 命令。
