## Context

PPTMAKER_FRAMEWORK 根级 9 个 .md + 8 个子目录, 打开后信息密度过高. 两次深度探索确认:

- `bundle_layout.mjs` 已是公认的 SSOT——它导出所有路径常量, `renderTree()` 生成权威树, `selfCheck()` 检测内部漂移. 但人眼扫过去看不到.
- 36 个文件引用了 run bundle 结构——6 个含树图, 7 个脚本 import, 23 个散文引用. 所有副本一致 (目前), 但缺乏一处权威声明.
- 根级 9 个文件可以按"受众"清晰分为三组: 入口链 (5 个, 人和 Agent 都用), Agent 契约 (1 个, 人类不会看), 人类附录 (3 个, Agent 不需要).

## Goals / Non-Goals

**Goals:**
- 根级 .md 从 9 减到 5
- 创建 `charter/` 宪法目录, 集中结构/流程/行为三层法则
- 创建 `COMMANDS.md` 作为用户命令速查, 从 `automation/change-classifier.md` 提炼
- 附录文件下放到 `00_project_setup/`
- 删除 `01-directory-template.md`, 内容合并进 CONSTITUTION.md
- 所有内部链接更新, 零失效率
- `bundle_layout.mjs` 注释清理 (去掉 `.py` 残留)

**Non-Goals:**
- 不改变任何脚本逻辑或 capability 行为
- 不改变 run bundle 目录结构
- 不新增或删除 npm 依赖
- 不修改 `openspec/config.yaml` 的 capability 注册表
- 不重写任何方法论内容 (Phase 文档内容不变)

## Decisions

### 1. 根级文件: 谁留下, 谁离开

决策原则: **根级只放入口文件——读者打开目录后第一眼就该知道"从哪开始"**.

| 文件 | 决策 | 理由 |
|------|------|------|
| `README.md` | 保留 | 人类总览, 无替代位置 |
| `CLAUDE.md` | 保留 | Claude Code 约定, 必须在根 |
| `BOOTSTRAP.md` | 保留 | 人/Agent 共同入口. CLAUDE → BOOTSTRAP 是第一跳 |
| `AGENTS.md` | 保留 | Agent 操作手册. 在根 Agent 才能直接读到. 人类不需要看 |
| `AGENT_CONTRACT.md` | → `charter/` | Agent 铁律. 流程序列: BOOTSTRAP → CONTRACT → AGENTS. 放在 charter 里和结构宪法、流程宪法并列, 形成完整"法则三层" |
| `QUICK_START.md` | → `00_project_setup/` | 纯人类文档. 和 zero-to-ready, env-setup 放在一起更合理 |
| `GLOSSARY.md` | → `00_project_setup/` | 术语附录. 人类查阅 |
| `ANTI_PATTERNS.md` | → `00_project_setup/` | 常见错误附录. 两者都可能查阅 |
| `VERSION_LOG.md` | → `00_project_setup/` | 元信息, 不是入口 |
| `COMMANDS.md` | **新建** | 命令速查. 人类想知道"我怎么说, Agent 就会怎么做". 在根方便快速查阅 |

**为什么 AGENTS.md 留根而 AGENT_CONTRACT.md 移入 charter**: AGENTS 是 Agent 进来后**直接翻的操作手册**, 在根是便利. CONTRACT 是**法则**, 和 CONSTITUTION、WORKFLOW 并列放在 charter 形成完整宪法体系. 对 Agent 来说, 从 BOOTSTRAP 跳转到 `charter/AGENT_CONTRACT.md` 只多一层路径, 影响可忽略.

### 2. charter/ 宪法三层: 结构 → 流程 → 行为

三个文件覆盖 Agent 需要知道的三个维度:

```
charter/
├── CONSTITUTION.md       ← STRUCTURE: run bundle 长什么样
├── WORKFLOW.md           ← PROCESS: 工作怎么走
└── AGENT_CONTRACT.md     ← RULES: 什么能做/不能做
```

这三个文件**不重复**现有文档的内容——它们是"指针+摘要", 指向详细方法论.

**CONSTITUTION.md 详细大纲**:

```markdown
# 宪法: Run Bundle 目录结构

> 唯一权威源: bundle_layout.mjs
> 运行 `node bundle_layout.mjs` 看权威树

## 权威树 (快照)
[完整的 run bundle 树, 标注三层梯度]

## 三层梯度
| 层 | 目录 | 性质 | 版本? |
| 上游 | 1_upstream_raw_material/ | 原始素材, 全版本共享 | 否 |
| 中游 | 2_backbone/ | 隐喻/公式/视觉主干 | 否 |
| 下游 | 3_versions/v{n}/ | 版本增量 | 是 |

## 覆盖规则
版本 overrides/<relpath> 存在 → 用覆盖版; 不存在 → 回退 backbone

## 初始化
node bundle_layout.mjs --init deck_<name> [--deck-type X] [--style Y]

## 校验
node bundle_layout.mjs --check deck_<name>/3_versions/v1
node bundle_layout.mjs --self-check
```

**WORKFLOW.md 详细大纲**:

```markdown
# 流程宪法: Agent 工作流程

## 5 Phase 总览
| Phase | 做什么 | Gate | Agent 角色 |
|-------|--------|------|-----------|
| 00 项目初始化 | 环境检查, 创建 run bundle | 结构合规 | 执行者 |
| 01 视觉风格 | medium→preset→style_master | 95%+ 锁定 | 建议者 |
| 02 内容设计 | 隐喻→公式→Block Map→slide specs | 内容确认 | 创作者 |
| 03 图像提示词 | 能力层 (教怎么写 prompt) | — | 学习者 |
| 04 生产管线 | 5 Stage, markdown→PPTX | 每 Stage 一个 gate | 执行者 |
| 05 迭代引擎 | 分类变更→最小重跑→记录 | — | 判断者 |

## 编辑链 (变更分类)
[Chain A/B/C/Structural 表格]

## Gate 机制
每个 Phase 结束必须过人审. project-metadata.yaml 记录 gate 状态.

## Agent 入口序列
CLAUDE.md → BOOTSTRAP.md → AGENT_CONTRACT.md → 按 Phase 读 AGENTS.md
```

### 3. COMMANDS.md 设计

从 `automation/change-classifier.md` 提炼, 但面向人类:

```markdown
# 命令速查

## 全量创建
"帮我做一个PPT" → BOOTSTRAP 三步启动 → Phase 0→1→2→3

## 迭代打磨
| 你说 | Agent 判断 | 执行 | 耗时 |
|------|-----------|------|------|
| "第5页标题不够有力" | Chain A, 单页 | Stage 1,3,4,5 --only 5 | ~5 min |
| "换个配色试试" | Chain B, pilot | 3页 --force-images 1k | ~15 min |
| "加一页案例在最后" | Structural | --new-version | ~5 min + 按页 |
| "备注改一下" | Chain C | Stage 5 | ~30 sec |
| "所有页面的颜色都换" | Chain B, full | --force-images 2k | ~N×5 min |
| "这段论证逻辑有问题" | Content change | 回 Phase 2 改 backbone | ~10 min + 重跑 |

## Agent 怎么判断
1. 改了什么? (title/visual/notes/structure)
2. 影响多少页? (1页/几页/全部)
3. 要 pilot 吗? (颜色变更→先试3页)
```

`automation/change-classifier.md` 的角色退为 Agent 实现细节——COMMANDS.md 是人类接口. 两者的关系: COMMANDS 是"用户看到的菜单", change-classifier 是"后厨的食谱". 菜单简洁易扫, 食谱有完整决策树.

### 4. 文件移动与历史保留

全部用 `git mv` (不是 `mv` + `git add`), 保留文件历史:

```bash
# 移入 charter/
git mv PPTMAKER_FRAMEWORK/AGENT_CONTRACT.md PPTMAKER_FRAMEWORK/charter/AGENT_CONTRACT.md

# 移入 00_project_setup/
git mv PPTMAKER_FRAMEWORK/QUICK_START.md PPTMAKER_FRAMEWORK/00_project_setup/QUICK_START.md
git mv PPTMAKER_FRAMEWORK/GLOSSARY.md PPTMAKER_FRAMEWORK/00_project_setup/GLOSSARY.md
git mv PPTMAKER_FRAMEWORK/ANTI_PATTERNS.md PPTMAKER_FRAMEWORK/00_project_setup/ANTI_PATTERNS.md
git mv PPTMAKER_FRAMEWORK/VERSION_LOG.md PPTMAKER_FRAMEWORK/00_project_setup/VERSION_LOG.md

# 删除
git rm PPTMAKER_FRAMEWORK/00_project_setup/01-directory-template.md
```

### 5. 链接更新策略

分三批:

**第一批: 关键入口链** (手动精确替换):
- `CLAUDE.md`: `AGENT_CONTRACT.md` → `charter/AGENT_CONTRACT.md`
- `BOOTSTRAP.md`: 同上 + GLOSSARY/ANTI_PATTERNS/QUICK_START 路径更新
- `AGENTS.md`: QUICK_START + AGENT_CONTRACT 引用更新
- `README.md`: 目录树 + 所有链接

**第二批: 全量扫描** (sed 批量):
```bash
# 搜索所有引用旧路径的地方
grep -rn "AGENT_CONTRACT\|QUICK_START\|GLOSSARY\|ANTI_PATTERNS\|VERSION_LOG\|01-directory-template" PPTMAKER_FRAMEWORK/ --include="*.md"
# 逐个替换
```

**第三批: repo 根文件**:
- repo 根 `AGENTS.md` 如有引用, 同步更新

**验证**: 最终 `grep -r` 必须零残留 (charter/ 和 00_project_setup/ 内部的自我引用除外).

### 6. `00_project_setup/README.md` 更新

该 README 原来列的文件清单需要更新——4 个新移入的文件要加上, 删除的要移除.

## Risks / Trade-offs

**[R] 链接失效** — 最多 36 个文件引用了被移动文件
→ 三批链接更新覆盖全量. 验证命令零残留

**[R] CLAUDE.md 必须在根** — Claude Code 约定, 移入子目录会失效
→ 保留在根, 不移

**[R] charter/ 概念引入可能让新人困惑** — "charter" 不是通用项目目录名
→ 每个 charter 文件顶部有清晰的单行说明角色. README 中解释 charter/ 的用途

**[R] 01-directory-template.md 删除后有人引用它**
→ 删除前 grep 确认所有引用已更新为 CONSTITUTION.md
