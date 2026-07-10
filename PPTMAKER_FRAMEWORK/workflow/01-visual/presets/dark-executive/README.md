---
title: Dark Executive — Visual Preset
stage: workflow/01-visual
position: preset
type: reference
summary: 深色高管风。深海军蓝底+青蓝/电光蓝强调。T10 项目实战验证。适合战略 keynote、高管汇报、制造业/科技。
depends_on:
- workflow/01-visual/README.md
feeds_into:
- AGENTS.md (Phase 2)
agent_action: recommend
---

# Dark Executive

> 深色高管风。适合战略 keynote、高管汇报、制造业/科技/深科技行业。
> T10 项目实战验证——30 页 keynote 全部使用此风格，视觉一致性极佳。

## 外观

深海军蓝底色，青蓝和电光蓝作为数据强调色，整体感觉精密、专业、自信。像瑞士手表零件——珠宝般精致，而非工业粗糙。

## 色彩系统

| 角色 | 色值 | 用途 |
|------|------|------|
| Background | `#0a1628` | 所有 slide 底色 |
| Panel/Card | `#1e3a5f` | 卡片、面板背景 |
| Positive/Accent | `#06b6d4` | 增长数据、正面结果、关键数字 |
| Emphasis | `#3b82f6` | 强调文字、图标、连接线 |
| Data/Analysis | `#0d9488` | 分析区块、流程图节点 |
| Primary Text | `#f4f8fc` | 正文、标题（near-white） |
| Secondary Text | `#94a3b8` | 辅助文字、标签 |
| Muted | `#475569` | 弱化信息、水印效果 |
| Kicker | `#becbda` | Slide kicker（Header-Lock overlay） |
| Subtitle | `#a4b8cc` | Slide subtitle（Header-Lock overlay） |

## 字体层级（Header-Lock 使用）

| 层级 | 字体 | 大小 | 颜色 |
|------|------|------|------|
| Kicker | Source Sans Pro Semibold | 22px | `#becbda` |
| Title | Source Sans Pro Bold/Black | 46px | `#f4f8fc` |
| Subtitle | Source Sans Pro Regular | 27px | `#a4b8cc` |
| Body | Source Sans Pro Regular | 依赖 AI 生成 | `#e2e8f0` |
| KPI Number | 依赖 AI 生成 | ≥72px visual | `#06b6d4` |

## 布局模式

- **Mode A: Full-Width Statement** — kicker + title header (260px) + 主视觉 + 底部 callout bar
- **Mode B: Left Data / Right Visual** — 左侧 KPI card(s) + 右侧图表/图示
- **Mode C: Flow / Framework** — 水平或垂直排列的连接节点

## 适用场景

- ✅ 战略 keynote（制造业、科技、B2B）
- ✅ 高管/董事会汇报
- ✅ 需要展现"精密""专业""技术深度"的场合
- ❌ 消费者品牌故事（太冷）
- ❌ 培训/教学（太正式）
- ❌ 医疗健康（建议用 Clean Clinical）

## Style Master 生成 Prompt

用以下 prompt 生成 `style_master.jpg`（2K, 16:9）：

```
Design a visual style guide for an executive PowerPoint slide deck. This is a reference image, not a slide itself.

Show clearly:
- Color palette: 6 swatches with hex codes — #0a1628 (deep navy background), #1e3a5f (steel blue panels), #06b6d4 (cyan accent), #3b82f6 (electric blue emphasis), #0d9488 (teal data), #f0f4f8 (near-white text)
- Typography: headline sample (large, bold, near-white), subtitle sample (medium, muted), body text sample (regular, light gray), KPI number sample (very large, cyan, bold) — with clear size hierarchy
- Layout grid: simple wireframe showing 260px header zone at top, main content zone in middle, thin callout bar at bottom
- Component examples: one KPI card (dark panel, large cyan number, small label), one comparison layout (two columns with headers), one 4-node flow diagram (connected circles/arrows) — small but readable
- Micro decoration: subtle geometric accent lines, thin card borders

Style: dark executive, precision manufacturing meets modern tech. Deep navy background, cyan and electric blue data accents. Clean, confident, no clutter.
Mood keywords: precise, modern, executive, data-forward, jewel-like

No real company logo. No watermark. No page number. No warm tones (no red, orange, yellow, gold). No stock photos. English only.
Canvas: 16:9, 2K resolution.
```

## 生成后审查

- [ ] 所有 6 个颜色 swatch 的 hex code 清晰可读
- [ ] 字体层级比例正确（KPI 明显大于标题，标题明显大于正文）
- [ ] 260px header zone 在 wireframe 中可见
- [ ] 没有 warm tones（红/橙/黄/金）
- [ ] 没有 logo/watermark/page number
- [ ] KPI card 的 cyan 数字在 navy 背景上可读
