## Context

Stage 1 (`content-parsing`) 决定每页的 `render_mode` 并组装 image prompt；Stage 3 (`header-lock`) 在 `body+header-lock` 页把 kicker/title/subtitle 以像素精度叠上去，`full-page` 页原样透传。今天：

- **没有 deck 级默认**：mode 要么每页显式写 `RENDER MODE`，要么按 VISUAL TYPE 隐式派生。"全 X 除了几页"只能挨页写。
- **full-page prompt 无 header 纪律**：`assemblePrompt` 的 full-page 分支只输出 `FULL-PAGE: Render the complete slide including all text` + 作者散文 prompt。标题位置/字号全靠作者在 IMAGE PROMPT 里手写，图像模型每页画得忽大忽小、忽上忽下。
- **用户诉求的根因**：用户之所以想要 header-lock，不是喜欢这个模式，而是"AI 画的 header 老飘"。飘是 prompt 纪律缺失造成的，可用提示词大幅缓解。

header 几何（kicker/title/subtitle 的 position/size/alignment）已经是单一事实源：`color_palette.json` → `visual_config.mjs`，今天只有 Stage 3 消费它。

## Goals / Non-Goals

**Goals:**
- 用户面极简：小白只填 kicker/headline/subtitle 文字，永远看不到 "render mode / header-lock"。
- 默认 `full-page`，靠 prompt 把 header 做稳，跨页一致。
- header-lock 降级为"某页真飘时"的按需硬兜底，用户抱怨才启用；他认定的事我们核实后消化成内部 `layout_contract`。
- 一个简单、可追溯、向后兼容的策略级联；旧 deck 不改也能跑。

**Non-Goals:**
- 不修 BUG-009（`_loadImageToCanvas` 同步解码空白图）——独立轨道。
- 不把 render mode 拆成"body 轴 × header 轴"二维矩阵（物理上"脚本抬头"与"预留顶部带"绑死，拆开是给伪差异搭框架）。
- 不改 Stage 3 的叠加/透传机制，不改 `color_palette.json` 的 schema。
- 不追求 header"像素级锁死"的 full-page 效果（图像模型做不到，见 Risks）。

## Decisions

### 1. 策略源放在 `slide-specifications.md` 的 frontmatter `render:` 块
- **选择**：版本级文件顶部一个可选 YAML frontmatter：`render.default`（默认 `full-page`）+ `render.header-lock`（例外页 id 列表）。
- **为什么**：render mode 是**每版本**的内容决策（不同 v{n} 可不同），且 Stage 1 已经在读这个文件——SSOT 集中在一个文件，可 diff、可回归、可重跑，符合"源 vs 派生"铁律。
- **备选**：放 `project-metadata.yaml`（deck 根，跨版本共享）——否决，因为它会让不同版本无法各自设策略，且把 render 决策从内容文件里分离出去，增加追踪成本。

### 2. 固定优先级级联（精确度递减）
```
每页显式 RENDER MODE  >  deck header-lock 例外表  >  deck default(=full-page)  >  VISUAL TYPE 派生(旧 deck 兜底)
```
- **为什么**：一条确定性规则覆盖用户全部诉求——"全 full-page"（default）、"全 body-lock"（default 翻转）、"全 X 除了几页"（例外表）、"这一页我说了算"（显式）。VISUAL TYPE 派生保留在最低档，只为无 frontmatter 的旧 deck 兜底，**向后兼容**。
- **可追溯**：`layout_contract.render_mode_source` 扩展为 `explicit` / `policy:exception` / `policy:default` / `derived:visual_type`，每个决策都能回溯到来源。

### 3. full-page 与 header-lock 共用同一套 header 几何，区别只是"软约束 vs 硬叠加"
- **软约束（full-page）**：Stage 1 从 `color_palette.json` header 几何 + 结构化 kicker/headline/subtitle，拼一段 **Header Placement 契约**注入 full-page prompt（位置/字号/对齐 + 文字），取代作者散文手写。
- **硬叠加（header-lock）**：Stage 3 用**同一套**几何脚本画字（现状不变）。
- **为什么**：切换某页 full-page↔header-lock **位置不变**，只是"请 AI 画在这"↔"AI 别画、脚本画在这"，心智负担为零；也让"飘了就锁"成为无缝升级路径。这是本设计最关键的统一点。

### 4. Agent 主动发现、用户拍板
- Agent 可在 contact sheet 视觉闸门指出明显漂移并建议"锁这页"，但**绝不替用户预先配置**——启用 header-lock 永远是用户/或用户点头的动作（加进例外表）。符合"用户拥有内容、Agent 拥有过程"与"show don't tell"。

## Risks / Trade-offs

- **[提示词做不到像素级锁死]** 图像模型非确定性，CJK 小字可能糊——full-page 的 header 只能"足够稳"（同区、尺寸相近、对齐一致），不能保证逐像素一致。→ **Mitigation**：保留 header-lock 作为"锁死+保证清晰"的唯一可靠兜底；把这个边界写进用户可见的能力说明，不静默假装 full-page 永远够。
- **[默认翻转改变既有行为]** 旧默认是"内容页→body+header-lock"。新默认 `full-page` 会让"无 frontmatter + 无显式 mode"的**新** deck 全走 full-page。→ **Mitigation**：VISUAL TYPE 派生保留为最低档兜底，仅对**已有**无 frontmatter 的 deck 生效；`--init` 播种 `render.default: full-page`，新老 deck 行为都可预期。文档里"80% body-lock / 20% full-page"旧描述需同步校准。
- **[full-page prompt 变长/模型忽略几何指令]** 注入几何契约可能被模型部分忽略。→ **Mitigation**：契约措辞借用现有 `systemHeaderContract` 的"ABSOLUTE"风格 + style_master 锚定；飘了走 header-lock 升级路径，不阻塞交付。
- **[frontmatter 解析引入新失败面]** 策略块拼错。→ **Mitigation**：解析失败按宪法出 JSON envelope（`ok/code/message/hint/where`）；未知 id、非法 mode 值 fail-loud 并列出问题页，绝不静默默认。

## Migration Plan

1. Stage 1 加 frontmatter `render:` 解析器（缺省即 `default: full-page`、空例外表）。
2. `determineRenderMode` 接入级联；扩展 `render_mode_source` 取值。
3. `assemblePrompt` full-page 分支注入 Header Placement 契约（复用 `visual_config` 几何）。
4. `--init` 模板在 `slide-specifications.md` 顶部播种注释版 `render:` 块（默认 full-page）。
5. 校准 BOOTSTRAP / AGENTS 的默认比例描述。
6. **回滚**：删除 frontmatter 解析 + 恢复 full-page 分支旧文案即可；旧 deck 因走 VISUAL TYPE 兜底不受影响。

## Open Questions

- Header Placement 契约的措辞细到什么程度（是否给到具体 px 坐标，还是"top-left header band, kicker 上/title 下/subtitle 再下"的相对描述更稳）？建议实现期用 1-2 页 pilot 对照两种措辞的稳定度再定。
- "飘了"的信号：先靠 agent 在 contact sheet 肉眼判断（最简、最透明）；是否需要轻量启发式检测留待验证真有必要再加，避免过度工程。
