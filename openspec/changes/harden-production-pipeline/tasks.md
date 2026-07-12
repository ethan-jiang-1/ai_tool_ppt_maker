## 1. Header review: per-slide granularity + human-readable gate output (BUG-003)

**Capability**: `pipeline-orchestration` | **编辑链**: 影响所有 gate 调用 | **测试**: `tests/test_header_review.mjs`, `tests/test_unified_pipeline.mjs`

- [ ] 1.1 `buildHeaderReviewInputs()` in `lib/header_review.mjs`: 为每张 full-page slide 独立计算 fingerprint → `slideFingerprints: { [id]: sha }`；新增 `hasBodyHeaderLockSlides: boolean`
- [ ] 1.2 `validateHeaderReviewRecord()`: 改为 per-slide 检查 —— 对比每个 `slideFingerprints[id]` 与 record 中的值；输出结构改为 `{ applicable, ok, changed: [{id, field, was, now}], action: "pilot --only ...", hint: "人话解释" }`
- [ ] 1.3 `mergeHeaderReviewRecord()`: 适配 per-slide state schema —— `slides.{id}.{status, fingerprint, reviewed_at, image_sha256?}`；旧全局 record 自动迁移
- [ ] 1.4 State record schema (`NODE-SPEC.md` header-review 节): 从全局 `status`/`header_review_fingerprint` 更新为 `slides.{id}.{status: ok|changed|reviewed|waived, fingerprint, reviewed_at, image_sha256?}`
- [ ] 1.5 `unified_pipeline.mjs`: Stage 2/4 gate 调用处适配新返回格式 —— 取 `changed` 数组生成 MD 友好的结构化输出；`--only` 参数传入 `validateHeaderReviewRecord`
- [ ] 1.6 `ppt_flow.mjs` build/refresh 命令: 适配新的 gate 返回格式
- [ ] 1.7 添加测试: 纯 full-page deck → `applicable: false`；s05 单页 title 变化 → 只 s05 flagged；`--only` 限缩检查；旧 record 自动迁移

## 2. AGENT_CONTRACT: Gate 姿态原则（Rule 12）

**Capability**: `node-specification`（charter 文档）

- [ ] 2.1 `AGENT_CONTRACT.md` 新增 Rule 12「Gate 是向导，不是路障」: gate 必须告诉 MD 三件事——什么变了、下一步命令、默认路径；能自动修的不停顿；必须人判的给候选

## 3. Stage 3 full-page passthrough: skip decode (BUG-004)

**Capability**: `header-lock` | **编辑链**: B | **测试**: `tests/test_stage3_lock_headers.mjs`

- [ ] 3.1 `stage3_lock_headers.mjs` `RENDER_MODE_FULL_PAGE` 分支: 尺寸匹配 → `copyFileSync`；尺寸不匹配 → canvas resize
- [ ] 3.2 移除未使用的 `Image` import
- [ ] 3.3 添加测试: 正确尺寸 → 字节一致 copy；错误尺寸 → canvas resize；body+header-lock → overlay 不变

## 4. Stage 2 vendor resilience (BUG-005)

**Capability**: `image-generation` | **编辑链**: B | **测试**: `tests/test_image_generation.mjs`

- [ ] 4.1 `resolveVendors()`: 解析 `--base-url` 逗号分隔 → 多 vendor 列表
- [ ] 4.2 `resolveVendors()`: `IMAGE2_VENDORS` 缺 key → skip + warn；全缺 → throw
- [ ] 4.3 `generateOneImage()`: 每个 vendor 重试最多 2 次（1s/2s backoff），仅对 transient errors（5xx/网络）
- [ ] 4.4 添加测试: 逗号分隔 → 2 vendor；缺 key skip；502 retry → 成功；401 no retry

## 5. BUG-008 verify + backlog sync

- [ ] 5.1 验证 `unwrapDataRecord` 对 `data:[{task_id}]` 的处理，添加 edge case 测试（空数组、非数组 data）
- [ ] 5.2 `_backlog/bugs/README.md`: 移除 BUG-009；标记 BUG-008 为已验证

## 6. 回归验证

- [ ] 6.1 `npm test` 全部通过
- [ ] 6.2 `openspec validate --specs --strict` 通过
- [ ] 6.3 用纯 full-page deck 跑完整管线 `--stage all` → 不被 gate 卡住
