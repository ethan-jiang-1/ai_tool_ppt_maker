# deck_ai_sdlc_keynote — 这个 PPT 项目怎么用

> 当前版本：`v1`。先改源文件，再让管线重建；不要直接改 `_generated/`。
> 本 deck 已从旧框架迁入现行三层树。迁移说明见 [MIGRATION.md](MIGRATION.md)。

## 你改哪里

- 每页内容：`3_versions/v1/slide-specifications.md`
- 整体主线：`2_backbone/core-metaphor.md` + `2_backbone/core-formula.md`
- 视觉主干：`2_backbone/visual-style/`
- 原始材料：`1_upstream_raw_material/`

## 闸门（双写）

用户确认内容/视觉后：

1. **Pipeline gates**（Stage 2 检查）：`project-metadata.yaml` 的 `content_gate` / `visual_gate`
2. **Playbook gates**：`_state/state.yaml` 的 `gates.content` / `gates.visual`

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs approve deck_ai_sdlc_keynote/3_versions/v1 content
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs approve deck_ai_sdlc_keynote/3_versions/v1 visual
```

**当前选择（迁移真相）：** content / visual 均为 **`waived`**（metadata 与 `_state` 已对齐）。交付物是迁移备份 + 部分重生，**不是**在现行 `iterate-style` 下重新 LOCK 的视觉。要当真锁定：open `style_master.jpg` → review-gate **LOCK** → `approve visual`。

## 当前进度

- **Playbook / 闸门**：`ppt_flow state deck_ai_sdlc_keynote/3_versions/v1`
  - 活跃：`iterate-style` @ `review-gate`（`waiting_for: user:review-style-master`）
  - `2_backbone/visual-style/style_master.jpg` **在盘**
  - migrate-import 已 handoff；清上下文后续跑，勿绿场重开
- **管线产物**（`3_versions/v1/_generated/`；该目录 gitignore，以磁盘为准）：
  - `ppt/deck.pptx` — Stage4 默认名（迁移备份；重跑会覆盖）
  - `preview/contact_sheet.jpg` — 迁移备份；另有 `pilot_*_contact_sheet.jpg`
  - `slide_plan.json` + `page_prompts/` — Stage 1 现行重跑（**22** 页）
  - `page_images_full/` — 约 **3/22** PNG（其余未重生）
  - 详见 [MIGRATION.md](MIGRATION.md)

## 自留教训（非进度）

- `_lessons/`（先读再猜）。例：冒烟后写 `image2-proven.yaml`（无 key）。密钥只写 `.env`。

## 从项目根目录运行

依赖在 **repo 根** `npm install` 一次。

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state deck_ai_sdlc_keynote/3_versions/v1
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs pilot deck_ai_sdlc_keynote/3_versions/v1
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs build deck_ai_sdlc_keynote/3_versions/v1

# Expert
node PPTMAKER_FRAMEWORK/scripts/unified_pipeline.mjs --run-dir deck_ai_sdlc_keynote/3_versions/v1 --stage 1
node PPTMAKER_FRAMEWORK/scripts/unified_pipeline.mjs --run-dir deck_ai_sdlc_keynote/3_versions/v1 --stage 2 --resolution 2k --force-images
node PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs --new-version deck_ai_sdlc_keynote/3_versions/v1
```

用户只需告诉 Agent 想改什么；Agent 负责选择最小重跑链。
