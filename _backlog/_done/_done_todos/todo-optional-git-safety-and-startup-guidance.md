# TODO: Optional Git Safety And Startup Guidance

> 状态: 待提案 | 优先级: 中 | 更新: 2026-07-16
> 来源: stable slide identity / structural versioning 复核
> 推荐 change 名: `add-optional-git-safety-guidance`

## 一句话决策

开始做 PPT 时检测 Git，并在缺失时主动建议用户安装；但 Git 是 source/control 的底层回滚与审计增强，不是 PPT 管线前置条件。缺少 Git、当前目录不在 worktree，或尚未有 commit，都只能产生非阻断 warning，不能把 `doctor` 的 READY 变成 NOT READY。

```text
用户可见作品版本: run-bundle v1 -> v2 -> v3
底层安全与审计:   Git diff / log / restore
派生物:           _generated/，不进 Git，可重跑
```

## Why

Structural Versioning Path 解决“用户怎么理解不同作品版本”，Git 解决“源文件如何回滚、审计、比较和恢复误改”。两者互补，不应互相替代：

- 只靠 Git commit，不足以表达 PPT 的 clean vNext 和下游刷新边界。
- 只靠 `v1/v2`，缺少细粒度 source diff、误改恢复和长期审计。
- 新用户经常没有安装 Git，或不知道 deck 是否在 worktree 中；Agent 应在开始时把安全网说清楚。
- Git 不应成为创作门槛。即使用户暂时不装，框架仍必须正常创建和生产 PPT。

## Proposed UX

### 1. `doctor` 增加可选 Git 检查

使用 Node.js built-ins 调用 Git，不增加 npm 依赖：

- 检测 `git --version`。
- Git 可用时，检测当前工作目录是否位于 worktree（例如 `git rev-parse --is-inside-work-tree`）。
- 输出不得泄露 remote URL、credential、用户名或 commit 内容。
- Git 缺失：`warning`，建议安装。
- Git 已装但当前目录不在 worktree：`warning`，说明可以继续，并建议在合适的项目根初始化。
- Git 已装且当前目录在 worktree：`ok`，只报告版本与受保护状态。
- 任一 Git warning 都保持 overall `READY` 和 exit 0，前提是现有 hard requirements 已通过。

如果环境检查采用一个稳定 check 名，推荐 `git`，detail 中区分 executable/worktree；若拆成多个 base check，则 BOOTSTRAP 必须为每个 check 提供同名 section。

### 2. BOOTSTRAP 给出初学者可直接执行的引导

`BOOTSTRAP.md` Step 1 增加与 `env-check.mjs` check 名完全一致的 section：

- macOS、Linux、Windows 的 Git 安装命令。
- 安装后用 `git --version` 验证。
- 不在 worktree 时，解释应在包含 deck source 的合适项目根执行 `git init`，而不是在 `_generated/` 或单个 `vN/` 内初始化碎片仓库。
- 初始化前先确认目标根目录；Agent 不应在用户未知情时自动创建仓库或 commit。
- 已有上层 worktree 时不得嵌套 `git init`。

Agent-facing 开场语义应是：

> Git 不是必须项，但建议装好，用来保留源文件历史和回滚；没有它也可以继续做 PPT。

### 3. 新 run bundle 的 ignore contract 继续保护边界

Init-seeded `.gitignore` 至少保持：

- `.env` 不跟踪；
- `3_versions/*/_generated/` 不跟踪；
- `3_versions/*/_scratch/*` 不跟踪，但保留其 README；
- source/control Markdown 与必要状态文件可进入 Git。

文档不得建议 `git add -f _generated/`，也不得用 commit 代替 Structural Versioning Path。

### 4. Checkpoint 是建议，不是静默副作用

Agent 可以在这些时机建议 source checkpoint：

- run bundle 初始化和第一批真实 source 完成后；
- 结构 preview apply 前已有未提交的重要 source 改动时；
- vNext source 验证完成后；
- 最终交付/归档时。

Agent 不应因为 Git 存在就自动 commit、push、改 remote 或丢弃 working-tree 改动。是否提交可由用户工作方式和当前上下文决定；框架 correctness 不依赖 clean working tree 或 commit 成功。

## Capability Scope

- `environment-check`: optional executable/worktree detection；warning 不改变 READY。
- `bootstrap-env-guidance`: 自包含安装、验证、初始化和非阻断说明；check 名与 env-check 同步。
- `framework-charter`: 统一 `run-bundle version = 作品版本`、`Git = source audit`、`_generated = 可重跑派生物`。
- `run-bundle-management`: 核对 init-seeded `.gitignore` 与新手 guidance，不让 Git 取代 clean vNext。

本 change 不应混入 slide identity、render artifact 或 selector 的实现；这些能力只依赖文件系统和 vNext publication，不依赖 Git。

## Acceptance Scenarios

### Git 未安装但其他环境满足

- `doctor` 报 `git` warning 和安装建议。
- overall 仍为 READY，exit 0。
- Agent 明确说可以继续创建 PPT。

### Git 已安装但不在 worktree

- `doctor` 报非阻断提示。
- BOOTSTRAP 能给出安全的 project-root `git init` 引导。
- 不自动初始化，不在 `vN/` 或 `_generated/` 内创建嵌套仓库。

### 已在上层 worktree

- 检查识别已有 worktree，不建议嵌套初始化。
- 新 deck 的 `.gitignore` 继续排除 secret、generated 和 scratch 内容。

### Git 检查本身异常

- timeout、权限或未知退出只降级成简短 warning。
- 不阻断现有 doctor hard checks，也不输出敏感 command/stdout 内容。

## OpenSpec Next Step

提案前先复核 `environment-check` 和 `bootstrap-env-guidance` 主规格的 warning/READY 与 section-sync contract；实现时使用 fake `git` executable/PATH 和临时 worktree 测试，不依赖开发机真实 Git 状态。

