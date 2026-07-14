---
title: ANTI_PATTERNS — 框架级常见错误
stage: root
position: appendix
type: reference
summary: 使用本框架时最容易犯的 10 个错误——每个都有修复路径。
depends_on:
- README.md
feeds_into: []
agent_action: internalize
---

# ANTI_PATTERNS — 框架级常见错误

每个模块内部都有自己的 anti-patterns（如 "不要用 clip art"、"不要把认知解释写进 image prompt"）。这里的 10 个是**框架级的**——在使用整个体系时最容易犯的错误。它们来自真实项目的教训。

---

## 1. 跳过内容设计，直接开始生产

> "先让 AI 生成几张 slide 看看效果。"

这是最常见的错误。跳过 Phase 1（内容设计），直接跑到 Phase 3（生产管线），让 AI 根据一个模糊的 topic 生成 slides。

**症状**：生成的 slides 看起来不错，但拼在一起没有论证力。你不知道 Slide 7 和 Slide 8 之间是什么关系，也不知道整个 deck 到底在主张什么。

**修复**：回到 Phase 1。先找到核心隐喻和公式，再构建 Block map，最后写 slide 规格。**内容没有锁定之前，不要生成任何 slide。**

---

## 2. 把 IMAGE PROMPT 当文学作品写

> "This slide captures the profound tension between traditional manufacturing wisdom and the relentless march of digital transformation..."

这是给 AI image model 的 prompt，不是给投资人看的 vision statement。Model 不需要知道 "profound tension"——它需要知道 left panel 的 y 坐标、right panel 的颜色 hex、card border 的粗细。

**症状**：生成的画面和你想的完全不一样。颜色错了，布局乱了，文字出现在了不该出现的地方。

**修复**：IMAGE PROMPT 是**空间执行指令**，不是文学作品。结构：Layout 分区 → Zone 描述 → 颜色语义 → 精确文字 → Anti-patterns。把最重要的信息（y 坐标、颜色 hex、文字 wording）放最前面。

参见 `workflow/03-prompts/02-prompt-structure-and-patterns.md`。

---

## 3. 为改一个字跑完整管线

> "Slide 8 的标题改成...我们跑一遍完整管线吧。"

从头跑 Stage 1-5 可能浪费 20 分钟在不必要的重跑上（尤其是 Stage 2 生图）。先查标题由谁渲染：raw-image contract 不变的 `body+header-lock` header 不需要重新生图；full-page header 或 body 文字烧在图里，仍需要重生。

**症状**：每次小改动都要等 20 分钟，迭代速度越来越慢，团队逐渐放弃 review。

**修复**：按所有权和失效产物选择最小刷新路径：

| 路径 | 改了什么 | 逻辑执行 | 耗时 |
|------|---------|---------|------|
| Header Text & Style Refresh | body+header-lock 的 KICKER/TITLE/SUBTITLE 或 Stage-3-owned 样式，raw-image contract 不变 | 1 → 3 → 4 → 5 | ~5 min |
| Generated Image Rebuild | full-page header、body/image prompt/画面，或 mode/safe-zone | 1 → 强制所选 2 → review → 3/4/5 | ~5 min/page |
| Notes-Only Refresh | Speaker notes only | 5 only | ~30 sec |

参见 `workflow/04-production/00-the-pipeline-philosophy.md`。

---

## 4. 直接改派生文件

> "这张 PNG 的 header 位置偏了 2px，我用 Photoshop 修一下。"

`page_images_full/*.png`、`header_locked/*.png`、`ppt/*.pptx` 都是**派生品**——它们从源文件（markdown）通过管线脚本生成。如果你直接改了 PNG，下次重跑脚本时改动会被覆盖。

**症状**：改动莫名其妙地消失了。或者更糟——改动还在但你不知道为什么，因为改动路径不可追溯。

**修复**：改动永远从源文件开始。resolved `body+header-lock` 的 header 文字 → 改 markdown 的 TITLE 字段 → Header Text & Style Refresh；full-page header 或 body 文字 → Generated Image Rebuild。**源文件是 single source of truth。**

参见 `charter/CONSTITUTION.md` 的 "源文件 vs 派生品"。

---

## 5. 不做版本快照，或把 backbone 改动误当新版本

> "v2 改了 5 张 slide，v3 又加了 3 张...都在同一个目录里改的。现在我想回到 v1 看看原来的版本，但已经找不到了。"

不创建新版本快照，所有改动在同一个目录里叠加，无法回溯。

**症状**：你不记得 v1 长什么样。客户问 "能回到上周那个版本吗"——你不能。你想对比 "改 Block 结构前后怎么变了"——没法 diff。

**修复**：需要留档时运行 `bundle_layout.mjs --new-version deck_X/3_versions/v{n}`。它只复制下游源 delta，并创建干净 `_generated/`，不会把旧图片和 PPTX 带进新版本。

**但注意分清"改哪一层"**（这是常见误区）：
- **新版本 = 下游 slide 改动**：砍/加 slide、重排、这一版单独换视觉（放 `overrides/`）。
- **改 backbone ≠ 新版本**：改核心隐喻/公式/视觉主干,是改 `2_backbone/` 里的文件——它**影响所有版本**,不是开新版本。判据:"这个改动只属于这一版,还是属于整个 deck?"
- 小改动（改标题文字、改 speaker note）直接在当前版本改。

参见 `workflow/02-content/05-iterate-with-version-discipline.md`（"什么是一个版本"）和 `workflow/00-setup/04-conventions.md`。

---

## 6. 试图完全自动化，跳过 human judgment

> "我写了一个脚本，输入 topic 自动输出 PPTX——不需要人介入。"

但你需要人回答这些问题：核心隐喻对吗？这个 case 对 audience 有说服力吗？这个 color palette 是 audience 期望的吗？标题 claim 能在 5 秒内被反驳吗？

**症状**：生成的 deck 在技术上 "没问题"，但感觉不对。隐喻是 AI 编的漂亮话，没有 tension。案例是 AI hallucinate 的，不能当真。视觉是 generic "dark corporate"，不属于这个 client。

**修复**：这个框架的闸门（gate check）机制就是为了强制 human judgment 介入而设计的。**Agent owns process——按流程引导你。你 owns substance——在每一个闸门前做判断。** 不要试图绕过闸门。

参见 `AGENTS.md` 的 "Role" 部分。

---

## 7. 锁定 style master 太早

> "生成了第一版 style_master.jpg，看起来不错，锁了吧。"

但你没有检查：颜色语义在整份 deck 中能保持一致吗？KPI card 的 border style 在 flow diagram 的 node style 旁边协调吗？Typography hierarchy 的四个层级在浅色 slide 和深色 slide 上都能读吗？

**症状**：到第 12 张 slide 时发现 accent color 在某些布局中太刺眼——但 style master 已经锁了。改 style master = 前面 11 张全部重新生图。

**修复**：用 `workflow/01-visual/04-iterate-review-lock.md` 里的 checklist 系统性审查。做一张 contact sheet 把 style master 和几张代表性 slides 放在一起对比。**Path A（95%+ pass）→ Lock。Path B（80-95%）→ 微调。Path C（<80%）→ 回到设计。** 不在 Path A 不要 lock。

参见 `workflow/01-visual/04-iterate-review-lock.md`。

---

## 8. 临场发挥目录结构

> "我觉得把生成的图放这儿更顺手" / "我建个 session_design/ 装内容吧" / "prompt 我直接写一个大 JSON 得了"。

run bundle 的目录结构是这个框架的**宪法**——它不是建议,是契约。第一个真实项目(`deck_ai_sdlc_keynote`)就是因为每个 session 各自发挥,长出了 5 层嵌套 `v1/production/work/deck/`、空目录、命名各异——agent 完全晕掉,不知道该往哪写(这就是 bug 0005 的根)。

**症状**：目录越来越深、越来越乱;同一种东西有两个可能的家,agent 两个都建、填错一个;换个 session 接手完全看不懂;改一个东西要在好几处同步。

**修复**：结构的唯一事实源是 `scripts/bundle_layout.mjs`。
- 不自创目录名、不把生成物乱放、不新造 prompt 文件格式。
- 不确定就查:`node PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs`(打印权威树)。
- 校验一个 bundle 合不合规:`node PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs --check deck_{NAME}/3_versions/v1`。管线每次运行前也会自动 check,结构不对直接拒绝。
- 只有两处是你手改的源:`2_backbone/`(主干)和 `3_versions/v{n}/`(这版的 slide 规格 + overrides)。其余全是 `_generated/` 派生品,绝不手动放。

参见 `charter/CONSTITUTION.md` 和 `scripts/bundle_layout.mjs`。

---

## 9. 用旧词 `image_direct` / `normal` 写规格或文档

> "这张是 image_direct" / "normal slide 顶部留白"

唯一对外词汇是 **`full-page`** 和 **`body+header-lock`**。旧词只在输入端兼容（旧 specs 仍能解析），新写的 specs、文档、changelog 禁止再用。

**修复**：一律写 RENDER MODE。见 [glossary.md](glossary.md) 与 [charter/AGENT_CONTRACT.md](../charter/AGENT_CONTRACT.md) §6。

---

## 10. 通读 AGENTS.md 当入口，却不读 AGENT_CONTRACT

> Agent 每次把 600 行 playbook 塞进上下文，铁律反而漂了。

**修复**：入口是 BOOTSTRAP → **AGENT_CONTRACT（一页）** → 按 Lifecycle Phase 翻 AGENTS 对应节。见 [charter/AGENT_CONTRACT.md](../charter/AGENT_CONTRACT.md)。

---

> 每个 anti-pattern 都来自真实项目的痛点。如果你发现自己犯了其中一个——恭喜，你正在经历和其他人一样的学习曲线。回到对应的模块，按方法论修，继续走。
