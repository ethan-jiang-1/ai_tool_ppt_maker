# ai_sdlc_keynote — 这个 PPT 项目

先读 **deck-guide.md**（进来先看那个）。

这个文件夹分三层 + 执行状态 + 自留教训:
- `1_upstream_raw_material/` — 原始素材、调研(你往里堆资料)
- `2_backbone/` — 主干:隐喻/公式/约束/大纲/讲稿/视觉(整个 deck 共享)
- `3_versions/` — 每个版本(你实际改 slide、生成 PPT 的地方)
- `_state/` — playbook 执行进度（`state.yaml`；见里面的 README）
- `_lessons/` — 遇事克服后留下的**非密钥**教训（先读再猜；见里面的 README）

**只改带 README 说'你改这里'的文件。** 结构由 `PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs` 定义,别自己新建目录。
