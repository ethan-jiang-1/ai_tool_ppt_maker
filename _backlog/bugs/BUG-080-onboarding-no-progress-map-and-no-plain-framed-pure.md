# BUG-080: onbaording 对小白缺"进度地图"与 "framed/pure 白话解释"

> 严重级别: P2 | 发现: 2026-08-19 | 状态: 活跃

## 症状

还没开始做 PPT 之前，新 deck 流程就有一长串步骤，但小白用户没有"我在第几步 / 一共几步"的进度感，也看不懂关键选择。两处静态证据：

1. **进度地图缺失**：`ppt_maker_harness/scripts/shared/cli/command_support.mjs:618` `printStatus` 只打印一排黑话状态行（`Pipeline / Structure / Content gate / Visual gate / Style master / Source receipt / Raw images …`），且 `Next:` 只在特定阶段才出现（`:673`）。没有任何"第 3/12 步：确认叙事大纲"的进度表述。
2. **`framed` vs `pure` 对小白零白话**：`ppt_maker_harness/playbook/create-deck.md:115` 写 *"Choose one version workflow, `framed` or `pure`, based on the content and visual intent."*——"基于内容和视觉意图"对小白等于没说。两个选项的取舍（是否花 provider、是否需要本地 runtime、效果差异）没有一处用大白话。注意："白话解释"要**保留术语**，见记忆 novice-guidance-terminology-plus-plain-language。

## 根因

流程/CLI 面向"工程师 / 决策指令"写文案，假设使用者懂 `framed`/`pure` 与 `content gate` 的语义；没有把"技术术语 + 白话解释 + 具体下一步"作为引导文案的强制格式。缺乏统一的"第 N/M 步"进度模型，小白无法定位自己在中游。

## 复现

1. `ppt_flow status <v1>` 看输出：无任何进度计数。
2. 读 `playbook/create-deck.md` 的 `select-target-page-image-workflow` 节点：只有"基于内容与视觉意图选择"，无取舍白话。

## 修复关联

待后续 findings 汇齐后统一进 OpenSpec change（onboarding 面向小白的全旅程引导：status 输出加进度锚；`framed`/`pure`、provider 声明等选择给"术语 → 白话 → 下一步"格式；统一引导文案格式）。