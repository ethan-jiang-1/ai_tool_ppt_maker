# Framed Hybrid Image2 Context Pack

> Parent plan: [`../framed-hybrid-image2-composition.md`](../framed-hybrid-image2-composition.md) | 关闭: 2026-08-08 | 状态: 历史材料

这个目录承载主计划的辅助上下文。它不是 current runtime/spec truth，也不授权修改 Harness、main specs 或任何 deck。

## 建议阅读顺序

1. [`HANDOFF.md`](HANDOFF.md) — 新 Agent 的最短接棒入口、当前状态、边界和下一步。
2. [`../framed-hybrid-image2-composition.md`](../framed-hybrid-image2-composition.md) — 主计划、风险、验收和待 Owner 决策。
3. [`canonical-page-model.md`](canonical-page-model.md) — Pure/Framed 的 canonical 顶层定义。
4. [`research-findings.md`](research-findings.md) — 一手证据、反例、prompt lineage 与刷新研究。
5. [`authority-propagation-map.md`](authority-propagation-map.md) — Plan 获批后如何同步 root context、ADR、OpenSpec main specs 和 Harness guidance。
6. [`borrowed-presentation-principles.md`](borrowed-presentation-principles.md) — 借鉴的 presentation 设计纪律及明确不引入的插件依赖。

## 文档职责

| 文件 | 回答的问题 | 不负责什么 |
| --- | --- | --- |
| `HANDOFF.md` | 下一位 Agent 现在处于什么状态、从哪里继续 | 重复完整设计或证据 |
| parent plan | 要改什么、为何改、如何验收、有哪些待决策 | 充当 current spec |
| `canonical-page-model.md` | Pure 与 Framed 到底相同/不同在哪里 | 实现 schema 细节 |
| `research-findings.md` | 哪些结论由一手材料支持、现实现在哪里违背 | 宣布 Owner 已接受全部建议 |
| `authority-propagation-map.md` | 批准后哪些权威文件必须同步、顺序是什么 | 提前修改这些权威文件 |
| `borrowed-presentation-principles.md` | 哪些演示设计精神值得吸收 | 引入 OpenAI plugin/toolchain 依赖 |

## 当前与目标必须分开

- **Current runtime truth**：`page-authority-image2-v2` 仍把 Framed 实现为 text-free underlay + local Text Frame。
- **Proposed target**：Pure/Framed 共享完整 `page_image_core`；Framed 只增加透明、确定性的 kicker/title/subtitle overlay。

任何 Agent 在 OpenSpec change 实现并成为 current 之前，都不得用 proposed target 解释或操作现有 v2 source/state/evidence。
