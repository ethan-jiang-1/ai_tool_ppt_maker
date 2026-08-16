---
title: "00 — Project Setup：项目初始化完整指南"
stage: workflow/00-setup
position: entry
type: overview
summary: "项目初始化完整指南——run bundle 概念、Node.js 环境、工具选择、命名约定。Agent 在 00-setup 创建 run bundle 时参考。"
depends_on: []
feeds_into:
- workflow/00-setup/00-run-bundle-concept.md
agent_action: navigate
---

# 00 — Project Setup：项目初始化完整指南

> **先读这个。** 3 分钟。
> Agent 在 00-setup 创建 run bundle 时参考本目录. 涵盖文件系统、Node.js 环境、工具选择、命名约定.

## 这是什么

本目录定义了 PPT 制作体系的**运行环境（run bundle）**——文件系统就是一切运行在其上的基础设施. 但它不仅讲文件系统——它覆盖项目初始化的**全部**内容：怎么搭目录、怎么配 Node.js 环境、怎么选工具.

- **Soft bundle** = `ppt_maker_harness/`（方法论参考，只读）
- **Run bundle** = 你为每个项目创建的文件系统实例（目录 + 代码 + 配置 + 产出物）
- **Charter** = `../../charter/` — Harness 宪法：结构宪法 (CONSTITUTION)、流程宪法 (WORKFLOW)、行为宪法 (AGENT_CONTRACT)

当你开始一个 PPT 项目，第一步就是按本目录的指导创建 run bundle。之后所有的设计、生产、迭代都在这个 run bundle 中进行。

## 文件清单

### 核心文档

| 文件 | 内容 | 时间 |
|------|------|------|
| `00-run-bundle-concept.md` | 核心理念：文件系统即运行环境，soft bundle vs run bundle | 5 min |
| `00-zero-to-ready.md` | 概念说明：你需要什么、为什么需要（操作步骤走 BOOTSTRAP Step 1） | 5 min |
| `02-nodejs-environment.md` | Node.js 环境参考——npm install、.env 配置的详细背景（首次安装走 BOOTSTRAP Step 1） | 5 min |
| `03-runtime-and-tools.md` | 工具选用——image generation、PPT 生产、Node.js 工具链 | 5 min |
| `04-conventions.md` | 命名约定、版本快照策略、可选 Git 审计边界、工作纪律 | 5 min |
| `template-deck-guide.md` | 每个 run bundle 里的 deck-guide.md 模板 | 3 min |

### 参考附录

| 文件 | 内容 |
|------|------|
| `../../reference/quick-start.md` | 人类上手——5 分钟找到你的路径 |
| `../../reference/glossary.md` | 术语表——Run Bundle、Source File、Derived Artifact 等 |
| `../../reference/anti-patterns.md` | 常见错误——跳过内容设计、手改 _generated/、临场发挥目录结构 |

### 宪法 (在 `../../charter/`)

| 文件 | 内容 |
|------|------|
| `CONSTITUTION.md` | 结构宪法——run bundle 目录结构权威声明 (SSOT: bundle_layout.mjs) |
| `WORKFLOW.md` | 流程宪法——method graph、刷新/结构路径与 Gate |
| `AGENT_CONTRACT.md` | 行为宪法——Agent Contract |

## 核心原则

**Directory = stage. File = handoff. Version snapshot = clean downstream-source delta. Visible `vN` = deck work-version authority; Git = optional user-owned audit.**

对 coding agent 来说，文件是原生操作对象——读、写、搜索、diff、提交。不需要学习任何新抽象。

---

> **Next**: `00-run-bundle-concept.md`
