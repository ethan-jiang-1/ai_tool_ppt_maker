# BUG-041: Pure raw 图像缺失 display 文字（provider_clauses 的 "no lettering" 与 pure 冲突）

> 严重级别: P0 | 发现: 2026-08-02 | 状态: 待真实 run 验收（本地契约与 source 迁移完成：2026-08-03）

## 当前复核

已归档的 `pure-text-delivery-and-nn-production-naming` 让 Pure raw contract 传递
`display`、`BODY` 与 `VISUAL SCENE`，并使 workflow-aware provider clauses 要求将文字作为
主画面、场景作为支持隐喻。v7 的结构化 receipt 已验证 25 页完整 `BODY` / `VISUAL SCENE`，
相关 fixture 回归也覆盖 Pure request contract。

当前 v5 final 是修复前的历史图像，不能证明新 prompt 的视觉结果；v7 尚未获得 Style Master
selection 或 provider authorization。真实生成、raw review 与人类对文字可读性的确认仍是关闭
本卡的必要条件。

## 症状

pure workflow 生成的图**只有场景、没有任何文字**（标题/副标题没画进图）。以 `deck_ai_sdlc_keynote/3_versions/v5` 的 final PNG（`InfoRev.png` 等）为例：封面只有奶油纸+琥珀点缀，`AI 时代的信息加工革命` 标题没有出现在画面里。

**意图澄清（用户 2026-08-02）**：pure 的本意是**整页（含 display 标题/副标题文字）由 Image2 画进图**——图有文；framed 才是 title/subtitle/kicker 固定在 Text Frame 本地排版、仅 Body/underlay 由图画。当前 pure 实现把文字丢了，只有场景。

## 根因

视觉语言注册表 `page-authority-visual-language.yaml` 的 provider_clauses 是 **framed 导向**的，明确要求无字：

```
editorial-systems: "…pure visual underlay with no lettering"
collaborative-work: "…pure visual underlay with no lettering"
composition: "…unmarked surface" / "…unmarked"
```

而 pure 需要把 display 文字画进图。BUG-035 修复后，`provider_clauses` 文本真正随 `prompt: JSON.stringify(request)` 到达模型（此前只是 SHA digest，模型读不到）；现在模型读到 "no lettering"，直接不画任何文字——尽管 `display.title/subtitle` 也在 prompt JSON 里，被该指令压制。

即：**注册表 clause 语义没有 workflow 区分**——同一段 clause 同时声明 `authorities: [pure-image2, framed-image2]`，但文案只为 framed 的"underlay 无字"设计。

## 复现

```bash
# pure 出图（framework v0.23.1，含 BUG-035 修复）
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs image2 plan|pilot|generate <run-dir>
# 检查 final PNG 或 raw.png —— 无 display 文字
```

## 修复关联

需要：注册表为 pure 提供**不压制文字**的 clause（或 per-authority clause 变体，pure 变体明示"把 display 字段的文字画进图"），并在 pure raw contract 里显式携带"paint exactly these display words"指令。与 BUG-035（clause 文本入 prompt）联动：clause 文本送达是必要的，但内容必须 workflow-aware。修复后对 v5 重跑 raw 生成。

## 关联

- BUG-035：provider_clauses 文本入 prompt（已修，v0.23.1）——本 bug 是该修复暴露出的语义冲突
- 本 deck v5 全部 25 页受影响，需重生成
