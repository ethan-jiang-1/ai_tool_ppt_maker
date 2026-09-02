## Context

`harness_architecture.mjs` 已维护公共接缝的机器清单并做 import-edge 校验；69 个已注册接口文件（62 public + 7 stage index）实测 **0 个合规**：16 个无任何块注释、31 个契约头位于文件中部（import 之后）、22 个头顶有头但均无 Authority 指针。`simple-reliable-control.md` 要求新增 blocking rule 前完成 Blocking-Rule Burden 五问；本 design 在"Decisions → D1"逐条作答。动机与范围见 proposal.md。

## Goals / Non-Goals

**Goals:**

- 公共接缝文件在**文件内**自带"职责一句话 + 权威 spec 指针"，agent 打开任一接缝即可获得契约入口。
- 守护复用现有 architecture snapshot 校验，无新 checker 模块、无新 CLI 出口、无新持久状态。
- 统一 COMMANDS.md 在 `harness-script-layout` 与 `commands-reference` 间的称谓。

**Non-Goals:**

- 不要求 internal/ 实现文件、可执行入口（`env-check.mjs`、`lab_cli.mjs`）加契约头——它们的契约归 owner spec 与 `--help`。
- 不用机器判定头注释散文语义；不建命令枚举文档；不改任何 import 边界、运行时行为或 CLI 输出。

## Decisions

### D1：按 `simple-reliable-control.md` Blocking-Rule Burden 立项

| 五问 | 回答 |
| --- | --- |
| 1. 事实的 Source of Record | 接缝文件自身的头注释字节；"哪些文件是公共接缝"由 `harness_architecture.mjs` 已注册清单拥有（既有事实，无新清单） |
| 2. 现有检查抓不住的真实失败 | import-edge guard 只验证接线，不验证接缝是否自带权威指针；接缝文件被改后，维护者/agent 无 in-file 入口，只能跨 1,500+ 行 spec 逆向，契约理解漂移无人发现 |
| 3. 删除/合并/避免的复杂度 | 不新增 checker 模块（并入 snapshot 校验）；不设 warn/stRICT 双模式（无长寿命 warn 状态）；不生成 API 文档；不要求 internal 文件加头 |
| 4. 失败后唯一最近合法动作 | 给该文件补/修契约头（`Authority` 指针指向真实存在的 spec），重跑同一检查 |
| 5. 证明合法工作不被误伤的 focused test | 阴性：已注册接缝缺头 → guard 点名失败；阳性：补头后同检查通过；越界阴性：未注册 internal 文件无头 → guard 静默；坏指针：指向不存在 spec → guard 点名 |

控制结果归类：`guide`（human-centered-gates.md）——确定性修复，无新人类决定、无 waiver 面。

### D2：检测规则（确定性、无语义判定）

- 契约头 = 文件**首个 `/** … */` 块注释**（允许位于 import 之后——31 个现存头在中部是 repo 既有风格，强制置顶会平添 31 个文件的搬运 churn 而不增加价值）。
- 在该首个块注释内匹配 ≥1 行 `* Authority: openspec/specs/<capability>/spec.md`（单段 capability 名；多指针允许，如 `bundle_layout.mjs` 被两个 capability 认领）。
- 每个被指路径必须 `existsSync`——spec 重命名/删除即被抓，这是指针防腐的核心价值；capability 注册表不进代码，避免第二权威。
- 头内其余散文不做任何判定（指针卡是给人和 agent 的，散文漂移交给评审与既有文档一致性测试）。

备选被否：要求头必须在文件顶（31 文件强制搬家，churn 无价值）；解析 AST 找 lead comment（过重）；扫描全文件找 Authority 行（游离注释会误通过）。

### D3：校验函数形态

新增导出（如 `validateContractHeaders`）：入参为**显式文件清单 + 读取函数**，默认装配真实注册清单与真实 fs——与该模块现有 validation 函数的注入风格一致，focused 测试可在临时夹具上种 violation，不触碰生产文件、也满足"换文件名逃不掉"（清单驱动，逐文件点名）。

### D4：不做 warn 过渡态

备选 warn→strict 两阶段被否：本 change 内先回填全部 45 个文件、再落地 strict guard，同一 change 内自洽，双模式只会留下需要日后拆除的状态机。simple-reliable-control 优先删除而非增加模式。

### D5：术语对齐是最小 spec delta

"human-facing command map" 全 repo 仅存在于 `harness-script-layout` spec 第 225 行与 `ppt_flow.mjs:11` 两处（grep 证实），MODIFIED requirement 完整重写该 requirement 及其 3 个场景，仅替换称谓短语；代码侧同步 1 行。`commands-reference` spec 自身无需改动（其定义已是要对齐的目标）。

## Risks / Trade-offs

- [69 文件注释 churn 污染 git blame] → 只动块注释（16 新增头 + 53 行内插入 Authority），按目录组成组提交（commands → shared 其余 → stage index），`blame -w` 可忽略。
- [头注释未来膨胀成"第二 spec"，复述蔓延回潮] → schema 上限 ~6 行 + "指针必填、复述禁止"写入 spec requirement 文本；guard 不判语义，语义漂移由评审与文档一致性测试兜底（已知残余风险，接受）。
- [大文件补头被误解为重新 opens 拆分议题] → proposal/design 明示 4 个"保留不动"文件仅加注释、结构不动；plan 文档已记录该裁决。
- [spec 路径重命名导致 guard 全红] → 这是期望行为（指针防腐），修复动作即改指针，属 guide 级机械修复。

## Migration Plan

任务序：按目录分组（commands → shared 其余 → stage index）全部 69 文件达标 → guard + focused tests → `ppt_flow.mjs:11` 措辞。每组提交后 `npm test` 全绿再进下一组；guard 落地时全量已合规，strict 立即生效。回滚 = revert 本 change（纯注释新增 + 单模块校验 + 测试，无数据/状态迁移）。

## Open Questions

（无。）
