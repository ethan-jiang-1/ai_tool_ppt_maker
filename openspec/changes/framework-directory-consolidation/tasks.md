## 1. 创建 workflow/ 并移入 Phase 目录

- [ ] 1.1 `mkdir PPTMAKER_FRAMEWORK/workflow/`
- [ ] 1.2 `git mv PPTMAKER_FRAMEWORK/00_project_setup PPTMAKER_FRAMEWORK/workflow/00-setup`
- [ ] 1.3 `git mv PPTMAKER_FRAMEWORK/01_visual_style_master PPTMAKER_FRAMEWORK/workflow/01-visual`
- [ ] 1.4 `git mv PPTMAKER_FRAMEWORK/02_content_design PPTMAKER_FRAMEWORK/workflow/02-content`
- [ ] 1.5 `git mv PPTMAKER_FRAMEWORK/03_image_prompts PPTMAKER_FRAMEWORK/workflow/03-prompts`
- [ ] 1.6 `git mv PPTMAKER_FRAMEWORK/04_production_pipeline PPTMAKER_FRAMEWORK/workflow/04-production`
- [ ] 1.7 `git mv PPTMAKER_FRAMEWORK/05_iteration PPTMAKER_FRAMEWORK/workflow/05-iteration`
- [ ] 1.8 创建 `workflow/README.md` — 工作流全貌: Phase 顺序, 编辑链, gate 地图

## 2. 重命名 scripts/ + 合并 automation/

- [ ] 2.1 `git mv PPTMAKER_FRAMEWORK/06_reference_scripts PPTMAKER_FRAMEWORK/scripts`
- [ ] 2.2 `git mv PPTMAKER_FRAMEWORK/automation/agent_prompts.md PPTMAKER_FRAMEWORK/scripts/agent-prompts.md`
- [ ] 2.3 `git mv PPTMAKER_FRAMEWORK/automation/change-classifier.md PPTMAKER_FRAMEWORK/scripts/change-classifier.md`
- [ ] 2.4 `rmdir PPTMAKER_FRAMEWORK/automation/`
- [ ] 2.5 `git mv PPTMAKER_FRAMEWORK/workflow/00-setup/00-env-check.mjs PPTMAKER_FRAMEWORK/scripts/env-check.mjs`
- [ ] 2.6 创建 `scripts/README.md` — 脚本清单, 每个脚本的用途/输入/输出

## 3. 提取 reference/

- [ ] 3.1 `mkdir PPTMAKER_FRAMEWORK/reference/`
- [ ] 3.2 `git mv PPTMAKER_FRAMEWORK/workflow/00-setup/QUICK_START.md PPTMAKER_FRAMEWORK/reference/quick-start.md`
- [ ] 3.3 `git mv PPTMAKER_FRAMEWORK/workflow/00-setup/GLOSSARY.md PPTMAKER_FRAMEWORK/reference/glossary.md`
- [ ] 3.4 `git mv PPTMAKER_FRAMEWORK/workflow/00-setup/ANTI_PATTERNS.md PPTMAKER_FRAMEWORK/reference/anti-patterns.md`
- [ ] 3.5 `git mv PPTMAKER_FRAMEWORK/workflow/00-setup/VERSION_LOG.md PPTMAKER_FRAMEWORK/reference/version-log.md`

## 4. 更新 bundle_layout.mjs (SSOT 路径)

- [ ] 4.1 更新 `STYLE_PRESETS_DIR` → `workflow/01-visual/presets`
- [ ] 4.2 更新 `DECK_TYPE_DIR` → `workflow/02-content/presets/deck-type-templates`
- [ ] 4.3 更新 `BACKBONE_FILE_SEEDS` 中的模板路径 (6 个)
- [ ] 4.4 更新 `init_bundle` 中 deck-guide.md 模板里的脚本路径字符串
- [ ] 4.5 运行 `node scripts/bundle_layout.mjs --self-check` 确认通过

## 5. 更新 .mjs 脚本中的硬编码路径

- [ ] 5.1 `scripts/env-check.mjs`: 更新 fonts 搜索路径
- [ ] 5.2 `scripts/ppt_flow.mjs`: 更新 env-check.mjs 路径引用
- [ ] 5.3 `scripts/unified_pipeline.mjs`: 更新脚本路径
- [ ] 5.4 全局 grep `.mjs` 文件确认无残留旧路径

## 6. 全量更新 .md 文件中的路径引用

- [ ] 6.1 替换所有 `00_project_setup` → `workflow/00-setup`
- [ ] 6.2 替换所有 `01_visual_style_master` → `workflow/01-visual`
- [ ] 6.3 替换所有 `02_content_design` → `workflow/02-content`
- [ ] 6.4 替换所有 `03_image_prompts` → `workflow/03-prompts`
- [ ] 6.5 替换所有 `04_production_pipeline` → `workflow/04-production`
- [ ] 6.6 替换所有 `05_iteration` → `workflow/05-iteration`
- [ ] 6.7 替换所有 `06_reference_scripts` → `scripts`
- [ ] 6.8 替换所有 `automation/` → `scripts/` (对于 agent_prompts.md 和 change-classifier.md)
- [ ] 6.9 更新 `workflow/00-setup/README.md` 文件清单
- [ ] 6.10 更新 `workflow/00-setup/README.md`: 移除 QUICK_START/GLOSSARY/ANTI_PATTERNS/VERSION_LOG/env-check 引用, 指向 `../reference/` 和 `../scripts/`
- [ ] 6.11 更新 repo 根 `AGENTS.md` 目录地图
- [ ] 6.12 更新 `openspec/specs/` 中 11 个主 spec 文件的旧路径引用 (全量 grep + sed)
- [ ] 6.13 检查并清理 `workflow/00-setup/__pycache__/` (如存在)

## 7. 更新测试、配置和 openspec/specs/

- [ ] 7.1 `tests/test_docs_consistency.mjs`: CRITICAL_FILES 路径更新
- [ ] 7.2 `tests/test_env_check.mjs`: env-check.mjs 路径更新
- [ ] 7.3 `tests/test_bundle_layout.mjs`: bundle 路径更新 (如有)
- [ ] 7.4 `openspec/config.yaml`: capability 表格中的脚本路径更新
- [ ] 7.5 `openspec/specs/`: 全量 grep + sed 更新 17 处旧路径引用

## 8. 验证

- [ ] 8.1 根只有 4 个子目录: `ls -d PPTMAKER_FRAMEWORK/*/ | wc -l` = 4
- [ ] 8.2 `node PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs --self-check` 通过
- [ ] 8.3 `node PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs` 打印完整权威树
- [ ] 8.4 `npm test` 全部通过
- [ ] 8.5 `grep -r "06_reference_scripts\|00_project_setup\|automation/" PPTMAKER_FRAMEWORK/` 零残留 (VERSION_LOG 历史引用除外)
- [ ] 8.6 `grep -r "01_visual_style_master\|02_content_design\|03_image_prompts\|04_production_pipeline\|05_iteration" PPTMAKER_FRAMEWORK/` 零残留
- [ ] 8.7 `grep -r "06_reference_scripts\|00_project_setup\|automation/\|01_visual_style_master\|02_content_design\|03_image_prompts\|04_production_pipeline\|05_iteration" openspec/specs/` 零残留
- [ ] 8.8 `node PPTMAKER_FRAMEWORK/scripts/env-check.mjs` 正常运行
