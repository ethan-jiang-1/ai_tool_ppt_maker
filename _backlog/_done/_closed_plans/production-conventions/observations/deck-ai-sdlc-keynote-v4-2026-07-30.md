# `deck_ai_sdlc_bpm_keynote` v4 历史观察

> 记录日期：2026-07-30。
> 性质：从旧 production task 草稿迁出的 run-specific historical observation（具体 run 历史观察）。
> 未重新读取或验证该 run 的当前 source、state、receipt、plan、authorization、bytes 或 evidence。

## 使用警告

本文只保留当时讨论过的视觉上下文和暴露出的流程矛盾：

- 不能用于 resume、授权、断点续传、重试、审查接受或交付判断；
- 不能证明所列文件、页面、identity reference 或视觉事实现在仍存在或有效；
- 不能替代当前 workflow inspection/status 或任何 owning interface；
- 若以后重新进入该 run，第一步必须读取 exact current runtime truth，不能从本文恢复命令或进度。

## 当时记录的视觉方向

旧草稿把视觉语言描述为：

- warm editorial sketch（温暖编辑式手绘）；
- cream paper `#F5F0EB`、sepia ink `#2D1B11`、amber `#D97706`；
- underlay 约束强调 no lettering、unmarked surface 和 abstract visual element；
- 避免蓝、绿、霓虹、紫、纯黑、纯白与冷灰。

这些只是当时的文字观察。它们不证明 Style Master bytes、generation profile 或人的 acceptance receipt 当前有效。

## 当时记录的 Identity Role Map

| Formal `slide_id` | 旧草稿中的角色 | 旧草稿中的 reference/意图 |
| --- | --- | --- |
| `OneTool` | guide | `guide.png`，开放手势与引导姿态。 |
| `NewPart` | guide | 同一 guide identity。 |
| `OldMap` | guide | 同一 guide identity。 |
| `FabFive` | guide | 同一 guide identity。 |
| `InfoProc` | guide | 同一 guide identity。 |
| `OnLoop` | guide | 同一 guide identity。 |
| `FramAut` | collaborating | `collaborating.png`，互相投入的协作姿态。 |
| `AllNem` | duo | 旧草稿写为 `guide.png`，中心角色向外连接。 |

旧草稿同时用 `Agent` 指人类协作角色和画面角色，用 `guide` 指行为角色和 visual identity。这种术语重载容易混淆。后续若该 run 仍需要这些角色，应由当前 identity registry 明确区分 `workflow actor` 与 `visual role`，不能沿用本文推断。

## 当时记录的进度陈述

旧 Final task 声称：

- 版本为 `3_versions/v4`，workflow 为 Framed；
- “量产进度 5/25 页完成（含 pilot 复用）”；
- `GoRev`、`TriYear`、`WhyCode`、`OneTool` 被列为完成；
- `NewPart` 同时被写为“生成中”。

这组陈述内部就不一致：四页列为完成，第五页仍在生成，却被汇总为 `5/25`。它也没有 owner-issued materialization/provenance evidence，因此既不能证明当时真实完成数，也不能证明今天的状态。

## 暴露出的流程矛盾

旧三份 task 同时写下了互不相容的状态：

1. Style Master 被称为“已锁定”，但 candidate/review/lock 的一等正式环路又标为未实现；
2. Pilot Run 被标为“待启动”，尚无代表页或人的 `proceed`；
3. Final Production 却被标为已经开始并达到 `5/25`；
4. 所谓完成依赖文件名、大小和手工表格，没有当前 plan、grant、materialization 与 review owner 的证明。

这正是 [pilot-run-plan.md](../pilot-run-plan.md) 要修复的 UX 与控制问题：Style Master、Pilot、Expansion、完整 raw review 和 Delivery Review 必须是依次可见且各有 owner 的 checkpoint，不能由静态 Markdown 宣布跨越。

## 将来重新进入该 run 时

只做以下信息恢复：

1. 解析用户明确指定的 exact run/controller identity；
2. 读取 workflow inspection/status 与 owning state/evidence；
3. 依据 owner-issued current fact 判断本文哪些视觉意图仍值得讨论；
4. 通过唯一合法接口修复或继续，并重跑同一 checkpoint。

本文不保存 provider secret、`.env` 操作、scratch 命令、逐页重试命令或 `_generated/` 修改方式。
