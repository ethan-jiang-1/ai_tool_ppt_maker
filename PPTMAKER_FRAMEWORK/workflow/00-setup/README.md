---
title: "00 — Project Setup：项目初始化完整指南"
stage: workflow/00-setup
position: entry
type: overview
summary: "项目初始化完整指南——run bundle 概念、Node.js 环境、工具选择、命名约定。Agent 在 Phase 0 创建 run bundle 时参考。"
depends_on: []
feeds_into:
- workflow/00-setup/00-run-bundle-concept.md
agent_action: navigate
---

# 00 — Project Setup：项目初始化完整指南

> **先读这个。** 3 分钟。
> Agent 在 Phase 0 创建 run bundle 时参考本目录. 涵盖文件系统、Node.js 环境、工具选择、命名约定.

## 这是什么

本目录定义了 PPT 制作体系的**运行环境（run bundle）**——文件系统就是一切运行在其上的基础设施. 但它不仅讲文件系统——它覆盖项目初始化的**全部**内容：怎么搭目录、怎么配 Node.js 环境、怎么选工具.

- **Soft bundle** = `PPTMAKER_FRAMEWORK/`（方法论参考，只读）
- **Run bundle** = 你为每个项目创建的文件系统实例（目录 + 代码 + 配置 + 产出物）
- **Charter** = `../charter/` — 框架宪法：结构宪法 (CONSTITUTION)、流程宪法 (WORKFLOW)、行为宪法 (AGENT_CONTRACT)

当你开始一个 PPT 项目，第一步就是按本目录的指导创建 run bundle。之后所有的设计、生产、迭代都在这个 run bundle 中进行。

## 文件清单

### 核心文档

| 文件 | 内容 | 时间 |
|------|------|------|
| `00-run-bundle-concept.md` | 核心理念：文件系统即运行环境，soft bundle vs run bundle | 5 min |
| `00-zero-to-ready.md` | 零基础到就绪：装 Agent、装 Node.js、拿 API key | 20 min |
| `02-nodejs-environment.md` | Node.js 环境搭建——npm install、.env 配置 | 5 min |
| `03-tool-selection.md` | 工具选用——image generation、PPT 生产、Node.js 工具链 | 5 min |
| `04-conventions.md` | 命名约定、版本快照策略、Git 管理、工作纪律 | 5 min |
| `05-migrate-import-existing-deck.md` | 旁路：迁移/导入已有 deck（强制 show + 闸门） | 8 min |
| `template-deck-guide.md` | 每个 run bundle 里的 deck-guide.md 模板 | 3 min |

### 参考附录

| 文件 | 内容 |
|------|------|
| `reference/quick-start.md` | 人类上手——5 分钟找到你的路径 |
| `reference/glossary.md` | 术语表——Run Bundle、Source File、Derived Artifact 等 |
| `reference/anti-patterns.md` | 常见错误——跳过内容设计、手改 _generated/、临场发挥目录结构 |
| `VERSION_LOG.md` | 版本日志——v1.x.x 线 changelog |

### 宪法 (在 `../charter/`)

| 文件 | 内容 |
|------|------|
| `CONSTITUTION.md` | 结构宪法——run bundle 目录结构权威声明 (SSOT: bundle_layout.mjs) |
| `WORKFLOW.md` | 流程宪法——5 Phase + 编辑链 + Gate |
| `AGENT_CONTRACT.md` | 行为宪法——11 条铁律 |

## 核心原则

**Directory = stage. File = handoff. Version snapshot = full copy. Git = audit trail.**

对 coding agent 来说，文件是原生操作对象——读、写、搜索、diff、提交。不需要学习任何新抽象。

---

> **Next**: `00-run-bundle-concept.md`
