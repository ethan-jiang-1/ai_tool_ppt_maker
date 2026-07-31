# BUG-038: Text Frame standard-v1 深色面板与 warm-editorial underlay 风格冲突

> 严重级别: P1 | 发现: 2026-07-30 | 状态: 活跃

## 症状

`framed_composition.mjs` 合成的 final PNG 中，Text Frame（kicker/title/subtitle/callout）使用深色半透明面板叠加在暖色 underlay 上，形成视觉冲突。

- 底部 underlay：warm editorial 奶油纸 #F5F0EB + 棕褐墨水 #2D1B11 + 琥珀 #D97706
- 顶部 Text Frame 面板：`background:#111`（纯黑）+ `rgba(10,16,24,.88)`（深海军蓝 88% 不透明度）+ 白色文字

结果：暖色调画面被冷色面板覆盖，风格不统一。

## 根因

`framed_composition.mjs` 第 21 行的 HTML 模板硬编码了 dark-executive 配色：

```js
body{font-family:Arial,sans-serif}.slide{...background:#111;color:#fff}
.panel{...background:rgba(10,16,24,.88)}
.kicker{...color:#ffb000}
.subtitle{...color:#d9e4ee}
```

`standard-v1` Text Frame preset 是为 dark-executive 风格设计的，不存在 warm-editorial 对应的预设。

但 deck 的 `state.yaml` 声明 `style: warm-editorial`，而 `page-authority-visual-language.yaml` 的 provider clauses 也一致描述暖色调——Text Frame 的配色没有被 visual language 的选择影响。

## 复现

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs build deck_ai_sdlc_keynote/3_versions/v4
# 检查 final/*.png — 顶部和底部有深色面板
```

## 修复方向

1. **新增 warm-editorial Text Frame preset**：创建 `standard-v2` 或 `warm-editorial-v1`，配色基于 cream/sepia/amber
2. **让 Text Frame preset 由 visual language recipe 驱动**：选择 `editorial-systems` recipe 时自动使用对应配色预设，而不是始终 fallback 到 `standard-v1`
3. **最小改动**：在 `framed_composition.mjs` 中读取 deck style 并选择对应 CSS

路径 (2) 最干净——visual language 已经通过 recipe 声明了风格基调，Text Frame 应该从同一个 registry 推导配色。

## 修复关联

- 与 BUG-035/BUG-036 无直接关联
- 不影响 PPTX 功能正确性（文字位置和内容正确），只影响视觉一致性
