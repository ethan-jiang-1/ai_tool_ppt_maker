# Proposal: sweep-green-and-guidance-authority

## Why

`npm run test:sweep` 当前 2 failed / 699 passed，而日常验证入口 `npm test`（core 档）全绿，给出假绿灯：governance lint 红了没人修，说明 sweep 不在常规反馈环里，自我 policing 机制正在静默腐烂。

两个红灯的根因都已查明（见 `_backlog/plans/sweep-red-and-guidance-doc-consolidation.md`，owner 已批准其决定基线）：

1. **residue 扫描误报（9 处）**：`retire-historical-protocol-surfaces`（2026-08-14）落地的 `retired-numeric-protocol-identity` 规则在 08-20 之后的内容上产生假阳性——注册命令名 `reset-unproduced-v1` 的 token 内部 `-v1`（2 处代码），以及 owning version contract 用裸 `v1` 指称 Work Version 的规范散文（6 处 spec 行 + 1 处 `COMMANDS.md`）。`production-schema-conformance/spec.md:288-293` 本身要求 sweep 区分 owning contract 的结构记法与协议身份，扫描器启发式目前做不到。
2. **spec↔test 真矛盾（1 处）**：`commands-reference/spec.md:267` 的规范字面要求 `COMMANDS.md` 新手表写明 `ppt_flow probe <run-dir>`，而 `test_diagnostic_recovery_handoff.mjs:95` 禁止 Common Requests 段落出现 `ppt_flow`。两个权威直接冲突，必须显式裁决（已采纳 C1：新手表保持 Deck-Author 词汇）。

同时存在的文档权威漂移（根 `AGENTS.md` 把 `npm test` 标注为"跑回归测试"、BOOTSTRAP 空壳段落、四处依赖清单各说各话、"workflow 选择"事实在 ≥10 处完整复述）与本次 sweep 修复同一性质：违反 `harness-charter` 既有 one-fact-one-home 要求（`spec.md:491-495`）与 `cli-surface` 验证词表要求（`spec.md:105-121`），是合规化而非新行为。

## What Changes

- **A（纯文档）**：根 `AGENTS.md` 快速命令表"跑回归测试"改为 bounded core verification 词表。
- **B（JS + spec 行文）**：`harness_architecture.mjs` 的 residue 匹配环增加一条豁免——`vN` 命中位前一字符为 `[\w-]`（token 内部标识符片段，如命令名）时跳过；配套 focused negative test（裸 "v1 protocol" 类内容必须仍被拒绝）。6 处规范散文行把裸 `v1` 锚定为 `3_versions/v1` 结构记法（语义不变）；`COMMANDS.md:19` 新手表述改写为不含裸版本 token。
- **C（spec 裁决）**：`commands-reference` 的 Common Requests 行字面要求改为"Deck-Author 词汇描述，精确命令名保存在同文件 Agent-facing 命令清单段"；`COMMANDS.md` 相应调整。`test_diagnostic_recovery_handoff.mjs` 不动。
- **D（纯文档）**：删除 `BOOTSTRAP.md` 建仓即空置的 "Runtime check map" heading 骨架（全库零引用），换两行指向 `ppt_flow doctor` / `environment-check` 唯一权威的指针。
- **E（纯文档）**：四处依赖清单统一加"完整清单以 `package.json` 为唯一权威"指针句；根 `AGENTS.md` 与 `openspec/config.yaml` 口径对齐为运行时核心五项。
- **F（文档 + 测试）**：按 one-fact-one-home 归属清单收敛"framed|pure 选择 + `production_identity.by_version` + hard-stop"事实的完整复述（规范 home + 至多一处流程投影保留，其余改指针），并把归属固化进 `test_process_docs_consistency.mjs` 断言。若归属清单暴露 requirement 级行为变化，按批准的拆分条件把 F 拆出独立 change。

**不改变**：任何生产管线运行时行为、CLI 命令清单、run-bundle 目录契约、gate 分类。本 change 全部是 Harness maintenance（文档行文、扫描器分类豁免、事实归属收敛）。

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `production-schema-conformance`: "Active production surfaces have no retired protocol residue" requirement 增加 token 内部标识符（如 kebab-case 命令名中的 `-vN`）不属于数字协议身份的分类边界与对应场景；扫描行为从"误报 9 处"变为"精确匹配规范自身的 structural-vs-protocol 区分"。
- `run-bundle-management`: unproduced-v1 reset 相关两个场景的行文把裸 `v1` 锚定为 `3_versions/v1` 结构记法；requirement 行为不变。
- `slide-identity-and-ordering`: owner reset 相关场景同样锚定；requirement 行为不变。
- `cli-surface`: paginate initial-draft 场景的行文锚定；requirement 行为不变。
- `commands-reference`: Common Requests 新手表的词汇边界 requirement 修改——新手行以 Deck-Author 词汇表述，精确命令名的规范保存位置改为同文件 Agent-facing 命令清单段。

## Impact

- **受影响 Harness 源码范围**：`ppt_maker_harness/`（`scripts/contracts/harness_architecture.mjs`、`COMMANDS.md`、`BOOTSTRAP.md`、charter 相关注释性文档）、`openspec/`（5 个 delta + 上述 main specs 同步）、`tests/`（focused negative tests + docs-consistency 断言）。`tests_e2e/` 不涉及。
- **Control owner**：JS（`harness_architecture.mjs` 扫描分类）+ MD（guidance 文档行文）+ spec（5 个 capability 的 delta）。无 MD⇔JS protocol 变化。
- **Run-bundle contract impact**：`none`（不触碰 run-bundle 目录、source/state 契约、gate 或 CLI 行为）。
- **政策合规**：
  - `simple-reliable-control.md`：本 change 的净简化为**删除**——豁免消除 9 处假阳性失败，C1 消除一对互相矛盾的权威，F 删除 ≥8 处重复事实复述；不新增任何 blocking rule、state 字段或 fallback。唯一分类边界收紧（token 豁免）有 focused negative test 证明不放走真退役标识。
  - `agent-assistance-and-control.md`：直接权威不变——specs 拥有行为、JS sweep 只是仓库验证执行者、`ppt_flow doctor`/`environment-check` 继续独占运行时检查事实。人类决定已全部在批准的 plan 基线中做出；apply 阶段全部是 Agent 机械工作。
  - `human-centered-gates.md`：无 gate 分类变化。sweep 仍是 repository verification（既有 requirement 已禁止其进入生产启动路径）。
