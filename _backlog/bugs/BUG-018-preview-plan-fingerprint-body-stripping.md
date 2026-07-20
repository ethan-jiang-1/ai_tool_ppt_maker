# BUG-018: preview plan 的 content_fingerprint 与 readCurrentPlan 重建值永不匹配（body 剥离差异）

> 严重级别: P1 | 发现: 2026-07-21 | 状态: 活跃

## 症状
pilot 生成的 preview review plan JSON 的 `content_fingerprint` 与 `readCurrentPlan` 内部
调用 `buildHtmlReviewPlan` 重建的 `expected.content_fingerprint` 永远不匹配，
导致 `recordCurrent` 始终为 false，gate approval 无法通过。

## 根因
`readCurrentPlan` 中加载 `currentPlan` 用的是 `parseHtmlSourceAstV1`（html_source_ast.mjs:11），
该函数在第 46 行将 body 中的 `schema_version/family/callout/primary_visual` 剥离：
```js
const body = Object.fromEntries(Object.entries(structured).filter(
  ([key]) => !["schema_version", "family", "callout", "primary_visual"].includes(key)
));
```

而 pilot 产出 `slide_plan.json` 时用的是 `rendererBodyProjection`（html_slide_contract.mjs:826），
body 中**保留**这些字段。

`htmlContentReviewProjectionV1`（html_review_projection.mjs:14）将 `body` 纳入
`content_fingerprint` 的哈希计算。同一个 slide 的 body 在两条路径中有不同的字段集合，
导致哈希永不匹配。

## 复现
1. 创建 html-first-v1 deck
2. 写任意带 primary_visual 或 callout 的 SLIDE BODY
3. `ppt_flow pilot` → 生成 preview plan
4. `readCurrentPlan` 重建 expected plan → content_fingerprint 不匹配 → `plan_reason: stale`

## 修复关联
两条路径的 body 序列化必须一致。要么 `rendererBodyProjection` 提前剥离那些字段，
要么 `parseHtmlSourceAstV1` 不再剥离，要么 `htmlContentReviewProjectionV1` 排除 body。
