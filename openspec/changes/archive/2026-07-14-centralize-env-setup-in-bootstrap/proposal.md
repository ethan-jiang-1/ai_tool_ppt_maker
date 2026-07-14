## Why

当前环境安装引导散落在多个文件中：BOOTSTRAP.md Step 1 只说「跑 doctor，按输出修」，然后让 Agent 去读 `00-zero-to-ready.md`、`02-nodejs-environment.md`、`03-tool-selection.md`；`quick-start.md` 的 conversation starter 暗示用户必须先装好一切才能开始。Agent 在 doctor 失败时要跨 4-5 个文件拼凑修复指引，小白用户的体验是「到处跳、不知道听谁的」。

核心矛盾：目标用户（用 Claude Code/Codex 的小白）已经有 Node.js + npm——他们真正缺的只是 `npm install`（装 3 个依赖包）和 API key 配置。但现有文档让他们觉得要先学一遍 Node.js 生态才能开始。

BOOTSTRAP.md 作为 Agent 唯一入口，Step 1 必须是自包含的环境修复指南——Agent 读这一个文件就知道每种失败怎么带用户修好。

## What Changes

- **BOOTSTRAP.md Step 1 重写为自包含环境修复指南**：新增按 check name 分节的失败修复指引（用 header 而非 pipe table——LLM 匹配更可靠），覆盖 doctor 全部 10 个 base 检查项。每种失败都有 Agent 可直接转述的小白中文修复步骤（copy-pasteable 命令），Agent 不需要跳到其他文件
- **修复指引按用户 profile 分层**：每条区分「如果你在用 Claude Code/Codex」（已有 Node.js+npm → 重点是 `npm install` + API key）和「如果你裸机」（先装 Node.js），避免让 90%+ 用户看无关内容
- **「首次凭据：Image2」段瘦身为 3 步内联指引**：问凭据 → 写 .env → 冒烟验证。通道体检和教训落点留在 `03-tool-selection.md`（高级 troubleshooting），不塞进首次安装流程
- **`03-tool-selection.md` 保持为 Image2 契约的 SSOT**：其他 workflow 文件引它是为了 API contract，不动。只改 BOOTSTRAP 对它的引用方式（从「去看那个文件」变成「冒烟失败？见 03-tool-selection.md」）
- **`00-zero-to-ready.md` 重新定位**：从「操作手册」变成「概念说明」——解释 agent、Node.js、API key 三样东西各自是干什么的、为什么需要，操作步骤全部指向 BOOTSTRAP
- **`02-nodejs-environment.md` 顶部加导航行**：内容不动，但加一行「首次安装请走 BOOTSTRAP.md Step 1；本文为详细参考」，防止第二事实源
- **`quick-start.md` conversation starter 更新**：中英文版本都改——将「I have Node.js 18+ and npm set up, dependencies installed」改为「Please check my environment first」，消除「必须先装好一切」的错觉
- **`workflow/00-setup/README.md` 文件清单更新**：`00-zero-to-ready.md` 和 `02-nodejs-environment.md` 的描述改为标记「首次安装走 BOOTSTRAP Step 1」

## Capabilities

### New Capabilities
- `bootstrap-env-guidance`: BOOTSTRAP.md Step 1 作为 Agent 的自包含环境修复指南——按 check name 分节的失败修复指引、按用户 profile 分层、命令可复制粘贴、硬闸门行为不变、外部文件引用降级为人类背景阅读。包含与 env-check.mjs 的同步约束：env-check 新增检查项时，BOOTSTRAP 必须同步更新对应节

### Modified Capabilities
<!-- 无。本 change 不改任何脚本行为，env-check.mjs 不变。-->

## Impact

- **BOOTSTRAP.md**: Step 1 重写——新增分节修复指引 + profile-aware 内容 + 瘦身 Image2 段；"快速参考"表的交叉引用标注为可选
- **workflow/00-setup/00-zero-to-ready.md**: 重新定位——去操作步骤、留概念说明，指向 BOOTSTRAP
- **workflow/00-setup/02-nodejs-environment.md**: 顶部加一行导航，正文不动
- **workflow/00-setup/README.md**: 文件清单中 `00-zero-to-ready.md` 和 `02-nodejs-environment.md` 的描述更新
- **reference/quick-start.md**: 中英文 conversation starter 更新
- **workflow/00-setup/03-tool-selection.md**: 不变（保持为 Image2 契约 SSOT）
- **scripts/env-check.mjs**: 不变
- 无 API 变更，无脚本行为变更，无 breaking change
