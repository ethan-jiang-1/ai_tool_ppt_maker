## Why

**Phase A（已落地）：** Agent 改 `slide-specifications` 前会拷 `.bak`，却因 version 根过严、deck 根过松而把备份丢到 `deck_*` 根。已用 **上严下松** + 版本内 `_scratch/` + `checkBundle` 收紧根白名单修好**机制**。

**Phase B（本轮打开要补的）：** 机制在宪章深文与叶子 `_scratch/README` 里，**不在 Agent 第一眼会 GREP 的入口**。BOOTSTRAP / AGENTS Phase 0 树 / deck 根 README 种子 / 活金甲板 README 仍缺 `_scratch` 与落盘词表 → 模型「不知道往哪放」时仍会临场发挥。

规矩要 **GREP 友好**：不知道放哪 → `rg` 稳定英文 term / 真路径 → 命中 Where Map（term → path → role）→ 按规矩放。找不到 = 会乱发挥。

## What Changes

### Already done (do not re-litigate)

- `SCRATCH_SUBDIR='_scratch'`；version 白名单；deck 根拒 litter
- CONSTITUTION「目录严格度」+ AGENT_CONTRACT §2/§3 上严下松
- init / new-version 种子；gitignore；金甲板 bak → `v1/_scratch/`
- 回归绿

### Still to do (Phase B — discoverability)

- **Where Map（GREP 索引）** 写入 `reference/glossary.md`：高频落盘物用**可搜标题**（`_scratch/`、`_generated/`、`style_master.jpg`、`--run-dir`、`contact_sheet` / `pilot` 等）+ 一行 path / means / do-not；Also-search 别名指向 canonical
- **BOOTSTRAP** 宪法段：一句「找不到往哪放 → 先 GREP 这些键 → glossary Where Map」
- **AGENTS** Phase 0 树：与 `renderTree()` 对齐，标注 `_scratch/`（英文角色标签与 glossary 同词）
- **`_DIR_READMES`**：deck 根 README 含 `_scratch` 归属 + 上严下松；`3_versions` README 写明 new-version 不拷 `_scratch` 内容；必要时与 template-deck-guide 对齐
- **活金甲板**：强制刷新 `deck_ai_sdlc_keynote/README.md` + `v1/README.md`（`_writeIfAbsent` 不会自动更新旧文）
- **轻测**：入口文档 / 种子含 `_scratch` 或 Where Map 锚；keynote `--structure-only` 仍绿

**Non-goals：** 不改 `_scratch` 路径；不加 deck 根 scratch；不重开机制辩论；不批量改写全库旧 deck（只修框架种子 + 金甲板样本）。

**BREAKING：** 无新增（Phase A 已对乱放习惯 breaking）。

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `run-bundle-management` —（已有 `_scratch` 机制）补：种子 README / 入口树与 Where Map 可发现性一致
- `framework-charter` —（已有上严下松）补：BOOTSTRAP / glossary Where Map / GREP-first 指引
- `playbook-execution` —（已有 bak→scratch 路由）补：Agent 不知放哪时先 GREP Where Map，禁止自创临时目录名

## Impact

- `PPTMAKER_FRAMEWORK/reference/glossary.md`（Where Map SSOT）
- `PPTMAKER_FRAMEWORK/BOOTSTRAP.md`、`AGENTS.md`
- `PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs`（`_DIR_READMES` 文案）
- 可选：`workflow/00-setup/template-deck-guide.md`
- 活样本：`deck_ai_sdlc_keynote/README.md`、`3_versions/v1/README.md`
- 轻测：docs / bundle 断言各 ≥1；keynote structure-only
