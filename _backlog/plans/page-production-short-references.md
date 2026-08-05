# Plan: 渐进式页面生产的短引用

> 类型: 设计 | 更新: 2026-08-05 | 状态: 待 OpenSpec propose

## 背景 / 现状

用户在协作和审查时看到的是 64 位 SHA-256，例如计划、批次、尝试和审核证据的路径/引用。这些值不是页面的业务 ID，而是不可变记录的内容地址、谱系绑定和 provider 幂等性输入。详见 [调查笔记](../../deck_dark_factory/1_upstream_raw_material/page-production-iterations/hash-id-research.md)。

当前渐进式 Page Authority 协议把完整摘要作为精确选择器：计划、批次、尝试和物化存储都校验 64 位摘要与规范 JSON/字节相符；付费 CLI 操作也要求 exact plan/batch/attempt hash。相关权威源是 [store](../../PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_progressive_store.mjs)、[schema](../../PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_progressive_schema.mjs) 和 [CLI spec](../../openspec/specs/cli-surface/spec.md)。

这份 deck 的 334 个不同摘要中，4 个十六进制字符已经有两组碰撞；8 个字符暂时没有碰撞。因此 CRC32、16 位/32 位截断摘要都不能替代 canonical SHA-256 成为路径键、授权键或 provider idempotency key。CRC32 只适合偶然损坏检测，不是内容身份。

真正的人类页面 ID 已经是 `DkfGo`、`CommGo` 等 mnemonic `slide_id`。问题只存在于计划/批次/尝试等协议对象泄漏到协作视图。

## 决策 / 方案

### 目标

在正常的 Controller 协作卡中，让人只看到短、带语义的引用，例如 `plan p-671d4555`、`batch b-5e8784d1`，而不是 64 位字符串；任何实际协议操作仍只使用完整 SHA-256。

### 不变式

1. canonical JSON、原始字节、所有 `*_sha256` 字段、目录名、锁名、历史记录、state、provider request 与 idempotency key 保持完整 SHA-256，既不迁移也不手改。
2. `plans/` 仍是严格内容寻址存储；不新增索引、README、别名或软链接到该目录。
3. 当前 `ppt_flow image2` 的 `--plan-hash`、`--batch-hash`、`--attempt-sha256` 保持 exact-full-digest contract。第一期不接受短值作为付费操作选择器。
4. 任务投影继续是可重建、非权威的协作卡；卡的内容绝不成为授权、恢复或状态推进输入。

### 深模块与 seam

新增纯模块 `scripts/shared/identity/digest_reference.mjs`。它的 seam 位于“已获得完整 owner facts”与“渲染给人”的交界，不进入 raw owner、store 或 provider adapter。

模块的 interface 保持很小：

```js
const index = createDigestReferenceIndex(entries, { minimumLength: 8 });

index.describe({ kind, sha256 }); // { reference: "p-671d4555", sha256 }
index.resolve(reference);         // { kind, sha256 } | not-found | ambiguous
```

`entries` 只接受已验证的完整 64 位摘要及一个受限 kind。Implementation 负责：验证摘要、给 kind 加前缀、在同 kind/current-view 候选集合中计算至少 8 位的最短唯一前缀、碰撞时仅为冲突项加长，并把短引用解析回完整摘要。引用是临时显示值，不写进 canonical record，也不承诺跨卡/跨版本恒定。

这是一层深模块，而不是在每个 Markdown、CLI 或 Controller 调用点散落 `slice(0, 8)`。它集中碰撞规则、错误模式和测试，调用者只传 owner-issued full digests。

### 首期展示规则

1. `page_production_task_projection.mjs` 仍在内存中保存完整 owner facts，但渲染 `_state/page-production-task-projection.md` 时只输出短引用。
2. “Owner References”、human handoff 的 `reference=...`，以及当前 HTML 注释中的投影摘要都不能在协作卡里泄漏 64 位摘要。投影内部返回值可保留完整 `projection_sha256` 给机器使用；人类 Markdown 不显示它。
3. 对页面讨论继续优先显示 `position + slide_id + title`，不以 plan hash 代替页面 ID。
4. 直接 CLI JSON、owner records、诊断的 exact action arguments 与测试 fixture 继续保留完整摘要。第一期不新增 `--plan-ref`、`--batch-ref` 或 `--attempt-ref`。

### 明确拒绝的备选

| 备选 | 结论 | 原因 |
| --- | --- | --- |
| 用 CRC32 取代 SHA-256 | 拒绝 | 仅 32 位，面向偶然错误检测，不保留内容地址/抗碰撞语义。 |
| 把 SHA-256 截成 4 位/8 位并写入 canonical records | 拒绝 | 4 位已发生真实碰撞；8 位不能永久保证唯一，并会破坏现有 exact protocol。 |
| 重命名历史 `plans/<sha256>` 目录 | 拒绝 | 破坏 immutable storage、跨记录引用和恢复路径，且需要对已存在生产数据做风险迁移。 |
| 直接让付费 CLI 接受短前缀 | 延后 | 要先设计 scoped resolver、ambiguous diagnostic、审计和 CLI spec；不应和展示优化混在一个 change。 |
| 用 `P01`/`B03` 之类持久顺序 ID | 延后 | 若 8 位短引用仍不够易读，可另开 change 设计 registry/生命周期；它不是哈希，也不应悄悄加入 canonical record。 |

## 风险 / 取舍

- [短前缀碰撞] -> index 以 8 位为下限，在当前 view/type 内自动加长；若调用者试图解析歧义值，返回明确 `ambiguous`，不猜测。
- [把显示值误当 authority] -> 首期没有 direct CLI short-selector；Controller 始终持有并传递完整 digest。
- [漏掉一个人类可见的摘要] -> 测试协作卡不得匹配任何 64 位十六进制串，并覆盖 owner references、handoffs 与 HTML comment。
- [误改了 protocol] -> 现有 raw-owner、store、provider-idempotency 和 CLI/E2E exact-hash regression 全部必须保持通过。
- [范围膨胀到 Style Master/structural transactions] -> 本 change 只覆盖 progressive Page Authority task projection；其他 hash-heavy UX 单独评估。
- [历史 deck 被迁移] -> 不运行批量迁移，不改 `deck_*` 生产历史；只用 fresh fixture 和已有只读 records 验证渲染。

## 实施路径

1. **OpenSpec 先行。** 创建 `short-page-production-references` change，更新 `cli-surface`（state/card presentation）、`playbook-execution`、`workflow-inspection` 与 `run-bundle-layout` 的 delta specs。不要把 producer 的 full-digest schema 复制到 consumer specs，也不要改变 paid-operation selector contract。
2. **实现并锁定短引用模块。** 增加 `digest_reference.mjs` 与 focused unit tests：有效/无效摘要、最小 8 位、同 kind 碰撞自动加长、不同 kind 前缀分离、重复 full digest、unknown/ambiguous resolve。该模块没有文件系统、state、provider 或 clock 依赖。
3. **接入协作卡 renderer。** 在 `page_production_task_projection.mjs` 的 render seam 建立当前卡的 index；将 owner reference、handoff reference 和 comment 改为短引用或无摘要文本。保持 projection 的 full owner facts、refresh eligibility 和原子写入行为不变。
4. **保持 CLI 协议不变。** `ppt_flow image2` 仍验证并转发完整 hash；不改 `page_authority_progressive_store.mjs`、`page_authority_progressive_schema.mjs`、raw owner 或 provider adapter。必要时只给 `ppt_flow state` 的人类文本增加“短引用已写入协作卡”的描述，不让 stdout JSON 失去 canonical fields。
5. **回归与验收。** 新增 `tests/shared/identity/test_digest_reference.mjs`；扩展 `tests/shared/workflow/test_page_production_task_projection.mjs`；运行目标 CLI/owner/E2E tests 和完整 `npm test`。用碰撞 fixture 验证 8 位不够时不会错误指向某一条记录。
6. **收口。** `openspec validate short-page-production-references --strict`、sync specs、archive change；实施结论被 change 吸收后，按 `_backlog` 搬迁规则将本文件移入 `_done/_closed_plans/` 并更新三个 README。

## 验收标准

- 正常 `_state/page-production-task-projection.md` 的用户可见文本不包含任何 64 位十六进制摘要，且计划/批次/证据仍能被清楚区分。
- 同一协作卡中的短引用至少 8 位、按 kind 明确、无冲突；构造碰撞时相关引用自动加长而非误解析。
- 任何 `*_sha256` canonical 字段、内容地址目录、历史记录、provider idempotency key 和 direct CLI full-hash 操作仍按原样工作。
- 卡被删除或篡改后，refresh 只重建协作视图，不产生授权、provider 调用、store/state/历史变更。
- 新旧同样的 full-digest fixtures 继续通过 raw owner、CLI 和 mock journey 回归。

## 落地关联

本文件不是实施 change。下一步是按上述名称创建一个单独的 OpenSpec change；没有该 change 的 strict specs、任务拆分和测试范围，不开始修改 framework source。
