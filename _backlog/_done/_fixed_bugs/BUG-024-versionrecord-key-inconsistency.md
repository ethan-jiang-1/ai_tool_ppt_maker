# BUG-024: versionRecord 的 versionKey 与用户直觉不一致（`3_versions/v2` vs `v2`）

> 严重级别: P2 | 发现: 2026-07-21 | 状态: 已修复 (2026-07-21)

## 症状
手工写入 state.yaml 的 gate/delivery record 时，自然使用 `v2` 作为 by_version key。
但 `versionRecord` 函数使用 `context.versionKey`（值为 `3_versions/v2`）查找记录，
导致手工写入的记录永远找不到，gate 始终 pending。

```yaml
# 错误（人直觉）
html-content-review:
  by_version:
    v2:  # ← 找不到！

# 正确（框架实现）
html-content-review:
  by_version:
    3_versions/v2:  # ← 才能找到
```

## 根因
`versionContext`（html_review_evidence_core.mjs:61）定义 `versionKey = \`3_versions/${runVersion}\``。
这是内部实现细节，但在 state.yaml 中暴露为 YAML key，且没有任何文档或错误提示说明
正确的 key 格式。

## 复现
1. 尝试手工写 `html-content-review` 记录到 state.yaml
2. 使用 `by_version.v2` 作为 key
3. `ppt_flow state` 显示 gate 仍为 pending，无任何错误提示

## 修复关联
已由 OpenSpec change `make-html-production-guided-and-recoverable` 修复并归档。
- 方案 A：`versionKey` 改为 `v2`（与 runVersion 一致），向后兼容两种格式
- 方案 B：`versionRecord` 查找失败时 emit warning
- 方案 C：文档化 versionKey 格式
