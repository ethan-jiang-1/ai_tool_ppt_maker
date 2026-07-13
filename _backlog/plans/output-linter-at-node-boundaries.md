# Plan: Output Linter at Node Boundaries

> 类型: 设计 | 更新: 2026-07-13（调查+PDCA 回路补充）

## 背景 / 现状

### 问题

Agent（主 agent 或 sub-agent）输出 MD、YAML、JSON 文件时，缺乏系统性的输出校验。目前校验分散在多个模块：
- `stage1_build_inputs.mjs` 的 `validateSpecs()` — 只校验 slide specs
- `state.mjs` 的 `validateState()` — 只校验 state schema
- `render_policy.mjs` 的 `parseLeadingFrontmatter()` — 只校验 frontmatter
- `notes_receipt.mjs` — 只校验 notes injection 收据

但缺少一个**通用输出 linter**——能在任意节点边界、对任意 agent 产出的 YAML/JSON/MD 文件做格式级校验，确保产出的文件是合法的、结构完整的。

### 两类场景

| 场景 | 特点 | linter 策略 |
|------|------|------------|
| **主 agent（playbook node 输出）** | 有明确的 `produces` 声明、`exit` 条件；产出物有已知 schema | **严格模式**：进入 node exit condition catalog，不可跳过 |
| **Sub-agent（ad-hoc 产出）** | 没有 node 定义、产出物格式不固定、可能半结构化 | **宽容模式**：主 agent 在接收 sub-agent 结果后主动调 `lintFile()`；格式问题报 warning，只有不可解析才 hard-fail |

### 框架内产出 YAML/JSON 的 MD 文件全景（2026-07-13 调查）

框架目录共 **94 个 .md 文件**。真正产出 pipeline 可消费的结构化数据（YAML/JSON）的只有 **~14 个**，其余都是纯文档或仅含 frontmatter 路由元数据。

#### 🔴 第一类：YAML 代码块直接被 pipeline 消费（9 playbook + 5 deck 模板）

这些文件的 ` ```yaml ` fence 被 `md_controller_reader.mjs` 解析来驱动工作流执行：

| 文件 | YAML 块数 | 用途 |
|------|----------|------|
| `playbook/create-deck.md` | 11 | 完整 deck 创建管线 node 序列 |
| `playbook/migrate-import.md` | 6 | 迁移/导入工作流 |
| `playbook/quick-preview.md` | 3 | 快速预览 |
| `playbook/edit-notes.md` | 2 | 编辑 speaker notes |
| `playbook/edit-text.md` | 2 | 编辑文字 |
| `playbook/edit-visual.md` | 4 | 编辑视觉 |
| `playbook/restructure-slides.md` | 3 | 重组 slides |
| `playbook/iterate-style.md` | 4 | 迭代风格 |
| `playbook/probe-image-channels.md` | 4 | 探测图片渠道 |
| `workflow/02-content/presets/deck-type-templates/*.md` | 4 个 | Deck metadata YAML（pitch-deck/keynote/report/training） |
| `workflow/02-content/example-deck-brief-mini.md` | 1 | Deck brief metadata 示例 |

**共约 44 个 YAML node 定义 + 5 个 deck metadata 块。这些是 linter 的主要目标。**

#### 🟡 第二类：YAML/JSON fence 作为 Schema 规范文档

这些文件里的 YAML/JSON 代码块是**规范文档**，描述各阶段输出格式，不直接被解析执行：

| 文件 | 包含的 schema |
|------|-------------|
| `charter/NODE-SPEC.md` | node 声明规范 + `state.yaml` 结构定义 |
| `workflow/04-production/01-stage-1-*.md` | `slide_plan.json` + `_prompts.json` 输出结构 |
| `workflow/04-production/02-stage-2-*.md` | `.image-task.json` trace schema |
| `workflow/04-production/03-stage-3-*.md` | `header_lock_qa.json` schema |

#### 🟢 第三类：仅 YAML Frontmatter（框架路由元数据）

几乎所有 MD 文件都有 `---` 包裹的 YAML frontmatter（`title`, `stage`, `position`, `type` 等），是 agent 路由系统的元数据，**不算** pipeline 结构化输出。例外：`template-slide-specifications.md` 的 frontmatter 中 `render:` 字段被 Stage 1 消费。

#### ⚪ 第四类：散文中引用 JSON 文件名（纯文档）

约 15 个文件在散文中提到 pipeline 产出的 JSON 文件名（如 `slide_plan.json`、`notes_injection.json`），但不含任何 YAML/JSON 代码块。

> **启示**：lint 策略应该聚焦第一类文件（约 14 个），它们是唯一「MD → 结构化数据」的边界。第二类文件是 schema 来源，可作为 lint rule 的参考规范。第三、四类文件不需要 lint。

### 现有基础设施（可直接复用）

- `yaml` npm 包 v2.9.0 — 已在 `state.mjs`（`parseDocument`/`stringify`）、`md_controller_reader.mjs`（`parse`）、`render_policy.mjs`（`parseDocument`）中使用
- `JSON.parse` — Node 原生
- Node exit condition catalog（`NODE-SPEC.md`）— 已有 9 个 deterministic conditions，可直接加新 condition
- `cli_error.mjs` — CLI 失败 JSON envelope 契约，linter CLI 可复用
- `state.mjs` 的 `checkEntry`/`checkExit` 框架 — 可直接挂新 condition

---

## 决策 / 方案

### 1. 新建 `scripts/lib/lint_output.mjs` — 通用输出 linter 库

核心 API：

```javascript
// 自动检测文件类型，选对应 validator
lintFile(filePath, opts?): LintResult

// 按类型显式调用
lintYaml(content, filePath?, opts?): LintResult
lintJson(content, filePath?, opts?): LintResult
lintMarkdown(content, filePath?, opts?): LintResult

// 批量：校验一个 node 的 produces 列表
lintNodeProduces(deckDir, nodeId, playbookDir): LintResult[]

// LintResult 形状
{ ok: boolean, errors: LintIssue[], warnings: LintIssue[] }
// LintIssue = { rule: string, line?: number, col?: number, message: string }
```

#### 各 validator 校验内容

**`lintYaml`**:
- 语法：`yaml.parse()` 或 `parseDocument()`（tolerant 模式用 `strict: false`）
- 可选 schema check：传 `{ schema: { requiredKeys?, knownKeys? } }` → 检查顶层 key 是否齐全、有无未知 key

**`lintJson`**:
- 语法：`JSON.parse()`
- 可选 schema check：同上（requiredKeys / knownKeys）

**`lintMarkdown`**:
- Frontmatter：如果文件以 `---` 开头，校验 frontmatter 内 YAML 是否可解析
- 可选 section check：传 `{ requiredSections: ["## Slide", "## Block"] }` → 检查 section heading 是否存在

**`lintSlideSpecs`**（专用）:
- 直接复用 `stage1_build_inputs.mjs` 的 `validateSpecs()` 逻辑，但不耦合管线参数
- 检查：占位符残留、缺 IMAGE PROMPT、缺 TITLE、重复 ID

**`lintSlidePlan`**（专用）:
- 检查 JSON 有顶层 `slides` 数组，每个 entry 有 `id` 字段

**`lintNotesReceipt`**（专用）:
- 直接 delegate 给 `notes_receipt.mjs` 的 `validateNotesReceipt()`

#### 文件类型自动检测

按扩展名 + 路径规则：

| 匹配规则 | validator | 默认模式 |
|---------|-----------|---------|
| `*.yaml`, `*.yml` | `lintYaml` | tolerant |
| `*.json` | `lintJson` | strict |
| `*.md` | `lintMarkdown` | tolerant |
| `slide-specifications.md` | `lintSlideSpecs` | strict |
| `_state/state.yaml` | `lintYaml` + state schema | strict |
| `project-metadata.yaml` | `lintYaml` + metadata schema | tolerant |

### 2. 新 condition: `outputs_linted`

加入 `DETERMINISTIC_CONDITIONS`（`md_controller_reader.mjs`），实现放在 `state.mjs` 的 `CONDITIONS`：

```javascript
outputs_linted: (_state, ctx) => {
  const results = lintNodeProduces(ctx.deckDir, ctx.nodeId, ctx.playbookDir);
  // 返回结构化结果，不只是 boolean——agent 需要读报告来修文件
  const allOk = results.every(r => r.ok);
  return {
    pass: allOk,
    summary: allOk ? "all outputs valid" : `${results.filter(r => !r.ok).length} file(s) need fix`,
    files: results,  // [{ file, ok, errors: [...], warnings: [...] }]
  };
}
```

**行为**：读取 node 的 `produces` 列表 → 按文件路径规则匹配 lint → 全部 `ok === true` 才算 `pass: true`。失败时 `files` 数组携带每个文件的错误详情，agent 据此修复。

**使用方式**：在 node 声明中，如果该 node 有 `produces` 且需要 lint gate，在 `exit` 加 `outputs_linted`：

```yaml
exit:
  - slide_specs_exists
  - outputs_linted
  - evidence:l1-l2-l4-complete
```

**注意**：`outputs_linted` 是纯检测 gate——它只报告 pass/fail，**不执行修复**。修复和重试由 agent 按 §7 的 PDCA 回路执行。condition 本身的角色是「把关」：node 不通过这个 gate 就不能标记 complete。

### 3. CLI 表面：`ppt_flow.mjs lint`

```bash
# 校验某个文件
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs lint --file deck_xxx/3_versions/v1/slide-specifications.md

# 校验某个 node 的所有 produces
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs lint --run-dir deck_xxx/3_versions/v1 --node wave0

# 校验 state 文件
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs lint --state deck_xxx

# tolerant 模式（warnings 不置 ok=false）
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs lint --file ... --tolerant

# JSON 输出模式（给 MD Controller 用）
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs lint --file ... --json
```

失败时走现有 CLI error envelope 契约。

### 4. Sub-agent 产出策略

Sub-agent（AI agent 被主 agent spawn 出来执行特定任务）没有 playbook node 约束。策略分两层：

**Layer 1 — 主 agent 主动校验**（推荐）:
```
主 agent spawn sub-agent →
  sub-agent 写文件、返回 →
  主 agent 调 ppt_flow lint --file <产出路径> →
    通过 → 继续
    不通过 → 看 error/warning 决定：minor 自修 → 重写文件 → 再 lint；major → 报告用户
```

**Layer 2 — 文件 watch/hook（未来可选，本期不做）**:
如果未来 sub-agent 数量多/频繁，可以在 `writeState` 或文件写入时挂 hook 自动 lint。本期 YAGNI。

**便捷函数 `validateSubAgentOutput(runDir, producedFiles, opts?)`**（在 `lint_output.mjs` 导出）:
```javascript
// 主 agent 在 sub-agent 返回后直接调用：
import { validateSubAgentOutput } from "./lib/lint_output.mjs";
const result = validateSubAgentOutput(runDir, [
  "slide-specifications.md",
  "_generated/slide_plan.json",
]);
// → { ok, summary: "2/2 passed", details: [...] }
```

**对主 agent 的指引**（写入 COMMANDS.md）：
> Sub-agent 返回后，对所有产出文件跑一遍 `ppt_flow lint --file <path> --tolerant`。YAML 不可解析 / JSON 不可解析 / MD frontmatter 不闭合 → 是 hard error，需要 sub-agent 重写。缺 section / placeholder 残留 → 是 warning，你自己修或让 sub-agent 修。

### 5. 与现有 node `produces` 字段的关系

当前的 `produces` 字段是文档性的（列表如 `[slide-specifications, run-bundle]`），没有路径映射。需要两步增强：

**Step A** — 在 `lint_output.mjs` 中建 `produces → file path` 映射表：

```javascript
const PRODUCES_PATH_MAP = {
  "run-bundle": (deckDir) => deckDir,
  "deck-guide": (deckDir) => join(deckDir, "deck-guide.md"),
  "slide-specifications": (runDir) => join(runDir, "slide-specifications.md"),
  "slide-plan": (runDir) => join(runDir, "_generated", "slide_plan.json"),
  "slide-prompts": (runDir) => join(runDir, "_generated", "page_prompts", "_prompts.json"),
  "core-metaphor": (deckDir) => join(deckDir, "2_backbone", "core-metaphor.md"),
  "core-formula": (deckDir) => join(deckDir, "2_backbone", "core-formula.md"),
  "visual-system": (deckDir) => join(deckDir, "2_backbone", "visual-style"),
  "style-master": (deckDir) => join(deckDir, "2_backbone", "visual-style", "style_master.jpg"),
  "confirmed-intake": null,  // 纯 evidence，无文件产出
  "pptx": (runDir) => join(runDir, "_generated", "ppt"),
  // ...
};
```

**Step B** — `lintNodeProduces()` 用此映射找到实际文件路径 → 按扩展名选 validator → 运行。

不需要改 playbook 文件本身；`produces` 字段保持抽象 ID 不变。

### 6. Tolerant vs Strict 行为差异

| | strict | tolerant |
|---|---|---|
| YAML 语法错误 | `{ok: false}` + error | `{ok: false}` + error（不可恢复） |
| YAML 缺 key | `{ok: false}` + error | `{ok: true}` + warning |
| YAML 未知 key | `{ok: false}` + error | `{ok: true}` + warning |
| JSON 语法错误 | `{ok: false}` + error | `{ok: false}` + error（不可恢复） |
| JSON 缺 key | `{ok: false}` + error | `{ok: true}` + warning |
| MD frontmatter 不闭合 | `{ok: false}` + error | `{ok: false}` + error |
| MD 缺 required section | `{ok: false}` + error | `{ok: true}` + warning |

核心理念：**语法级错误（不可解析）无论什么模式都 hard-fail；schema 级偏差在 tolerant 模式下降级为 warning。**

### 7. 局部 PDCA 回路：产出即检测、失败即重试、超限即上报

当前框架中，agent 产出 MD/YAML/JSON 后到发现问题的周期太长——往往要等到下游 stage（甚至最终 PPTX 构建）才暴露格式错误。本 plan 的核心价值是**把检测点前置到产出边界**，形成一个有上限的自动修复回路。

#### 回路定义

```
┌──────────────────────────────────────────────────────────────┐
│          局部 PDCA 回路（max 3 轮，默认值可配）                 │
│                                                              │
│  round = 0                                                   │
│       ↓                                                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Plan ──→ agent 产出文件（MD/YAML/JSON）              │   │
│  │   ↑                                           ↓      │   │
│  │   │                                    Do ──→ 跑 lint_output         │
│  │   │                                           ↓      │   │
│  │   │                                    Check ──→ pass?                │
│  │   │                                     │          │    │   │
│  │   │                                   yes         no    │   │
│  │   │                                     │          │    │   │
│  │   Act ──← agent 读 report 修文件       │     round++     │   │
│  │              · 语法错 → 重写            │     round < 3?  │   │
│  │              · schema 偏差 → 补字段     │     │     │    │   │
│  │              · 缺 section → 补内容      │    yes   no     │   │
│  │                                         │     │     │    │   │
│  │                                         │     └──→ 回路继续  │   │
│  └─────────────────────────────────────────│────────────────┘   │
│                                            ↓                    │
│                          ┌─────────────────┴──────────────┐    │
│                          │  pass（round 0）                 │    │
│                          │  或 pass（round 1-2, 自愈成功）   │    │
│                          │  或 pass（round 3, 最后一次成功） │    │
│                          │  → node complete ✓              │    │
│                          └────────────────────────────────┘    │
│                                                                │
│                          ┌─────────────────────────────────┐   │
│                          │  round ≥ 3 且仍 fail             │   │
│                          │  → 停止循环，上报用户             │   │
│                          │  → node 不 complete，agent 接管   │   │
│                          └─────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

#### 伪代码

```javascript
async function pdcaLintLoop(runDir, nodeId, playbookDir, maxRetries = 3) {
  for (let round = 0; round < maxRetries; round++) {
    const result = lintNodeProduces(runDir, nodeId, playbookDir);
    if (result.every(r => r.ok)) {
      return { pass: true, rounds: round + 1, report: result };
    }
    if (round < maxRetries - 1) {
      // 还有重试配额 → 把 report 交给 agent，让 agent 修文件
      yield { phase: "fix", round, report: result };
    }
  }
  // 耗尽重试 → hard stop
  const finalResult = lintNodeProduces(runDir, nodeId, playbookDir);
  return { pass: false, rounds: maxRetries, report: finalResult };
}
```

#### Agent 侧执行流程

agent 在 node 产出文件后按以下 SOP 执行：

```
1. 确认产出文件已写入（node produces 列表全部就位）
2. 跑 lint_output（通过 exit condition 或 CLI）
3. 读结果:
   · pass → 退出循环，node complete → 进入下一 node
   · fail + 还有重试配额 → 读 errors/warnings → 修对应文件 → goto 2
   · fail + 配额耗尽 → 停止，报告用户:
     "Node <nodeId> outputs_linted 在 {maxRetries} 轮重试后仍未通过。
      未通过文件: <list>。请人工检查。"
4. agent 不得跳过 lint gate 直接标记 node complete
```

#### 设计决策

| 决策 | 理由 |
|------|------|
| **默认 max 3 轮** | 第 1 轮是初始产出，第 2-3 轮是修复。3 轮够覆盖大多数格式修正场景（拼写、缩进、缺字段）；超过 3 轮说明问题不是格式级的，需要人工判断 |
| **linter 只报不修** | agent 掌握上下文（哪个 slide 缺标题、哪个 block 缺 prompt），比自动脚本修得准 |
| **超过上限 = hard stop** | 不静默兜底——把问题原样暴露给用户，附完整 lint report |
| **回路在 node exit 关门** | `outputs_linted` gate 不通过 → node 不 complete → agent 无法进入下一 node。这就是 PDCA 的「关门」机制 |
| **首轮通过 = 0 额外开销** | 大多数情况下产出本来就合法，lint 一次 pass，不触发循环 |
| **sub-agent 同样适用** | 主 agent spawn sub-agent → sub-agent 返回 → 主 agent 对产出文件跑 lint → fail → sub-agent 修 → 再 lint。sub-agent 内部形成同样的 PDCA |

#### 覆盖范围

第一类文件的所有 YAML/JSON 产出都在 lint 范围内：
- **9 个 playbook 文件** → 每个 YAML node 定义的必需字段（`node`, `lifecycle_phase`, `method_module`, `requires`, `entry`, `exit`, `produces`）
- **5 个 deck 模板** → YAML metadata block 的必需字段
- **pipeline 产出的 JSON 文件** → `slide_plan.json`, `_prompts.json`, `header_lock_qa.json` 等

> **为什么叫"局部"PDCA**：这不是整个 deck creation 的大 PDCA（那个跨度太大），而是在单个 node 边界上的微循环——agent 写文件 → lint 报错 → agent 立刻修 → lint 通过 → node complete。最长 3 轮、秒级周期。过了 3 轮还不行 → 问题升级，交给用户。

---

## 风险 / 取舍

1. **[风险] `outputs_linted` 依赖 `produces → path` 映射不准** → 缓解：映射表集中在一处、有单元测试覆盖；未知 produces ID 返回 warning 而非 error
2. **[风险] Sub-agent 产出物格式不可预知 → lint 无法全覆盖** → 缓解：tolerant 模式下至少做语法校验（YAML parse / JSON parse / frontmatter parse），这是最小安全网
3. **[取舍] 不在 node declaration 层改 schema**（不把文件路径写进 playbook YAML）→ 保持 playbook 简洁；路径映射是 lint 模块内部实现细节
4. **[取舍] 不自动修复格式问题（本期）** → linter 只检查不修复；自动修复（如 YAML 缩进修复、占位符回填）留给后续迭代

---

## 落地关联

### 实现步骤

1. **创建 `scripts/lib/lint_output.mjs`**
   - 实现 `lintYaml`, `lintJson`, `lintMarkdown`, `lintSlideSpecs`
   - 实现 `lintFile`（自动检测类型）
   - 实现 `lintNodeProduces`（produces → path 映射 + 批量 lint）
   - 实现 `pdcaLintLoop`（async generator：lint → 交给 agent 修 → 再 lint，max 3 轮）
   - 实现 `PRODUCES_PATH_MAP`

2. **注册新 condition `outputs_linted`**
   - 在 `md_controller_reader.mjs` 的 `DETERMINISTIC_CONDITIONS` 加 `"outputs_linted"`
   - 在 `state.mjs` 的 `CONDITIONS` 加实现（调用 `lintNodeProduces`）

3. **加 CLI 命令 `ppt_flow lint`**
   - 在 `ppt_flow.mjs` 加 `lint` 子命令
   - 支持 `--file`, `--run-dir` + `--node`, `--state`, `--tolerant`, `--json`

4. **更新 playbook node exit conditions**
   - 在 `create-deck.md` 各 node（`seed-topics`, `wave0`, `wave1`, `wave2`, `final` 等）的 `exit` 加 `outputs_linted`
   - 保持向后兼容：现有 exit conditions 不变，新 condition 只做加法

5. **更新文档**
   - `NODE-SPEC.md`: 在 condition catalog 加 `outputs_linted`
   - `AGENTS.md` 或 `COMMANDS.md`: 加 sub-agent 产出 lint 指引
   - `charter/AGENT_CONTRACT.md` §7: 在「坏 state / 坏压模」段落引用 lint 命令

6. **测试**
   - 单元测试：各 validator 对合法/非法输入的输出
   - 集成测试：`ppt_flow lint` CLI 命令端到端
   - 回归：现有 `npm test` 全部通过

### 涉及文件

| 操作 | 文件 |
|------|------|
| **新建** | `PPTMAKER_FRAMEWORK/scripts/lib/lint_output.mjs` |
| **修改** | `PPTMAKER_FRAMEWORK/scripts/lib/md_controller_reader.mjs`（加 condition） |
| **修改** | `PPTMAKER_FRAMEWORK/scripts/lib/state.mjs`（加 CONDITION 实现） |
| **修改** | `PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs`（加 lint 命令） |
| **修改** | `PPTMAKER_FRAMEWORK/playbook/create-deck.md`（node exit 加 `outputs_linted`） |
| **修改** | `PPTMAKER_FRAMEWORK/charter/NODE-SPEC.md`（condition catalog） |
| **修改** | `PPTMAKER_FRAMEWORK/COMMANDS.md`（加 lint 命令文档 + sub-agent 指引） |
| **新建** | `PPTMAKER_FRAMEWORK/tests/lint_output.test.mjs`（单元测试） |

### 后续 OpenSpec change

本 plan 结论落地为 `openspec/changes/add-output-linter/`，走标准 proposal → implement → archive 流程。

---

## 验证方式

1. **单元测试**: `npm test` — 新测试套件 `lint_output.test.mjs` 覆盖所有 validator
2. **CLI 冒烟**: `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs lint --file <合法文件> --json` → `ok: true`；`--file <故意写坏的 YAML>` → `ok: false`
3. **Node exit 集成**: 用 `checkExit` 对加了 `outputs_linted` 的 node 验证 → produces 文件不合法时 `pass: false`
4. **回归**: 现有 16 个 openspec spec 全 passing + `npm test` 全绿
