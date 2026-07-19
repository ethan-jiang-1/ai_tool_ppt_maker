---
title: 00 — The Run Bundle Concept
stage: workflow/00-setup
position: "01 of 05"
type: concept
summary: 定义 soft bundle、run bundle、HTML-first source 与 rebuildable delivery ownership。
depends_on:
- workflow/00-setup/README.md
feeds_into:
- charter/CONSTITUTION.md
agent_action: internalize
---

# 00 — The Run Bundle Concept

← [README](README.md) | [Next →](../../charter/CONSTITUTION.md)

## Soft Bundle 与 Run Bundle

| | Soft Bundle | Run Bundle |
|---|---|---|
| 是什么 | `PPTMAKER_FRAMEWORK/` 方法论与生产工具 | 一个具体 `deck_{NAME}/` 项目 |
| 谁拥有 | framework 维护者 | 用户拥有内容，Agent 拥有过程 |
| 怎么变 | Git 追踪 framework 演进 | 可见 `vN` + Structural Versioning Path |
| 什么是源 | workflow、charter、scripts、reference、playbook | upstream、backbone、version source/control |
| 什么可重建 | 不适用 | 每个版本的 `_generated/` 与 `_scratch/` |

Agent 先读 soft bundle，再通过 `ppt_flow init` 创建 run bundle，之后只在用户指定的 run bundle 中工作。`deck_*` 与 `dpt_*` 是生产数据，不是 framework 源码。

## 三层 source ownership

```text
deck_{NAME}/
├── 1_upstream_raw_material/       shared raw source
├── 2_backbone/                    shared narrative and visual system
└── 3_versions/vN/                 one visible downstream source snapshot
    ├── slide-specifications.md    structured slide source
    ├── overrides/                 version-local source/control deltas
    ├── _generated/                rebuildable delivery artifacts
    └── _scratch/                  deletable transaction workspace
```

HTML-first 的唯一页面源是 `slide-specifications.md` 中的稳定 `slide_id`、header、`CONCEPT`、typed `SLIDE BODY`、fallback 与 speaker notes。视觉真相来自合并后的 `color_palette.json`、family geometry、asset catalog 与本地字体。准确正文不藏在 prompt 中。

`_generated/html_production/` 保存本地 HTML page、verified final slide、review plan/contact sheet 与 current manifest；`_generated/qa/` 保存 assembly/notes lineage。它们都是管线所有的派生物，绝不手改。普通 HTML create/preview/build 不创建 Image2 candidate、authorization、style master 或 refinement 目录。

Markerless 历史 deck 仍是 `legacy-image2-first`，沿独立兼容路径维护；不能因为打开了新 framework 就补 marker 或搬运 HTML evidence。

## 生命周期

```text
Phase 0  setup and local readiness
Phase 1  structured content and family selection
Phase 2  renderer-neutral visual system and real local preview
Phase 3  local HTML Stage 1-5, contact sheet, PPTX, notes, final review
Phase 4  optional Image2 refinement, unavailable in this change
Phase 5  local iteration or explicit legacy maintenance
```

Phase 3 已产生完整交付物。Phase 4 不是完成条件，也没有 active command/controller。

## 进度与身份

- 先用 `ppt_flow state <run-dir>` 查看 durable workflow state、review freshness 与下一步；不要用聊天记忆代替磁盘状态。
- `slide_id` 是跨版本身份，`position` 只属于当前快照。
- 结构编辑先 preview，再以 exact plan hash 发布 clean vNext；source publication 不渲染。
- HTML target 后续显式本地 materialize，报告 `needs_local_materialization`；legacy 才报告需要远端授权的 `needs_render`。
- Git 是用户可选的 source/control 审计，不替代 `vN`，也不恢复 `_generated/`。

## 常用入口

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state deck_NAME/3_versions/v1
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs validate deck_NAME/3_versions/v1
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs pilot deck_NAME/3_versions/v1
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs build deck_NAME/3_versions/v1
node PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs --check deck_NAME/3_versions/v1
```

> **Next**: `charter/CONSTITUTION.md` — 精确目录合同与 owner 边界。
