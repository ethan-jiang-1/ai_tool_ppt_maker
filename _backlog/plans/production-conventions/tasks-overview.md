# Image2 长程生产 Tasks

> 面向 [pilot-run-plan.md](pilot-run-plan.md) 的 Target UX，适用于 Framed 和 Pure。
> 这些文件把慢速作图拆成可见步骤和人类反馈点；它们不是 source、state、receipt、authorization 或 evidence owner。

截至 2026-07-30，正式 target CLI 仍没有一等 Style Master/Pilot scoped lifecycle，且 target 路径拒绝 help 中遗留的 `--slides`。因此本目录描述的是待 OpenSpec 接受并实现的任务体验，不是当前命令手册，也不能被用于 scratch/provider workaround。

## 为什么叫 Tasks

“协作卡”只说明要聊什么，不足以支撑一个可能持续很久、会中断、会花费 provider 成本的任务。Task list 还必须回答：

1. 现在处于哪个 checkpoint；
2. 下一项合法动作由谁执行；
3. 哪一步会产生远端成本；
4. 什么时候必须停下来让人看真实产物；
5. 中断后依据什么继续，怎样避免重复提交。

## 两层流程

产品层共用同一反馈节奏，Controller 层保持独立：

```text
共同节奏
  Style Master -> Pilot Run -> [如需要] Expansion -> Complete Raw Review -> Delivery Review

已选 workflow
  framed -> Framed source / underlay / compositor / review contribution
  pure   -> Pure source / full-page bytes / review contribution
```

人不需要理解或经过未选择的 workflow。每个 task instance 只呈现当前已选路径。

## 三份顺序任务清单

| 阶段 | Task list | 强制暂停点 | Runtime 权威 |
| --- | --- | --- | --- |
| Style Master | [style-master-tasks.md](tasks/style-master-tasks.md) | 真实 candidates 已展示，等待视觉方向决定。 | Candidate plan/provenance、effective-style selection 与 acceptance receipt owner。 |
| Pilot Run | [pilot-run-tasks.md](tasks/pilot-run-tasks.md) | 精确 scope 授权前；production-equivalent 代表页完成后。 | Full raw plan、Pilot grant、submission/materialization 与 Pilot/complete-review owner。 |
| Expansion / Reviews | [expansion-and-reviews-tasks.md](tasks/expansion-and-reviews-tasks.md) | Expansion 授权前；完整 raw projection 后；最终 deck 后。 | Expansion grant、accepted raw evidence、final manifest 与 delivery receipt owner。 |

最后一份清单包含三个不能合并的 checkpoint：Expansion Authorization、Complete Raw Review、Delivery Review。

## Checkbox 的含义

- `[ ]` 表示该协作步骤尚未被当前 task projection 满足。
- `[x]` 只表示 Agent 已完成步骤或已取得该行要求的 owner-issued reference。
- 人类决定项只能在人实际看到该 checkpoint 的真实证据并作答后勾选。
- Checkbox 不能证明 provider submission、materialization、acceptance、可复用性或交付；owner facts 与 checkbox 冲突时，必须刷新 task projection。

本目录中的文件是可复用 task definitions，不是某个 run 的活进度。未来实现应由已选 Controller 为 exact run 生成或刷新 run-scoped task projection；其保存位置和 writer 必须由对应 capability spec 定义，不能由 Agent 临时发明。

## 每个慢速步骤的执行循环

```text
inspection 给出一项最近合法动作
  -> Agent 展示本步范围、成本和结束条件
  -> 需要时取得精确人类授权
  -> runtime 对一个 item 做 claim -> submit -> commit
  -> Agent 报告 owner-issued progress
  -> 下一 item 或强制人类 checkpoint
```

- 授权是提交上限，不是必须把整批跑完的命令；人在下一次 provider 调用前暂停或取消时，未提交项保持未提交。
- 每个付费 item 必须在下一 item 开始前持久化 attempt/grant consumption 与 bytes/provenance，不能等整批结束后一次性落盘。
- 进度由 materialization/attempt owner 计算，例如“已物化、明确未提交、失败已终结、结果未知”；Task list 只引用摘要，不手工统计文件。
- 进程中断后先 inspection，再继续 owner 明确判定为未提交的 item。结果未知的 attempt 必须 hard-stop 并先对账，不能自动 retry。
- Agent 在每个 item 终结或 checkpoint 到达后给人简短进度；不要求人逐页批准，但必须在 task 定义的人类暂停点等待真实反馈。

## Resume 纪律

每次恢复工作都必须：

1. 解析用户明确指定的 exact run/controller identity；
2. 从 workflow inspection/status 和 owning state/evidence interface 取得当前事实与唯一最近合法动作；
3. 重新投影 task 状态，只保留人的目标、代表页理由和定性反馈；
4. 若旧 task 与 runtime 不一致，清除陈旧勾选或标为历史观察；
5. 通过 owner 执行修复，再重跑同一个 checkpoint。

不得从 checkbox、逐页文件表、文件名、生成目录或聊天记忆推断授权、成功、接受或可复用性。

## 反馈后的最小路由

人反馈“没做对”后，先按 ownership 与 stale artifact 选择最小路径：

| 反馈类型 | 路由 |
| --- | --- |
| Framed Header Text & Style，不改变 raw contract | Provider-free Header Text & Style Refresh。 |
| Raw visual/style/profile 或 Pure 页面像素 | 对失效范围走 Generated Image Rebuild，并重新经过相应 review。 |
| Notes only | Notes-Only Refresh。 |
| 增删、重排、workflow 切换或其他结构变化 | 先走带 preview 与 exact plan hash 的 Structural Versioning Path。 |

Agent 不能因 task 上已有勾选而扩大刷新范围，也不能直接修改 `_generated/`、receipt、state、journal 或 grant。

## 小范围规则

- 当前 paid-generation debt 为 1-5 页时，完整 debt set 就是付费 Pilot scope；生成后直接进入一次完整且当前的 raw review，不再制造 partial Pilot decision 或 Expansion grant。
- 该完整 raw review 覆盖 full plan 的全部当前 tuples，不只覆盖刚生成的 1-5 页。
- paid-generation debt 为零时，不制造 Pilot authorization 或 synthetic Pilot evidence；若仍缺完整 raw acceptance，则直接进入 complete raw-review owner。
- Provider-free refresh 不人为进入 Pilot Run。

## Task instance 纪律

- 只记录人的意图、选择理由、反馈和 owner-issued reference，不复制 runtime wire schema。
- 不记录 API secret、provider credential、具体 `.env` 读取方式或 run-specific provider command。
- 不在本共用目录保存具体 deck 的当前进度；历史上下文只能进入 `observations/`，并明确其非权威和陈旧风险。
