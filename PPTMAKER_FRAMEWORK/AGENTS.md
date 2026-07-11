---
title: AGENTS.md — PPT Flow Orchestrator
stage: root
position: playbook
type: playbook
summary: Agent 的主执行脚本。定义固定流程、对话引导、gate check、编辑链。
depends_on:
- README.md
- workflow/00-setup/README.md
feeds_into:
- workflow/01-visual/README.md
- workflow/02-content/README.md
- workflow/03-prompts/README.md
- workflow/04-production/README.md
- workflow/05-iteration/README.md
agent_action: navigate
---

# AGENTS.md — PPT Flow Orchestrator

> 本文件为 **agent-agnostic**——适用于 Claude Code、Codex、Cursor 及任何 AI coding agent。
> **每次 session 先读 [charter/AGENT_CONTRACT.md](charter/AGENT_CONTRACT.md)（11 条铁律）。** 本文件是 Phase 详解——按当前 Phase 翻对应章节，不要整本通读当入口。

## 给人类读者

> 如果你是正在读这份文件的人类——**你不需要自己执行下面的命令。** 把 [reference/quick-start.md](reference/quick-start.md) 里的 conversation starter 贴进你的 AI coding agent，agent 会读 [BOOTSTRAP.md](BOOTSTRAP.md) + [charter/AGENT_CONTRACT.md](charter/AGENT_CONTRACT.md) 并替你执行。你的工作：回答 agent 的问题（关于你的 topic、听众、偏好），在每个闸门前做内容判断。
>
> 下面这些步骤是 agent 的操作手册。你可以读它来理解流程，但不需要手动操作。

## Novice Mode（默认开启）

如果用户没有明确指定隐喻、公式或视觉风格，**你拥有这些决策**。你不是问用户"你的隐喻是什么"——你生成 2-3 个候选，让用户选。

**核心行为规则**：
- **做创造性劳动**：基于用户的 topic 和 audience，主动生成隐喻候选、公式候选、视觉方向建议
- **让用户做选择题**：每个关键决策给 2-3 个选项（不是 5+ 个制造选择困难）
- **解释你的推荐**：每个选项说清楚为什么适合、不适合
- **如果用户说"不知道"**：不要追问同一个问题。换个角度问，或者基于你已知的信息做最佳猜测，让用户确认

**Tier 选择**（概念档位，**不是 CLI flag**——没有脚本接受 `--quick` 等参数；它只决定你规划多少页/多深）：
- **quick**：10-14 slides，标准结构，加速流程。适合时间紧或探索性项目。
- **standard**：15-20 slides，完整方法论。**默认**，适合大多数场景。
- **deep**：20-30 slides，研究密集型，完全定制。适合有充足时间的重要项目。

Tier 在 Step 2 Intake 时根据用户回答的时长自动判断。如果用户没指定，默认 **standard**。

**预设驱动**（见 BOOTSTRAP.md Step 3）：
- Deck type → 从 `workflow/02-content/presets/deck-type-templates/` 选择模板
- 叙事弧线 → 从 `workflow/02-content/presets/block-arc-catalog.md` 选择
- 隐喻 → 参考 `workflow/02-content/presets/metaphor-catalog.md` 做模式匹配
- 视觉风格 → 从 `workflow/01-visual/presets/` 选择预设

## Role

你是一个 PPT 制作 orchestrator。你的职责是按**固定流程**引导用户完成从零到最终 PPTX 的全过程。

**你 owns process（流程、文件组织、阶段切换、gate 检查）。用户 owns substance（内容、风格、最终判断）。**

## 核心理念：Run Bundle

所有工作都发生在一个 **run bundle**（文件系统实例）中。run bundle 是一个遵循 `workflow/00-setup/` 定义的目录结构——它是项目的完整文件系统 workspace。不需要数据库、不需要 workflow server、不需要 YAML。`ls` 看进度，`diff -r v1 v2` 看差异，`git log` 看历史。

**Soft bundle**（`PPTMAKER_FRAMEWORK/`）= 方法论文档（只读参考）。**Run bundle**（`deck_{NAME}/`）= 项目 workspace（所有动态内容）。

> ### ⚙️ 跨平台（macOS / Linux / Windows 都要能跑）
> 本文档里的 `ls` / `cp` / `cp -r` / `rm -rf` / `diff -r` 是 **POSIX 示例**。核心 Node.js 脚本（`bundle_layout.mjs --init`、`unified_pipeline.mjs`、各 stage `.mjs`）本身是跨平台的，用它们就无需这些 shell 命令。当你确实需要文件操作时：
> - **首选：用你的 agent 文件工具**（读/写/复制/删除），完全避开 shell 差异——这是最稳的跨平台方式。
> - 需要 shell 时的等价命令：
>   | 操作 | macOS / Linux | Windows PowerShell |
>   |---|---|---|
>   | 复制文件 | `cp a b` | `Copy-Item a b` |
>   | 复制目录 | `cp -r v1 v2` | `Copy-Item v1 v2 -Recurse` |
>   | 删除目录 | `rm -rf d` | `Remove-Item d -Recurse -Force` |
>   | 看目录 | `ls` | `dir` / `Get-ChildItem` |
> - **路径分隔符**：脚本和 Node 路径里一律用 `/`（Windows 也接受 `/`）；不要硬编码 `\`。
> - **不要用 `$(cmd)` 命令替换、`/tmp`、heredoc**（都是 bash-only）。需要临时文件用 Node `os.tmpdir()` 或写进 deck 根（非 whitelisted，用完可删）。

## 固定流程（不可跳过，不可重排）

```
Phase 0: 项目初始化 → 创建 run bundle
    ↓
Phase 1: 内容设计（参考 workflow/02-content/）
    ↓
Phase 2: 风格设计（参考 workflow/01-visual/）
    ↓
Phase 3: 生产管线（参考 workflow/04-production/）
    ↓
Phase 4: 迭代维护
```

**Phases 1 和 2 可以交换顺序**（如果用户带着强烈的视觉方向进来），但不可跳过。Phase 3 必须在 Phase 1 和 Phase 2 都锁定后才能启动。每个 Phase 结束时有一个 **⛔ 闸门**（gate check）——用户确认后才能进入下一个 Phase。

**如果用户想跳过某个 Phase**：解释为什么这个 Phase 不可跳过（"没有内容设计就直接生产 = 生成一堆没有论证力的 slide"）。如果用户坚持，提醒他们 "之后可能需要大量返工"，但仍然尊重用户决定——agent 不强制 lock-in。

---

## Phase 0: 项目初始化

### 0.1 收集 Metadata（简化版——Novice Mode 默认）

**如果用户已经通过 BOOTSTRAP.md Step 2 的 Intake 回答了 5 个问题**（推荐路径），你已经有了大部分 metadata。只需补充以下技术项：

1. **项目名称**：从 topic 关键词自动生成 slug（如 `deck_ev_charging_pitch`）。问用户确认。
2. **内容约束**（可选）："有什么不能出现在 slides 上的吗？"（如：no internal financials, no customer names, no system names）。如果用户说"没有"，跳过。
3. **视觉约束**（可选）："有什么视觉禁忌吗？"（如：no stock photos, no warm tones, no competitor logos）。如果用户说"没有"，跳过。

**如果用户跳过了 BOOTSTRAP.md 直接进入 Phase 0**（老路径），问以下问题（一次性问完）：
- Topic + 听众 + 时长 + 语言 + 最想让听众记住什么
- 内容约束 + 视觉约束

记录到 `deck_{NAME}/project-metadata.yaml`。初始化时保留 `content_gate: pending`、`visual_gate: pending`；只有用户明确确认对应 Phase 后才改为 `approved`。

**如果用户在某项说"不知道"**：
- 听众 → "谁决定买不买/批不批预算？"
- 时长 → 默认 30-40 分钟
- 最想让人记住什么 → 不能代答，追问："如果竞争对手在场，你最想证明什么？"

### 0.2 创建 Run Bundle

参考 `charter/CONSTITUTION.md`（人类可读镜像）和 `scripts/bundle_layout.mjs`（**目录结构的唯一机器权威源**），创建以下 **run bundle**。它遵循三层分化梯度：

```
deck_{NAME}/          ← 这是你的 run bundle（"deck_" 前缀必须保留）
  ├── deck-guide.md              ← 进目录先读（控制流护栏）
  ├── CLAUDE.md                  ← 一行指针 → deck-guide.md
  ├── _state/                    ← playbook 执行进度（state.yaml）
  ├── _lessons/                 ← 自留教训（遇事克服后留下；先读再猜；不是进度 / 不是密钥）
  ├── 1_upstream_raw_material/   ← 【源·共享】原始素材/调研
  ├── 2_backbone/                ← 【源·共享】主干:隐喻/公式/约束/大纲/讲稿/视觉
  │     └── visual-style/        ←   style-master-prompt.md + style_master.jpg + deck_system.txt + color_palette.json
  └── 3_versions/
        └── v1/                  ← 一次设计迭代（= --run-dir）
              ├── slide-specifications.md  ← 【源】每页规格（你改）
              ├── overrides/              ← 【源】这版偏离 backbone 的东西（空=全继承）
              └── _generated/            ← 【派生】脚本产物，绝不手改，可 rm -rf 重建
```

> **三层梯度**:上游(原始素材)+ 中游 backbone(主干,含视觉)全版本**共享一份**;版本只切下游 `3_versions/`。派生品全在 `_generated/` 里。脚本不复制进 run bundle——管线从 `PPTMAKER_FRAMEWORK/scripts/` 就地运行(见 Phase 3)。

创建命令——**用 `--init` 一条命令搭好整个骨架并播种选中的 preset,不要手动 mkdir、不要手动 cp**（手动建/手动拷是临场发挥的源头）：

```bash
node PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs \
  --init deck_{NAME} --deck-type {keynote|pitch|report|training} --style {preset-slug}
```

它从 SSOT 长出完整三层结构、给**每个目录**放一份大白话 README、把内容模板铺到位、播种 deck-type 与视觉 preset，并写好可直接使用的 `deck-guide.md` + `CLAUDE.md` + `project-metadata.yaml`。`_generated/` 空壳与 README 会预建，真实管线产物首次运行时生成。

> `--deck-type` / `--style` 的合法值来自 SSOT catalog(`bundle_layout.mjs` 的 `DECK_TYPE_TEMPLATES` / `STYLE_PRESETS`);拼错会被 argparse 直接拒绝。省略它们则铺空模板(Expert Mode 手填)。`style_master.jpg` 不由 preset 提供,Phase 2 生成。

搭完后随时可校验结构合不合宪法(Phase 0 用 `--structure-only`——不查 Phase-2 才有的 `style_master.jpg`,新建 bundle 直接通过):
```bash
node PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs --check deck_{NAME}/3_versions/v1 --structure-only
```

`deck-guide.md` 是这个 bundle 的护栏——任何 agent 进目录先读它,就知道结构、能改什么、别碰什么、下一步干什么。它防止下次 session 临场发挥出错误的目录。

### 0.3 准备源文件

**Novice Mode（推荐——从 BOOTSTRAP 进入）**：

不从空白模板开始。如果 Phase 0.2 的 `--init` 已带 `--deck-type` + `--style`，**源文件已经播种到位，无需任何手动 `cp`**：

1. **Slide 规格**：deck-type 模板已铺成 `3_versions/v1/slide-specifications.md` → 直接填真实内容。
2. **视觉主干**：preset 的 `deck_system.txt` + `color_palette.json` 已在 `2_backbone/visual-style/` → 直接用。
3. **Style master**：如果 preset 有预生成的 jpg → 复制到 `2_backbone/visual-style/`；否则用 preset README 的 prompt 生成（Phase 2 做），并把该 prompt 存为 `2_backbone/visual-style/style-master-prompt.md`。

> **如果 `--init` 时没带 preset**（比如 preset 是事后才选定的）：补种时也不要手抄路径——重跑 `--init deck_{NAME} --deck-type X --style Y` 即可。`--init` 幂等，只补**尚未存在**的文件（已铺进 `visual-style/` 的 preset 文件、以及首次 `--init` 铺的空 `slide-specifications.md` 都不会被覆盖）。所以：视觉 preset 可以这样干净补种；但若空 `slide-specifications.md` 已存在、想换成某个 deck-type 模板，先删掉它再重跑（或直接按模板手填）。

**Expert Mode（跳过 BOOTSTRAP 直接进入 AGENTS.md）**：

从空白模板开始,填 backbone(身份+视觉)和这一版的 slide 规格：

```bash
# 上游身份 → 2_backbone/
cp PPTMAKER_FRAMEWORK/workflow/02-content/template-core-metaphor.md \
   deck_{NAME}/2_backbone/core-metaphor.md
cp PPTMAKER_FRAMEWORK/workflow/02-content/template-core-formula.md \
   deck_{NAME}/2_backbone/core-formula.md
cp PPTMAKER_FRAMEWORK/workflow/02-content/template-design-constraints.md \
   deck_{NAME}/2_backbone/design-constraints.md

# 视觉主干 → 2_backbone/visual-style/
cp PPTMAKER_FRAMEWORK/workflow/01-visual/template-visual-style.md \
   deck_{NAME}/2_backbone/visual-style/visual-style.md
cp PPTMAKER_FRAMEWORK/workflow/01-visual/template-deck-system.txt \
   deck_{NAME}/2_backbone/visual-style/deck_system.txt

# 下游这一版的每页规格 → 3_versions/v1/
cp PPTMAKER_FRAMEWORK/workflow/02-content/template-slide-specifications.md \
   deck_{NAME}/3_versions/v1/slide-specifications.md
```

### ⛔ 闸门：Phase 0

- [ ] `bundle_layout.mjs --init deck_{NAME}` 已跑（三层结构 + 每目录 README + 模板 + deck-guide/CLAUDE/metadata 桩全部就位）
- [ ] Metadata 已填写（`project-metadata.yaml` 无 vague 项）
- [ ] 源文件已就位（backbone 的隐喻/公式/约束/视觉 + 这版的 slide-specifications.md）
- [ ] `deck-guide.md` 占位符已按项目填好（`--init` 生成的是桩,需替换 {{...}}）
- [ ] `bundle_layout.mjs --check deck_{NAME}/3_versions/v1 --structure-only` 通过（结构合宪法；`style_master.jpg` 是 Phase 2 产物，此闸门不查它）

→ 用户确认后进入 Phase 1。如果某项不通过，在进入 Phase 1 前修复。

---

## Phase 1: 内容设计

> 参考知识库：`workflow/02-content/`（每个子阶段有详细方法论）
> 产出物：`slide-specifications.md`（run bundle 中的 `3_versions/v1/`）+ backbone 的隐喻/公式（`2_backbone/`）
> 迭代引擎（`workflow/05-iteration/`）

### 1.1 核心隐喻（参考 `workflow/02-content/01-find-the-core-metaphor-and-formula.md`）

**Novice Mode（推荐）**：不要问用户"你的隐喻是什么"。用以下流程：

> **如果已从 BOOTSTRAP Step 3.3 进入**：隐喻候选已生成且用户已确认。跳过生成步骤，直接进入 1.2（核心公式）——基于已确认的隐喻推导公式。只需验证隐喻仍符合直觉，然后继续。

> **如果直接进入 AGENTS.md（跳过 BOOTSTRAP）**：按以下流程生成隐喻候选。

1. 基于用户 topic 和"最想让人记住什么"，参考 `workflow/02-content/presets/metaphor-catalog.md` 做模式匹配
2. 生成 2-3 个候选隐喻，每个包含：
   - 隐喻名称和一句话描述
   - 核心 tension（什么信念错了？什么后果？）
   - 为什么适合这个 topic
3. 告诉用户你的推荐和原因。让用户选择一个（或提出自己的）。

**Expert Mode**（用户带着明确隐喻进来）：验证而非生成。问这三个问题：
1. "你的 audience 目前相信什么——但其实是错的或不完整的？"
2. "如果这个 belief 不改变，会发生什么具体后果？"
3. "用一句话抓住这个 tension——有没有一个具体、可感知的意象？"

验证每个候选：可感知？有 tension？可延展 15-20 slides？

### 1.2 核心公式（参考 `workflow/02-content/01`）

> **如果已从 BOOTSTRAP Step 3.3 进入**：公式已随隐喻候选一起生成。只需验证：可证伪？（能想象让它不成立的场景？）5 秒能理解？（外行能听懂？）每张 slide 能追溯到？（公式的 A、B、C 各有 slide 对应？）三项都通过 → 进入 1.3。

> **如果直接进入 AGENTS.md**：从隐喻推导公式。

从隐喻推导公式：
1. 识别 outcome（audience 最终想要什么）
2. 分解 contributing factors（2-3 个必要且充分的条件）
3. 写成 A + B = C 形式
4. **验证可证伪性**——如果有人能证明它错了，deck 就失去了存在理由。如果公式不可证伪，回到 1.1。

### 1.3 Block Map（参考 `workflow/02-content/02-build-narrative-arc-blocks.md`）

填写 Block Map：

| Block | 叙事问题 | Slides | 论证功能 |
|-------|---------|--------|---------|
| B1: [Name] | [回答什么问题？] | [N] | [在整体论证中的作用] |

验证：每个 Block 有清晰的问题？Block 之间有递进关系？概念和证据分布平衡？

### 1.4 Slide 规格（参考 `workflow/02-content/03-specify-slides-multi-layer.md`）

为每张 slide 填写规格（直接编辑 `3_versions/v1/slide-specifications.md`，每张一个 `## Slide N` 块）。四层里 **Phase 1 只写 L1 / L2 / L4；L3 IMAGE PROMPT 本阶段留占位，等 Phase 2 视觉锁定后再回填（见 §2.7）**：

| 层 | 内容 | 消费者 | 何时填 |
|----|------|--------|--------|
| L1 Meta | VISUAL TYPE, RENDER MODE, KICKER, TITLE | Pipeline scripts | **Phase 1** |
| L2 Concept | MUST communicate, MUST NOT, Bridge | Reviewer, Presenter | **Phase 1** |
| L3 Image Prompt | 完整视觉描述（参考 `workflow/03-prompts/`） | AI Image Model | **Phase 2 之后回填（§2.7）** |
| L4 Speaker Note | Narrative flow, Terms, Takeaway | Presenter | **Phase 1** |

> **为什么 L3 押后**：L3 要"对照 `2_backbone/visual-style/`"（画风/色板/组件）才写得对，而那套视觉要到 Phase 2 才锁定。Phase 1 就写 L3 = 拿还不存在的东西做参照，写出来多半作废重来（本框架 bug 0003 的根因）。所以 Phase 1 每个 slide 的 L3 留占位（如 `[PLACEHOLDER: 视觉锁定后填]`），视觉锁定后统一回填。**L1 的 TITLE/KICKER/VISUAL TYPE 照常在 Phase 1 写全**——它们是内容判断，不依赖画风。

> **每页声明 RENDER MODE**（两个之一）:`full-page`(image-2 画整页,含标题——开场/分隔/结尾) 或 `body+header-lock`(image-2 只画 body,Node `@napi-rs/canvas` 叠标题——常规页)。由 VISUAL TYPE 自动映射,但写出来让生产方式一眼可见。

### 1.5 约束检查（参考 `workflow/02-content/05-iterate-with-version-discipline.md`）

对照 `2_backbone/design-constraints.md` 逐项检查。任何 slide 违反约束 → 标记、修复。

### 1.6 迭代打磨

对于内容层的改动，走结构化迭代流程（参考 `workflow/05-iteration/01-content-iteration-workflow.md`）：
- 大改动（隐喻/公式/Block 结构）→ 在 Claude Code 中用 `openspec-propose`；在其他 agent 中也遵循同样的 提案→审核→实施→归档 模式
- 小改动（单张 slide wording）→ 直接改 `slide-specifications.md`

### ⛔ 闸门：Phase 1

- [ ] 核心隐喻能在 5 秒内向陌生人解释清楚
- [ ] 核心公式可证伪——存在一个 scenario 让它不成立
- [ ] Block Map 完整——每个 Block 有清晰问题和论证功能
- [ ] 每张 slide 的 **L1 Meta + L2 Concept + L4 Speaker Note 齐全**（L3 IMAGE PROMPT 本阶段**允许留占位**，Phase 2 视觉锁定后在 §2.7 回填）
- [ ] 每页 L1 有真实 TITLE / VISUAL TYPE（这些不依赖画风，Phase 1 就要写全）
- [ ] 所有 Design Constraints 检查通过
- [ ] 没有 filler slide——每张 slide 的叙事功能可以一句话说出

> **L3 的内容契约校验不在这里。** `stage1_build_inputs.mjs --validate`（L3 gate，会把"缺 IMAGE PROMPT"判为 ERROR）**放到 §2.7 回填之后 / Phase 3 生产前**——那时 L3 才应齐全。管线在 Phase 3 首次运行前会自动跑这道校验（见 §3 执行管线），无需在 Phase 1 手动跑。**Phase 1 跑它一定失败**（L3 还是占位），别在此处 gate。

→ 用户确认内容锁定后，把 `project-metadata.yaml` 的 `content_gate` 改为 `approved`，再进入 Phase 2。如果闸门不通过，回到对应子阶段修复。**不跳闸门。**

**如果闸门不过**：具体指出是哪项不通过（如 "Slide 7 的 TITLE 无法被反驳——它只是 topic label 不是 claim"），回到对应子阶段修复，而不是 "全部重来"。

---

## Phase 2: 风格设计

> 参考知识库：`workflow/01-visual/`
> 产出物：`style_master.jpg` + `visual-style.md`（在 run bundle 的 `2_backbone/visual-style/` 中）
> 底层能力：`workflow/03-prompts/`（IMAGE PROMPT 写作）
> 迭代引擎（`workflow/05-iteration/`）

### 2.1a Medium 决策：画风先于配色（Novice + Expert 都先做这步）

**这是 Phase 2 的第 0 步，先于选 preset / 配色 / 生成 style_master。** 两条铁律（本框架 bug 0002 的教训）：

- **Medium before color.** 先定用什么**媒介**表达内容——sketch/etching · flat diagram · photography · 3D render · mixed——**再**从画风推导色板。不是先选色板再想画什么。选一个"Warm Editorial"色板只是选了颜色，没决定画风。
- **Don't ask the user to confirm what they can't see.** 用户在选色板方向时，看不出"素描 vs 矢量图解 vs 摄影"的区别。所以要先让他们在**画风之间**做选择题，而不是色板之间。

怎么做：
1. **从 product DNA 推 medium**（参考 `workflow/01-visual/01-gather-product-context-dna.md` 的 medium 线索）：抽象概念/方法论 → illustration/sketch；实体产品 → photography；流程/系统/架构 → diagram；未来感/硬件 → 3D。
2. **给用户 2-3 个画风候选做对比**（描述每种画风长什么样、适合什么；有条件就给参考图），让用户选一个。**这是画风对比，不是色板对比。**
3. 用户选定 medium 后 **才**进入配色：Novice → 挑画风匹配的 preset；Expert → `02-design-the-visual-system.md` 从 **Dimension 0: Medium → Dimension 1: Color** 往下走。

→ medium 锁定后，再往下（Novice 选 preset / Expert §2.1-2.6）。**闸门会检查 medium 是否先于配色锁定。**

### Novice Mode（推荐）：使用视觉预设

**不要在 Phase 2 问用户"你喜欢什么颜色"。** 先按 §2.1a 锁定 medium，**再**用 medium 过滤 preset。

> **如果已从 BOOTSTRAP Step 3.4-3.5 进入**：medium 与视觉预设均已按顺序确认。跳过选择步骤，直接执行下方的“选中后”操作。

> **如果直接进入 AGENTS.md（跳过 BOOTSTRAP）**：先按 §2.1a 和用户锁定 medium，再从 `workflow/01-visual/presets/` 里挑**画风匹配**该 medium 的 2-3 个预设让用户选。

5 个可用预设及其隐含画风（medium 线索见各 preset 的 `deck_system.txt`）：Dark Executive（几何/图解，无照片）/ Clean Clinical（干净图表/数据）/ Warm Editorial（摄影风）/ Tech Startup（霓虹/科技感）/ Corporate Safe（保守企业）。**先按 §2.1a 锁定的 medium 过滤**——只考虑画风匹配的 preset；若没有 preset 匹配想要的画风（如"素描/etching"），转 Expert Mode 自定义画风。详见各 preset 目录下的 README。

选中后：
1. **`deck_system.txt` + `color_palette.json`**：若 Phase 0 的 `--init` 带了 `--style`，这两个文件已在 `2_backbone/visual-style/`——无需操作。（事后才选定 preset 见 Phase 0.3 的补种说明；**不要手抄 cp 路径**。）
2. **如果 preset 有预生成的 `style_master.jpg`**：直接复制到 `2_backbone/visual-style/style_master.jpg`
3. **如果没有预生成的 jpg**（当前 5 个 preset 都不含）：把 style master prompt 存为 `2_backbone/visual-style/style-master-prompt.md`（源文件，别丢），再用框架的统一 wrapper 生成：

```bash
node PPTMAKER_FRAMEWORK/scripts/generate_style_master.mjs \
  --run-dir deck_{NAME}/3_versions/v1 --resolution 2k
```

> **提示**：生成的 `style_master.jpg` 放在 `2_backbone/visual-style/` 下,和它的源 prompt(`style-master-prompt.md`)、trace(`.apimart-task.json`)在一起。style master 是全版本共享的视觉锚,属于 backbone。

然后跳到 Phase 2 闸门——审查视觉系统，用户确认锁定。

### Expert Mode（用户带着视觉方向进来）

如果用户明确说了想要什么风格（如"我要白底蓝字的 corporate 风"），跳过预设选择，但仍走完整的视觉系统设计流程（2.1-2.6）。

### 2.1 产品 DNA 调研（参考 `workflow/01-visual/01-gather-product-context-dna.md`）

问用户：
1. "客户做什么产品/服务？描述它的物理或数字形态。"
2. "这个行业典型的视觉风格是什么？你想遵循还是打破？"
3. "audience 的视觉期待是什么？executive（稀疏自信）还是 technical（密集数据）？"
4. "有没有产品照片或 reference imagery？"

产出：一句 "defining sentence"（5-15 words）+ **锁定的 medium**（画风，见 §2.1a——这是 §2.2 配色的前提）。

### 2.2 视觉系统设计（参考 `workflow/01-visual/02-design-the-visual-system.md`）

填充 `2_backbone/visual-style/visual-style.md`，**从 medium 开始，再配色**（次序不能反）：
- **Dimension 0: Medium**（画风——§2.1a 已锁：sketch/etching · diagram · photography · 3D · mixed）
- Color palette（4-6 colors，每个有语义角色——**从 medium 推导**）
- Typography scale（5-6 levels）
- Layout grid（2-3 modes）
- Component patterns
- Micro decorations（可选）

### 2.3 Style Master Prompt（参考 `workflow/01-visual/03-write-the-style-master-prompt.md`）

组装 meta-prompt——生成视觉风格参考图。

### 2.4 生成 style_master.jpg

先把 2.3 的 meta-prompt 存成 `2_backbone/visual-style/style-master-prompt.md`（源文件），再用框架的统一 wrapper 生成一张风格母版图：

```bash
node PPTMAKER_FRAMEWORK/scripts/generate_style_master.mjs \
  --run-dir deck_{NAME}/3_versions/v1 --resolution 2k
```

wrapper 会读取 prompt 文件、自动加载 deck 根 `.env`、按 Image2 契约解析凭据（`IMAGE2_*`，别名 `OPENAI_*`/`APIMART_*`），并把图片与 trace 写回同一视觉源目录。

### 2.5 提取 deck_system.txt

从独立模板复制并填写：

```bash
cp PPTMAKER_FRAMEWORK/workflow/01-visual/template-deck-system.txt \
   deck_{NAME}/2_backbone/visual-style/deck_system.txt
```

然后填入你的项目约束（language policy、forbidden elements、text density、tone 等）。模板有详细注释说明每项填什么。

`deck_system.txt` 是 Stage 1 的系统级约束来源——`stage1_build_inputs.mjs` 读取它来向每个 slide prompt 注入 TEXTUAL contracts。它与 style master（处理 VISUAL consistency）互补：style master **shows** 模型产出什么风格，deck_system.txt **tells** 模型不要产出什么内容。

### 2.6 Review & Lock（参考 `workflow/01-visual/04-iterate-review-lock.md`）

用 checklist 审查。Path A（95%+ pass）→ Lock。Path B（80-95%）→ 微调 prompt。Path C（<80%）→ 回到 2.2。

### ⛔ 闸门：Phase 2

- [ ] **视觉 medium 已在配色 / 生成 style_master 之前锁定**（先定画风：sketch/etching · flat diagram · photography · 3D · mixed，再从画风推导色板——见 §2.1a）
- [ ] Color palette 每个颜色有 hex code + 语义角色
- [ ] Typography 所有层级在同一 frame 中可见（比例关系正确）
- [ ] Layout grid 的 2-3 modes 在 style master 上可辨识
- [ ] Style master 中没有不该出现的东西（logo、watermark、warm tone...）
- [ ] `style_master.jpg` 是 2K 分辨率、16:9
- [ ] `style_master.jpg` 的画风与锁定的 medium 一致（不是"色块排版参考板"）
- [ ] 用户已确认 "视觉系统锁定，不再修改"

→ 用户确认风格锁定后，把 `project-metadata.yaml` 的 `visual_gate` 改为 `approved`，再进入 §2.7 回填 L3。锁定后改 style master = 最高 downstream cost。

### 2.7 回填 L3 IMAGE PROMPT（视觉锁定后才做）

视觉系统已锁（`style_master.jpg` + `deck_system.txt` + `color_palette.json` 就位）——**现在**回到 `3_versions/v1/slide-specifications.md`，为每张 slide 填 §1.4 留下的 L3 占位：

- 逐页写完整 IMAGE PROMPT，**对照 `2_backbone/visual-style/`** 的画风/色板/组件（这套东西此刻真实存在了，不会写废）。写法参考 `workflow/03-prompts/` 和该 slide 的 L1 VISUAL TYPE / RENDER MODE。
- 全部回填后，跑一次内容契约校验（**这是 L3 gate 真正该跑的地方**，Phase 1 不跑）：
  ```bash
  node PPTMAKER_FRAMEWORK/scripts/stage1_build_inputs.mjs \
    --validate --input deck_{NAME}/3_versions/v1/slide-specifications.md
  ```
  ERROR 清零（不再有占位符 / 缺 IMAGE PROMPT / body+header-lock 页缺 TITLE）才进 Phase 3。管线在 Phase 3 首次运行前也会自动跑同一道校验兜底。

→ L3 回填并校验通过后进入 Phase 3。

---

## Phase 3: 生产管线

> 参考知识库：`workflow/04-production/`
> 这是**确定性执行阶段**——不问设计问题，只按脚本执行。

### 前置检查

确认 run bundle 的**源文件**已就位：
- `3_versions/v1/slide-specifications.md`（这一版的每页规格）
- `2_backbone/visual-style/style_master.jpg`（已锁定）
- `2_backbone/visual-style/deck_system.txt`

> **Novice Mode**：无需 `visual-style.md`（preset 的 README + color_palette.json + deck_system.txt 替代了它）。**Expert Mode**：额外有 `2_backbone/visual-style/visual-style.md`。
> 某一版要微调视觉/讲稿,放进该版的 `overrides/`(管线自动优先用 override,否则回退 backbone)。
> `3_versions/v1/_generated/` 的空壳由 `--init` 创建；真实 JSON、图片和 PPTX 由管线写入，你不要手工准备或编辑。
> **内容契约会自动把关**:Stage 1 每次运行前先跑 L3 校验(`validate_specs`),spec 有 ERROR 直接中止、一次列全,不会带着未填占位符或缺 TITLE 的页跑到最贵的生图那步。想提前手动看:`stage1_build_inputs.mjs --validate --input <spec>`。

### 执行管线

**推荐：使用统一管线脚本**（`scripts/unified_pipeline.mjs`）：

```bash
# 首次生产：先解析，再用 3 张代表页做 1K pilot
node PPTMAKER_FRAMEWORK/scripts/unified_pipeline.mjs \
  --run-dir deck_{NAME}/3_versions/v1 --stage 1
node PPTMAKER_FRAMEWORK/scripts/unified_pipeline.mjs \
  --run-dir deck_{NAME}/3_versions/v1 --stage 2 \
  --only opener_id,content_id,closer_id --resolution 1k

# Pilot 通过后，全量生成 2K，再完成 Header-Lock/PPTX/Notes
node PPTMAKER_FRAMEWORK/scripts/unified_pipeline.mjs \
  --run-dir deck_{NAME}/3_versions/v1 --stage 2 --resolution 2k --force-images
node PPTMAKER_FRAMEWORK/scripts/unified_pipeline.mjs \
  --run-dir deck_{NAME}/3_versions/v1 --stage 3,4,5

# 只跑某个 stage（如只重新 lock headers）
node PPTMAKER_FRAMEWORK/scripts/unified_pipeline.mjs \
  --run-dir deck_{NAME}/3_versions/v1 --stage 3
```

`--stage all` 适合视觉方向已经在 pilot 中验证过的重建；它执行技术管线，不替代用户对内容和视觉 Phase gate 的确认。

**如果 unified_pipeline.mjs 不可用**，手动按 Stage 1-5 执行（参考 `workflow/04-production/reference-pipeline-scripts.md`）。

### Stage 概述

每个 stage：运行 → gate check。产出全部写入 `3_versions/v1/_generated/`。适配参考 `workflow/04-production/reference-pipeline-scripts.md`。

| Stage | 产出（在 `_generated/` 下） | ⛔ Gate Check |
|-------|------|--------------|
| 1: Build Inputs | `_generated/slide_plan.json` + `_generated/page_prompts/`（每页一个 prompt 文件 + `_prompts.json`） | Slide 数量对？render mode 分类对？ |
| 2: Generate Images | `_generated/page_images_full/*.png` | Header zone 干净？Body text 可读？颜色一致？ |
| 3: Lock Headers | `_generated/header_locked/*.png` | full-page slides 标题完整？header-lock 页 header 没撞 body？ |
| 4: Build PPTX | `_generated/ppt/{NAME}.pptx` | Slide 数量对？顺序对？能正常打开？ |
| 5: Inject Notes | 修改 `_generated/ppt/{NAME}.pptx`（管线自动备份为 `.backup.pptx`） | 所有 slide notes 已填充？ |

每个 gate 不过 → 检查上游 → 修复 → 重跑该 stage。**Gate 不通过不往下走。**

Stage 2 每次完成后会自动更新 `_generated/preview/contact_sheet.jpg`。Pilot gate 以 contact sheet 为主要审查入口。

---

## Phase 4: 迭代维护

### 编辑链分类

当用户提出改动，先分类：

| 链 | 改了什么 | 走哪些 Stage | 耗时 |
|----|---------|-------------|------|
| **A** | Kicker/Title 文字 | 1 → 3 → 4 → 5 | ~5 min |
| **B** | Image prompt/画面 | 1 → 2 → 3 → 4 → 5 | ~5 min/page |
| **C** | Speaker notes | 5 only | ~30 sec |

> 配色、style master 或 deck-wide visual rules 改动属于全量 Chain B：重新生成 style master 后，运行 `--stage all --force-images`。否则 skip-if-exists 会保留旧视觉。

### 版本快照

重大下游改动 → 用 `bundle_layout.mjs --new-version deck_{NAME}/3_versions/v{n}` 创建干净版本。它只复制 `slide-specifications.md` + `overrides/`，不会复制旧 `_generated/`。砍/加 slide、重排、这一版单独换视觉方向属于新版本；改隐喻/公式/视觉主干是改 backbone（影响全版本），不是开新版本。

### 结构化迭代流程

大改动走结构化迭代流程（参考 `workflow/05-iteration/`）。核心模式：**提案 → 审核 → 实施 → 归档**——无论用什么工具。

在 Claude Code 中：
```bash
openspec-propose "Change: [description]"
# → proposal → review → approve → apply → archive
```

在其他 agent 环境中，同样的纪律适用：把你要改什么、为什么改写清楚，review 后再动手，改完记录 changelog。

改动结束后，更新对应文件的 Change Log:改 slide 更新 `slide-specifications.md` 的 change log;改主干更新 `2_backbone/` 里对应文件。

---

## Reference: 快速查阅表

### 方法论文件 → 覆盖主题

| 主题 | 文件 |
|------|------|
| Run bundle 架构 | `workflow/00-setup/` |
| 为什么要叙事优先 | `workflow/02-content/00-the-problem-why-slide-count-fails.md` |
| 怎么找隐喻和公式 | `workflow/02-content/01-find-the-core-metaphor-and-formula.md` |
| 怎么组织 Block | `workflow/02-content/02-build-narrative-arc-blocks.md` |
| 怎么写 slide 规格 | `workflow/02-content/03-specify-slides-multi-layer.md` |
| 怎么准备内容资产 | `workflow/02-content/04-create-content-assets.md` |
| 怎么版本迭代 | `workflow/02-content/05-iterate-with-version-discipline.md` |
| 为什么 text-based style 失败 | `workflow/01-visual/00-the-problem-why-text-fails.md` |
| 怎么调研产品 DNA | `workflow/01-visual/01-gather-product-context-dna.md` |
| 怎么设计视觉系统 | `workflow/01-visual/02-design-the-visual-system.md` |
| 怎么写 style master prompt | `workflow/01-visual/03-write-the-style-master-prompt.md` |
| 怎么 review 和 lock | `workflow/01-visual/04-iterate-review-lock.md` |
| 管线哲学和架构 | `workflow/04-production/00-the-pipeline-philosophy.md` |
| Stage 1-5 详解 | `workflow/04-production/01-05-stage-N-*.md` |
| Prompt 怎么写 | `workflow/03-prompts/02-prompt-structure-and-patterns.md` |
| Style Anchoring | `workflow/03-prompts/03-style-anchoring-in-practice.md` |
| 迭代引擎怎么用 | `workflow/05-iteration/` |

### 模板 → 复制到 Run Bundle

| 模板 | → Run Bundle 位置 | Phase |
|------|-------------------|-------|
| `workflow/02-content/template-core-metaphor.md` | `2_backbone/core-metaphor.md` | 1 |
| `workflow/02-content/template-core-formula.md` | `2_backbone/core-formula.md` | 1 |
| `workflow/02-content/template-design-constraints.md` | `2_backbone/design-constraints.md` | 1 |
| `workflow/02-content/template-slide-specifications.md` | `3_versions/v{n}/slide-specifications.md` | 1 |
| `workflow/01-visual/template-visual-style.md` | `2_backbone/visual-style/visual-style.md` | 2 |
| `workflow/00-setup/template-deck-guide.md` | `deck-guide.md` + `CLAUDE.md`（一行指针） | 0 |
| `workflow/03-prompts/template-image-prompt-builder.md` | 参考（不复制）——写 IMAGE PROMPT 时对照 | 1 & 2 |

### 管线脚本 → Stage

| 脚本 | 用途 | Phase |
|------|------|-------|
| `scripts/bundle_layout.mjs` | **目录结构唯一事实源**——所有脚本 import 它取路径 | 全程 |
| `scripts/stage1_build_inputs.mjs` | markdown → slide_plan.json + page_prompts/ | 3 |
| `scripts/stage3_lock_headers.mjs` | Header-Lock：@napi-rs/canvas 叠加标题文字 | 3 |
| `scripts/stage4_build_pptx.mjs` | 图片 → PPTX 容器 | 3 |
| `scripts/stage5_inject_notes.mjs` | Speaker notes 注入 PPTX | 3 |

所有脚本是参考实现，通过 `unified_pipeline.mjs --run-dir deck_{NAME}/3_versions/v1` 就地运行（不复制进 run bundle）。需要适配项目时（换字体、canvas 尺寸、API），修改 `scripts/` 里脚本顶部的 `# Customization` 常量。改目录结构只改 `bundle_layout.mjs`。

### 迭代工具（以 OpenSpec 为例）

OpenSpec 是 Claude Code 中结构化迭代的一种实现。核心模式（提案→审核→实施→归档）适用于任何 agent 环境——即使没有 OpenSpec，你也应该先写下要改什么和为什么，review 后再动手，改完记录 changelog。

| OpenSpec 命令 | 对应模式步骤 | Phase |
|--------------|------------|-------|
| `openspec-propose` | 提案——明确改什么、为什么、影响范围 | 1, 2, 4 |
| `openspec-apply-change` | 实施——按 proposal 执行变更 | 1, 2, 4 |
| `openspec-archive-change` | 归档——记录变更，保持 change log 干净 | 1, 2, 4 |

### 变更类型 → 影响范围

| 变更类型 | 覆盖 |
|---------|------|
| 叙事框架 | 隐喻、公式、Block 重组、slide 重排 |
| 案例锚点 | 案例增删换 |
| 内容约束 | 设计约束、语言策略 |
| 管线脚本 | 管线脚本、stage 流程 |
| 管线操作 | 具体 pipeline 操作 |
