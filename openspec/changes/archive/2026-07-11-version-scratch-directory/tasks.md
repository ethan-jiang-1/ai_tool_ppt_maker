## 1. Constitution SSOT — bundle_layout

- [x] 1.1 Add `SCRATCH_SUBDIR='_scratch'` + `SCRATCH_DIR_README` (上严下松 + 路由表)
- [x] 1.2 `initBundle`: seed `v1/_scratch/README.md`; gitignore scratch contents keep README
- [x] 1.3 `renderTree` + `selfCheck` include `_scratch`
- [x] 1.4 `checkBundle`: allow version `_scratch/`; scan deck root whitelist (拒 bak)
- [x] 1.5 `createVersion` / `--new-version`: empty `_scratch` + README, do not copy old scratch

## 2. Charter / docs

- [x] 2.1 `CONSTITUTION.md`: 上严下松原则 + tree 含 `_scratch/`
- [x] 2.2 `AGENT_CONTRACT.md` §2/§3: 根最严；临时 bak → `_scratch`；禁 deck 根 litter
- [x] 2.3 版本 README 模板 / template-deck-guide：点出 `_scratch`

## 3. Tests + 金甲板

- [x] 3.1 Tests: init has scratch README; scratch under v1 check OK; deck-root bak fails; new-version empty scratch
- [x] 3.2 Move `deck_ai_sdlc_keynote/_slidespec.bak-*` → `3_versions/v1/_scratch/`; `--check` green
- [x] 3.3 `npm test` green
