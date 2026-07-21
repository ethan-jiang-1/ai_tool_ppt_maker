# BUG-027: delivery record 的 17 个必须字段无文档，手工构造几乎不可能

> 严重级别: P1 | 发现: 2026-07-21 | 状态: 已修复 (2026-07-21)

## 症状
`deliveryRecordCurrent` 通过 `exactKeys` 强制要求 delivery record 恰好包含 17 个字段：
```
schema, pipeline, run_version, html_production_reset_id, html_delivery_digest,
contact_sheet_manifest_path, contact_sheet_manifest_sha256, contact_sheet_path,
contact_sheet_sha256, assembly_receipt_path, assembly_receipt_sha256, pptx_sha256,
notes_receipt_path, notes_receipt_sha256, decision, reason, decided_at
```

缺一个或路径格式不对（如路径需相对于 run dir 而非 deck root），delivery freshness 即为 "stale"。
且所有 SHA256 字段必须与磁盘文件逐字节匹配——YAML 解析时 SHA 可能被截断 1 个字符而
无任何警告。

任何字段不匹配时无 diff 输出，只返回 `freshness: "stale"`。

## 根因
- delivery record 的 schema 只在 `deliveryRecordCurrent` 函数内部定义，无公开文档
- `exactKeys` 校验无错误详情
- 路径格式（`_generated/...` vs `3_versions/v2/_generated/...`）无文档
- YAML parser 可能截断长字符串

## 复现
1. 手工构造 delivery record
2. 任何一个字段不对 → `freshness: stale`，无任何提示
3. 需逐个字段 debug + 对比 evidence 值

## 修复关联
已由 OpenSpec change `make-html-production-guided-and-recoverable` 修复并归档。
- 公开 delivery record schema 文档
- `deliveryRecordCurrent` 返回具体不匹配字段
- 或提供 `ppt_flow state --record-delivery-review proceed --force` 绕过
