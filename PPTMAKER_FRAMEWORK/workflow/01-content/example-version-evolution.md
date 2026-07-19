---
title: Example — HTML-first Version Evolution
stage: workflow/01-content
position: example
type: reference
summary: 展示 structured deck 从 v1 到 v4 如何按 source owner、stable ID 与 local evidence 演进。
depends_on:
- workflow/01-content/06-iterate-with-version-discipline.md
feeds_into:
- workflow/05-iteration/03-structural-versioning-workflow.md
agent_action: reference
---

# Example — HTML-first Version Evolution

这个例子关注“为什么改”和“哪些证据失效”，不是展示一次次整册重生。

## v1：先把 source contract 跑通

- 12 张 slide，全部使用 mnemonic ID。
- 每页有 header、`CONCEPT`、一个 closed family 的 `SLIDE BODY`、fallback 和 speaker note。
- visual config 只使用一个 preset，asset catalog 为空。
- `validate` 通过后生成真实 local content/visual review plan。

学到的：第一版最重要的是 family/typed body 能准确表达论证，而不是先追求精修视觉。

## v2：反馈驱动的 content 与 family 调整

- `PainGo` 的 title 从抽象判断改成可证伪 claim。
- `CostGap` 从 `cards` 改成 `comparison`，因为听众需要明确看见两种方案的权衡。
- 普通 copy 变化重跑 content、font/overflow 与单页 composition；新增 recipe key 只要求相应 representative visual review。

学到的：内容批准与 visual-system 批准是两种证据。不能因为 pixels 看起来类似就跳过 content review，也不能因为改了一个词就重批全册 palette。

## v3：引入 catalog asset 与 fallback 审查

- 用户提供一个产品照片，登记为 byte-SHA-bound asset。
- `ProofGo` 的 `visual-focus` 使用 selected asset，同时保留 deterministic abstract fallback。
- visual review 同时展示 effective 与 forced-fallback；这样 asset 丢失或 stale 时页面仍有被看过的退路。

学到的：selected visual 是覆盖层，不是 source truth。asset byte 变化必须正式修复，不能静默继续使用旧批准。

## v4：结构简化

- 删除两个 filler slides，合并重复 evidence，重排 recommendation block。
- `slides preview` 展示 position · ID · title before/after；用户确认 exact plan hash 后发布 clean vNext。
- source apply 不渲染。随后显式 target-local materialization 复用匹配的 page/final bytes，并为新 target 生成 reset-null review artifacts。
- stable ID 保留 note/pixel identity，但不复制 content/visual gate、reset epoch、delivery review 或 node decision。

学到的：结构变化改变 ordered content/delivery identity，即使每张保留页的 PNG 完全相同，target 也必须重新确认版本级 content/visual evidence，再构建 contact sheet/PPTX/notes。

## 四条跨版本规则

1. Fix source, never `_generated/`.
2. Rebuild the smallest stale owner: Local Slide, Local Deck, Notes-Only, or Structural Versioning.
3. Show real artifacts before human decisions; metadata scalar 不是 HTML gate authority。
4. HTML iteration 零 provider。Markerless legacy 的远端重建另走兼容维护与明确授权。
