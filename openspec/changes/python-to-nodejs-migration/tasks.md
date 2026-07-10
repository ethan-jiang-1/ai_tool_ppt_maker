## 1. 项目脚手架

- [ ] 1.1 创建 `PPTMAKER_FRAMEWORK/package.json`, 声明依赖: `@napi-rs/canvas`, `pptxgenjs`, `commander`, `vitest` (dev)
- [ ] 1.2 创建 `PPTMAKER_FRAMEWORK/tsconfig.json` (target ESNext, module ESNext, strict mode)
- [ ] 1.3 `npm install` 验证所有依赖在 macOS 和 Windows 上都能装成功

## 2. 基础设施 (底层, 其他脚本依赖)

- [ ] 2.1 重写 `bundle_layout.ts` (← `bundle_layout.py`, 947 行): 目录结构宪法, `--init`, `--check`, `--new-version`, `--self-check`. 导出路径常量和工具函数
- [ ] 2.2 重写 `visual_config.ts` (← `visual_config.py`, 265 行): Canvas/BodyLayout/HeaderLock 类型定义, `loadVisualConfig()`, `hexToRgba()`
- [ ] 2.3 写 `__tests__/test_bundle_layout.ts`: 目录宪法测试 (init 合规, preset 种子正确, new-version 排除生成产物, check 捕获违规)
- [ ] 2.4 写 `__tests__/test_visual_config.ts`: 配置共享测试 (Stage 1 和 Stage 3 读出相同值, 缺失键回退, hex 转换)

## 3. 生产管线 Stage 1

- [ ] 3.1 重写 `stage1_build_inputs.ts` (← `stage1_build_inputs.py`, 693 行): markdown → `slide_plan.json` + `page_prompts/_prompts.json`. 含 `validate_specs()` 内容门
- [ ] 3.2 写 `__tests__/test_spec_validation.ts`: 内容门测试 (通过/缺失 IMAGE PROMPT/typo RENDER MODE/未填充模板/一次列出所有问题)

## 4. 生产管线 Stage 3 (Header-Lock, 最复杂)

- [ ] 4.1 重写 `stage3_lock_headers.ts` (← `stage3_lock_headers.py`, 482 行): `@napi-rs/canvas` 加载图片 + 画文字 + 阴影 + 保存. 字体三阶解析 (bundled → env var → OS), full-page 直通
- [ ] 4.2 验证: 用真实 `style_master.jpg` + `color_palette.json` 跑 Stage 3, 产出与 Python 版逐像素对比

## 5. 生产管线 Stage 4-5

- [ ] 5.1 重写 `stage4_build_pptx.ts` (← `stage4_build_pptx.py`, 108 行): `pptxgenjs` 组装 PNG → .pptx, 16:9 full-bleed, 锚定匹配
- [ ] 5.2 重写 `stage5_inject_notes.ts` (← `stage5_inject_notes.py`, 100 行): 从 markdown 提取 SPEAKER NOTE, 注入 PPTX notes panel, notes 数量校验
- [ ] 5.3 写 `__tests__/test_pipeline_guards.ts`: 守卫测试 (锚定匹配无子串误中, 缺失/模糊图片 abort, 字体回退, Stage 3 部分图片集 abort)

## 6. 管线编排器

- [ ] 6.1 重写 `unified_pipeline.ts` (← `unified_pipeline.py`, 489 行): Stage 1→2→3→4→5 编排, `--stage all|1,3,4,5|5`, `--only`, `--force-images`, `--dry-run`, `.env` credential loading
- [ ] 6.2 重写 `generate_style_master.ts` (← `generate_style_master.py`, 92 行): 调用 `image2-imagegen` skill 生成 style_master.jpg, credential 桥接
- [ ] 6.3 写 `__tests__/test_pipeline_e2e.ts`: 离线端到端烟测 (init bundle → 写规格 → Stage 1→3→4→5 → 断言 PPTX 存在 + 备注正确)

## 7. CLI 命令面

- [ ] 7.1 重写 `ppt_flow.ts` (← `ppt_flow.py`, 480 行): commander 实现全部 11 个命令: `doctor`, `init`, `status`, `approve`, `style-master`, `validate`, `pilot`, `build`, `refresh`, `new-version`, `test`
- [ ] 7.2 Agent 调用路径验证: `npx tsx 06_reference_scripts/ppt_flow.ts init/build/status` 三条最常用命令端到端通

## 8. 环境检查

- [ ] 8.1 重写 `00-env-check.ts` (← `00-auto-env-check.py`, 363 行): 检查 Node.js >= 18, npm, API key, 磁盘空间, 字体. 输出 READY/NOT READY
- [ ] 8.2 重写 `00_project_setup/02-nodejs-environment.md` (← `02-python-environment.md`): npm 安装说明, `.env` 配置, `package.json` 说明

## 9. 文档更新

- [ ] 9.1 扫描并更新 `AGENTS.md` 中所有 Python 命令示例为 `npx tsx ...` 等效命令
- [ ] 9.2 更新 `BOOTSTRAP.md` Step 1 环境检查为 `npx tsx 00_project_setup/00-env-check.ts`
- [ ] 9.3 更新 `AGENT_CONTRACT.md` 中所有脚本引用
- [ ] 9.4 更新 `README.md`, `QUICK_START.md`, `00_project_setup/README.md` 中的命令示例
- [ ] 9.5 更新 `00_project_setup/03-tool-selection.md` 技术栈描述为 Node.js/TypeScript
- [ ] 9.6 更新 `openspec/config.yaml` context 中工具引用

## 10. 清理

- [ ] 10.1 删除全部 19 个 `.py` 文件
- [ ] 10.2 删除 `stage2_generate_images.LEGACY.py`
- [ ] 10.3 删除 `run_tests.py` (vitest 替代)
- [ ] 10.4 删除 `00_project_setup/test_env_check.py` (已在 `__tests__/` 中重写)
- [ ] 10.5 删除 `00_project_setup/02-python-environment.md` (已由 `02-nodejs-environment.md` 替代)
- [ ] 10.6 删除 `pyproject.toml` 和 `uv.lock` 模板引用 (如果有)

## 11. 最终验证

- [ ] 11.1 `npx vitest run` 全部测试通过
- [ ] 11.2 完整流程: init → stage all → 产出 .pptx 文件, 与 Python 版产出外观一致
- [ ] 11.3 在 Windows 上跑通 11.1 和 11.2
- [ ] 11.4 写 `__tests__/test_docs_consistency.ts`: 静态漂移守卫 (link 解析, 退役 contract 检查, BOOTSTRAP 步骤顺序)
