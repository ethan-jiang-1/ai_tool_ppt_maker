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

### Decision 1: Per-slide fingerprint + header snapshot 替代全局 fingerprint

**选择**: `buildHeaderReviewInputs()` 为每张 full-page slide 独立计算 fingerprint（`slideFingerprints: { s01: "sha_abc", s05: "sha_def", ... }`），同时 state record 中保存每张 slide 的 `header_snapshot: { kicker, title, subtitle, visual_type }`——用于计算 `changed` 数组中的 `was`/`now`。

**理由**: 用户改 s05 的标题，只应 invalidate s05 的 review 状态。Fingerprint 做快速比较（变了没？），snapshot 做详细比较（从什么变成什么？），两件事分开。

**State record 结构**:
```yaml
slides:
  s05:
    status: ok            # ok | changed | reviewed | waived
    fingerprint: "sha256"
    header_snapshot:      # 上次 review 时的标题内容，用于 diff
      kicker: "INTRODUCTION"
      title: "软件优先开发"
      subtitle: null
      visual_type: "Content Page"
    image_sha256: "sha256"  # optional, present when reviewed
    reviewed_at: "2026-07-13T10:00:00Z"
```

**`changed` 计算逻辑**:
1. 用 fingerprint 快速判断哪些 slide 变了（O(1) hash 比较）
2. 对变了的 slide，逐字段比较当前 header 与 state 中的 `header_snapshot`
3. 比较的字段: `kicker`, `title`, `subtitle`（三个文本字段）
4. `visual_type` 或 `geometry` 变化 → fingerprint 不匹配 → `changed` 中产生 `{id, field: "other", was: null, now: null}`，`hint` 说明 "visual type 或布局参数变化"
5. 无 `header_snapshot` 的 slide（新建或旧 record 放行后首次出现）→ `changed` 中 `was: null`
6. `changed` 永远非空当 `ok: false`——MD 不需要额外判断

**旧 record 兼容**：无需迁移。新代码读到不含 `slides` 字段的旧格式 record → 返回 `{ applicable: false, ok: true }`（gate 放行）。用户下次跑 pilot → approve 时自然产生新格式 record。

### Decision 2: Gate 输出格式——MD Controller 可直接消费

**选择**: `validateHeaderReviewRecord` 返回结构体，`action` 字段为 MD Controller 可直接执行的完整命令，`{runDir}` 为 MD 已知的模板变量：

```js
{
  format: 2,                     // gate 输出格式版本：1=旧（errors 数组），2=新（changed + action）
  applicable: true,              // 有 body+header-lock 基线
  ok: false,                     // 有 slide 需要 review
  changed: [                     // 字段级变更
    { id: "s05", field: "title", was: "传统开发", now: "软件优先" },
    { id: "s07", field: "title", was: "三阶段", now: "团队工作流" }
  ],
  action: "node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs pilot \"{runDir}\" --only s05,s07",
  hint: "2 页标题变了，跑 pilot 确认 AI 渲染效果后继续"
}
```

**`format` 字段**: 由 `validateHeaderReviewRecord` 直接在返回结构体中设置。更新后代码永远返回 `format: 2`。旧代码（未更新）不返回 `format` 字段——MD 遇到无 `format` 的 gate 输出 → 视为旧代码 → 放行（不做 header review）。无需额外的格式协商机制。

**MD Controller 处理逻辑**:
```
if (!result.format) → 旧代码，放行
if (result.ok) → 继续管线
if (!result.ok && !result.applicable) → 继续
if (!result.ok && result.applicable) → 取 action，替换 {runDir}，执行
```

**理由**: 当前 errors 数组只有内部术语。新结构让 MD 拿到后无需理解业务逻辑——直接跑 `action` 即可。

### Decision 3: --only 限缩 gate 检查范围

**选择**: 当 `--only` 传入时，gate 只检查指定 slide 的 per-slide fingerprint。其余 slide 的状态不影响 gate 结果。

**理由**: 用户说「只改这 3 页」，系统就只查这 3 页。不改的页不需要重新确认。

### Decision 4: Stage 3 full-page passthrough → read PNG header, not decode

**选择**: 在 `RENDER_MODE_FULL_PAGE` 分支中，用 `readFileSync` 读 PNG 前 24 字节（IHDR chunk）获取宽高——无需通过 `@napi-rs/canvas` 解码。尺寸匹配 canonical canvas → `copyFileSync` 直接复制。尺寸不匹配 → 走现有 canvas resize 路径（此时才调 `loadImage`）。

**PNG 尺寸读取**: `readFileSync(imgPath)` 读前 24 字节 → offset 16-19 是 width（big-endian uint32），offset 20-23 是 height。纯 Node.js Buffer 操作，不依赖 `@napi-rs/canvas`。

**理由**: `loadImage(readFileSync(imgPath))` 就是触发 "Invalid SVG image" 崩溃的路径。用 `loadImage` 测尺寸等于 BUG-004 没修。PNG header 解析是几十行纯 JS，零依赖，不会误判格式。

### Decision 5: Stage 2 vendor resilience — three independent changes

**5a. `--base-url` 逗号分隔**:
- `resolveVendors()` 在 Tier 1（CLI 覆盖）中，对 `extraBaseUrls` 的每个原始字符串先 `split(",")` 再 trim
- 单 URL（无逗号）→ 1 个 vendor（向后兼容）
- 所有 CLI vendor 共享同一个 `IMAGE2_API_KEY`

**5b. 镜像下载重试**:
- 在 `generateOneImage` 的 vendor 尝试循环中，每个 vendor 在 submit/poll/download 任意阶段遇到 retryable error 时重试
- Retryable: HTTP 5xx, `ECONNRESET`, `ETIMEDOUT`, `ECONNREFUSED`, `fetch` 网络错误
- NOT retryable: HTTP 4xx（认证/权限问题重试无意义）
- 最多 2 次额外尝试（共 3 次），间隔 1s → 2s（指数退避）
- 同 vendor 的重试不算新 attempt——只在 `attempts[]` 中记录最终结果

**5c. Fail-soft on missing keys**:
- `resolveVendors()` Tier 2（`IMAGE2_VENDORS`）: 某个 item 的 `KEY_ENV_VAR` 未设置 → `console.warn` + skip 该 vendor
- 仅在所有 vendor 被 skip（列表为空）时 throw
- Tier 1（CLI `--base-url`）行为不变——缺 key 仍然 fail（用户显式指定的命令不应被静默降级）

### Decision 6: AGENT_CONTRACT Rule 12 — Gate 姿态

新增 Rule 12「Gate 是向导，不是路障」：

> **Gate 是向导，不是路障。** Gate 被触发时，必须告诉用户三件事：① 什么变了（具体到 slide id + 字段）；② 下一步干什么（可执行命令）；③ 不确定怎么办（给默认路径）。能在代码层面自动修的问题（JSON/YAML 格式、stale fingerprint 自动清理）直接修好继续。必须人类判断的事（视觉质量、标题措辞）给候选和建议。永远不让用户面对一堵墙。

## Risks / Trade-offs

- **[State record 结构变更]** → 旧 record（无 `slides` 字段）自动放行，无需迁移。用户下次 pilot 自然产生新格式。
- **[Per-slide 指纹增加计算量]** → 25 页的 SHA-256 仍然微秒级，无感知。
- **[Gate 从强制拒绝改为引导建议]** → Stage 4 仍检查图片字节完整性，但输出 MD 可执行的动作指令而非直接退出。MD Controller 拿到 `action` 字段后能自动修（跑 pilot → approve → 继续 build），用户全程无感知。不确定时告知风险让用户选，不硬堵。
- **[首次引入 body+header-lock 时全量 review]** → 当 deck 从纯 full-page 变为混合模式（新增第一张 body+header-lock slide），gate 突然激活 → 所有无 review 记录的 full-page slide 变为 `status: "changed"`。这是一次性的基线建立——hint 会解释「deck 新增了 body+header-lock 页，需要建立标题对比基线」。用户跑一次 pilot 确认后就不再需要全量确认。
- **[Stage 4 图片字节不匹配]** → 图片文件被外部修改或损坏时，Stage 4 必须拒绝组装（嵌错图比停下来更糟）。但 message 要清楚：指出哪个文件、SHA 不匹配、引导 `--force-images` 重生成 + pilot 重新确认。

### Gate 姿态细则：什么时候拦、什么时候引导

| 场景 | 行为 | 理由 |
|------|------|------|
| 标题文本变化 | 引导：告知哪些 slide 变了，给 `pilot --only` 命令 | 用户意图明确，只需确认视觉效果 |
| 图片字节被外部修改 | **硬拦** + 引导修复命令 | 嵌错图不可逆，必须停 |
| 纯 full-page deck | 自动放行 | 无对比基线，review 无意义 |
| 旧 state record | 自动放行 | 无需迁移，下次 pilot 自然更新 |
| profile 不匹配（分辨率/model） | 引导：告知差异，给重新 pilot 命令 | 用户可能不知道改变了什么 |
| `--preview` 模式 | 完全跳过 gate | 显式 opt-in 的快速预览 |
| Stage 4 `requireCurrentImages` | 对每个 slide 检查 manifest + 图片文件完整性，不匹配的 slide 加入 `changed` 并引导 `--force-images` | 保持现有行为，只是输出格式从 errors 数组变为 `changed` + `action` |

### Edge Cases

| 场景 | 行为 |
|------|------|
| `--only s99`（不存在的 slide） | gate 返回 `ok: true`（无 slide 需检查），hint 注明 "s99 not found in plan" |
| state.yaml 损坏或不可读 | `readState` 自带 heal 逻辑（已有）→ heal 失败则 gate 返回 `applicable: false` + hint 说明 state 不可用 |
| slide 有 `status` 但缺 `header_snapshot` | 视为 `was: null`，建议 pilot 确认（数据不一致时宁可多确认一次，不错过变化） |
| `{runDir}` 含空格 | MD 替换时自动加引号：`"node ... pilot \"{runDir}\" --only s05"` |
| 0 张 full-page slide | gate 返回 `applicable: false`（无事可查） |
| slide 从 deck 中删除 | state 中对应 `slides.{id}` 条目在下次 `mergeHeaderReviewRecord` 时自动清理 |
