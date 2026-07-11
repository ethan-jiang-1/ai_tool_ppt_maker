## 1. OpenSpec — capability 边界（已完成）

- [x] 1.1 Change 更名 `version-scratch-directory` → `run-bundle-layout-discoverability`；重写 `proposal.md` / `design.md`（小 bak → folder ontology 主线；D0 边界表）
- [x] 1.2 NEW `specs/run-bundle-layout/spec.md`：Purpose（deck 本体 + Where Map；≠ soft-bundle layout）+ tree/roles + gradient + `bundle_layout.mjs` 实现 `renderTree()` 叙事
- [x] 1.3 MODIFIED `specs/run-bundle-management/spec.md`：Purpose 改为 scaffold/validate/version **conformant** deck（conformity 归 layout）；RENAMED「Bundle layout is the directory constitution」→「Management enforces run-bundle-layout…」；scratch/check 按 **enforce** 改写；ADDED 种子/金甲板 README
- [x] 1.4 MODIFIED `specs/framework-directory-layout/spec.md` Purpose：仅 `PPTMAKER_FRAMEWORK/`；明确 `deck_*` 归 `run-bundle-layout`、此处不得扩展
- [x] 1.5 MODIFIED `specs/framework-charter/spec.md`：strictness / CONSTITUTION tree 加 *as defined by run-bundle-layout*（镜像非定义）；ADDED BOOTSTRAP GREP 指针 + AGENTS 树；`playbook-execution` Where Map 归属 layout

## 2. Glossary — Where Map（GREP 索引 · apply）

文件：`PPTMAKER_FRAMEWORK/reference/glossary.md`

- [ ] 2.1 在现有分组定义**之上**插入 `## Where Map`；开篇写清：不知往哪放 → **先 GREP Term 再 mkdir**；点名 capability `run-bundle-layout`（≠ `framework-directory-layout`）
- [ ] 2.2 表列固定四列：`Term (GREP this) | Path | Means / put here | Do not`。至少含 design D3 行：`run bundle`、`soft bundle`、`--run-dir`、`_scratch/`、`_generated/`、`slide-specifications.md`、`style_master.jpg`、`contact_sheet`/`pilot`、`_state/`、`_lessons/`、`1_upstream_raw_material/`、`2_backbone/`、`overrides/`、`structure gradient`/`上严下松`
- [ ] 2.3 Path 要能落盘：`_scratch/` → `3_versions/v{n}/_scratch/`；`style_master.jpg` → `2_backbone/visual-style/style_master.jpg`；pilot → `_generated/preview/*contact_sheet*.jpg`；`--run-dir` → `deck_*/3_versions/v{n}/`（表内或旁注写明 ≠ deck 根）
- [ ] 2.4 正文 `###` 标题 = 可搜 token（标题行直接是 `_scratch/` / `--run-dir` / `style_master.jpg` 等，勿只用中文标题当唯一锚）。`### _scratch/` 必须答：是什么、完整相对路径、禁止项（`_tmp`/deck 根 bak）、与 `_generated/` 对比 + 路由（style-iterations / `_lessons` / `_state`）
- [ ] 2.5 一行 Also-search → canonical：`bak`/`temp`/`scratch` → `_scratch/` · `小样`/`preview` → `contact_sheet`/`pilot` · `style master` → `style_master.jpg` · `production`/`derived` → `_generated/`

## 3. 入口文档 — 种检索键（apply）

- [ ] 3.1 `PPTMAKER_FRAMEWORK/BOOTSTRAP.md`「目录结构是宪法」：加一条 **GREP-before-invent**（示例 token 至少 `_scratch`、`_generated`、以及 `style_master` 或 `contact_sheet`/`pilot`）→ 链到 `reference/glossary.md` Where Map；保留/写明 `3_versions/v{n}/_scratch/` + 上严下松。**禁止**把 Where Map 全表贴进 BOOTSTRAP
- [ ] 3.2 `PPTMAKER_FRAMEWORK/AGENTS.md` Phase 0 树：在 `v1/` 下增加 `_scratch/` 行；标注用英文角色词与 glossary 对齐（如 `SCRATCH` · version temp/bak · not SSOT）；引言可点 run-bundle-layout / Where Map；树位置须与 `renderTree()` 一致（scratch 在 version 下，不在 deck 根）

## 4. 种子 README + 金甲板（apply）

- [ ] 4.1 `bundle_layout.mjs` `_DIR_READMES['.']`：根 README 种子写出版本临时在 `3_versions/v{n}/_scratch/` + 上严下松/根最严一句；不知放哪可点 glossary Where Map
- [ ] 4.2 `_DIR_READMES[3_versions]`（或等价 VERSIONS_DIR 键）：`--new-version` 说明改为「不复制 `_generated/` **与** `_scratch/` 内容」
- [ ] 4.3 若 `workflow/00-setup/template-deck-guide.md` 仍缺 `_scratch` / new-version 不拷 scratch，与种子对齐；已对齐则跳过并注明
- [ ] 4.4 **覆盖**（非 `_writeIfAbsent`）`deck_ai_sdlc_keynote/README.md` 与 `3_versions/v1/README.md`，使与现行种子一致且正文出现 `_scratch`（今日 v1 README 仍可能无 scratch 行）

## 5. 回归与闸门

- [ ] 5.1 `tests/test_docs_consistency.mjs`（或等价）：断言 glossary 含 `## Where Map` 与 `### _scratch/`；BOOTSTRAP 含 `Where Map`/`GREP`/`_scratch`；AGENTS 含 `_scratch/`；`bundle_layout.mjs` 根种子串含 `v{n}/_scratch`；金甲板两 README 含 `_scratch`
- [ ] 5.2 `npm test` 全绿；`node PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs --check deck_ai_sdlc_keynote/3_versions/v1 --structure-only` exit 0
- [ ] 5.3 人审 proposal/specs/docs 文案后才 archive；sync 须产生主仓 `openspec/specs/run-bundle-layout/`，且 management Purpose 不再写 “Define … directory structure”；**禁止**自行 commit/archive

> Phase A 机制（`SCRATCH_SUBDIR` / 白名单 / bak 已迁入 `v1/_scratch/`）已是基线，§2–5 勿重做执法逻辑。
