# ai_sdlc_keynote — PPT 项目指南

> 定位入口：`RUN_BUNDLE.md`（deck/harness 路径）。执行进度在 `_state/state.yaml`，不在此文件。
>
> 当前 run version：**v8**（`3_versions/v8`），pipeline：**page-image-workflow**，workflow：**pure**（Image2 渲染所有最终像素，含中文 display 文字）。
>
> 先改 source，再让管线重建；不要直接改 `_generated/`。
>
> 可见 `vN` + Structural Versioning Path 是 deck 工作版本权威。Git 只是可选、用户拥有的 source/control 审计；`_generated/` 不是恢复目标。

## 人类只需要知道这些

| 想改什么 | Source owner |
|---|---|
| 每页标题、正文、VISUAL BRIEF、SLIDE BODY、notes | `3_versions/v8/slide-specifications.md` |
| 主叙事、公式、设计约束、故事大纲 | `2_backbone/` |
| 视觉语言注册表、presentation profiles、palette、资产 | `2_backbone/visual-style/` |
| 原始调研 | `1_upstream_raw_material/` |

跟 Agent 说"改第 5 页文案""把这页换视觉配方""新增风险页"即可。Agent 会把 position 解析为稳定 `slide_id`，选择最小刷新路径，并在结构变化前展示 before/after。

## 看进度

```bash
node ppt_maker_harness/scripts/ppt_flow.mjs state deck_ai_sdlc_keynote/3_versions/v8 --json
node ppt_maker_harness/scripts/ppt_flow.mjs status deck_ai_sdlc_keynote/3_versions/v8
```

## 生产模式与管线

| Version | Pipeline | Workflow | 说明 |
|---------|----------|----------|------|
| v8（当前生产） | `page-image-workflow` | `pure` | 新 harness；Image2 渲染整页含 display 文字 |
| v7 / v5 / v1（只读） | 旧 harness `page-authority-image2-v2` | — | 旧历史产物，新 harness 无法读取，只读参考 |

Production identity SSOT：`_state/state.yaml` 的 `production_identity.by_version`。`project-metadata.yaml` 没有 production-protocol mirror。

## Pure 路径（v8）

完整路径：source（已 author）→ `validate` → `style-master`（accepted selection）→ `image2 plan` → `pilot` → `authorize` → `generate`（逐页）→ `review` → `accept` → `build`。所有 raw generation 必须经过 receipt-bound authorization gate。

Generated outputs 在 `3_versions/v8/_generated/page_image_workflow/`（receipts/raw/review/final），全部可重建、不可手改。

## Agent 控制流

- `production_identity.by_version` 是路由 SSOT（`_state/state.yaml`）。
- v8 使用 **pure** workflow：Image2 拥有所有最终像素，display 文字（KICKER/TITLE/SUBTITLE/SLIDE BODY）直接画进图。
- VISUAL BRIEF 负约束是闭集 `no-logo` / `no-watermark`；`no-readable-text`/`no-labels` 在 pure 下禁止。
- 每页 `VISUAL BRIEF`（recipe/composition/motifs）必须从 `2_backbone/visual-style/page-image-visual-language.yaml` 注册表解析。
- 带 Agent 的页用 `VISUAL IDENTITY: amber-agent/<role>` + `IDENTITY SUBJECT COUNT: one` + `SUBJECT RESTRICTIONS: none`。
- **Generated Image Rebuild**：任何 provider-visible 内容/视觉变更都需回到 `image2 plan → … → accept`。
- **Notes-Only Refresh**：仅走 `05-delivery`。
- **Structural Versioning Path**：preview + exact hash → source-only clean vNext。
- stable `slide_id` 只允许 byte matching，不继承 receipt/gate/delivery decision。

## 常用命令

```bash
# 验证 source
node ppt_maker_harness/scripts/ppt_flow.mjs validate deck_ai_sdlc_keynote/3_versions/v8

# Style Master（先 inspect，再用现有 style_master.jpg zero-cost adopt，或重新生成候选）
node ppt_maker_harness/scripts/ppt_flow.mjs style-master inspect deck_ai_sdlc_keynote/3_versions/v8
node ppt_maker_harness/scripts/ppt_flow.mjs style-master plan deck_ai_sdlc_keynote/3_versions/v8 --candidate-count 0

# 渐进式 raw 生成（receipt-bound，需显式授权）
node ppt_maker_harness/scripts/ppt_flow.mjs image2 plan deck_ai_sdlc_keynote/3_versions/v8

# 构建 PPTX
node ppt_maker_harness/scripts/ppt_flow.mjs build deck_ai_sdlc_keynote/3_versions/v8
```

CLI 非零退出时，只消费 stderr 最后一个有效 failure envelope。`requires_human: true` 必须停下取得决定；不要猜 path/hash/token，也不要手修 `_state`、journal、lock 或 `_generated/`。

## 项目约定

- 语言：slides 中文为主（英文仅专有名词与英文引语）；演讲中文（可切换英文）
- 内容禁忌：无
- 视觉禁忌：禁止 photography / 3D / stock / clip-art / blue / green / neon（详见 `style-master-prompt.md` 与 visual-language provider_clause）
- 视觉 preset：custom（warm-editorial，sketch/etching on cream paper）
