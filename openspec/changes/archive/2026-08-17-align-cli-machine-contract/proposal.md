# Proposal: align-cli-machine-contract

## Why

C0 已把 4035 行的 `ppt_flow.mjs` 纯拆成入口 + `command_support.mjs` + 12 命令模块，但命令面仍是
「职责混装 + 机器契约不可审计」：命令实现直接 `console.log` 人类文本、只返回数值 code，没有可被
JSON renderer 消费的结构化结果；help/exit/JSON 没有单一声明源（`fixed 12-command` 硬编码散落 5 处）；
mutating 命令的 partial effect 无法声明；`test` 透传任意 child status 使 exit 真值表漏报。本 change
把这些收敛成「一个命令一个业务、机器契约可审计」——不补 `--json` flag，而是三类基础改造：结构化
结果模型、help/exit/JSON 单一声明源、variable closed inventory 治理（吸收评审 07 第 3/4/5 条）。

## What Changes

### 1. 结构化结果模型（评审第 4 条）

- 命令实现返回结构化 owner result；text 与 JSON 是两个 renderer，**renderer 不拥有业务事实**
  （spike 1 已验证 4 态 + 双 renderer 同源）。
- JSON success report 有 schema/version、必填字段、effect / partial-effect 表达；
  JSON mode 的 stdout 恰好一个注册文档，不混入进度/散文。
- mutating 命令（尤其 `new-version`/`build`）的成功、partial effect、no-op、失败四态可区分。
- `style-master authorize` 的成功结果纳入既有的 `controller_handoff` typed evidence
  （`recordStyleMasterAuthorizeCliHandoff`），不得回归成散文。

### 2. help / exit / JSON 单一声明源（评审第 3 条）

- exit matrix 事实表进 spec：0 成功 / 1 JS-controlled failure（含 `state --validate-state` invalid）/
  2 普通 `state` 的 replacement/current-repair hard-stop / 130 SIGINT / 143 SIGTERM；
  **另覆盖 signal / Commander / delegated child 三类来源及其优先级**。
- 每命令 `--help` 尾部机器契约块（exit codes、stdout/stderr 契约、digest 字段名、decision 枚举）；
  **`state` 契约块写明**：eligible active route 下普通 `state`/`--json` 会重建协作卡（v5 α 摩擦兜底）。
- 契约块与实现**同源**（单一声明），相等性审计替代 contains 断言。

### 3. variable closed inventory 治理（评审第 5 条）

- `cli-surface` Purpose 的 "fixed 12-command" → "closed, audited command inventory"。
- 同步改 5 个守卫点（两类改法）：硬编码清单类（改断言）＝ `harness_coherence.mjs:444`、
  `tests/contracts/test_process_docs_consistency.mjs:194`、
  `tests/contracts/test_process_command_surface_entry_seams.mjs:88`；自动跟随类（随 inventory 生效，
  只需验证）＝ `cli_error.mjs:19–32`、`tests/shared/cli/test_process_cli_error.mjs:253/354`。
- **admission rule**（新增/删除命令必须声明）：owner、单一职责、完整 grammar、输出模式、effect class、
  测试归属、与既有命令不重叠的理由；删除命令关闭 runtime entry/consumer/residue guard。

### 4. 保留 findings G / H

- G = §2 的机器契约块；H = 动词撞名决策表，挂进 `harness_document_command_audit` 防漂移。

### 5. 跨 change 冻结（projection effect 边界，门槛 3 已冻结）

- C1 的 `build`/`image2` owner result 保留**现状两个 effect**（delivery 与 projection 分列），
  projection 为独立、可版本化字段；C1 **不改**退出路径与 exit 语义。
- interim 契约 = delivery 成功 + projection 失败 → exit 1 + partial-effect 报告。
- 冻结不依赖 C3；若将来重启 C3（`03` 预案候选 A），按已记录方向把 projection 版本化删除。

### 6. partial effect 必须带恢复闭环（二次评审 #3）

- `new-version`：`createVersion()` 发布可见 `vN/` 后 `activateCleanPageImageTargetDraft()` 仍可能失败；
  重跑撞 "target version already exists"。需 staging/CAS 原子 owner 或严格识别「本次已创建未激活
  target」的 resume/compensation；不得要求手删目录。
- `build`：delivery 提交后 projection 失败 → interim 契约 = exit 1 + partial-effect 报告（delivery 成功
  与 projection 失败分列）；最近合法动作 = 保持现状语义（先修投影失败根因再重跑）。

### 7. exit 归一协议（二次评审 #7；窄决策 #2，按已记录倾向定）

- **采纳推荐项**：JS-controlled hard failure 规范化为 1；signal 保留 130/143；`ppt_flow test` 的
  child 数值型 status **有界保留进 diagnostic**（overflow/signal-killed 归一为 1，现状 `:1518–1519`）；
  Commander 捕获的 `err.exitCode` 不再透传任意值。
- 真值表之外的 signal/Commander/delegated child 三类来源与优先级写进 spec。

### 8. declaration authority map（二次评审 #9，载体由 C0 提供）

- 各命令模块导出自己的注册 descriptor（grammar/flags/help；command id 与
  `PPT_FLOW_COMMAND_INVENTORY` 一致）；Commander registration/operation descriptor 拥有 accepted
  grammar 与 effect class；command owner result 类型拥有业务 effect；`cli-surface` 拥有公开规范；
  help、inventory、JSON 校验、docs audit 都是从 descriptor/spec 可验证的 projections；
  `cli_error.mjs` 只拥有 envelope、safe report 注册与 bounded validation——不膨胀成第二 registry
  （spike 2 已证无需自建 registry）。

## Capabilities

### New Capabilities

无。结构化结果模型、help 契约、inventory 治理都是 `cli-surface`（producer）与
`commands-reference`（路由/动词撞名）既有 capability 的 requirement 变化。

### Modified Capabilities

- `cli-surface`：MODIFIED——exit matrix 真值表（含 signal/Commander/delegated child 三来源）、
  JSON success report schema/effect/partial-effect、机器契约块同源、inventory 从 fixed-12 改为
  closed-audited + admission rule、`state` 契约块写明投影重建行为、exit 归一协议（child status 有界
  保留进 diagnostic）。
- `commands-reference`：MODIFIED——动词撞名决策表（H）与命令路由/意图登记进防漂移审计。

## Impact

- **Harness 源码**：`commands/*.mjs` + `command_support.mjs`（owner result + help 契约块）、入口
  `ppt_flow.mjs`（注册 descriptor）、`cli_error.mjs`（report schema 注册 + inventory）、
  `cli_return_audit.mjs`、`harness_coherence.mjs`、`harness_document_command_audit.mjs`；
  exact command-grammar audit 由本 change 落地（`05` §E.3，基于 descriptor）。
- **OpenSpec**：`cli-surface/spec.md`、`commands-reference/spec.md` MODIFIED。
- **测试**：`test_process_command_surface_entry_seams.mjs`、`test_process_docs_consistency.mjs`、
  `test_cli_surface.mjs`、`test_process_cli_error.mjs` + 4 组命令测试 + 1 契约防漂移测试。
- **文档**：`COMMANDS.md`（H 决策表）。
- **Control owner**：MD⇔JS protocol——JS 拥有 owner result / exit / inventory / descriptor；
  MD Controller 消费 `cli-surface` 回执，不复制 producer schema。
- **Run-bundle contract impact**：`compatible`（exit 归一与 JSON report 是新增的机器契约，不改
  `deck_*`/state/receipt 字节；无 migration）。
- **Policy 引用**：
  - `human-centered-gates.md`：partial-effect 与 hard-stop 保留现状 gate 分类；exit 归一不改
    hard-stop 保护的不变量（不放松身份/授权）。
  - `agent-assistance-and-control.md`：declaration authority map 避免 `cli_error.mjs` 膨胀成第二
    registry；owner result 是单一事实源，renderer/help/inventory/audit 都是 projection。
  - `simple-reliable-control.md`：单一声明源 + 相等性审计 = 最短闭环；删除的复杂度 = 散落 5 处
    fixed-12 断言 + 「文案存在」contains 断言 + `test` 任意 child status 透传。
