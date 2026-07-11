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
- header-lock 改为**一等的、按需启用**的硬兜底（某页真飘时用户抱怨才加进例外表），不是罕见 escape hatch；他认定的事我们核实后消化成内部 `layout_contract`。
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
每页显式 RENDER MODE  >  deck header-lock 例外表  >  hero 类型守卫  >  deck default(=full-page)  >  VISUAL TYPE 派生(旧 deck 兜底)
```
- **为什么**：一条确定性规则覆盖用户全部诉求——"全 full-page"（default）、"全 body-lock"（default 翻转）、"全 X 除了几页"（例外表）、"这一页我说了算"（显式）。**hero 类型守卫**保证 `default: body+header-lock` 也不会把封面/分隔/结尾强行锁头（除非显式/例外表点名）。VISUAL TYPE 派生保留在最低档，只为无 frontmatter 的旧 deck 兜底，**向后兼容**。
- **可追溯**：`layout_contract.render_mode_source` 扩展为 `explicit` / `policy:exception` / `derived:hero_type` / `policy:default` / `derived:visual_type`，每个决策都能回溯到来源。

### 3. full-page 与 header-lock 共用同一套 header 几何，区别只是"软约束 vs 硬叠加"
- **软约束（content full-page）**：Stage 1 从 `color_palette.json` header 几何 + 结构化 kicker/headline/subtitle，拼一段 **Header Placement 契约**注入 full-page prompt（位置/字号/对齐 + 文字），取代作者散文手写。空/占位字段跳过。
- **硬叠加（header-lock）**：Stage 3 用**同一套**几何脚本画字（现状不变）。
- **hero 例外**：`Title/Opener`、`Section Divider/Bridge`、`Closer` 这些 full-page 页**不套固定 band**——标题即构图，保持自由。契约只作用于内容型 full-page。
- **"往哪放"的口径**：用户说的"title/subtitle/kicker 往哪放"落成 **deck 级一致的 header band**（来自 `color_palette.json`），**不做逐页自由摆放**——换取跨页一致。若确需逐页自由摆位，属另一个设计，不在本 change。
- **为什么**：切换某页 content full-page↔header-lock **header 落点语义不变**，只是"请 AI 画在这"↔"AI 别画、脚本画在这"；这让"飘了就锁"成为无缝**语义**升级路径（操作上仍需重生图，见 Risks 的 Chain B）。这是本设计最关键的统一点。

### 4. Agent 主动发现、用户拍板
- Agent 可在 contact sheet 视觉闸门指出明显漂移并建议"锁这页"，但**绝不替用户预先配置**——启用 header-lock 永远是用户/或用户点头的动作（加进例外表）。符合"用户拥有内容、Agent 拥有过程"与"show don't tell"。

### 5. 默认翻转带验收 gate（安全网，不改默认）
- **选择**：`--init` 对**所有 deck-type 一致**播种 `render.default: full-page`（尊重用户"小白默认 full-page"）。安全网不是改默认，而是把 header 稳定度设成 **pilot 阶段的显式验收 checkpoint**：pilot 一旦显示 header 漂移，agent 显式提示并对漂移页建议启用 header-lock（Decision 4），绝不静默放行。
- **为什么**：默认翻转是把"脚本保证清晰"换成"提示词也许稳"（见 Risks）。安全网必须落在"被看见 + 一键补救"，而不是偷偷给某些 deck-type 换默认——那会违背用户明确的 full-page 默认（本 change 的动因 deck 就是 keynote）。
- **备选**：内容密集 deck-type 直接播种 header-lock 默认——否决，违背用户"默认 full-page、小白什么都不管"的明确决定。

## Risks / Trade-offs

- **[提示词做不到像素级锁死]** 图像模型非确定性，CJK 小字可能糊——full-page 的 header 只能"足够稳"（同区、尺寸相近、对齐一致），不能保证逐像素一致。→ **Mitigation**：保留 header-lock 作为"锁死+保证清晰"的唯一可靠兜底；把这个边界写进用户可见的能力说明，不静默假装 full-page 永远够。
- **[默认翻转 = 质量赌注 + 改变既有行为]** 新默认 `full-page` 把"脚本保证清晰"换成"提示词也许稳"，反转了框架"~80% body-lock"原则；无网翻转会让文字密集 deck 的默认产物变糊/飘。且旧默认"内容页→body+header-lock"改变。→ **Mitigation**：(1) **验收 gate**——header 稳定度设为 pilot 显式 checkpoint（Decision 5）；(2) **agent 复核**——pilot 见漂移即提示并对漂移页建议 header-lock（不改默认、不静默）；(3) VISUAL TYPE 派生保留为最低档兜底，仅对**已有**无 frontmatter 的 deck 生效，新老 deck 行为可预期；(4) 文档"80% body-lock / 20% full-page"旧描述同步校准。
- **[升级 header-lock 非零成本 = Chain B]** 把某页从 full-page 切到 header-lock，body prompt 从"render all text"变成"预留顶部带、别画 header"，该页图**必须重生成**（编辑链 B，`--force-images`），不是只重跑 Stage 3。→ **Mitigation**：把这归类写进 change-classifier 与用户话术；"切换零心智负担"只指 header 落点语义不变，绝不宣称零操作成本。
- **[full-page prompt 变长/模型忽略几何指令]** 注入几何契约可能被模型部分忽略。→ **Mitigation**：契约措辞借用现有 `systemHeaderContract` 的"ABSOLUTE"风格 + style_master 锚定；飘了走 header-lock 升级路径，不阻塞交付。
- **[frontmatter 解析引入新失败面]** 策略块拼错。→ **Mitigation**：解析失败按宪法出 JSON envelope（`ok/code/message/hint/where`）；未知 id、非法 mode 值 fail-loud 并列出问题页，绝不静默默认。

## Migration Plan

1. Stage 1 加 frontmatter `render:` 解析器（缺省即 `default: full-page`、空例外表）。
2. `determineRenderMode` 接入级联（含 **hero 类型守卫**：opener/divider/closer 即便 `default: body+header-lock` 也留 full-page 自由构图）；扩展 `render_mode_source` 取值（新增 `derived:hero_type`）。
3. `assemblePrompt` full-page 分支注入 Header Placement 契约（复用 `visual_config` 几何）。
4. `--init` 模板在 `slide-specifications.md` 顶部播种注释版 `render:` 块（默认 full-page）。
5. 校准 BOOTSTRAP / AGENTS 的默认比例描述。
6. **回滚**：删除 frontmatter 解析 + 恢复 full-page 分支旧文案即可；旧 deck 因走 VISUAL TYPE 兜底不受影响。

## Open Questions

- Header Placement 契约的措辞细到什么程度（是否给到具体 px 坐标，还是"top-left header band, kicker 上/title 下/subtitle 再下"的相对描述更稳）？建议实现期用 1-2 页 pilot 对照两种措辞的稳定度再定。
- "飘了"的信号：先靠 agent 在 contact sheet 肉眼判断（最简、最透明）；是否需要轻量启发式检测留待验证真有必要再加，避免过度工程。
