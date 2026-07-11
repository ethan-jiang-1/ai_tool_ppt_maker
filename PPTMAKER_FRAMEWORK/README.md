---
title: PPT 信息加工流
stage: root
position: entry
type: overview
summary: "PPT 四阶段加工流总入口。Agent 首先读此文件理解体系全貌，然后按 depends_on 导航到 workflow/00-setup。"
depends_on: []
feeds_into:
- workflow/00-setup/README.md
agent_action: navigate
---

# PPT 信息加工流

> **先读这个。**
> 这是 `PPTMAKER_FRAMEWORK/` 的总入口。读完你会理解整个体系是什么、为什么需要它、以及怎么用。
>
> **第一次来（人类）？** 看 [Quick Start](reference/quick-start.md)——5 分钟找到你的路径。
> **你是 Agent？** 操作入口：[BOOTSTRAP.md](BOOTSTRAP.md) → [charter/AGENT_CONTRACT.md](charter/AGENT_CONTRACT.md)（11 条铁律）→ 按 Phase 翻 [AGENTS.md](AGENTS.md)。本 README 讲"是什么/为什么"。

## 一句话

**这是一个从原始输入到最终 PPTX 的完整信息加工流——由文件系统驱动，每个阶段有明确的输入/加工/输出，所有中间产物可检查、可回溯、可独立重跑。**

它不是一个工具集，不是一堆 loose scripts，也不是一个 "万能 PPT 模板"。它是一个**数据加工体系**——原材料从一端进入，经过逐阶段加工，成品从另一端输出。做好 PPT 不是靠一个 "好的 prompt" 或一个 "好看的模板"——是靠一个有结构的加工过程。

## 核心哲学：文件系统即 Workflow 引擎

不需要 Jenkins。不需要 Airflow。不需要 YAML pipeline 配置。

**目录 = Stage。文件 = 交接物。版本快照 = 完整复制。Git = 审计追踪。**

```
PPTMAKER_FRAMEWORK/
  ├── BOOTSTRAP.md                      ← Agent 启动（env → intake → build）
  ├── charter/AGENT_CONTRACT.md         ← Agent 一页铁律（每次 session 先内化）
  ├── AGENTS.md                         ← Phase 详解手册（按需翻，勿整本通读）
  ├── CLAUDE.md                         ← 自动加载桩 → BOOTSTRAP
  ├── README.md                         ← 你在读这个（是什么/为什么）
  ├── COMMANDS.md                       ← 附录：自然语言 → playbook 意图路由
  ├── reference/quick-start.md          ← 新用户 5 分钟入口
  ├── reference/anti-patterns.md        ← 框架级常见错误
  ├── reference/glossary.md             ← 术语表
  ├── workflow/00-setup/                ← Foundation：项目初始化与环境
  ├── workflow/01-visual/               ← 视觉方法模块
  ├── workflow/02-content/              ← 内容方法模块
  ├── workflow/03-prompts/              ← Skill Layer：Image Prompts
  ├── workflow/04-production/           ← Phase 3：生产管线（内部含 Stage 1-5）
  ├── workflow/05-iteration/            ← Iteration Engine：持续打磨
  └── scripts/                          ← Node.js 管线脚本（ppt_flow / stages）
```

对 coding agent 来说，文件是原生操作对象——读、写、搜索、diff、提交。不需要学习任何新抽象。`ls` 看进度，`git log` 看变更，`diff -r v2 v3` 看差异。

## 体系架构

### 三个宏观 Phase

这三个 Phase 有先后依赖——内容架构与视觉系统都锁定后才能进入生产。

| # | 模块 | 做什么 | 核心产出 |
|---|------|--------|---------|
| 1 | `workflow/02-content/` | 设计内容架构——隐喻、公式、叙事弧、slide 四层规格 | deck brief (markdown) |
| 2 | `workflow/01-visual/` | 设计视觉系统——颜色、字体、布局、组件、装饰 | `style_master.jpg` + 视觉规范文档 |
| 3 | `workflow/04-production/` | 把内容和视觉合成 PPTX——五阶段管线 | `.pptx` 文件 |

**Phase 1 和 Phase 2 可以交换起始顺序**（如果用户带着强烈视觉方向进来），但 L3 IMAGE PROMPT 必须等视觉锁定后回填。Phase 3 必须在内容与视觉都锁定后才能启动。

### 两个支撑层（Supporting Layers）

这两层不产出独立文件，而是贯穿全流程赋能。

| 层 | 模块 | 角色 |
|----|------|------|
| 技能层 | `workflow/03-prompts/` | 赋能所有 IMAGE PROMPT 写作——同时服务内容规格和 style master meta-prompt |
| 迭代层 | `workflow/05-iteration/` | 把"反复改、来回调"变成结构化流程——贯穿全流程，在大改动（改隐喻、改 palette、重构 slide）时介入 |

### 信息是怎么流动的

```
客户 brief / 研究材料 / 听众画像（原始输入）
        │
        ├──→ [Content Design]  ──→  slide 内容规格 (.md)
        │         │                        │
        │         │  IMAGE PROMPT 层        │
        │         ↓                        │
        │   [Image Prompts]（技能层）        │
        │         │                        │
        │         │  赋能 IMAGE PROMPT 写作    │
        │         ↓                        │
        ├──→ [Visual Style Master]──→  style_master.jpg
        │         │                        │
        │         └────────────────────────┤
        │                                  ↓
        └────────────────→ [Production Pipeline]
                                           │
                                           ↓
                                      final.pptx

        [Iteration]（迭代层）← ─ ─ → 任何阶段的大改动都走结构化迭代
```

## 适合谁

- 用 AI image model 做多页 PPT 的人——不管是 strategy deck、keynote、investor pitch、product launch
- 需要和多方协作的人——content designer、visual designer、演讲者各负责不同层
- 需要版本化管理和可回溯 build process 的人——不是 "生成一次就完了"，而是持续迭代
- 想理解整个体系怎么 work 的人——不只是 "用哪个工具"，而是 "为什么这个阶段存在、它消费什么、产出什么"

## 不适合谁

- 你只做单张图，不是多页 deck——用 image generation skill 直接生成
- 你用传统 PowerPoint 手动搭建——不需要管线
- 你的 deck 内容永远不会变（一次性使用）——不需要版本化
- 你的 text-only image model 不支持 reference image——style anchoring 的前提不成立

## 怎么开始

### 学习路径

1. 读这个 README。理解体系架构。
2. 读 `workflow/00-setup/`。理解文件系统架构（soft bundle vs run bundle）、目录结构、命名约定。**run bundle 的目录结构是框架的"宪法"**——唯一事实源是 `scripts/bundle_layout.mjs`（跑它看权威树、`--check` 校验一个 bundle），人读镜像是 `charter/CONSTITUTION.md`。不要临场发挥目录。
3. **按需深入**：根据你在哪个阶段，进入对应的子目录。每个子目录有自己的 README 和阅读路径。
   - 需要设计视觉 → `workflow/01-visual/`
   - 需要设计内容 → `workflow/02-content/`
   - 需要写更好的 prompt → `workflow/03-prompts/`
   - 需要搭建管线 → `workflow/04-production/`
   - 需要理解迭代机制 → `workflow/05-iteration/`

### 执行路径（有项目要做时）

1. **先做 02**（Content Design）——搞清楚你要说什么、按什么顺序说。产出 deck brief。
2. **做 01**（Visual Style Master）——设计视觉系统。产出 style_master.jpg。
3. **贯穿使用 03**（Image Prompts）——在写 style master prompt 和 slide IMAGE PROMPT 时参考。
4. **跑 04**（Production Pipeline）——把内容和视觉合成为 PPTX。产出 `.pptx`。

01 和 02 可以交换顺序，也可以同时做。

## 关键原则

### 1. 分离关注点

- 内容（02）和视觉（01）是独立维度——不同的 slide 内容可以配不同的 visual style master；同一个 visual style master 可以用在多份 content 上
- AI 负责创意视觉，Node `@napi-rs/canvas`（Header-Lock）负责精确标题文字——两者各有擅长，不要用一个替代另一个

### 2. 文件系统原生

- 不引入 database、workflow server、pipeline YAML
- 目录结构本身就是编排层
- 所有中间产物人类可检查（打开就能看）

### 3. 版本快照

- 每次重大下游改动用 `bundle_layout.mjs --new-version ...` 创建干净版本
- Changelog 记录什么变了、为什么——"原因"比"做什么"更重要
- 方法论文件在 Git 中版本管理；项目产出物在项目目录中管理

### 4. 方法论优先，案例辅助

- 每个方法论文件都先讲通用原则，再给案例 illustration
- 案例来自 T10 项目（precision manufacturing AI strategy keynote），但方法论是 industry-agnostic 的
- 学的是**思路**，不是那个案例的具体内容

## 这种体系证明了什么

这个体系源于一个完整的生产实践——从客户 brief 到最终 keynote PPTX，全程由 coding agent 在文件系统中完成。证明了：

1. **文件系统 + 明确的分阶段加工流 > workflow 工具 + ad-hoc 脚本**
2. **分离关注点（内容 × 视觉 × 生产）让每个维度的迭代独立、可并行**
3. **Header-Lock 机制从根本上解决了 AI 生图的文字一致性问题**
4. **这套模式适用于任何 "信息 → 文档" 的加工场景**——不只是 PPT

## 什么时候你不再需要这个框架

这个框架的目标不是让你永远依赖它，而是让你内化方法论后独立操作。以下是你 "毕业" 的标志：

1. 你完成过至少一个完整的 deck（brief → PPTX），走完了 Phase 0-4
2. 你能不用翻 AGENTS.md 就判断一个改动属于哪条编辑链（A/B/C）
3. 你能向同事解释 Header-Lock 为什么存在
4. 你已经为至少一个管线脚本做了适配（换了自己的 API、字体、canvas 尺寸）
5. 你写 slide 的四层规格时已经不需要对照模板——肌肉记忆形成了

在这之前，把 AGENTS.md 放在侧边栏。它不是训练轮，是你的 copilot。

---

> **Next**: `workflow/00-setup/` — 理解文件系统架构：soft bundle vs run bundle，以及项目目录模板。
>
> **遇到问题？** 先查 [ANTI_PATTERNS](reference/anti-patterns.md)——你可能撞上了常见错误之一。
