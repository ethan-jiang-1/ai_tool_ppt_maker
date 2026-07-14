---
title: BOOTSTRAP — Agent Entry Point
stage: root
position: entrypoint
type: playbook
summary: Agent 的唯一入口。三步启动：环境验证 → 快速 intake → 开始构建。读这个文件就够了，AGENTS.md 是详细执行手册。
depends_on: []
feeds_into:
- AGENTS.md
- scripts/env-check.mjs
agent_action: read_first
---

# BOOTSTRAP — Agent 启动入口

> **如果你是 Agent**：这是启动入口。三步走完后读 [charter/AGENT_CONTRACT.md](charter/AGENT_CONTRACT.md)（11 条铁律，一页），再按需翻 [AGENTS.md](AGENTS.md) 的对应 Phase——不要每次通读 AGENTS。
>
> **如果你是人类**：把这段话贴给 Agent：「我想做一个 PPT，引导我。」Agent 会自动读这个文件并带你走完全程。

## 你的角色

你是 PPT 制作 orchestrator。**你拥有流程**（环境、文件、阶段、闸门）。**用户拥有内容判断**（隐喻对不对、颜色喜不喜欢、数据准不准）。

核心原则：**用户做选择题，你做创造性劳动。** 不要问用户"你的核心隐喻是什么"——你生成 2-3 个候选，让用户选。

用户不需要记刷新路径，直接用自然语言说改动即可。英文名称 Header Text & Style Refresh、Generated Image Rebuild、Notes-Only Refresh 和 Structural Versioning Path 是 Agent/维护者的稳定检索词；中文只作解释，旧字母别名只在兼容注册表和历史材料中保留。

### 视觉闸门前必须 Show（交互节律）

审 `style_master.jpg`、pilot contact sheet（及同类视觉 review）并请用户批准/继续之前，Agent **必须**用环境能力打开/展示真实文件。文件已在盘上时，**禁止**只用文字描述外观。pre-key 尚无图：可用 preset 说明或母版 prompt 降级展示；一旦出图，立刻升级为真图 show。

### 已有 deck / 断线回来？

用户指向已有 `deck_*`，或说「做到哪了 / 接着做 / 断线了 / 清了聊天继续」时：**先读盘，再 intake**。

1. `ppt_flow state <runDir>` + `ppt_flow status <runDir>`（执行指针 + 产物门闩）
2. 用人话报告整流程位置（优先卡上的 Summary / Next；不要只甩 playbook 文件名）
3. **扫描 `_lessons/`**：`node PPTMAKER_FRAMEWORK/scripts/lessons.mjs list <runDir>`，列出所有教训文件并总结关键发现
4. 加载 `_state.playbook`，从 `current_node` 续（`checkEntry`）
5. 确认「从这里接着做？」——用户明确要重开才绿场 intake

进度在 deck 磁盘（`_state` + `_generated` / status），**不在聊天记忆**。说法见 [COMMANDS.md](COMMANDS.md) **续跑 / 做到哪了**。

### 已有 deck / 素材要迁入？

不要当「特殊通道」跳过 show 与闸门。走 [COMMANDS.md](COMMANDS.md)「旁路 / 迁移」→ playbook `migrate-import`（方法论：`workflow/00-setup/05-migrate-import-existing-deck.md`）。全程遵守 AGENT_CONTRACT §11。

### 用户说「记住这个」——立即写教训

当用户说出以下短语（或类似表达），Agent **必须立即**将相关教训写入 `_lessons/`：

- "记住这个" / "记下来"
- "下回别忘了"
- "不容易总算调出来了"
- "太难了，好不容易修好"

**立即执行：** 用 `lessons.mjs add <runDir> --title "<slug>"` 建文件，或用编辑器直接写。按 `_lessons/README.md` 的四问格式（遇到什么？/ 怎么试的？/ 结论？/ 下次先看哪？）。不要只留在聊天里——换个 session 就丢了。

## ⚖️ 目录结构是宪法（不可临场发挥）

run bundle 的目录结构是这个框架的**宪法**。它的唯一事实源是
[`scripts/bundle_layout.mjs`](scripts/bundle_layout.mjs)——机器可读、脚本从它取路径。
（OpenSpec capability：**`run-bundle-layout`** — 不要和软包的 `framework-directory-layout` 混为一谈。）

- **不要临场发挥目录**。不要自创目录名、不要把生成物乱放。日常检查统一用 `ppt_flow.mjs status`；底层权威结构仍由 `bundle_layout.mjs` 定义。
- **找不到往哪放 → 先 GREP，再动手。** 对 `_scratch` / `_generated` / `style_master` / `contact_sheet` / `pilot` / `--run-dir` / `run bundle` 等词 `rg`，命中 [`reference/glossary.md`](reference/glossary.md) 的 **Where Map** 即规矩（term → path → role）。禁止自创 `_tmp/` 或把 bak 丢到 deck 根。
- **上严下松（structure gradient）：** `deck_*` **根最严**（只许宪法级条目）；越往下越松；本版临时/`.bak` **只**放 `3_versions/v{n}/_scratch/`——禁止堆在 deck 根或自创 `_tmp/`/`backup/`。
- **三层梯度:** `1_upstream_raw_material/`(原始素材·共享)+ `2_backbone/`(主干·共享)+ `3_versions/v{n}/`(slide 规格 + overrides + `_generated/` 派生 + `_scratch/` 本版临时)。另有 `_state/`（playbook 进度）、`_lessons/`（非密钥教训，先读再猜）。
- **宪法能执法:**管线每次运行前会自动跑 `bundle_layout.mjs --check`。Stage 2 的 readiness check 同时要求 `style_master.jpg` 和 metadata 中的 content/visual gates 已 `approved` 或明确 `waived`。刚 `--init` 完核结构用 `--structure-only`。
  ```bash
  node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs status deck_{NAME}/3_versions/v1
  ```

同理,**流程也别乱发挥**:严格按下面三步 + AGENTS.md 的固定 Phase 走,闸门不跳。

---

## Step 1: 环境验证（硬闸门 · 不过不许往下走）

**这是第一道硬闸门。** 先跑环境检测。**Node.js 18+ 和 npm 是 FOUNDATION——没配好就绝不进入 Step 2**，必须先把环境装好。

本框架生产管线是 **Node.js ESM only**（`@napi-rs/canvas`、`pptxgenjs`、框架内 Stage 2）。**禁止 Python / bash / 外部 skill 作为生产路径**（跨平台会断）。

```
# 推荐：统一入口
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor
```

判读输出：
- **`⛔ FOUNDATION NOT READY`**（Node.js 或 npm 缺失/过旧）→ 跳到下方同名 `###` 节，按指引修复。**装完重跑，仍不过就停在这里，绝不进 Step 2**
- **`✗ NOT READY`**（foundation 通过，但缺 API key / npm 依赖 / 框架内 Stage 2 脚本等硬依赖）→ 跳到对应 `###` 节修复后重跑
- **`△` 警告**（字体等可降级项）→ 建议修复但可继续
- **`✓ READY`** → 进入 Step 2

> 脚本退出码：任何硬失败都返回非 0，agent 可据此 gate。

### Agent 匹配规则

doctor 输出中每行失败带着 `check` 名称（如 `✗ nodejs`、`✗ api_key`）。**匹配 check 名 → 跳到下方同名 `###` 节 → 按用户 profile 选路径 → 告诉用户怎么修 → 重跑 doctor 验证。所有失败清零才进 Step 2。**

> 给人类读者的背景阅读：[00-zero-to-ready.md](workflow/00-setup/00-zero-to-ready.md)（概念说明）、[02-nodejs-environment.md](workflow/00-setup/02-nodejs-environment.md)（Node.js 环境参考）、[03-tool-selection.md](workflow/00-setup/03-tool-selection.md)（Image2 API 契约 SSOT）。**Agent 不需要读这些——下方各节已覆盖全部修复步骤。**

### nodejs

**doctor 输出**：`✗ nodejs: [FOUNDATION] fail — Node.js vN.x.x`

**如果你在用 Claude Code / Codex**：Node.js 应该已经装了。终端运行 `node --version` 确认版本 ≥ 18。如果版本 < 18，按下方平台升级。

**如果你没有 agent（裸机）**：先装 Node.js 18+ LTS。

**macOS / Linux：**
```bash
node --version          # 确认当前版本（需要 ≥ 18）
brew install node@20    # macOS 升级
# Linux: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
#        sudo apt-get install -y nodejs
```

**Windows：**
```powershell
node --version          # 确认当前版本（需要 ≥ 18）
winget install OpenJS.NodeJS.LTS
# 或从 https://nodejs.org 下载 LTS 安装包
```

**验证**：重跑 `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor`

### npm

**doctor 输出**：`✗ npm: [FOUNDATION] fail — not found`

npm 随 Node.js 一起发布。npm 缺失通常意味着 Node.js 安装不完整。

**如果你在用 Claude Code / Codex**：重装 Node.js（npm 随附其中），见上方 `### nodejs`。

**如果你没有 agent（裸机）**：从 https://nodejs.org 下载 LTS 安装包（npm 随附）。

**验证**：`npm --version` 应输出版本号，然后重跑 doctor。

### api_key

**doctor 输出**：`✗ api_key: fail — not set`

**所有用户**：需要一个 Image2 API key（出图用）。在 **repo 根** 或 **deck 根** 创建 `.env` 文件：

```
IMAGE2_API_KEY=sk-你的key
IMAGE2_BASE_URL=https://你的-relay/v1
```

> 两项都是必填——缺任一 doctor 都会 NOT READY。Base URL 没有静默默认值。

**如果你还没有 API key**：去 [platform.openai.com](https://platform.openai.com) → API keys → 创建一个。如果用中转服务，向服务商获取 URL + key。

**验证**：重跑 doctor → `api_key` 应变成 `✓`

### image_base_url

**doctor 输出**：`✗ image_base_url: fail — not set`

**所有用户**：在 `.env` 中设置 `IMAGE2_BASE_URL`（和 `api_key` 同一个文件）：
```
IMAGE2_BASE_URL=https://你的-relay/v1
```

**验证**：重跑 doctor → `image_base_url` 应变成 `✓`。如果 `api_key` 和 `image_base_url` 同时缺，一次创建 `.env` 写两行即可。

### @napi-rs/canvas

**doctor 输出**：`✗ @napi-rs/canvas: fail — not installed`

**所有用户**：三个 npm 包（`@napi-rs/canvas`、`pptxgenjs`、`commander`）由同一个 `npm install` 一次装完。如果这项失败，另外两项大概率也失败——**让用户跑一条命令即可**：

```bash
# 在 repo 根（有 package.json 的目录）运行
npm install
```

**验证**：重跑 doctor → 三个包应全部变 `✓`

### pptxgenjs

**doctor 输出**：`✗ pptxgenjs: fail — not installed`

同 `### @napi-rs/canvas`——跑 `npm install` 一次解决。

### commander

**doctor 输出**：`✗ commander: fail — not installed`

同 `### @napi-rs/canvas`——跑 `npm install` 一次解决。

### stage2_generator

**doctor 输出**：`✗ stage2_generator: fail — missing in-framework Stage 2 scripts`

**所有用户**：框架的三个脚本文件缺失。确认以下文件存在于 `PPTMAKER_FRAMEWORK/scripts/` 下：
- `stage2_generate_images.mjs`
- `make_contact_sheet.mjs`
- `image_api_client.mjs`

如果缺失，检查 git clone 是否完整：`cd` 到 repo 根，`git status` 看是否有未检出文件。

**验证**：重跑 doctor → `stage2_generator` 应变成 `✓`

### fonts

**doctor 输出**：`△ fonts: warn — Source Sans Pro not found`

这是**可降级警告**，不阻塞。Stage 3（Header-Lock 叠加标题）会使用系统 fallback sans-serif 字体。

如果想修复（可选）：把 `SourceSansPro-*.otf` 文件放到 `PPTMAKER_FRAMEWORK/scripts/fonts/` 下，或设环境变量 `PPT_FONT_DIR` 指向字体目录。

**Agent**：此警告不阻塞——告知用户后可以继续进入 Step 2。

### disk_space

**doctor 输出**：`△ disk_space: warn — N MB free`

这是**可降级警告**（阈值 200 MB）。生图管线需要磁盘空间存图片和 PPTX。如果空间紧张，建议清理后再继续。

**Agent**：此警告不阻塞——告知用户后可以继续进入 Step 2。

---

### 首次凭据：Image2（问一次，试通后落盘）

**没有 key+URL，Stage 2 生不了图，PPT 就做不出来。** doctor 缺任一项都会 **NOT READY**（无静默默认 endpoint）。

1. **问用户要** `IMAGE2_API_KEY` 和 `IMAGE2_BASE_URL`。两者都必填。
2. **写进 deck 根（优先）或 repo 根 `.env`**：
   ```
   IMAGE2_API_KEY=sk-...
   IMAGE2_BASE_URL=https://your-relay/v1
   ```
3. **重跑 doctor** → `api_key` 与 `image_base_url` 应都变 `✓`。
4. **廉价冒烟验证**（禁止首败甩锅）：
   ```bash
   node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor --smoke
   ```
   通过 → 继续。失败 → 提示用户换 `--base-url` 重试，或换一组 key/URL。
   **仍失败 → 指向 [03-tool-selection.md](workflow/00-setup/03-tool-selection.md) 的通道体检（`doctor --probe-vendors`），不要在首次安装时内联全套 probe 流程。**

> `.env` 有 Image2 凭据 → doctor 绿；真通不通靠冒烟。**密钥只写 `.env`**（不进 `_lessons/`、不进聊天记录）。更多 API 契约细节 → [03-tool-selection.md](workflow/00-setup/03-tool-selection.md)。
>
> **`_lessons/` 教训机制（Agent 必读）**：`deck_*/_lessons/` 是本项目的**自留教训目录**——Agent 遇事自己克服后，把非密钥的经验写进去，下次（或另一个 Agent）进 deck 时先读再猜，不用重复踩坑。
>
> **每次进已有 deck 时**：先扫 `_lessons/`。若有 `image2-proven.yaml`，优先用它猜 endpoint（避免重复试错）。
>
> **什么写进 `_lessons/`**：任何 Agent 自己摸索出来的、下次有用的经验。比如：哪家 API 通了（`image2-proven.yaml`，**无 key**）、哪个参数组合有效、某个报错的 workaround、字体渲染的注意事项。**不写密钥，不写 `_state/` 进度。**
>
> **禁止**：经验只留聊天记录（换个 session 就丢了）；密钥进 `_lessons/`（安全红线）。

### Stage 2 在框架内（无 skill）

Stage 2 / style-master / contact sheet 全部是 `PPTMAKER_FRAMEWORK/scripts/` 下的 Node 模块（`stage2_generate_images.mjs`、`image_api_client.mjs`、`make_contact_sheet.mjs`）。doctor 的 `stage2_generator` 检查这些文件是否存在——**不要求、不搜索** `.claude/skills`。

> **包**：在 **repo 根**（有 `package.json` 的地方）跑一次 `npm install`，装上 `@napi-rs/canvas` / `pptxgenjs` / `commander`——env-check 随后会显示 `✓`。

---

## Step 2: 快速 Intake（问 5 个问题，一次性问完）

用以下脚本收集信息。**一次性问完，不要让用户反复回答。** 带预设选项——用户只需选或给简短回答。

```
好的，环境就绪。让我快速了解你的需求（5 个问题）：

1. 这是什么类型的 PPT？
   A. 融资 Pitch Deck（给投资人看）
   B. 战略 Keynote（给管理层/团队看）
   C. 培训/教学（给学员看）
   D. 研究报告/汇报（给决策者看）
   E. 其他（请描述）

2. 听众是谁？他们的角色和 seniority？
   （例：VC 合伙人 / 公司管理层 / 部门负责人 / 新员工）

3. 多长时间？
   A. 10-15 分钟（pitch 节奏，10-14 页）
   B. 30-40 分钟（keynote 节奏，15-20 页）
   C. 60 分钟以上（深度分享，20-30 页）

4. Slides 用什么语言？演讲用什么语言？
   （例：slides 英文，演讲中文 / 两者都是中文）

5. 你最想让听众记住的**一件事**是什么？
   （一句话——这是整个 deck 的北极星）
```

**如果用户在第 1 题选了 A/B/C/D**，你心里就有了 deck type 和对应的模板。不用问"你要几页"——根据类型和时长自动判断。

**如果用户在第 5 题回答 vague**（如"我们公司很厉害"），追问一次："如果听众只记住一句话就离开，你希望那句话是什么？"

**如果用户在任何题说"不知道"**：
- 第 1 题（类型）→ 根据 topic 推荐："听你说的是 X，我建议用 B（战略 Keynote），你觉得呢？"
- 第 2 题（听众）→ 追问："谁会决定买不买你的产品/批准你的预算？"
- 第 3 题（时长）→ 默认 B（30-40 分钟）
- 第 5 题（记住什么）→ 这个不能代答。追问："如果竞争对手也在场，你最想证明什么？"

---

## Step 3: 匹配预设 + 开始构建

基于 Intake 答案，完成五个相互依赖的决策，然后告诉用户你的建议：

### 3.1 选择 Deck Type Template

| 用户选了 | `--deck-type` | 使用模板 | 页数 |
|---------|---------------|---------|------|
| A. Pitch Deck | `pitch` | `workflow/02-content/presets/deck-type-templates/pitch-deck-template.md` | 10-14 |
| B. Keynote | `keynote` | `workflow/02-content/presets/deck-type-templates/keynote-template.md` | 15-20 |
| C. Training | `training` | `workflow/02-content/presets/deck-type-templates/training-template.md` | 12-18 |
| D. Report | `report` | `workflow/02-content/presets/deck-type-templates/report-template.md` | 10-14 |
| E. Other | `keynote` | 从 B（keynote）开始，按需调整 | — |

> `--init --deck-type <值>` 会把对应模板自动铺成 `slide-specifications.md`，不用手动 `cp`。

### 3.2 确认叙事弧线（不是"另选一条"）

你在 3.1 选的 deck-type 模板**已经内置了一条叙事弧线**（它的 Block Map）。这一步是**对照 `workflow/02-content/presets/block-arc-catalog.md` 理解并向用户确认**这条弧线的形状与论证功能——**以模板的 Block Map 为准**。只有在**不用模板**、或要刻意重构结构时，才从 catalog 换一条弧线。不要"用了模板又照 catalog 另选一条弧线"（两套结构打架的老坑）。

### 3.3 生成隐喻与公式候选

基于用户的 topic 和第 5 题（记住什么），参考 `workflow/02-content/presets/metaphor-catalog.md` 做模式匹配，生成 2-3 个候选。每个候选包含：
- 隐喻名称和一句话描述
- 核心 tension（什么信念错了？什么后果？）
- 核心公式（A + B = C）

告诉用户你的推荐和原因。用户确认后，再决定用什么视觉媒介表达这个故事。

### 3.4 先锁定视觉 Medium

**Medium before color。** 在看颜色和 preset 之前，基于 topic、产品形态、隐喻和听众，给用户 2-3 个画风候选：
- sketch / etching
- flat diagram / data visualization
- photography
- 3D render
- mixed

描述每种画风“画出来是什么样、为什么适合/不适合”，让用户选择。用户锁定 medium 后，才能进入视觉 preset。

### 3.5 选择视觉预设

从 `workflow/01-visual/presets/` 中筛选 2-3 个与已锁定 medium 匹配的候选。**描述每种的外观和适合场景**，让用户选一个。如果没有任何 preset 匹配（如用户选 etching），进入 Expert Mode 自定义视觉系统。

可用的 5 个预设：
| # | 预设名称 | `--style` | 外观 | 适合场景 |
|---|---------|-----------|------|---------|
| 1 | **Dark Executive** | `dark-executive` | 深海军蓝底，青蓝/电光蓝强调 | 战略 keynote、高管汇报、制造业/科技 |
| 2 | **Clean Clinical** | `clean-clinical` | 白底，石板灰，青绿 data accent | 医疗、咨询报告、数据驱动型 |
| 3 | **Warm Editorial** | `warm-editorial` | 奶油底，炭黑，铁锈红强调 | 品牌故事、人文话题、设计/创意行业 |
| 4 | **Tech Startup** | `tech-startup` | 深紫底，霓虹青/品红 | 融资 pitch、产品发布、年轻受众 |
| 5 | **Corporate Safe** | `corporate-safe` | 白底，企业蓝，灰色系 | 保守行业、正式场合、跨国企业 |

> `--init --style <值>` 会把对应 preset 的 `deck_system.txt` + `color_palette.json` 自动铺进 `2_backbone/visual-style/`，不用手动 `cp`（`style_master.jpg` 仍需 Phase 2 生成）。

选择原则：
- 听众是 executive/board → Dark Executive 或 Corporate Safe
- 听众是 investor → Tech Startup 或 Dark Executive
- 听众是 general audience/trainee → Clean Clinical 或 Warm Editorial
- 行业保守（金融/政府/制造）→ Corporate Safe 或 Dark Executive
- 行业创新（科技/设计/消费）→ Tech Startup 或 Warm Editorial

---

## 正式构建：先锁铁律，再按 Phase 翻 AGENTS

用户确认了 deck type、叙事弧线、隐喻、公式、视觉 medium 和视觉预设后：

1. **先读** [charter/AGENT_CONTRACT.md](charter/AGENT_CONTRACT.md)（11 条，不可违反）
2. **再按当前 Phase** 打开 [AGENTS.md](AGENTS.md) 对应章节——不要整本通读

你现在已经完成了 Phase 0 的大部分工作——有了 metadata、内容方向、视觉方向。按 AGENTS.md 的 Phase 0-3 走，但注意：

1. **Phase 0 简化为**:一条 `ppt_flow.mjs init` 命令搭好整个骨架**并把选中的 preset 播种到位**(**不要手动 mkdir、不要手动 cp**),再填 metadata:
   ```bash
   node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs init deck_{NAME} \
     --deck-type {keynote|pitch|report|training} --style {preset-slug}
   ```
   它建好三层结构、每个目录放大白话 README、铺好内容模板、**把 deck-type 模板铺成 `slide-specifications.md`、把视觉 preset 的 `deck_system.txt` + `color_palette.json` 铺进 `2_backbone/visual-style/`**、写好完整 deck-guide.md + CLAUDE.md + project-metadata.yaml。`_generated/` 的空壳与 README 会预建，真实管线产物在首次运行时生成。`{preset-slug}` 是 3.5 表里的 `--style` 值。**不要再手敲 cp**——播种由 `--init` 确定性完成。
2. **Phase 1 简化为**：隐喻/公式写进 `2_backbone/core-metaphor.md` + `core-formula.md`；deck-type 模板已由 `--init` 铺成 `3_versions/v1/slide-specifications.md`,填真实内容,让用户审核关键 claim。
3. **Phase 2 简化为**：视觉 preset 的 `deck_system.txt` + `color_palette.json` 已由 `--init --style` 铺进 `2_backbone/visual-style/`;只剩 `style_master.jpg` 需生成(preset 不含预生成图),把它的 prompt 存为 `style-master-prompt.md` 再生成。
4. **Phase 3**：先用计划 production profile 跑 `ppt_flow.mjs pilot`，open contact sheet 审查后执行 `ppt_flow.mjs approve <run-dir> header`，最后用同 profile `ppt_flow.mjs build <run-dir> --reuse-images`。1K evidence 不授权 2K。
5. **Phase 4（迭代）**：交付后用户提改动时，参考 [workflow/05-iteration/README.md](workflow/05-iteration/README.md) 和 [scripts/change-classifier.md](scripts/change-classifier.md) 做最小重跑。改 slide = 下游；改隐喻/视觉主干 = 改 `2_backbone/`（影响全版本）。

---

## 快速参考：文件路径

| 你需要什么 | 去哪里 |
|-----------|--------|
| **目录结构（宪法·SSOT）** | `scripts/bundle_layout.mjs`（跑它看树 / `--check` 校验） |
| **日常执行入口** | `scripts/ppt_flow.mjs`（doctor / status / approve / pilot / build / refresh） |
| 目录结构（人读镜像） | `charter/CONSTITUTION.md` |
| Deck type 模板 | `workflow/02-content/presets/deck-type-templates/` |
| 叙事弧线 catalog | `workflow/02-content/presets/block-arc-catalog.md` |
| 隐喻 catalog | `workflow/02-content/presets/metaphor-catalog.md` |
| 公式 catalog | `workflow/02-content/presets/formula-catalog.md` |
| 视觉预设 | `workflow/01-visual/presets/` |
| 完整执行流程（铁律一页） | `charter/AGENT_CONTRACT.md` |
| Phase 详解 | `AGENTS.md`（按需翻） |
| 环境检测 | `scripts/ppt_flow.mjs doctor`（或 `scripts/env-check.mjs`） |
| 术语解释 | `reference/glossary.md` |
| 常见错误 | `reference/anti-patterns.md` |
| 人类 Quick Start | `reference/quick-start.md` |

---

## 已知限制（Agent 需告知用户）

- **Slides 是整页图片（设计选择，不是缺陷）**：PPTX 每页是一张完整图片——视觉表达优先于 PowerPoint 内编辑。要改文字/画面，回到源 markdown，按内容所有权选择 Header Text & Style Refresh（~5 min）或 Generated Image Rebuild（~5 min/页）。不要尝试在 PowerPoint 里改文本框。
- **新 deck 默认 full-page**：`--init` 会在 slide specs frontmatter 写入 `render.default: full-page`。full-page header 的位置与清晰度是图像模型的尽力保证；需要像素精度或稳定清晰度时，把页升级到 `render.header-lock`。没有顶层 `render` 的旧 deck 保持 VISUAL TYPE 派生；`render` 内 typo 会报错，顶层 `renders:` 不会被猜测纠正，排障看 `render_mode_source`。
- **中文 slides 支持受限**：预设的 `deck_system.txt` 默认英文。如需中文 slides，Agent 需改 `deck_system.txt` LANGUAGE 规则，并将 Stage 3 字体切换为 Noto Sans CJK（见 `scripts/fonts/README.md`）。
- **自定义 Logo**：所有预设默认无 logo。如需添加，Agent 需在每个 slide 的 IMAGE PROMPT 中描述 logo 的位置和大小，并编辑 `deck_system.txt` 的 FORBIDDEN 规则。
- **如果不喜欢 5 个预设**：告诉 Agent "我想自定义风格"，Agent 会切换到 Expert Mode（Phase 2 的完整视觉系统设计流程）。

## 铁律

完整 11 条见 [charter/AGENT_CONTRACT.md](charter/AGENT_CONTRACT.md)。这里只重复最容易漂的几条：

1. **用户做选择题，你做创造性劳动。** 不要问"你的隐喻是什么"——生成 2-3 个候选。
2. **闸门不可跳过。** 每个 Phase 结束等用户确认。
3. **源文件是 SSOT。** 改 `2_backbone/` 或 `slide-specifications.md`，绝不手改 `_generated/`。
4. **目录是宪法。** `bundle_layout.mjs` 定义结构；不自创目录。
5. **Show, don't tell。** 视觉/pilot gate 前必须 `open` 实物（见上节与 CONTRACT §11）。
