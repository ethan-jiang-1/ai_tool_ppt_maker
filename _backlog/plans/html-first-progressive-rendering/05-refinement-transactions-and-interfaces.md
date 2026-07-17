# 专题 05: 精修事务与模块 Interface

> 总控: [`../html-first-progressive-rendering.md`](../html-first-progressive-rendering.md)
> 状态: 决策完成 | 更新: 2026-07-17

## 深模块形状

外部调用者不面对 HTML renderer、Image2 renderer、compositor 三个平级 interface。提供一个深的 slide composition module：

```text
composeSlide(structured_plan, resolved_assets, runtime_profile)
  -> verified final-slide | structured diagnostics
```

HTML renderer、chart adapter、local asset adapter 和 Image2 visual-slot adapter 是内部 seam。Stage 4 不需要知道一页是否使用 Image2。

## Refinement plan

`refine plan` 是零远端调用的成本/范围事务：

- 输入已解析的 slide selectors 和 target generation profile。
- 为每页分配稳定 `attempt_id`，绑定 formal slide ID、slot ID、candidate ordinal=1 和 target profile。
- 输出页面候选调用数；若 style reference 尚未就绪，另列 setup 调用和总调用数。
- hash 排除 presentation prose、时间戳和机器绝对路径；绑定 source、visual contract fingerprints、visual config、profile、scope 和 attempt IDs。
- `refine generate` 必须接收已确认的 exact plan hash；stale 或扩大 scope 时拒绝，不自动重算后继续。
- provider failure 不自动重试；下一次尝试重新计划并授权。

MD Controller 在用户确认后通过 state API 记录 version-scoped authorization `{plan_sha256, attempt_ids, authorized_at}`。CLI 只执行仍 current、已授权且未消费的 attempt；没有 state authorization 时拒绝远端调用。

### Exactly-once cost boundary

- 每个 attempt 在 submit provider 前原子标记 `submitting`，provider 接受后记录 task ID/同步响应 evidence 并标记 `submitted`。
- 已处于 `submitted|succeeded|failed` 的 attempt 再次执行时不提交第二次，只返回已有 receipt/result。
- 进程在 `submitting` 与保存 provider evidence 之间崩溃时，状态为 `unknown-submit`；不得自动重试，必须先用 provider/task evidence 对账，无法证明未提交时按已发生调用处理。
- 部分失败会消费对应 attempt；重试必须生成新 attempt ID 和新 plan，并再次授权。
- 成本回执报告 submitted attempts，不把“返回成功图片数”冒充计费次数；provider 实际计费规则在授权文案中明确说明。

## Candidate provenance

每个候选记录：

- formal `slide_id` 与唯一 `slot_id=primary`
- derived visual prompt fingerprint
- model、resolution、style reference 与 reference asset SHAs
- provider task evidence
- output byte SHA
- generation time 与当前 review status

candidate manifest 只拥有生成 provenance，不拥有 review status。authorization、reviewed/accepted/rejected 和 attempt consumption 都由 `_state/state.yaml` 的 version-scoped reserved record 管理。

同一 generation fingerprint 下不同 output SHA 的候选必须共存，不互相覆盖。

## Promotion transaction

“采用这一版”是本地、可幂等的 source transaction：

1. 验证 slide ID、slot ID、candidate fingerprint 和 output SHA。
2. 在目标目录写临时文件、校验 SHA，再 rename 发布版本 override asset；页面此时尚未引用它。
3. 合并并校验 version asset manifest，原子文件替换注册新 asset ID/provenance。
4. 在内存更新该页 `primary_visual.selected_asset` 并完整验证 slide document。
5. 最后原子替换 `slide-specifications.md`；这是 commit point，因为 source 只引用已存在、已登记的 asset。
6. 重跑该页 composition；成功后通过 state API 写版本级接受证据和最终 asset SHA。

失败语义：

- commit point 前失败，当前页面行为不变。
- 未引用 asset/manifest entry 由 transaction receipt 标记，幂等重试或显式清理时回收。
- commit 后 composition/state 失败，source/control 仍是权威；返回 local-recovery receipt，重跑便宜阶段并补 evidence，不回滚已发布 source。
- current final-slide 与 state evidence 都完成后才报告成功。
- 重复接受同一候选是 no-op。

“保留 HTML”通过同一 source transaction 清除 `selected_asset` 并重合成，不删除候选或正式历史 asset。

source 中写入的 selection 结构为：

```yaml
selection:
  asset_id: refined-uxgap-primary-a1b2c3d4e5f6
  accepted_for: <visual_contract_fingerprint>
  output_sha256: <full_sha256>
```

asset ID 使用 `refined-<spoken_key>-primary-<sha12>`，promotion 同时写足现有 asset manifest 要求的 path/type/label/description/usage guidance 和 provenance 扩展字段。

## CLI surface

```text
ppt_flow build <run-dir>
ppt_flow refine plan <run-dir> --only <ids>
ppt_flow refine generate <run-dir> --plan <path> --plan-sha256 <sha>
ppt_flow refine accept <run-dir> --slide <id> --candidate-sha <sha>
ppt_flow refine use-html <run-dir> --slide <id>
ppt_flow refine clean <run-dir> [--keep accepted,recent-rejected]
```

CLI 不自行推荐页面、不自行记录用户授权、不自动重试。所有 non-zero JS-controlled failure 继续遵守 `cli-surface` 的 secret-safe failure envelope。

## MD Controller / JS 所有权

MD Controller / Agent：

- 推荐页面、解释收益和成本
- 创作 `CONCEPT`、`SLIDE BODY` 和 visual brief
- 展示 contact sheet 与 side-by-side 实物
- 取得用户授权和最终视觉判断
- 根据 CLI receipt 决定重试、回退、换 vNext 或新 deck

JS / CLI：

- schema/layout validation 与 overflow diagnosis
- HTML screenshot、fingerprint、manifest 和 byte verification
- refinement plan hash、scope 校验和远端调用计数
- candidate provenance、promotion transaction、state evidence
- deterministic composition 与 PPTX assembly

## 授权不变量

- 一批授权只覆盖计划中列出的页面、slot、profile 和一次调用/页。
- 新增页、改变 profile、失败重试或生成第二候选都需要新 plan。
- structural/materialization 路径不能借机获得远端授权。
- Image2 readiness 不满足时保持完整 HTML 成品，不把 deck 标为未完成。
