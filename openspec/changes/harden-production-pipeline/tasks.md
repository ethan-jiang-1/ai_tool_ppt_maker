## 1. Header review: per-slide granularity + human-readable gate output (BUG-003)

**Capability**: `pipeline-orchestration` | **编辑链**: 影响所有 gate 调用 | **测试**: `tests/test_header_review.mjs`, `tests/test_unified_pipeline.mjs`

- [ ] 1.1 `buildHeaderReviewInputs()`: per-slide fingerprint + `hasBodyHeaderLockSlides` — 每张 full-page slide 出 `{fingerprint, headerSnapshot}`
- [ ] 1.2 `validateHeaderReviewRecord()`: per-slide 检查 — fingerprint 快速比较 → 逐字段 diff → `changed: [{id, field, was, now}]`；输出含 `format: 2`；`action` 含 `"{runDir}"`；旧 record → `format: 1` 放行；edge cases: 不存在 slide → `ok: true` + hint；缺 `header_snapshot` → `was: null`
- [ ] 1.3 `mergeHeaderReviewRecord()`: 适配 per-slide schema；首次 body+header-lock → 全量 review；plan 中已删除的 slide → 自动清理 state 中对应条目
- [ ] 1.4 `changedFullPageIds()`: 改为读 `slides.{id}.status === "changed"` 而非全局 snapshot diff；`ppt_flow pilot` 自动选页基于此
- [ ] 1.5 `unified_pipeline.mjs`: Stage 2/4 gate 调用 — 传入 `--only`；取 `action`（含 `{runDir}` 模板）；Stage 4 图片字节不匹配时硬拦 + 引导修复命令
- [ ] 1.6 `ppt_flow.mjs` build/refresh: 适配新 gate 返回格式
- [ ] 1.7 单元测试: 纯 full-page → `applicable: false`；s05 title 变化 → `changed[{field, was, now}]`；`--only` 限缩；旧 record → 放行；首次 body+header-lock → 全量 review 提示
- [ ] 1.8 集成测试: 修改 2 页 title → gate 返回 `changed` + `action` → 模拟 MD 执行 pilot → approve → gate 检查通过 → build 继续

## 2. AGENT_CONTRACT + state schema: 宪法级变更

**Capability**: `node-specification`

- [ ] 2.1 `AGENT_CONTRACT.md` 新增 Rule 12「Gate 是向导，不是路障」（在现有 11 条之后）:
  > **Gate 是向导，不是路障。** Gate 被触发时，必须给 MD Controller 三样东西：① 什么变了（slide id + 字段）；② 可执行命令（MD 直接跑）；③ 默认路径（不确定时怎么办）。能在代码层自动修的不停顿（格式、fingerprint 清理）。必须人来判断的（视觉质量、标题措辞）给候选 + 推荐。永远不让用户面对一堵墙。

- [ ] 2.2 `NODE-SPEC.md` header-review state schema: `slides.{id}.{status, fingerprint, header_snapshot: {kicker,title,subtitle,visual_type}, reviewed_at, image_sha256?}`

## 3. Stage 3 full-page passthrough: skip decode (BUG-004)

**Capability**: `header-lock` | **编辑链**: B | **测试**: `tests/test_stage3_lock_headers.mjs`

- [ ] 3.1 `stage3_lock_headers.mjs` `RENDER_MODE_FULL_PAGE` 分支: 读 PNG IHDR 前 24 字节获取尺寸（纯 Buffer，不走 canvas）→ 尺寸匹配 → `copyFileSync`；不匹配 → canvas resize
- [ ] 3.2 移除未使用的 `Image` import
- [ ] 3.3 添加测试: 正确尺寸 → 字节一致 copy；错误尺寸 → canvas resize；body+header-lock → overlay 不变

## 4. Stage 2 vendor resilience (BUG-005)

**Capability**: `image-generation` | **编辑链**: B | **测试**: `tests/test_image_generation.mjs`

- [ ] 4.1 `resolveVendors()`: 解析 `--base-url` 逗号分隔 → 多 vendor 列表
- [ ] 4.2 `resolveVendors()`: `IMAGE2_VENDORS` 缺 key → skip + warn；全缺 → throw
- [ ] 4.3 `generateOneImage()`: 每个 vendor 重试最多 2 次（1s/2s backoff），仅对 transient errors（5xx/网络）；同 vendor 重试不产生额外 attempt 条目
- [ ] 4.4 添加测试: 逗号分隔 → 2 vendor；缺 key skip；502 retry → 成功；401 no retry

## 5. BUG-008 verify + backlog sync

- [ ] 5.1 验证 `unwrapDataRecord` 对 `data:[{task_id}]` 的处理，添加 edge case 测试（空数组、非数组 data）
- [ ] 5.2 `_backlog/bugs/README.md`: 移除 BUG-009；标记 BUG-008 为已验证

## 6. 回归验证

- [ ] 6.1 `npm test` 全部通过
- [ ] 6.2 `openspec validate --specs --strict` 通过
- [ ] 6.3 用纯 full-page deck 跑完整管线 `--stage all` → 不被 gate 卡住
