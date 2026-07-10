## Why

PPTMAKER_FRAMEWORK 根级摊着 9 个 `.md` 文件, 打开后人类和 Agent 都不知道先看哪个:

- **SSOT 看不见**: `bundle_layout.mjs` 是 run bundle 目录结构的唯一权威源, 但它藏在 `06_reference_scripts/` 深处. 审计发现 **36 个文件**引用了目录结构——6 个含完整树图, 7 个脚本 import 常量, 23 个文档在散文里引用. 没有一个显眼的"宪法"文件告诉读者"结构以这里为准".
- **根文件分类混乱**: `AGENT_CONTRACT.md` (Agent 铁律) 和 `QUICK_START.md` (人类上手) 混在一起. 人类看不懂 CONTRACT, Agent 不需要 QUICK_START.
- **工作流程散落**: 5 Phase 流程分散在 BOOTSTRAP (启动), AGENTS (执行细节), 各 Phase README (方法论) 三处, 没有独立的流程宪法. 用户每一次打磨迭代(改标题/换配色/加页面)应该走哪条路, 没有速查表.

这次重组不改变任何代码逻辑——只是让框架**自文档化**: 打开根就知道入口在哪, 打开 charter 就知道法则在哪.

## What Changes

```
BEFORE (根 9 个 .md)                    AFTER (根 5 个 .md)
──────────────────────────              ──────────────────────────
PPTMAKER_FRAMEWORK/                     PPTMAKER_FRAMEWORK/
├── README.md                           ├── README.md
├── CLAUDE.md                           ├── CLAUDE.md
├── BOOTSTRAP.md                        ├── BOOTSTRAP.md
├── AGENTS.md                           ├── AGENTS.md
├── AGENT_CONTRACT.md  ──→ charter/     ├── COMMANDS.md        ← 新建
├── QUICK_START.md     ──→ 00_setup/    │
├── GLOSSARY.md        ──→ 00_setup/    ├── charter/           ← 新建目录
├── ANTI_PATTERNS.md   ──→ 00_setup/    │   ├── CONSTITUTION.md ← 新建
├── VERSION_LOG.md     ──→ 00_setup/    │   ├── WORKFLOW.md     ← 新建
└── 00_project_setup/                   │   └── AGENT_CONTRACT  ← 移入
    └── 01-directory-   ──→ 删除        │
        template.md                     ├── 00_project_setup/
                                        │   ├── QUICK_START    ← 移入
                                        │   ├── GLOSSARY       ← 移入
                                        │   ├── ANTI_PATTERNS  ← 移入
                                        │   ├── VERSION_LOG    ← 移入
                                        │   └── ... (其余不变)
                                        └── ...
```

具体变更:
- **新建 `charter/` 宪法目录**: CONSTITUTION.md (结构), WORKFLOW.md (流程), AGENT_CONTRACT.md (行为——从根 `git mv` 移入)
- **新建 `COMMANDS.md`**: 用户自然语言→Agent 行动映射表. 从 `automation/change-classifier.md` 提炼核心逻辑, 但面向人类可读
- **根级瘦身**: 4 个附录文件 (QUICK_START, GLOSSARY, ANTI_PATTERNS, VERSION_LOG) 通过 `git mv` 移入 `00_project_setup/`
- **删除**: `01-directory-template.md` — 内容是 run bundle 目录树的副本, 功能被 CONSTITUTION.md 取代. 删除消除了一个代码树与文档树漂移的风险点
- **内部链接全量更新**: BOOTSTRAP, CLAUDE, README, AGENTS, 00_project_setup/README 中的路径引用更新为新位置

## Capabilities

### New Capabilities

- `framework-charter`: 三层宪法文档体系, 放在 `charter/` 目录中. 结构宪法 (CONSTITUTION.md, 指向 bundle_layout.mjs 为 SSOT) + 流程宪法 (WORKFLOW.md, 5 Phase + Gate + 编辑链) + 行为宪法 (AGENT_CONTRACT.md, 10 条铁律). 同时定义根级文件进入规范——根级仅 5 个 `.md`, 所有附录下放, 今后新增根级文件需在 charter 注册
- `commands-reference`: 根级 `COMMANDS.md`——用户自然语言意图→Agent 行动映射表. 覆盖全量创建、四类编辑链 (A/B/C/Structural)、以及迭代过程中的常见反馈模式

### Modified Capabilities

_无. 纯目录重组和文档新建, 不改变任何 capability 的行为需求._

## Impact

| 影响面 | 说明 |
|--------|------|
| `PPTMAKER_FRAMEWORK/` 根级 | 9 个 .md → 5 个. 4 个移入子目录 |
| `charter/` | 新建目录, 3 个宪法文件 |
| `00_project_setup/` | +4 个文件 (从根移入), -1 个 (删除 01-directory-template) |
| `CLAUE.md` | 入口链更新 |
| `BOOTSTRAP.md` | 文件引用路径更新 |
| `README.md` | 目录树 + 链接更新 |
| `AGENTS.md` | 内部引用更新 |
| `00_project_setup/README.md` | 文件清单更新 |
| `automation/change-classifier.md` | 角色变化: COMMANDS.md 成为人类接口, 此文件退为 Agent 实现细节 |
| repo 根 `AGENTS.md` | 路径引用更新 (如有) |
