## REMOVED Requirements

### Requirement: Production readiness enforces current header-review evidence

**Reason**: 全局 fingerprint + 全量检查的设计与 per-slide 粒度冲突。Gate 应引导而非封锁。

**Migration**: `validateHeaderReviewRecord` 改为返回 `{ applicable, ok, changed, action, hint }` 结构；调用方适配新格式。

## ADDED Requirements

### Requirement: Header review gate guides per-slide

生产环境（`ppt_flow build`、Stage 2 non-preview、Stage 4）的 header review SHALL 以 per-slide 粒度检查当前 full-page 标题是否与上次确认状态一致。Gate 的**主要消费者是 MD Controller**——输出 SHALL 包含 MD 可直接执行的动作指令。

当 deck 中没有任何 `body+header-lock` 幻灯片时，gate SHALL 自动跳过（无对比基线）。

`--only <ids>` SHALL 限缩检查范围到指定 slide；未指定的 slide 不影响结果。

#### Scenario: Single slide title change identified, MD gets actionable command

- **WHEN** s05 的 `title` 从 "传统开发" 改为 "软件优先"
- **AND** 其余 24 页没有变化
- **THEN** gate 输出 `changed: [{id: "s05", field: "title", ...}]`
- **AND** `action` 为 `"ppt_flow pilot --only s05"`（MD 可直接执行）
- **AND** 不阻塞 s01-s04 和 s06-s25

#### Scenario: --only limits gate check scope

- **WHEN** `--only s05,s07` 传入
- **THEN** gate 仅检查 s05 和 s07 的 per-slide fingerprint
- **AND** 其余 slide 的状态不影响 gate 结果

#### Scenario: Pure full-page deck skips gate entirely

- **WHEN** deck 中每张 slide 均为 `full-page`
- **AND** 没有任何 `body+header-lock` slide 作为对比基线
- **THEN** gate 返回 `applicable: false`
- **AND** 不要求任何 header review evidence

#### Scenario: Mixed deck with body+header-lock still requires review

- **WHEN** deck 中有 `body+header-lock` slide
- **AND** 有 content full-page slide 标题变化
- **THEN** gate 仍然适用
- **AND** `action` 字段引导 MD 执行 pilot

#### Scenario: No changes — gate passes silently

- **WHEN** 所有 full-page slide 的标题与上次 review 一致
- **THEN** gate 返回 `ok: true`
- **AND** 不输出阻塞信息

### Requirement: Gate output is structured for MD Controller consumption

`validateHeaderReviewRecord` 的返回结果 SHALL 是一个结构体，主要消费者为 MD Controller：

| 字段 | 类型 | 含义 |
|------|------|------|
| `format` | number | 1=旧 errors 数组（放行），2=新 changed+action |
| `applicable` | boolean | 有 body+header-lock slide → review 有意义 |
| `ok` | boolean | 所有涉及 slide 都 OK |
| `changed` | array | `[{id, field, was, now}]` — 字段级变更 |
| `action` | string | MD 可直接执行，`"{runDir}"` 由 MD 替换（已带引号） |
| `hint` | string | 人话解释 |

MD Controller 处理逻辑：
- `format === 1` → 旧格式，放行
- `ok: true` → 继续管线
- `ok: false, applicable: false` → 继续
- `ok: false, applicable: true` → 替换 `action` 中 `{runDir}` → 执行

Gate SHALL NOT 仅输出 "fingerprint is stale" 等内部术语。

#### Scenario: MD auto-executes action on gate failure

- **WHEN** gate 返回 `ok: false, action: "node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs pilot \"{runDir}\" --only s05"`
- **THEN** MD Controller 替换 `{runDir}` 为实际路径后可直接执行
- **AND** 用户看到 `hint` 知道发生了什么

#### Scenario: Non-existent slide in --only

- **WHEN** `--only s99` 指定了一个 plan 中不存在的 slide
- **THEN** gate 返回 `ok: true`（无 slide 需检查）
- **AND** `hint` 注明 "s99 not found in slide plan"

#### Scenario: Missing header_snapshot in state record

- **WHEN** slide 的 state record 有 `status` 字段但缺少 `header_snapshot`
- **THEN** `changed` 中该 slide 的 `was: null`
- **AND** gate 建议 pilot 确认（数据不一致时宁可确认，不错过变化）

#### Scenario: End-to-end — from title change to gate resolution

- **WHEN** 用户修改 s05 和 s07 的 title 后运行 `ppt_flow build`
- **AND** deck 为混合模式（含 body+header-lock slide）
- **THEN** gate 返回 `ok: false, changed: [{s05,title,...}, {s07,title,...}]`
- **AND** `action` 指向 `pilot --only s05,s07`
- **AND** MD 执行 pilot → 用户 approve → gate 重新检查 → `ok: true` → build 继续

### Requirement: mergeHeaderReviewRecord stores per-slide state

`mergeHeaderReviewRecord()` SHALL 为每张 reviewed slide 写入 `header_snapshot`（当前标题内容快照）、`fingerprint`、和 `status: "reviewed"`。SHALL 自动清理 plan 中已不存在的 slide 条目。当 `hasBodyHeaderLockSlides` 从 false 变为 true 时，所有无 record 的 full-page slide SHALL 标记为 `status: "changed"`。

#### Scenario: Reviewed slide gets snapshot stored

- **WHEN** 用户 approve s05 的 pilot
- **THEN** `slides.s05.header_snapshot` 保存当前 kicker/title/subtitle
- **AND** `slides.s05.status` 变为 `reviewed`
- **AND** `slides.s05.fingerprint` 更新为当前值

#### Scenario: Deleted slide is cleaned up

- **WHEN** slide plan 中不再包含 s05
- **AND** `mergeHeaderReviewRecord` 被调用
- **THEN** state 中 `slides.s05` 条目被移除

### Requirement: buildHeaderReviewInputs produces per-slide fingerprints

`buildHeaderReviewInputs()` SHALL 为每张 full-page slide 独立计算 fingerprint 并返回 `slideFingerprints: { [slideId]: string }`。SHALL 同时返回 `hasBodyHeaderLockSlides: boolean`。

#### Scenario: Per-slide fingerprint varies independently

- **WHEN** s05 的 title 改变但 s06 不变
- **THEN** `slideFingerprints["s05"]` 改变，`slideFingerprints["s06"]` 不变

#### Scenario: hasBodyHeaderLockSlides reflects deck composition

- **WHEN** deck 有 `body+header-lock` slide → `hasBodyHeaderLockSlides: true`
- **WHEN** deck 全部 `full-page` → `hasBodyHeaderLockSlides: false`
