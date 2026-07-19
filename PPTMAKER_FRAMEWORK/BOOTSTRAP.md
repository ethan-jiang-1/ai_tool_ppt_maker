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

## Step 1: 环境验证（默认本地硬闸门）

统一入口只有一个：

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor
```

默认 doctor 是离线 base readiness：Node/npm、四个 repo 依赖、配对 Chromium、framework 内置 WOFF2 字体、固定 HTML runtime smoke，以及现有本地/警告检查。它不要求 Image2 key/URL，也不产生 provider submit。`FOUNDATION NOT READY` 或 base `NOT READY` 时停在 Step 1；只有警告时可以继续。

本框架是 Node.js ESM only。可执行 profile 支持 `22.x`、`24.x`、`26.x`；新安装推荐当前 LTS `24.x`。`package.json` 的 `>=22` 不代表 23/25 等未验证 major 受支持。

### Agent 匹配规则

匹配 doctor 的稳定 check 名到下面同名标题，合并重复修复。例如四个 npm 包同时缺失时，只让用户运行一次 `npm install`。修复后重跑相同模式；base READY 后才进入 Step 2。背景参考：[00-zero-to-ready.md](workflow/00-setup/00-zero-to-ready.md)、[02-nodejs-environment.md](workflow/00-setup/02-nodejs-environment.md)、[03-tool-selection.md](workflow/00-setup/03-tool-selection.md)。

### nodejs

先运行 `node --version`，不要假设 coding agent 自带的 runtime 符合本 framework。版本必须属于 22、24、26；新安装或升级优先 24.x。

macOS：

```bash
brew install node@24
node --version
```

Linux（Debian/Ubuntu 裸机）：

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
```

其它发行版从 https://nodejs.org 的 24.x 下载页或对应发行版仓库安装。Windows PowerShell：

```powershell
winget install OpenJS.NodeJS.LTS
node --version
```

若当前 LTS 已不是 24.x，按 nodejs.org 的 24.x 下载页安装本 profile 指定版本，不要自动采用未验证 major。coding-agent 用户和裸机用户使用同一版本判断；区别只是前者先验证现有安装。

### npm

npm 随 Node.js 提供。`npm --version` 不可用时，按 `### nodejs` 修复完整 Node 安装。

### @napi-rs/canvas

在 repo 根（`package.json` 所在目录）运行一次：

```bash
npm install
```

同一命令修复 `@napi-rs/canvas`、`pptxgenjs`、`commander` 和精确的 `playwright@1.61.1`；不要逐包安装。

### pptxgenjs

同 `### @napi-rs/canvas`，合并为一次 repo-root `npm install`。

### commander

同 `### @napi-rs/canvas`，合并为一次 repo-root `npm install`。

### playwright

同 `### @napi-rs/canvas`。若版本不等于 `1.61.1`，用 repo-root `npm install` 恢复 package/lock 对齐，不要手动选择另一个 Playwright 版本。

### chromium

Playwright 库与浏览器是两步安装。repo-root `npm install` 后运行：

```bash
npm run setup:chromium
```

Linux/CI 仅在明确允许安装系统依赖时用 `npm run setup:chromium:with-deps`。doctor 只检查并启动已安装的配对 Chromium，绝不自动安装、联网下载或回退到系统 Chrome/Edge。自定义 cache/proxy 见 [02-nodejs-environment.md](workflow/00-setup/02-nodejs-environment.md)。

### echarts

HTML-first 图表 SSR 需要直接依赖 `echarts@6.1.0`，并锁定其传递依赖 `zrender@6.1.0`。该检查是 base READY 的硬门槛；不要在 deck 或环境中安装另一个版本，也不要用浏览器端 ECharts、CDN 或系统全局包替代。修复方式是在 package.json 所在的项目根运行一次：

```bash
npm install
```

doctor 会从当前目录向上找到 canonical package root/version，并把这份发现结果交给 HTML runtime；它不会联网下载或静默选择 shadow package。生产 HTML 图表使用 Node-side SVG SSR，浏览器页不加载 ECharts runtime。依赖许可证分别为 Apache-2.0（ECharts）和 BSD-3-Clause（zrender），证据见 `PPTMAKER_FRAMEWORK/scripts/contracts/html-echarts-runtime-evidence-v1.json`。

### html_fonts

HTML runtime 的 Source Sans 3 与 Noto Sans SC WOFF2、CSS、inventory 和许可证已经随 framework 放在 `PPTMAKER_FRAMEWORK/scripts/fonts/`。用户不安装系统字体，也不需要联网下载字体。失败时恢复完整的 `PPTMAKER_FRAMEWORK` 包；不要用系统字体掩盖缺失或 digest 错误。

### html_runtime_smoke

先修复 `playwright`、`chromium` 和 `html_fonts`，再重跑默认 doctor。该 smoke 使用固定本地 HTML、固定双语 sentinel 和零网络 Chromium；它不下载任何资源，也不声称任意实际 deck 已完成字符覆盖或 overflow 检查。生产捕获使用同一配对 runtime 的 `1000 x 562.5` CSS 画布、DSF 2；当前 Chromium 原生 fractional clip 的实测输出为 `2000 x 1126`，因此必须执行已验证的 `fast-png` 固定末行裁剪重编码得到精确 `2000 x 1125`，不得用系统浏览器、rounding 或不稳定 raw bytes 替代。证据见 `PPTMAKER_FRAMEWORK/scripts/contracts/html-capture-runtime-evidence-v1.json`。

### git

**doctor 输出**：`△ git: ...`。Git 对做 PPT **可选但推荐**：它可以为用户自己选择的源文件提供审计和比较；它不替代可见的 `vN` 与 Structural Versioning Path，也不是继续生产的门槛。Git-only 警告出现时，只要其它硬检查已通过，仍可进入 Step 2。

doctor 只观察**本次调用所在目录**，不会打印该目录路径；它不能证明未来创建或另一个位置的 deck 已受保护。`not confirmed as a worktree` 表示当前目录没有得到正向确认；`no verifiable Git history checkpoint` 常见于尚无首次提交的新仓库。两者都不是修 doctor 的任务，也不需要先创建提交。

**如果你在用 Claude Code / Codex**：先验证，不要假设：

```bash
git --version
```

没有 Git 也可以继续做 deck；只有用户想要源文件历史时，再按其平台安装。

**macOS：**

```bash
git --version
xcode-select --install
# 或：brew install git
```

**Linux：**

```bash
git --version
sudo apt-get install -y git
# Fedora/RHEL 可用：sudo dnf install -y git
```

**Windows PowerShell：**

```powershell
git --version
winget install --id Git.Git -e
git --version
```

若用户希望为某个 deck 使用 Git，先由用户指出并明确确认**包含所需 source/control 文件的项目根**。如需检查该目标根是否已在一个 worktree 内，Agent 必须先获得用户对“检查这个目标根”的单独明确授权；doctor 的当前目录结果不能代替它。已有祖先 worktree 时不得嵌套 `git init`；绝不在 `_generated/` 或单个 `3_versions/vN/` 叶目录初始化。任何 `git init`、add、commit、push 或其他 Git 操作都仍需用户对命名操作和范围的明确授权。

**Checkpoint 提醒（Agent）**：一次连续的 source-work episode 是当前 interaction 中为一个 deck 做的连续实质 source 工作。已知发生真实作者工作后、Agent 即将做重要结构 source 改动前、validated vNext 后或交付/归档时，最多给一次简短的可选提醒：“要不要把这次源文件工作保存到你自己的 Git 历史里？” 用户拒绝或暂缓后，本 episode 内不再提醒。提醒不是授权，也不允许隐藏地检查 cleanliness。

普通“做个 checkpoint”的同意不授权 `git status`、`git diff` 或其它检查。只有用户明确给出一个命名 Git 操作和其范围后，Agent 才能复述该操作与范围，并只协助这一个操作；不得根据隐藏检查推断文件、暂存状态或效果。默认禁止自动 init/add/commit/push/pull、改 remote、restore/reset/checkout/clean 或丢弃改动；也绝不把 clean worktree 当作 deck workflow 的门槛。

### fonts

**doctor 输出**：`△ fonts: warn — Source Sans Pro not found`

这是**可降级警告**，不阻塞。Stage 3（Header-Lock 叠加标题）会使用系统 fallback sans-serif 字体。

如果想修复（可选）：把 `SourceSansPro-*.otf` 文件放到 `PPTMAKER_FRAMEWORK/scripts/fonts/` 下，或设环境变量 `PPT_FONT_DIR` 指向字体目录。

**Agent**：此警告不阻塞——告知用户后可以继续进入 Step 2。

### disk_space

**doctor 输出**：`△ disk_space: warn — N MB free`

这是**可降级警告**（阈值 200 MB）。生图管线需要磁盘空间存图片和 PPTX。如果空间紧张，建议清理后再继续。

**Agent**：此警告不阻塞——告知用户后可以继续进入 Step 2。

## 可选 Image2 checks（只保护远程出图动作）

### stage2_generator

**仅可选 Image2 模式输出**：`✗ stage2_generator: fail — missing in-framework Stage 2 scripts`

确认以下文件存在于 `PPTMAKER_FRAMEWORK/scripts/` 下：
- `stage2_generate_images.mjs`
- `make_contact_sheet.mjs`
- `image_api_client.mjs`

如果缺失，恢复完整的 framework 文件；不要用外部 skill 替代。验证时重跑 `doctor --image2`。

默认 base READY 不需要 Image2。只有用户选择 legacy Image2 远程动作时，才配置 key/URL；Image2 NOT READY 只阻塞该远程动作，不阻塞本地工作。

### api_key

在 deck 根（优先）或 repo 根 `.env` 写 `IMAGE2_API_KEY`。密钥不进聊天或 `_lessons/`。

### image_base_url

在同一 `.env` 写非空 `IMAGE2_BASE_URL`；没有静默默认 endpoint。

### image_smoke

`doctor --smoke` 是 live probe，会向第一个 resolved vendor **提交 1 次**。Agent 必须先披露这 1 次可能计费的 submit，并得到用户明确确认；用户拒绝时调用为零。成功只证明通道可用，不批准 build、style-master 或后续页面工作。

### image_probe_vendors

先用离线 `doctor --image2` 得到 resolved vendor count。`doctor --probe-vendors` 对每个 entry **恰好提交 1 次**；Agent 必须先说出总次数并得到确认。它与 `--smoke` 互斥，成功也不产生生产授权。

### 首次凭据：Image2（可选）

1. **问用户要** `IMAGE2_API_KEY` 和 `IMAGE2_BASE_URL`。两者都必填。
2. **写进 deck 根（优先）或 repo 根 `.env`**：
   ```
   IMAGE2_API_KEY=sk-...
   IMAGE2_BASE_URL=https://your-relay/v1
   ```
3. **离线验证 presence**（不产生 provider submit）：
   ```bash
   node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor --image2
   ```
4. 只有需要 live diagnosis 时，先说明“将向第一家提交 1 次，可能计费”，取得明确确认后才运行：
   ```bash
   node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor --smoke
   ```
   失败时指向 [03-tool-selection.md](workflow/00-setup/03-tool-selection.md) 与 `probe-image-channels`；不要用 style-master 充当诊断。

> `.env` presence 由 `doctor --image2` 离线验证；真通不通只能由用户确认后的 live probe 验证。**密钥只写 `.env`**。probe 成功不等于用户批准生产。
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

> **包**：repo-root `npm install` 一次安装四个依赖；随后 `npm run setup:chromium` 安装配对浏览器。内置 HTML WOFF2 字体随 framework 提供，不复制进 run bundle。

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
