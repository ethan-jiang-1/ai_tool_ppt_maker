# BUG-003: 实验脚本占用 style_master.jpg 作为 style reference

**发现时间**: 2026-07-13
**发现位置**: `deck_ai_sdlc_bpm_keynote/3_versions/v1/_scratch/_gen_model_sheet.mjs`
**严重程度**: 中 — 不会损坏 style_master.jpg 本身，但会污染生成结果、混淆实验与正式资产的边界

## 症状

`_gen_model_sheet.mjs` 调用 `generateOneImage` 时传入了 `styleReferencePath: style_master.jpg`。这意味着：

1. **实验图被 style master 的风格绑定** — 出来的图带有 deck 正式视觉风格的烙印，无法独立判断 Agent 纹理实验的成败。
2. **不同实验共用同一个 style ref** — 如果后续有 B 实验、C 实验，都用 style_master.jpg，互相之间无法隔离变量。
3. **概念混淆** — style_master.jpg 是全 deck 最核心的视觉资产，不应该被 `_scratch/` 里的临时实验脚本引用。

## 修复方向

1. `_scratch/` 下的实验脚本**不传 `styleReferencePath`**，或使用实验专属的 style ref（例如 `_scratch/_experiment_style.jpg`）。
2. 不同的实验起不同的输出文件名 — 不要都叫 `agent_model_sheet.png`。
3. 实验脚本名也应区分 — `_gen_model_sheet.mjs` → `_gen_agent_stippling_v1.mjs` 之类。
4. 框架层面可以考虑：`generateOneImage` 在没有 style ref 时给出一个合理的默认行为，或至少 warn 而不是静默接受。

## 临时规避

删掉 `styleReferencePath` 参数，实验图不引用 style master。

## 解决

**日期**: 2026-07-13
**Change**: `fix-bug003-style-ref-silent-fallback`

四项修复方向的状态：

1. ✅ `_scratch/` 实验脚本不传 `styleReferencePath` — `_gen_agent.mjs` 已在 change 前修复，不传该参数
2. ✅ 不同实验起不同输出文件名 — `agent_reference_sheet.png`（唯一）
3. ✅ 实验脚本名区分 — `_gen_agent.mjs`（描述性命名）
4. ✅ 框架层 warn — `generateOneImage` 在 `image_api_client.mjs` 中当 `styleReferencePath` 为 falsy 时 log: `"No style reference — generating without visual style anchoring"`
