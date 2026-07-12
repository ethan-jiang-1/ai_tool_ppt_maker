## ADDED Requirements

### Requirement: Header-review state record uses per-slide schema

`_state/state.yaml` 中 `nodes.header-review.by_version.{key}` SHALL 使用 per-slide schema：

```yaml
nodes:
  header-review:
    by_version:
      "3_versions/v1":
        slides:
          s01:
            status: ok
            fingerprint: "sha256"
            header_snapshot:          # 上次 review 时的标题内容，用于字段级 diff
              kicker: "INTRODUCTION"
              title: "软件优先开发"
              subtitle: null
              visual_type: "Content Page"
            reviewed_at: "2026-07-13T10:00:00Z"
            image_sha256: "sha256"
          s05:
            status: changed
            fingerprint: "sha256_new"
            header_snapshot:
              kicker: null
              title: "传统开发"      # 旧标题，当前 plan 里已是 "软件优先"
              subtitle: null
              visual_type: "Content Page"
```

`status` 枚举：
- `ok` — 与上次 review 一致
- `changed` — 标题/字段自上次 review 后发生了变化
- `reviewed` — 本次已确认
- `waived` — 用户明确跳过

旧的全局格式（`status: "completed"` + `header_review_fingerprint`）在读取时 SHALL 被识别为旧格式——不含 `slides` 字段 → gate 返回 `applicable: false`（放行）。用户下次正常执行 pilot + approve 时自然产生新格式 record。无需迁移逻辑。

#### Scenario: Per-slide status is independent

- **WHEN** s05 的 title 改变
- **THEN** `slides.s05.status` 变为 `changed`
- **AND** `slides.s01.status` 保持 `ok`

#### Scenario: Old format record passes through

- **WHEN** state 含有旧全局格式 record（`header_review_fingerprint` 而非 `slides`）
- **THEN** 识别为旧格式 → gate 返回 `applicable: false`（放行）
- **AND** 不执行迁移——用户下次 pilot + approve 自然产生新格式

## REMOVED Requirements

### Requirement: Global header-review state record

**Reason**: 全局 `status` / `header_review_fingerprint` 无法表达 per-slide 粒度。替换为上方的 per-slide schema。

**Migration**: 旧 record 读取时自动迁移，无需手动操作。
