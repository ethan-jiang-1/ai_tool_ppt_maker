## 1. 项目脚手架

- [x] 1.1 创建 repo 根 `package.json`, 依赖: `@napi-rs/canvas`, `pptxgenjs`, `commander`. devDeps: `vitest`
- [x] 1.2 `npm install` 验证所有依赖在 macOS 和 Windows 上都能装成功 (含 `@napi-rs/canvas` 原生模块)

## 2. 基础设施 (底层, 其他脚本依赖)

- [x] 2.1 重写 `bundle_layout.mjs` (← `bundle_layout.py`, 947 行): 目录结构宪法, `--init`, `--check`, `--new-version`, `--self-check`. 导出路径常量和工具函数
- [x] 2.2 重写 `visual_config.mjs` (← `visual_config.py`, 265 行): 导出一个 config loader, `loadVisualConfig()`, `hexToRgba()`. 确保 Stage 1 和 Stage 3 消费同一份 config
- [x] 2.3 写 `tests/test_bundle_layout.mjs`: init 合规, preset 种子, new-version 排除生成产物, check 捕获违规
- [x] 2.4 写 `tests/test_visual_config.mjs`: Stage 1/3 共享配置, 缺失键回退, hex 转换
- [x] 2.5 写 `tests/test_docs_consistency.mjs`: markdown link 解析, 退役 contract 检查, BOOTSTRAP 步骤顺序

## 3. 生产管线 Stage 1

- [x] 3.1 重写 `stage1_build_inputs.mjs` (← `stage1_build_inputs.py`, 693 行): markdown → `slide_plan.json` + `page_prompts/_prompts.json`. 含 `validate_specs()` 内容门
- [x] 3.2 写 `tests/test_stage1_build_inputs.mjs`: 有效规格通过; 缺失 IMAGE PROMPT/TITLE 报错; typo RENDER MODE; 未填充模板; 一次列出所有问题

## 4. 生产管线 Stage 3 (Header-Lock)

- [x] 4.1 重写 `stage3_lock_headers.mjs` (← `stage3_lock_headers.py`, 482 行): `@napi-rs/canvas` 加载图片 + 画文字 + 阴影 + 保存. 字体三阶解析, full-page 直通
- [x] 4.2 写 `tests/test_stage3_lock_headers.mjs`: body+header-lock 文字叠加, full-page 直通, 字体回退, 部分图片集 abort, 像素位置正确

## 5. 生产管线 Stage 4-5

- [x] 5.1 重写 `stage4_build_pptx.mjs` (← `stage4_build_pptx.py`, 108 行): `pptxgenjs` 组装 PNG → .pptx, 16:9 full-bleed, 锚定匹配 (无子串误中)
- [x] 5.2 写 `tests/test_stage4_build_pptx.mjs`: 锚定匹配, 缺失/模糊图片 abort, 输出 PPTX 页数正确
- [x] 5.3 重写 `stage5_inject_notes.mjs` (← `stage5_inject_notes.py`, 100 行): 提取 SPEAKER NOTE, 注入 PPTX notes panel, notes 数量校验
- [x] 5.4 写 `tests/test_stage5_inject_notes.mjs`: notes 数量匹配, 空 notes 处理, 格式兼容

## 6. 管线编排器 + 辅助

- [x] 6.1 重写 `unified_pipeline.mjs` (← `unified_pipeline.py`, 489 行): Stage 1→2→3→4→5 编排, `--stage`, `--only`, `--force-images`, `--dry-run`, `.env` credential loading
- [x] 6.2 写 `tests/test_unified_pipeline.mjs`: 离线端到端 (init → Stage 1→3→4→5 → 断言 PPTX + 备注), 编辑链 A/B/C 参数
- [x] 6.3 重写 `generate_style_master.mjs` (← `generate_style_master.py`, 92 行): 调用 `image2-imagegen` skill 生成 `style_master.jpg`, credential 桥接
- [x] 6.4 写 `tests/test_generate_style_master.mjs`: credential 桥接正确, 输出文件存在

## 7. CLI + 环境检查

- [x] 7.1 重写 `ppt_flow.mjs` (← `ppt_flow.py`, 480 行): commander 实现全部 11 个命令: `doctor`, `init`, `status`, `approve`, `style-master`, `validate`, `pilot`, `build`, `refresh`, `new-version`, `test`
- [x] 7.2 写 `tests/test_ppt_flow.mjs`: init/build/status 端到端, 命令路由正确
- [x] 7.3 重写 `00-env-check.mjs` (← `00-auto-env-check.py`, 363 行): 零依赖, Node.js >= 18, npm, API key, 磁盘, 字体. READY/NOT READY
- [x] 7.4 写 `tests/test_env_check.mjs`: 全部通过 → READY exit 0; 缺失 Node → FOUNDATION NOT READY; 缺失 deps → NOT READY
- [x] 7.5 创建 `00_project_setup/02-nodejs-environment.md`: npm 安装, `.env` 配置, `package.json` 说明

## 9. 文档更新 (命令示例 + 技术栈描述)

- [x] 9.1 扫描并更新 `AGENTS.md` 中所有 Python 命令示例为 `node ...` 等效命令
- [x] 9.2 更新 `BOOTSTRAP.md` Step 1 环境检查为 `node 00_project_setup/00-env-check.mjs`
- [x] 9.3 更新 `AGENT_CONTRACT.md` 中所有脚本引用和命令示例
- [x] 9.4 更新 `README.md`, `QUICK_START.md`, `00_project_setup/README.md` 中的命令示例
- [x] 9.5 更新 `00_project_setup/03-tool-selection.md` 技术栈描述为 Node.js ESM, 依赖列表同步
- [x] 9.6 更新 `00_project_setup/01-directory-template.md` 中 `bundle_layout.py` 引用为 `bundle_layout.mjs`
- [x] 9.7 更新 `00_project_setup/template-deck-guide.md` 中所有脚本路径和命令
- [x] 9.8 更新 `openspec/config.yaml` context 中工具引用为 `node` 形式

## 10. 清理

- [x] 10.1 删除全部 19 个 `.py` 文件
- [x] 10.2 删除 `stage2_generate_images.LEGACY.py`
- [x] 10.3 删除 `run_tests.py` (vitest 替代)
- [x] 10.4 删除 `00_project_setup/test_env_check.py` (已在 `tests/` 中重写)
- [x] 10.5 删除 `00_project_setup/02-python-environment.md` (已由 `02-nodejs-environment.md` 替代)
- [x] 10.6 删除可能存在的 Python 配置残留 (`pyproject.toml`, `uv.lock`, `__pycache__/`, `.venv/`)

## 11. 最终验证

- [x] 11.1 `npx vitest run` 在 repo 根目录跑, 全部测试通过
- [x] 11.2 完整流程: init → stage all → 产出 .pptx 文件, 与 Python 版产出视觉一致
- [x] 11.3 在 Windows 上跑通 11.1 和 11.2
- [x] 11.4 `00-env-check.mjs` 独立验证: 在全新 Windows/macOS 机器上跑, 确保 READY/NOT READY 逻辑正确
