# 专题 05: Image2 精修事务与模块 Interface

> 总控: [`../html-first-progressive-rendering.md`](../html-first-progressive-rendering.md)
> 状态: 架构已锁定 | 更新: 2026-07-17

## 深模块形状

外部调用者不面对 HTML renderer、Image2 renderer、compositor 三个平级 interface。Image2 不是整页 renderer，而是一个只在显式授权事务中生成 visual-slot asset 的 adapter。对普通生产和维护只提供一个深的本地 composition module：

```text
composeSlide(structured_plan, resolved_assets, runtime_profile)
  -> verified final-slide | structured diagnostics
```

HTML renderer、chart adapter 和 local asset adapter 是该 module 的内部 seam。已接受的 Image2 图在 composition 时只是一个已校验的 local source asset；远端 Image2 adapter 只存在于显式 Image2 transaction module，绝不能被 `composeSlide`、普通 `build` 或 HTML iteration 触达。Stage 4 不需要知道一页是否使用 Image2。

```text
composeSlide(structured_plan, resolved_assets, runtime_profile)
  -> verified final-slide | structured diagnostics

image2 refinement transaction
  -> candidate asset / provenance / cost receipt
  -> accepted source asset (only after user decision)
```

Image2 transaction module 不按每个 CLI 子命令暴露一个浅 wrapper。它只在四个不可混淆的事务 seam 上提供 interface：

```text
planImage2Refinement(current_source, resolved_assets, scope, profile)
  -> immutable cost/scope plan | diagnostics

executeAuthorizedImage2Plan(plan, authorization, image2_adapter)
  -> candidate/provenance/cost receipts | diagnostics

commitImage2Decision(current_source, candidate, decision=accept|use-html)
  -> updated source + local recomposition receipt | diagnostics

applyImage2Cleanup(cleanup_plan)
  -> retained/deleted artifact receipt | diagnostics
```

authorization record/write 继续由 state API 拥有，不塞入 generation module。真实 Image2 transport 与 fake adapter 是同一 provider seam 的两个 adapters；provider task schema、目录拼接、write-ahead journal 和 recovery 留在 module implementation 内，CLI/Controller 只消费上面的 plan/receipt/diagnostic interface。四个 interface 对应零远端规划、可能计费执行、source commit、显式清理四种不同副作用，不能为了减少函数数目合并成一个会暗中跨越授权边界的“万能 refine”。

## Image2 plan

`ppt_flow image2 plan` 是零远端调用的成本/范围事务。普通 HTML 内容、layout 或 visual-system 修改不进入这个 module，继续由 local iteration / build 路径处理：

- 输入已解析的 slide selectors 和 target generation profile。
- 为每个可能计费的 submit 生成一次并持久化不可预测的 `attempt_id`。页面 attempt 绑定 formal slide ID、slot ID、candidate ordinal=1 和 target profile；若 style reference 尚未就绪，setup submit 也有独立 attempt。重放同一 plan 复用这些 ID，重新计划才生成新 ID。
- 输出页面候选调用数、setup 调用数和总调用数。
- canonical plan 写入 `_scratch/image2_refinement/plans/`，hash 排除 presentation prose、时间戳和机器绝对路径；绑定 source、visual contract fingerprints、visual config、profile、scope 和 attempt IDs。文件丢失时旧授权不可执行，只能重新 plan 并授权。
- 相同 current inputs/scope 已有尚未消费的 plan 时，`ppt_flow image2 plan` 返回原 plan/attempt IDs；只有 plan stale、全部消费，或用户明确发起下一轮时才创建新 attempt。这样重复规划不会悄悄制造多个可授权批次。
- `ppt_flow image2 generate` 必须接收已确认的 exact plan hash；stale 或扩大 scope 时拒绝，不自动重算后继续。
- provider failure 不自动重试；下一次尝试重新计划并授权。
- plan 先通过 merged manifest 的保留 ID `image2-style-reference-current` 解析唯一 current asset，再比较 `style_reference_contract_fingerprint`。只有 entry provenance 中 `created_for_style_reference_contract` 匹配且文件 SHA 完整时才可零调用复用；缺失、contract stale 或 asset broken 分别产生 setup-required 或 integrity diagnostic，broken 不得用新 setup 悄悄掩盖，需先显式修复/解除损坏 source 引用。HTML build 不消费该 ID，故其问题不降低已经完成的 HTML delivery 状态。
- setup attempt 是同批授权内页面 attempts 的显式前置依赖。需要新 style reference 时，plan 以 `style_reference: {from_attempt: <setup_attempt_id>, accepted_contract: <style_reference_contract_fingerprint>}` 绑定预期产物；先提交 setup，成功后在 transaction journal 记录 output/provenance，校验并提升到 `overrides/visual-style/assets/refined/image2/style-reference/{output_sha256}.png`，再原子更新 manifest 的 `image2-style-reference-current` binding。manifest replacement 是 setup source commit point；完成后 journal 记录 committed SHA，页面 attempts 才用该 SHA 定稿 generation fingerprint 并继续。commit 前崩溃不改变 current binding，精确标记的 staged/orphan file 可恢复或清理；commit 后崩溃以 manifest/source 为权威补 journal/state，不重新提交 setup。这个预声明的 promotion 是唯一不使原 plan stale 的 source 转移；页面 scope/profile/visual contract、style-reference contract 或其他 config/source 变化仍 fail closed。setup 失败或成为 `unknown-submit` 时页面 attempts 保持未消费，HTML 成品不受影响。

用户确认后，MD Controller 调用 `ppt_flow image2 authorize`，由 state API 记录 version-scoped authorization `{plan_sha256, attempt_ids, authorized_at}`；该命令只能绑定已经落盘且 current 的 exact plan，不能扩大 scope 或代表用户自行决定。`image2 generate` 只执行仍 current、已授权且未消费的 attempt；没有 state authorization 时拒绝远端调用。

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

candidate manifest 只拥有生成 provenance，不拥有 review status。authorization、reviewed/accepted/rejected 和 attempt consumption 都由 `_state/state.yaml` 的 version-scoped reserved record `image2-refinement.by_version[version_key]` 管理。Change 4 必须把 `image2-refinement` 加入 `RESERVED_NODE_IDS`、state schema validation/heal 和 controller-node collision tests；它和 `header-review` 一样跨 top-level playbook execution 保留，但有独立 freshness contract。删除 slide/version 后旧 record 可留作 cost audit，只有显式 state maintenance 才可压缩；它绝不能阻止其他版本 build。即使 record 经 heal 丢失，source selection + resolved 正式资产仍足以本地重建，state 不是 accepted asset 的第二份权威。

同一 generation fingerprint 下不同 output SHA 的候选必须共存，不互相覆盖。

## Promotion transaction

“采用这一版”是本地、可幂等的 source transaction：

1. 验证 slide ID、slot ID、candidate 的 generation/visual-contract fingerprints 和 output SHA 都仍匹配 current source，并在 `_scratch/image2_refinement/transactions/` 原子写入 write-ahead intent。
2. 在目标目录写临时文件、校验 SHA，再 rename 发布到 `overrides/visual-style/assets/refined/image2/visual-slots/<asset_key>/<output_sha256>.png`；页面此时尚未引用它。
3. 合并并校验 version asset manifest，原子文件替换注册新 asset ID/provenance，并更新 journal。
4. 在内存更新该页 `primary_visual.selection` 并完整验证 slide document。
5. 最后原子替换 `slide-specifications.md`；这是 commit point，因为 source 只引用已存在、已登记的 asset。
6. 重新运行 Stage 1 selection resolution，必须得到 `selected` 且 resolved byte SHA 等于 candidate SHA；随后重跑该页 composition。成功后通过 state API 写版本级接受证据和最终 asset SHA，再把 journal 标为 completed。

失败语义：

- commit point 前失败，当前页面行为不变。
- commit point 前留下的 asset/manifest entry 由 write-ahead journal 精确标记，启动恢复、幂等重试或显式清理时可回收；不得靠目录猜测。
- commit 后 composition/state 失败，source/control 仍是权威；返回 local-recovery receipt，重跑便宜阶段并补 evidence，不回滚已发布 source。
- current final-slide 与 state evidence 都完成后才报告成功。
- 重复接受同一候选是 no-op。

“保留 HTML”通过同一 source transaction 清除 `selection`，确认 resolver 得到 `fallback` 后重合成，不删除候选或正式历史 asset。若当前 selection 已因 contract 变化成为 `stale`，该命令仍是显式清除历史 binding；若 selection 为 `broken`，命令可以作为用户明确选择 fallback 的修复事务清除 binding，但必须报告被解除引用的 asset ID/SHA，不得把损坏伪装成普通成功。

source 中写入的 selection 结构为：

```yaml
selection:
  asset_id: refined-uxgap-primary-a1b2c3d4e5f6
  accepted_for: <visual_contract_fingerprint>
  output_sha256: <full_sha256>
```

mnemonic slide 的 asset key 使用既有 `spoken_key`；若显式迁移仍保留不满足 asset-segment 语法的 legacy ID，则使用 `legacy-<sha256(formal_slide_id)>`，不做可能碰撞的字符清洗。asset ID 为 `refined-<asset_key>-primary-<output_sha256>`，文件 path 使用同一 asset key + 完整 `output_sha256`，与 run-bundle 目录合同一致。这里是内部 source identity，不承担口述 UX，因此不截短 SHA；用户界面仍只展示 position + formal slide ID + title。promotion 同时写足现有 asset manifest 要求的 path/type/label/description/usage guidance 和 provenance 扩展字段。

## CLI surface

```text
ppt_flow build <run-dir>                         # HTML/local complete delivery
ppt_flow image2 plan <run-dir> --only <ids>      # zero remote calls
ppt_flow image2 authorize <run-dir> --plan <path> --plan-sha256 <sha>
ppt_flow image2 generate <run-dir> --plan <path> --plan-sha256 <sha>
ppt_flow image2 accept <run-dir> --slide <id> --candidate-sha <sha>
ppt_flow image2 use-html <run-dir> --slide <id>
ppt_flow image2 clean <run-dir>                  # dry-run cleanup plan
ppt_flow image2 clean <run-dir> --apply --plan-sha256 <sha>
```

CLI 不自行推荐页面、不推断用户授权、不自动重试；`image2 authorize` 只把 MD Controller 已取得的明确同意绑定到 exact current plan。所有 non-zero JS-controlled failure 继续遵守 `cli-surface` 的 secret-safe failure envelope。HTML/local build 不需要也不接受 Image2 authorization。

`ppt_flow image2 ...` 只接受显式 `production.pipeline: html-first-v1` 的 version；对 legacy Image2-first deck 必须 fail closed 并路由到 `legacy-image2-maintenance`，不能把 visual-slot transaction 套在 whole-page legacy source 上。反过来，新 HTML-first deck 的 `image2-refine` controller 不调用 legacy `pilot --force-images` / Generated Image Rebuild。

`ppt_flow image2 clean` 默认只产生 `_scratch/image2_refinement/cleanup/` 下的确定性 cleanup plan；apply 必须绑定 exact plan hash。它先按有效 review timestamp 把每页至多一个 recent rejected 像素和 provenance 移入 `_generated/image2_refinement/retained_rejected/`，再删除计划列出的其他 orphan/unselected candidate、preview、prompt 和非权威 transport receipt；不触碰正式 override asset、source selection 或 state authorization/attempt history，也不把 rejected 候选写入 `1_upstream_raw_material/`。若 review evidence 缺失或顺序有歧义，plan fail closed：不列出相关候选的删除项，要求人类明确选择后重新 plan。

## MD Controller / JS 所有权

MD Controller / Agent：

- 推荐页面、解释收益和成本
- 创作 `CONCEPT`、`SLIDE BODY` 和 visual brief
- 展示 contact sheet 与 side-by-side 实物
- 取得用户授权和最终视觉判断
- 根据 CLI receipt 决定重试、回退、换 vNext 或新 deck

HTML/local iteration controller：

- 处理普通文案、layout、visual config、重排和 notes 变化
- 只调用 local parse/compose/materialize/build
- 在 HTML 成品保持完整时不创建 Image2 plan

Image2 refinement controller：

- 只在 HTML 成品已经交付后推荐候选
- 说明页面、slot、收益、预计调用数和失败语义
- 取得明确授权后才调用 `image2 generate`

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
- version-scoped authorization、未接受 candidate 和 scratch transaction 不跨 vNext 继承；只有 source selection + accepted override asset 按版本规则延续，新版本的任何远端 submit 都重新 plan/authorize。
- 继承后的 selection 必须由 target Stage 1 重新解析为 `selected|stale|broken`；只有 `selected` 使用 accepted 像素，`stale` 本地 fallback，`broken` 阻断。state heal 或缺少旧 review evidence 不能改写这一判断。
- `doctor --smoke` / `--probe-vendors` 的诊断 submit 不属于 page candidate plan，但仍是远端调用：Controller 必须单独披露调用数并取得用户确认；诊断成功不产生 page authorization，诊断失败也不消费 page attempt。
