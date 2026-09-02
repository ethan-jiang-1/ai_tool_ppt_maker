# Plan: sweep 红灯修复与 guidance 文档权威收敛

> 类型: 设计 | 更新: 2026-09-01
> 触发: `npm run test:sweep` 2 failed / 699 passed（`npm test` core 档全绿，绿灯掩盖了问题）
> 状态: 已批准（2026-09-01）并**执行完毕**。唯一 change `sweep-green-and-guidance-authority` 已落地：sweep 702/702 全绿（原 2 个确定性红测试修复），5 个决定按基线采纳（依赖枚举按 import 事实修正为六项，见 change design 附录），apply 前过 polish，F 未触发拆分条件。

---

## 背景 / 现状

### 红灯事实

| # | 失败测试 | 根因 |
|---|---------|------|
| 1 | `tests/contracts/test_production_schema_conformance.mjs` › "accepts the synchronized repository active surface" | 活跃面 residue 扫描报 9 处 `retired-numeric-protocol-identity` |
| 2 | `tests/contracts/test_diagnostic_recovery_handoff.mjs` › "keeps novice and Controller surfaces anchored to the canonical handoff" | `COMMANDS.md` 的 Common Requests 段落出现 `ppt_flow`（禁词表：`JSON / diagnostic. / stderr / ppt_flow / node / --flag`） |

时间线（git 取证）：residue 规则由 `2026-08-14-retire-historical-protocol-surfaces`（commit `5bfcd26`）落地；被标记的内容全部在 **08-20 之后**进入（`reset-unproduced-v1` owner，BUG-081，commit `03a7d48`）。即：**规则落地时是绿的，后续 change 没跑 sweep，漂移未被发现**。core 档（`npm test`，仅 2 个测试文件、940ms）不含这两项，所以日常验证给的是假绿灯。

### 红灯 1 的 9 处标记与逐条裁决

规则机制（`harness_architecture.mjs:547-593,716-726`）：一行文本若含生产角色词（source/state/receipt/plan/evidence/route/adapter/candidate/acceptance）**且不匹配任何结构化版本形态**（`3_versions/vN`、`vN/` 目录、`run_version` 字段等），则该行内一切裸 `vN` 判为退役数字协议标识。规范锚点：`production-schema-conformance/spec.md:269-331`，其中 288-293 明确要求 sweep 区分"owning run-bundle/version contract 的结构记法"与"协议身份"。

| 位置 | 内容 | 裁决 |
|------|------|------|
| `scripts/shared/cli/command_result.mjs:80` | 注册命令名 `"reset-unproduced-v1"`（行内恰有 "receipt"） | **扫描器盲区**：token 内部的 `-v1` 是命令名，不是数字身份。规范本身豁免"JavaScript export 语法"，同为代码 token，应同类豁免 |
| `tests/shared/cli/test_process_cli_error.mjs:372` | 同一命令名出现在数组里 | 同上 |
| `openspec/specs/cli-surface/spec.md:1253` | "later `paginate plan` of a new candidate against that v1" | **owning contract 的结构记法散文**：v1 = Work Version，非协议身份。规范 288-293 说这种用法 SHALL 被接受，但扫描器认不出无 `3_versions/` 前缀的散文形态 |
| `openspec/specs/run-bundle-management/spec.md:473` | "unique v1 has a resolvable identity, local source-bound evidence" | 同上 |
| `openspec/specs/run-bundle-management/spec.md:483` | "v1 source, State, and derived trees remain byte-identical" | 同上 |
| `openspec/specs/slide-identity-and-ordering/spec.md:249` | "rebuildable local v1 evidence" | 同上 |
| `openspec/specs/slide-identity-and-ordering/spec.md:252` | "unique v1 has already received its first page source" | 同上 |
| `openspec/specs/slide-identity-and-ordering/spec.md:255` | "a later confirmed page plan MAY materialize in that same v1" | 同上 |
| `ppt_maker_harness/COMMANDS.md:19` | "still only v1 … a new page plan as v1"（新手表） | 面向人的散文，裸 vN + "plan" 角色词耦合；改写为无版本 token 的表述即可 |

### 红灯 2 背后是 spec↔test 真矛盾（本 plan 最重要的新发现）

- `openspec/specs/commands-reference/spec.md:267` **要求** COMMANDS.md 的 "Which image channel is working?" 行写明 `probe-image-channels` / `ppt_flow probe <run-dir>`（规范字面锁定）。
- `test_diagnostic_recovery_handoff.mjs:95` **禁止** Common Requests→What Stays Safe 区间出现 `ppt_flow`（该行恰在此区间，禁词命中处 `COMMANDS.md` 第 20 行区域）。

两个权威直接冲突，不可能同时满足。按 CONTEXT.md "Normative Harness Specification" 条款：矛盾必须显式裁决，不许静默选边。**需要 owner 拍板**（见决策 C）。

### 连带确认的次要事实

- `AGENTS.md:52` 把 `npm test` 标注为"跑回归测试"，违反 `cli-surface/spec.md:105-121`（core 档不得暗示完整回归）。全库唯一一处违规措辞。
- `BOOTSTRAP.md:74-92` "Runtime check map" 是建仓当天（`437e696`，08-06）就空着的 heading 骨架（含已退役的 `page_authority_raw_generator` 等条目），全库零引用。运行时检查的唯一权威本就是 `ppt_flow doctor` + `environment-check` capability。
- 依赖清单四处四个版本：`AGENTS.md:23`（3 个）、`README.md:82`（3 个）、`CONSTITUTION.md:23`（4 个）、`openspec/config.yaml:64`（5 个，且已声明"由 package.json 声明"）；`package.json` 实际 9 个。无任何测试锁定这些清单。

---

## 决策 / 方案

总体顺序：**先让 sweep 变绿（A–E），再做文档收敛（F）**。F 是行为性重构，必须在绿灯基线上做。

### A. 根 AGENTS.md 验证词表修正（纯文档，无需 delta）

`AGENTS.md:52`：`| 跑回归测试 | npm test |` → `| 跑受保护核心验证（bounded core，非全量回归） | npm test |`。
依据：对既有 `cli-surface` requirement 的合规化，不是 requirement 级行为变化。
验证：`npm test` + 相关 docs 测试。

### B. residue 误报：扫描器加一条豁免 + 6 处规范行锚定改写

1. **扫描器**（`harness_architecture.mjs` 匹配环内）：对 `ACTIVE_SURFACE_NUMERIC_VERSION` 命中位，若其前一字符为 `[\w-]`（即 vN 是更长 token 的内部片段，如 `reset-unproduced-v1`），跳过。语义：命令名/标识符不是数字协议身份。
2. **规范散文锚定**：上述 6 处 spec 行把裸 `v1` 改为结构化形态 `3_versions/v1`（或等效复写避免角色词+裸 vN 同行）。这与规范 288-293 的"owning contract 结构记法"完全一致，不改任何行为语义。
3. **COMMANDS.md:19**：改为不依赖裸版本 token 的新手表述（如"确认该版本仍只有第一版结构、无任何生成图或 PPTX"），语义对齐 run-bundle-management 的 unproduced-v1 reset 场景。

必须走 OpenSpec change：含 4 个 capability 的 delta——`production-schema-conformance`（豁免规则 + 一个 focused 场景：token 内 `-vN` 接受、裸 "vN protocol" 仍拒绝）、`run-bundle-management`、`slide-identity-and-ordering`、`cli-surface`（各 MODIFIED 对应 requirement 的行文，语义不变）。

### C. Common Requests ↔ commands-reference 矛盾裁决（已按 C1 采纳）

- **方案 C1（推荐）**：新手表保持 Deck-Author 词汇（不知任何命令名是设计原则，见 CONTEXT.md "Deck Author"），`commands-reference` delta 把第 267 行的字面要求改为"该行以 Deck-Author 词汇描述确认/发现两条路径，精确命令名保存在同文件 Agent-facing 命令清单段"。COMMANDS.md 的命令清单段（Common Requests 区间之外）保留 `ppt_flow probe <run-dir>` 等精确命令。测试不动即绿。
- 方案 C2：放宽 diagnostic 测试禁词表允许 fenced 命令名。不推荐——削弱"作者无需学 CLI 词汇"的规范意图，且禁词表会开始积豁免。

### D. 删除 BOOTSTRAP 空 "Runtime check map"

删除 74-92 行空 heading，替换为两行指针："运行时检查的唯一权威是 `ppt_flow doctor` / `environment-check` capability；本文件不复刻检查清单"。理由：填充即制造第二事实源（违反 one-fact-one-home）；该段全库零引用；测试锁定的 `Reserved Header Region` / `Provider Avoidance Constraint` 字符串不受影响。无需 delta。

### E. 依赖清单统一权威

四处清单各自保留"运行时核心"短列举，但统一加一句"完整依赖清单以 `package.json` 为唯一权威"；根 `AGENTS.md:23` 与 `config.yaml` 的枚举补齐到一致口径（核心五项：`@napi-rs/canvas`、`pptxgenjs`、`commander`、`yaml`、`playwright`）。`CONSTITUTION.md`/`README.md` 同样加指针句。无需 delta，无测试锁定。

### F. 核心规则收敛到单一权威（最大项，独立 change，最后做）

规范锚点恰好是 `harness-charter/spec.md:491-495`（"Root AGENTS.md content is not duplicated"——one-fact-one-home 本来就是规范要求，收敛是合规化而非风格偏好）。

方法：先做**事实归属清单**（不是盲删）。以"framed|pure 选择 + `production_identity.by_version` + hard-stop"为例，当前散布于：root `AGENTS.md`、`ppt_maker_harness/AGENTS.md`、`ppt_maker_harness/CLAUDE.md`（redirect）、`BOOTSTRAP.md`、`AGENT_CONTRACT.md`、`NODE-SPEC.md`、`CONTEXT.md`、`openspec/config.yaml`、`workflow/README.md`、`06-iteration/README.md` 及多个 main spec。分配原则：

| 角色 | 允许持有完整事实 | 其余位置 |
|------|----------------|----------|
| 规范 home | owning main spec（行为） | — |
| 流程投影 | `AGENT_CONTRACT.md` / `BOOTSTRAP.md`（各最多一处紧凑表述） | — |
| 入口摘要 | root `AGENTS.md` 保留一条 bullet（触发词 + 指针） | 指向 home 的链接 |
| redirect/symlink | `CLAUDE.md` 类自动加载文件豁免 | — |

实施后把归属清单固化进 `test_process_docs_consistency.mjs`（非 home 文件断言不含完整规则文本、含指针），防止再次漂移。注意已知锁定字符串：`AGENT_CONTRACT.md` 的 `receipt-bound Framed Page\nImage finalization`（精确换行）、BOOTSTRAP 必含两个 header 术语、`validateDiagnosticAuthorityPointers` 的五个文件指针、`validateDocumentedCommands` 会对文档中 `node ppt_flow.mjs …` 示例做真实 flag 校验。

---

## 已采纳的决定基线（owner 批准，2026-09-01）

1. B 扫描器豁免口径：token 内部 `-vN`（前一字符为 `[\w-]`）跳过，focused negative test 锁边界；
2. C 采用 C1：新手表保持 Deck-Author 词汇，精确命令名移到 COMMANDS.md 的 Agent-facing 命令清单段，改 `commands-reference` delta；
3. D 删段留指针，不填充；
4. E "运行时核心五项"（`@napi-rs/canvas`、`pptxgenjs`、`commander`、`yaml`、`playwright`）+ package.json 唯一权威指针句；
5. F 并入单 change 的 Stage 3 内执行（不再独立立项）；仅当归属清单暴露 requirement 级行为变化时按记录的拆分条件重议。

polish pass 若给出与上述基线相反的证据，停下来回报 owner，不静默改基线。

## 风险 / 取舍

- [扫描器豁免过宽]（`-vN` token 内部豁免可能放过散文连字用法）→ 豁免仅限前一字符为 `[\w-]` 的命中 + focused negative test（构造 "the v1 protocol" 必须仍被拒）。
- [规范行文改写走样] → 只做同义锚定改写，每处 diff 附原文对照；`openspec strict validation` 必过。
- [C 方案裁决错向] → C2 会积累禁词豁免、背离 Deck Author 原则；若 owner 选 C2，则 commands-reference 不动、只改测试并在 plan 记录理由。
- [F 破坏自动加载引导价值] → 入口文档（root AGENTS.md / BOOTSTRAP）的紧凑投影是刻意的 agent 冗余，保留；只收"多处完整复述"，不收"入口摘要"。
- [A–E 期间又有人往 sweep 塞新违规] → 实施前先跑一次基线确认仍只有这 2 个失败；建议后续把 sweep 挂进 core 后的周期性验证（不在本 plan 范围内展开）。

## 落地关联

**收敛为单个 OpenSpec change：`sweep-green-and-guidance-authority`**（名称可在 proposal 阶段微调）。

- 为什么单 change：A–F 全部是 Harness maintenance（文档行文、扫描器豁免、规范行文锚定、事实归属收敛），**没有任何生产管线运行时行为变化**；拆分只会让 proposal/design/deltas/polish/apply/archive 的固定代价翻倍。change 数量最小化是 owner 明确要求。
- deltas 清单：`production-schema-conformance`（B 的扫描器豁免 + focused 场景）、`run-bundle-management`、`slide-identity-and-ordering`、`cli-surface`（B 的行文锚定，语义不变）、`commands-reference`（C1：新手表去命令名、精确命令移到 Agent-facing 清单段）。`harness-charter` 仅当 F 的归属清单显示存在 requirement 级缺口时才加 delta（预期不需要：one-fact-one-home 已在 `spec.md:491-495`）。
- 唯一拆分条件（记录在案的决定点，非默认）：F 的归属清单若在 polish 或实施中暴露出超出"归属收敛"的 requirement 级行为变化，则把 F 拆为独立 change，其余照常落地。
- change 内部 tasks 按 Stage 分组（见下节），依赖有序，供逐项 tracking。

## Progressive 执行计划与跟踪清单

plan 层跟踪 Stage 级进度；每个 Stage 的 exit criteria 达成才进下一个。change 落地后，tasks.md 持有细粒度 checkitem，本清单只勾 Stage。

### Stage 0 — 基线确认

- [x] 重跑 `npm run test:sweep`，确认仍恰好只有这 2 个失败（防实施期间又有新漂移混入）
- [x] 记录失败清单与本次 plan 的裁决表一致（9 处 residue + 1 处禁词）

### Stage 1 — 唯一 change 的提案（openspec-propose）

- [x] 用 `openspec-propose` 生成 `openspec/changes/sweep-green-and-guidance-authority/` 全套 artifacts（proposal / design / deltas / tasks / verification-plan，以 `openspec status` 的 artifact graph 为准）
- [x] proposal 含 WHY（sweep 假绿灯、08-14 规则 08-20 漂移时间线）、范围边界（无生产运行时行为变化）、单 change 收敛理由、F 拆分条件
- [x] design 记录各侧所有权（JS 扫描器 / MD 文档 / spec 行文）与验证策略（unit focused negative + docs tests + sweep）
- [x] tasks.md 按 Stage 3 的 A→F 分组、依赖有序、每项有 done 判据

### Stage 2 — polish gate（apply 前强制，不可跳过）

- [x] 运行 `/polish-openspec-change sweep-green-and-guidance-authority`
- [x] 至少两轮独立 pass：第一轮 whole-change coherence（requirement→design→tasks→verification 可追踪、术语/不变量跨 artifact 一致）；第二轮 risk-led（最高风险项：扫描器豁免误伤面、C1 对 spec 字面的改动完整性、F 归属清单的越界）
- [x] 所有 finding 按三类处置完毕（事实性修正当场改 / 可调查项查证后改 / 真决定项停下问 owner）
- [x] `openspec validate "<name>" --strict` 通过
- [x] `git diff --check` 干净
- [x] 项目受保护基线 `npm test` 绿；`openspec validate --all --strict` 通过
- [x] 结论为 `ready for apply` 才解锁 Stage 3；若 `not ready`，停在未决项回报 owner

### Stage 3 — apply（openspec-apply-change，按 tasks 顺序）

- [x] A：根 AGENTS.md:52 验证词表修正
- [x] B：扫描器 token 内 `-vN` 豁免 + focused negative test（裸 "v1 protocol" 必须仍被拒）
- [x] B：6 处规范行锚定改写（run-bundle-management:473,483；slide-identity:249,252,255；cli-surface:1253）
- [x] B：COMMANDS.md:19 新手表述改写
- [x] C：commands-reference:267 字面按 C1 修改 + COMMANDS.md 命令清单段承接精确命令名
- [x] D：BOOTSTRAP 删空 Runtime check map，换两行权威指针
- [x] E：四处依赖清单加"package.json 唯一权威"指针句，根 AGENTS.md 与 config.yaml 口径对齐核心五项
- [x] F：产出事实归属清单（"workflow 选择 + production_identity + hard-stop"全实例盘点）→ 按 home/投影/指针分类改写 → 固化进 docs-consistency 测试断言
- [x] 每完成一项勾 tasks.md 对应 checkitem（progressive tracking）

### Stage 4 — 收口

- [x] `npm run test:sweep` 701/701 全绿（两个原红测试转绿且无新增失败）
- [x] `npm test`（core）绿
- [x] `openspec validate --all --strict` 通过
- [x] change archive：`openspec/archive` 流程 + 按仓库规矩更新 `_backlog/plans/` 与 `_done/` 簿记，本 plan 关闭
