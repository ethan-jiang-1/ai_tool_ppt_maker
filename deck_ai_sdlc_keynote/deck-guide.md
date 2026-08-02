# ai_sdlc_keynote — PPT 项目指南

> 定位入口：`RUN_BUNDLE.md`（deck/framework 路径）。执行进度在 `_state/state.yaml`，不在此文件。
>
> 当前 run version：**v5**（`3_versions/v5`），pipeline：**page-authority-image2-v2**，workflow：**pure**（Image2 拥有所有最终像素，含 display 文字）。
>
> 先改 source，再让管线重建；不要直接改 `_generated/`。
>
> 可见 `vN` + Structural Versioning Path 是 deck 工作版本权威。Git 只是可选、用户拥有的 source/control 审计；本框架不提供自动 Git source recovery，也不把 `_generated/` 当作恢复目标。

## 人类只需要知道这些

| 想改什么 | Source owner |
|---|---|
| 每页标题、正文、VISUAL BRIEF、VISUAL SCENE、notes | `3_versions/v5/slide-specifications.md` |
| 主叙事、公式、设计约束 | `2_backbone/` |
| palette、字体角色、视觉语言注册表、资产 | `2_backbone/visual-style/` |
| 原始调研 | `1_upstream_raw_material/` |

跟 Agent 说"改第 5 页文案""把这页换视觉配方""新增风险页"即可。Agent 会把 position 解析为稳定 `slide_id`，选择最小本地刷新路径，并在结构变化前展示 before/after。

## 看进度

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state \
  deck_ai_sdlc_keynote/3_versions/v5
```

## 生产模式与管线

| Version | Pipeline | Workflow | 说明 |
|---------|----------|----------|------|
| v5（当前生产） | `page-authority-image2-v2` | `pure` | Pure：Image2 渲染整页含 display 文字；VISUAL SCENE 携带每页场景 |
| v4（只读） | `page-authority-image2-v2` | `framed` | 上一完整生产版（桥接管线），只读参考 |
| v2（只读） | `page-authority-image2-v2` | `framed` | 早期 page-authority 版，只读参考 |
| v1（只读） | `whole-page-image2-v1`（旧） | — | 内容权威参考（markerless 时代），只读 |
| v3（只读） | `whole-page-image2-v1`（旧） | — | image2-only 历史版本，只读参考 |

Production mode SSOT：`_state/state.yaml` 的 `production_mode.by_version`。`project-metadata.yaml` 仅是镜像。

## Pure 路径（v5）

完整路径：structured source → `validate` → `style-master`（accepted selection）→ `image2 plan` → `image2 pilot/expansion` → `authorize` → `generate`（逐页）→ `pilot-review`/`pilot-accept` → `review` → `accept` → `build`。所有 raw generation 必须经过 receipt-bound authorization gate。

Generated outputs 在 `_generated/page_authority_image2/`（receipts/raw/review/final），全部可重建、不可手改。

## Agent 控制流

- `production_mode.by_version` 是路由 SSOT（`_state/state.yaml`）。
- v5 使用 **pure** workflow：Image2 拥有所有最终像素，display 文字（KICKER/TITLE/SUBTITLE/CALLOUT）直接画进图；`VISUAL SCENE` 描述每页非文字场景（ASCII，过 text guard）。
- VISUAL BRIEF 负约束**不含** `no-readable-text`/`no-labels`（pure 的文字要画进图）。
- Style Master 权威 selection 在 `_state/state.yaml` 的 `page_authority_style_master`；`style_master.jpg` 只是投影。
- **Generated Image Rebuild**：任何 visible display/visual 变更都需回到 `image2 plan → ... → accept`。
- **Notes-Only Refresh**：仅走 `05-delivery`。
- **Structural Versioning Path**：preview + exact hash → source-only clean vNext → explicit target-local materialization。
- stable ID 只允许 byte matching，不继承 receipt、gate、delivery review 或 node decision。

## 常用命令

```bash
# 验证 source
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs validate \
  deck_ai_sdlc_keynote/3_versions/v5

# Style Master（先用现有 style_master.jpg zero-cost adopt，或重新生成候选）
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs style-master inspect \
  deck_ai_sdlc_keynote/3_versions/v5 --json
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs style-master plan \
  deck_ai_sdlc_keynote/3_versions/v5 --candidate-count 0
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs style-master review \
  deck_ai_sdlc_keynote/3_versions/v5 --plan-hash <sha>
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs style-master accept \
  deck_ai_sdlc_keynote/3_versions/v5 --plan-hash <sha> --decision proceed --candidate-id local-existing

# 渐进式 raw 生成（receipt-bound，需显式授权）
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs image2 plan \
  deck_ai_sdlc_keynote/3_versions/v5 --json
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs image2 pilot \
  deck_ai_sdlc_keynote/3_versions/v5 --plan-hash <sha> --slide-id InfoRev --slide-id NewPart --slide-id FabFive
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs image2 authorize \
  deck_ai_sdlc_keynote/3_versions/v5 --plan-hash <sha> --batch-hash <sha>
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs image2 generate \
  deck_ai_sdlc_keynote/3_versions/v5 --plan-hash <sha> --batch-hash <sha>
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs image2 pilot-review \
  deck_ai_sdlc_keynote/3_versions/v5 --plan-hash <sha> --batch-hash <sha> --json
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs image2 pilot-accept \
  deck_ai_sdlc_keynote/3_versions/v5 --plan-hash <sha> --batch-hash <sha> --decision proceed
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs image2 expansion \
  deck_ai_sdlc_keynote/3_versions/v5 --plan-hash <sha>
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs image2 review \
  deck_ai_sdlc_keynote/3_versions/v5 --plan-hash <sha> --json
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs image2 accept \
  deck_ai_sdlc_keynote/3_versions/v5 --plan-hash <sha> --decision proceed

# 构建 PPTX
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs build \
  deck_ai_sdlc_keynote/3_versions/v5
```

CLI 非零退出时，只消费 stderr 最后一个有效 failure envelope。`requires_human: true` 必须停下取得决定；不要猜 path/hash/token，也不要手修 `_state`、journal、lock 或 `_generated/`。

## 项目约定

- 语言：slides 中文为主（英文仅专有名词与英文引语）；演讲中文（可切换英文）
- 内容禁忌：无
- 视觉禁忌：禁止 photography / 3D / stock / clip-art / blue / green / neon
- 视觉 preset：custom（基于 warm-editorial，sketch/etching on cream paper）
