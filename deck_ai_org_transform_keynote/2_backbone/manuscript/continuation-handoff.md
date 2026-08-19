# Continuation Handoff

更新时间：2026-08-19

## 当前项目

- Deck：`deck_ai_org_transform_keynote`
- Run：`3_versions/v1`
- 类型：keynote
- Pipeline：`page-image-workflow`
- 当前内容阶段：叙事 source 已反复打磨，尚未进入 page plan 确认
- 当前 Harness node：`author-target-narrative-sources`
- Workflow：尚未选择 `framed` 或 `pure`
- Provider work：未开始；没有授权、raw image、final image、PPTX 或 delivery evidence
- 当前目标：先把约 10 页的叙事打磨稳定，再进入页面规划

## 当前叙事主线

```text
个人能力全面开花
→ AI 成为新的协作主体
→ 软件最先跑通人机协作回路
→ 企业重做工作流、责任和组织接口
→ 一把手定位瓶颈并创造转型条件
```

Central Claim：

> AI 转型不是把 AI 加到原来的组织上，而是让个人能力跃迁进入新的工作回路，再被业务流程和组织机制接住，最终沉淀为可持续的组织能力。

## 四段结构与页数

- **Block 1（1–2 页）**：个人能力全面开花。WorkBuddy、Trae、豆包、Codex、Claude Code 等让代码、文案、分析、创作和原型能力进入个人；少数人已形成新工作方式，多数人在观望或路上。解释碳基个体的知识/注意力/专业边界与硅基系统的广度、吞吐；引出 Agent 作为协作主体，以及人机、机机、机人接口。
- **Block 2（3–5 页）**：软件是先锋。以 Martin Fowler Deer Valley → Engelberg 的约 5 个月语气转变为主证据；软件研发从“人想、人写、人验”走向更完整的 SDLC 工作回路；解释 `Agent = Model + Harness`、Guides × Sensors、验证回路。保留早期采用者偏差和人类仍负责目标、边界、验证、高风险判断的限定。
- **Block 3（6–8 页）**：企业不是复制工具，而是重做组织接口。主案例固定为三个组织考量清晰的样本：Block（问题所有权/DRI/层级）、Cloudflare（Builders/Sellers/Measurers 与内部 Cloudflare OS）、JPMorgan（核心基础设施、LLM Suite、培训和自然流失再部署）。BPM 材料提供目标驱动、确定性执行、权限、审计和人工升级的流程边界。
- **Block 4（9–10 页）**：一把手工程。用组织公式诊断瓶颈，强调一把手不照抄案例，而是提高杠杆、降低摩擦、保护人才密度；最小启动动作是让已经自发使用 AI 的人被看见，再围绕真实问题做有限闭环试点。

## 两条核心公式

1. 技术核心（Block 2）：`Agent = Model + Harness`
2. 组织核心（Block 4）：`组织竞争力 = 人才密度 × AI 杠杆 / 组织摩擦`

辅助叙事命题（开场/结尾）：`个人能力跃迁 × 业务连接 × 组织机制 = 可持续的 AI 转型`

公式关系详见 [formula-map.md](formula-map.md)，完整来源关系详见 [source-relations.md](source-relations.md)。

## 上游材料

`1_upstream_raw_material/` 按来源组织，不按 Block 组织。四个 `source-*` symlink 回到外部原始材料：

- `source-tensen-report/`
- `source-martin-fowler-ai-sdlc/`
- `source-enterprise-six-cases/`
- `source-ai-era-bpm/`

摘要与索引从 [../../1_upstream_raw_material/material-index.md](../../1_upstream_raw_material/material-index.md) 开始。

## 已完成文件

- 叙事骨架：[../../2_backbone/story-outline.md](../story-outline.md)
- 公式关系：[formula-map.md](formula-map.md)
- 核心隐喻：[../core-metaphor.md](../core-metaphor.md)：AI 是杠杆，面对困难关键是找到离问题最近的支点
- 四段讲稿：`01-block1-杠杆与支点.md`、`02-block2-软件行业的拐点.md`、`03-block3-从提效到重构.md`、`04-block4-一把手工程.md`

## 下一步

1. 继续只做内容/叙事审校，确认十页结构和三个主案例。
2. 由 Deck Author 明确选择本版本 `framed` 或 `pure` workflow。
3. 按当前 `create-deck` Controller 进入 visual profile、page grouping candidate 和 narrative page-plan preview。
4. 只有 page plan 经过人确认后，才 materialize slide source；不要提前生成图片或 PPTX。

## 当前边界与恢复提示

- 不要编辑 `_generated/`、`_state/state.yaml` 或任何 receipt/state bytes。
- `ppt_flow status <run-dir>` 当前结构检查正常，显示 `author-target-narrative-sources`、content pending、visual pending、无 raw/final/PPTX。
- `bundle_layout --check deck_ai_org_transform_keynote` 目前另报 `RUN_BUNDLE.md` 的 exact Harness binding 未验证（`harness_binding_invalid`）。这是 owner-issued hard-stop，需要人确认重建当前 Bundle；不要拿另一份 Bundle、路径或默认 Harness 覆盖现有 bytes。
- `deck_ai_sdlc_keynote/` 是完全独立的参考项目。本轮只读了它的 outline，没有修改；其 `git diff` 为空。

## 交接协议（下一次会话先读这里）

这份文件是内容与工作上下文的交接记录；真正的执行状态仍以
`3_versions/v1/_state/state.yaml`、`ppt_flow state` 和 `ppt_flow status` 为准，不能用本文件
代替 state，也不能为了让文字“看起来完成”而手改 state 或 generated 目录。

恢复顺序：

1. 先用 `RUN_BUNDLE.md` 定位并验证当前 deck，再读 `deck-guide.md`。
2. 针对 `3_versions/v1` 读取 `ppt_flow state --json` 与 `ppt_flow status`。
3. 阅读本文件、`2_backbone/story-outline.md`、`2_backbone/manuscript/source-relations.md`，必要时回溯 `1_upstream_raw_material/material-index.md` 及对应 `source-*` 链接。
4. 继续做叙事和页面分组讨论；没有人确认前，不选择 `framed/pure`，不进入 provider、图片或 PPTX 生产。

当前最重要的未决事项：

- 约十页结构和三家企业案例是否最终定稿（当前候选为 Block、Cloudflare、JPMorgan）。
- 本版本的全局 Page Image workflow 由人明确选择 `framed` 或 `pure`。
- `RUN_BUNDLE.md` 的 harness binding invalid 需要 owner 要求的人类确认重建；在确认前保持原 bytes 不动。

边界提醒：`1_upstream_raw_material/` 只按外部材料来源组织，不按 Block 组织；Block 1–4
是下游叙事概念。`dpt_*` 是外部 source of record，`2_backbone/` 是共享内容主干，
`3_versions/v1/` 才是版本页面 source。`deck_ai_sdlc_keynote/` 只可作为只读参考，
与本项目无关，不得把它的改动或生成物带入本 checkpoint。
