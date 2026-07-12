## REMOVED Requirements

### Requirement: Production readiness enforces current header-review evidence

**Reason**: 全局 fingerprint + 全量检查 → 一页改全册锁，不尊重 `--only`，输出内部术语。替换为下方 per-slide 版本。

**Migration**: `validateHeaderReviewRecord` 改为返回 `{format, applicable, ok, changed, action, hint}`；调用方适配。

## ADDED Requirements

### Requirement: Header review gate guides per-slide

Gate SHALL 以 per-slide 粒度检查 full-page 标题。输出 SHALL 为 MD Controller 可消费的结构体。纯 full-page deck SHALL 自动放行。`--only` SHALL 限缩检查范围。

#### Scenario: Single slide title change — MD gets actionable command

- **WHEN** s05 的 title 从 "传统开发" 改为 "软件优先"，其余 24 页不变
- **THEN** `changed: [{id: "s05", field: "title", was: "传统开发", now: "软件优先"}]`
- **AND** `action: "node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs pilot \"{runDir}\" --only s05"`
- **AND** 不阻塞其余 24 页

#### Scenario: Pure full-page deck skips

- **WHEN** deck 无 body+header-lock slide
- **THEN** `applicable: false`

#### Scenario: --only limits scope

- **WHEN** `--only s05,s07` 传入
- **THEN** 仅检查 s05 和 s07

#### Scenario: No changes — silent pass

- **WHEN** 所有 full-page slide 与上次 review 一致
- **THEN** `ok: true`

#### Scenario: More than 5 slides changed — full pilot

- **WHEN** 6 页标题发生变化
- **THEN** `action` 不含 `--only`，指向全量 pilot

#### Scenario: End-to-end — title change to resolution

- **WHEN** 用户改 s05/s07 标题后 build
- **THEN** gate → `ok: false` + `action: pilot --only s05,s07`
- **AND** MD 执行 pilot → approve → gate 重检 → `ok: true` → 继续

### Requirement: Gate output is MD-controller-friendly

返回结构 SHALL 含：`format`(2), `applicable`, `ok`, `changed: [{id, field, was, now}]`, `action`(含 `{runDir}` 模板), `hint`。MD 遇无 `format` 字段 → 放行（旧代码）。Gate SHALL NOT 仅输出 "fingerprint is stale"。

#### Scenario: MD auto-executes on gate failure

- **WHEN** `ok: false, action: "node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs pilot \"{runDir}\" --only s05"`
- **THEN** MD 替换 `{runDir}` 后直接执行

#### Scenario: Non-existent slide in --only

- **WHEN** `--only s99` 且 s99 不在 plan 中
- **THEN** `ok: true`, `hint` 注明 "s99 not found"

### Requirement: buildHeaderReviewInputs produces per-slide fingerprints

`buildHeaderReviewInputs()` SHALL 为每页 full-page slide 独立计算 fingerprint + `hasBodyHeaderLockSlides: boolean`。

### Requirement: mergeHeaderReviewRecord stores per-slide state

`mergeHeaderReviewRecord()` SHALL 写入 `header_snapshot` + `fingerprint` + `status`。SHALL 自动清理 plan 中不存在的 slide 条目。首次 body+header-lock 引入时所有无 record 的 full-page slide → `status: "changed"`。

### Requirement: changedFullPageIds supports per-slide state

`changedFullPageIds()` SHALL 接受可选 `slideStates` 参数。有 per-slide state → 读 `status === "changed"`；无 state（首次 pilot）→ fallback 到全局 snapshot diff。
