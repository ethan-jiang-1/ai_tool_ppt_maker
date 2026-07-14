## Context

BOOTSTRAP.md 是 Agent 的唯一入口。当前 Step 1（环境验证）核心指令是「跑 doctor，按输出修」，具体修复步骤分散在 `00-zero-to-ready.md`、`02-nodejs-environment.md`、`03-tool-selection.md`、`quick-start.md`。Agent 在 doctor 失败时需要跨 4 个文件拼凑修复指引，小白用户看到的是「到处跳」。

目标用户 profile：
- **Claude Code / Codex 用户**（90%+）：已有 Node.js + npm，缺的是 `npm install`（装 3 个依赖包：`@napi-rs/canvas`、`pptxgenjs`、`commander`）和 API key 配置
- **裸机用户**（<10%）：连 Node.js 都没有，需要完整安装指引

env-check.mjs 已经输出了结构化的失败信息和 fix 文本——Agent 不需要更多工具支持。缺失的只是 Agent 在 BOOTSTRAP 里能直接查到的「失败场景 → 修复步骤」映射。

**关键边界**：`03-tool-selection.md` 被 `workflow/01-visual/README.md`、`workflow/03-prompts/README.md`、`scripts/README.md` 引用——因为这些文件需要 Image2 API 契约的细节（endpoint 格式、submit/poll/download contract、vendor 解析逻辑）。这些引用是**工具参考**，不是**首次安装指引**。本 change 只动后者，不动前者。

**权威方向**：env-check.mjs 的 check name 是权威（工具定义输出），BOOTSTRAP 是跟随者（文档反映工具）。env-check 的行为不变。当 env-check 新增检查项时，BOOTSTRAP 必须跟进——这个约束落在 `bootstrap-env-guidance` 而非 `environment-check`。

## Goals / Non-Goals

**Goals:**
- BOOTSTRAP.md Step 1 成为 Agent 唯一需要的环境修复参考——不再需要跳到其他文件
- 每种 doctor 失败场景都有对应的小白友好修复步骤（中文、少术语、可复制粘贴）
- 区分「已有 Node.js 的用户」（重点：npm install + API key）和「裸机用户」（先装 Node.js）
- 外部文件引用降级为人类背景阅读，Agent 不需要读
- `03-tool-selection.md` 的 API 契约引用（来自其他 workflow 文件）不受影响
- `02-nodejs-environment.md` 加导航行防止成为第二事实源

**Non-Goals:**
- 不修改 env-check.mjs 的检查逻辑或输出格式（已满足需求）
- 不修改 ppt_flow.mjs doctor 命令
- 不删除任何现有文件
- 不改变 doctor 的退出码契约
- 不修改其他 workflow 文件对 `03-tool-selection.md` 的引用

## Decisions

### Decision 1: 修复指引用「header 分节」而非「pipe table」

**选择**：BOOTSTRAP.md Step 1 中每个 check name 用一个 `### check_name` header + 内容块，Agent 按 header 名称做精确匹配。

**原因**：LLM 对 markdown pipe table 的逐行解析不可靠——列对齐、换行、嵌套 code block 都容易 parse 失败。而 `### nodejs` 这样的 header 是单一 token 级别的精确匹配。Agent 看到 doctor 输出 `✗ nodejs` → 直接 scroll 到 `### nodejs` 节 → 取内容。

**替代方案**：pipe table。被否决——LLM parsing 不可靠。

### Decision 2: 指引按「用户 profile」分两段

**选择**：每条修复指引分「如果你在用 Claude Code/Codex」（已有 Node.js）和「如果你没有 agent/裸机」两段。

**原因**：90%+ 用户是 agent 用户，已经装过 Node.js（Claude Code 和 Codex 都要求 Node.js 18+）。让他们「先装 Node.js」是多余的。但少数裸机用户需要完整指引。

**替代方案**：只写一份通用指引。被否决——会让 90% 用户看无关内容，体验差。

### Decision 3: Image2 首次凭据段瘦身为 3 步

**选择**：BOOTSTRAP 的 Image2 段只保留：问凭据（key + URL）→ 写 .env → 冒烟验证（`doctor --smoke`）。通道体检（`--probe-vendors`）和教训落点（`_lessons/image2-proven.yaml`）留在 `03-tool-selection.md`，BOOTSTRAP 以「冒烟失败？见 03-tool-selection.md 通道体检」引用。

**原因**：通道体检和教训落点是高级 troubleshooting，首次安装用户不需要。把 6 步全塞进 BOOTSTRAP 会让 Step 1 臃肿，且分散了「先让 doctor 通过」这个核心目标。冒烟覆盖了 95% 的验证需求；剩下的 5% 才需要 probe。

**替代方案**：保留 6 步。被否决——首次安装用户不需要 vendor 对比，`_lessons/` 概念对新手是噪音。

### Decision 4: `00-zero-to-ready.md` 重新定位为「概念说明」而非「操作手册」

**选择**：`00-zero-to-ready.md` 去掉重复的安装命令，改为解释 agent、Node.js、API key 三样东西各自是干什么的、为什么需要——作为人类阅读的背景材料。所有操作步骤指向 BOOTSTRAP。

**原因**：保持单一事实源（SSOT）。且该文件原来写的「你需要三样东西」把 agent 和 Node.js 列为需要安装的东西——而目标用户已经安装了它们，这个 framing 是误导性的。

### Decision 5: `02-nodejs-environment.md` 加导航行，正文不动

**选择**：文件顶部加一行醒目文字：「> **首次安装？** 请走 BOOTSTRAP.md Step 1，Agent 会引导你完成。本文为详细参考。」正文内容不改。

**原因**：不删文件（其他文件可能引用它），但必须打破「两个地方都说同一件事」的困惑。一字不改正文，只加导航——最小化 diff，最大化清晰度。

**替代方案**：不动这个文件。被否决——BOOTSTRAP 覆盖了 npm install 和 .env 后，用户/Agent 如果从 workflow/00-setup/README.md 跳过来，会发现第二事实源，不知道该听哪个。

### Decision 6: `quick-start.md` conversation starter 更新中英文版本

**选择**：quick-start.md 有两处 conversation starter——英文版（line 41-51）和中文标签（line 50）。两处都把「I have Node.js 18+ and npm set up...」改成「Please check my environment first...」。中英文同步更新。

**原因**：当前模板让用户觉得「必须先装好一切才能开始」。实际流程是贴这段话 → agent 跑 doctor → 缺什么 agent 告诉用户 → 装好继续。conversation starter 应该反映真实流程，降低准入门槛。

## Risks / Trade-offs

- **[风险] BOOTSTRAP.md 变长**：Step 1 从 ~55 行扩充到 ~80-100 行 → **缓解**：BOOTSTRAP 本身就是 Agent 读的文件，不是人类读的。Agent 读 80 行策略性内容 vs 跳到 4 个文件各读 50 行——前者更高效
- **[风险] 修复指引和 env-check.mjs 输出漂移**：如果 env-check 的 check name 变了，BOOTSTRAP 的分节 header 没更新 → **缓解**：env-check 本身的 fix 文本是 fallback——即使 BOOTSTRAP 缺某个 header，Agent 仍可用 doctor 输出的 fix 文本。`bootstrap-env-guidance` spec 约束了同步要求
- **[风险] 跨平台指引不完整**：Windows/macOS/Linux 安装命令不同 → **缓解**：沿用 env-check.mjs 已有的平台检测逻辑，BOOTSTRAP 中写两套命令（macOS/Linux 用 `brew`/`apt`，Windows 用 `winget`/下载链接）
- **[风险] `workflow/00-setup/README.md` 文件描述过时**：该文件有一个表格描述 00-zero-to-ready、02-nodejs-environment 的内容和时间——这些描述在 change 后可能不准确 → **缓解**：task 2.3 明确要求更新该表
- **[风险] `02-nodejs-environment.md` 的导航行可能被漏掉**：其他文件（如 `03-tool-selection.md` 的 line 9）引用了 `02-nodejs-environment.md` → **缓解**：导航行只在顶部，不影响被引用内容的完整性
