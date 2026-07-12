## Context

`deck_ai_sdlc_keynote` 25 页全量生产暴露了 gate 系统姿态问题：守门员（拒绝→报错），不是向导（检查→给 MD 指令→继续）。BUG-003 记录 7 种 workaround 全失败。管线的核心消费者是 MD Controller——gate 应该返回 MD 可直接执行的动作。

## MD Controller 视角（第一人称）

**我是 MD Controller。我调用 gate 检查，拿到一个结构体。我的处理逻辑：**

```
result = validateHeaderReviewRecord(...)

if (!result.format)        → 旧代码，放行，继续管线
if (result.ok)             → 没问题，继续管线
if (!result.applicable)    → gate 不适用（纯 full-page、旧 record），继续管线
if (result.ok === false && result.applicable) →
    cmd = result.action.replace("{runDir}", runDir)
    执行 cmd（pilot）
    等用户 approve
    重试 gate → result.ok === true → 继续管线
```

**我会收到的典型输出：**

```
一页变了：
{ format:2, applicable:true, ok:false,
  changed:[{id:"s05", field:"title", was:"旧", now:"新"}],
  action: "node ... pilot \"{runDir}\" --only s05",
  hint: "1 页标题变了，正在确认效果..." }

三页变了：
{ ..., changed:[s05, s07, s14],
  action: "node ... pilot \"{runDir}\" --only s05,s07,s14", ... }

八页变了（>5）：
{ ..., changed:[s01,s02,...,s08],
  action: "node ... pilot \"{runDir}\"",     ← 不含 --only，全量
  hint: "8 页有变化，建议全量 pilot" }

无变化（混合 deck，gate 适用但全 OK）：
{ format:2, applicable:true, ok:true, changed:[], action:null, hint:null }

纯 full-page deck（gate 不适用）：
{ format:2, applicable:false, ok:true, changed:[], action:null, hint:null }

旧 record（无 slides 字段——gate 不适用）：
{ format:2, applicable:false, ok:true, changed:[], action:null, hint:null }
```

**用户看到什么？**
- gate 过 → 用户无感知，build 直接跑完
- gate 不过 → MD 告诉用户 "s05, s07 标题变了，先确认效果" → 跑 pilot → 图出来问 "可以吗？" → 用户说可以 → approve → MD 重跑 `build`（第二次 gate 自然过，因为 approve 时 state 已更新）→ PPTX 出来
- 用户全程不需要知道 fingerprint、hash、state record 这些词

**完整流程（两次 build）**：
```
第一次 build:
  Stage 1 → gate 返回 {ok:false, action:"pilot --only s05,s07"}
  → MD 执行 pilot --only s05,s07
  → 用户 approve header
  → state 更新（s05,s07.header_snapshot 写入当前值）
  
第二次 build（MD 自动重跑或用户手动重跑）:
  Stage 1 → gate 检查 → fingerprint 匹配 → {ok:true}
  → Stage 2,3,4,5 → PPTX
```

## Goals / Non-Goals

**Goals:**
1. Header review 从全局锁 → per-slide 状态机
2. Gate 输出 MD 可消费：`{format, applicable, ok, changed, action, hint}`
3. `--only` 限缩 gate 检查范围
4. 纯 full-page deck 自动放行
5. AGENT_CONTRACT Rule 12 + state schema 更新

**Non-Goals:**
- 不改混合 deck 的 review 流程（仍需 pilot → approve）
- 不实现自动 rerun pilot（MD 拿到 action 后执行）

## Decisions

### Decision 1: Per-slide fingerprint + header_snapshot

`buildHeaderReviewInputs()` 为每张 full-page slide 输出 `{slideFingerprints: {s01: "sha", ...}, hasBodyHeaderLockSlides: bool}`。State record 存 per-slide `header_snapshot: {kicker, title, subtitle, visual_type}` 用于 diff。

Fingerprint = `sha256(stableJson({kicker, title, subtitle, visual_type, geometry}))`。

**`changed` 计算**：fingerprint 快速比较 → 变了 → 逐字段 diff kicker/title/subtitle → 产出 `{id, field, was, now}`。文本字段都相同但 fingerprint 不匹配 → 比较 visual_type（不同→`{field: "visual_type", was, now}`），再 geometry（不同→`{field: "layout"}`）。`changed` 永非空当 `ok: false`。无 header_snapshot → `was: null`。

**旧 record**：无 `slides` 字段 → `applicable: false`（放行）。下次 pilot 自然产生新格式。无需迁移。

### Decision 2: Gate 输出——MD 可直接消费

```js
{
  format: 2,                     // 新格式标识（旧代码无此字段→MD 放行）
  applicable: true,              // 有 body+header-lock 基线
  ok: false,                     // 有 slide 需 review
  changed: [
    { id: "s05", field: "title", was: "传统开发", now: "软件优先" }
  ],
  action: "node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs pilot \"{runDir}\" --only s05,s07",
  hint: "2 页标题变了，跑 pilot 确认 AI 渲染效果后继续"
}
```

变化 ≤5 页 → `action` 含 `--only`；>5 页 → `action: "pilot \"{runDir}\""`（全量）。

MD 逻辑：`!format` → 放行；`ok` → 继续；`!ok && !applicable` → 继续；`!ok && applicable` → 替换 `{runDir}` → 执行。

### Decision 3: `--only` 限缩 + 不存在的 slide 放行

传入 `--only` 时只检查指定 slide。`--only s99`（不存在）→ `ok: true` + hint "s99 not found"。

### Decision 4: Gate 姿态细则

| 场景 | 行为 |
|------|------|
| 标题文本变化 | 引导：给 `changed` + `pilot --only` |
| 图片字节被外部修改 | 硬拦 + 给 `--force-images` + pilot 命令 |
| 纯 full-page deck | 放行 |
| 旧 state record | 放行 |
| profile 不匹配 | 引导：告知差异，给重新 pilot |
| `--preview` | 完全跳过 |
| Stage 4 `requireCurrentImages` | per-slide 检查 manifest + 图片完整性 |

### Decision 5: AGENT_CONTRACT Rule 12

> **Gate 是向导，不是路障。** Gate 被触发时，必须给 MD Controller 三样东西：① 什么变了（slide id + 字段）；② 可执行命令；③ 默认路径。能自动修的不停顿。必须人判的（视觉质量）给候选 + 推荐。永远不让用户面对一堵墙。

## Risks

- **State 结构变更**：旧 record 放行，用户下次 pilot 产生新格式
- **首次 body+header-lock**：gate 从不适用→适用，所有无 record 的 full-page slide 标 `changed`（一次性基线建立）
- **Stage 4 图片字节不匹配**：硬拦（嵌错图更糟），message 清晰引导修复
