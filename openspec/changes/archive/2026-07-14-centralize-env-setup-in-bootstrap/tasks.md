## 1. BOOTSTRAP.md Step 1 重写 — 自包含环境修复指南

- [x] 1.1 在 BOOTSTRAP.md Step 1 中新增按 check name 分节的失败修复指引（用 `### nodejs`、`### npm` 等 markdown header，不用 pipe table——LLM 对 header 匹配更可靠），覆盖 env-check.mjs 全部 10 个 base 检查项。每节包含：
  - Agent 用户路径（已有 Claude Code/Codex → `npm install` / 写 `.env`）
  - 裸机用户路径（无 Node.js → 完整安装步骤）
  - 跨平台命令（macOS/Linux + Windows，分 code block 标注）
  - 修复后验证命令（重跑 doctor / 重跑 doctor --smoke）
  - 合并逻辑提示（Agent 注意：`@napi-rs/canvas` + `pptxgenjs` + `commander` 三项全败 = 一个 `npm install` 解决）
- [x] 1.2 重写 Step 1 的硬闸门说明段——保留 `⛔ FOUNDATION NOT READY` / `✗ NOT READY` / `△` 三级判定逻辑，将「参考 workflow/00-setup/00-zero-to-ready.md 与 workflow/00-setup/02-nodejs-environment.md」替换为「详见下方分节指引（Agent：匹配 check name → 跳到对应 header → 告诉用户怎么修）」
- [x] 1.3 瘦身「首次凭据：Image2」段——只保留 4 步首次安装核心流程（问 key+URL → 写 .env → 重跑 doctor → 冒烟验证），通道体检指向 03-tool-selection.md。保留 `_lessons/` 教训机制（通用，不只 Image2）
- [x] 1.4 保留 `npm install` 段和「Stage 2 在框架内」段——这两段已经够好，不动
- [x] 1.5 BOOTSTRAP 底部「快速参考」表不需要改（这些文件不在表中作为独立条目）；Agent 匹配规则段已标注为人类背景阅读

## 2. 辅助文档同步

- [x] 2.1 重新定位 `workflow/00-setup/00-zero-to-ready.md`：
  - 保留「你需要三样东西」的概念框架，但重写为「你很可能已经有了其中两样（agent + Node.js），Agent 会检查并告诉你缺什么」
  - 去掉重复的安装命令（Step 1 的 Node.js 安装步骤、Step 2 的 npm install 命令、Step 3 的 export 命令）
  - 每个 section 末尾加一行指向 BOOTSTRAP：「具体操作步骤：Agent 会按 BOOTSTRAP.md Step 1 引导你完成」
  - 同步 task 2.2 的 conversation starter 更新
- [x] 2.2 更新 `reference/quick-start.md` 两处 conversation starter（英文版 line 41-51 和中文标签 line 50）：
  - 英文版：将「I have Node.js 18+ and npm set up, dependencies installed (`npm install`), and GPT Image 2 API key configured.」改为「Please check my environment first (`node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor`) and tell me what I need to install or configure.」
  - 中文标签：将「我有: GPT Image 2 API、Node.js 18+、npm（`@napi-rs/canvas` + `pptxgenjs` 由 repo 安装）」改为「请先检查我的环境（`node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor`），告诉我需要装什么。」
- [x] 2.3 在 `workflow/00-setup/02-nodejs-environment.md` 顶部（title frontmatter 下方、正文上方）加一行醒目的导航文字：「> **首次安装？** 请走 [BOOTSTRAP.md](../../BOOTSTRAP.md) Step 1，Agent 会引导你完成环境检查与修复。本文为详细参考。」正文不动。
- [x] 2.4 更新 `workflow/00-setup/README.md` 文件清单表：
  - `00-zero-to-ready.md` 描述改为「概念说明：你需要什么、为什么需要（操作步骤走 BOOTSTRAP）」
  - `02-nodejs-environment.md` 描述改为「Node.js 环境参考——npm install、.env 配置的详细背景（首次安装走 BOOTSTRAP）」
  - `03-tool-selection.md` 描述保持不变

## 3. 验证

- [x] 3.1 运行 `npm test` 确认文档交叉引用一致性测试通过（所有 markdown 链接目标存在）
- [x] 3.2 人工验证——模拟 Agent 视角，对以下每种 doctor 失败场景确认 BOOTSTRAP Step 1 有对应 `###` section 且可复制粘贴执行：
  - `nodejs: fail`（Node.js 缺失/过旧）→ 应找到 `### nodejs` section
  - `npm: fail`（npm 缺失）→ 应找到 `### npm` section
  - `api_key: fail` + `image_base_url: fail`（凭据全缺）→ 应找到两个 section，且指引合并为一个 `.env` 操作
  - `@napi-rs/canvas: fail` + `pptxgenjs: fail` + `commander: fail`（npm 包全缺）→ 应各有一节但 Agent 合并为一个 `npm install`
  - `stage2_generator: fail`（脚本缺失）→ 应找到 `### stage2_generator` section
  - `fonts: warn`（字体警告）→ 应找到 `### fonts` section，且允许继续
- [x] 3.3 验证边界——确认 `03-tool-selection.md` 的 Image2 API contract 内容未被改动，且 `workflow/01-visual/README.md`、`workflow/03-prompts/README.md`、`scripts/README.md` 对它的引用仍然有效
- [x] 3.4 验证权威方向——确认 `environment-check` spec 未被本 change 修改（env-check.mjs 是权威，BOOTSTRAP 是跟随者）
