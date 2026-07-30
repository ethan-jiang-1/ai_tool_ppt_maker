# Production Conventions — 生产约定

> Framed（框架合成模式）和 Pure（全图模式）共用的产品原则、长程生产节奏与协作词汇。
> 本目录是设计材料，不是 runtime authority（运行时权威）、OpenSpec change 状态或具体 run 的进度账本。
> 第一阶段唯一执行顺序与 program checklist 见 [../progressive-plan.md](../progressive-plan.md)。

## 这里负责什么

本目录的共用层只保存跨 workflow 稳定成立的约定：尽早展示真实 Style Master（风格母版）、先做代表性 Pilot Run（试生产）、再单独授权扩量；慢速作图按可恢复的 task checkpoint 一步步推进；稳定 `slide_id` 使用 `mnemonic-v1`；人拥有内容和视觉判断，Agent 执行已授权机械工作。具体 run 旧信息只能隔离在 `observations/`，并始终视为非权威历史。

Framed 和 Pure 共享概念，不共享用户流程。版本 workflow 选定后，各自沿独立 Controller 路径前进；共享 JS 只能复用不解释 workflow 语义的机械能力。

## 权威边界

具体生产事实按以下顺序决定：

1. `AGENTS.md`、`openspec/config.yaml`、accepted capability specs 与 executable contracts；
2. 当前 source、state、receipt、plan、authorization grant（授权许可）与 evidence owner；
3. Controller/status/inspection 对上述直接事实的当前投影；
4. 本目录的约定、任务清单和历史观察。

Markdown checkbox、文件存在、文件名、聊天记录或历史观察都不能证明当前授权、物化、审查接受、可复用性或下一合法动作。恢复工作必须读取 owner 的当前事实，并通过同一个 owner 修复和重跑。

## 目录

| 文件 | 职责 |
| --- | --- |
| [pilot-run-plan.md](pilot-run-plan.md) | Style Master、Pilot Run、扩量与完整审查的共同产品原则和目标契约。 |
| [slide-naming.md](slide-naming.md) | `mnemonic-v1` 的完整语义、语法、唯一性与文件身份约定。 |
| [tasks-overview.md](tasks-overview.md) | Target UX 的长程生产任务模型、暂停点与恢复纪律。 |
| [tasks/](tasks/) | Style Master、Pilot、Expansion/Reviews 的顺序任务清单；用于推进和反馈，不替代 runtime owner。 |
| [observations/](observations/) | 从旧草稿保留下来的具体 run 历史观察；不得用于 resume、授权或证据判断。 |

本目录不再维护独立 OpenSpec change 顺序。Style Master 工作归入根计划 Change 2，Pilot/Expansion、逐项进度、完整审查与恢复归入 Change 3。

## Policy 对齐

未来由本目录形成的 OpenSpec proposal/design 必须引用并应用：

- [human-centered-gates.md](../../../openspec/policies/human-centered-gates.md)：负责 `guide`、`confirm`、`hard-stop` 与 continuation/waiver 边界；
- [agent-assistance-and-control.md](../../../openspec/policies/agent-assistance-and-control.md)：负责直接 Source of Record、human/Agent/runtime 交接与 same-check recovery；
- [simple-reliable-control.md](../../../openspec/policies/simple-reliable-control.md)：要求控制比被验证的生产工作更简单。

## 使用纪律

- 先在这里澄清共同产品原则，再通过正常 OpenSpec change 修改 accepted behavior；本目录本身不授权代码或 runtime state 变更。
- 共用层只统一概念、Gate 语义和机械接口，不合并 Framed/Pure 的 Controller 路径或审查问题。
- 具体 deck 数据、provider 配置、当前版本、逐页进度和恢复命令不得写入本共用目录；run-scoped task projection 必须由当前 Controller/inspection 产生或刷新。
- Task checkbox 只表示协作步骤已走到哪里，不能证明授权、提交、物化、接受或交付；Agent 只能在取得对应 owner-issued reference 后勾选事实型步骤。
- Task 清单不得复制 runtime schema，也不得要求人手工维护可以由 owner 直接计算的逐页成功状态。
- 不提供 `_scratch/` provider workaround，不直接删除或改写 `_generated/`、state、receipt、journal 或 authorization。
