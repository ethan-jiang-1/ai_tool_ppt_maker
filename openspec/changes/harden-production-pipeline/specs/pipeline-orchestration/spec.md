## REMOVED Requirements

### Requirement: Production readiness enforces current header-review evidence

**Reason**: 全局 fingerprint + 全量检查的设计与 per-slide 粒度冲突。替换为下方的 MODIFIED 版本。

**Migration**: `validateHeaderReviewRecord` 改为返回 per-slide 结果结构；调用方（Stage 2/4 gate、ppt_flow build）适配新的 `{ ok, changed, action, hint }` 返回格式。

## MODIFIED Requirements

### Requirement: Header review gate guides per-slide

生产环境（`ppt_flow build`、Stage 2 non-preview、Stage 4）的 header review SHALL 以 **per-slide 粒度** 检查当前 full-page 标题是否与上次确认的状态一致。系统 SHALL 输出人类可读的引导信息（哪个 slide 的哪个字段变了、需要执行什么命令），而非仅报错误码。当 deck 中没有任何 `body+header-lock` 幻灯片时，gate SHALL 自动跳过（无对比基线时 review 无意义）。

`--only <ids>` 参数 SHALL 限缩 gate 检查范围到指定 slide；未指定的 slide 不影响 gate 结果。

#### Scenario: Single slide title change is identified precisely

- **WHEN** s05 的 `title` 从 "传统开发" 改为 "软件优先"
- **AND** 其余 24 页没有变化
- **THEN** gate 输出指出 s05 有 title 变更
- **AND** 建议执行 `ppt_flow pilot --only s05`
- **AND** 不阻塞 s01-s04 和 s06-s25

#### Scenario: --only limits gate check scope

- **WHEN** `--only s05,s07` 传入
- **THEN** gate 仅检查 s05 和 s07 的 per-slide fingerprint
- **AND** 其余 slide 的状态不影响 gate 结果

#### Scenario: Pure full-page deck skips gate entirely

- **WHEN** deck 中每张 slide 的 resolved `render_mode` 均为 `full-page`
- **AND** 没有任何 `body+header-lock` slide 作为对比基线
- **THEN** gate SHALL 返回 `applicable: false`
- **AND** 不要求任何 header review evidence

#### Scenario: Mixed deck with body+header-lock still requires review

- **WHEN** deck 中至少有一张 `body+header-lock` slide
- **AND** 有 content full-page slide 的标题发生了变化
- **THEN** gate 仍然适用
- **AND** 提示用户跑 pilot 确认变化页的 AI 渲染效果

#### Scenario: No changes — gate passes silently

- **WHEN** 所有 full-page slide 的标题与上次 review 时一致
- **THEN** gate 返回 `ok: true`
- **AND** 不输出任何阻塞信息

### Requirement: Gate output is human-readable guidance

`validateHeaderReviewRecord` 的返回结果 SHALL 包含以下字段：

| 字段 | 含义 |
|------|------|
| `applicable` | 是否有 body+header-lock 幻灯片使得 review 有意义 |
| `ok` | 所有本次涉及的 slide 的标题都与 review 记录一致 |
| `changed` | 发生变化的 slide 列表，每项含 `{ id, field, was, now }` |
| `action` | 用户应执行的可执行命令（如 `pilot --only s05`） |
| `hint` | 人类可读的一句话解释 |

Gate SHALL NOT 仅输出 "fingerprint is stale" 或 "evidence is missing" 等内部术语。

#### Scenario: Actionable output for title change

- **WHEN** s05 的标题变了
- **THEN** `changed` 包含 `[{ id: "s05", field: "title", was: "旧标题", now: "新标题" }]`
- **AND** `action` 包含可执行命令
- **AND** `hint` 是一句人话解释

## ADDED Requirements

### Requirement: buildHeaderReviewInputs produces per-slide fingerprints

`buildHeaderReviewInputs()` SHALL 为每张 full-page slide 独立计算指纹并返回 `slideFingerprints: { [slideId]: string }` 映射。SHALL 同时返回 `hasBodyHeaderLockSlides: boolean` 标记 deck 中是否存在 `body+header-lock` slide。

#### Scenario: Per-slide fingerprint varies independently

- **WHEN** s05 的 title 改变但 s06 不变
- **THEN** `slideFingerprints["s05"]` 的值改变
- **AND** `slideFingerprints["s06"]` 的值不变

#### Scenario: hasBodyHeaderLockSlides reflects deck composition

- **WHEN** deck 含至少一个 `body+header-lock` slide
- **THEN** `hasBodyHeaderLockSlides` 为 `true`

- **WHEN** deck 全部为 `full-page`
- **THEN** `hasBodyHeaderLockSlides` 为 `false`

### Requirement: Header-review state record is per-slide

`_state/state.yaml` 中 `nodes.header-review.by_version.{key}` 的 schema SHALL 包含 `slides: { [slideId]: { status, fingerprint, reviewed_at, image_sha256? } }`。`status` 枚举为 `ok` | `changed` | `reviewed` | `waived`。

遇到旧格式（全局 `status` / `header_review_fingerprint`）的 record 时，SHALL 自动迁移为 per-slide 格式并将所有已有 slide 标记为 `status: "ok"`，同时输出提示信息。

#### Scenario: New record uses per-slide schema

- **WHEN** 首次完成 header review
- **THEN** state 中每张 reviewed slide 有独立的 `status` 和 `fingerprint`

#### Scenario: Old global record is auto-migrated

- **WHEN** 读取到使用全局 `header_review_fingerprint` 的旧 record
- **THEN** 系统自动迁移为 per-slide 格式
- **AND** 已 review 的 slide 被标记为 `status: "ok"`
- **AND** 输出提示告知迁移完成
