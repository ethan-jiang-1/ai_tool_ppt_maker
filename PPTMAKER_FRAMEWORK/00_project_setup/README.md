---
title: "00 — Project Setup：项目初始化完整指南"
stage: 00_project_setup
position: entry
type: overview
summary: "项目初始化完整指南——run bundle 概念、目录模板、Python 环境、工具选择、命名约定。Agent 在 Phase 0 创建 run bundle 时参考。"
depends_on: []
feeds_into:
- 00_project_setup/00-run-bundle-concept.md
agent_action: navigate
---

# 00 — Project Setup：项目初始化完整指南

> **先读这个。** 3 分钟。
> Agent 在 Phase 0 创建 run bundle 时参考本目录。涵盖文件系统、Python 环境、工具选择、命名约定。

## 这是什么

本目录定义了 PPT 制作体系的**运行环境（run bundle）**——文件系统就是一切运行在其上的基础设施。但它不仅讲文件系统——它覆盖项目初始化的**全部**内容：怎么搭目录、怎么配 Python 环境、怎么选工具。

- **Soft bundle** = `PPTMAKER_FRAMEWORK/`（方法论参考，只读）
- **Run bundle** = 你为每个项目创建的文件系统实例（目录 + 代码 + 配置 + 产出物）

当你开始一个 PPT 项目，第一步就是按本目录的指导创建 run bundle。之后所有的设计、生产、迭代都在这个 run bundle 中进行。

## 五个文件

| 文件 | 内容 | 时间 |
|------|------|------|
| `00-run-bundle-concept.md` | 核心理念：文件系统即运行环境，soft bundle vs run bundle | 5 min |
| `01-directory-template.md` | Run bundle 的精确目录模板——每个子目录放什么、为什么 | 8 min |
| `02-python-environment.md` | UV/Python 环境搭建——依赖、venv、pyproject.toml | 5 min |
| `03-tool-selection.md` | 工具选用——image generation、PPT 生产、Python 工具链 | 5 min |
| `04-conventions.md` | 命名约定、版本快照策略、Git 管理、工作纪律 | 5 min |

## 核心原则

**Directory = stage. File = handoff. Version snapshot = full copy. Git = audit trail.**

对 coding agent 来说，文件是原生操作对象——读、写、搜索、diff、提交。不需要学习任何新抽象。

---

> **Next**: `00-run-bundle-concept.md`
