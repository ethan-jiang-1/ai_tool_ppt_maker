# BUG-031: state.yaml 无校验工具，手工修改后只能靠试错发现错误

> 严重级别: P2 | 发现: 2026-07-21 | 状态: 已修复 (2026-07-21)

## 症状
手工修改 state.yaml 时，以下错误均无校验：
- YAML key 命名错误（`v2` vs `3_versions/v2`）→ 静默忽略
- SHA256 被 YAML parser 截断 1 字符 → 无警告
- 缺少 `decided_at` 字段 → delivery freshness 为 stale，不提示缺哪个字段
- record 多出额外字段 → `exactKeys` 失败，不提示多了哪个

只能通过跑 `ppt_flow state` / `build` / `image2 plan` 观察行为变化来间接推断 state 是否正确。

## 根因
`readState` 使用 "tolerant parse + schema migration/repair" 策略，
不认识的字段被静默忽略而不是报 warning。

## 复现
1. 手工写 gate record 到 state.yaml，使用 `by_version.v2`
2. 框架静默找不到 record，gate 始终 pending
3. 无任何 CLI 提示 "unknown version key v2, expected 3_versions/v2"

## 修复关联
已由 OpenSpec change `make-html-production-guided-and-recoverable` 修复并归档。
- `ppt_flow state --validate-state` 校验 state.yaml 结构和引用完整性
- `readState` 对 unrecognized keys 至少 emit warning
- 或在关键 record lookup 失败时打印 diagnostic
