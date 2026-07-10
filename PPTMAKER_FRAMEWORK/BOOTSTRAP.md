---
title: BOOTSTRAP — Agent Entry Point
stage: root
position: entrypoint
type: playbook
summary: Agent 的唯一入口。三步启动：环境验证 → 快速 intake → 开始构建。读这个文件就够了，AGENTS.md 是详细执行手册。
depends_on: []
feeds_into:
- AGENTS.md
- 00_project_setup/00-auto-env-check.py
agent_action: read_first
---

# BOOTSTRAP — Agent 启动入口

> **如果你是 Agent**：这是启动入口。三步走完后读 [AGENT_CONTRACT.md](AGENT_CONTRACT.md)（10 条铁律，一页），再按需翻 [AGENTS.md](AGENTS.md) 的对应 Phase——不要每次通读 AGENTS。
>
> **如果你是人类**：把这段话贴给 Agent：「我想做一个 PPT，引导我。」Agent 会自动读这个文件并带你走完全程。

## 你的角色

你是 PPT 制作 orchestrator。**你拥有流程**（环境、文件、阶段、闸门）。**用户拥有内容判断**（隐喻对不对、颜色喜不喜欢、数据准不准）。

核心原则：**用户做选择题，你做创造性劳动。** 不要问用户"你的核心隐喻是什么"——你生成 2-3 个候选，让用户选。

## ⚖️ 目录结构是宪法（不可临场发挥）

run bundle 的目录结构是这个框架的**宪法**。它的唯一事实源是
[`06_reference_scripts/bundle_layout.py`](06_reference_scripts/bundle_layout.py)——机器可读、脚本从它取路径。

- **不要临场发挥目录**。不要自创目录名、不要把生成物乱放。日常检查统一用 `ppt_flow.py status`；底层权威结构仍由 `bundle_layout.py` 定义。
- **三层梯度**:`1_upstream_raw_material/`(原始素材·共享)+ `2_backbone/`(主干:隐喻/公式/约束/大纲/讲稿/视觉·共享)+ `3_versions/v{n}/`(每版:slide 规格 + overrides + `_generated/` 派生品)。
- **宪法能执法**:管线每次运行前会自动跑 `bundle_layout.py --check`。Stage 2 的 readiness check 同时要求 `style_master.jpg` 和 metadata 中的 content/visual gates 已 `approved` 或明确 `waived`。刚 `--init` 完核结构用 `--structure-only`。
  ```bash
  uv run python PPTMAKER_FRAMEWORK/06_reference_scripts/ppt_flow.py status deck_{NAME}/3_versions/v1
  ```

同理,**流程也别乱发挥**:严格按下面三步 + AGENTS.md 的固定 Phase 走,闸门不跳。

---

## Step 1: 环境验证（硬闸门 · 不过不许往下走）

**这是第一道硬闸门。** 先跑环境检测。**Python 3.11+ 和 UV 是 FOUNDATION——没配好就绝不进入 Step 2**，必须先把环境装好。

**用裸解释器跑，别用 `uv run`**——这个脚本本身就是来检查 uv 在不在的，还没确认 uv 存在就用 `uv run` 会自相矛盾。脚本是零依赖（只用标准库），任何 Python 都能跑：

```bash
# macOS / Linux
python3 PPTMAKER_FRAMEWORK/00_project_setup/00-auto-env-check.py

# Windows（PowerShell 或 cmd）
python  PPTMAKER_FRAMEWORK\00_project_setup\00-auto-env-check.py
```
（Windows 上若 `python` 不识别，试 `py`。）

判读输出：
- **`⛔ FOUNDATION NOT READY`**（Python 或 UV 缺失/过旧）→ 按脚本给的 `→` 安装指引（已按 macOS/Windows 分平台）引导用户装好，**装完重跑，仍不过就停在这里,绝不进 Step 2**。
- **`✗ NOT READY`**（foundation 通过，但缺 API key / pptx / Pillow 等硬依赖）→ 同样引导修复后重跑。
- **`△` 警告**（字体等可降级项）→ 建议修复但可继续；`httpx`、Pillow、python-pptx 等硬依赖失败则不能生产。
- **`✓ READY`** → 进入 Step 2。

> 脚本退出码：任何硬失败都返回非 0，agent 可据此 gate。deps（pptx/Pillow）是在 `uv run` 环境里检测的（管线真正运行的地方），所以裸 python 跑本脚本不会误报它们缺失。参考 `00_project_setup/00-zero-to-ready.md`。

### 首次凭据：API key + 图像 base URL（问一次，之后自动带）

**没有 key/base URL，Stage 2 生不了图，PPT 就做不出来。** 所以第一次遇到 `✗ api_key: not set`（或 `△ image_base_url … relay calls will misfire`）时：

1. **问用户要**：图像 API key，统一记录为 `OPENAI_API_KEY`；可选记录 `OPENAI_BASE_URL`。当前 wrapper 会桥接到已安装 skill 的原生变量。不同供应商的 API contract 不保证只换 URL 就兼容，必要时更换 skill adapter。
2. **写进 deck 根目录的 `.env`（写一次就行）**：Phase 0 `--init` 会铺 `.env.example` 模板 + `.gitignore`（保护它不被提交）。复制成 `.env` 填：
   ```
   OPENAI_API_KEY=sk-...
   OPENAI_BASE_URL=https://your-relay/v1   # 可选
   ```
3. **重跑 env-check** → key 变 `✓`（**从 deck 目录跑 env-check**，它按 cwd 向上找 `.env`；从别处跑可能看不到 deck 的 `.env`）。
4. **key 的"有效性"要等真调一次才知道**——env-check 只能看"填没填"，看不出"对不对"。**别在这里就跑 Stage 2**：此刻 Stage 1 还没跑、`style_master.jpg` 还没生成，`--stage 2` 一定报 "prompts not found"。真正的 key 冒烟测试在 **Phase 3 第一次跑 Stage 2 时**——那时出图 = key/端点对了（之后自动加载不再问）；报 401/403 或连不上 = 回到第 1 步改 `.env` 再跑。

> **⚠️ Stage 2 还依赖图像生成 skill。** env-check 里若 `stage2_generator` 是 `△`（"not found"），说明 `image2-ppt` skill 没装——**Phases 0–2 能做，但 Stage 2 生图会失败**。需在 `.claude/skills/`（或 `.agents/skills/`）下装好该 skill 再进 Phase 3。env-check 的 READY 行会用 `◑` 明确提示这种"能设计、不能生图"的半就绪状态。

> `.env` 里有它期待的东西 → 就能 work；没有 → 只能问用户；填好 → 一定要真跑一页试。（`unified_pipeline`、env-check、生成脚本都会读 deck 根/当前目录的 `.env`；真实 export 的环境变量优先。pipeline 会把 `OPENAI_*` 桥接到底层 skill 实际读的名字。）

> **包**：Phase 0 的 `--init` 会在 deck 里铺一个最小 `pyproject.toml`（含 python-pptx / Pillow）。deck 建好后在 deck 目录跑一次 `uv sync`（或 `uv run` 自动解析），pptx/Pillow 就位——env-check 随后会显示 `✓`。

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
| A. Pitch Deck | `pitch` | `02_content_design/presets/deck-type-templates/pitch-deck-template.md` | 10-14 |
| B. Keynote | `keynote` | `02_content_design/presets/deck-type-templates/keynote-template.md` | 15-20 |
| C. Training | `training` | `02_content_design/presets/deck-type-templates/training-template.md` | 12-18 |
| D. Report | `report` | `02_content_design/presets/deck-type-templates/report-template.md` | 10-14 |
| E. Other | `keynote` | 从 B（keynote）开始，按需调整 | — |

> `--init --deck-type <值>` 会把对应模板自动铺成 `slide-specifications.md`，不用手动 `cp`。

### 3.2 确认叙事弧线（不是"另选一条"）

你在 3.1 选的 deck-type 模板**已经内置了一条叙事弧线**（它的 Block Map）。这一步是**对照 `02_content_design/presets/block-arc-catalog.md` 理解并向用户确认**这条弧线的形状与论证功能——**以模板的 Block Map 为准**。只有在**不用模板**、或要刻意重构结构时，才从 catalog 换一条弧线。不要"用了模板又照 catalog 另选一条弧线"（两套结构打架的老坑）。

### 3.3 生成隐喻与公式候选

基于用户的 topic 和第 5 题（记住什么），参考 `02_content_design/presets/metaphor-catalog.md` 做模式匹配，生成 2-3 个候选。每个候选包含：
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

从 `01_visual_style_master/presets/` 中筛选 2-3 个与已锁定 medium 匹配的候选。**描述每种的外观和适合场景**，让用户选一个。如果没有任何 preset 匹配（如用户选 etching），进入 Expert Mode 自定义视觉系统。

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

1. **先读** [AGENT_CONTRACT.md](AGENT_CONTRACT.md)（10 条，不可违反）
2. **再按当前 Phase** 打开 [AGENTS.md](AGENTS.md) 对应章节——不要整本通读

你现在已经完成了 Phase 0 的大部分工作——有了 metadata、内容方向、视觉方向。按 AGENTS.md 的 Phase 0-3 走，但注意：

1. **Phase 0 简化为**:一条 `ppt_flow.py init` 命令搭好整个骨架**并把选中的 preset 播种到位**(**不要手动 mkdir、不要手动 cp**),再填 metadata:
   ```bash
   uv run python PPTMAKER_FRAMEWORK/06_reference_scripts/ppt_flow.py init deck_{NAME} \
     --deck-type {keynote|pitch|report|training} --style {preset-slug}
   ```
   它建好三层结构、每个目录放大白话 README、铺好内容模板、**把 deck-type 模板铺成 `slide-specifications.md`、把视觉 preset 的 `deck_system.txt` + `color_palette.json` 铺进 `2_backbone/visual-style/`**、写好完整 deck-guide.md + CLAUDE.md + project-metadata.yaml。`_generated/` 的空壳与 README 会预建，真实管线产物在首次运行时生成。`{preset-slug}` 是 3.5 表里的 `--style` 值。**不要再手敲 cp**——播种由 `--init` 确定性完成。
2. **Phase 1 简化为**：隐喻/公式写进 `2_backbone/core-metaphor.md` + `core-formula.md`；deck-type 模板已由 `--init` 铺成 `3_versions/v1/slide-specifications.md`,填真实内容,让用户审核关键 claim。
3. **Phase 2 简化为**：视觉 preset 的 `deck_system.txt` + `color_palette.json` 已由 `--init --style` 铺进 `2_backbone/visual-style/`;只剩 `style_master.jpg` 需生成(preset 不含预生成图),把它的 prompt 存为 `style-master-prompt.md` 再生成。
4. **Phase 3**：先跑 `ppt_flow.py pilot deck_{NAME}/3_versions/v1`，用户确认后跑 `ppt_flow.py build deck_{NAME}/3_versions/v1`。两者都会自动检查结构与闸门。
5. **Phase 4（迭代）**：交付后用户提改动时，参考 [05_iteration/README.md](05_iteration/README.md) 和 [automation/change-classifier.md](automation/change-classifier.md) 做最小重跑。改 slide = 下游；改隐喻/视觉主干 = 改 `2_backbone/`（影响全版本）。

---

## 快速参考：文件路径

| 你需要什么 | 去哪里 |
|-----------|--------|
| **目录结构（宪法·SSOT）** | `06_reference_scripts/bundle_layout.py`（跑它看树 / `--check` 校验） |
| **日常执行入口** | `06_reference_scripts/ppt_flow.py`（status / approve / pilot / build / refresh） |
| 目录结构（人读镜像） | `00_project_setup/01-directory-template.md` |
| Deck type 模板 | `02_content_design/presets/deck-type-templates/` |
| 叙事弧线 catalog | `02_content_design/presets/block-arc-catalog.md` |
| 隐喻 catalog | `02_content_design/presets/metaphor-catalog.md` |
| 公式 catalog | `02_content_design/presets/formula-catalog.md` |
| 视觉预设 | `01_visual_style_master/presets/` |
| 完整执行流程（铁律一页） | `AGENT_CONTRACT.md` |
| Phase 详解 | `AGENTS.md`（按需翻） |
| 环境检测脚本 | `00_project_setup/00-auto-env-check.py` |
| 术语解释 | `GLOSSARY.md` |
| 常见错误 | `ANTI_PATTERNS.md` |

---

## 已知限制（Agent 需告知用户）

- **Slides 是图片**：PPTX 的每页是一张完整图片，文字已"烧入"图片中。要改文字需回到源 markdown 重跑管线（Chain A，~5 min）。不支持在 PowerPoint 中直接编辑文本框。
- **中文 slides 支持受限**：预设的 deck_system.txt 默认英文。如需中文 slides，Agent 需手动改 deck_system.txt LANGUAGE 规则，并将 stage3 的字体切换为 Noto Sans CJK。
- **自定义 Logo**：所有预设默认无 logo。如需添加，Agent 需在每个 slide 的 IMAGE PROMPT 中描述 logo 的位置和大小，并编辑 deck_system.txt 的 FORBIDDEN 规则。
- **如果不喜欢 5 个预设**：告诉 Agent "我想自定义风格"，Agent 会切换到 Expert Mode（Phase 2 的完整视觉系统设计流程）。

## 铁律

完整 10 条见 [AGENT_CONTRACT.md](AGENT_CONTRACT.md)。这里只重复最容易漂的四条：

1. **用户做选择题，你做创造性劳动。** 不要问"你的隐喻是什么"——生成 2-3 个候选。
2. **闸门不可跳过。** 每个 Phase 结束等用户确认。
3. **源文件是 SSOT。** 改 `2_backbone/` 或 `slide-specifications.md`，绝不手改 `_generated/`。
4. **目录是宪法。** `bundle_layout.py` 定义结构；不自创目录。
