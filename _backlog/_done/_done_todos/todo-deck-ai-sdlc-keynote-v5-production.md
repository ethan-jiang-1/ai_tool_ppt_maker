# TODO: deck_ai_sdlc_bpm_keynote v5 production

> 状态: 实施中 | 优先级: 高 | 更新: 2026-08-02
> 上游: BUG-035/036/041/043/044 | 下游: v5 交付 + 框架 BUG-040/042 后续

## Why

把 `deck_ai_sdlc_bpm_keynote` 在框架 v0.23.x 上重做到 v5：V1 内容 + pure workflow + 图字双主（文字入图、图为隐喻）。用户逐项打磨，需要一个可见的 to-do 追踪生产进度。

## 现状对齐

已完成：
- 框架修复 BUG-035/036（clause 文本 + scene 入 prompt）→ v0.23.1
- 框架修复 BUG-043/044（NN_slideID 命名 + Pure BODY 文字入图）→ v0.23.2
- v5 source：V1 内容 + pure 格式 + SUBJECT+MOVE ID + VISUAL SCENE + BODY 正文（25 页）
- 注册表 clause 去 "no lettering"、指示"正文为主、图为隐喻"（run bundle 层 + 框架层）
- v5 已 validate（epoch 3）、style master accepted、plan 编译

## Current Direction

- 全量重生成 25 页（BODY 文字入图，后台进行中）
- review → accept → build（产出 NN_slideID 文件 + deck.pptx）
- 交付验收

## 待办清单

- [x] 框架 BUG-035/036（clause + scene 入 prompt）→ v0.23.1
- [x] 框架 BUG-043/044（NN_slideID + Pure BODY）→ v0.23.2
- [x] v5 source：V1 内容 + BODY 正文（25 页）+ validate
- [x] style master accepted + plan 编译
- [x] pilot 验证 BODY 文字入图（NewPart/BlocRes 通过）
- [x] 全量重生成 25 页（BODY 文字）
- [x] review → accept → build（NN_slideID + deck.pptx）
- [x] 遗留：style-master-iterations round0 历史文件已移到 1_upstream_raw_material/（bundle 结构校验通过）
- [ ] 交付验收（图文比例、风格、文字位置）
- [ ] 框架 BUG-040（PPTX 页脚页码，用户 fix）
- [ ] 框架 BUG-042（provider prompt 不外露，用户 fix）
- [ ] 框架 BUG-045（raw 等产出 NN_ 统一，用户 fix）

## Non-Goals

- 不改 V1–V4 历史版本
- 不动 `_generated/` 手改（可重建）
- 不新增第三方依赖

## Next Step

等后台全量重生成完成 → review/accept → build → 验收。
