---
title: 00 — 变更分类与最小刷新路径
stage: workflow/05-iteration
position: 01 of 05
type: methodology
summary: 先按 pipeline、source owner 与失效证据分类，再选择 HTML 本地刷新、结构版本化或 legacy 维护。
depends_on:
- workflow/05-iteration/README.md
feeds_into:
- workflow/05-iteration/01-content-and-layout-iteration.md
agent_action: internalize
---

# 00 — 变更分类与最小刷新路径

← [README](README.md) | [Next →](01-content-and-layout-iteration.md)

## 顺序不能反

1. 读取 canonical `production.pipeline`。
2. 识别 source owner：content、visual system、notes、structure、runtime 或 legacy generated image。
3. 计算失效的 plan/page/review/assembly lineage。
4. 选择最小路径；只有 legacy remote work 才进入 provider authorization。

## HTML-first

| 改动 | 路径 | Review 影响 |
|---|---|---|
| 单页 header/body/family/fallback | Local Slide Rebuild | content；family/asset/chart shape 只刷新相关 visual evidence |
| visual config/runtime/renderer | Local Deck Rebuild | global system + recipe representatives，再本地全量 |
| notes only | Notes-Only Refresh | 新 notes receipt 后重新 final delivery review |
| 增删重排 | Structural Versioning Path | source-only vNext，再 target-local materialization 与 target reviews |
| generated owner 丢失且已有 authority | Confirmed HTML production reset | 新 reset epoch，重新 preview/gates/delivery review |

普通 copy 不重新批准全册 visual system，但必须重新做 schema、font、overflow 与 composition checks。chart numeric shape、asset byte、selection/fallback 或 family recipe 改变时，只让对应 page/coverage stale。

## Markerless legacy

保持 Header Text & Style Refresh、Generated Image Rebuild、Notes-Only Refresh 与 Structural Versioning Path。Generated Image Rebuild 是远端成本，必须单独授权。详细 ownership 见 `../../reference/legacy-image2-first-maintenance.md`。

## OpenSpec 何时介入

- framework 合同、CLI、schema、共享 renderer/runtime、跨模块 state 变化：走 OpenSpec。
- 一个具体 deck 的普通 source edit：在 run bundle 内按上述路径执行，不为 typo 或单页文案机械创建 framework proposal。
- 结构变化无论大小都 preview + exact plan hash，因为它改变 source snapshot 身份。

禁止把 HTML layout 改写成 `IMAGE PROMPT` 微调，也禁止把 Phase 4 当普通 refresh。现代 Image2 refinement 当前没有 executable workflow。
