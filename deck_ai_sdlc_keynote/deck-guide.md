# ai_sdlc_keynote — PPT 项目指南

> 当前 run version：`v2`。先改 source，再让管线重建；不要直接改 `_generated/`。
>
> 可见 `vN` + Structural Versioning Path 是 deck 工作版本权威。Git 只是可选、用户拥有的 source/control 审计；本框架不提供自动 Git source recovery，也不把 `_generated/` 当作恢复目标。

## 人类只需要知道这些

| 想改什么 | Source owner |
|---|---|
| 每页标题、正文、layout family、notes | `3_versions/v2/slide-specifications.md` |
| 主叙事、公式、设计约束 | `2_backbone/` |
| palette、字体角色、组件规则、资产 | `2_backbone/visual-style/` |
| 原始调研 | `1_upstream_raw_material/` |

跟 Agent 说"改第 5 页文案""把这页换成 comparison""新增风险页"即可。Agent 会把 position 解析为稳定 `slide_id`，选择最小本地刷新路径，并在结构变化前展示 before/after。

## 看进度

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state \
  deck_ai_sdlc_keynote/3_versions/v2
```

HTML-first 完整路径是 structured source → local HTML preview → content/visual review → contact sheet/PPTX/notes → final delivery review。它不需要 Image2 key 或 style master。完成交付后可显式选择 `04-image2-refinement` 做 2–4 页 visual-slot 精修；不选择就没有 Phase-4 欠账。

v1 是 markerless 历史版本（`legacy-image2-first`），保留为只读参考。

## Agent 控制流

- `production.pipeline` 是最早分支权威。
- HTML outputs 在 `_generated/html_production/`，QA lineage 在 `_generated/qa/`；全部可重建、不可手改。
- Preview 可在 gates pending 时运行；Stage 4 必须有当前 reset-bound content/visual evidence。
- Local Slide Rebuild：单页 header/body/family/fallback。
- Local Deck Rebuild：visual config/runtime/renderer 影响全册。
- Notes-Only Refresh：assembly lineage 当前时只跑 Stage 5。
- Structural Versioning Path：preview + exact hash → source-only clean vNext → explicit target-local materialization。
- HTML structural debt 是 `needs_local_materialization`；legacy remote debt 是 `needs_render`。
- stable ID 只允许 byte matching，不继承 reset、gate、delivery review 或 node decision。

## 常用命令

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs validate \
  deck_ai_sdlc_keynote/3_versions/v2
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs pilot \
  deck_ai_sdlc_keynote/3_versions/v2
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs build \
  deck_ai_sdlc_keynote/3_versions/v2
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs slides list \
  deck_ai_sdlc_keynote/3_versions/v2
```

CLI 非零退出时，只消费 stderr 最后一个有效 failure envelope。`requires_human: true` 必须停下取得决定；不要猜 path/hash/token，也不要手修 `_state`、journal、lock 或 `_generated/`。

## 项目约定

- 语言：slides 中文为主（英文仅专有名词与英文引语）；演讲中文（可切换英文）
- 内容禁忌：无
- 视觉禁忌：禁止 photography / 3D / stock / clip-art / blue / green / neon
- 视觉 preset：custom（基于 warm-editorial，sketch/etching on cream paper）
