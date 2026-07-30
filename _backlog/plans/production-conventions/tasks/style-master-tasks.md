# Style Master Tasks

> Target UX 的空白顺序任务清单。用于在页面级付费生产前确认真实视觉方向。
> Checkbox 和填写内容不证明 candidate provenance、provider authorization、promotion、acceptance 或当前流程状态。

## 0. 可执行性与身份

- [ ] 用户明确指定了 exact run/controller identity。
- [ ] Read-only inspection 确认 source/state pair、已选 workflow 和一项 owner-issued next action。
- [ ] Inspection 确认一等 Style Master candidate lifecycle 已被 accepted specs/runtime 实现。
- [ ] 若该 lifecycle 尚不可用，停在 OpenSpec/规划边界；未创建 scratch script、未直接请求 provider、未覆盖 `style_master.jpg`。

| Context | Human-readable reference |
| --- | --- |
| Exact run/controller | [填写；不替代 runtime identity] |
| Workflow | [Framed 或 Pure，只填当前路径] |
| Inspection / observed at | [填写 owner-issued reference 与时间] |
| 本轮视觉问题 | [填写] |

## 1. 固定视觉意图

- [ ] 主题、受众和叙事意图足以判断视觉方向。
- [ ] 已写明希望保留与必须避免的视觉特征。
- [ ] 已写明需要跨页稳定的 identity/reference；没有则明确为“无”。
- [ ] 已选 workflow 的视觉约束已由对应 Controller 提供，未混入另一 workflow 的审查问题。

| Intent | Content |
| --- | --- |
| 主题、受众、叙事意图 | [填写] |
| 希望保留 | [填写] |
| 必须避免 | [填写] |
| 跨页 identity/reference | [填写] |

## 2. 规划 Candidates

- [ ] Owner 已生成 provider-free candidate plan，并绑定当前 style intent、workflow、generation profile 和 candidate count。
- [ ] Plan 展示每个 candidate 的目的、最大 provider submissions 与成本后果。
- [ ] Owner 已投影 effective Style Master 的作用域和 promotion 影响范围。
- [ ] 若 canonical style asset 被多个版本共享，已展示会变 stale 的 current plans/evidence；没有把共享文件覆盖伪装成单一 run 的局部修改。
- [ ] Plan/reference：[填写 owner-issued reference]。

### 人类授权暂停点

- [ ] 人已看到 exact candidate plan、最大提交次数和后果。
- [ ] 人的选择：[authorize / revise / decline]。
- [ ] 非零提交已有 owner-issued authorization reference：[填写；本清单本身不授权]。

未完成以上暂停点时，Agent 不得进入 provider submission。

## 3. 逐项生成并报告进度

- [ ] Runtime 在每个 candidate submit 前重检当前 plan/grant。
- [ ] 每个 candidate 按 owner 的 `claim -> submit -> commit` 路径运行；bytes、attempt/grant consumption 与 provenance 在下一项开始前持久化。
- [ ] Agent 在每项终结后报告 owner-issued progress，不用文件数量自行统计。
- [ ] 若出现 uncertain attempt，已 hard-stop 并进入 owner 对账；未自动重试。
- [ ] 当前 materialization/progress reference：[填写]。

人的暂停或取消只阻止尚未开始的 provider submit。已经 in-flight 的结果由 attempt owner 对账，不能靠 checkbox 推断。

## 4. 展示真实 Candidates

- [ ] Owner 已验证 candidate bytes、currentness 与 provenance。
- [ ] 人看到的是实际图片 bytes，不是 prompt、文字摘要、缺 provenance 的截图或“文件存在”。
- [ ] 比较视图明确标注 candidate identity，且没有把未选择 workflow 的问题带入当前旅程。

| Owner-issued candidate reference | 关键差异 | 人的反馈 |
| --- | --- | --- |
| [填写] | [填写] | [填写] |

### 人类视觉决定暂停点

- [ ] 人的决定：[proceed / repair / redirect]。
- [ ] 视觉理由：[填写接受了什么，或需要改变什么]。
- [ ] 已知 warning：[填写；没有则写“无”]。
- [ ] Reasoned continuation：[仅当 owning contract 明确把 warning 分类为 confirm 时单独填写]。
- [ ] Owner-issued decision reference：[填写；未产生则不能继续]。

`proceed` 只接受当前视觉方向，不是 Pilot 通过、页面生成授权或 waiver。Identity、provenance、authorization、evidence completeness 与 recoverability 问题没有 continuation。

## 5. Promotion 与交接

- [ ] Owner 在 promotion 前重新验证 candidate bytes、acceptance decision、previous effective-style hash 和影响范围。
- [ ] Promotion 使用 CAS/atomic owner path 更新 effective Style Master selection；未审查 candidate 没有覆盖 canonical asset。
- [ ] Acceptance receipt 绑定实际 selected bytes 与适用 scope；没有补写无法证明的历史 provenance。
- [ ] 受 style/profile 变化影响的 full plan、Pilot decision 与后续 evidence 已由 owner 判定 stale。
- [ ] Inspection 已刷新并给出一项最近合法 next action。

| Handoff | Reference |
| --- | --- |
| Effective Style Master / acceptance | [填写 owner-issued reference] |
| 带入当前 workflow 的反馈 | [填写] |
| Owner-issued next action | [填写一项] |
| 尚未解决的人类问题 | [填写；没有则写“无”] |

## 决定分支

- `repair`：回到 style intent/candidate owner，修复后重跑本 checkpoint；另一次付费提交需要新的精确披露与授权。
- `redirect`：回到视觉方向选择；workflow 切换必须走 Structural Versioning Path。
- `proceed`：仅在 owner promotion/acceptance 成功后进入已选 workflow 的 [Pilot Run Tasks](pilot-run-tasks.md)。

恢复时重新读取 runtime truth 并刷新勾选；本文件不能独立 resume。
