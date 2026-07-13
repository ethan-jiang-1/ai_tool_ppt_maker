---
title: 00 — Zero to Ready：零基础 20 分钟准备
stage: workflow/00-setup
position: pre-setup
type: guide
summary: 给从没用过 terminal、Node.js、AI agent 的人。20 分钟装好三样东西，然后 agent 接管一切。
depends_on: []
feeds_into:
- workflow/00-setup/README.md
agent_action: guide
---

# Zero to Ready：零基础 20 分钟准备

> 你不需要懂编程。你只需要装好三样东西。之后 agent 会接管所有技术操作。

## 你需要三样东西

| # | 东西 | 是什么 | 你要做什么 |
|---|------|--------|-----------|
| 1 | **AI coding agent** | 一个能读文件、写文件、跑命令的 AI 助手 | 安装 + 打开 |
| 2 | **Node.js + npm** | 运行生产管线的 JavaScript 环境（Node 18+） | agent 帮你装 |
| 3 | **GPT Image 2 API key** | 生成图片的权限 | 注册账号，复制一串 key |

装完这三样，把 conversation starter 贴进 agent，你就进入了"回答问题 → agent 干活 → 你审核闸门"的循环。

---

## Step 1：安装 AI Coding Agent（5 分钟）

推荐 Claude Code。它是命令行工具，打开 terminal 贴一行命令就行。

### 如果你用 Mac

1. 按 `Cmd + Space`，输入 `Terminal`，回车。一个黑色（或白色）窗口打开了——这就是 terminal。
2. 复制下面这行，贴进去，回车：

```bash
npm install -g @anthropic-ai/claude-code
```

如果提示 `command not found: npm`，说明你的 Mac 还没有 Node.js。去 [nodejs.org](https://nodejs.org) 下载安装（选 LTS 版本，需 Node 18+），然后再跑上面的命令。

3. 安装完成后，在 terminal 里输入 `claude`，回车。第一次会要求你登录。

### 如果你用 Windows

1. 按 `Win` 键，输入 `PowerShell`，右键 → 以管理员身份运行。
2. 先去 [nodejs.org](https://nodejs.org) 下载安装 Node.js（选 LTS 版本，需 Node 18+）。
3. 安装完后，在 PowerShell 里运行：

```powershell
npm install -g @anthropic-ai/claude-code
```

4. 安装完成后输入 `claude`，回车。第一次要求登录。

### 其他选择

- **Codex**（OpenAI 的 agent）：在 codex.openai.com 注册
- **Cursor**（VS Code 风格的 agent）：在 cursor.com 下载

都可以——本框架是 agent-agnostic 的，只要 agent 能读文件、写文件、跑命令就行。

---

## Step 2：让 Agent 帮你装 Node.js + npm（5 分钟）

打开 Claude Code（在 terminal 里输入 `claude`），贴这段话：

```
I need Node.js 18+ and npm to run the PPTMAKER_FRAMEWORK production pipeline.
The repo is at /path/to/ai_tool_ppt_maker — please check what's installed,
run `npm install` in the repo root if needed, and verify with
`node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor`.
```

Agent 会检查你的系统，告诉你缺什么，帮你装好依赖。你只需要在它问"可以安装吗？"的时候说 yes。

---

## Step 3：拿到 GPT Image 2 API Key（10 分钟）

图片生成需要调用 GPT Image 2。你有两个选择：

### 选项 A：直接用 OpenAI（如果你有 OpenAI 账号）

1. 去 [platform.openai.com](https://platform.openai.com) 登录
2. 左侧菜单 → API keys → Create new secret key
3. 复制那串 `sk-...` 开头的 key

### 选项 B：用中转服务（如果 OpenAI 访问不便）

向你的组织或服务商获取中转 endpoint。你会拿到两样东西：
- 一个 URL（如 `https://api.xxx.com/v1`）
- 一串 API key

无论哪种方式，拿到后在 terminal 里设置环境变量：

```bash
export IMAGE2_API_KEY="你的key"
export IMAGE2_BASE_URL="https://你的-relay/v1"   # 必填；无静默默认 endpoint
```

---

## 你准备好了

现在打开 Claude Code（terminal 里输入 `claude`），把这段话贴进去：

```
I want to create a presentation using the PPTMAKER_FRAMEWORK/ at /path/to/PPTMAKER_FRAMEWORK/.
Read AGENTS.md first, then guide me through Phase 0.

Here's what I know so far:

- Topic: [你的 topic，如 "我的工厂如何在 AI 采购时代不被淘汰"]
- Audience: [谁在听，如 "集团管理层 + 各厂 GM，AI literacy 低"]
- Duration: [时长，如 "40 分钟 keynote"]
- Language: [slides 用什么语言，演讲用什么语言]
- I have Node.js 18+ and npm set up, dependencies installed (`npm install`), and GPT Image 2 API key configured.
```

Agent 会从 Phase 0 开始引导你——收集信息、创建目录、复制模板。之后你会进入一个循环：

```
agent 提问（关于你的内容/风格）→ 你回答 → agent 生成/修改 → 你在闸门前审核 → 通过 → 下一阶段
```

**你的工作是做判断——"这个隐喻对吗？""这个颜色合适吗？""这张 slide 够不够有力？"Agent 的工作是执行——写文件、跑脚本、生成图片、打包 PPTX。**

---

> **准备好了？** 回到 [reference/quick-start.md](../../reference/quick-start.md)，或者直接把上面的 conversation starter 贴进你的 agent。
