# Plan: 压缩 master 提交历史（按 OpenSpec change 颗粒度 squash）

> 类型: 复盘 / 操作记录 | 更新: 2026-08-13

## 背景 / 现状

master 主线是小步迭代开发，425 条提交、~5 周、0 merge。提交"碎"在**一个逻辑单元被拆成多条**，而非单条内容少（中位数 9 文件 / 305 行）。根因是 OpenSpec 工作流：每个 change 产生 `propose → refine/expand → implement → archive → backlog 状态流转` 一串 3~6 条提交；`openspec/changes/archive/` 已有 108 个归档 change，平均 425/108 ≈ 3.9 条/change，完全对得上。

> 注意：最初观察到「master 领先 origin 216 条、可只 squash 未 push 尾部」，但对话中途 origin/master 被 `update by push` 更新到与 HEAD 一致（`## master...origin/master`，0/0）。因此本计划针对**全量 425 条已发布历史**，重写后需 force-push。

## 决策 / 方案

**一条 change = 一条提交。** 每个 OpenSpec change 的生命周期折叠为一条 `feat: <change-name>`。425 → **109 条**（含 7 个 release 锚点 + 1 个 breaking `feat!`）。

- **独立保留不吞**：`release` / `chore(version)` / breaking `feat!` / `Initial commit`。
- **连续折叠、不重排**：约 5~8 个 change 存在交错（如 `python-to-nodejs-migration` 中间插了一条 `docs: root CLAUDE/AGENTS/README`）。重排有冲突风险，故采用「每个提交并入其最近的前一条 keep 提交」，代价是这少数 change 会以 2 条出现（如 playbook-state-simulation-tests 拆为「实现」+「finalize」两条）。
- **执行方式**：不用 `rebase -i`（环境不支持交互），改用 `git commit-tree` 按组重建——每组取「该组最后一条原提交的 tree」，父指针链成新历史。**零冲突、零重排、树内容按构造保证一致**。保留每组的 committer/author 日期（取组尾提交的日期）。
- **验证三关**：`git diff backup/pre-squash <newhead>` 为空 · `npm test` 全绿 · `rev-list --count` = 109。
- **回滚**：`git reset --hard backup/pre-squash`。

## 风险 / 取舍

- [重写已发布历史，需 force-push] → solo repo（`ethan-jiang-1`）无协作者；用 `--force-with-lease`；本地保留 `backup/pre-squash`。
- [树内容分叉/丢数据] → `commit-tree` 按真实 tree 重建，末组 tree 恒等于 HEAD tree；`git diff` 校验。
- [rebase 冲突] → 已消除（不用 rebase）。
- [丢失单条提交的时间戳/顺序考古] → 决策内容不丢（OpenSpec 文件仍在 `openspec/changes/archive/`）；仅丢过程噪声。
- [少数 change 因交错拆为 2 条] → 可接受，已明确列出（组 11/14/21/26 等）。

## 落地关联

本 plan 是 git 元操作，不产生 openspec change。执行后：
1. `git branch backup/pre-squash`（已完成，回滚点）
2. 重建 → 校验 → `git reset --hard <newhead>` → `git push --force-with-lease`
3. 完成后本文件可移入 `_done/_closed_plans/` 作为操作记录。

---

## 精确映射（425 → 109）

`组号 | 最终提交 message | 吸收范围(原提交序号) | 条数 | 首..尾 hash`

| # | message | 范围 | 条数 | 首..尾 hash |
|---|---|---|---|---|
| 1 | chore: initial commit | 1..2 | 2 | b14bf5e..9ceca45 |
| 2 | feat: add _backlog system + openspec structure | 3..3 | 1 | 4bcff7e..4bcff7e |
| 3 | feat: add PPTMAKER_FRAMEWORK v1 | 4..6 | 3 | 19d3cd4..4320be2 |
| 4 | chore: populate openspec/config.yaml agent context | 7..8 | 2 | 40b66b8..93821af |
| 5 | feat: python-to-nodejs-migration | 9..16 | 8 | 3f5e1ce..265a4fa |
| 6 | docs: add repo root CLAUDE.md/AGENTS.md/README | 17..17 | 1 | fc6c28b..fc6c28b |
| 7 | feat: framework-directory-restructure | 18..23 | 6 | 4b87f0c..d67ab0e |
| 8 | feat: framework-directory-consolidation | 24..26 | 3 | 887457a..a20366e |
| 9 | feat: playbook-system | 27..33 | 7 | 7e9bb12..12bbb28 |
| 10 | feat: playbook-descriptive-names | 34..37 | 4 | 07d33e8..b0f7399 |
| 11 | chore: archive playbook-system + playbook-descriptive-names | 38..40 | 3 | 2a3d9b1..34edb40 |
| 12 | feat: playbook-state-simulation-tests | 41..42 | 2 | 019ec22..d995d0d |
| 13 | feat: gate-condition-catalog | 43..49 | 7 | b513432..39ae126 |
| 14 | chore: finalize playbook-state-simulation-tests | 50..51 | 2 | f8e34f6..3eea270 |
| 15 | feat: main-specs-sync | 52..56 | 5 | 5765db8..7da9e70 |
| 16 | feat: align framework-directory-layout + BUG-001/002 | 57..62 | 6 | ff93dcf..1c49307 |
| 17 | chore: framework doc/env-check consistency + image2 hard env | 63..63 | 1 | a4b71ee..a4b71ee |
| 18 | refactor: bring Stage 2 image generation in-framework | 64..64 | 1 | 94c65c6..94c65c6 |
| 19 | feat: CLI failure-receipt + BUG-003/004/005/006 | 65..68 | 4 | e47d5d5..faab6aa |
| 20 | feat: exploration playbooks + guard-offpath UX | 69..70 | 2 | 888f92d..78d94e3 |
| 21 | fix: BUG-007 state.yaml array roundtrip | 71..72 | 2 | 4fcc9a3..ad6e7fa |
| 22 | feat: add deck_ai_sdlc_keynote run bundle | 73..75 | 3 | b2ceafe..d085508 |
| 23 | fix: BUG-008 image API credential contract | 76..76 | 1 | 63a1180..63a1180 |
| 24 | feat: generalize learning surface conventions | 77..80 | 4 | 58c94c5..1b2cb5b |
| 25 | feat: image2 multi-vendor failover | 81..85 | 5 | 13c3c98..fbfda4c |
| 26 | chore: advance deck_ai_sdlc_keynote (image2 pilot) | 86..86 | 1 | 8e149a1..8e149a1 |
| 27 | feat: recoverable-session-resume | 87..94 | 8 | b9e16dc..70a1e74 |
| 28 | feat: version _scratch outlet + run-bundle-layout discoverability | 95..104 | 10 | 43884d1..75ee459 |
| 29 | feat: default full-page header gate + fix BUG-009 | 105..111 | 7 | 4875ccf..71ee809 |
| 30 | feat: harden framework coherence contracts | 112..115 | 4 | 105071f..94ceaa2 |
| 31 | feat: deck 25p rebuild (agent visual language) | 116..116 | 1 | 68d2936..68d2936 |
| 32 | chore: harden-production-pipeline proposal + spec syncs | 117..121 | 5 | d1013d9..3ca36ee |
| 33 | feat: per-slide header review gate + refine slides 05-06 | 122..125 | 4 | 79d7322..0b1a3c6 |
| 34 | feat: cli-diagnostic-lineage | 126..128 | 3 | 9d74e11..e3fcfef |
| 35 | refactor: simplify credentials to IMAGE2_API_KEY/BASE_URL | 129..129 | 1 | 193fafe..193fafe |
| 36 | chore: suspend output-linter plan | 130..132 | 3 | 450a8d9..79c7cbe |
| 37 | feat: rename HITL wave nodes + cleanup legacy node ids | 133..137 | 5 | 8b23ed1..52313d2 |
| 38 | chore: centralize env setup (BOOTSTRAP) + edit-chain semantics | 138..139 | 2 | ec48ed4..8071da3 |
| 39 | feat: visual-asset-system (multi-reference image) | 140..146 | 7 | 6f8491e..26a5e5a |
| 40 | chore: release v0.15.0 | 147..147 | 1 | 0e77e4c..0e77e4c |
| 41 | chore: openspec config as agentic control plane | 148..149 | 2 | d38606e..0850fff |
| 42 | feat: lessons-management + CLI | 150..151 | 2 | a2ee6dc..2f00b92 |
| 43 | feat: deck sync to v0.15 + backbone enrichment | 152..153 | 2 | 129cdbf..3523372 |
| 44 | feat: stable slide identity + order editing | 154..160 | 7 | 7b5e3a1..9b6adb3 |
| 45 | feat: optional Git safety guidance | 161..163 | 3 | 6bad6d8..e16ed7b |
| 46 | feat: HTML runtime readiness + structured slide contract + plan | 164..177 | 14 | ebcf990..1234b73 |
| 47 | feat: deliver HTML-first decks | 178..179 | 2 | 8648878..392095e |
| 48 | refactor: restructure framework scripts into phase modules | 180..185 | 6 | 24e33be..fff87df |
| 49 | feat: image2 visual-slot refinement lifecycle | 186..190 | 5 | 9279723..d49ed5e |
| 50 | feat: deck v0 + migrate to v2 html-first | 191..192 | 2 | 2428e8f..a9669e1 |
| 51 | feat: guided HTML production recovery + relay protocol | 193..197 | 5 | ef36136..266a7db |
| 52 | feat: complete markerless HTML migration | 198..201 | 4 | ac97196..3d64886 |
| 53 | chore: plan production-mode-system | 202..206 | 5 | ff46bce..e8301c0 |
| 54 | feat: production mode (state authority, image2-primary) | 207..215 | 9 | 8269d35..d049a74 |
| 55 | feat: versioned production-mode transition protocol | 216..221 | 6 | 26fc6f4..737f1d9 |
| 56 | chore: plan agent-workflow-simplification | 222..225 | 4 | 15ed8af..4a6344d |
| 57 | feat: unify workflow inspection + continuation card | 226..231 | 6 | b11dd52..e9a9a6b |
| 58 | feat: simplify workflow control interfaces | 232..234 | 3 | 1210e2b..5209fb1 |
| 59 | feat: realign image production ownership | 235..239 | 5 | 8977c9b..cb2edd0 |
| 60 | feat: bound development verification + archive CLS-011 | 240..246 | 7 | 58d7bcc..cfbf158 |
| 61 | refactor: realign specs with framework | 247..251 | 5 | c29e920..3582c86 |
| 62 | docs: deck align v0.22 + RUN_BUNDLE schema | 252..253 | 2 | 60c852e..87fc7b6 |
| 63 | feat: deck v3 image2-only pipeline | 254..254 | 1 | 766a6c2..766a6c2 |
| 64 | chore: plan page-authority-image2 | 255..260 | 6 | 6447564..fd345bc |
| 65 | feat: image2 page pipeline + retire legacy production | 261..264 | 4 | 0a9485b..2a42fe4 |
| 66 | chore: close CLS-013, fix BUG-014/034 | 265..265 | 1 | 89176be..89176be |
| 67 | feat: separate framed/pure workflows + plan | 266..270 | 5 | 35dea64..6559237 |
| 68 | refactor: retire current v1 compatibility | 271..276 | 6 | 9dfce15..5428629 |
| 69 | chore: release v0.23.0 | 277..277 | 1 | 96da48b..96da48b |
| 70 | feat: deck switch to image2 page-authority v2/v4 framed | 278..286 | 9 | f706e65..b920a4d |
| 71 | feat: converge framed render and review | 287..288 | 2 | c5ed59b..fb1940d |
| 72 | feat: establish style master feedback | 289..290 | 2 | c2386c9..ec7c667 |
| 73 | feat: progressive page production | 291..294 | 4 | ce98eeb..d75b180 |
| 74 | feat: reconcile command surface and entry seams | 295..296 | 2 | 92ebe69..a510ce5 |
| 75 | feat: diagnostic recovery handoff + provider clauses + BODY text | 297..301 | 5 | d010821..67fddcb |
| 76 | feat: harden page authority production + v7 recovery | 302..308 | 7 | 6d8d846..065a352 |
| 77 | feat: harden Style Master provider boundary | 309..310 | 2 | 3081272..58cdb36 |
| 78 | chore: release v0.24.1 | 311..311 | 1 | 2e2a3a1..2e2a3a1 |
| 79 | feat: harden provider clause delivery | 312..313 | 2 | 7b6e7b3..f8d84d3 |
| 80 | chore: release v0.24.2 | 314..314 | 1 | edaadb2..edaadb2 |
| 81 | feat: Page Authority relationship visual semantics | 315..318 | 4 | ac2185c..a74e5b7 |
| 82 | fix: provider-native media boundary + BUG-053/054 | 319..322 | 4 | 9a6e26a..bf17ced |
| 83 | feat: render pure slide text in provider prompt + BUG-055~059 | 323..331 | 9 | f37ae14..e3b9a92 |
| 84 | feat: deck v1 epoch 3 + bootstrap v2/framed | 332..333 | 2 | d8e4f3d..191fd83 |
| 85 | feat!: adopt PPT Maker Harness | 334..339 | 6 | db6b8eb..6e8d0fb |
| 86 | feat: deck dark-factory v3 + rename framework->harness | 340..340 | 1 | 1c51f44..1c51f44 |
| 87 | docs: Page Image Core domain model | 341..342 | 2 | 7bff5ab..b5bc969 |
| 88 | feat: replace page authority image workflow + JPEG delivery | 343..348 | 6 | f2fd26d..010b57b |
| 89 | feat: harness delivery projections + human view + bind visual system | 349..352 | 4 | 21fa3fe..5ebdecd |
| 90 | chore: release v0.25.0 | 353..353 | 1 | 89be454..89be454 |
| 91 | fix: human CLI handoff guidance | 354..354 | 1 | 65dabaa..65dabaa |
| 92 | chore: release v0.25.1 | 355..355 | 1 | f9fa9ba..f9fa9ba |
| 93 | chore: clarify pure pilot plan + ignore deck_*_current | 356..357 | 2 | eadd76d..591ff0d |
| 94 | fix: image2 review artifact view + short physical paths | 358..362 | 5 | 0b03f72..d8b9389 |
| 95 | chore: release v0.26.0 | 363..363 | 1 | edfb7c4..edfb7c4 |
| 96 | fix: expose pending style master successors + terminal siblings | 364..370 | 7 | 7bb26fe..e22adfb |
| 97 | fix: harden inactive run state (BUG-066) | 371..375 | 5 | 0200d7e..7b844e6 |
| 98 | chore: restore framed baseline + page-image recovery plans | 376..380 | 5 | 9e7d8ea..2cbff6c |
| 99 | feat: align page image grants with task mandates | 381..383 | 3 | 6c44fca..2e0a913 |
| 100 | docs: page image presentation schema + schema-first ADRs | 384..390 | 7 | 051f3ae..87f02fc |
| 101 | chore: publish production schema definitions (C1) | 391..395 | 5 | 93473b7..948681a |
| 102 | refactor: conform code to schema definitions | 396..398 | 3 | 98483a9..c473d14 |
| 103 | feat: narrative-first page planning | 399..404 | 6 | a3f3552..1aa1994 |
| 104 | feat: publish per-page derived data | 405..406 | 2 | f3d8a66..fcd9652 |
| 105 | feat: harden framed provider composition (C6) | 407..409 | 3 | 4e9433d..fbd819c |
| 106 | feat: converge active schema authority + framed header reservation | 410..414 | 5 | 98bf676..5327c2f |
| 107 | chore: track C7 reconstruction + schema-first recovery | 415..419 | 5 | c4574ea..5b0bd75 |
| 108 | chore: remove retired decks | 420..421 | 2 | 169792c..7d129bf |
| 109 | refactor: retire lifecycle phase numbering + terminology align | 422..425 | 4 | 68b3e04..40fd68c |
