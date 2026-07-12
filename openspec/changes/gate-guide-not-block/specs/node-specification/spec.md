## ADDED Requirements

### Requirement: Header-review state record uses per-slide schema

`_state/state.yaml` 中 `nodes.header-review.by_version.{key}` SHALL 使用：

```yaml
slides:
  s05:
    status: ok            # ok | changed | reviewed | waived
    fingerprint: "sha256"
    header_snapshot:
      kicker: "INTRODUCTION"
      title: "软件优先开发"
      subtitle: null
      visual_type: "Content Page"
    image_sha256: "sha256"
    reviewed_at: "2026-07-13T10:00:00Z"
```

旧格式（全局 `status`/`header_review_fingerprint`，无 `slides`）→ gate 返回 `applicable: false`（放行）。无需迁移。

#### Scenario: Per-slide status is independent

- **WHEN** s05 title 改变
- **THEN** `slides.s05.status` 变为 `changed`
- **AND** `slides.s01.status` 保持 `ok`

#### Scenario: Old format passes through

- **WHEN** state 含旧全局格式（无 `slides`）
- **THEN** gate 返回 `applicable: false`
- **AND** 下次 pilot + approve 产生新格式

## REMOVED Requirements

### Requirement: Global header-review state record

**Reason**: 全局 `status`/`header_review_fingerprint` 无法表达 per-slide 粒度。

**Migration**: 旧 record 放行，无需手动操作。
