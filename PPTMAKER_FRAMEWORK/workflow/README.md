# Workflow — PPTMAKER 工作流

> 方法论文档按 Method Module 组织；端到端顺序由 Lifecycle Phase 定义。详细流程宪法见 `../charter/WORKFLOW.md`。

## Method Module 与 Lifecycle Phase

| Module | 目录 | Lifecycle 位置 | Gate |
|---|------|-------|------|
| 00 | `00-setup/` | Phase 0：环境检查 → intake → 创建 run bundle | 结构合规 |
| 01 | `01-visual/` | Phase 2：medium → preset → style_master → review | 95%+ 锁定 |
| 02 | `02-content/` | Phase 1：隐喻 → 公式 → Block Map → slide specs | 内容确认 |
| 03 | `03-prompts/` | Phase 2.7：能力层，回填 L3 prompt | — |
| 04 | `04-production/` | Phase 3：Pipeline Stage 1–5，markdown → PPTX | 每 Stage gate |
| 05 | `05-iteration/` | Phase 4：分类变更 → 最小重跑 → 记录 | — |

Lifecycle Phase 顺序：`0 → 1/2（可交换）→ 2.7 → 3 → 4`。

## 刷新与结构路径速查

| 路径 | 变更类型 | 逻辑执行 | 耗时 |
|------|---------|---------|------|
| Header Text & Style Refresh | resolved `body+header-lock` 的 KICKER/TITLE/SUBTITLE 或 Stage-3-owned header 样式；raw-image contract 不变 | 1,3,4,5 | ~5 min |
| Generated Image Rebuild | full-page header、body/画面，或 render mode / safe-zone 改动 | 强制所选 2 → review → 3/4/5 | ~5 min/页 |
| Notes-Only Refresh | speaker notes only | 5 | ~30 sec |
| Structural Versioning Path | 增/删/重排 slide | new-version → 受影响页刷新 | 按页数 |

## 起点

Agent 入口: `../BOOTSTRAP.md` → `../charter/AGENT_CONTRACT.md` → 按 Phase 读本目录.
人类起点: `../README.md` → `../COMMANDS.md` (命令速查).

用户可以始终用自然语言描述改动；英文路径名是 Agent 和维护者的检索词，中文只作解释。旧字母别名只保留在兼容注册表和历史材料中。标题意图先走 `ppt_flow refresh --kind title`：resolved `body+header-lock` 使用 Header Text & Style Refresh；resolved `full-page` 使用 Generated Image Rebuild。
