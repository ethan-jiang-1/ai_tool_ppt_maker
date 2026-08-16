# Change 1: align-cli-machine-contract（结果模型 + 机器契约 + inventory 治理）

> 阶段见 `progress.md`。吸收评审 `07` 第 3/4/5 条: C1 不是「补 --json flag」,是三类基础改造。
> 本 change 在 **C0 拆分后**的模块布局上执行（见 `00`）;文中的 `ppt_flow.mjs` 行号按当前
> 工作区实测（`ppt_flow.mjs` 最后修改 commit `5571002`）,C0 落地后按新模块定位、行号失效。

## 范围

### 1.1 结构化结果模型（评审第 4 条）

实测现状: `commandValidate`（`ppt_flow.mjs:880`）成功仅 `console.log("✓ ... receipt validated: N slide(s)")`
+ return 0;`commandNewVersion`（`:1071`）是 compound mutation（`createVersion` →
`activateCleanPageImageTargetDraft`）,后半段失败时已创建的版本无法声明（部分效果被报成普通失败）。

目标:

1. command 实现返回结构化 owner result;text/JSON 是两个 renderer,**renderer 不拥有业务事实**;
2. JSON success report 有 schema/version、必填字段、effect / partial-effect 表达;
3. JSON mode 的 stdout 恰好一个注册文档;non-zero 时 stdout report 与 stderr final envelope
   的关系写进 spec;
4. mutating 命令（尤其 `new-version`/`build`）的成功、partial effect、no-op、失败四态可区分。

### 1.2 help / exit / JSON 单一声明源（评审第 3 条）

exit matrix 事实表（已代码复核）:

| code | 含义 | 证据 |
| --- | --- | --- |
| 0 | 成功 | — |
| 1 | JS-controlled failure（含 `state --validate-state` invalid） | `ppt_flow.mjs:3832` |
| 2 | 普通 `state` 的 replacement/current-repair hard-stop 特例 | `ppt_flow.mjs:3869` |
| 130 / 143 | SIGINT / SIGTERM | `cli_bootstrap.mjs:178` |

- 每命令 `--help` 尾部机器契约块（exit codes、stdout/stderr 契约、digest 字段名、decision 枚举）;
  **`state` 的契约块需写明**: eligible active route 下普通 `state`/`--json` 会重建协作卡
  （v5 α 的摩擦兜底,C3 延后后由帮助承担此说明）;
- **相等性审计**替代 contains 断言: 契约块与实现同源（单一声明）,不能只证明「文案存在」。

### 1.3 variable closed inventory 治理（评审第 5 条,从原 C2 前移）

- `cli-surface/spec.md:5` "fixed 12-command" → "closed, audited command inventory";
- 同步改**五个守卫点,两类改法**:
  - 硬编码清单类（改断言本身）: `harness_coherence.mjs:444`（/12-command/i）、
    `tests/contracts/test_process_docs_consistency.mjs:194`（断言句子）、
    `tests/contracts/test_process_command_surface_entry_seams.mjs:88`（12 名硬断言清单）;
  - 自动跟随类（import `PPT_FLOW_COMMAND_INVENTORY`,随 inventory 更新自动生效,只需验证）:
    `cli_error.mjs:19–32`（inventory 常量）、
    `tests/shared/cli/test_process_cli_error.mjs:253/354`（inventory 相等性）;
- **admission rule**（新增命令必须声明）: owner、单一职责、完整 grammar、输出模式、
  effect class、测试归属、与既有命令不重叠的理由;删除命令必须关闭 runtime entry、consumer、
  residue guard。仅删掉固定数字不足以控制表面净增长。

### 1.4 保留 findings 的 G / H

- G = 1.2 的机器契约块;H = 动词撞名决策表,挂进 `harness_document_command_audit` 防漂移。

### 1.5 跨 change 冻结决定: projection effect 边界（二次评审 #2 + 独立评审 B1,开工前必须冻结）

代码现状: `commandPageImageBuild()` 在 `buildDelivery()` 成功后仍调用
`refreshProgressiveControllerTaskProjection()`,失败即进 catch → return 1
（`:958–961` 成功路径 / `:962–973` catch）;target `image2` checkpoint 在 `:3134` 同样。

**冻结（采用「现状两 effect」方案,替代「schema 层提前删除」方案）**:

- C1 的 `build`/`image2` owner result **保留现状两个 effect**: delivery（或 checkpoint）与
  projection **分列**;projection 必须是独立、可版本化的字段,不得与 delivery 语义混合;
- C1 **不改变** `build`/`image2` 的退出路径与 exit 语义（代码保持现状;C3 已延后 α,
  若重启按 `03` 预案迁移）;
  interim 契约 = delivery 成功 + projection 失败 → exit 1 + partial-effect 报告（与 §1.6 一致）;
- **C3 候选 A 是已记录的未来方向**（C3 已延后 α,预案在 `03`）: 若将来重启 C3 迁移触发器,
  projection 将按该方向从 owner result 版本化删除。**本冻结契约不依赖 C3 落地**。

**为什么不用「C1 就只拥有 delivery」**: 代码层 exit 仍由 projection 决定;若 schema 层先行
删除 projection,「owner result=成功」会与「exit=非零」相悖——正是 C1 要消除的机器契约不一致。
要自洽就必须在 C1 里同时改退出路径,那等于把 C3 的触发器迁移塞进 C1（违反约束 1 的 scope 纪律）。
冻结结果写进 C1 proposal 的 scope 边界。

### 1.6 partial effect 必须带恢复闭环（二次评审 #3,只报告不够）

两条真实 partial path,design 必须逐条给出: 检测证据、effect owner、可重入/前向修复动作、
终态不变量、失败后升级路径:

- `new-version`: `createVersion()` 已发布可见 `vN/` 后,`activateCleanPageImageTargetDraft()`
  仍可能失败（lease/CAS/controller index/target clean check）;重跑撞 "target version already
  exists"。考虑: 发布 + activation 变成一个 staging/CAS 原子 owner,或提供严格识别
  "本次已创建但未激活 target" 的 resume/compensation;不得要求手删目录。
- `build`: delivery 已提交后 projection refresh 失败（`:962–973` catch → return 1）。
  按 1.5 的冻结,interim 契约 = exit 1 + partial-effect 报告（delivery 成功与 projection 失败
  分列）;最近合法动作 = 保持现状语义（先修复投影失败根因再重跑）;显式 rebuild 路径见
  `03` 延后预案。

### 1.7 exit 归一协议（二次评审 #7,真值表之外的第三类来源）

`ppt_flow test` 透传 `npm test` child 的**数值型** exit status（`ppt_flow.mjs:1508–1544`,
`return code` 在 `:1544`;overflow 与 signal-killed 归一为 1,`:1518–1519`）;
Commander 捕获的 `err.exitCode` 在 `:4002` 透传。C1 必须二选一并写进 spec:

- **推荐**: JS-controlled hard failure 规范化为 1;signal 保留 130/143;child status 有界保留进
  diagnostic;或
- 允许 delegated commands 透传任意 child exit,并在 operation-specific contract 里表达。

真值表（0/1/2/130/143）是 baseline 之外还要覆盖 signal/Commander/delegated child 三类来源
及其优先级,不能把实现审计误写成只查五个枚举值。

### 1.8 declaration authority map（二次评审 #9,单一声明源要指名 fact authority）

C1 design 先画最小 authority map,避免 `cli_error.mjs` 膨胀成第二个 command/controller registry。
**载体由 C0 提供**: 每个命令模块导出自己的注册 descriptor（见 `00` 目标结构）:

- Commander registration / operation descriptor（各命令模块,`commands/*.mjs`）拥有 accepted
  grammar 与 effect class;
- command owner result 类型拥有业务 effect;
- `cli-surface` 拥有公开规范;
- help、inventory、JSON 校验、docs audit 都是从 descriptor/spec 可验证的 projections;
- `cli_error.mjs` 只拥有 envelope、safe report 注册与 bounded validation。

另需覆盖已存在的 typed evidence 输出: `style-master authorize` 的成功结果新增
`controller_handoff` 字段（`recordStyleMasterAuthorizeCliHandoff`,plan/grant 严格格式）——
C1 的结果模型必须把它纳入 schema,不得回归成散文。

## 同步面

- 代码（C0 后布局）: `commands/*.mjs` + `command_support.mjs`（owner result + help 契约块）;
  入口 `ppt_flow.mjs`（注册）;`cli_error.mjs`（report schema 注册 + inventory）、
  `cli_return_audit.mjs`、`harness_coherence.mjs`、`harness_document_command_audit.mjs`;
  exact command-grammar audit 由本 change 落地（`05` §E.3）
- 测试: `test_process_command_surface_entry_seams.mjs`、`test_process_docs_consistency.mjs`、
  `test_cli_surface.mjs`、`test_process_cli_error.mjs` + 4 组命令测试 + 1 个契约防漂移测试
- spec: `cli-surface/spec.md`、`commands-reference/spec.md`
- 文档: `COMMANDS.md`（H 决策表）
- 完整清单照 `05-sync-surface-master-checklist.md`

## 完成判据

1. 结构化结果模型落地,text/JSON 双 renderer 由测试证明同源（同一 owner result）;
2. exit matrix 事实表进 spec,且与实现相等性审计绿;
3. inventory 治理落地,admission rule 可判定;
4. `npm test` + `openspec validate align-cli-machine-contract --strict` 全绿。
