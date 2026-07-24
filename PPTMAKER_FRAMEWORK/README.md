---
title: PPTMAKER_FRAMEWORK
version: 0.22.0
---

# PPTMAKER_FRAMEWORK · v0.22.0

AI 驱动的 PPT framework soft bundle。Agent 负责读取方法、做内容判断、执行本地生产与响应迭代；人拥有内容、视觉验收和远端成本授权。

## 五个源码目录

```text
PPTMAKER_FRAMEWORK/
├── workflow/   00-setup -> 01-content -> 02-visual-system -> 03-html-production -> [04 optional] -> 05-iteration
├── scripts/    Node ESM CLI 与 capability modules
├── charter/    目录、生命周期、node/state 宪法
├── reference/  glossary、anti-pattern、quick-start
└── playbook/   MD Controllers 与 checked-in controller-manifest-v3.json
```

`deck_*` 和 `dpt_*` 是生产数据，不是 framework 源码。run bundle 由 `bundle_layout.mjs` 创建，`_generated/` 永远是可重建派生品。

## Canonical lifecycle

```text
0 setup/readiness
1 structured content and closed layout families
2 renderer-neutral visual system
3 HTML Stage 1-5 -> contact sheet/PPTX/notes -> final review
4 Image Production: whole-page Image2 or authorized visual-slot refinement
5 local iteration and structural versioning
```

新 deck 省略 `--mode` 时使用 `image2-only` / `whole-page-image2-v1`：它通过 `create-deck` 进入正常的 style-master、pilot、header review、build、PPTX、notes 和 final-review 流程。选择 `html-first-v1` 时，真实 HTML preview 先于 content/visual approval，Stage 4/5 只消费 reset-bound verified final-slide evidence。visual-slot refinement 只在 current HTML delivery 后按显式授权进入。

Explicit whole-page deck 使用 `whole-page-image2-v1`，其 style/prompt/pilot/provider 语义由 `playbook/create-deck.md` 的 `image2-only` 路径定义。两个 pipeline 不共享 gate、manifest、reset、receipt 或 approval。

## Local refresh vocabulary

| Intent | HTML-first owner | Image2-only owner |
|---|---|---|
| 单页文字/family/fallback | Local Slide Rebuild | Header Text & Style Refresh / Generated Image Rebuild |
| visual config/runtime | Local Deck Rebuild | style/pilot maintenance |
| notes only | Notes-Only Refresh | Notes-Only Refresh |
| add/delete/move/reorder | Structural Versioning Path | Structural Versioning Path |

HTML structural receipt 使用 `needs_local_materialization`；whole-page structural receipt 使用 `needs_render`。后者不等于授权，必须单独说明远端成本。

## Where to start

1. 读 [`BOOTSTRAP.md`](BOOTSTRAP.md) 与 [`charter/AGENT_CONTRACT.md`](charter/AGENT_CONTRACT.md)。
2. 用 `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor` 检查 base local readiness。
3. 做具体 deck 时先交给 Agent 指定 run bundle 的 `RUN_BUNDLE.md` 定位，再读 `deck-guide.md` 操作；不要在 framework 根创建产物。
4. 改 framework 时读 `openspec/` 当前 change 与任务清单。

Git 只是可选、用户拥有的 source/control 审计与比较层。可见 `vN` + Structural Versioning Path 才是 deck 工作版本权威；没有用户对命名 Git 操作和精确范围的明确授权，Agent 不检查 Git 状态或执行 Git mutation。
