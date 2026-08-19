# Continuation Handoff

更新时间：2026-08-19

## 当前项目

- Deck：`deck_ai_org_transform_keynote`
- Run：`3_versions/v1`
- 类型：keynote
- Pipeline：`page-image-workflow`
- 当前内容阶段：唯一 v1 的 14 页正文第一轮已补齐（1 开启页 + 12 中间页 + 1 结束页）
- 当前 Harness node：`recommend-target-pure-pilot`
- Workflow：`pure`，production identity 为 `source_epoch: 2`
- Provider work：未开始；没有授权、raw image、final image、PPTX 或 delivery evidence
- 当前目标：正文与本地 Style Master 已就绪；后续从 provider-free Pilot scope 选择进入页面生产

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

## 标题页、五段结构与页数

- **第 1 页：独立标题页**。标题暂沿用 Story Outline 当前标题；本页不承担主体论证。
- **Block 1（第 2–3 页）**：个人能力全面开花，并建立“个人已经变了、组织价值没有自动出现”的第一处断层。杠杆与支点是本段的核心隐喻。
- **Block 2（第 4–6 页）**：软件是先锋。以 Martin Fowler Deer Valley → Engelberg 的语气转变为主证据；解释工作单元如何扩展、`Agent = Model + Harness`、Guides + Sensors 和验证回路。AI 成为协作主体的判断在 Harness 机制之后得出。
- **第 7 页：跨行业转场**。软件天然拥有数字上下文、可调用工具和确定性验证；企业还必须补上业务上下文、权限、审计、确定性执行、人工升级和结果责任。
- **Block 3（第 8–10 页）**：三个案例已经确认并各自独占一页。第 8 页 Block（问题所有权/DRI/层级），第 9 页 Cloudflare（Builders/Sellers/Measurers 与内部 Cloudflare OS），第 10 页 JPMorgan（核心基础设施、LLM Suite、培训和自然流失再部署）。
- **Block 4（第 11–13 页）**：第 11 页用组织公式归纳三条路径的共同机制；第 12 页落到一把手的最小启动动作，第 13 页把探索闭环推进到机制化。
- **Block 5（第 14 页）**：独立 Q&A closing 页，只提供开放追问入口，不新增结论或未经支持的证据。

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

1. 保持当前唯一 v1、`pure` workflow 和 14 页顺序，不创建 v2。
2. 三个案例继续分别保留为第 8、9、10 页，不在后续视觉生产中合并。
3. 当前 raw plan hash 为 `6bf8d9cf1ea95df9562714fdf905473fcca575fa4b7d2f48a764d90cb5424fea`，14 页全部 `unsubmitted`。
4. 下一步由 progressive raw owner 选择代表性 Pilot scope；尚未授权任何 provider submit。

## 当前边界与恢复提示

- 不要编辑 `_generated/`、`_state/state.yaml` 或任何 receipt/state bytes。
- `ppt_flow status <run-dir>` 当前结构检查正常，content/visual gates approved、source receipt current、无 raw/final/PPTX。
- `bundle_layout --check 3_versions/v1` 已通过；Harness binding 可解析。
- `deck_ai_sdlc_keynote/` 是完全独立的参考项目。本轮只读了它的 outline，没有修改；其 `git diff` 为空。

## 交接协议（下一次会话先读这里）

这份文件是内容与工作上下文的交接记录；真正的执行状态仍以
`3_versions/v1/_state/state.yaml`、`ppt_flow state` 和 `ppt_flow status` 为准，不能用本文件
代替 state，也不能为了让文字“看起来完成”而手改 state 或 generated 目录。

恢复顺序：

1. 先用 `RUN_BUNDLE.md` 定位并验证当前 deck，再读 `deck-guide.md`。
2. 针对 `3_versions/v1` 读取 `ppt_flow state --json` 与 `ppt_flow status`。
3. 阅读本文件、`2_backbone/story-outline.md`、`2_backbone/manuscript/source-relations.md`，必要时回溯 `1_upstream_raw_material/material-index.md` 及对应 `source-*` 链接。
4. 从当前 owner-issued Pilot scope 选择继续；不要从旧 plan、备份或手写 state 推断授权。

当前最重要的未决事项：

- 14 页结构与三家企业案例已经定稿；第 1 页是 opening，第 14 页是独立 closing Q&A，中间 12 页保留主体论证。
- 本版本的全局 Page Image workflow 已明确选择 `pure`。
- 本地 Style Master `local-existing` 已接受；当前尚无 provider authorization、raw、final 或 PPTX。

边界提醒：`1_upstream_raw_material/` 只按外部材料来源组织，不按 Block 组织；Block 1–4
是下游叙事概念。`dpt_*` 是外部 source of record，`2_backbone/` 是共享内容主干，
`3_versions/v1/` 才是版本页面 source。`deck_ai_sdlc_keynote/` 只可作为只读参考，
与本项目无关，不得把它的改动或生成物带入本 checkpoint。
