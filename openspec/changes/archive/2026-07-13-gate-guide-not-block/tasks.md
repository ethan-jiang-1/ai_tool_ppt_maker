## 1. header_review.mjs — per-slide 核心逻辑 ✅

**测试**: `tests/test_header_review.mjs` (10 tests)

- [x] 1.1 `buildHeaderReviewInputs()`: per-slide fingerprint + `hasBodyHeaderLockSlides`；保留全局 snapshot（首次 pilot fallback）
- [x] 1.2 `validateHeaderReviewRecord()`: 新签名 + `onlyIds`；per-slide 检查 → `{format:2, applicable, ok, changed, action, hint}`；旧 record → `applicable: false`
- [x] 1.3 `mergeHeaderReviewRecord()`: per-slide snapshot 写入；保留 `generation_profile` 在版本级；移除旧全局 fields；自动清理已删除 slide；body+header-lock 首次引入 → 全量标记；`accepted_risks` 映射为 `status: "waived"`
- [x] 1.4 `changedFullPageIds()`: 有 state → 读 `status==="changed"`；无 state → fallback 全局 snapshot

## 2. unified_pipeline + ppt_flow — gate 调用方适配 ✅

- [x] 2.1 `unified_pipeline.mjs` `validateProductionHeaderReview()`: 返回格式改为 `{format, applicable, ok, changed, action, hint}`；`requireCurrentImages` per-slide；`onlyIds` 透传；移除全局 cross-check 逻辑
- [x] 2.2 `ppt_flow.mjs` build/refresh/approve: 适配新 gate 返回格式 + per-slide state

## 3. Charter 更新 ✅

- [x] 3.1 `AGENT_CONTRACT.md`: 标题 →「你的 PPT 助手」；新增开篇定位声明；Rule 4 "执法检查"→"确认+引导"；新增 Rule 12
- [x] 3.2 `charter/NODE-SPEC.md` header-review state schema 已通过 node-specification delta spec 覆盖

## 4. 测试 ✅

**测试**: `tests/test_header_review.mjs` (10 tests 全绿)

- [x] 4.1 纯 full-page → `applicable: false`
- [x] 4.2 s05 title 变化 → `changed[{id, field, was, now}]`；其他 slide 不受影响
- [x] 4.3 `--only` 限缩
- [x] 4.4 旧 record → 放行
- [x] 4.5 首次引入 body+header-lock → 全量 review 提示
- [x] 4.6 visual_type 变化 → `{field: "visual_type"}`
- [x] 4.7 >5 页变化 → action 不含 `--only`
- [x] 4.8 pilot 自动选页从 per-slide state 取

## 5. 回归 ✅

- [x] 5.1 `npm test` → 18/18 files, 151/151 tests 全绿
- [x] 5.2 `openspec validate --specs --strict` → 17/17 specs 全绿
