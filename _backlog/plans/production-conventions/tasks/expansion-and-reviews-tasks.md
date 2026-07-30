# Expansion And Reviews Tasks

> Target UX 的空白顺序任务清单。依次处理 Expansion Authorization、Complete Raw Review 和 Delivery Review。
> 三个 checkpoint 共用一份清单，但各自的 owner、证据与人类决定绝不合并。

## 0. 刷新当前事实

- [ ] 用户明确指定了 exact run/controller identity。
- [ ] Inspection 确认 source/state pair、已选 workflow、full raw plan 和一项最近合法动作。
- [ ] Scope、plan、source、workflow、profile、bytes 与 execution identity 都由 owner 判定 current；有漂移时已回到 owner 重新规划。
- [ ] 未根据 `_generated/`、checkbox、文件名或旧聊天恢复进度。

| Context | Owner-issued reference |
| --- | --- |
| Exact run/controller | [填写；不替代 runtime identity] |
| Workflow | [Framed 或 Pure，只填当前路径] |
| Inspection / observed at | [填写] |
| Full raw plan | [填写] |
| Current Pilot decision | [partial Pilot 才填写；full-debt branch 写“不适用”] |

## Checkpoint A：Expansion Authorization

仅当 partial Pilot 后仍有 paid-generation debt 时执行。Pilot `proceed` 不是 Expansion 授权。

- [ ] Owner 验证 current partial Pilot `proceed`，并计算仍未有效物化的 current paid items。
- [ ] Remaining projection 展示 exact ordered IDs、maximum submissions、成本后果和 Pilot bytes reuse 结果。
- [ ] 每个 reuse item 已由 materialization owner 验证 plan/contract/profile/source/grant/bytes binding，不凭文件名复用。
- [ ] 若 remaining paid scope 为零，已跳过本 checkpoint；未制造 synthetic grant。

| Expansion fact | Owner-issued reference/summary |
| --- | --- |
| Remaining-scope projection | [填写] |
| Exact paid IDs / maximum submissions | [引用 owner projection] |
| Pilot materialization reuse | [填写 owner result] |
| 人看到的成本与后果 | [填写] |

### 人类授权暂停点

- [ ] 人已看到 exact remaining scope、最大提交次数和后果。
- [ ] 人的选择：[authorize / revise / decline]。
- [ ] Owner-issued Expansion grant reference：[填写；本清单本身不授权]。

未完成以上暂停点时，Agent 不得进入 Expansion provider submission。

### 逐项 Expansion

- [ ] 每个 item 在 submit 前由 owner 重检 current plan/grant 并取得唯一 claim。
- [ ] 每个结果在下一 item 开始前提交 bytes、attempt/grant consumption 与 provenance。
- [ ] Agent 在每项终结后报告 owner-issued progress，不手工维护逐页成功状态。
- [ ] 人在下一次 submit 前暂停或取消时，尚未 claim 的 items 保持未提交。
- [ ] 失败或 uncertain attempt 已 hard-stop 并对账；任何额外付费 submit 都先重新披露精确 scope 并取得新授权。

| Progress | Owner-issued summary |
| --- | --- |
| Materialized / unsubmitted / failed-terminal / uncertain | [填写] |
| Progress reference | [填写] |
| Next legal action | [填写一项] |

## Checkpoint B：Complete Raw Review

该审查覆盖 full current raw plan 的全部 tuples，包括 provider-free reuse、Pilot bytes 和 Expansion bytes。若 Pilot 已耗尽全部 paid-generation debt，直接从 Pilot Tasks 进入这里，不先询问一次 partial Pilot `proceed`。

### Runtime 前置验证

- [ ] Raw-review owner 验证完整 coverage、currentness、raw byte digests、plan/contract/profile/source binding 与逐项 grant/attempt provenance。
- [ ] 多批 materializations 以逐项 provenance 形成一份完整 evidence；没有用“最后一个 grant hash”追溯代表全部 bytes。
- [ ] 缺失、partial、stale、mismatched 或 provenance 不明时已 hard-stop，未把确定性问题交给人判断。
- [ ] Complete raw projection reference：[填写 owner-issued reference]。

### 人类质量暂停点

- [ ] 人看到 full current projection，并能以 `position + formal slide_id + title` 讨论每页。
- [ ] 人只需判断视觉/内容质量；来源可归属、coverage 与 currentness 已由 runtime 前置验证。
- [ ] 人的决定：[proceed / repair / redirect]。
- [ ] 整体反馈与需 repair 页面：[填写；没有则写“无”]。
- [ ] 已知 warning：[填写；没有则写“无”]。
- [ ] Reasoned continuation：[仅当 owning contract 明确允许时单独填写]。
- [ ] Owner-issued accepted raw evidence reference：[填写；未产生则不能 finalization]。

部分 Pilot 通过、文件齐全或 checkbox 全勾都不能替代 complete/current accepted raw evidence。

## Finalization

- [ ] Selected workflow adapter 已从 exact current accepted raw evidence 发布 common final-slide manifest。
- [ ] Framed 只使用 accepted underlays 与当前 Text Frame 通过唯一 production compositor 合成；Pure 原样发布 accepted raw full-page bytes。
- [ ] Finalization 未调用 sibling workflow，也未自行发布 PPTX、notes 或 delivery decision。
- [ ] Shared delivery owner 已组装 PPTX 并生成 notes receipt。

| Artifact | Owner-issued reference |
| --- | --- |
| Final manifest / projection | [填写] |
| PPTX assembly receipt | [填写] |
| Notes receipt | [填写] |

## Checkpoint C：Delivery Review

- [ ] 人看到最终 deck 的当前顺序、最终像素和 notes，而不是 raw/Pilot projection。
- [ ] 人的交付决定：[deliver / repair]。
- [ ] 人的反馈：[填写]。
- [ ] Owner-issued delivery receipt reference：[填写；未产生则不能宣布交付]。

Delivery Review 不能追溯豁免 raw evidence、身份、授权或完整性问题。

## 反馈路由与交接

- Header Text & Style only：走 provider-free Framed refresh，并重跑受影响的 final/delivery checkpoint。
- Raw visual/profile 或 Pure pixels：只让失效 items 进入 Generated Image Rebuild，再重跑 complete raw review。
- Notes only：走 Notes-Only Refresh，再重跑 Delivery Review。
- 增删、重排或 workflow 切换：先走 Structural Versioning Path，再从新版本 owner facts 重新投影 tasks。

| Handoff | Reference |
| --- | --- |
| Owner-issued next action | [填写一项] |
| 尚未解决的人类问题 | [填写；没有则写“无”] |
| 可保留的经验 | [填写；长期经验进入 lessons owner，不进入 runtime state] |

恢复时重新读取 runtime truth 并刷新 task projection；本文件只保留人的意图和理由，不能恢复执行进度。
