# Workflow — PPTMAKER 工作流

> 方法论文档按 Phase 顺序组织. 详细流程宪法见 `../charter/WORKFLOW.md`.

## Phase 顺序

| # | 目录 | Phase | Gate |
|---|------|-------|------|
| 00 | `00-setup/` | 项目初始化: 环境检查 → intake → 创建 run bundle | 结构合规 |
| 01 | `01-visual/` | 视觉风格: medium → preset → style_master → review | 95%+ 锁定 |
| 02 | `02-content/` | 内容设计: 隐喻 → 公式 → Block Map → slide specs | 内容确认 |
| 03 | `03-prompts/` | 图像提示词: 能力层, 教怎么写 prompt | — |
| 04 | `04-production/` | 生产管线: 5 Stage, markdown → PPTX | 每 Stage gate |
| 05 | `05-iteration/` | 迭代引擎: 分类变更 → 最小重跑 → 记录 | — |

Phase 顺序不可变: 00 → 01/02 (可并行) → 03 (贯穿) → 04 → 05 (持续).

## 编辑链速查

| 链 | 变更类型 | Stage | 耗时 |
|----|---------|-------|------|
| A | 文本 (title/kicker/subtitle) | 1,3,4,5 | ~5 min |
| B | 视觉 (image/颜色/布局) | 1,2,3,4,5 | ~5 min/页 |
| C | 备注 (speaker notes) | 5 | ~30 sec |
| Structural | 增/删/重排 slide | new-version | 按页数 |

## 起点

Agent 入口: `../BOOTSTRAP.md` → `../charter/AGENT_CONTRACT.md` → 按 Phase 读本目录.
人类起点: `../README.md` → `../COMMANDS.md` (命令速查).
