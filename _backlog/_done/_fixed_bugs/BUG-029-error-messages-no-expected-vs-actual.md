# BUG-029: 框架错误信息不给 expected vs actual，调试需读源码

> 严重级别: P1 | 发现: 2026-07-21 | 状态: 已修复 (2026-07-21)

## 症状
框架在以下场景报错时只给结果不给原因：

| 场景 | 报错 | 缺失信息 |
|---|---|---|
| `VisualConfigError: html_first.palette keys mismatch` | 缺 accent_tertiary | 不给完整 required keys 列表 |
| `VisualConfigError: typography.kicker differs from schema v1` | color 不对 | 不给 expected weight/size/line_height/color |
| `VisualConfigError: components differs from schema v1` | series 少一项 | 不给 expected JSON |
| `VisualConfigError: forbidden must be an array` | 19 > 16 | 不给具体哪个超限 |
| `delivery freshness: stale` | SHA/路径不匹配 | 不给哪个字段不对 |
| `approve: plan is missing, stale, or incomplete` | fingerprint 不匹配 | 不给 expected vs actual hash |

## 根因
多个校验函数使用 `exactKeys` + `JSON.stringify` 比较或逐字段 `===` 比较，
但在失败时只抛 `VisualConfigError("differs from schema v1")` 而不包含 diff。

## 复现
任一 html-first 校验失败 → 错误信息无法定位具体差异 → 必须读框架源码找 spec 常量

## 修复关联
已由 OpenSpec change `make-html-production-guided-and-recoverable` 修复并归档。
所有 strict comparison 校验失败时应输出：
- 期望值（expected）
- 实际值（actual）
- 差异字段路径（field path）
