## Why

小现象（**反复出现，不是偶发**）：Agent 把 version 临时文件丢到 `deck_*` 根。

金甲板刚又冒出 `deck_ai_sdlc_bpm_keynote/_slidespec.bak-split`——`checkBundle` **能拦**（上严下松已执法），但拦在**事后**：说明抽屉 `_scratch/` 机制在，**落盘前 Agent 仍不知道往哪放**。本 change 圈子必须覆盖这件事，不能只当文档打磨。

根因：

- 软包已有 `framework-directory-layout`（只描述 `PPTMAKER_FRAMEWORK/`）
- Run bundle（`deck_*`）的树 / 目录角色 / 上严下松，却捆在 `run-bundle-management`（Purpose 写成 “Define directory structure” + init/check）和 `framework-charter`（文档像定义方）里
- 机制上 `_scratch/` 已能执法，但 Agent **GREP 不到**稳定 term→path→role，仍会临场发挥

本 change（由 `version-scratch-directory` 更名）要做的事一句话：

> **用 delta specs 把 main specs 调对**：新建 `run-bundle-layout` 拥有 deck 树本体 + Where Map；收窄 management 为 ops；入口只镜像；Agent 不知放哪先 GREP——**避免再往 deck 根扔 `_slidespec.bak-*`**。

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

- **Main specs（经 delta sync）：** 新建 `run-bundle-layout`；改写 management / framework-directory-layout / charter（及 playbook 增量）；`config.yaml` 注册表**补 `run-bundle-layout` 行 + 改写 `run-bundle-management` 行描述**（删「目录结构宪法」→ ops，与收窄的 Purpose 自洽）
- **运行时文档/种子（apply）：** `glossary.md`、`BOOTSTRAP.md`、`AGENTS.md`、`_DIR_READMES`、金甲板 README、轻测
- **不改：** `SCRATCH_SUBDIR` 路径与既有 check 执法逻辑（已是基线）

## Artifact order（本 change 遵守）

1. **proposal** — 范围与 Capabilities  
2. **specs/** — 合法 delta（已重焊；用 delta 调对 main）  
3. **design**（本步）— 决策服从已定 specs  
4. **tasks** — 可执行实现清单  
5. 人审通过 → apply → archive/sync  
