# deck_ai_sdlc_keynote — 迁移说明（人写 · 不在 `_generated/`）

从旧框架布局迁入现行三层树（`1_upstream` / `2_backbone` / `3_versions/v1`）。

## 已对齐

- 宪法树 + control files + `_state/` + `_lessons/`
- `2_backbone/visual-style/style_master.jpg` 在盘
- Stage 1：`slide_plan.json` + `page_prompts/`（**22** 页，现行重跑）
- 迁移备份：`_generated/ppt/deck.pptx`、`preview/contact_sheet.jpg`（Stage4 默认输出名是 `deck.pptx`）
- 门闩双写：metadata 与 `_state` 均为 `waived` / `waived`
- 断点：`iterate-style` @ `review-gate`（等人审 style master）
- **Session resume（2026-07-11）：** `_state/README` + `state.yaml` header 已与现行框架 where-am-I 卡对齐；断线后续跑先 `ppt_flow state`

## 未全量重生（故意）

- `page_images_full/` 约 **3/22** PNG；旧逐页中间件（~110MB）按「`_generated` 可重跑」跳过
- 全量交付：`pilot` → 视需要 `build`（会覆盖迁移备份 pptx/contact）

## SSOT

源：`2_backbone/` + `3_versions/v1/slide-specifications.md`。  
派生物：`3_versions/v1/_generated/`（可 `rm -rf` 后重跑；勿手改当源）。

迁移日：2026-07-11。真相对齐复查：2026-07-11（含 session-resume 脚手架同步）。
