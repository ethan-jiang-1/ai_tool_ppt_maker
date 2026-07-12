## Why

`deck_ai_sdlc_keynote` 25 页全量生产暴露了一个比 bug 更深的问题：**管线 gate 被设计成守门员，而不是向导。** 用户改了 s05 的标题——系统应该告诉他「s05 变了，跑 `ppt_flow pilot --only s05` 确认一下」然后继续。实际行为：「header review fingerprint is stale」→ 25 页全锁 → 7 种 workaround 全失败 → 用户不知道发生了什么、怎么修。

这不是 bug，是设计哲学错了。Gate 的职责是**引导用户走在正确的路径上**，不是堵在门口说「你不对」。如果系统能判断什么变了，就应该给出可执行的下一步；如果能自动修，就应该修好不停下。

同时两条生产级缺陷（Stage 3 不必要解码崩溃、Stage 2 vendor 无 fallback）和 backlog 漂移一并修正。

## What Changes

**宪法级：Gate 作为向导**
- `AGENT_CONTRACT.md` 新增 Rule 12「Gate 是向导，不是路障」——每个 gate 输出必须包含：什么变了、下一步干什么、可执行命令。不确定时给默认路径，不让用户面对死胡同
- header review gate 重构为 per-slide 状态机——s05 标题变了只影响 s05，不牵连其余 24 页
- gate 消息人类可读：「2 页标题有变化 → 跑 `pilot --only s05,s07`」而非「fingerprint is stale」

**管线韧性**
- Stage 3 full-page passthrough 不再解码图片（`copyFileSync` 替代 canvas round-trip），消除 vendor PNG 误判崩溃
- Stage 2 vendor：`--base-url` 支持逗号分隔多 URL + fallback；镜像下载重试 3 次；缺 key 时 skip 该 vendor 而非全链崩溃

**簿记同步**
- `_backlog/bugs/README.md` 移除已修复的 BUG-009

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `pipeline-orchestration`: header review gate 从全局锁重构为 per-slide 状态机；gate 输出改为人类可读的引导信息
- `header-lock`: Stage 3 full-page passthrough 用 `copyFileSync` 替代 canvas decode
- `image-generation`: `--base-url` 多 URL + 重试 + fail-soft
- `node-specification`: header-review state record 结构从全局改为 per-slide（`by_version.{key}.slides.{slideId}`）

## Impact

- `PPTMAKER_FRAMEWORK/charter/AGENT_CONTRACT.md` — 新增 Rule 12
- `PPTMAKER_FRAMEWORK/scripts/lib/header_review.mjs` — `buildHeaderReviewInputs` per-slide 指纹；`validateHeaderReviewRecord` 输出人类可读引导
- `PPTMAKER_FRAMEWORK/scripts/unified_pipeline.mjs` — Stage 2/4 gate 调用适配新返回格式；`--base-url` 逗号分隔
- `PPTMAKER_FRAMEWORK/scripts/stage3_lock_headers.mjs` — full-page passthrough 改用 `copyFileSync`
- `PPTMAKER_FRAMEWORK/scripts/image_api_client.mjs` — `resolveVendors` 多 URL + fail-soft；`generateOneImage` 重试
- `PPTMAKER_FRAMEWORK/charter/NODE-SPEC.md` — header-review state schema 更新
- `_backlog/bugs/README.md` — 同步
- **BREAKING**: header-review state record 结构变更——旧 record 中的全局 `status`/`header_review_fingerprint` 不再使用，需迁移或自动忽略
