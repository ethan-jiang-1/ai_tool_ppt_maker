---
title: Quick Start
stage: root
position: quickstart
type: guide
summary: 新用户入口。你不需要懂目录结构或管线——把想法告诉 agent,它跟你对话、边聊边搭。你只做内容判断。
depends_on:
- README.md
feeds_into:
- AGENTS.md
agent_action: navigate
---

# Quick Start — 给第一次用的人

> **一句话:你负责想清楚要讲什么,agent 负责把它搭出来。** 你不需要懂目录结构、不需要懂管线、不需要写代码。跟着对话走就行。

## 它怎么工作(先建立预期)

这不是"填个表单点生成"。它更像**和一个懂行的设计师对话**:

1. **你说个大概**——想做什么 PPT、给谁看、多长时间。哪怕只有个模糊想法也行。
2. **agent 跟你反复聊,帮你想清楚**——它会给你 2-3 个隐喻候选让你选、推荐视觉风格让你挑、把你的想法整理成骨架。**你做选择题,不做问答题。**
3. **想清楚了,它才开始搭框架**——建目录、写规格、生成图片、打包成 PPTX。这一步你基本不用管。
4. **搭完后,框架里留了一份 continuation card**(`deck-guide.md`)——带原始本地路径交给 repository Agent，并直接说你想怎么改；当前进度由 state/status 读取。

**关键:前三步是"想清楚",第 3 步才是"生产"。别急着生产——想清楚了再搭,能省掉大量返工。**

## 你要准备的(不用很完整,聊的过程会补齐)

1. **一个具体的 topic** — 不是 "AI strategy",而是 "我的工厂如何在 AI 采购时代不被淘汰"。
2. **听众是谁** — 谁坐在下面?他们的角色、懂不懂技术、想带走什么。
3. **多长、什么场合** — 40 分钟 keynote?有没有 breakout?
4. **语言** — slides 上用什么语言?演讲用什么语言?(可以不同)
5. **一个 AI coding agent** — Claude Code / Codex / Cursor 都行。GPT Image 2 API 只在选择远程出图路径时再配置。

想不清楚也没关系——第 2、3、5 条 agent 会追问帮你厘清。

## 怎么开始:把这段话贴给你的 agent

```
我想做一个 PPT,请引导我。先读 PPTMAKER_FRAMEWORK/BOOTSTRAP.md,
然后一步步带我走(我是新手,请多给我选择题、少让我做问答题)。

我目前知道的:
- Topic: [你的 topic,不确定就写个大概]
- 听众: [谁看、角色、懂不懂技术]
- 时长/场合: [多长、有没有 breakout]
- 语言: [slides 语言 / 演讲语言]
- Image2: 暂时不用 / 我有 API key / 需要帮助获取（任选）。请先检查本地环境（`node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor`），告诉我还需要装什么
```

agent 会从环境检查开始,然后问你 5 个选择题(类型、听众、时长、语言、最想让人记住什么),再带你选隐喻、选风格,最后搭出框架。Agent 入口是 BOOTSTRAP → AGENT_CONTRACT（11 条铁律）→ 按 Phase 翻 AGENTS。

## 你负责什么 vs agent 负责什么

| 你负责(内容判断) | agent 负责(所有技术活) |
|------------------|----------------------|
| 隐喻对不对、有没有打动你 | 建目录结构(有一套固定"宪法",它不会乱来) |
| 案例可不可信、有没有说服力 | 写 slide 规格、拼 prompt |
| 颜色/风格喜不喜欢 | 调 GPT Image 2 生图 |
| 每页的 claim 站不站得住 | Header-Lock 叠标题、打包 PPTX |
| 哪里要改 | 判断改动影响范围、最小重跑 |

**你永远不需要**:记目录长什么样、记管线几个 stage、手动跑脚本、直接改图片或 JSON。

## 搭完之后:框架里有给你的说明书

生产完成后,你的项目目录(`deck_{NAME}/`)里会有一个 **`deck-guide.md`** continuation card——它绑定该 deck 的静态身份和 framework relation。把有可读本地路径的原始文件交给 repository Agent，并说你想改什么；Agent 每次从 state/status 获得当前进度。
- 下一步可以做什么

**这份说明是给你(人)看的,不是给机器看的。** 一进去不会不知所措。

## 想深入了解方法论?(可选,不是必需)

第一次做**完全不用读下面这些**——跟着 agent 走就行。做完一遍、想理解"为什么这么设计"时再回来:

- `workflow/01-content/00-03` — 为什么叙事优先、怎么找隐喻和公式
- `workflow/02-visual-system/00,02,03` — style anchoring 怎么工作
- `workflow/03-html-production/00` — 管线哲学和 Header-Lock
- `charter/CONSTITUTION.md` — 目录结构(宪法)的人读版

---

> **准备好了?** 把上面的对话起点贴进你的 agent。它会读 [BOOTSTRAP.md](../BOOTSTRAP.md) 然后带你走。
