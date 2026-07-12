## Context

`deck_ai_sdlc_keynote` 25 页全量生产暴露了 gate 系统的设计问题：它被建成守门员（检查→拒绝→报错），而不是向导（检查→告诉用户下一步→继续）。BUG-003 记录了 7 种 workaround 全失败——问题不在实现，在姿态。

同时两条管线韧性缺陷（BUG-004 Stage 3 不必要解码、BUG-005 vendor 无 fallback）一并修正。

## Goals / Non-Goals

**Goals:**
1. Header review gate 从「全局锁」重构为「per-slide 向导」
2. Gate 输出人类可读：什么变了、怎么修、可执行命令
3. 纯 full-page deck（无 body+header-lock 基线）自动跳过 header review
4. Stage 3 full-page passthrough 不再走 canvas 解码
5. Stage 2 vendor 切换有 fallback + 重试，缺 key 时 fail-soft
6. AGENT_CONTRACT 新增 Gate 姿态原则
7. _backlog README 同步

**Non-Goals:**
- 不改混合 deck（有 body+header-lock 幻灯片）的 header review 逻辑（仍需 pilot → approve）
- 不改变 `--base-url` 的基本语义
- 不在 BUG-009（已修）上做额外工作
- 不实现自动 rerun pilot（gate 告诉用户跑什么命令，用户决定何时跑）

## Decisions

### Decision 1: Per-slide fingerprint 替代全局 fingerprint

**选择**: `buildHeaderReviewInputs()` 为每张 full-page slide 独立计算 fingerprint（`slideFingerprints: { s01: "sha_abc", s05: "sha_def", ... }`），替代当前的全局 `headerReviewFingerprint`。State record 中每张 slide 有独立状态。

**理由**: 用户改 s05 的标题，只应 invalidate s05 的 review 状态。当前全局指纹导致「一页改、全册锁」，且用户无法知道到底哪页出了问题。

**实现要点**:
- 每张 full-page slide 的 fingerprint = `sha256(stableJson({ title, kicker, subtitle, visual_type, geometry }))`
- State record 结构: `by_version.{key}.slides.{slideId}.{status, fingerprint, reviewed_at, image_sha256}`
- `status` 枚举: `ok` (与上次 review 一致) | `changed` (标题变了) | `reviewed` (本次已确认) | `waived` (用户明确跳过)

**旧 record 兼容**: 首次遇到全局格式的旧 record，自动标记所有 slide 为 `status: "ok"`（假设已审核通过）并打印提示：「从头开始，之前的审批记录已保留；后续改动会精确到单页」。

### Decision 2: Gate 输出格式从「错误列表」改为「状态 + 行动建议」

**选择**: `validateHeaderReviewRecord` 返回人类可读的结果结构：

```js
{
  applicable: true/false,        // 是否有 body+header-lock 幻灯片需要对比基线
  ok: true/false,                // 所有本次涉及的 slide 都 ok?
  changed: [                     // 哪些 slide 变了
    { id: "s05", field: "title", was: "传统软件开发", now: "软件优先开发" }
  ],
  action: "pilot --only s05"     // 用户应该跑什么命令
  hint: "2 页标题变了，跑 pilot 确认 AI 渲染效果后可以继续"
}
```

**理由**: 当前 errors 数组是给机器看的（"fingerprint is stale"），用户看不懂也不该需要看懂。新结构直接给行动指令。

### Decision 3: --only 限缩 gate 检查范围

**选择**: 当 `--only` 传入时，gate 只检查指定 slide 的 per-slide fingerprint。其余 slide 的状态不影响 gate 结果。

**理由**: 用户说「只改这 3 页」，系统就只查这 3 页。不改的页不需要重新确认。

### Decision 4: Stage 3 full-page passthrough → copyFileSync

与上一版 design.md 一致：尺寸匹配时直接 `copyFileSync`，仅尺寸不匹配走 canvas resize。

### Decision 5: --base-url 逗号分隔 + 镜像下载重试 + fail-soft

与上一版 design.md 一致：多 URL fallback，2 次重试指数退避，缺 key 时 skip + warn。

### Decision 6: AGENT_CONTRACT Rule 12 — Gate 姿态

新增 Rule 12「Gate 是向导，不是路障」：

> **Gate 是向导，不是路障。** Gate 被触发时，必须告诉用户三件事：① 什么变了（具体到 slide id + 字段）；② 下一步干什么（可执行命令）；③ 不确定怎么办（给默认路径）。能在代码层面自动修的问题（JSON/YAML 格式、stale fingerprint 自动清理）直接修好继续。必须人类判断的事（视觉质量、标题措辞）给候选和建议。永远不让用户面对一堵墙。

## Risks / Trade-offs

- **[State record 结构变更]** → 旧 state 自动迁移，record 不丢。用户感知不到。
- **[Per-slide 指纹增加计算量]** → 25 页的 SHA-256 仍然微秒级，无感知。
- **[Gate 不再强制拒绝]** → 预防「用户跳过 pilot 直接 build」？保持 Stage 4 的必要检查（图片字节完整性），但改为 warning + 继续，而非 error + 退出。如果用户坚持不带 review 就跑，让他跑——结果不对他自己会回来。
