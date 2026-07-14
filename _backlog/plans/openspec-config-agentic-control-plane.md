# Plan: 重整 OpenSpec `config.yaml` 为 Agentic Framework 开发控制面

> 类型: 设计 / 分析 | 更新: 2026-07-14

## 0. 结论摘要

本计划要解决的不是“把 YAML 写得更漂亮”，而是让
`openspec/config.yaml` 真正承担这个仓库的 **OpenSpec 项目级控制面**：每次
proposal → specs → design → tasks → apply → archive 循环，都能稳定提醒开发
Agent 保持本项目的核心架构，不把它逐步改造成普通 Node CLI、代码内状态机或传统
PPT 生成脚本集合。

目标定位：

> `config.yaml` 首先教 Agent 如何维护一个 Markdown-first、Agent-owned、
> JS-assisted 的 Agentic workflow；其次才描述具体 PPT 管线能力。

本计划只分析和设计整理方案。真正修改 `openspec/config.yaml`、main specs、测试和
相关 Charter 镜像时，必须另起 OpenSpec change。

---

## 1. 背景 / 触发

这个项目有三个容易被普通软件工程惯性冲淡的特点：

1. **MD Controller 是主控制面。** Agent 读取 charter、workflow、playbook，理解
   用户意图、做创意判断、选择路径、组织步骤，并在 Gate 处与人类交互。
2. **JS 是精准但被动的能力面。** JS/CLI 负责解析、校验、自愈、状态持久化、证据、
   产物转换与结构化诊断；不得拥有第二套 playbook、隐藏工作流或创意决策。
3. **Run bundle 是框架生产后的对象。** `deck_*` 是 `ppt_flow init` 创建并持续演化的
   PPT 项目实例，不是 framework source；`dpt_*` 是输入研究材料，也不是 framework
   source。

OpenSpec 是 framework repository maintenance 的主开发循环：

```text
需求 / bug / 架构想法
        ↓
OpenSpec proposal
        ↓
delta specs + design + tasks
        ↓
apply（修改 framework / specs / tests）
        ↓
验证与 archive
        ↓
main specs 同步 + 版本判断
```

因此，`openspec/config.yaml` 不是普通背景说明，而是所有 OpenSpec artifact instruction
都会收到的项目级约束。若这里对项目本质表达得不精确，偏差会反复进入每个 change。

---

## 2. 已确认的现状

### 2.1 OpenSpec 与项目健康状态

- 当前 schema：`spec-driven`。
- schema 的合法 artifact ID 只有：`proposal`、`specs`、`design`、`tasks`。
- 当前 main specs：20 个，`openspec validate --specs --strict` 全部通过。
- 当前 MD Controller：9 个 ordered controller + 1 个 shared node，共 40 个全局唯一
  node，reader validation 通过。
- 当前 `config.yaml` 的 `context` 约 7.7 KB，低于 OpenSpec 50 KB 上限。

### 2.2 当前配置已经做对的部分

- 写明 Node.js ESM 是唯一生产运行时。
- 写明禁止 Python、shell pipeline、外部 agent skill 作为 Stage 生产依赖。
- 记录了 run bundle 的 upstream/backbone/version 三层梯度。
- 记录了 source 与 `_generated/` 派生物边界。
- 提到了 Agent 是 orchestrator、人类拥有内容判断。
- 记录了 CLI JSON failure envelope 的 producer/consumer 权威分工。
- 记录了 Lifecycle Phase / Method Module / Pipeline Stage / Playbook Node 四层术语。
- 记录了 refresh path 与 Structural Versioning Path。

这些内容不应推倒重写；应重新分层、纠正适用域，并把 Charter 中更根本的 Agentic
边界放到最前面。

### 2.3 当前配置的主要偏差

#### 偏差 A：framework maintenance 与 run-bundle production 混在一起

当前 context 将 `PPTMAKER_FRAMEWORK/` 写成无条件“只读”。准确边界应为：

- 做具体 deck 时：framework 是只读方法论和工具，只操作用户明确指定的 `deck_*`。
- 做 repository maintenance 时：OpenSpec apply 可以按 change 修改
  `PPTMAKER_FRAMEWORK/`、`openspec/`、`tests/`、`tests_e2e/`。
- 未明确指定 deck 路径时，不得扫描、修改或拿 `deck_*` 当框架源码。
- `dpt_*` 只在用户明确指定素材路径时读取。

如果不区分这两个 mode，Agent 可能出现两种相反错误：

1. 维护 change 时误以为 framework 永远不可改。
2. 做 framework change 时把生产数据 `deck_*` 当成实现或测试夹具随意修改。

#### 偏差 B：没有把“MD 控制、JS 被动”写成设计禁令

当前配置说 Agent 是编排器，但尚未明确禁止：

- 在 JS 中硬编码 playbook node 顺序。
- 在 JS 中复制 `requires`、entry/exit、decision enum。
- 用代码生成或拥有 controller 内容。
- 让 CLI 自己做创意选择或人类内容判断。
- 用第二份 JSON/YAML 图描述与 `playbook/*.md` 相同的流程。

这使后续 design 很容易因“更自动化”而把流程逐步下沉进 JS，破坏项目本质。

#### 偏差 C：capability 注册表与 main specs 漂移

当前 `config.yaml` 注册了 16 个 capability，但 main specs 实际有 20 个。配置缺少：

- `bootstrap-env-guidance`
- `commands-reference`
- `framework-charter`
- `framework-directory-layout`

同时配置宣称自己是 capability 命名权威，因此目前内部自相矛盾。

#### 偏差 D：`rules.version` 不是合法 artifact rule

OpenSpec 的 `rules:` 是“按 artifact ID 注入规则”。在 `spec-driven` schema 中，合法键
只有：

```yaml
rules:
  proposal: []
  specs: []
  design: []
  tasks: []
```

当前 `version:` 是未知 artifact ID：

- 不会注入任何 archive/version 指令。
- 生成 artifact instructions 时会出现 unknown artifact warning。
- 它看起来像有效控制，实际上只是未被消费的 YAML 数据。

#### 偏差 E：缺少最重要的 `design` 规则

设计阶段最需要回答“这个行为应该由 MD 还是 JS 拥有”，但当前 rules 只有
proposal/specs/tasks/version，没有 design。结果是 proposal 可能写对方向，design
却仍然把主流程做进代码。

#### 偏差 F：framework change 规则被 deck 生产细节淹没

当前 proposal/tasks 全局要求：

- 多页视觉变更先 pilot。
- 标注 `--force-images` / `--only` / `--new-version`。
- 任务粒度按 pipeline stage。
- 每个任务对应 `tests/test_<script>.mjs`。

这些对 `run-bundle-production` 很重要，但不适合所有 framework change。修改 Charter、
MD Controller、state migration、CLI diagnostics 或目录本体论时，不应该被迫按 Stage
1–5 拆任务。

#### 偏差 G：部分简化表述与真实契约不完全一致

典型例子：配置笼统写 Stage 2 必须 content/visual gate approved，但真实行为是：

- production Stage 2：必须 approved 或 waived。
- preview/pilot Stage 2：允许 gate pending，但不得为了 preview 自动 waive。

这类会变化的精细语义不适合在 config 中复制半份；应保留稳定原则，并指向 capability
spec 作为详细权威。

#### 偏差 H：易漂移的计数和清单写进全局 context

当前 context 含有“12 个命令”“9 controller + 1 shared + 40 node”等准确但易变化的
数字。它们应由 spec/test 校验，不宜作为长期手写背景事实；否则每次新增命令或
playbook 都要同步多处。

---

## 3. Charter 派生的不可偏移原则

整理 config 时，以下内容必须作为上位约束，而不是可选风格偏好。

### 3.1 Agent owns process，human owns substance

- Agent 负责流程、目录、阶段、变更分类、文件管理和执行路径。
- 人类负责隐喻是否准确、主张是否可信、颜色是否适当、视觉是否满意等内容判断。
- 用户不应被要求从零设计系统；Agent 应给 2–3 个候选和推荐。

### 3.2 Markdown-first control plane

- `playbook/*.md` 是节点内容、顺序、依赖、entry/exit、决策分支与执行说明的唯一真相源。
- Charter 定义宪法，workflow 提供方法论，playbook 定义可执行 controller。
- `md_controller_reader.mjs` 只读、解析、索引、校验，不生成、不修改、不执行 playbook。
- JS 不得维护第二份控制流注册表。

### 3.3 MD↔JS complementary robustness

- MD/Agent 擅长模糊意图、创造性判断与上下文推进。
- JS/CLI 擅长格式、schema、状态、哈希、路径、转换和确定性检查。
- 可确定性修复的 YAML/JSON 瑕疵应 heal 并写回 canonical form。
- 不应把“请用户修 YAML 标点”作为小白用户的默认下一步。
- 真不可恢复才通过结构化 diagnostic 把证据和 next 交回 MD Controller。

### 3.4 Gate 是控制权交接，不是墙

- JS 发现 gate 不满足时，应给出：发生了什么、具体对象、可执行 next、默认路径。
- `requires_human:true` 必须停下，不能伪造批准。
- Gate 不负责替人判断视觉和内容。
- Gate 不应只返回散文错误，也不应静默猜测。

### 3.5 Show, don't tell

- style master、pilot contact sheet 等真实视觉产物存在时，必须展示后才能请求批准。
- 文字描述不能替代真实视觉 review。
- pre-key 阶段可降级展示 prompt/preset；一旦出图必须升级到真图。

### 3.6 Filesystem is workflow memory

- `_state/state.yaml` 是当前 playbook 执行指针真相。
- `_generated/` / status 是产物和 readiness 证据。
- `_lessons/` 保存 Agent 自己克服困难后留下的非密钥经验。
- 聊天上下文不是进度真相；断线恢复先读盘。

### 3.7 Source vs derived

- 手改源：backbone、slide specifications、overrides、playbook、workflow、specs。
- 派生产物：run bundle `_generated/` 下 JSON、PNG、PPTX、receipt、contact sheet。
- 修复永远从源或负责生成它的 capability 开始，不直接修派生产物。

---

## 4. 两种 Change Domain

建议要求每个 proposal 在开头明确声明 change domain。

### 4.1 `framework-maintenance`

适用于：

- 修改 Charter / workflow / playbook。
- 修改 Node/State/CLI 协议。
- 修改 Stage 1–5 或 `ppt_flow`。
- 修改 run-bundle ontology、init/check/new-version。
- 修改 OpenSpec specs、project versioning 或测试。

允许修改：

```text
PPTMAKER_FRAMEWORK/
openspec/
tests/
tests_e2e/
repo-level control files explicitly in scope
```

默认不读、不改：

```text
deck_*
dpt_*
_backlog/（除非用户明确指定）
```

### 4.2 `run-bundle-production`

适用于：

- 为用户制作具体 PPT。
- 修改指定 deck 的内容、视觉、备注或结构。
- 运行 pilot/build/refresh/new-version。

约束：

- 用户必须明确指定 `deck_*` 路径，或当前会话已经建立明确 run bundle scope。
- `PPTMAKER_FRAMEWORK/` 在此 mode 下只读。
- 不得修改 framework、tests 或 OpenSpec main specs 来“顺手适配”某个 deck。
- `_generated/` 不手改。
- 结构变化走 Structural Versioning Path；产物变化走最小 refresh path。

### 4.3 Proposal 建议新增的显式字段

proposal 模板内容不必修改 OpenSpec package template，但项目规则应要求正文包含：

```markdown
## Change Classification

- Domain: framework-maintenance | run-bundle-production
- Control owner: MD | JS | MD↔JS protocol
- Target object: framework source | deck_<name>/3_versions/vN
- Governing capabilities: <existing capability IDs>
- Authoritative sources touched: <files/specs>
- Generated artifacts affected: none | regenerated through <path>
```

这些字段的价值：

- Domain 防止 framework 与 run bundle 串台。
- Control owner 防止主流程被错误下沉进 JS。
- Target object 防止模糊地修改所有 deck 或所有版本。
- Governing capabilities 防止自创 spec 名称。
- Authoritative sources 防止只改镜像文档。
- Generated artifacts 防止手工修派生产物。

---

## 5. 权威源地图

config 应提供“去哪找权威”的稳定路由，而不是复制所有详细规则。

| 主题 | 权威源 | config 的角色 |
|------|--------|---------------|
| 项目行为与交互铁律 | `charter/AGENT_CONTRACT.md` | 摘要核心边界并要求遵守 |
| runtime / MD↔JS 宪法 | `charter/CONSTITUTION.md` | 摘要，不复制详细 schema |
| Phase 与刷新路径 | `charter/WORKFLOW.md` | 提供术语和路由 |
| Node/State/CLI consumer | `charter/NODE-SPEC.md`、`node-specification` | 指向 consumer 权威 |
| CLI diagnostic producer | `cli-surface` | 禁止 consumer 复制字段 schema |
| Playbook 控制流 | `playbook/*.md` | 明确其为唯一流程真相源 |
| Run-bundle 目录本体论 | `bundle_layout.mjs`、`run-bundle-layout` | 不另画第二棵权威树 |
| Framework 目录布局 | `framework-directory-layout` | 与 run-bundle layout 分开 |
| Capability 行为 | `openspec/specs/*/spec.md` | registry 只做导航和命名 |
| OpenSpec change 增量 | active `openspec/changes/<name>/specs/` | apply 前同时读取 main + delta |
| Repo 版本 | `VERSION`、`project-versioning` | archive 后触发判断 |

### 5.1 Capability 注册表的推荐定位

保留 config 中的 capability 表，但改变语义：

- config registry：**OpenSpec artifact 的导航与允许名称索引**。
- `openspec/specs/<id>/spec.md`：该 capability 的规范内容权威。
- active delta：当前 change 对 main capability 的增量。
- 注册表不得复制 requirement 或 scenario。

### 5.2 防漂移要求

增加测试，校验：

1. config registry 中的 capability ID 集合与 `openspec/specs/*` 目录集合一致。
2. 所有 ID 是 kebab-case。
3. 每个 registry ID 有对应 `spec.md`。
4. 每个 main spec 都被 registry 收录。
5. registry 中的关键路径存在。

如果 Markdown 表格解析过于脆弱，可在测试中用稳定的反引号 capability token 提取；不应
为此新增一套会与 context 重复的生产 registry 文件，除非后续另起专门设计。

---

## 6. YAML 文件本身的设计约束

这是本计划的重点：`config.yaml` 的内容必须符合 OpenSpec 实际解析方式，而不是只在人眼
看来合理。

### 6.1 只依赖 OpenSpec 真正消费的顶层字段

OpenSpec 当前消费：

```yaml
schema: spec-driven
context: |-
  ...
rules:
  proposal: []
  specs: []
  design: []
  tasks: []
```

此外 OpenSpec 支持 `references` / `store`，但本 change 无需求时不新增。

不要新增并依赖这些看似合理但不会自动注入的顶层字段：

```yaml
capabilities:  # OpenSpec 不会自动注入 artifact instruction
archive:       # 不是 spec-driven artifact
version:       # 不是 spec-driven artifact
apply:         # apply 是动作，不是本 schema artifact ID
```

自定义顶层字段即使 YAML 能解析，也可能被 OpenSpec 静默忽略。项目控制必须放在
`context` 或合法 artifact `rules` 中。

### 6.2 `context` 使用 literal block scalar

推荐：

```yaml
context: |-
  ## 项目本质

  ...
```

理由：

- `|`/`|-` 保留 Markdown 换行与表格结构。
- `|-` 去掉末尾额外换行，diff 和直接读取更稳定；OpenSpec 当前还会 `.trim()`，但文件
  自身仍应 canonical。
- 所有内容必须缩进两个空格，禁止 tab。
- context 是注入给 Agent 的 background，不会直接成为 proposal 输出。

避免把整段 context 改成 `>` folded scalar：它会折叠普通换行，破坏 Markdown 表格、
代码块和层次结构。

### 6.3 长规则使用 folded scalar，确保仍是单个 string

`rules.<artifact>` 必须是 string array。长规则推荐：

```yaml
rules:
  proposal:
    - >-
      先声明 change domain、control owner、governing capabilities 和 authoritative
      sources；不得把 framework-maintenance 与 run-bundle-production 混为一类。
```

好处：

- YAML 解析结果仍是一个字符串。
- 文件可以自然换行，减少超长行。
- 避免包含 `: `、`#`、`[`、`]` 时 plain scalar 产生歧义。

短规则也可使用双引号，但不应混用复杂转义。包含大量反斜杠或双引号时优先 `>-`。

### 6.4 YAML 注释不是 Agent 控制指令

`# comment` 不会出现在 OpenSpec 注入的 context/rules 中。因此：

- 解释维护者为什么这样排版，可以写 YAML 注释。
- 需要 Agent 真正遵守的规则，必须写进 `context` 或 `rules`。
- 不得把安全、所有权或 archive 行为只写成注释。

### 6.5 不使用 YAML anchor/alias 复用政策文本

虽然 YAML 支持 `&anchor` / `*alias`，本文件不建议使用：

- Agent 和人类审阅时不易在局部看懂最终文本。
- alias 不能方便地拼接 context 字符串。
- 容易让 artifact-specific rule 看似独立、实际共享同一长文本。
- diff 和未来迁移工具的可读性较差。

这里优先接受少量明确重复，或把真正全局规则放进 context 一次。

### 6.6 避免在 context 中硬编码易变化计数

不建议继续写：

- 固定命令数量。
- 固定 playbook/node 数量。
- 当前 npm dependency 完整版本清单。
- 每个 stage 的所有参数细节。

建议写：

- “registered direct CLI surface 由 `cli-surface` 拥有”。
- “当前 playbook 集合由 `playbook/*.md` 与 reader validation 决定”。
- “运行时依赖以 `package.json` 为准”。

只有稳定的枚举和宪法术语适合留在 context，例如 Node-only runtime、四层 hierarchy、
两个 canonical render mode。

### 6.7 Markdown 语法必须在 scalar 内正确

当前类似下面的写法：

```markdown
** 唯一允许的可执行代码
```

并不是正确 Markdown bold。应改成：

```markdown
**唯一允许的可执行代码：Node.js ESM。**
```

context 虽然是 YAML scalar，但最终作为 Markdown-like project context 呈现给 Agent，内部
Markdown 仍应有效。

### 6.8 编码与格式约定

- UTF-8。
- LF newline。
- 两空格缩进。
- 顶层顺序固定：`schema` → `context` → `rules`。
- section 顺序由稳定到易变：本质/边界 → 权威 → runtime → capability → lifecycle。
- 中文说明为主，关键 canonical identifier 保留英文。
- 不使用旧 render mode 或旧 refresh path 作为独立 operational term。

### 6.9 大小与信息密度

- OpenSpec context 上限 50 KB，但不以接近上限为目标。
- 建议整理后 context 控制在约 8–14 KB。
- 每条规则只表达一个可检查约束。
- 详细 schema、字段枚举、异常 bounds 留在 main capability spec。
- config 负责路由和不变量，不负责成为第二套 spec 大全。

---

## 7. 建议的 `context` 信息架构

以下是结构草图，不是最终 YAML 文案。

### 7.1 项目本质：Markdown-first Agentic Workflow

第一屏必须直接说明：

- 这不是传统“代码拥有流程”的程序。
- Agent/MD 是 orchestrator/control plane。
- JS/CLI 是 deterministic capability plane。
- Human owns substance，Agent owns process。

### 7.2 工作域与对象边界

列出：

- framework source 四个目录。
- run bundle `deck_*`。
- research input `dpt_*`。
- `_backlog` 只有明确指定才读取。
- maintenance vs production 两种 mode。

### 7.3 Authority & ownership map

明确：

- Charter 是宪法。
- playbook MD 是控制流真相。
- main specs 是 capability 行为真相。
- active delta 是 change 增量。
- `bundle_layout.mjs` 是 run-bundle tree 机器 SSOT。
- JS consumer/producer 分界。

### 7.4 不可违反的架构原则

保留但压缩：

- Node-only runtime。
- 不依赖外部 skill。
- CLI hard failure envelope。
- heal-first。
- source vs derived。
- fail closed for unknown conditions。
- show-before-visual-gate。

### 7.5 Capability registry

按责任域完整登记 20 个 main capabilities：

1. Framework constitution / entry。
2. Framework directory / run-bundle ontology。
3. MD controller / node-state execution。
4. CLI / command routing。
5. Stage 1–5 production。
6. Visual and asset capabilities。
7. Environment and version governance。

表格只写：ID、责任、主要权威文件。不要写 requirements。

### 7.6 Hierarchy vocabulary

保留四层：

- Lifecycle Phase。
- Method Module。
- Pipeline Stage。
- Playbook Node。

强调不可混称，不再复制整套 Phase 操作手册。

### 7.7 OpenSpec development lifecycle

明确每轮 change：

1. proposal：分类 domain / owner / capability / authority。
2. specs：写可观察行为和边界。
3. design：证明 MD↔JS 所有权没有被破坏。
4. tasks：先权威源、再消费者、再镜像与测试。
5. apply：按任务实施，不扩大 scope。
6. validate：OpenSpec strict + relevant tests + full regression。
7. archive：同步 main specs，再判断版本。

### 7.8 Run-bundle production rules（条件化附录）

refresh path、pilot、`--force-images`、`--new-version` 等保留，但明确只在：

```text
Domain = run-bundle-production
```

或 framework change 明确修改这些语义时才适用。不能让它们覆盖 Charter/CLI/state 等
framework maintenance 的任务拆分。

---

## 8. Artifact-specific Rules 设计

### 8.1 `proposal`

建议规则：

1. 必须声明 change domain。
2. 必须声明 control owner：MD / JS / MD↔JS protocol。
3. 必须列出受影响 capability，复用 registry ID。
4. 必须说明修改的是权威源还是镜像/消费者。
5. 若行为可由 MD 表达，不得默认提议新增 JS orchestration。
6. 若修改 CLI，必须声明 producer/consumer 影响。
7. 若修改 run-bundle layout，必须区分 framework directory layout。
8. 若涉及 `deck_*`，必须给出明确 run bundle scope。
9. 不得提议手改 `_generated/`。
10. 必须说明兼容、迁移、gate、用户可见行为和验证范围。

### 8.2 `specs`

建议规则：

1. Requirement 描述可观察行为，不以内联实现步骤代替规范。
2. 每个 requirement 明确行为所有者或可从场景中判断所有者。
3. MD Controller 行为写“Agent reads/decides/records/returns control”。
4. JS 行为写确定性输入、输出、证据、错误和幂等性。
5. 跨 MD↔JS 场景区分 producer 与 consumer，不复制对方 schema。
6. 未知 gate/condition 必须 fail closed。
7. 用户批准必须 typed provenance，不伪造 user evidence。
8. 目录 spec 必须区分 soft bundle 与 run bundle。
9. preview 与 production 的例外必须显式写 scenario。
10. source 与 generated lineage 必须清晰。

### 8.3 `design`

建议新增规则：

1. 必须有“Ownership decision”小节，解释为什么由 MD、JS 或协议拥有。
2. 必须检查是否出现第二套 workflow representation。
3. 必须列出 authority graph：哪个文件定义，哪些文件消费/镜像。
4. 必须说明如何防止 docs/spec/code drift。
5. 涉及 state 时说明 schema migration、execution isolation、heal、atomic write、幂等。
6. 涉及 CLI 时说明 envelope、delegation、secret safety、human gate。
7. 涉及生成物时说明 invalidation 和 rebuild，而不是手改。
8. 涉及兼容时区分 read compatibility 与 canonical write output。
9. 给出被否决的“把流程写进 JS”等备选及否决理由。
10. 设计不得因单个 deck 的特殊需求污染 framework contract，除非明确抽象为 capability。

### 8.4 `tasks`

建议规则：

1. 任务顺序：规范/权威源 → MD controller 或 JS capability → consumer/mirror → tests → validation。
2. 不再要求所有任务按 Pipeline Stage 粒度。
3. 每项标注 capability，但不强制“一脚本一测试”。
4. 根据风险选择 unit、integration、e2e、docs coherence。
5. 修改 controller 时加入 reader validation / state-machine 场景。
6. 修改 CLI 时加入 exit path、stderr last-line envelope、delegation 场景。
7. 修改 config 时加入 YAML parse、artifact key、registry coherence、instruction smoke test。
8. 不得包含手改 `_generated/` 的步骤。
9. run-bundle-production 任务才标注 refresh path / pilot / force / new-version。
10. 最终任务包含 strict spec validation、targeted tests、`npm test`；跨 playbook/state 时考虑 e2e。

### 8.5 Archive / version 规则放置

删除无效的 `rules.version` 后：

- 在通用 `context` 的 OpenSpec lifecycle 中写“archive 后判断版本”。
- `project-versioning` spec 保持详细权威。
- `tasks` 最后一项可以要求准备 archive/version verification，但不在 apply 中擅自 bump。
- archive 完成后由 Agent按 `project-versioning` 判断 MINOR/PATCH/no bump，并请求用户确认。

不建议 fork schema 只为增加 `version` artifact；这会引入不必要的 OpenSpec schema 维护成本。

---

## 9. Capability Registry 整理方案

### 9.1 必须补齐的现有 capability

当前遗漏的四个 capability 应补回 registry：

| Capability | 责任 |
|-----------|------|
| `bootstrap-env-guidance` | BOOTSTRAP 环境修复与新手自包含指导 |
| `commands-reference` | 自然语言意图到 playbook/命令的路由参考 |
| `framework-charter` | Charter、入口面、交互铁律和架构一致性 |
| `framework-directory-layout` | `PPTMAKER_FRAMEWORK/` soft-bundle 目录布局 |

### 9.2 是否新增 `openspec-project-governance`

推荐在正式 proposal 中评估新增 capability：

```text
openspec-project-governance
```

它可以拥有：

- `openspec/config.yaml` 的 project context 与 artifact rules。
- schema artifact ID 合法性。
- capability registry coherence。
- framework/run-bundle change domain 分类。
- OpenSpec lifecycle 与 Charter 一致性。

推荐理由：当前没有 main spec 明确拥有 config 自身；结果是 config 由多个 change 顺手修改，
容易成为无主的重复说明面。

备选：不新增 capability，由 `framework-charter` 扩展拥有 config。缺点是 Charter capability
会同时承担 framework entry docs 与 OpenSpec project configuration，两者责任略宽。

倾向结论：**新增 `openspec-project-governance` 更清晰**。这是新 capability，archive 后应按
`project-versioning` 评估 MINOR bump。

---

## 10. 拟议 OpenSpec Change

建议 change slug：

```text
restructure-openspec-project-config
```

### 10.1 Proposal 范围

包含：

- 重构 `openspec/config.yaml` 信息架构。
- 强化 Markdown-first / Agent-owned / JS-assisted 架构边界。
- 明确 framework maintenance 与 run-bundle production。
- 修复 capability registry 漂移。
- 删除无效 `rules.version`，新增 `rules.design`。
- 条件化 deck production 规则。
- 增加 config coherence tests。
- 必要时新增 `openspec-project-governance` capability。

不包含：

- 修改任何 `deck_*`。
- 修改具体 PPT 内容或生成图片。
- 改变 Stage 1–5 runtime 行为。
- 改变 Node State Schema。
- 改变 CLI diagnostic schema。
- fork OpenSpec schema。

### 10.2 预计受影响 specs

最小方案：

- `framework-charter`
- `project-versioning`

推荐方案：

- 新增 `openspec-project-governance`
- 对 `framework-charter` 只增加交叉引用或一致性要求
- 对 `project-versioning` 澄清 version rule 的有效放置位置

如果 change 仅整理 config 文案、没有改变已有 capability 行为，也应通过 delta spec 固化
config 的可验证行为，避免再次成为“只有文档、没有 owner”的控制面。

---

## 11. 实施任务草案

以下任务供未来 OpenSpec `tasks.md` 使用，不在本 plan 阶段执行。

### Phase 1：规格与所有权

- [ ] 1.1 决定由新 `openspec-project-governance` 还是现有 `framework-charter` 拥有 config。
- [ ] 1.2 写 delta requirements：两种 change domain、MD↔JS ownership、合法 artifact rules。
- [ ] 1.3 写 registry coherence、YAML parse、OpenSpec instruction injection scenarios。
- [ ] 1.4 明确 project-versioning 在 archive 后触发，不再依赖 `rules.version`。

### Phase 2：设计

- [ ] 2.1 画出 config → artifact instructions → Agent artifact 的信息流。
- [ ] 2.2 定义 context 与 rules 的分工：全局不变量 vs artifact-specific constraints。
- [ ] 2.3 定义 capability registry 的 owner 与自动防漂移方法。
- [ ] 2.4 列出不应进入 config 的易变细节。
- [ ] 2.5 记录不 fork schema、不引入第二份 registry 文件的理由。

### Phase 3：YAML 重构

- [ ] 3.1 将 `context: |` 调整为规范的 `context: |-`。
- [ ] 3.2 按“项目本质 → domain → authority → constitution → registry → lifecycle”重排。
- [ ] 3.3 修复 Markdown bold、标点和长行。
- [ ] 3.4 补齐 capability registry，或按最终设计重建完整 registry。
- [ ] 3.5 删除无效 `rules.version`。
- [ ] 3.6 新增 `rules.design`。
- [ ] 3.7 将长 rules 改为 `>-` 单字符串格式。
- [ ] 3.8 把 run-bundle refresh/pilot 规则改成有 domain 条件的规则。

### Phase 4：一致性与测试

- [ ] 4.1 YAML parse test：schema/context/rules 类型正确。
- [ ] 4.2 artifact key test：rules keys 恰为 proposal/specs/design/tasks 的有效子集或全集。
- [ ] 4.3 capability registry test：与 main specs 目录一一对应。
- [ ] 4.4 forbidden drift test：config 不再无条件称 framework 永远只读。
- [ ] 4.5 Agentic boundary test：context 明确 MD controller SSOT 与 JS 非编排职责。
- [ ] 4.6 run-bundle boundary test：`deck_*` 明确为生产对象，不是 framework code。
- [ ] 4.7 preview semantics test：不得写成所有 Stage 2 都一律要求已批准 gate。
- [ ] 4.8 instruction smoke：用临时/测试 change 获取 proposal/design/tasks instructions，确认 context
  和对应 rules 实际出现，且无 unknown artifact warning。

### Phase 5：文档镜像与验证

- [ ] 5.1 只在必要位置同步 Charter/root AGENTS，避免复制整份 config。
- [ ] 5.2 `openspec validate <change> --strict`。
- [ ] 5.3 `openspec validate --specs --strict`。
- [ ] 5.4 运行 targeted config/docs consistency tests。
- [ ] 5.5 `npm test`。
- [ ] 5.6 若修改 playbook/state/CLI 跨面，再运行 `npm run test:e2e`。

### Phase 6：Archive 与版本

- [ ] 6.1 archive change，同步新/修改后的 main specs。
- [ ] 6.2 检查 config registry 与 main specs 是否仍一致。
- [ ] 6.3 按 `project-versioning` 判断版本：新增 governance capability 倾向 MINOR；纯整理且无行为
  变化可不 bump；修复失效规则若视为行为修复则评估 PATCH。
- [ ] 6.4 用户确认后才同步 VERSION、VERSION_LOG、framework README、package.json。

---

## 12. 验收标准

### 12.1 内容验收

- Agent 只读 config 就能说明本项目不是普通代码工作流。
- Agent 能准确区分 framework、run bundle、deep research input。
- Agent 能准确区分 maintenance mode 与 production mode。
- Agent 知道 MD Controller 是流程 SSOT，JS 不得拥有第二套流程。
- Agent 知道 Gate、heal、show、state-on-disk 等 Charter 特征。

### 12.2 OpenSpec 行为验收

- proposal instructions 获得 domain/owner/capability/authority 规则。
- design instructions 获得 MD↔JS ownership 和 no-second-workflow 规则。
- specs instructions 获得可观察行为与 producer/consumer 分工规则。
- tasks instructions 获得 authority-first、test-by-risk、no-generated-edit 规则。
- 不再出现 unknown artifact ID `version` warning。

### 12.3 YAML 验收

- YAML 可由 `yaml` package 正常解析。
- `context` 是 string，大小低于 50 KB。
- `rules` 是 artifact ID → string array。
- context 中的 Markdown table/code block 未被 folded scalar 破坏。
- 长 rule 解析后仍是一条 string，不被拆成 mapping。
- 无 tab、无 anchor/alias、无依赖 YAML comment 的行为规则。

### 12.4 一致性验收

- capability registry 与 main specs 1:1。
- config 与 Charter 对 MD↔JS、run bundle、Gate、runtime 的说法一致。
- config 不复制 cli-surface diagnostic schema。
- config 不复制 node-specification 的完整 condition catalog。
- config 不硬编码易漂移的 command/playbook/node 数量。

---

## 13. 风险 / 取舍

| 风险 | 缓解 |
|------|------|
| context 太长，Agent 抓不住重点 | 项目本质与 MD↔JS 边界放第一屏；细节下沉到 capability spec |
| 为防漂移增加第二套 registry | 优先直接测试 config 表与 `openspec/specs/*`；不新增生产 registry 文件 |
| rules 过多，artifact 生成僵化 | 每条只写不可违反的边界，不规定措辞和段落数量 |
| run-bundle 规则被删掉后丢失生产特色 | 不删除，改成 domain 条件化附录 |
| 新 capability 导致范围扩大 | proposal 阶段先决定 owner；若 framework-charter 足够则不强建 |
| config 与 Charter 重复 | config 只摘要不变量与路由，详细行为仍由 Charter/main spec 拥有 |
| YAML 看似有效但 OpenSpec 忽略字段 | 测试实际 artifact instructions，不只做 YAML parse |
| archive/version 规则移走后没人执行 | 放进全局 lifecycle context，并由 project-versioning spec/skill继续约束 |

---

## 14. 被否决或暂不推荐的方案

### 14.1 只做文案精简

否决原因：无法解决 change domain 混淆、无效 `rules.version`、缺 design rules 和 registry
漂移。

### 14.2 把所有 Charter 内容完整复制进 config

否决原因：会形成第二套宪法，长期必然漂移。config 只应保存高阶不变量和权威路由。

### 14.3 把 config 改成大量结构化自定义顶层键

否决原因：OpenSpec 不会自动消费未知字段；看似机器可读，实际不会进入 artifact
instructions。

### 14.4 Fork OpenSpec schema，增加 apply/archive/version artifact

暂不推荐：当前问题可通过 context + 四个合法 artifact rules + project-versioning spec 解决。
fork schema 会新增模板、graph 和升级维护成本。

### 14.5 把 MD Controller 编译成 JS 状态机

明确否决：这会改变项目本质。允许 JS 读取和验证 MD，不允许 JS 成为流程权威。

---

## 15. 落地关联

建议后续创建：

| OpenSpec change | 目的 | 状态 |
|-----------------|------|------|
| `restructure-openspec-project-config` | 按本 plan 重构 config、补 design rules、修 registry 与测试 | 待 propose |

完成并 archive 后：

1. 本 plan 移入 `_backlog/_done/_closed_plans/`，文件名保持不变。
2. 更新 plans / closed plans / done 三处 README 计数与索引。
3. 若结论只被部分吸收，在关闭卡片中记录未落地项，不把剩余内容遗忘在聊天里。

---

## 16. 用户追加的四条执行约束（最高优先级）

> 2026-07-14 补充。以下四条是后续 proposal、design、tasks 和 apply 的直接约束。
> 若本 plan 前文存在范围更大、约束更强或抽象更重的建议，以本节为准。

### 16.1 第一原则：尊重 YAML 与 OpenSpec schema

`openspec/config.yaml` 首先是 OpenSpec 消费的 YAML，不是任意 Markdown 容器。调整前必须
先服从 OpenSpec 对 project config 的真实规定：

- 先确认当前 schema 是 `spec-driven`，不得凭想象增加 artifact。
- 只使用 OpenSpec 实际支持和消费的字段、类型与 artifact rule key。
- `schema` 必须是非空字符串；`context` 必须是字符串；`rules` 必须是
  artifact ID → string array。
- 当前合法 artifact ID 是 `proposal`、`specs`、`design`、`tasks`；不能把
  `version`、`archive`、`apply` 当成有效 artifact rule。
- 调整后不仅要做 YAML parse，还要获取实际 artifact instructions，确认 context/rules
  确实被 OpenSpec 注入。
- 格式整理服务于 schema 和可读性，不为了“看起来更结构化”加入 OpenSpec 会忽略的
  自定义顶层字段。

一句话：**先尊重 OpenSpec 的 schema 和消费模型，再谈项目自己的表达。**

### 16.2 第二原则：现有配置能工作，只做小步对齐

当前 config 已经在工作，且包含大量仍然正确的项目背景。本 change 不应以“重写配置”为
默认方案，而应采用小步迭代：

1. 先列出与现状不一致、会误导 Agent 或实际不生效的项目。
2. 只修这些确定问题，不顺手重构所有段落。
3. 保留已经正确的 Node-only、Agent orchestrator、run bundle、source/derived、CLI
   diagnostic 等泛化原则。
4. 每一步保持 YAML 可解析、OpenSpec instructions 可生成、main specs 可校验。
5. 优先一个小 change 完成最小对齐；后续确有必要再开独立 change 继续收敛。

第一轮建议严格控制为：

- 修正 framework“只读”的适用条件：deck production 只读，repository maintenance 可按
  OpenSpec change 修改。
- 补强一句 MD Controller 是流程 SSOT、JS 是被动确定性能力，禁止第二套 JS workflow。
- 修正或移走无效 `rules.version`。
- 补一个克制的 `rules.design`，只保护所有权边界，不写成长篇设计手册。
- 对齐 capability/目录/测试术语中的确定错误或遗漏。
- 修正 preview Stage 2 与 production Stage 2 的 gate 区别。

第一轮默认不做：

- 不 fork OpenSpec schema。
- 不新增复杂配置生成器。
- 不大规模改写全部 context。
- 不为了本次整理创建第二套 capability registry 文件。
- 不默认新增 `openspec-project-governance` capability；只有最小修补后仍缺少明确 owner，
  才在后续 change 单独评估。
- 不修改 runtime、playbook、state 或 pipeline 行为。

判断标准：**哪里与实际项目拉偏，就把哪里拉回来；已经工作的部分不因追求整齐而重做。**

### 16.3 第三原则：保留泛化指导，放松过度具体约束

config 应保持 Charter 级别的指导水准：告诉 Agent 项目是什么、权威在哪里、哪些边界
不能越过；不应成为第二套操作手册、第二套 capability spec 或每个 change 的固定答案。

应保留的泛化原则：

- Markdown-first Agentic workflow。
- Agent owns process，human owns substance。
- MD 做模糊判断，JS 做确定性执行和 gate evidence。
- Node-only runtime 与跨平台边界。
- framework source 与 run bundle production object 分离。
- source 与 generated artifact 分离。
- Gate、show、heal、state-on-disk 等稳定原则。
- capability 名称、权威文件和查找路径。

应放松、删除或改成引用的过度具体内容：

- 易变化的命令、controller、node 数量。
- 每类任务必须按 Pipeline Stage 粒度拆分。
- 每个任务必须一一对应 `tests/test_<script>.mjs`。
- 所有 change 都必须写 `--force-images`、`--only`、`--new-version`。
- 把完整 refresh decision tree 复制进每类 artifact rules。
- 把 CLI diagnostic 字段、Node condition catalog 或 state schema 再抄一份进 config。
- 对 proposal/design 的章节和措辞规定得过细。

规则强度应按以下层级控制：

```text
config.yaml
  = 项目本质 + 稳定边界 + 权威路由 + 最少 artifact 约束

Charter / main capability specs
  = 宪法和精确行为契约

workflow / playbook / scripts docs
  = 具体执行方法与命令
```

一句话：**config 负责把方向扶正，不负责替每个 change 做完设计。**

### 16.4 第四原则：统一并固定结构与测试术语

config 中必须把不同对象和层级叫准，避免把“framework 结构”“run bundle 结构”“测试
层级”混称为同一套目录结构。

#### A. Repository / framework source

框架维护范围分为四个源码域：

| 术语 | 路径 | 角色 |
|------|------|------|
| Framework soft bundle | `PPTMAKER_FRAMEWORK/` | 方法论、Charter、MD Controller、Node 工具和生产管线 |
| OpenSpec system | `openspec/` | main specs、changes、archive 与项目开发配置 |
| Unit / integration tests | `tests/` | 单元测试与跨模块集成测试 |
| End-to-end tests | `tests_e2e/` | 从公开入口验证完整状态机或端到端流程 |

这里不应简单说“有两个单元测试目录”。准确说法是：

- `tests/` 同时承载 unit tests 和 integration tests；具体测试类型由测试范围判断，不仅由
  文件所在目录判断。
- `tests_e2e/` 专门承载 end-to-end tests。
- 若将来确实拆分独立 integration test 目录，再通过正式 change 更新术语；当前不虚构
  不存在的目录。

#### B. Framework directory layout

只描述 `PPTMAKER_FRAMEWORK/` soft bundle 本身：

```text
workflow/  scripts/  charter/  reference/  playbook/
```

权威 capability：`framework-directory-layout` / `framework-charter`。

不要在这里描述 `deck_*` 的 upstream/backbone/version 三层树。

#### C. Run-bundle layout

`deck_*` 是 framework 生产和维护的 PPT 项目对象：

```text
deck_<name>/
  1_upstream_raw_material/
  2_backbone/
  3_versions/vN/
  _state/
  _lessons/
```

权威 capability：`run-bundle-layout`；机器 SSOT：`bundle_layout.mjs`。

必须强调：

- `deck_*` 不是 framework source。
- `3_versions/vN` 是 `--run-dir`，不是 deck 根。
- `_generated/` 是可重建派生物。
- `_scratch/` 是版本级临时出口。

#### D. Research input

`dpt_*` 是 deep research 输入材料，不是 framework，不是 run bundle，也不是测试夹具。
未被用户明确指定时不读。

#### E. 四层 workflow 术语

继续固定：

- Lifecycle Phase：`0 → 1/2 → 2.7 → 3 → 4`。
- Method Module：`workflow/00-setup` … `05-iteration`。
- Pipeline Stage：Stage 1–5。
- Playbook Node：MD Controller 中的执行节点。

不得用“Phase 04”代替 Method Module，也不得把 Pipeline Stage 和 Playbook Node 混称。

#### F. Change domain 术语

- `framework-maintenance`：通过 OpenSpec 修改 framework/spec/tests。
- `run-bundle-production`：在明确指定的 `deck_*` 内生产或迭代 PPT。

这两个术语用于帮助 Agent 选边界，不要求所有普通用户学习或使用。

### 16.5 对前文计划范围的收敛

基于以上四条，后续 change 的推荐策略由“全面重构”收敛为“最小有效校准”：

| 前文较大建议 | 收敛后的执行方式 |
|--------------|------------------|
| 全面重排整个 context | 只在必要处补一句、修一段、移动失效规则；能不重排就不重排 |
| 新增 governance capability | 第一轮不做；后续只有明确缺 owner 才单独 propose |
| 完整重建 capability registry | 先补确定缺项并校验术语；是否全面重建另评估 |
| 大量 artifact rules | 每个 artifact 只保留少量宪章级约束 |
| 强制 proposal 固定字段模板 | 先以简短规则要求分类，不强制复杂格式 |
| 复杂 YAML 结构化扩展 | 不新增 OpenSpec 不消费的自定义顶层结构 |
| 大范围测试体系改造 | 只增加直接覆盖本次偏差的最小 coherence/instruction 测试 |

### 16.6 第一轮建议验收口径

第一轮调整完成时，只要求回答以下问题：

1. YAML 是否符合 OpenSpec schema，且所有 rules key 都真实有效？
2. config 是否仍保留原来已经工作的泛化项目背景？
3. 与当前项目不一致的关键表述是否已拉回？
4. 是否明确 MD Controller 主流程与 JS 被动能力边界？
5. 是否准确区分 framework、run bundle、tests、tests_e2e、dpt input？
6. 是否去掉或放松明显过强、过细、易漂移的全局约束？
7. 是否没有改变 runtime、playbook、state 或 pipeline 行为？

七项都满足即可结束第一轮，不为了“顺手整理得更完美”继续扩大 scope。
