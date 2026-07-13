# Plan: Output Linter at Node Boundaries

> 类型：设计边界 | 更新：2026-07-14

## 一句话

**Agent 手写结构化内容，JS 做确定性检查；有错由 Agent 根据报告修复，检查通过后 node 才能退出。**

这就是全部目标。不要把它扩展成通用 linter、自动修复系统或新的工作流平台。

## DO——只做这些

1. **只检查 Agent 手写的结构化内容**
   - Markdown 中的 YAML frontmatter
   - `slide-specifications.md` 中的 slide specs 字段
   - Markdown 只是容器，不检查普通散文和排版

2. **JS 只负责确定性检测**
   - 返回 `{ ok, errors, warnings }`
   - 报清楚哪个文件、哪里、什么规则没有通过

3. **Agent 负责修复**
   - Agent 读取错误报告
   - Agent 根据内容语义修正 YAML、缺失字段或 placeholder
   - 修完后重新检查

4. **node 退出前复验**
   - `outputs_linted` 是 `checkExit` 的 boolean gate
   - 全部检查通过才允许退出 node
   - 详细问题放在 lint 报告里，不塞进 condition 返回值

5. **只区分两个 slide-spec 阶段**
   - `wave0`：允许 L3 placeholder，记 warning，不阻塞
   - `wave1`：不允许残留 placeholder，记 error，阻塞退出
   - YAML 语法错误在任何阶段都是 error

6. **只接到确实有上述 Agent 手写内容的 node**
   - `instantiation`
   - `seed-topics`
   - `wave0`
   - `wave1`

## DON'T——实现时不要这样做

1. **不要让 JS 自动修文件**
   - JS 不知道正确内容应该是什么
   - 不补字段、不改缩进、不替换 placeholder

2. **不要在 JS 里实现修复循环**
   - 不写 `for`、`while`、async generator 或重试器
   - “检查、修复、再检查”是 Agent 行为，不是 JS 控制流

3. **不要 lint Markdown 样式**
   - 不检查标题层级、空行、列表缩进、措辞和散文结构

4. **不要做通用 linter 平台**
   - 不设计任意文件类型的自动发现
   - 不为了未来可能性增加 schema registry、插件机制或扩展层
   - 不把局部规则抽象成全仓库输出治理系统

5. **不要另造一套 slide-spec 校验规则**
   - 应与现有 Stage 1 实际消费的字段规则保持一致
   - parser、现有 validator 和 node boundary 不能各有一套定义

6. **不要把 warning 当 error**
   - 特别是 `wave0` 合法存在的 L3 placeholder

## 根本不做——不属于这个需求

以下对象不需要纳入，也不要为它们预留设计：

- `_generated/` 下的 JSON、图片和 PPTX
- `_state/state.yaml`
- playbook 中的 YAML node 声明
- deck template 和其他框架 Markdown 资产
- pure evidence produces 或任何没有文件的 produces
- 任意 JSON/YAML/Markdown 文件的通用 `lintFile`
- sub-agent 任意产出的统一验收机制
- produces ID 到全仓库文件路径的通用路由系统
- strict/tolerant 通用模式体系
- 自动修复、自动重试、三轮 PDCA、失败升级流程
- 为此单独扩张 CLI surface、命令体系或协议

这些都不是“以后顺便做”的候选项，而是**当前问题明确不做的事情**。若将来出现独立需求，必须重新提出并证明必要性，不能从本计划顺势扩张。

## 完成标准

只看三个结果：

1. Agent 写坏 YAML frontmatter 时，JS 能准确报告并阻止对应 node 退出。
2. `wave0` 的 L3 placeholder 只产生 warning；同一 placeholder 到 `wave1` 产生 error 并阻止退出。
3. Agent 修正内容后重新检查通过，node 可以正常退出。

除此之外，没有本计划需要交付的东西。
