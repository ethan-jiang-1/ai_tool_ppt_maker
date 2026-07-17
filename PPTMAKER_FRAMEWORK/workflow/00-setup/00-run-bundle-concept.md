---
title: 00 — The Run Bundle Concept
stage: workflow/00-setup
position: "01 of 05"
type: concept
summary: 概念定义。Agent 内化此概念作为后续所有操作的基础。
depends_on:
- workflow/00-setup/README.md
feeds_into:
- charter/CONSTITUTION.md
agent_action: internalize
---

# 00 — The Run Bundle Concept

← [README](README.md) | [Next →](../../charter/CONSTITUTION.md)

## Soft Bundle vs Run Bundle

这个体系里有两个 "bundle"：

| | Soft Bundle | Run Bundle |
|---|------------|------------|
| **是什么** | `PPTMAKER_FRAMEWORK/` — 方法论知识库 | 你为具体项目创建的文件系统实例 |
| **包含** | 方法论文件、模板、参考案例 | 项目产出物：设计文档、图片、JSON、PPTX |
| **谁读** | Agent 和人类——学习 "怎么做" | Agent——作为执行环境 |
| **版本管理** | Git 追踪方法论演进 | `bundle_layout.mjs --new-version ...` 创建干净下游快照 |
| **变不变** | 稳定——方法论缓慢演进 | 持续变——每个项目不同，每个版本不同 |

当你开始一个 PPT 项目时：
1. Agent 读取 soft bundle（学方法论）
2. Agent 创建 run bundle（按 `charter/CONSTITUTION.md` 建目录结构）
3. Agent 在 run bundle 中执行所有工作（设计、生产、迭代）

## 为什么文件系统就是 Run Bundle

传统 workflow 工具（Jenkins、Airflow、Notion）把流程状态存在数据库里。但文件系统有原生答案：

| 你需要做的 | 文件系统怎么支持 |
|-----------|----------------|
| 创建新项目 | `node PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs --init deck_{NAME}`（一条命令搭全,不手动 mkdir） |
| 看当前进度 | `ls 3_versions/v1/_generated/page_images_full/` — 生成了几张图 |
| 版本快照 | `bundle_layout.mjs --new-version deck_X/3_versions/v1` — 只复制源 delta，随时 `diff -r` |
| 重跑某个阶段 | `node PPTMAKER_FRAMEWORK/scripts/unified_pipeline.mjs --run-dir ... --stage N` |
| 检查中间产物 | 打开 `page_images_full/03_xxx.png` — 直接看图 |
| 回访已有版本 | 保留所有可见 `vN`；小修复当前源，同方向大改建 clean vNext，受众/主叙事分叉时另建 deck |
| 源文件审计（可选） | 用户拥有的 Git history 可比较 source/control 变化；不替代 `vN` |

**关键差异**：不需要启动服务器。不需要配置 YAML。不需要学习新工具。文件系统就是 agent 的原生操作环境。

## Run Bundle 的生命周期

```
创建（Phase 0）
  │  mkdir + 复制模板
  ↓
设计（Phase 1-2）
  │  写 slide-specifications.md + visual-style.md
  │  生成 style_master.jpg
  ↓
生产（Phase 3）
  │  Stage 1-5 管线执行
  │  产出 page_images_full/*.png → header_locked/*.png → ppt/*.pptx
  ↓
迭代（Phase 4）
  │  按失效产物选择 Header Text & Style / Generated Image / Notes-Only 刷新
  │  增删重排先用 Structural Versioning Path 创建干净版本，再刷新受影响页
  ↓
归档
   │  保留最终版本目录
   │  交付 / 按用户自己的流程归档（Git checkpoint 仅在用户选择且明确授权时）
```

每个阶段在文件系统中有**可见的痕迹**——不是数据库里的状态字段，是你可以 `ls` 看到的实际文件。

## Agent 在 Run Bundle 中怎么工作

1. **进入项目目录** → 读 `CLAUDE.md`（项目级操作指南）
2. **看目录结构** → 知道当前在哪个阶段（有 `slide_plan.json` = Stage 1 已完成，有 `page_images_full/` = Stage 2 已完成...）
3. **读上游产出** → 知道下一步需要什么输入
4. **执行** → 写文件、跑脚本
5. **Gate check** → 检查产出物是否符合预期

**Agent 不需要问 "现在做到哪了？"**——`ls` 一下目录就有答案。

---

> **Next**: `charter/CONSTITUTION.md` — 项目目录的精确模板，每个子目录放什么、为什么。
