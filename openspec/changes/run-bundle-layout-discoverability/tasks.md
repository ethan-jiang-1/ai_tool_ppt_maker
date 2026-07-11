> **状态校准（2026-07-11）**：本 change 被倒序执行——apply 代码在 `e378d0a`
> （+ Phase A `43884d1`）**已落地并提交**，之后才回头重焊 proposal/design。故 §1–§4
> 全部 `[x]`（已实现，注明 commit），仅 §5 的 sync/验证/archive 为真正待办。
> **禁止**在此清单里假装 apply 尚未完成，也**禁止**自行 commit/archive。
> Phase A 机制（`SCRATCH_SUBDIR` / 白名单 / bak 迁入 `v1/_scratch/` / `renderTree()` 列 `_scratch`）为基线，勿重做执法逻辑。

## 1. OpenSpec — delta specs（已完成）

- [x] 1.1 Change 更名 `version-scratch-directory` → `run-bundle-layout-discoverability`；重写 `proposal.md` / `design.md`（小 bak → folder ontology 主线；recurrence proof `_slidespec.bak-split`；D1–D7 决策）
- [x] 1.2 NEW `specs/run-bundle-layout/spec.md`：Purpose（deck 本体 + Where Map；≠ soft-bundle layout）+ 树/roles + 上严下松 gradient + `bundle_layout.mjs` `renderTree()` 机器权威叙事
- [x] 1.3 MODIFIED `specs/run-bundle-management/spec.md`：Purpose 收窄为 enforce/scaffold/validate/version（conformity 归 layout）；RENAMED「Bundle layout is the directory constitution」→「Management enforces run-bundle-layout…」；scratch/check 按 enforce 改写；ADDED first-look README 种子 + 金甲板 README
- [x] 1.4 MODIFIED `specs/framework-directory-layout/spec.md`：仅 `PPTMAKER_FRAMEWORK/`；明确 `deck_*` 归 `run-bundle-layout`、此处不得扩展
- [x] 1.5 MODIFIED `specs/framework-charter/spec.md`：CONSTITUTION/AGENT_CONTRACT 镜像上严下松；CONSTITUTION 树含 `_scratch`；ADDED BOOTSTRAP GREP 指针 + AGENTS Phase 0 树
- [x] 1.6 ADDED `specs/playbook-execution/spec.md`：不知放哪 → GREP Where Map before inventing paths（`checkBundle` 执法不被替代）

## 2. Apply — Glossary Where Map（已实现 · commit `e378d0a`）

文件：`PPTMAKER_FRAMEWORK/reference/glossary.md`

- [x] 2.1 分组定义之上插入 `## Where Map`；开篇「不知往哪放 → 先 GREP 再 mkdir」；点名 capability `run-bundle-layout`（≠ `framework-directory-layout`）— 见行 14/18/186
- [x] 2.2 四列表 `Term (GREP this) | Path | Means / put here | Do not`，含 D3 tokens（`run bundle`、`soft bundle`、`--run-dir`、`_scratch/`、`_generated/`、`slide-specifications.md`、`style_master.jpg`、`contact_sheet`/`pilot`、`_state/`、`_lessons/`、三层梯度…）
- [x] 2.3 Path 可落盘：`_scratch/` → `3_versions/v{n}/_scratch/`；`style_master.jpg` → `2_backbone/visual-style/style_master.jpg`；pilot → `_generated/preview/*contact_sheet*.jpg`；`--run-dir` → `deck_*/3_versions/v{n}/`（≠ deck 根）
- [x] 2.4 `###` 标题 = 可搜 token（`### _scratch/` 行 64、`### --run-dir`、`### style_master.jpg`…）；`### _scratch/` 答清是什么/完整相对路径/禁止项/与 `_generated/` 路由
- [x] 2.5 Also-search → canonical（`bak`/`temp`/`scratch` → `_scratch/`；`小样`/`preview` → `contact_sheet`/`pilot`；`style master` → `style_master.jpg`；`production`/`derived` → `_generated/`）

## 3. Apply — 入口文档检索键（已实现 · commit `e378d0a`）

- [x] 3.1 `PPTMAKER_FRAMEWORK/BOOTSTRAP.md`「目录是宪法」：GREP-before-invent（token `_scratch`/`_generated`/`style_master`/`contact_sheet`/`pilot`/`--run-dir`/`run bundle`）→ 链 `reference/glossary.md` Where Map；保留上严下松 + `v{n}/_scratch/`；未贴整表 — 行 52–54
- [x] 3.2 `PPTMAKER_FRAMEWORK/AGENTS.md` Phase 0 树：`v1/` 下增 `_scratch/` 行（英文角色词 `SCRATCH · version temp/bak · not SSOT · 禁丢 deck 根`），与 `renderTree()` 一致；引言点 run-bundle-layout / Where Map — 行 121/137

## 4. Apply — 种子 README + 金甲板 + 测试（已实现 · commit `e378d0a`）

- [x] 4.1 `bundle_layout.mjs` `_DIR_READMES['.']`：根 README 种子写出版本临时在 `3_versions/v{n}/_scratch/` + 上严下松/根最严 + 不知放哪点 glossary Where Map — 行 602–664
- [x] 4.2 `_DIR_READMES[3_versions]`：`--new-version` 说明「不复制 `_generated/` **与** `_scratch/` 内容」
- [x] 4.3 `workflow/00-setup/template-deck-guide.md` 已含 `_scratch` 树行 + new-version 不拷 `_scratch`（行 95/98，与种子对齐）
- [x] 4.4 **覆盖**（非 `_writeIfAbsent`）金甲板 `deck_ai_sdlc_keynote/README.md` 与 `3_versions/v1/README.md`，正文出现 `_scratch`，与现行种子一致
- [x] 4.5 charter 运行时文档镜像（Phase A `43884d1`）：`CONSTITUTION.md` 严格度表 + 树含 `_scratch`（行 86–142）；`AGENT_CONTRACT.md` 上严下松 + bak 只进 `_scratch`（行 33/39）
- [x] 4.6 `tests/test_docs_consistency.mjs` 断言 glossary `## Where Map`/`### _scratch/`/`### --run-dir`/`### style_master.jpg`/`contact_sheet`；BOOTSTRAP `Where Map`+`GREP`+`_scratch`；AGENTS `_scratch/`；`bundle_layout.mjs` 种子含 `v{n}/_scratch`；金甲板两 README 含 `_scratch`（行 92–117）

## 5. 待办 — 验证 · Sync（逐 capability · D5）· Archive

- [x] 5.1 验证闸门（2026-07-11 实测）：`npm test` **16 files / 103 tests 全绿**；`bundle_layout.mjs --check deck_ai_sdlc_keynote/3_versions/v1 --structure-only` **exit 0**（archive 前建议再跑一次确认）
- [ ] 5.2 `openspec/config.yaml` capability 注册表两处改（与 sync 同批）：**(a)** 新增 `run-bundle-layout` 行（描述 = deck 树 folder ontology + Where Map 拥有者；脚本 `bundle_layout.mjs` `renderTree()`）；**(b)** 改写 `run-bundle-management` 行——删「目录结构宪法」→ ops（init/check/new-version **enforce** run-bundle-layout）。否则注册表自相矛盾

**Sync deltas → main specs**（D5：delta 只用 ADDED/MODIFIED/REMOVED/RENAMED 头；main 只存 `## Purpose` + `## Requirements`。`/opsx:sync` 或 archive 时执行）：

- [ ] 5.3 **NEW** `openspec/specs/run-bundle-layout/spec.md`：Purpose 抄自 delta；3 条 ADDED requirement 摊平进 Requirements（① 树/roles+renderTree ② 上严下松 gradient ③ Where Map GREP 索引）
- [ ] 5.4 **MODIFIED** `run-bundle-management`：主仓 **RENAME** `### Requirement: Bundle layout is the directory constitution` → `Management enforces run-bundle-layout via bundle_layout.mjs` 并换 body；合并另 2 条 MODIFIED（version `_scratch`、checkBundle allow/reject litter）；追加 2 条 ADDED（first-look README seeds、golden README）；**重写 Purpose** 删 “Define … directory structure” → ops-over-layout
- [ ] 5.5 **MODIFIED** `framework-directory-layout`：追加 ADDED「soft-bundle 不定义 run-bundle trees」；Purpose 补一句 `deck_*` 归 `run-bundle-layout` 的边界（旧 D9 语义）
- [ ] 5.6 **MODIFIED** `framework-charter`：合并 2 条 MODIFIED（严格度镜像上严下松、CONSTITUTION 树含 `_scratch`）+ 2 条 ADDED（BOOTSTRAP GREP 指针、AGENTS Phase 0 树）进 Requirements
- [ ] 5.7 **ADDED** `playbook-execution`：追加「Unsure placement → GREP Where Map before inventing paths」一条；**不**重复 `Version-scoped backups go under _scratch`（已在 main 行 281）
- [ ] 5.8 `openspec validate --specs --strict` 全绿（主仓 16→17 caps 合法；`run-bundle-layout` 新册在案）
- [ ] 5.9 人审 proposal/specs/docs 文案 → archive；**禁止**自行 commit/archive
