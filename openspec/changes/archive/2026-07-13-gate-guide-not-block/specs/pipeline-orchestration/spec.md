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
- **AND** MD 执行 pilot → approve → gate 重检（第二次 build）→ `ok: true` → 继续

#### Scenario: Stage 4 image bytes mismatch on single slide

- **WHEN** Stage 4 `requireCurrentImages` 检查发现 s05 的 PNG 文件 SHA-256 与 manifest 不匹配
- **THEN** `changed: [{id: "s05", field: "image", was: null, now: null}]`
- **AND** `action` 引导 `--force-images --only s05` + pilot

#### Scenario: Missing header_snapshot in state

- **WHEN** slide 有 `status` 但缺 `header_snapshot`
- **THEN** `changed` 中 `was: null`，建议 pilot 确认

#### Scenario: Visual type change detected

- **WHEN** s05 的 visual_type 从 "Content Page" 改为 "Title / Opener"，标题文字未变
- **THEN** fingerprint 不匹配 → `changed: [{id: "s05", field: "visual_type", was: "Content Page", now: "Title / Opener"}]`

#### Scenario: Generation profile mismatch

- **WHEN** 当前 build 请求 2k resolution 但上次 review 用 1k
- **THEN** gate 返回所有 content full-page slide 为 `changed`
- **AND** `hint` 说明 profile 不匹配，需重新 pilot

### Requirement: Gate output is MD-controller-friendly

返回结构 SHALL 始终包含全部 6 个字段。`ok: true` 时 `changed: []`, `action: null`, `hint: null`。`ok: false` 时 `changed` 非空、`action` 为可执行命令、`hint` 为人话解释。MD 遇无 `format` 字段 → 旧代码 → 放行。

#### Scenario: Gate passes — null action

- **WHEN** 没有 slide 需要 review
- **THEN** `{format: 2, applicable: true, ok: true, changed: [], action: null, hint: null}`

#### Scenario: Gate fails — MD gets command

- **WHEN** s05 title 变了
- **THEN** `{ok: false, changed: [{s05,...}], action: "node ... pilot \"{runDir}\" --only s05", hint: "..."}`

#### Scenario: Non-existent slide in --only

- **WHEN** `--only s99` 且 s99 不在 plan 中
- **THEN** `ok: true`, `hint: "s99 not found in slide plan"`

### Requirement: buildHeaderReviewInputs produces per-slide fingerprints

`buildHeaderReviewInputs()` SHALL 为每页 full-page slide 独立计算 fingerprint + `hasBodyHeaderLockSlides: boolean`。

### Requirement: mergeHeaderReviewRecord stores per-slide state

`mergeHeaderReviewRecord()` SHALL 写入 `header_snapshot` + `fingerprint` + `status`。SHALL 自动清理 plan 中不存在的 slide 条目。首次 body+header-lock 引入时所有无 record 的 full-page slide → `status: "changed"`。

### Requirement: changedFullPageIds supports per-slide state

`changedFullPageIds()` SHALL 接受可选 `slideStates` 参数。有 per-slide state → 读 `status === "changed"`；无 state（首次 pilot）→ fallback 到全局 snapshot diff。
