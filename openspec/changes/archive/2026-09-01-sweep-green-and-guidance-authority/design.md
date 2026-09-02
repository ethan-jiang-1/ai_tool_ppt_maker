## Context

`sweep` 基线（2026-09-01 复核）：2 failed / 699 passed，恰好为
`test_production_schema_conformance.mjs`（9 处 `retired-numeric-protocol-identity`）与
`test_diagnostic_recovery_handoff.mjs`（Common Requests 段 `ppt_flow` 禁词）。
规则由 `2026-08-14-retire-historical-protocol-surfaces` 落地，违规内容 08-20 后进入
（`reset-unproduced-v1`，BUG-081）。逐条裁决与决定基线见
`_backlog/plans/sweep-red-and-guidance-doc-consolidation.md`（owner 已批准）。

关键机制事实（`harness_architecture.mjs:547-593,716-726`）：residue 检查只对
"含生产角色词且**不匹配任何结构化版本形态**"的行触发；`3_versions/v1`、`vN/`、
`run_version` 字段等结构形态直接豁免。规范锚点
`production-schema-conformance/spec.md:269-331` 自身要求接受 owning contract 的
结构记法。

## Goals / Non-Goals

**Goals:**

- sweep 回到全绿，且分类边界与规范文本一致（不是把扫描器调松到失明）
- 消除 commands-reference ↔ diagnostic-handoff 的权威矛盾（显式裁决，不留双头）
- 根 `AGENTS.md` 验证词表、依赖清单、BOOTSTRAP 空壳段落对齐既有规范
- "workflow 选择"事实按 one-fact-one-home 归属并测试锁定

**Non-Goals:**

- 不改任何生产管线运行时行为、CLI 命令清单、gate 分类、run-bundle 契约
- 不新增 blocking rule、state 字段、retry/fallback（净简化 = 删除，见 policy 论证 in proposal）
- 不把 sweep 挂进 core 档或 CI 周期（可作为后续独立 change）
- 不处理 `docs/`、`_backlog/` 内容（不在 sweep 扫描根内）

## Decisions

### D1 — 扫描器豁免形态：前置字符 `[\w-]`（token 内部片段）

`ACTIVE_SURFACE_NUMERIC_VERSION`（`\bv[1-9][0-9]*\b`）命中后，若命中位前一字符是
`[\w-]`，说明 `vN` 是更长 token 的内部片段（`reset-unproduced-v1`），跳过。
备选被否：按文件/行内容枚举豁免（脆、逐例打补丁）；放宽正则允许任意连字（失明）。
依据：规范已把 "JavaScript export 语法" 列为代码 token 豁免，命令名同属代码 token，
不是散文里的数字身份。focused negative test 锁边界：同一行裸 `v1` 仍拒绝。

### D2 — 规范散文锚定为 `3_versions/v1`

6 处 spec 行把裸 `v1` 改写为 `3_versions/v1` 或等效复写。这是规范自身点名的
"owning run-bundle/version contract 的结构记法"，语义零变化，扫描器现成豁免。
备选被否：给扫描器加 determiner 启发式（"unique v1/that v1"）——按语感分类，脆且
偏离规范的语义类别定义。

### D3 — C1：新手表去命令名，命令名归 Agent Routing Reference

`COMMANDS.md` 已有 `## Agent Routing Reference`（在 diagnostic 测试的禁词区间
外）。Common Requests 的 image-channel 行改写为 Deck-Author 词汇；精确命令名保留在
Agent Routing Reference。`commands-reference` delta 记录这个词汇边界。
备选 C2（放宽测试禁词）被 owner 否决：削弱 Deck Author 无需学 CLI 词汇的规范意图。

### D4 — BOOTSTRAP 空 Runtime check map：删除 + 两行指针

建仓（08-06）即空置，全库零引用；运行时检查事实的唯一权威是 `ppt_flow doctor` /
`environment-check` capability，填充即制造第二事实源。测试锁定的
`Reserved Header Region` / `Provider Avoidance Constraint` 字符串不受影响。

### D5 — 依赖清单：package.json 唯一权威 + 核心五项枚举

四处清单（根 `AGENTS.md`、`README.md`、`CONSTITUTION.md`、`openspec/config.yaml`）
各加一句"完整清单以 `package.json` 为唯一权威"；根 `AGENTS.md` 与 `config.yaml`
枚举对齐为运行时核心五项（`@napi-rs/canvas`、`pptxgenjs`、`commander`、`yaml`、
`playwright`）。无测试锁定现有清单，无 delta。

### D6 — F 事实归属：清单先行，home/投影/指针三分类

对 "framed|pure 选择 + `production_identity.by_version` +
`repair-current-protocol-identity` hard-stop" 的每个复述实例（≥10 处）先出归属清单
（本文件附录，apply 时生成），分类规则：

| 角色 | 允许持有完整事实 |
|------|----------------|
| 规范 home | owning main spec（node-specification 等） |
| 流程投影 | `charter/AGENT_CONTRACT.md`、`charter/NODE-SPEC.md`（charter 即被引用的流程权威） |
| 入口摘要 | root `AGENTS.md` 保留一条 bullet；`BOOTSTRAP.md` 保留紧凑操作表述 |
| redirect/symlink | `CLAUDE.md` 类自动加载文件豁免 |
| 其余 | 一行指针 → home |

清单落定后改文档，并把清单断言固化进 `test_process_docs_consistency.mjs`（非 home
文件不含完整规则文本、含指针）。已测试锁定的字符串（`AGENT_CONTRACT.md` 的
`receipt-bound Framed Page\nImage finalization` 精确换行、BOOTSTRAP 两个 header
术语、`validateDiagnosticAuthorityPointers` 五文件指针）不得破坏。
**拆分条件**：清单若暴露 requirement 级行为变化（而非归属收敛），停止 F，回报 owner
按批准条件拆独立 change。

### D7 — 单 change 收敛

owner 要求 change 数量最小化；本 change 无生产运行时行为变化，拆分只重复固定流程
代价。A–F 共享同一个 proposal/design/tasks/verification 与 polish 循环。

## Risks / Trade-offs

- [豁免过宽放过散文连字] → 豁免仅限命中位前一字符 `[\w-]`；negative test 用
  "裸 v1 + 角色词" 同行对照证明仍拒绝。
- [规范行文改写走样] → 仅做锚定/复写，不改 SHALL 语义；每处 diff 对照原文；
  `openspec validate --strict` 必过。
- [F 收敛破坏 agent 引导冗余] → 入口文档的单 bullet 投影与 redirect 豁免是刻意保留，
  只收敛"多处完整复述"。
- [两处红测试之外有隐性耦合] → Stage 0 已确认基线仍为恰好 2 失败；收口跑全量 sweep
  兜底。

## Migration Plan

main specs 的 5 处行文变化通过本 change 的 delta 在 archive 时同步，不走带外编辑。
回滚 = revert 单个 commit；无运行时数据、状态或 bundle 受影响。

## Verification Strategy

| 层 | 验证什么 | 命令/位置 |
|----|---------|----------|
| unit（focused） | 扫描豁免边界：token 内 `-vN` 接受、同行裸 `v1` 拒绝 | `evaluateActiveSurfaceResidue` pure seam 的 focused cases（tests/contracts/test_production_schema_conformance.mjs 内既有 focused 覆盖扩展） |
| integration（docs） | Common Requests 禁词、novice 词汇边界、docs 一致性 + 新增归属断言 | `npx vitest run tests/contracts/test_diagnostic_recovery_handoff.mjs tests/contracts/test_process_docs_consistency.mjs` |
| core（每 change 必跑） | 受保护核心库存 | `npm test` |
| sweep（收口全量回归） | 701/701 全绿 | `npm run test:sweep` |
| openspec | delta 合法与 main specs 一致 | `openspec validate --all --strict` |

mock/real E2E 不需要：无公开 journey、provider、渲染路径变化（按 config.yaml 验证
策略评估规则记录此结论）。

## Open Questions

（无——所有决定已在批准的 plan 基线中做出。）

## Appendix — F 事实归属清单（apply 任务 5.1 回填）

判定单位：三要素完整复述（版本级 workflow 选择 + `production_identity` 绑定 + hard-stop 语义）。

| 文件 | 处置 |
|------|------|
| `openspec/specs/node-specification/spec.md` 等相关 main specs | 规范 home，保留 |
| `charter/NODE-SPEC.md` | charter 流程 home（State contract），保留 |
| `charter/AGENT_CONTRACT.md` | charter 流程 home（Authority/Unsupported boundary），保留 |
| `CONTEXT.md` | 术语 home（Production Identity / Workflow Meanings 词条），保留 |
| `BOOTSTRAP.md` Step 2 | 批准的紧凑操作投影，保留 |
| `ppt_maker_harness/CLAUDE.md`（redirect）、root `CLAUDE.md`（symlink） | 自动加载豁免，不动 |
| root `AGENTS.md` 关键约束末条 | **收敛**：压缩为入口摘要 + 指针（NODE-SPEC.md + node-specification spec） |
| `ppt_maker_harness/AGENTS.md` 头段 | **收敛**：保留机器锁定术语导向句（"`page-image-workflow` names the pipeline" 等，`harness_coherence.mjs:41` needle），绑定/hard-stop 复述改指针 |
| `ppt_maker_harness/README.md` 开头段 | **收敛**：选择+绑定改指针 |
| `charter/WORKFLOW.md` 开头段 | **收敛**：选择+fence+never-inferred 改指针（保留其独有的 hard-stop 边界细节段） |
| `workflow/00-setup/04-conventions.md` 开头段 | **收敛**：选择+State record 改指针 |
| `workflow/README.md` 末段 | **收敛**：hard-stop 复述改指针 |
| `openspec/config.yaml`「Workflow 术语」段 | 无需改：本就无 `production_identity`/hard-stop 细节，registry 已含 node-specification 指针 |
| `reference/glossary.md`、`anti-patterns.md`、`playbook/classify-change.md`、`playbook/create-deck.md`、`COMMANDS.md` | 仅操作性地命名 action/路径（非三要素复述），保留 |

锁定断言：`test_process_docs_consistency.mjs` › "keeps workflow-selection fact homes free of full restatements"（6 个非 home 文件不含 `production_identity` 且含 home 指针；NODE-SPEC.md 必须含 `production_identity`）。

### 实施期事实修正（不影响决定基线方向）

1. **核心依赖枚举 = 六项而非基线五项**：`jszip` 有直接 import（`05-delivery/internal/notes_runtime.mjs`），`playwright` 亦然（framed html runtime）。六项：`@napi-rs/canvas`、`pptxgenjs`、`jszip`、`commander`、`yaml`、`playwright`。
2. **机器锁定短语**：`validateTerminologyAuthorityPointers` 以纯子串匹配锁定 `ppt_maker_harness/AGENTS.md` 的 "`page-image-workflow` names the pipeline" 与 "version-level selection"（`harness_coherence.mjs:41`）——压缩时必须原样单行保留（换行会破坏子串匹配）。

### 范围外发现（预先存在，已用 HEAD 证据确认，不属本 change）

sweep 默认配置排除 `test_process_*`（`vitest.config.mjs` 注释：process 档必须显式选择）；
process 档存在 19 个预先红灯，与本 change 无关：

- `test_process_docs_consistency.mjs`：3（registry admission 6 issues、cli-surface Purpose 断言——HEAD config 评估即失败）
- `tests/shared/cli/test_process_target_diagnostics.mjs`：13、`tests/00-setup/test_process_env_check.mjs`：1（`git stash` 后于 HEAD 复跑同为 14 failed，铁证预先存在）
- `tests/00-setup/test_process_runtime_guidance.mjs`：1——**曾由本 change 的 D4 首次执行引入**（删除 BOOTSTRAP heading 索引破坏了 `### ${check-id}` 存在性断言），已修正：该骨架实为测试强制的检查 id 索引，恢复为"权威指针 + 纯索引"形态，4/4 绿

另：sweep 内两个重型套件（`test_framed_workflow.mjs`、`test_human_artifact_reference_cli.mjs`，
单文件 200s+）存在负载性超时 flake——并行 sweep 下偶发个别用例超时，standalone 复跑
31/31 全绿；非本 change 引入（本 change 对运行时代码零改动，仅 contracts 扫描器 + 文档/spec 行文）。
