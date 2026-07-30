# Pilot Run Tasks

> Target UX 的空白顺序任务清单。用于先做少量真实代表页，再让人决定是否扩量。
> Checkbox 不证明 scope、authorization、submission、materialization、Pilot decision 或 Expansion readiness。

## 0. 可执行性与前置事实

- [ ] 用户明确指定了 exact run/controller identity。
- [ ] Inspection 确认有效的 v2 source/state pair、已选 workflow 和 current accepted Style Master。
- [ ] 一等 Pilot scoped lifecycle 已被 accepted specs/runtime 实现。
- [ ] 若尚未实现，停在 OpenSpec/规划边界；未使用 help 中的 `--slides`、scratch script、手工文件或直接 provider 请求模拟 Pilot。
- [ ] Selected workflow owner 已生成一份 provider-free、覆盖 full current raw range 的 plan。
- [ ] 若 paid-generation debt 为零，已跳过 Pilot authorization/materialization，直接进入 complete raw-review owner。

| Context | Owner-issued reference |
| --- | --- |
| Exact run/controller | [填写；不替代 runtime identity] |
| Workflow | [Framed 或 Pure，只填当前路径] |
| Inspection / observed at | [填写] |
| Full raw plan projection | [填写] |
| Paid-generation debt summary | [填写 owner projection；不手工数文件] |

## 1. Agent 提出代表范围

通常提出 3 页；没有具体风险理由时不超过 5 页。若 paid-generation debt 为 1-5 页，则提出完整 debt set。代表性是 Agent 的语义判断，runtime 只负责解析和验证当前正式 IDs。

- [ ] 每个候选都展示 `position + formal slide_id + title`。
- [ ] 每个候选都有一条与当前 workflow 相关的具体风险理由。
- [ ] 提案覆盖当前真正存在的叙事锚点、文字压力、复杂构图或一致性风险，没有机械凑类别。
- [ ] 已区分 review sample 与 paid submission scope：可复用的 current bytes 可以参加 review，但不会制造 paid-generation debt。

| Position | Formal `slide_id` | Title | 主要风险 | 代表理由 |
| --- | --- | --- | --- | --- |
| [填写] | [填写] | [填写] | [填写] | [填写] |

### 人的范围反馈

- [ ] 人已接受、替换、增加或删除候选：[填写]。
- [ ] 调整理由：[填写]。
- [ ] 尚未覆盖但可接受的代表性风险：[填写；这不是 runtime waiver]。

## 2. 精确 Pilot Plan

- [ ] Owner 把人的选择解析为 current formal IDs；未知、歧义或 stale selector 已停止。
- [ ] Pilot projection 绑定 full plan identity、exact ordered IDs、raw contracts、profile、source/execution identity 和 maximum submissions。
- [ ] Projection 明确区分将复用的 current materializations 与需要付费提交的 items。
- [ ] 人已看到 Pilot 结束后的 remaining paid scope；只有非零 remaining scope 才会出现另一次 Expansion 授权。

| Scope fact | Owner-issued reference/summary |
| --- | --- |
| Pilot projection | [填写] |
| Exact ordered review IDs | [引用 owner projection] |
| Exact paid submission IDs | [引用 owner projection] |
| Maximum submissions / 成本后果 | [填写] |
| Remaining paid scope | [填写 owner projection] |

### 人类授权暂停点

- [ ] 人已看到 exact paid scope、最大提交次数和后果。
- [ ] 人的选择：[authorize / revise / decline]。
- [ ] Owner-issued Pilot grant reference：[填写；本清单与 Pilot `proceed` 都不授权]。

未完成以上暂停点时，Agent 不得进入 provider submission。

## 3. 逐项生产 Pilot

- [ ] 每个付费 item 在 submit 前由 owner 重检 current plan/grant 并取得唯一 claim。
- [ ] 每个结果在下一 item 开始前提交 bytes、attempt/grant consumption 与 provenance。
- [ ] Agent 在每项终结后报告 owner-issued progress；未让人手工维护逐页成功表。
- [ ] 人在下一次 submit 前要求暂停或取消时，尚未 claim 的 items 保持未提交。
- [ ] 失败或 uncertain attempt 已返回一项 owner-issued recovery action；未自动重试、未猜测是否扣费。

| Progress | Owner-issued summary |
| --- | --- |
| Materialized / unsubmitted / failed-terminal / uncertain | [填写] |
| Current progress reference | [填写] |
| Next legal action | [填写一项] |

## 4. 生成 Production-Equivalent 证据

### Framed path

- [ ] 选中 underlays 已通过当前 Framed contract 验证。
- [ ] Preview 使用与最终生产相同的 accepted renderer/compiler、字体、浏览器检查和 capture profile。
- [ ] Preview 同时展示无文字 underlay 与真实 Text Frame 合成页，但未写 final manifest、PPTX、notes 或 accepted raw evidence。

### Pure path

- [ ] Projection 展示精确 raw full-page bytes，并带当前 `position + slide_id + title` 与 plan/profile/coverage binding。
- [ ] 未经过 Framed compositor，也未向用户引入 safe-zone/Text Frame 语义。

### 共同完整性

- [ ] Owner 确认 Pilot evidence 对所选 sample current/complete；partial、stale 或 provenance 不明时没有进入人类质量确认。
- [ ] Pilot projection reference：[填写]。

## 5. 选择正确的人类暂停点

### Branch A：仍有 paid-generation debt

- [ ] Owner 确认这是 partial Pilot，后面仍需 Expansion。
- [ ] 人已看到 production-equivalent 代表页。
- [ ] 人的决定：[proceed / repair / redirect]。
- [ ] 决定理由与反馈：[填写]。
- [ ] 已知 warning：[填写；没有则写“无”]。
- [ ] Reasoned continuation：[仅当 owning contract 明确允许时单独填写]。
- [ ] Owner-issued Pilot decision reference：[填写]。

Partial Pilot 的 `proceed` 只有一个效果：允许 Controller 展示 remaining-scope authorization checkpoint。它不授权 Expansion，也不发布 accepted raw evidence。

### Branch B：Pilot 已耗尽全部 paid-generation debt

- [ ] 未创建 partial Pilot decision receipt，也未创建 Expansion grant。
- [ ] Owner 已准备覆盖 full current raw plan 的完整 projection，包括复用 bytes 和本轮 bytes。
- [ ] 人类反馈直接转交 [Expansion And Reviews Tasks](expansion-and-reviews-tasks.md) 的 Checkpoint B，由 complete raw-review owner 只询问一次并发布决定。

即使本轮只生成 1-5 页，完整 raw review 也覆盖 full current tuples，不能只审刚生成的 debt set。

## 6. 反馈路由与交接

- `repair`：按 ownership 选择最小合法 refresh，失效后重跑同一 Pilot checkpoint；新的付费 submit 需要新的精确授权。
- `redirect`：回到 Style Master；workflow 切换走 Structural Versioning Path。
- Partial `proceed`：刷新 inspection 后进入 remaining-scope authorization。

| Handoff | Reference |
| --- | --- |
| 人的定性反馈 | [填写] |
| Owner-issued next action | [填写一项] |
| 后续 review 需保留的问题 | [填写；没有则写“无”] |

恢复时重新读取 runtime truth 并刷新本 task projection；不得从 checkbox 或文件数量推断 Pilot 成功、授权、materialization 或 byte reuse。
