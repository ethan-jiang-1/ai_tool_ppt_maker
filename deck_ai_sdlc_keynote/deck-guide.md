# ai_sdlc_keynote — PPT 项目指南

> 定位入口：`RUN_BUNDLE.md`（deck/framework 路径）。执行进度在 `_state/state.yaml`，不在此文件。
>
> 当前 run version：**v2**（`3_versions/v2`），pipeline：**page-authority-image2-v2**，workflow：**framed**（Text Frame 持有 title/kicker/subtitle/callout；Image2 生成无文字 underlay）。
>
> 先改 source，再让管线重建；不要直接改 `_generated/`。
>
> 可见 `vN` + Structural Versioning Path 是 deck 工作版本权威。Git 只是可选、用户拥有的 source/control 审计；本框架不提供自动 Git source recovery，也不把 `_generated/` 当作恢复目标。

## 人类只需要知道这些

| 想改什么 | Source owner |
|---|---|
| 每页标题、正文、VISUAL BRIEF、notes | `3_versions/v2/slide-specifications.md` |
| 主叙事、公式、设计约束 | `2_backbone/` |
| palette、字体角色、组件规则、资产 | `2_backbone/visual-style/` |
| 原始调研 | `1_upstream_raw_material/` |

跟 Agent 说"改第 5 页文案""把这页换视觉配方""新增风险页"即可。Agent 会把 position 解析为稳定 `slide_id`，选择最小本地刷新路径，并在结构变化前展示 before/after。

## 看进度

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state \
  deck_ai_sdlc_keynote/3_versions/v2
```

## 生产模式与管线

| Version | Pipeline | Workflow | 说明 |
|---------|----------|----------|------|
| v2（当前） | `page-authority-image2-v2` | `framed` | Page Authority v2，Text Frame 持有文字，Image2 生成无文字 underlay |
| v1（只读） | `whole-page-image2-v1`（旧） | — | 旧 markerless Image2 历史版本，保留为参考 |
| v3（只读） | `whole-page-image2-v1`（旧） | — | image2-only 历史版本，保留为参考 |

Production mode SSOT：`_state/state.yaml` 的 `production_mode.by_version`。`project-metadata.yaml` 仅是镜像。

## Page Authority Image2 v2 路径（v2）

完整路径：structured source → `validate` → `image2 plan` → `image2 authorize` → `image2 generate` → `image2 review` → `image2 accept` → `build`（delivery）。所有 raw generation 必须经过 receipt-bound authorization gate。

Generated outputs 在 `_generated/page_authority_image2/`（receipts/raw/review/final），全部可重建、不可手改。

## Agent 控制流

- `production_mode.by_version` 是路由 SSOT（`_state/state.yaml`）。
- v2 使用 framed workflow：Text Frame 持有 kicker/title/subtitle/callout；underlay 由 Image2 生成且不得含可读文字。
- `_generated/page_authority_image2/` 全部可重建、不可手改。
- **Header Text & Style Refresh**：仅 framed 版本可用，本地完成，不需要 provider credential。
- **Generated Image Rebuild**：任何 visual 变更都需回到 receipt-bound `image2 plan → authorize → generate → review → accept`。
- **Notes-Only Refresh**：仅走 `05-delivery`。
- **Structural Versioning Path**：preview + exact hash → source-only clean vNext → explicit target-local materialization。
- stable ID 只允许 byte matching，不继承 receipt、gate、delivery review 或 node decision。

## 常用命令

```bash
# 验证 source
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs validate \
  deck_ai_sdlc_keynote/3_versions/v2

# 列出 slides
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs slides \
  deck_ai_sdlc_keynote/3_versions/v2

# Raw generation 流程（需显式授权）
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs image2 plan \
  deck_ai_sdlc_keynote/3_versions/v2 --json
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs image2 authorize \
  deck_ai_sdlc_keynote/3_versions/v2 --plan-hash <hash>
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs image2 generate \
  deck_ai_sdlc_keynote/3_versions/v2 --plan-hash <hash>
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs image2 review \
  deck_ai_sdlc_keynote/3_versions/v2 --json
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs image2 accept \
  deck_ai_sdlc_keynote/3_versions/v2 --decision proceed

# 构建 PPTX
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs build \
  deck_ai_sdlc_keynote/3_versions/v2

# Framed 本地刷新（仅文字/样式变更，无需 provider）
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs refresh \
  deck_ai_sdlc_keynote/3_versions/v2 --kind title --only <slide_id>
```

CLI 非零退出时，只消费 stderr 最后一个有效 failure envelope。`requires_human: true` 必须停下取得决定；不要猜 path/hash/token，也不要手修 `_state`、journal、lock 或 `_generated/`。

## 项目约定

- 语言：slides 中文为主（英文仅专有名词与英文引语）；演讲中文（可切换英文）
- 内容禁忌：无
- 视觉禁忌：禁止 photography / 3D / stock / clip-art / blue / green / neon
- 视觉 preset：custom（基于 warm-editorial，sketch/etching on cream paper）
