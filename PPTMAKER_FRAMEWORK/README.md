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
├── reference/  glossary、anti-pattern、legacy compatibility
└── playbook/   MD Controllers 与 checked-in controller-manifest-v3.json
```

`deck_*` 和 `dpt_*` 是生产数据，不是 framework 源码。run bundle 由 `bundle_layout.mjs` 创建，`_generated/` 永远是可重建派生品。

## Canonical lifecycle

```text
0 setup/readiness
1 structured content and closed layout families
2 renderer-neutral visual system
3 HTML Stage 1-5 -> contact sheet/PPTX/notes -> final review
4 optional authorized Image2 visual-slot refinement
5 HTML/local iteration or markerless legacy maintenance
```

新 deck 的目标 pipeline 是 `html-first-v1`：无需 renderer choice、Image2 key 或 style master；真实 HTML preview 先于 content/visual approval，Stage 4/5 只消费 reset-bound verified final-slide evidence。Phase 4 是交付后的可选、授权 visual-slot upgrade，不是完成欠账或新 deck gate。

Markerless deck 保持 `legacy-image2-first`，所有 whole-page style/prompt/pilot/provider 语义只在 `reference/legacy-image2-first-maintenance.md` 与 `playbook/legacy-image2-maintenance.md` 中出现。两个 pipeline 不共享 gate、manifest、reset、receipt 或 approval。

## Local refresh vocabulary

| Intent | HTML-first owner | Legacy owner |
|---|---|---|
| 单页文字/family/fallback | Local Slide Rebuild | Header Text & Style Refresh / Generated Image Rebuild |
| visual config/runtime | Local Deck Rebuild | style/pilot maintenance |
| notes only | Notes-Only Refresh | Notes-Only Refresh |
| add/delete/move/reorder | Structural Versioning Path | Structural Versioning Path |

HTML structural receipt 使用 `needs_local_materialization`；legacy receipt 仍可使用 `needs_render`。后者不等于授权，必须单独说明远端成本。

## Where to start

1. 读 [`BOOTSTRAP.md`](BOOTSTRAP.md) 与 [`charter/AGENT_CONTRACT.md`](charter/AGENT_CONTRACT.md)。
2. 用 `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor` 检查 base local readiness。
3. 做具体 deck 时先交给 Agent 指定 run bundle 的 `RUN_BUNDLE.md` 定位，再读 `deck-guide.md` 操作；不要在 framework 根创建产物。
4. 改 framework 时读 `openspec/` 当前 change 与任务清单。

Git 只是可选、用户拥有的 source/control 审计与比较层。可见 `vN` + Structural Versioning Path 才是 deck 工作版本权威；没有用户对命名 Git 操作和精确范围的明确授权，Agent 不检查 Git 状态或执行 Git mutation。
