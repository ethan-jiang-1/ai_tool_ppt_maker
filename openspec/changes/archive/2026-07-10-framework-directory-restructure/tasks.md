## 1. 创建 charter/ 目录和宪法文件

- [x] 1.1 创建 `PPTMAKER_FRAMEWORK/charter/` 目录
- [x] 1.2 创建 `charter/CONSTITUTION.md`:
  - 声明 `bundle_layout.mjs` 为唯一权威源
  - 贴 `renderTree()` 输出的权威树 (标注"这是快照, 以代码为准")
  - 写三层梯度说明 (上游/中游/下游) + 覆盖规则
  - 写初始化/校验命令
  - 合并 `01-directory-template.md` 的核心内容
- [x] 1.3 创建 `charter/WORKFLOW.md`:
  - 5 Phase 总览表 (Phase/做什么/Gate/Agent角色)
  - 编辑链 A/B/C/Structural 表格 (变更类型/Stage/耗时)
  - Agent 入口序列 (CLAUDE → BOOTSTRAP → CONTRACT → per-Phase AGENTS)
  - Gate 机制说明
- [x] 1.4 `git mv PPTMAKER_FRAMEWORK/AGENT_CONTRACT.md PPTMAKER_FRAMEWORK/charter/AGENT_CONTRACT.md`

## 2. 创建 COMMANDS.md

- [x] 2.1 创建 `PPTMAKER_FRAMEWORK/COMMANDS.md`:
  - 全量创建入口 ("帮我做一个PPT" → BOOTSTRAP → Phase 0-4)
  - 四类编辑链映射表 (每类至少一个中文示例)
  - 迭代反馈模式 (论证问题/数据更新/风格调整/整体感觉不够高端)
  - Agent 分类逻辑简述 (改了什么→几页→要pilot吗)
  - 从 `automation/change-classifier.md` 提炼核心逻辑, 面向人类可读, 30 秒可扫完

## 3. 根级瘦身: 4 个文件移入 00_project_setup

- [x] 3.1 `git mv PPTMAKER_FRAMEWORK/QUICK_START.md PPTMAKER_FRAMEWORK/00_project_setup/QUICK_START.md`
- [x] 3.2 `git mv PPTMAKER_FRAMEWORK/GLOSSARY.md PPTMAKER_FRAMEWORK/00_project_setup/GLOSSARY.md`
- [x] 3.3 `git mv PPTMAKER_FRAMEWORK/ANTI_PATTERNS.md PPTMAKER_FRAMEWORK/00_project_setup/ANTI_PATTERNS.md`
- [x] 3.4 `git mv PPTMAKER_FRAMEWORK/VERSION_LOG.md PPTMAKER_FRAMEWORK/00_project_setup/VERSION_LOG.md`

## 4. 删除旧文件

- [x] 4.1 `git rm PPTMAKER_FRAMEWORK/00_project_setup/01-directory-template.md`
- [x] 4.2 清理 `bundle_layout.mjs` 头注释中的 `.py` 残留引用

## 5. 更新关键入口链文件 (手动精确替换)

- [x] 5.1 更新 `CLAUDE.md`: `AGENT_CONTRACT.md` → `charter/AGENT_CONTRACT.md`
- [x] 5.2 更新 `BOOTSTRAP.md`:
  - `AGENT_CONTRACT.md` → `charter/AGENT_CONTRACT.md`
  - `GLOSSARY.md` → `00_project_setup/GLOSSARY.md`
  - `ANTI_PATTERNS.md` → `00_project_setup/ANTI_PATTERNS.md`
  - `QUICK_START.md` → `00_project_setup/QUICK_START.md`
- [x] 5.3 更新 `README.md`:
  - 目录树图更新 (移除移走的文件, 新增 charter/ 和 COMMANDS.md)
  - 添加 charter/ 的用途说明
  - 所有内部链接更新
- [x] 5.4 更新 `AGENTS.md`:
  - `QUICK_START.md` → `00_project_setup/QUICK_START.md`
  - `AGENT_CONTRACT.md` → `charter/AGENT_CONTRACT.md`

## 6. 全量扫描更新其他文档

- [x] 6.1 执行全量搜索找残留引用:
  ```bash
  grep -rn "AGENT_CONTRACT\.md\|QUICK_START\.md\|GLOSSARY\.md\|ANTI_PATTERNS\.md\|VERSION_LOG\.md\|01-directory-template" PPTMAKER_FRAMEWORK/ --include="*.md"
  ```
- [x] 6.2 逐个替换所有非 self-referencing 的旧路径 (charter 内部和 00_project_setup 内部的自我引用保持不变)
- [x] 6.3 更新 `00_project_setup/README.md`: 文件清单加 4 个新移入文件, 移除 `01-directory-template.md`
- [x] 6.4 更新 repo 根 `AGENTS.md`: 如有引用 PPTMAKER_FRAMEWORK 内部文件, 同步更新路径

## 7. 验证

- [x] 7.1 确认根级精确只有 5 个 .md: `ls PPTMAKER_FRAMEWORK/*.md | wc -l` = 5
- [x] 7.2 确认 charter/ 精确只有 3 个文件: `ls PPTMAKER_FRAMEWORK/charter/ | wc -l` = 3
- [x] 7.3 全量 grep 零残留 (charter/ 和 00_project_setup/ 内部自我引用除外):
  ```bash
  grep -rn "QUICK_START\.md\|GLOSSARY\.md\|ANTI_PATTERNS\.md\|VERSION_LOG\.md" PPTMAKER_FRAMEWORK/ --include="*.md" | grep -v "00_project_setup/"
  grep -rn "AGENT_CONTRACT\.md" PPTMAKER_FRAMEWORK/ --include="*.md" | grep -v "charter/"
  grep -rn "01-directory-template" PPTMAKER_FRAMEWORK/ --include="*.md"
  ```
- [x] 7.4 所有内部链接可点击不失效 (手动抽查 README → charter/CONSTITUTION, BOOTSTRAP → charter/AGENT_CONTRACT)
- [x] 7.5 `node PPTMAKER_FRAMEWORK/06_reference_scripts/bundle_layout.mjs --self-check` 通过
- [x] 7.6 `node PPTMAKER_FRAMEWORK/06_reference_scripts/bundle_layout.mjs` 打印完整权威树
- [x] 7.7 `npm test` 25 tests 仍然全部通过
- [x] 7.8 `git log --follow PPTMAKER_FRAMEWORK/charter/AGENT_CONTRACT.md` 确认 git 历史保留
- [x] 7.9 `git diff HEAD -- PPTMAKER_FRAMEWORK/00_project_setup/QUICK_START.md` 确认移入的 4 个文件内容未变
- [x] 7.10 抽查: 打开 README.md 能看到 charter/ 和 COMMANDS.md 的描述
