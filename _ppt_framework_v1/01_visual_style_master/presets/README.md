---
title: Visual Presets Index
stage: 01_visual_style_master
position: preset_index
type: reference
summary: 5 套视觉预设的快速索引。Agent 根据用户 topic/audience/deck type 推荐 2-3 个，让用户选择。
depends_on:
- BOOTSTRAP.md
feeds_into:
- AGENTS.md (Phase 2)
agent_action: recommend
---

# Visual Presets — 视觉预设库

> Agent：用户不应该从头设计配色。从这里选 2-3 个推荐给用户，描述外观和适用场景，让用户选一个。

## 快速对照

| # | 预设 | 底色 | 强调色 | 风格 | 最适合 |
|---|------|------|--------|------|--------|
| 1 | **Dark Executive** | 深海军蓝 `#0a1628` | 青蓝 `#06b6d4` | 精密、现代、高管 | 战略 keynote、制造业、科技、B2B |
| 2 | **Clean Clinical** | 白 `#ffffff` | 青绿 `#0d9488` | 干净、理性、数据 | 医疗、咨询、研究、培训 |
| 3 | **Warm Editorial** | 奶油 `#fef9ef` | 铁锈红 `#c44d34` | 温暖、人性、有质感 | 品牌故事、人文话题、设计/创意 |
| 4 | **Tech Startup** | 深紫 `#1a0a2e` | 霓虹青 `#00f5d4` | 大胆、活力、记忆点 | 融资 pitch、产品发布、年轻受众 |
| 5 | **Corporate Safe** | 白 `#ffffff` | 企业蓝 `#1e40af` | 专业、可信、永不过时 | 金融、政府、法律、跨国企业 |

## Agent 选择逻辑

```
用户 deck type 是什么？
├─ Pitch Deck → Tech Startup 或 Dark Executive
├─ Keynote（战略）→ Dark Executive 或 Corporate Safe
├─ Keynote（品牌/人文）→ Warm Editorial
├─ Training → Clean Clinical 或 Warm Editorial
├─ Report → Clean Clinical 或 Corporate Safe
└─ 不确定 → Dark Executive（最通用）

用户 audience 是谁？
├─ Executive/Board → Dark Executive 或 Corporate Safe
├─ Investor → Tech Startup 或 Dark Executive
├─ General/Learning → Clean Clinical 或 Warm Editorial
└─ Mixed/Unknown → Dark Executive

用户在什么行业？
├─ 制造/科技/深科技 → Dark Executive
├─ 医疗/生命科学 → Clean Clinical
├─ 消费/品牌/创意 → Warm Editorial 或 Tech Startup
├─ 金融/政府/法律 → Corporate Safe
└─ 不确定 → Dark Executive
```

## 每个预设包含什么

每个预设目录下有三个文件：

| 文件 | 内容 |
|------|------|
| `README.md` | 外观描述、色彩系统表、字体层级、适用场景、**Style Master 生成 Prompt** |
| `color_palette.json` | 配色 + header-lock 参数 |
| `deck_system.txt` | 填好的文本约束文件，Stage 1 读取并**整体注入**每个 slide prompt |

**`color_palette.json` 的契约——哪些键被脚本读取（其余是给人看的描述）：**

| 键 | 谁读 | 用途 |
|----|------|------|
| `header_lock.fonts.{kicker,title,subtitle}.{color, size_px}` | Stage 3 | 叠加标题文字的颜色与字号 |
| `header_lock.body_header_safe_zone` | Stage 1 | body+header-lock 页顶部保留的 header 带高度。**这是活字段**——改它就改 header 带深度 |
| `background` | Stage 3 | 判断深/浅底以选文字阴影 |
| `colors.*` / `forbidden` / `best_for` / `avoid_for` / `name` / `description` | **无脚本读取，仅描述** | 给 agent/人理解用；各 preset 的 `colors.*` 角色**可以不同**（`accent_cyber` vs `accent_warmth` 等是刻意的美学差异，不是 schema 违规）。**不要写工具去按 `colors.*` 的某个角色名取值**——那不是契约 |

**重要**：预设不包含预生成的 `style_master.jpg`——这需要调用 GPT Image 2 API 生成。Agent 在用户选中预设后，用 README 中的 prompt 生成 style_master.jpg（单张图模式，2K，16:9）。

## 如何新增预设

1. 在 `presets/` 下新建目录（kebab-case 命名）
2. 创建 `README.md`（含外观描述 + 色彩表 + 字体层级 + 适用场景 + Style Master prompt）
3. 创建 `color_palette.json`——**必须包含被脚本读取的键**（`header_lock.fonts.{kicker,title,subtitle}.{color,size_px}`、`header_lock.body_header_safe_zone`、`background`）；`colors.*` 等描述键按需自由填。
4. 创建 `deck_system.txt`。它被 Stage 1 **整体作为文本注入**（不按分节解析），所以分节名不必逐字统一——但**必须含 `LANGUAGE` 和 `FORBIDDEN`**（两条最关键的约束）。推荐分节（可按 preset 调整）：DECK TYPE, BACKGROUND, COLOR FAMILY, TEXT DENSITY, HEADER LOCK, BODY TEXT CONTRACT, CALLOUT BAR, KPI NUMBERS, ICONS/IMAGERY, TONE。
5. 更新本文件的对照表

**预设设计原则**：
- 5 个就够了——更多会产生选择困难
- 每个预设必须有明确的"适合"和"不适合"场景
- 配色必须在 AI 图像模型中表现稳定（单一家族色系优先）
- style master prompt 必须包含具体的 hex code（模型看到色块才能精确匹配）
