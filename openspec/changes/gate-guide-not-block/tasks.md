## 1. header_review.mjs — per-slide 核心逻辑

**测试**: `tests/test_header_review.mjs`

- [ ] 1.1 `buildHeaderReviewInputs()`: per-slide fingerprint + `hasBodyHeaderLockSlides`；保留全局 snapshot（首次 pilot fallback）
- [ ] 1.2 `validateHeaderReviewRecord()`: 新签名 + `onlyIds`；per-slide 检查 → `{format:2, applicable, ok, changed, action, hint}`；旧 record → `applicable: false`
- [ ] 1.3 `mergeHeaderReviewRecord()`: per-slide snapshot 写入；自动清理已删除 slide；body+header-lock 首次引入 → 全量标记
- [ ] 1.4 `changedFullPageIds()`: 有 state → 读 `status==="changed"`；无 state → fallback 全局 snapshot

## 2. unified_pipeline + ppt_flow — gate 调用方适配

**测试**: `tests/test_unified_pipeline.mjs`

- [ ] 2.1 `unified_pipeline.mjs` Stage 2/4 gate: 传入 `--only`；取 `action`；Stage 4 图片字节不匹配 → 硬拦 + 引导命令
- [ ] 2.2 `ppt_flow.mjs` build/refresh: 适配新 gate 返回格式

## 3. Charter 更新

- [ ] 3.1 `AGENT_CONTRACT.md`: 标题 →「你的 PPT 助手」；新增开篇定位声明；Rule 4 "执法检查"→"确认+引导"；新增 Rule 12
- [ ] 3.2 `charter/NODE-SPEC.md` header-review state schema 更新为 per-slide

## 4. 测试

**测试**: `tests/test_header_review.mjs`

- [ ] 4.1 纯 full-page → `applicable: false`
- [ ] 4.2 s05 title 变化 → `changed[{id, field, was, now}]`；其他 slide 不受影响
- [ ] 4.3 `--only` 限缩
- [ ] 4.4 旧 record → 放行
- [ ] 4.5 首次引入 body+header-lock → 全量 review 提示
- [ ] 4.6 visual_type 变化 → `{field: "visual_type"}`
- [ ] 4.7 >5 页变化 → action 不含 `--only`
- [ ] 4.8 pilot 自动选页从 per-slide state 取

## 5. 回归

- [ ] 5.1 `npm test` 全绿
- [ ] 5.2 `openspec validate --specs --strict` 全绿
