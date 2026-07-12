# deck_ai_sdlc_keynote — 这个 PPT 项目怎么用

> 当前版本：`v1`。先改源文件，再让管线重建；不要直接改 `_generated/`。
> 本 deck 已从旧框架迁入现行三层树。迁移说明见 [MIGRATION.md](MIGRATION.md)。
> 2026-07-12 已同步新版 render/provenance/header-review 数据契约；旧派生缓存已移入 `3_versions/v1/_scratch/framework-sync-2026-07-12/`，不再视为 current。

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

- **临时/备份（上严下松）：** `3_versions/v1/_scratch/` — slidespec `.bak` 等只放这里，禁止 deck 根
- **断线 / 清聊天续跑：** 先跑下面 `state`（整流程 where-am-I：Summary + Next），再动手——进度在盘上，不在聊天
- **Playbook / 闸门**：`ppt_flow state deck_ai_sdlc_keynote/3_versions/v1`
  - 活跃：`iterate-style` @ `review-gate`（`waiting_for: user:review-style-master`）
  - `2_backbone/visual-style/style_master.jpg` **在盘**
  - migrate-import 已 handoff；清上下文后续跑，勿绿场重开
  - 下一步人审：open style master → LOCK / RETRY / BACK
- **管线产物**（`3_versions/v1/_generated/`；该目录 gitignore，以磁盘为准）：
  - `slide_plan.json` + `page_prompts/` — 由当前框架重建（**25** 页）
  - `page_images_full/` / `header_locked/` / `ppt/` — 当前应为空，直到新版 provenance + header review 流程重新生成
  - 旧 25 张 raw/locked 图片、PPTX、contact sheets 与旧 prompts 已备份到版本 `_scratch/framework-sync-2026-07-12/`
  - 详见 [MIGRATION.md](MIGRATION.md)

## 新框架同步后的生产前置

- 当前 25 张旧图混合 `1k`/`2k`，且没有 `_manifest.json`，不能被新版 Stage 2 当作可验证缓存复用。
- 25 页 IMAGE PROMPT 已逐页清理：保留 body 文案/数据/构图，移除重复的结构化 KICKER/TITLE/SUBTITLE 及 header 位置指令；Stage 1 审计为 0 个 exact-text 重复。
- 下一步仍先完成 `iterate-style` 的 style master review。LOCK 后直接用目标 production profile 跑 `pilot` → open review → `approve <run-dir> header` → `build --reuse-images`。

## 自留教训（非进度）

- `_lessons/`（先读再猜）。例：冒烟后写 `image2-proven.yaml`（无 key）。密钥只写 `.env`。

## 从项目根目录运行

依赖在 **repo 根** `npm install` 一次。

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state deck_ai_sdlc_keynote/3_versions/v1
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs pilot deck_ai_sdlc_keynote/3_versions/v1
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs build deck_ai_sdlc_keynote/3_versions/v1 --reuse-images

# Expert
node PPTMAKER_FRAMEWORK/scripts/unified_pipeline.mjs --run-dir deck_ai_sdlc_keynote/3_versions/v1 --stage 1
node PPTMAKER_FRAMEWORK/scripts/unified_pipeline.mjs --run-dir deck_ai_sdlc_keynote/3_versions/v1 --stage 2 --resolution 2k --force-images
node PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs --new-version deck_ai_sdlc_keynote/3_versions/v1
```

用户只需告诉 Agent 想改什么；Agent 负责选择最小重跑链。
