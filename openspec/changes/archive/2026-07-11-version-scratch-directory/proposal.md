## Why

Agent 改 `slide-specifications` 前会拷 `.bak`，却因 **version 根过严、deck 根过松** 而把备份丢到 `deck_*` 根（如金甲板 `_slidespec.bak-*`）。有 v2/v3 时必然混乱。

**宪章原则：上严下松（组织层级）** — run bundle 根最严；越往下越松；版本 `_scratch/` 是最松的官方出口。未说清原则时 Agent 会往上逃。

## What Changes

- **宪章**：CONSTITUTION + AGENT_CONTRACT 写明上严下松
- 新增版本内 `3_versions/v{n}/_scratch/`（README + 路由表）：本版临时/备份唯一出口；非 SSOT、可 `rm`、不进管线
- `checkBundle`：**放行** version 根 `_scratch/`；**收紧** deck 根白名单（拒散落 bak 等）
- `init` / `--new-version`：种子空 `_scratch/README.md`（新版不拷旧 scratch）
- gitignore：scratch 内容忽略、保留 README
- 金甲板：两份 bak 迁入 `v1/_scratch/`

**BREAKING（对乱放习惯）：** deck 根再放 `_slidespec.bak*` → `--check` 失败。

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `run-bundle-management` — `_scratch` 入树/init/check/new-version/gitignore；deck 根意外条目检查
- `framework-charter` — CONSTITUTION 树 + CONTRACT §2/§3：上严下松 + scratch 出口
- `playbook-execution` — 改 slidespec 前 bak → `v{n}/_scratch`；禁止 deck 根散落

## Impact

- `PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs`（SSOT）
- AGENT_CONTRACT / CONSTITUTION / template-deck-guide / 版本 README 种子
- 测试：`test_bundle_layout.mjs`
- 活 deck：`deck_ai_sdlc_keynote` bak 迁移
