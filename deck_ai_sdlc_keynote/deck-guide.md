# ai_sdlc_keynote — PPT 项目指南

> 定位入口：`RUN_BUNDLE.md`（deck/framework 路径）。执行进度在 `_state/state.yaml`，不在此文件。
>
> 当前 run version：**v2**（`3_versions/v2`），production mode：**html-then-image2**（html-first-v1 pipeline）。先改 source，再让管线重建；不要直接改 `_generated/`。
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

## 生产模式与管线

| Version | Pipeline | Production Mode | 说明 |
|---------|----------|----------------|------|
| v2（当前） | `html-first-v1` | `html-then-image2` | HTML 本地生产为主，可选 Phase 4 visual-slot Image2 精修 |
| v1（只读） | `whole-page-image2-v1` | `image2-only` | 旧 markerless Image2 历史版本，保留为参考 |

Production mode SSOT：`_state/state.yaml` 的 `production_mode.by_version`。`project-metadata.yaml` 仅是镜像。

## HTML-first 路径（v2）

完整路径：structured source → local HTML pages → content/visual review → contact sheet/PPTX/notes → final delivery review。不需要 Image2 key 或 style master。完成交付后可通过 `image2 plan` 显式选择 2-4 页 visual-slot 精修；不选择就没有 Phase-4 欠账。

HTML outputs 在 `_generated/html_production/`，QA lineage 在 `_generated/qa/`；全部可重建、不可手改。

## Agent 控制流

- `production_mode.by_version` 是路由 SSOT（`_state/state.yaml`）。
- HTML outputs 在 `_generated/html_production/`，QA lineage 在 `_generated/qa/`；全部可重建、不可手改。
- Preview 可在 gates pending 时运行；Stage 4 必须有当前 reset-bound content/visual evidence。
- **Local Slide Rebuild**：单页 header/body/family/fallback。
- **Local Deck Rebuild**：visual config/runtime/renderer 影响全册。
- **Notes-Only Refresh**：assembly lineage 当前时只跑 Stage 5。
- **Structural Versioning Path**：preview + exact hash → source-only clean vNext → explicit target-local materialization。
- HTML structural debt 是 `needs_local_materialization`。
- stable ID 只允许 byte matching，不继承 reset、gate、delivery review 或 node decision。

## Image2 精修（v2 可选 Phase 4）

v2 已授权 4 页 visual-slot 精修（`GoRev`、`RiskMid`、`ToBPM`、`TriYear`），目前状态 `planned` 未执行。精修入口要求 HTML delivery review 为 `proceed`（已满足），且需显式授权 exact plan hash 才能生成。每页独立 `accept` 或 `use-html`。

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
