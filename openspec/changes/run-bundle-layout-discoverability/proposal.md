## Why

小现象：Agent 把 version 临时文件（`.bak`）丢到 `deck_*` 根。

根因不止缺抽屉——是 **OpenSpec 里 run-bundle folder 没有独立主家**：

- 软包已有 `framework-directory-layout`（只描述 `PPTMAKER_FRAMEWORK/`）
- Run bundle（`deck_*`）的树 / 目录角色 / 上严下松，却捆在 `run-bundle-management`（Purpose 写成 “Define directory structure” + init/check）和 `framework-charter`（文档像定义方）里
- 机制上 `_scratch/` 已能执法，但 Agent **GREP 不到**稳定 term→path→role，仍会临场发挥

本 change（由 `version-scratch-directory` 更名）要做的事一句话：

> **用 delta specs 把 main specs 调对**：新建 `run-bundle-layout` 拥有 deck 树本体 + Where Map；收窄 management 为 ops；入口只镜像；Agent 不知放哪先 GREP。

## What Changes

1. **NEW main capability** `run-bundle-layout`（归档后出现 `openspec/specs/run-bundle-layout/`；并登记进 `openspec/config.yaml` 注册表）
2. **MODIFIED main** `run-bundle-management`：不再宣称定义目录结构；只 scaffold/validate/version + 种子输出服从 layout tokens
3. **MODIFIED main** `framework-directory-layout`：Purpose/边界写明仅 soft bundle，不覆盖 `deck_*`
4. **MODIFIED main** `framework-charter`：CONSTITUTION/CONTRACT/BOOTSTRAP/AGENTS **镜像并指向** layout；GREP-before-invent 指针（不拥有 ontology）
5. **MODIFIED main** `playbook-execution`：仅补「不知放哪 → GREP Where Map」（bak→`_scratch` 若已在 main 则不再 ADDED 重复）
6. **Apply 层（tasks）**：glossary Where Map、入口树、`_DIR_READMES`、金甲板 README、轻测——在 specs 结构正确后落地

**Non-goals：** 新磁盘路径；deck 根 `_scratch`；拆 `bundle_layout.mjs`；合并两个 layout；重做 Phase A 执法机制。

## Capabilities

### New Capabilities

- `run-bundle-layout` — `deck_{NAME}/` folder ontology（树、目录 role、上严下松）+ GREP Where Map；机器树文案权威为 `bundle_layout.mjs` `renderTree()`；对称于 `framework-directory-layout`，禁止混用

### Modified Capabilities

- `run-bundle-management` — ops only（init/check/new-version/self-check）；enforces `run-bundle-layout`；不拥有 Where Map / 第二套 ontology
- `framework-directory-layout` — 仅 `PPTMAKER_FRAMEWORK/`；显式不定义 `deck_*`
- `framework-charter` — 镜像 layout + BOOTSTRAP/AGENTS 检索指针
- `playbook-execution` — GREP Where Map before inventing paths

## Impact

- **Main specs（经 delta sync）：** 新建 `run-bundle-layout`；改写 management / framework-directory-layout / charter（及 playbook 增量）；`config.yaml` 注册表补一行
- **运行时文档/种子（apply）：** `glossary.md`、`BOOTSTRAP.md`、`AGENTS.md`、`_DIR_READMES`、金甲板 README、轻测
- **不改：** `SCRATCH_SUBDIR` 路径与既有 check 执法逻辑（已是基线）

## Artifact order（本 change 遵守）

1. **proposal**（本文件）— 你审结构/范围  
2. **specs/** — 合法 delta（ADDED/MODIFIED/REMOVED Requirement only；用 delta **调对 main**；此步最重要）  
3. **design** — 决策与边界（服从已定 specs）  
4. **tasks** — 可执行实现清单  
5. 人审通过 → apply → archive/sync  

当前错误的 specs 形态（Purpose-only delta、重复 ADDED、meta requirement 等）在进入步骤 2 时整棵重焊，不在 proposal 里假装已修好。
