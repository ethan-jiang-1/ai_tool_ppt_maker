# Plan: 当前层旧痕迹深度审计（current-layer legacy-trace audit）

> 类型: 分析/审计 | 更新: 2026-08-16 | 状态: Change 1 已 archive（spec + 文档 + CONTEXT 对齐），残留映射为 3 个串行 change（2 个 QUEUED）+ 1 个 deck 工作流
> 当前下一步: 启动 Change 2 `remove-retired-plumbing-and-harden-detectors`（见文末 Progress Tracker）
> 审计日期: 2026-08-16 | 基准: `npm test` core 全绿（exit 0）| 方法: 7 路只读子代理 + 主 Agent 独立复核 | 写操作: 零（全程只读，未改任何文件）

## 一句话

重构的大退役**基本完成**——`production-mode`、`page-authority` 旧版、`html-first`、`Protected Zone` 字段在实现层、schema 字段层、测试层已清零；但当前层仍有两类残留：**(1) 退役词以散文形式回流**（最广的是 `protected geometry`，17 个文件 20 处），**(2) 权威 mirror 漂移**（spec↔CLI 真相、schema↔代码、文档↔文件系统）。共约 45 条独立 finding，3 条 high（P0）。

---

## 背景：为什么做这次审计

用户明确划定的判断边界：

1. **归档 change 是过去式**——`openspec/changes/archive/` 下 70+ 个已归档 change 的内容不读、不评、不动；旧痕迹留在归档里没问题。
2. **「新的一层」里不该再有旧痕迹**——审计对象是当前层：`openspec/specs/` 的 27 个 main specs（审计时**无任何 active change**，changes 下只有 archive）+ `ppt_maker_harness/` 现行文档/playbook/schema/代码 + `tests/` + `tests_e2e/` + 当前 deck bundle `deck_ai_sdlc_keynote`。

因此本次审计**不是找「提到历史的地方」**，而是找「**新层仍把退役的东西当现行用**」——这种残留会误导后续 Agent/人走到不存在的东西或错误的分支。审计本身零写入，纯盘点。

## 方法学：为什么这样分析（他人复现分析所需的一切）

### 权威链（判断「新 vs 旧」的依据）

| 判断面 | 权威源 | 用于判定 |
|---|---|---|
| 术语 | `CONTEXT.md`（每个术语带定义 + `_Avoid_`） | `protected zone`/`protected geometry`/`mode` 等是否为旧名 |
| 行为 | `openspec/specs/<capability>/spec.md` | spec 正文是否把退役行为描述为现行 |
| 过程 | `playbook/controller-manifest.json` + `charter/NODE-SPEC.md`（closed grammar） | node 名 / controller 元数据是否合法 |
| 目录 | `scripts/shared/run-bundle/bundle_layout.mjs` | 文件路径是否真实存在（如 `page-image-visual-language.yaml` vs 退役的 `page-authority-*`） |
| CLI 真相 | 实际运行 `ppt_flow.mjs` 及子命令 `--help`（纯本地） | flag 是否存在（如 `--check-gates`） |
| 项目自认退役 | `scripts/contracts/harness_architecture.mjs` + `harness_coherence.mjs` 的 retired 词表/规则 | 强信号词表（项目自己承认的退役词汇） |

### 退役词汇表（强信号，来自归档 change 名 + 两个探测器）

- **退役路径**：`scripts/lib/`、`04-image-production/`、`05-iteration/`（现行编号 owner 是 `00-setup…06-iteration`）
- **退役 CLI**：`build` 的 `--resolution/--model/--base-url/--reuse-images/--dry-run/--force/--reason`；`env-check`/`doctor` 的 `--image2`；`--mode`；`legacy-outline`
- **退役 controller metadata**：`phase`、`lifecycle_phase`、`supported_production_modes`、旧 node id（`authoring-slides`/`seed-topics` 等）
- **退役编辑路径**：Chain A/B/C（规范名 = Header Text & Style Refresh / Generated Image Rebuild / Notes-Only Refresh / Structural Versioning Path）
- **退役概念名**：`production-mode`、`page-authority` 旧版、`html-first`、`full-page-prose`、`Protected Zone`（旧实现名；规范名 = Reserved Header Region / Provider Avoidance Constraint）、`protected_geometry` 字段（规范 = `protected_composition`）
- **退役恢复动词**：`export`（现行 = `repair-current-protocol-identity`）

### 判定边界（什么**不算** finding）

- 描述「如何处理退役输入/拒绝退役输入」的 scenario（如 `WHEN a legacy bundle is presented…`）→ 是正确行为，不报。
- 归档 change 内容本身 → 完全不读。
- deck 的 `_generated/`、`_scratch/`、二进制图片 → 不审计（可重建派生品）。
- deck 里 `page-image-workflow-iterations/`、`page-image-style-master-iterations/` → 名字带 "iterations" 但**不是旧痕迹**：是现行协议的活动 staging，其 `head.json` 的 `plan_sha256` 与 `_state/state.yaml` 完全一致，已核实不报。

### 验证纪律

- 每条文件路径用 `test -f` 验证；每个 flag 对照实际 `--help` 输出；每个 node 名对照 `controller-manifest.json`；每个术语对照 `CONTEXT.md`。
- 主 Agent 对全部 P0 级 finding 做了独立 grep 复核（证据均已再次命中）。
- 行号均为 **2026-08-16 工作树**；后续行号失效时以「路径 + 符号名」复核。
- 未读 `_backlog/`（除 plans 惯例）、`dpt_*/`、`openspec/changes/archive/` 内容。

### 覆盖范围（7 路审计）

| 路 | 范围 | 规模 | findings |
|---|---|---|---|
| specs A | 14 个 main spec（bootstrap-env-guidance … slide-identity-and-ordering） | ~6.6k 行 | 7 |
| specs B | 12 个 main spec（environment-check … workflow-inspection） | ~3.5k 行 | 5 |
| docs | 根 + harness 全部现行 `.md`（charter/playbook/reference/workflow/scripts） | ~5.3k 行 | 7 |
| code | `ppt_maker_harness/scripts/**/*.mjs` | ~42k 行 | 10 |
| schema | `ppt_maker_harness/schema/**/*.yaml` | ~1.8k 行 | 11 |
| tests | `tests/` + `tests_e2e/` | ~33k 行 | 3 |
| deck | `deck_ai_sdlc_keynote` 文本文件（md/yaml/json） | — | 13 |

---

## 总览：分层结论

| 层 | 结论 |
|---|---|
| 实现层 | **最干净**：无断链 import、无退役路径引用、18 个 `schema:` 字面量全部在 schema/ 有声明、`production_mode`/`supported_production_modes` 绝迹。残留集中在 `ppt_flow.mjs`/`env_check.mjs` 的死代码与隐藏别名。 |
| 规范层 | **最需要修**：`node-specification` 是重灾区（H-1、H-2、mode 残留 ×9、旧消费者信封）；另 5 个 spec 有 `protected geometry` 散文。 |
| 文档层 | 术语回流为主（`protected geometry` ×17 文件）+ 少量陈旧路径/文件名。 |
| schema 层 | 退役字段绝迹；问题转为 **schema↔代码 mirror 漂移**（漏 6 个活跃 state 键、4 个孤儿 wire-schema 值）。 |
| tests 层 | 非常干净：退役词命中几乎全是「正确断言退役面被拒绝」；仅 2 处死指针/死分支 + 1 处措辞。 |
| deck 层 | **协议层干净**（state.yaml 与 NODE-SPEC 合约逐字一致）；**文档层脏**（H-3 内容自相矛盾 + 8 条导航陈旧引用 + 孤儿产物）。 |

---

## 优先级总表

| 优先级 | 编号 | 主题 | 位置（摘要） | 建议落点 |
|---|---|---|---|---|
| **P0** | H-1 | 退役文件当现行路径 | `node-specification/spec.md:96` | Wave 1 |
| **P0** | H-2 | 不存在的 flag 当现行入口 | `node-specification/spec.md:353`（+ `state.mjs:69` 注释） | Wave 1 |
| **P0** | H-3 | 当前 deck 内容自相矛盾（具名 Agent） | `deck v8 README:10` vs 源/注册表 | Wave 5（需 deck owner 决策） |
| **P1** | M-1 | `protected geometry` 退役别名回流（17 文件 20 处） | 9 文档 + 6 spec | Wave 1+4 |
| **P1** | M-2 | `protected zone` 旧名 + CONTEXT 反向过期 | 3 spec + `CONTEXT.md:218-221` | Wave 1 |
| **P1** | M-3 | `mode`/`durable mode` 概念残留 | node-specification ×9 + playbook-execution ×2 + environment-check | Wave 1 |
| **P1** | M-4 | 旧消费者信封（branch on code） | `node-specification:385-393`（与自身 :655 矛盾） | Wave 1 |
| **P1** | M-5 | `ppt_flow`/`env-check` 死代码与隐藏别名 | `ppt_flow.mjs` ×5 + `env_check.mjs` ×2 | Wave 2 |
| **P1** | M-6 | schema↔代码 mirror 漂移 | `serialization-contracts.yaml` 漏 6 键 + 4 孤儿值 | Wave 3 |
| **P1** | M-7 | 测试账本死指针 / 死分支 | `harness-governance-ledger.json:36`、`test_harness_architecture.mjs:61` | Wave 2 |
| **P1** | M-8 | 文档陈旧路径/退役词 | `workflow/00-setup/README.md`、`glossary.md:59`、page-authority 文件名 | Wave 4 |
| **P1** | M-9 | spec 内部双重定义/措辞冲突 | Complete Page Review 双重定义、workflow-inspection vs visual-config | Wave 1 |
| **P2** | L-1 | schema 层低危组（9 条） | flow.yaml/META.yaml/serialization-contracts.yaml | Wave 3 |
| **P2** | L-2 | 文档低危组（4 条） | scripts/README.md:36、CLAUDE.md:20、ADR 0001、示例 node 名 | Wave 4 |
| **P2** | L-3 | 测试措辞残留 | `workflow-control-ledger.json:32` | Wave 2 |
| **P2** | L-4 | deck 导航陈旧引用（8 条） | backbone README ×3、PPTMAKER_FRAMEWORK ×4 文件、scripts/lib/state.mjs 等 | Wave 5 |
| **P2** | L-5 | deck 孤儿产物 | `MIGRATION.md`、3 个散落 style-master 旧文件 | Wave 5 |
| **P3** | D-1..3 | 元发现：现有探测器缺口 | 词表缺口、import 断链静默、ledger source 不 resolve | Wave 2 |

---

## 吸收状态（2026-08-16 更新）

`cli-diagnostic-faithful-passthrough` 路线图（已归档 CLS-038）吸收了本审计的 7 项 finding；
剩余 finding 映射为新的串行 OpenSpec change 队列。

### 已解决（7 项，附 change）

| finding | 解决方 |
|---|---|
| H-1 退役文件当现行路径 | Change 1：node-specification "ctx parameter provides run bundle paths to conditions" MODIFIED + guard 防回流 |
| H-2 不存在的 `--check-gates` | Change 3：node-specification R18 MODIFIED + `state.mjs:69` 注释 |
| M-3（触及范围：R18 "infer mode"） | Change 3 |
| M-4 旧消费者信封 | Change 1：node-specification "CLI ⇔ MD failure protocol" MODIFIED |
| M-5 #6 `assembly-notes` | Change 2：从 `PAGE_IMAGE_DOCTOR_OPERATIONS` + doctor `--help` 移除（含本次补修的 `ppt_flow.mjs:3552` help 文本） |
| M-5 #7 `image2-raw` operation 别名 | Change 2：operation 名统一 `raw-generation` |
| D-1（部分：退役 VL 路径 / 旧 consumer 合同 / 第二归因器） | Change 1：`harness_architecture.mjs` 3 类定向 guard（planted violation 证明） |

> 复核（2026-08-16）：H-1 的 5 处 `page-authority-visual-language` 命中现全部为合法语境
> （禁止句 + guard 模式/测试），无"当现行用"残留；M-4 的 `branch on code` 清零；
> `--check-gates` 只剩禁止句；`assembly-notes` 在 scripts/ 清零。

### 残留（按能否用 OpenSpec 推进分组）

| Wave | finding | OpenSpec 可行 | 建议 change（串行） |
|---|---|---|---|
| 1 | M-1（spec 6 文件 + 文档 11 文件）、M-2（3 spec + CONTEXT 反向修正）、M-3（剩余：node-specification ×9 + playbook-execution ×2 + environment-check 组织轴）、M-8、M-9、L-2 | ✅ | `align-current-layer-terminology`（spec 权威 + 文档镜像同 change 完成） |
| 2 | M-5 #1-5（build plumbing 死代码）、M-5 #7 收尾（`image2-raw` profile 展示名）、M-7、L-3、D-1（剩余词表）、D-2、D-3、D-4 | ✅ | `remove-retired-plumbing-and-harden-detectors` |
| 3 | M-6（6 键 + 4 孤儿值）、L-1（9 条） | ✅ | `align-serialization-schema-mirror` |
| 5 | H-3、L-4、L-5 | ❌ deck 生产数据 | 走 deck 工作流（见下） |

### 结论：残留能否全部用 OpenSpec 推进？

- **Wave 1–4 可以**——都是 Harness maintenance，落入 `openspec/specs/`、`ppt_maker_harness/`
  文档/代码、`schema/`、`tests/` 四个源码域；用 **3 个串行 change**（Wave 1+4 合并为术语统一；
  同一时间一个 active change，每个独立终态 + 验证 + 防回归，archive 后才启动下一个）即可
  全部解决。3 个是当前质量不下降的最小数量：文字面（术语）、代码面（死代码+探测器）、
  声明面（schema mirror）各有独立验证面，进一步合并会让单个 change 过大。
- **Wave 5 不能**——H-3 / L-4 / L-5 是 deck 生产数据（`deck_ai_sdlc_keynote`），不在 OpenSpec
  的 Harness maintenance 范围：H-3 是 Deck Author 的内容决策（摘除具名人格 vs 改声明），
  Agent 只能提选项；L-4 / L-5 是需 deck owner 授权范围的机械清理。

---

## P0 — High 级（3 条：会让 Agent 走错路或权威自相矛盾）

### H-1 [P0] node-specification 把退役文件写成现行路径

- **位置**：`openspec/specs/node-specification/spec.md:96`
- **证据**：
  > `- **AND** visual-language readiness checks \`join(deckDir, '2_backbone/visual-style/page-authority-visual-language.yaml')\``
- **为什么判定为旧痕迹**：`page-authority` 是退役概念族（全仓库现行层已无此串）；当前真实文件是 `page-image-visual-language.yaml`，目录权威 `bundle_layout.mjs:224`（`PAGE_IMAGE_VISUAL_LANGUAGE_FILE`）。该 scenario 把不存在的路径写成 readiness 检查的当前结果——Agent 按它走会解析一个不存在的文件。另外 `join(deckDir, ...)` 字符串拼路径的写法本身也是退役风格（现行一律走 `bundle_layout.mjs` 常量）。
- **影响**：node-specification 是权威性最高的 spec 之一；agent 读它会被引导到错误文件。
- **修复建议**：改为 `page-image-visual-language.yaml`，且 readiness 检查表述引用 `bundle_layout.mjs` 的路径常量而非拼字符串。
- **验证状态**：子代理报告 + 主 Agent grep 复核命中（`node-specification/spec.md:96`）。

### H-2 [P0] node-specification 把不存在的 flag `--check-gates` 写成现行入口

- **位置**：`openspec/specs/node-specification/spec.md:353`；同款过时注释残留在 `scripts/shared/state/state.mjs:69`（`[--json|--check-gates]`）
- **证据**：
  > `ppt_flow state <runDir>, --json, and --check-gates SHALL remain observation-first operations. They SHALL resolve … and call readState …`（同一句还有 "it does not seed state, **infer mode**, select a Controller"）
- **为什么判定为旧痕迹**：CLI 真相（`ppt_flow.mjs:3667-3669` 与实际 `--help`）显示 `state` 的现行 option 只有 `--json`、`--validate-state`、`--repair-known-execution-mismatch`，**没有 `--check-gates`**。把不存在的 flag 写成零写观察入口，会让 Agent/CLI 走错路；"infer mode" 同时是主题 M-3 的退役短语。
- **修复建议**：`--check-gates` → `--validate-state`（或删去）；"infer mode" → "infer workflow"；同步清理 `state.mjs:69` 注释。
- **验证状态**：子代理实测 `ppt_flow state --help` 确认无此 flag + 主 Agent grep 复核命中。

### H-3 [P0] 当前 deck v8 的 README 声明与源内容自相矛盾（具名 Agent 人格）

- **位置**：`deck_ai_sdlc_keynote/3_versions/v8/README.md:10` vs `3_versions/v8/slide-specifications.md:717`、`2_backbone/design-constraints.md:30`、`2_backbone/visual-style/assets/reference/amber-agent/image2-reference-material.yaml:17-40`
- **证据**：
  - README 声称：`不使用具名 Agent 人格（砚/铸/舵/核/察/算）…backbone 里 agent-portrayal.md / design-constraints.md 的具名人格规范在本版不生效`
  - 但当前源仍有：`slide-specifications.md:717` `**VISUAL IDENTITY**: amber-agent/duo`（舵）
  - 注册表 `amber-agent/image2-reference-material.yaml:17-40` 注册着 `yan/zhu/duo/he/cha/suan` 等 role
  - `design-constraints.md:30` 仍列具名人格
- **为什么判定为旧痕迹**：当前层（v8 = 活跃版本，`state.yaml`/`deck-guide.md`/lease 三方证实）里 README 与源、注册表、constraints 三处内容打架——「声明已摘除」与「实际还在用」同时成立，是本次审计唯一的内容级自相矛盾。
- **修复建议**：**这是 Deck Author 的内容决策，不能替人拍板**。两条路选一：① 真摘除——从 v8 源、amber-agent 注册表、design-constraints 移除具名人格（注意：改源会触发失效/重渲染路径，须按 owner 流程走）；② 改声明——把 README 改成如实描述当前仍用 amber-agent/duo。二者必选其一，否则「新的一层」的声明是空话。
- **验证状态**：子代理报告 + 主 Agent grep 复核命中（README:10 与 slide-specifications.md:717 均已实读确认）。

---

## P1 — Medium（9 个主题）

### M-1 [P1] `protected geometry` 退役别名回流 —— 面积最大的残留

- **位置（17 个文件，20 处，全部经 grep 复核）**：
  - **文档 11 个**：`charter/AGENT_CONTRACT.md:32`（与其自身 :14 的 "protected composition" **内部打架**）、`charter/WORKFLOW.md:30`、`reference/glossary.md:57`、`reference/anti-patterns.md:29`、`workflow/README.md:16`、`workflow/02-visual-system/README.md:36`、`workflow/03-framed-image/README.md:9`、`workflow/06-iteration/README.md:7-8`（行折叠）、`playbook/classify-change.md:34`、`playbook/edit-text.md:20`、`playbook/edit-visual.md:20`（连字符形 `protected-geometry`）
  - **spec 6 个**：`pipeline-orchestration:23,30,39`、`harness-charter:192`（`protected-geometry`）、`playbook-execution:348`、`cli-surface:362`、`workflow-inspection:73`（另 :69,74 相关语境）、`image-generation:319,940`、`visual-config:282`
- **证据（典型）**：
  > `Only when compiled provider input, protected geometry, raw contract, and local header profile remain exact.`（`AGENT_CONTRACT.md:32`）
- **为什么判定为旧痕迹**：`protected_geometry` 是**退役字段**（`schema/README.md:59-61` 明写 "former `protected_geometry` field"）；规范术语是 **`protected_composition`**（`CONTEXT.md:206` 列为 Reserved Header Region 的合法字面契约），探测器 `harness_architecture.mjs` 的 `framed-composition-legacy-geometry` 规则禁止当前 lineage 保留该字段。同一份 AGENT_CONTRACT 里 L14 用 "protected composition"、L32 用 "protected geometry"——新旧并存。
- **修复建议**：散文层面统一为 "protected composition"（四条件失效清单是重灾区）；**绝不改机器字段名**（`header_region`/`protected_composition`/`reserved_header`/`body_safe` 的序列化契约保持不变）。
- **验证状态**：主 Agent 全量 grep 复核：18 处精确命中 + 2 处变体（行折叠、连字符形）。

### M-2 [P1] `protected zone` 旧名 + CONTEXT.md 的「still uses」声明反向过期

- **位置**：`openspec/specs/harness-charter/spec.md:179`、`openspec/specs/visual-config/spec.md:296`、`openspec/specs/image-production/spec.md:84`；反向发现：`CONTEXT.md:218-221`
- **证据**：
  - `harness-charter:179`：`The Framed protected zone is a composition constraint, not a blank band or a text-free-page rule.`
  - `visual-config:296`：`- **AND** it does not derive a local profile, protected zone, or input digest from that record`
  - `image-production:84`：`- **AND** it does not expose Framed protected-zone, header-renderer, or …`（连字符旧形）
  - `CONTEXT.md:218-221`：`Protected Zone: The name Harness implementation still uses for a Provider Avoidance Constraint.`
- **为什么判定为旧痕迹**：3 个 spec 把旧名当现行主名词（且 visual-config 同文件 :319-327 自己要求用 Reserved Header Region / Provider Avoidance Constraint，内部矛盾）。**更反讽的是 CONTEXT.md 那句「实现仍在使用」已过期**：grep 证实 `ppt_maker_harness/` 实现里 `protected zone`/`protected_zone` **零命中**，实现早已全迁到 `reserved_header`/`body_safe`/`protected_composition`——现在是「实现干净、spec 散文脏」，术语权威自己也该更新。
- **修复建议**：3 个 spec 改为 "Reserved Header Region"（指本地空间）或 "Provider Avoidance Constraint"（指 provider 指令）；`CONTEXT.md:218-221` 改为「曾用旧名，现已不再使用；仅历史文档可见」。
- **验证状态**：子代理报告 + 主 Agent grep 复核（实现层零命中属实）。

### M-3 [P1] `mode`/`durable mode`/`source/mode pair` 概念残留

- **位置**：`node-specification/spec.md` :186,409,419,452,471,546,549,571,595-598（约 9 处）+ :353 "infer mode"；`playbook-execution/spec.md:54,57`；`environment-check/spec.md` 以 "Image2 mode / base mode" 为组织轴
- **证据（典型）**：
  > `source/mode pair SHALL never be transformed into a current state, mode, …`（:419）
  > `durable mode`（:409）
- **为什么判定为旧痕迹**：CONTEXT.md「Production Identity」的 `_Avoid_: Production mode`；`NODE-SPEC.md:23` 明确 retired `mode`/`production_modes` 声明直接 fail。现行持久概念是版本级 `production.workflow: framed|pure` + `production_identity.by_version`。environment-check 的 `--mode` 也已退役（现行 `--operation`）。
- **修复建议**：统一改写为 `selected workflow` / `source/workflow pair` / `durable workflow` / `production_identity`；environment-check 的组织轴改为 `--operation`。
- **验证状态**：主 Agent grep 复核命中 :409,419,452,471,546,571,598（+ :353）。

### M-4 [P1] node-specification 旧消费者信封（与自身 :655 自相矛盾）

- **位置**：`openspec/specs/node-specification/spec.md:385-393`
- **证据**：
  > `MD Controllers SHALL branch on code and surface message/hint to the user`（:387）… `uses code + hint to decide the next repair action`（:393）
- **为什么判定为旧痕迹**：现行信封控制权威是 `diagnostic.category` + `diagnostic.next`（`cli-surface`；`NODE-SPEC.md:59-63`）。本 spec 自己的 :655-656 已把顶层 `code`/`message`/`hint` 称为 "legacy summary"——**同一文件内新旧协议并存**。
- **修复建议**：:385-393 改为「consume `diagnostic.next`（含 `requires_human`）+ 四段式 Diagnostic Recovery Handoff」，与 :655 对齐。
- **附带（低危）**：示例 node 名 `authoring-slides`/`seed-topics`（:36,94,119-122,153-154,313-314,338-339）不在 controller-manifest.json——示意例应换成现行 node 名（如 `checkpoint-intake`）。

### M-5 [P1] `ppt_flow.mjs` / `env_check.mjs` 死代码与隐藏别名

| # | 位置 | 内容 | 判定 |
|---|---|---|---|
| 1 | `ppt_flow.mjs:905-912` | `commandPageImageBuild(route, { resolution, model, baseUrl, reuseImages, dryRun, force, reason, retiredControlsExplicit })` —— 8 个退役参数整体**不可达**：唯一调用链 `action(:3544-3556) → commandBuildWrapped(:1505) → commandBuild(:940)` 硬编码 null/false，且 `build` 命令未注册任何 `.option()`；`resolution`/`model` 解构后甚至未被引用 | 退役 build CLI 的完整 plumbing 残留 |
| 2 | `ppt_flow.mjs:189-192` | `validateResolution()` 全仓零调用（退役 `--resolution` 校验 helper） | 死代码 |
| 3 | `ppt_flow.mjs:726-731` | `commandDoctor({ image2 = false })` 的 `--image2` 拒绝分支不可达（调用方 :3474-3480 硬编码 `image2: false`，doctor 未注册该 flag，commander 会先拒） | 死代码（对照：`env_check.mjs:1047/1058` 的 `argv.includes('--image2')` 是**活拒绝**——正确模式，保留） |
| 4 | `ppt_flow.mjs:1505-1507` | `commandBuildWrapped` 空壳转发，仅为承载退役 8 字段而存在 | 死层 |
| 5 | `ppt_flow.mjs:938` | `commandBuild` JSDoc `@param {resolution, model, baseUrl, reuseImages, dryRun, force, reason}` 列 7 个退役字段却漏第 8 个 `retiredControlsExplicit` | 随 plumbing 一起删 |
| 6 | `env_check.mjs:55-60,999-1018` | `assembly-notes` 被 `PAGE_IMAGE_DOCTOR_OPERATIONS` 接受、`--help`（`ppt_flow.mjs:3457`）也列出，但 `pageImageDoctorPlan` 对 `framed-local-refresh/raw-generation/image2-raw/full-build` 有分支，`assembly-notes` 落兜底 `{profile:'common'}` —— **完全不查 pptxgenjs 装配与 notes 就绪**，会给出零针对性检查的 "READY" | 半成品操作 |
| 7 | `env_check.mjs:58,1011` | `image2-raw` 隐藏别名等价于 `raw-generation`，但两份 help 都不列它 | 重构前命名残留的静默别名 |

- **修复建议**：#1-#5 直接删参数/守卫/helper/空壳层；#6 补分支或从接受集合移除；#7 移除别名统一 `raw-generation`。

### M-6 [P1] schema↔代码 mirror 漂移

- **位置**：`ppt_maker_harness/schema/serialization-contracts.yaml:48-62`、`:274,285,350-351`；`scripts/shared/state/state.mjs:105-126`
- **证据**：
  1. `current_state_shape.required_top_level_fields` 声明 13 个键，anchor 指向 `state.mjs#STATE_TOP_LEVEL_KEYS`，该常量实有 **19** 个——漏 6 个活跃读写字段：`page_image_raw_provider_authorization`、`page_image_target_evidence`、`page_image_progressive_handoff`、`page_image_task_mandate`、`page_image_style_master`、`diagnostics`（state.mjs :590,:735,:908,:1233,:2328 均在用）。
  2. 4 个 wire-schema 值只有声明、全库无代码消费者：`page-image-provider-input`(:274)、`page-image-raw-contract`(:285)、`page-image-raw-manifest` + `pptmaker-page-image-raw-manifest`(:350-351)。尤其最后一个——`pptmaker-` + `page-image-` 两代命名杂交体，与 `page-image-raw-manifest` 并列同一物，典型过渡期残留。
- **为什么判定为旧痕迹/缺陷**：CONTEXT 定义「代码有、schema/ 没有 = defect」；production-schema-conformance spec §52-53 要求清单只声明有 live owner/consumer 的 active contract，§85-92 禁止 legacy alias/dual value。
- **修复建议**：补 6 键（或拆 required+allowed 两列与常量对齐）；删/标 4 个孤儿值。

### M-7 [P1] 测试账本死指针 / 死分支

- **位置**：`tests/contracts/harness-governance-ledger.json:36`；`tests/contracts/test_harness_architecture.mjs:61`
- **证据**：
  1. ledger `"source": "scripts/shared/state/state.mjs:validateProductionModeStructure"` —— 该函数**已删除**（全仓仅此一处引用；现行入口是 `validateState`/`inspectRunProductionIdentity` 等）。漏网原因：`test_harness_governance_ledger.mjs:17-21` 只校验 source 非空字符串，**从不 resolve 是否真实存在**。
  2. `test_harness_architecture.mjs:61`：`(path.startsWith("05-iteration/") ? \`import "../../index.mjs";\n\` : "")` —— `EXECUTABLE_INVENTORY` 里没有任何 `05-iteration/` 路径，死分支；重编号（05-iteration → 06-iteration）的漏网。
- **修复建议**：ledger source 改指现存校验函数 + 让 ledger 测试 resolve source；死分支改 `06-iteration/` 或删除。

### M-8 [P1] 文档陈旧路径 / 退役词

- **位置**：`workflow/00-setup/README.md:24,45-49`；`reference/glossary.md:59`；`workflow/02-visual-system/04-validate-page-authority-visual-system.md`（文件名）
- **证据**：
  1. `00-setup/README.md` 写 "**Charter** = `../charter/`"、"参考附录" 列 `reference/quick-start.md` 等——从 `workflow/00-setup/` 出发解析到不存在的 `workflow/charter/`；实际在 `ppt_maker_harness/charter/`、`ppt_maker_harness/reference/`。这是 charter/reference 还挂在 workflow/ 之下的**重构前布局**。
  2. `glossary.md:59`：`receives the generic current-protocol-invalid export action` —— "export" 是退役恢复动词（探测器 ACTIVE_SURFACE_RETIRED_ACTION 明列），现行是 `` `repair-current-protocol-identity` ``（kind `repair`）。
  3. 文件名 `04-validate-page-authority-visual-system.md` 残留退役词 `page-authority`（正文已改写，全仓文本零命中 page-authority，仅文件名残留）。
- **修复建议**：路径改 `../../charter/`、`../../reference/`；"export action" → "`repair-current-protocol-identity` action"；文件名重命名并更新引用。

### M-9 [P1] spec 内部双重定义 / 措辞冲突

1. **Complete Page Review 双重定义**：`image-production/spec.md:58-85` 与 `image-generation/spec.md:234-310` 各定义一遍（重叠残留）。修复：指定单一 owner（按 CONTEXT，Complete Page Review 属 Image Production 家族共享概念，建议 image-production 为 owner，image-generation 引用）。
2. **同一 refresh 条件两种措辞**：`workflow-inspection/spec.md:73-74` 用 "protected geometry"，`visual-config/spec.md:240-242` 描述同一「四条件精确相等」却用规范词——措辞统一随 M-1 一起处理。

---

## P2 — Low

### L-1 [P2] schema 层低危组（9 条）

| # | 位置 | 内容 |
|---|---|---|
| 1 | `flow.yaml:1`、`META.yaml:1`、`serialization-contracts.yaml:1` | 三个顶层头自命名 `page-image-production` / `page-image-production-definitions`，与规范 pipeline 字面量 `page-image-workflow`（CONTEXT.md:258）分歧；"production" 是 production-mode 时代命名族。`state.mjs:565` 的 `PAGE_IMAGE_TASK_MANDATE_SCOPE = "normal-page-image-production"` 同为代码独有 selector（未在 serialization-contracts 的 selectors 声明）。统一为 `page-image-workflow` 或规范表达 |
| 2 | `META.yaml:10-24` | `stage_definition.required_keys` 缺 `publication`，但 7 个 stage 文件都在用（role/current_producer/workflow_presence） |
| 3 | `META.yaml:25-31` | `producer_status_values: [human-authored, materialized]` 中 `human-authored` 是死值——19 个 stage 全标 materialized（含 5 个 `recomputable: false` 的 source stage） |
| 4 | `META.yaml:35-45` | field_definition 未文档化 `page-source.yaml:46-47` 实际使用的字段级 `producer`/`producer_status` 键 |
| 5 | `stages/page-artifact-index.yaml:8-13` | 只声明 `page-derived-index` role，缺 serialization-contracts.yaml:499-513 与 `page_derived_data.mjs:96-102` 都有的 `deck-derived-index` |
| 6 | `flow.yaml` vs `META.yaml` vs `serialization-contracts.yaml` 头块 | `flow:` vs `schema_home:`、`execution: descriptive-only` vs `non-executable`、`authority` 两套取值——三个顶层元数据键/值不统一 |
| 7 | `flow.yaml:22,53,64,105` vs `:7,34,43,75` | 同一文件 owner 路径前缀混用（裸 `scripts/...` vs `ppt_maker_harness/scripts/...`） |
| 8 | `scripts/shared/page-image/page_image_core.mjs:9-18` | `PAGE_IMAGE_CORE_CONTENT_ROLES`（body/label/metric/diagram_text/quote/callout/supporting_copy）与 `PAGE_IMAGE_CORE_COPY_POLICIES`（exact/presentation_adaptable）是代码 closed enum，schema/ 无声明；而同为 closed enum 的 page_class、subject_restrictions 都声明了（不对称） |

### L-2 [P2] 文档低危组（4 条）

| # | 位置 | 内容 |
|---|---|---|
| 1 | `scripts/README.md:36` | 悬空截断句 `coverage without reading run-bundle or generated data.`（前一条 bullet 已结束，改写残留尾巴） |
| 2 | `ppt_maker_harness/CLAUDE.md:20` | 用退役三步名描述 BOOTSTRAP：`environment check → quick intake → start building`；现行是 Step 0-4，"quick intake" 全文不存在 |
| 3 | `docs/adr/0001-intent-route-catalog.md:1,3,5` | 把已退役的 Intent Route Catalog 标 "Accepted" 且用现在时 "contains"（harness_coherence.mjs 已将其列为禁用陈旧指引；现行 = MD Controllers + controller manifest + Diagnostic Recovery Handoff）→ 建议标 Superseded |
| 4 | `node-specification/spec.md` 示例 node 名 | 见 M-4 附带（authoring-slides/seed-topics） |

### L-3 [P2] 测试措辞残留

- `tests/contracts/workflow-control-ledger.json:32`：`"invalidation": "state, index, or production-mode change"` —— 退役词 `production-mode` 出现在失效条件描述里；改写为 "state, index, or production-workflow/identity change"。

### L-4 [P2] deck 导航陈旧引用（8 条，生产数据）

| # | 位置 | 内容 |
|---|---|---|
| 1 | `2_backbone/README.md:7` | 引用 `outline.md`（实际 `story-outline.md`；旧文件已迁 legacy-backbone） |
| 2 | `2_backbone/visual-style/README.md:6` | 引用退役 `page-authority-visual-language.yaml`（实际 `page-image-visual-language.yaml`） |
| 3 | `2_backbone/manuscript/README.md:6` | 指 `3_versions/v1/slide-specifications.md` 为页级 SSOT + `01–22`（活跃版 v8、25 页） |
| 4 | `README.md:5,15`、`_state/README.md:13,15,16`、`_lessons/agent-identity-asset-chain.md:34,71,72`、`_lessons/vendor-reliability.md:14` | 退役 harness 名 `PPTMAKER_FRAMEWORK`（现行 `ppt_maker_harness`，RUN_BUNDLE.md:4）散落于 4 个 read-first 文件 |
| 5 | `_state/README.md:5,16` | 引用 `scripts/lib/state.mjs`（实际 `scripts/shared/state/state.mjs`） |
| 6 | `1_upstream_raw_material/README.md:8` | frontmatter `feeds_into: 2_backbone/outline.md`（不存在） |
| 7 | `1_upstream_raw_material/README.md:39` | 引用不存在的 `style-master-iterations/`（实际 `page-image-style-master-iterations/`）；目录树也没列 legacy-backbone/、两个 iterations 目录、agent-portrayal.md、散落 jpg/md |
| 8 | `deck-guide.md:34`、`_lessons/agent-identity-asset-chain.md:49` | v1 被误归入 `page-authority-image2-v2`（实为 `whole-page-image2-v1`）；lesson 称「已注册 role 只有 2 个」但注册表现有 8 个 role |

### L-5 [P2] deck 孤儿产物

- `deck_ai_sdlc_keynote/MIGRATION.md`：停在 2026-07-30 的 page-authority-image2-v2 迁移，缺 v8/page-image-workflow（2026-08-14）条目；正文仍含退役词 `production_mode`（:10,11,30,31）、`--reuse-images`（:67）、`html-first-v1`。建议归档（补 v8 条目或改名 `.archived`），不当现行说明。
- `1_upstream_raw_material/` 根散落：`style_master_legacy.jpg`、`style_master.round0-19c.jpg`、`style-master-prompt.round0-19c.md`（全库零引用；当前 style master 在 `2_backbone/visual-style/`）。建议移入 legacy-backbone/ 或归档区。
- **澄清（不报）**：`legacy-backbone/` 已自归档（README 自述「迁移前快照 2026-08-14」），保留即可。

---

## P3 — 元发现：现有探测器缺口（本次审计为何「全绿却仍有残留」的根因）

现有探测器 = `harness_architecture.mjs` + `harness_coherence.mjs`（`npm test` core 的一部分，审计时全绿）。

| # | 缺口 | 证据 | 建议 |
|---|---|---|---|
| D-1 | retired 词表不含：`protected geometry`/`protected zone`、build/doctor 退役词（`--resolution/--model/--base-url/--reuse-images/--dry-run/--force/--reason/--image2/--mode`、`retiredControlsExplicit`）、`--check-gates`、`mode` 短语 | 词表见 `harness_architecture.mjs:549-570`、`harness_coherence.mjs` STALE_RULES/RETIRED_ALIAS_RULES | 扩词表（正是它漏掉导致 M-1/M-2/M-3/H-2 对探测器不可见） |
| D-2 | import 边校验对指向不存在文件的本地 import **静默跳过** | `harness_architecture.mjs:1113-1114`：`if (!target || !files.has(target)) return;` | 加 `stale-import-target` 告警 |
| D-3 | ledger 的 `source` 指针只校验非空、不 resolve | `test_harness_governance_ledger.mjs:17-21` | resolve source 符号存在性（否则 M-7#1 这类死指针永远静默通过） |
| D-4 | CONTEXT.md「实现仍在使用」这类**反向过期声明**无检查 | 全库 grep 与 CONTEXT 声称相反 | 可选：对 CONTEXT 中 "still uses" 句式做实现侧 grep 复核（M-2 的根因） |

---

## 已确认干净（给重构的正反馈，避免未来重复劳动）

- `production_mode` / `supported_production_modes` 在实现/schema/docs **全绝迹**（仅 L-3、deck MIGRATION.md 两处措辞残留）。
- `scripts/lib`、`04-image-production`、`05-iteration` 生产代码**零引用**；全部本地 import 无断链。
- 代码里 18 个 `schema:` 字面量全部在 schema/ 有声明（除 M-6 的 6 键缺口）；page-class 枚举 `standard/opening/transition/closing` 正确 mirror。
- CLI 恰好 12 命令；image2 子命令集与 cli-surface 一致；capability registry 26:26 与 specs 目录 1:1。
- tests 对退役面全部是「正确断言拒绝」，无一误报为现行；tests_e2e 完全干净。
- deck 协议层：`_state/state.yaml` 与 NODE-SPEC 合约逐字一致；`project-metadata.yaml` 无 production-protocol mirror（显式声明）；provider-profile 与 `provider_profile.mjs:156-173` 校验逐字一致。
- 文档：build 退役 flag 在现行文档中清零；`production-mode`/`Protected Zone` 只出现在 CONTEXT 的定义语境。

---

## 修复顺序建议（Wave → OpenSpec change 映射）

| Wave | 内容 | 性质 / 建议 change | 状态（2026-08-16） |
|---|---|---|---|
| **1** | H-1、H-2、M-1(spec 部分)、M-2（含 CONTEXT 反向修正）、M-3、M-4、M-9 | Harness maintenance。1 个 change：「spec 当前层退役词统一 + node-specification 修订」（specs 是行为权威，先修它，文档才有唯一真源可对齐） | H-1/H-2/M-4 已由 CLS-038 吸收；M-3 触及范围已改；**剩余 = M-1/M-2/M-3(剩余)/M-8/M-9/L-2 → `align-current-layer-terminology`（spec + 文档合并）** |
| **2** | M-5、M-7、L-3、D-1..D-4 | 1 个 change：「退役面死代码移除 + 探测器词表/校验扩面」（防回归：修完探测器必须能抓同类残留） | M-5#6/#7(operation 别名) 已由 CLS-038 吸收；**剩余 = M-5#1-5 + M-5#7(profile 展示名) + M-7 + L-3 + D-1(剩余)/D-2/D-3/D-4 → `remove-retired-plumbing-and-harden-detectors`** |
| **3** | M-6、L-1 | 1 个 change：「schema mirror 对齐」（serialization-contracts 6 键 + 孤儿值 + 顶层命名统一） | **未动 → `align-serialization-schema-mirror`** |
| ~~**4**~~ | M-1(文档部分)、M-8、L-2 | ~~独立小 change（纯文档）~~ **已并入 Wave 1**（spec 术语定稿后同一 change 对齐文档镜像） | 并入 `align-current-layer-terminology` |
| **5** | H-3、L-4、L-5 | **deck 生产数据，不走 OpenSpec**。L-4/L-5 机械清理（需 deck owner 指定范围）；**H-3 是 Deck Author 的内容决策**（摘除人格 vs 改声明），Agent 只能提选项不能代决 | **未动**，需 deck owner |

> 推进纪律：与 CLS-038 一致——同一时间只允许一个 active change，archive 后才启动下一个；
> Change 1→2→3 严格串行；Change 1 内部先 spec（唯一真源）后 docs（镜像）；Wave 5 与
> Change 1–3 无依赖，可在取得 deck owner 决策后随时并行处理。

## 风险 / 取舍

- [术语统一伤到机器契约] → 缓解：M-1/M-2 只改**散文**；`header_region`/`protected_composition`/`reserved_header`/`body_safe` 序列化字段一律不动（CONTEXT.md:202-209 明示这些字面契约不是术语别名）。
- [改 spec 顺序错导致文档二次返工] → 缓解：Change 1 内先 spec（权威）后 docs（镜像）。
- [行号漂移] → 缓解：本文件所有引用以「路径 + 符号名」为准，行号是 2026-08-16 快照。
- [deck 源改动触发失效/重渲染] → 缓解：H-3 若选「真摘除」，必须按 owner 流程走失效分类（改 VISUAL IDENTITY/注册表 → Generated Image Rebuild 起），不得手改 `_generated/`；若选「改声明」则只动 README，零渲染影响。
- [一次修太多难以 review] → 缓解：按 Wave 拆 change，每个 change 可独立验证（Wave 2 自带防回归测试）。

## 落地关联

本 plan 是**分析文档**，不直接实施。落地路径（2026-08-16 更新为明确的串行 change 队列）：

1. **Wave 1–4 各起一个 `openspec/changes/`**，严格串行（archive 后才启动下一个）——
   为控制 change 数量，Wave 4（文档镜像）并入 Wave 1，最终 **3 个串行 change**：
   - `align-current-layer-terminology`（Wave 1+4：M-1 spec+文档 / M-2 / M-3 剩余 / M-8 / M-9 / L-2；受影响 capability：node-specification、harness-charter、image-production、image-generation、visual-config、workflow-inspection、pipeline-orchestration、playbook-execution、cli-surface、environment-check；spec 权威 + 文档镜像同 change，先 spec 后 docs）
   - `remove-retired-plumbing-and-harden-detectors`（Wave 2：M-5#1-5 + #7 展示名 / M-7 / L-3 / D-1..D-4；capability：cli-surface、environment-check、harness-script-layout + tests）
   - `align-serialization-schema-mirror`（Wave 3：M-6 / L-1；capability：production-schema-conformance + schema/）
   每个 proposal 引用本文件对应编号；每个 change 独立终态 + 验证 + 防回归（Wave 2 自带探测器防回归）。
   更少 change 的取舍说明：术语（1）与死代码/探测器（2）、schema（3）分属「文字面 vs 代码面 vs 声明面」，
   各有独立验证面；进一步合并会让单个 change 过大、review 与验证矩阵膨胀，故 3 个是当前质量不下降的最小数量。
2. **Wave 5 按 `BOOTSTRAP.md`/当前 Controller 走 deck 工作流**，先取得 deck owner 对 H-3 的决策
   与 L-4/L-5 的清理授权；不进 OpenSpec。
3. Wave 1–4 全部 archive 后本文件移入 `_done/_closed_plans/`（CLS 编号）并更新 plans/README.md；
   Wave 5 的 deck 清理在其自身闭环内收尾。

---

## 执行进度追踪（Progress Tracker）

> **这是本 plan 的唯一进度真源**——自动推进时先读这里就知道"现在到哪、下一步做什么"。
> 纪律与 `cli-diagnostic-faithful-passthrough`（CLS-038）一致：同一时间一个 active change，
> archive 后才启动下一个；每个 change 独立终态，不依赖下一个才保持 surface 安全。

### 总状态（2026-08-16）

| 项 | 状态 |
|---|---|
| 审计本身 | ✅ 完成（45 条 finding；7 条已由 CLS-038 吸收） |
| Change 1 `align-current-layer-terminology` | ✅ 已 archive（2026-08-16，spec 10 文件 + 文档 10 文件 + CONTEXT + 1 重命名；`protected geometry/zone`、retired mode 短语、`export action`、`quick intake` 清零） |
| Change 2 `remove-retired-plumbing-and-harden-detectors` | **NEXT**（未启动） |
| Change 3 `align-serialization-schema-mirror` | QUEUED |
| Deck Wave 5（H-3 / L-4 / L-5） | BLOCKED（等 deck owner 决策/授权；非 OpenSpec） |

### 进度清单

- [x] **Change 1：`align-current-layer-terminology`**（Wave 1+4 合并；2026-08-16 archive）
  - finding：M-1（spec 7 文件 + 文档 10 文件；06-iteration 当前树无命中）、M-2（3 spec + CONTEXT
    反向修正）、M-3 剩余（node-specification ×9 + playbook-execution ×2 + environment-check
    组织轴 ×4 requirement）、M-8、M-9、L-2
  - capability：node-specification、harness-charter、image-production、image-generation、
    visual-config、workflow-inspection、pipeline-orchestration、playbook-execution、cli-surface、
    environment-check（+ CONTEXT.md 术语权威修正）
  - 内部顺序：先 spec（唯一真源）→ 后 docs（镜像对齐）→ 最后 CONTEXT.md 术语定义修正
  - 红线：只改散文；`header_region`/`protected_composition`/`reserved_header`/`body_safe`
    序列化字段一字不动（CONTEXT.md:202-209 明示不是术语别名）
  - 完成判据：`protected geometry`/`protected-geometry`/`protected zone`/`protected-zone` 在当前层
    清零（仅保留定义/禁止语境）；触及 spec 中 retired `mode`/`durable mode`/`source-mode pair`
    短语清零；Complete Page Review 单一 owner（image-production，image-generation 引用）；
    M-8 路径/文件名、L-2 文档低危清零；`openspec validate --strict`、`npm test`、`npm run test:sweep` 通过
  - 生命周期：scaffold → proposal/specs/design/tasks（planning 齐）→ **`/polish-openspec-change`
    （≥2 轮 risk-led，结论 `ready for apply` 才继续）** → apply → archive
  - 验证记录：`openspec validate --all --strict` 27 项通过；`npm test` core 通过；
    `npm run test:sweep` 652 项通过；`git diff --check` 通过；polish Pass 2 补齐
    playbook-execution resume-ritual M-3 与 environment-check 第 4 个 requirement 两处缺口

- [ ] **Change 2：`remove-retired-plumbing-and-harden-detectors`**（Wave 2）
  - finding：M-5 #1-5（build plumbing 死代码/空壳层/JSDoc）、M-5 #7 收尾（profile 展示名
    `image2-raw`）、M-7（ledger 死指针 + 05-iteration 死分支）、L-3、D-1（剩余词表）、D-2
    （stale-import-target）、D-3（ledger source resolve）、D-4（CONTEXT "still uses" 反向检查）
  - capability：cli-surface、environment-check、harness-script-layout（探测器）+ tests
  - 完成判据：M-5 #1-5 死代码删除；探测器词表扩面后 planted violation 能抓 `protected
    geometry/zone`、build/doctor 退役词、`--mode`、`--check-gates`（H-2 类残留）；ledger
    source 改指现存符号 + 测试 resolve；`npm test`（architecture/coherence guard）+ 新增
    planted-violation 测试全绿；sweep 通过
  - 生命周期：同 Change 1

- [ ] **Change 3：`align-serialization-schema-mirror`**（Wave 3）
  - finding：M-6（`serialization-contracts.yaml` 漏 6 键 + 4 孤儿 wire-schema 值）、L-1（9 条
    schema 层低危：顶层命名/键/枚举/mirror 漂移）
  - capability：production-schema-conformance + `schema/`（+ 必要时 `state.mjs` 对齐）
  - 完成判据：`current_state_shape` 与 `state.mjs#STATE_TOP_LEVEL_KEYS` 对齐；孤儿 wire-schema
    值删除或标注；L-1 的 9 条清零；`npm test` + conformance 测试通过
  - 生命周期：同 Change 1

- [ ] **Deck Wave 5（非 OpenSpec）**：H-3（具名人格自相矛盾）、L-4（导航陈旧引用 8 条）、L-5（孤儿产物）
  - 前置：deck owner 对 H-3 的二选一决策（摘除人格 → 走失效/重渲染；或改 README 声明）+ L-4/L-5 清理授权
  - 完成判据：按 `BOOTSTRAP.md`/当前 Controller 流程；H-3 二选一落地；L-4/L-5 清理完成
  - 与 Change 1–3 无依赖，可并行

### 判定标准（何时 done / 何时 blocker）

- **apply 门槛**（硬性）：每个 change 的 proposal/specs/design/tasks 完成后，先跑
  `/polish-openspec-change`（≥2 轮 risk-led，逐项核查），**只有结论明确 `ready for apply`**
  且 `openspec validate --strict` + `git diff --check` + 项目完整性检查全绿，才进入 apply；否则继续打磨。
- **change done** = `openspec archive` 成功 + main specs 同步 + 该 change 完成判据全绿（勾选只在证据存在时打勾）
- **blocker** = 同一条件连续 3 轮无法推进 → 记录具体 blocker_reason，不猜测、不绕过
- **Wave 5** = 需要 deck owner 决策时停下，只提选项，不代决

### 每次更新进度时必须做什么

1. 更新本 tracker 的「总状态」表与「进度清单」勾选框
2. 更新顶部状态行（第 3 行的「当前下一步」）
3. 写明最新 `openspec list --json` 与 `openspec validate --strict` 结果
4. 某个 change archive 后才把下一项从 QUEUED 改为 NEXT
5. Change 1–3 全部 archive 后：本文件移入 `_done/_closed_plans/`（分配 CLS-039）+ 更新
   `plans/README.md` + `_done/README.md`（计数 +1、Next CLS-040）

### 当前下一步（Next action）

启动 Change 2：`openspec new change "remove-retired-plumbing-and-harden-detectors"` → 写
proposal（引用本文件 M-5 #1-5 / #7 展示名、M-7、L-3、D-1 剩余词表、D-2/D-3/D-4 编号与受影响
capability：cli-surface、environment-check、harness-script-layout + tests；目标=删死代码 +
探测器词表/校验扩面防回归）→ 按 OpenSpec 流程（specs → design → tasks → polish → apply →
archive）推进。
