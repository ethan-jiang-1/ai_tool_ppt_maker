# BUG-016: `ppt_flow approve` 拒绝有效的 plan-hash，报 "missing, stale, or incomplete"

> 严重级别: P0 | 发现: 2026-07-21 | 状态: 已修复 (2026-07-21)

## 症状
html-first-v1 deck 在 pilot 成功后立即执行 `ppt_flow approve <run-dir> content --plan-hash <hash>`，
始终报错：
```
FAILED: HTML content review plan is missing, stale, or incomplete
```
即使 pilot 刚跑完、preview manifest 中 `review_plans.content.path` 指向的 plan JSON 文件存在、
内部 `plan_hash` 与命令行传入的 hash 完全一致，approve 仍然拒绝。

## 根因
`publishHtmlGateDecision` → `readCurrentPlan` → `planResult.valid` 判定逻辑与 pilot 产出的
plan 文件之间存在不匹配。具体触发条件待定位，可能原因：
1. `readCurrentPlan` 内部对 plan JSON 做了额外校验（schema/fields），pilot 产出的某些字段
   未满足
2. `html_production_reset_id` 不匹配 —— pilot 后 reset id 未正确写入 state
3. gate approval journal 状态异常导致 plan 被判定为 stale

## 复现
1. `ppt_flow init` 创建 html-first-v1 deck
2. 写任意 slide-specifications.md
3. `ppt_flow pilot <run-dir>` → 获取 content/visual plan hash
4. `ppt_flow approve <run-dir> content --plan-hash <hash>` → 报错

## 修复关联
已由 OpenSpec change `make-html-production-guided-and-recoverable` 修复并归档。
待定。
