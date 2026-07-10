## Why

PPTMAKER_FRAMEWORK 根目录有两套组织原则在打架: Phase 编号 (00-05) 和内容类型 (scripts/automation/charter)。`06_reference_scripts` 的 "06" 编号毫无意义——它不是一个 Phase, 审计确认没有任何文档解释过这个编号的来历。"reference_scripts" 名字也误导——这些就是生产脚本, 不是"参考"实现。`automation/` 只有 2 个 .md 文件却占一个根目录位。"automation" 这个词在一个自动化框架里等于没起名。

上一轮重组 (framework-directory-restructure) 解决了根级 .md 混乱和宪法缺失, 但未触及目录结构本身。这次统一组织原则: **根按"这是什么"分**——workflow (方法论), scripts (可执行代码), charter (宪法), reference (附录)。

## What Changes

```
BEFORE (根 9 个子目录)                  AFTER (根 4 个子目录)
────────────────────────                ────────────────────────
PPTMAKER_FRAMEWORK/                      PPTMAKER_FRAMEWORK/
├── 00_project_setup/        ──→         ├── workflow/
├── 01_visual_style_master/  ──→         │   ├── 00-setup/
├── 02_content_design/       ──→         │   ├── 01-visual/
├── 03_image_prompts/        ──→         │   ├── 02-content/
├── 04_production_pipeline/  ──→         │   ├── 03-prompts/
├── 05_iteration/            ──→         │   ├── 04-production/
├── 06_reference_scripts/    ──→         │   └── 05-iteration/
├── automation/              ──→         ├── scripts/
└── charter/                              │   ├── *.mjs, fonts/
                                         │   ├── agent-prompts.md
                                         │   └── change-classifier.md
                                         ├── charter/ (不变)
                                         └── reference/
                                             ├── quick-start.md
                                             ├── glossary.md
                                             ├── anti-patterns.md
                                             └── version-log.md
```

- **新建 `workflow/`**: 6 个 Phase 目录移入, 同时缩短名称 (去掉 `_project_`/`_master`/`_design`/`_image_`/`_pipeline`)
- **`06_reference_scripts/` → `scripts/`**: 丢掉假编号, 丢掉误导的 "reference"
- **删除 `automation/`**: 2 个文件并入 `scripts/`
- **新建 `reference/`**: 4 个附录文件从 `00_project_setup` 移出 (它们不是 setup 文档, 是纯查找材料)
- **`00-env-check.mjs` → `scripts/env-check.mjs`**: 它是脚本, 不该在 setup 目录里
- **全量路径更新**: ~30 个 .md + 10 个 .mjs 中的旧路径

## Capabilities

### New Capabilities

- `framework-directory-layout`: 框架根目录进入规范——4 个子目录 (workflow/scripts/charter/reference) + 5 个 .md 入口. 组织原则: 按"是什么"分, 不按"第几个 Phase"分

### Modified Capabilities

_无. `framework-charter` 和 `commands-reference` 的 spec 文件中包含旧目录路径需要更新, 但 capability 的行为需求不变——仅是文档内路径引用的同步._

## Impact

| 影响面 | 说明 |
|--------|------|
| `PPTMAKER_FRAMEWORK/` 根 | 9 个子目录 → 4 个 |
| `workflow/` | 新建, 6 个子目录 |
| `scripts/` | 原 `06_reference_scripts/` 改名 + `automation/` 合并 + `00-env-check.mjs` 移入 |
| `reference/` | 新建, 4 个附录文件 |
| `automation/` | 删除 (空目录) |
| 旧目录名 (`00_project_setup/`, `01_visual_style_master/`, ...) | 全部消失 |
| 所有 .mjs import 路径 | 更新 |
| 所有 .md 交叉引用 | 更新 (PPTMAKER_FRAMEWORK 内 ~30+ 文件 + `openspec/specs/` 内 17 处) |
| `openspec/config.yaml` | capability 表格脚本路径更新 |
| `openspec/specs/` (主 spec) | 11 个 spec 文件中的旧路径更新 |
