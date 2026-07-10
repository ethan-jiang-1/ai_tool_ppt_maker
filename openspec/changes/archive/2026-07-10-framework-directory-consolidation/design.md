## Context

PPTMAKER_FRAMEWORK 根 9 个子目录使用两套组织原则: 00-05 按 Phase 编号, `automation/`/`charter/`/`06_reference_scripts/` 按内容类型。`06_reference_scripts` 的 "06" 编号被审计确认为无意义——仅因为排在 Phase 05 后面。根目录打开后信息密度过高, 同一类内容分散在多处 (setup 文件在 00 目录, 脚本在 06 目录, Agent 工具在 automation 目录)。

## Goals / Non-Goals

**Goals:**
- 根子目录从 9 减到 4: workflow/, scripts/, charter/, reference/
- `06_reference_scripts/` → `scripts/` (去掉假编号和误导的 "reference")
- 删除 `automation/` (2 个文件并入 `scripts/`)
- 6 个 Phase 目录收入 `workflow/`, 缩短名称
- 4 个附录文件提取到 `reference/`
- `00-env-check.mjs` 移入 `scripts/env-check.mjs`
- 所有路径引用更新

**Non-Goals:**
- 不改变任何脚本功能或 capability 行为
- 不改变 run bundle 目录结构
- 不修改 charter/ 内部文件

## Decisions

### 1. 根目录: 4 个就够了

| 目录 | 内容 | 受众 |
|------|------|------|
| `workflow/` | 方法论: Phase 00→05 | Human + Agent |
| `scripts/` | 可执行代码: 10 个 .mjs + fonts + agent 工具 | Agent |
| `charter/` | 宪法: 结构/流程/行为 | Both |
| `reference/` | 附录: quick start/glossary/anti-patterns/version-log | Human |

### 2. Phase 目录命名: 缩短

| 原名 | 新名 | 理由 |
|------|------|------|
| `00_project_setup` | `00-setup` | 本来就是 setup, "project" 冗余 |
| `01_visual_style_master` | `01-visual` | "master" 冗余 |
| `02_content_design` | `02-content` | "design" 冗余 (content 本身就在 design) |
| `03_image_prompts` | `03-prompts` | "image" 冗余 ("prompts" 在 PPT 上下文就是图) |
| `04_production_pipeline` | `04-production` | "pipeline" 冗余 |
| `05_iteration` | `05-iteration` | 保持 |

### 3. scripts/ 合并范围

`scripts/` 收三样东西:
- 原 `06_reference_scripts/` 全部内容 (10 .mjs + fonts/)
- `automation/` 的 2 个 .md
- `00_project_setup/00-env-check.mjs` → `scripts/env-check.mjs`

### 4. 文件移动 (全部 git mv)

```bash
# workflow/ 包装
git mv 00_project_setup/ workflow/00-setup/
git mv 01_visual_style_master/ workflow/01-visual/
git mv 02_content_design/ workflow/02-content/
git mv 03_image_prompts/ workflow/03-prompts/
git mv 04_production_pipeline/ workflow/04-production/
git mv 05_iteration/ workflow/05-iteration/

# scripts/ 改名 + 合并
git mv 06_reference_scripts/ scripts/
git mv automation/agent_prompts.md scripts/agent-prompts.md
git mv automation/change-classifier.md scripts/change-classifier.md
git mv workflow/00-setup/00-env-check.mjs scripts/env-check.mjs

# reference/ 提取
mkdir reference/
git mv workflow/00-setup/QUICK_START.md reference/quick-start.md
git mv workflow/00-setup/GLOSSARY.md reference/glossary.md
git mv workflow/00-setup/ANTI_PATTERNS.md reference/anti-patterns.md
git mv workflow/00-setup/VERSION_LOG.md reference/version-log.md

# 清理
rmdir automation/
```

### 5. 路径更新策略

**bundle_layout.mjs** (SSOT, 定义框架内模板路径):
- `STYLE_PRESETS_DIR = "workflow/01-visual/presets"`
- `DECK_TYPE_DIR = "workflow/02-content/presets/deck-type-templates"`
- `BACKBONE_FILE_SEEDS` 中的模板路径

**所有 .mjs 脚本** (相对 import):
- 脚本彼此之间的 import 路径不变 (都在 `scripts/` 内, 相对路径不涉及目录名)

**硬编码路径 (具体需要更新)**:
- `scripts/env-check.mjs`: `resolve(__dirname, '..', '06_reference_scripts', 'fonts')` → `resolve(__dirname, 'fonts')` (fonts 现在在同一目录)
- `scripts/env-check.mjs`: 用户提示字符串 `"Drop SourceSansPro-*.otf into 06_reference_scripts/fonts/"` → `"Drop SourceSansPro-*.otf into scripts/fonts/"`
- `scripts/ppt_flow.mjs`: `join(FRAMEWORK_DIR, "00_project_setup", "00-env-check.mjs")` → `join(FRAMEWORK_DIR, "scripts", "env-check.mjs")`
- `scripts/unified_pipeline.mjs`: 脚本路径字符串 (如 `stage3_lock_headers.py` → `stage3_lock_headers.mjs`)
- `scripts/bundle_layout.mjs`: `init_bundle` 中 deck-guide.md 模板里的 `unified_pipeline.mjs` 和 `bundle_layout.mjs` 路径字符串

**所有 .md 文件** (~30+ 个):
- 全量 grep + sed: 旧目录名 → 新目录名
- 验证: 零残留

## Risks / Trade-offs

**[R] 移动涉及 6 个目录 + 7 个文件, 路径更新量大**
→ 分步执行: 先移目录, 再移文件, 最后全量 grep/sed 更新

**[R] bundle_layout.mjs 中的 frameworkDir 计算**
→ `resolve(__dirname, "..")` 从 `scripts/` 向上 = framework 根, 仍然正确. 但 `init_bundle` 依赖的 `frameworkDir` 参数要注意

**[R] 测试文件中的硬编码路径**
→ `test_docs_consistency.mjs` 和 `test_env_check.mjs` 需更新

**[R] sed 替换顺序风险** — 如果先替换 `00_project_setup` → `workflow/00-setup`, 再替换 `automation/` → `scripts/`, 没问题. 但如果 sed 模式太宽 (如 `/automation/`), 会误伤已替换的内容. → 替换顺序: 先改长名 (Phase 目录), 再改短名 (scripts, reference). 每个模式用精确匹配: `\b00_project_setup\b` → `workflow/00-setup`.

**[R] `openspec/specs/` 主 spec 引用旧路径** — 17 处分布在 5 个 spec 文件中 → 需纳入全量 grep/sed 更新范围
