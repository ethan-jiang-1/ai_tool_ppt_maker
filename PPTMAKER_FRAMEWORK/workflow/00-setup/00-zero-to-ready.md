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

> 你不需要懂编程。你只需要理解下面这些东西各自是干什么的。之后 Agent 会接管所有技术操作。
>
> **操作步骤不在这里。** Agent 会在 [BOOTSTRAP.md](../../BOOTSTRAP.md) Step 1 中一步步引导你完成环境检查与修复——你只需要跟着做。

## 默认只需要两样东西

| # | 东西 | 是什么 | 你很可能已经有了？ |
|---|------|--------|-------------------|
| 1 | **AI coding agent** | 一个能读文件、写文件、跑命令的 AI 助手（Claude Code / Codex / Cursor） | ✅ 如果你正在跟 agent 对话——你已经有了 |
| 2 | **Node.js + npm + Chromium** | 本地生产 runtime（Node 22/24/26，新装推荐 24）与 HTML 浏览器 | ❓ Agent 会用 doctor 确认 |

framework 已经自带 HTML runtime 所需的 Source Sans 3 / Noto Sans SC WOFF2 字体，用户不用安装系统字体，也不用联网下载字体。首次本地 setup 通常只需 repo-root `npm install` 与 `npm run setup:chromium`。

**可选第三样**：只有选择付费/远程的 Image2 路径时，才需要 GPT Image 2 API key + base URL。默认本地 doctor READY 不要求它们。

---

## 这些东西各自干什么

### 1. AI coding agent

这是你跟 PPT 制作体系的**对话界面**。你把想法告诉它，它读文档、跑命令、写文件、生成图片、打包 PPTX。

你不用管它怎么做的——你只负责在关键节点做判断（"这个隐喻对吗？""这个颜色合适吗？"）。

### 2. Node.js + npm

这是 PPT 制作体系的**运行环境**。它提供：
- `@napi-rs/canvas` — 在图片上精确叠加标题文字
- `pptxgenjs` — 把图片打包成 .pptx 文件
- `commander` — CLI 命令解析

Agent 第一次运行时会检查这个环境。如果缺了什么，它会告诉你具体怎么装——你复制粘贴一条命令就行。

Node profile 只支持 22.x、24.x、26.x；coding agent 自己能运行不代表当前 Node 一定符合 framework。Agent 会先检查，随后安装 repo 依赖和配对 Chromium。字体已在 framework 包内。

### 3. GPT Image 2 API key + Base URL（可选）

这是显式选择的远程 Image2 能力。没有它仍可完成 HTML 本地环境检查和本地工作；进入 `image2-only` whole-page 远程生成或授权 visual-slot refinement 时才需要。

你需要两样东西：
- **API Key**（`IMAGE2_API_KEY`）：一串 `sk-...` 开头的密钥。去 [platform.openai.com](https://platform.openai.com) → API keys 创建，或向中转服务商获取。
- **Base URL**（`IMAGE2_BASE_URL`）：API 的访问地址，如 `https://api.xxx.com/v1`。

Agent 会在你选择 Image2 后引导你把它们写进 `.env`，先用离线 `doctor --image2` 检查。任何会真实提交 provider 的 live probe 都会先告诉你提交次数并征得同意。

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
- Image2: 暂时不用 / 我有 API key / 需要帮助获取（任选）。请先检查本地环境（`node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor`），告诉我还需要装什么
```

Agent 会从 BOOTSTRAP.md 开始——先检查环境（缺什么告诉你），再问 5 个选择题，带你选隐喻、选风格，最后搭出 PPT。

---

> **准备好了？** 把上面的 conversation starter 贴进你的 agent。它会读 [BOOTSTRAP.md](../../BOOTSTRAP.md) 然后带你走。
