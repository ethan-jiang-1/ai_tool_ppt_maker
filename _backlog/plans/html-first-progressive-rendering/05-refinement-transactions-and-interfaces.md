# 专题 05: 精修事务与模块 Interface

> 总控: [`../html-first-progressive-rendering.md`](../html-first-progressive-rendering.md)
> 状态: 决策完成 | 更新: 2026-07-17

## 深模块形状

外部调用者不面对 HTML renderer、Image2 renderer、compositor 三个平级 interface。提供一个深的 slide composition module：

```text
composeSlide(structured_plan, resolved_assets, runtime_profile)
  -> verified final-slide | structured diagnostics
```

HTML renderer、chart adapter 和 local asset adapter 是该 module 的内部 seam。已接受的 Image2 图在 composition 时只是一个已校验的 local source asset；远端 Image2 adapter 只存在于显式 `refine generate` module，绝不能被 `composeSlide` 或普通 build 触达。Stage 4 不需要知道一页是否使用 Image2。

## Refinement plan

`refine plan` 是零远端调用的成本/范围事务：

- 输入已解析的 slide selectors 和 target generation profile。
- 为每个可能计费的 submit 生成一次并持久化不可预测的 `attempt_id`。页面 attempt 绑定 formal slide ID、slot ID、candidate ordinal=1 和 target profile；若 style reference 尚未就绪，setup submit 也有独立 attempt。重放同一 plan 复用这些 ID，重新计划才生成新 ID。
- 输出页面候选调用数、setup 调用数和总调用数。
- canonical plan 写入 `_scratch/refinement/plans/`，hash 排除 presentation prose、时间戳和机器绝对路径；绑定 source、visual contract fingerprints、visual config、profile、scope 和 attempt IDs。文件丢失时旧授权不可执行，只能重新 plan 并授权。
- 相同 current inputs/scope 已有尚未消费的 plan 时，`refine plan` 返回原 plan/attempt IDs；只有 plan stale、全部消费，或用户明确发起下一轮时才创建新 attempt。这样重复规划不会悄悄制造多个可授权批次。
- `refine generate` 必须接收已确认的 exact plan hash；stale 或扩大 scope 时拒绝，不自动重算后继续。
- provider failure 不自动重试；下一次尝试重新计划并授权。
- setup attempt 是同批授权内页面 attempts 的显式前置依赖。若缺少 style reference，plan 以 `style_reference: {from_attempt: <setup_attempt_id>}` 绑定预期产物；先提交 setup，成功后把输出和 provenance 原子提升为 version override source reference，再用其 SHA 定稿各页面 attempt 的 generation fingerprint。这个预声明的 promotion 是唯一不使原 plan stale 的 source 转移；页面 scope/profile/visual contract 或其他 config/source 变化仍 fail closed。setup 失败或成为 `unknown-submit` 时页面 attempts 保持未消费，HTML 成品不受影响。

用户确认后，MD Controller 调用 `refine authorize`，由 state API 记录 version-scoped authorization `{plan_sha256, attempt_ids, authorized_at}`；该命令只能绑定已经落盘且 current 的 exact plan，不能扩大 scope 或代表用户自行决定。`refine generate` 只执行仍 current、已授权且未消费的 attempt；没有 state authorization 时拒绝远端调用。

### Exactly-once cost boundary

- 每个 attempt 在 submit provider 前原子标记 `submitting`，provider 接受后记录 task ID/同步响应 evidence 并标记 `submitted`。
- 已处于 `submitted|succeeded|failed` 的 attempt 再次执行时不提交第二次，只返回已有 receipt/result。
- 进程在 `submitting` 与保存 provider evidence 之间崩溃时，状态为 `unknown-submit`；不得自动重试。provider 支持 task lookup/idempotency evidence 时才允许自动对账；否则必须向人类报告不确定性并按已发生调用处理，新的提交使用新 plan、attempt 和授权。
- 部分失败会消费对应 attempt；重试必须生成新 attempt ID 和新 plan，并再次授权。
- 成本回执报告 submitted attempts，不把“返回成功图片数”冒充计费次数；provider 实际计费规则在授权文案中明确说明。

## Candidate provenance

每个候选记录：

- formal `slide_id` 与唯一 `slot_id=primary`
- derived visual prompt fingerprint
- model、resolution、style reference 与 reference asset SHAs
- provider task evidence
- output byte SHA
- generation time

candidate manifest 只拥有生成 provenance，不拥有 review status。authorization、reviewed/accepted/rejected 和 attempt consumption 都由 `_state/state.yaml` 的 version-scoped reserved record `visual-refinement.by_version[version_key]` 管理。Change 4 必须把 `visual-refinement` 加入 `RESERVED_NODE_IDS`、state schema validation/heal 和 controller-node collision tests；它和 `header-review` 一样跨 top-level playbook execution 保留，但有独立 freshness contract。删除 slide/version 后旧 record 可留作 cost audit，只有显式 state maintenance 才可压缩；它绝不能阻止其他版本 build。即使 record 经 heal 丢失，source selection + resolved正式资产仍足以本地重建，state 不是 accepted asset 的第二份权威。

同一 generation fingerprint 下不同 output SHA 的候选必须共存，不互相覆盖。

## Promotion transaction

“采用这一版”是本地、可幂等的 source transaction：

1. 验证 slide ID、slot ID、candidate 的 generation/visual-contract fingerprints 和 output SHA 都仍匹配 current source，并在 `_scratch/refinement/transactions/` 原子写入 write-ahead intent。
2. 在目标目录写临时文件、校验 SHA，再 rename 发布到 `overrides/visual-style/assets/reference/refined/<asset_key>/<sha12>.png`；页面此时尚未引用它。
3. 合并并校验 version asset manifest，原子文件替换注册新 asset ID/provenance，并更新 journal。
4. 在内存更新该页 `primary_visual.selection` 并完整验证 slide document。
5. 最后原子替换 `slide-specifications.md`；这是 commit point，因为 source 只引用已存在、已登记的 asset。
6. 重跑该页 composition；成功后通过 state API 写版本级接受证据和最终 asset SHA，再把 journal 标为 completed。

失败语义：

- commit point 前失败，当前页面行为不变。
- commit point 前留下的 asset/manifest entry 由 write-ahead journal 精确标记，启动恢复、幂等重试或显式清理时可回收；不得靠目录猜测。
- commit 后 composition/state 失败，source/control 仍是权威；返回 local-recovery receipt，重跑便宜阶段并补 evidence，不回滚已发布 source。
- current final-slide 与 state evidence 都完成后才报告成功。
- 重复接受同一候选是 no-op。

“保留 HTML”通过同一 source transaction 清除 `selection` 并重合成，不删除候选或正式历史 asset。

source 中写入的 selection 结构为：

```yaml
selection:
  asset_id: refined-uxgap-primary-a1b2c3d4e5f6
  accepted_for: <visual_contract_fingerprint>
  output_sha256: <full_sha256>
```

mnemonic slide 的 asset key 使用既有 `spoken_key`；若显式迁移仍保留不满足 asset-segment 语法的 legacy ID，则使用 `legacy-<sha8(formal_slide_id)>`，不做可能碰撞的字符清洗。asset ID 为 `refined-<asset_key>-primary-<output_sha12>`，文件 path 使用同一 asset key/SHA。promotion 同时写足现有 asset manifest 要求的 path/type/label/description/usage guidance 和 provenance 扩展字段。

## CLI surface

```text
ppt_flow build <run-dir>
ppt_flow refine plan <run-dir> --only <ids>
ppt_flow refine authorize <run-dir> --plan <path> --plan-sha256 <sha>
ppt_flow refine generate <run-dir> --plan <path> --plan-sha256 <sha>
ppt_flow refine accept <run-dir> --slide <id> --candidate-sha <sha>
ppt_flow refine use-html <run-dir> --slide <id>
ppt_flow refine clean <run-dir>                  # dry-run cleanup plan
ppt_flow refine clean <run-dir> --apply --plan-sha256 <sha>
```

CLI 不自行推荐页面、不推断用户授权、不自动重试；`refine authorize` 只把 MD Controller 已取得的明确同意绑定到 exact current plan。所有 non-zero JS-controlled failure 继续遵守 `cli-surface` 的 secret-safe failure envelope。

`refine clean` 默认只产生 `_scratch/refinement/cleanup/` 下的确定性 cleanup plan；apply 必须绑定 exact plan hash。它先归档 recent rejected，再删除计划列出的 orphan/unselected candidate、preview、prompt 和非权威 transport receipt；不触碰正式 override asset、source selection 或 state authorization/attempt history。

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

- 一批授权只覆盖计划中列出的 setup（若有）、页面、slot、profile 和每个明确列出的 attempt。
- 新增页、改变 profile、失败重试或生成第二候选都需要新 plan。
- structural/materialization 路径不能借机获得远端授权。
- Image2 readiness 不满足时保持完整 HTML 成品，不把 deck 标为未完成。
