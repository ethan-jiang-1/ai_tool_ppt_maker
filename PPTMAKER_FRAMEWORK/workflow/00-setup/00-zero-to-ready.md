---
title: 00 — Zero to Ready：你需要什么
stage: workflow/00-setup
position: pre-setup
type: guide
summary: 给从没用过 terminal、Node.js、AI agent 的人。3 分钟理解你需要什么、为什么需要，然后 Agent 接管一切。
depends_on: []
feeds_into:
- workflow/00-setup/README.md
agent_action: guide
---

# Zero to Ready：你需要什么

> 你不需要懂编程。你只需要理解这三样东西各自是干什么的。之后 Agent 会接管所有技术操作。
>
> **操作步骤不在这里。** Agent 会在 [BOOTSTRAP.md](../../BOOTSTRAP.md) Step 1 中一步步引导你完成环境检查与修复——你只需要跟着做。

## 三样东西

| # | 东西 | 是什么 | 你很可能已经有了？ |
|---|------|--------|-------------------|
| 1 | **AI coding agent** | 一个能读文件、写文件、跑命令的 AI 助手（Claude Code / Codex / Cursor） | ✅ 如果你正在跟 agent 对话——你已经有了 |
| 2 | **Node.js + npm** | 运行生产管线的 JavaScript 环境（Node 18+） | ✅ Claude Code 和 Codex 都要求先装 Node.js——你大概率已经有了 |
| 3 | **GPT Image 2 API key** | 生成图片的权限（一串 `sk-...` 开头的 key）+ 一个 base URL | ❓ 这个可能需要你注册/获取 |

**核心洞察**：如果你在用 Claude Code 或 Codex，你已经有了前两样。Agent 会跑 `doctor` 确认——真正需要你动手的，很可能只是拿一个 API key 和跑一次 `npm install`。

---

## 这三样东西各自干什么

### 1. AI coding agent

这是你跟 PPT 制作体系的**对话界面**。你把想法告诉它，它读文档、跑命令、写文件、生成图片、打包 PPTX。

你不用管它怎么做的——你只负责在关键节点做判断（"这个隐喻对吗？""这个颜色合适吗？"）。

### 2. Node.js + npm

这是 PPT 制作体系的**运行环境**。它提供：
- `@napi-rs/canvas` — 在图片上精确叠加标题文字
- `pptxgenjs` — 把图片打包成 .pptx 文件
- `commander` — CLI 命令解析

Agent 第一次运行时会检查这个环境。如果缺了什么，它会告诉你具体怎么装——你复制粘贴一条命令就行。

### 3. GPT Image 2 API key + Base URL

这是**出图能力**。没有它，Stage 2 生不了图，PPT 就做不出来。

你需要两样东西：
- **API Key**（`IMAGE2_API_KEY`）：一串 `sk-...` 开头的密钥。去 [platform.openai.com](https://platform.openai.com) → API keys 创建，或向中转服务商获取。
- **Base URL**（`IMAGE2_BASE_URL`）：API 的访问地址，如 `https://api.xxx.com/v1`。

Agent 会引导你把它们写进 `.env` 文件（一行 key、一行 URL），然后自动加载。

---

## 下一步

打开你的 AI coding agent，把这段话贴进去：

```
我想做一个 PPT，请引导我。先读 PPTMAKER_FRAMEWORK/BOOTSTRAP.md，
然后一步步带我走（我是新手，请多给我选择题、少让我做问答题）。

我目前知道的：
- Topic: [你的 topic，不确定就写个大概]
- 听众: [谁看、角色、懂不懂技术]
- 时长/场合: [多长、有没有 breakout]
- 语言: [slides 语言 / 演讲语言]
- 我有: API key（或需要帮助获取）。请先检查我的环境（`node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor`），告诉我还需要装什么
```

Agent 会从 BOOTSTRAP.md 开始——先检查环境（缺什么告诉你），再问 5 个选择题，带你选隐喻、选风格，最后搭出 PPT。

---

> **准备好了？** 把上面的 conversation starter 贴进你的 agent。它会读 [BOOTSTRAP.md](../../BOOTSTRAP.md) 然后带你走。
