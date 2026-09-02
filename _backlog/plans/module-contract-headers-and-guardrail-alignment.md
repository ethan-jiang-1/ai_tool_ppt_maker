# Plan: 模块契约头注释与维护护栏对齐

> 类型: 设计/分析 | 更新: 2026-09-02

## 背景 / 现状

2026-09-02 的一次外部评估提出两点顾虑：

> 4. 代码热区集中：13 个 >800 行 god-file（6 个在 `shared/image2/`），且只有 24% 模块有头部契约注释——其余模块的契约要反查 openspec spec 才能得知。
> 5. `COMMANDS.md` 自称 "human-facing command map" 却是 Q&A 路由文档；`05-delivery`/`06-iteration` 各只有 1 个测试文件，恰是交付边界。

深度核查后，**其中一半结论需要修正**（如实记录，避免后人重复误判）：

| 原判断 | 核查结果 |
| --- | --- |
| 拆分 `style_master_plan.mjs` 等大文件 | ❌ **不成立**。`_done/_closed_plans/code-understandability-refactoring.md`（2026-09-01）已完成拆分波（`state.mjs` 3583→拆、`command_support.mjs` 2493→拆、两个 god index→拆），并对 4 个大文件作出**有记录的「保留不动」裁决**（对外接口窄 / 宪法单真相源 / 清单非逻辑 / 内聚有界）。本 plan 不翻案。 |
| COMMANDS.md 名不副实 | ❌ **大部分不成立**。`openspec/specs/commands-reference/spec.md` 规定 COMMANDS.md 就是 novice-facing discovery reference，且其 novice 区**明令禁止** CLI 程序名、flag、JSON/stderr 词汇。Q&A 形态是规范要求，不是缺陷。 |
| delivery 只有 1 个测试文件 | ⚠️ **统计假象**。`tests/05-delivery/test_delivery.mjs` 实为 603 行、约 19 个用例，覆盖 manifest 校验、硬停、JPEG 派生、receipt、notes-only refresh。文件数不代表覆盖密度。 |
| 头部契约注释只有 24% | ✅ **成立且量化如下**，是本 plan 的主工作面。 |
| 06-iteration 测试稀少 | ❌ 基本不成立。`06-iteration/index.mjs`（154 行、4 exports）配 5 个路由用例相称；classifier MD 与 manifest 一致性已有 `test_md_controller_reader.mjs` 部分守护。 |

### 剩余可动手面（本 plan 范围）

**A. 契约头注释缺口（真实且可量化）**：139 个 `.mjs` 中约 100 个无 `/**` 契约头。缺口集中在**公共接缝面**——恰是 coding agent 首先接触、也最需要契约的文件：

| 目标集 | 清单来源（机器权威） | 总数 | 缺头注释 |
| --- | --- | --- | --- |
| public shared interfaces | `harness_architecture.mjs` `PUBLIC_SHARED_INTERFACES` | 62 | **39** |
| CLI 命令实现 | `shared/cli/commands/*.mjs`（含于上行 39 中） | 17 | 16 |
| stage `index.mjs` | `TARGET_*_INTERFACES` + foundation 清单 | 7 | 6（仅 04-pure 有） |

回填总量 = **45 个文件**。样板已在 repo 内：`bundle_layout.mjs`、`state.mjs`、`cli_error.mjs`、`ppt_flow.mjs` 的现有头注释。

**B. 命令文档措辞错位（1 处）**：`ppt_flow.mjs:11` 头注释称 COMMANDS.md 为 "the human-facing command map"，与 commands-reference spec 的 "novice-facing discovery reference" 用语冲突，是误导评估（包括本次）的源头。

**C. delivery 需求→用例映射缺失（流程缺口，非密度缺口）**：delivery spec 有 7 条 Requirement、现有约 19 个用例，但没有成文的映射，无法证明每条 requirement 都有测试锚点。`cli-surface` spec 有 41 条 requirement，同病更重，但本 plan 只先做 delivery（交付边界、规模可控）。

## 决策 / 方案

### W1（P0）：公共接缝契约头全覆盖 + 机器守护

**决策 1：只覆盖公共接缝面，不要求全量 139 文件。**
范围 = `harness_architecture.mjs` 已有的机器清单（62 public interfaces + 7 stage index = 69，当前缺 45）。internal/ 是实现细节，其契约由所属 index 与 spec owner_paths 认领；强制全量会产生注释噪声，违背本 repo 的 one-fact-one-home 纪律。**边界即契约面**——这也让守护天然有清单可依。

**决策 2：契约头是最小指路牌，不是第二 spec。**
Schema（≤6 行，`Authority` 指针必填）：

```js
/**
 * <one-line purpose>.
 * Authority: openspec/specs/<capability>/spec.md
 * Interface: <对外契约一句话：谁消费、承诺什么>
 */
```

- **禁止在头注释复述 requirement**（"17 个文件复述 `_generated` 规则" 的蔓延教训的直接应用）；只允许指向 owner capability + 一句职责。
- 非规范内容：头注释措辞与 spec 冲突时以 spec 为准——守护只检查指针存在与格式，不检查语义。

**决策 3：守护落在 `harness_architecture.mjs` 静态校验。**
它已 import 同两份清单做 import-edge 校验，是唯一自然落点（不新起 docs-consistency 检查）。新增 check：每个已注册 public interface 文件须以 `/**` 开头且含 `Authority: openspec/specs/` 指针。**分两步：先 warn 报告，回填完成后翻 hard-stop。**

执行顺序（每组成组提交，`npm test` + `test:sweep` 全绿再进下一组）：
1. `shared/cli/commands/` 16 个（agent 首触点，价值最高）
2. public seam 其余 23 个（含 4 个「保留不动」大文件——**只加注释，不动结构**）
3. 6 个 stage `index.mjs`
4. guard 翻 strict

### W2（P1，极小）：命令文档措辞对齐 commands-reference

- 修改 `ppt_flow.mjs:11`：`COMMANDS.md is the human-facing command map` → 与 spec 同语（"novice-facing discovery reference; `--help` output is the runtime command surface"）。
- 在文档一致性测试加一条字符串断言，防 "command map" 措辞回流。
- **明确不做**：不新建全量命令枚举文档（避免第二权威；`--help` 是 runtime truth、`cli-surface` spec 是行为权威）；不给 COMMANDS.md novice 区加命令清单（spec 明令禁止）。

### W3（P1）：delivery 需求→用例覆盖矩阵 + 定向补洞

- 在 OpenSpec change 的 verification/tasks 中建立矩阵：delivery spec 7 条 Requirement × 现有 19 用例，每条 requirement 至少 1 个命名用例锚点。**矩阵随 change 归档，不新增长期 repo 文档**（防文档蔓延）。
- 候选缺口以矩阵结果为准、不预设。经验预期：`notes_runtime.mjs`（329 行）独立失败路径、ordinal footer 在成品 PPTX 内的呈现断言、delivery-media manifest 与 JPEG profile 绑定的负例。
- 补洞写进现有 `test_delivery.mjs`，**不拆测试文件**（无性能痛点，这些用例均为毫秒级）；仅当确需新文件时同步 `source-test-ownership.json`。
- 06-iteration：**无新动作**。该判断及依据（154 行模块配 5 用例 + reader 守护）记入 change 的 verification 说明。

### 观察项（明确不行动）

- `shared/image2/page_image_target_runtime.mjs`（1556 行、41 exports）：沿用上一 plan 的 ⚠️ 观察。重审触发条件（满足其一即重开评估）：行数 > 1800；出现第 3 个 owner 域 importer；该文件再次成为回归聚集地。

## 风险 / 取舍

- [45 文件头注释回填 churn 大，污染 git blame] → 机械格式、按组成组提交；注释位于首 6 行，`blame -w` 影响最小化，可接受。
- [guard 误伤新增文件] → 清单驱动（只查已注册 public interface）；新增 public interface 时清单与头注释同 change 提交；warn 期作缓冲。
- [契约头演变成第二 spec，复述蔓延回潮] → schema 强制 "指针必填、requirement 复述禁止"；guard 校验指针格式；文档一致性测试抽查语义漂移。
- [W3 矩阵发现 delivery spec 本身有不可测 requirement] → 锚点标准是「存在命名用例」而非「断言全覆盖」；不可测 requirement 属 spec 缺陷，走独立 OpenSpec 修正，不在本 plan 内硬凑。
- [与 2026-09-01 两个已归档 change 的边界] → 本 plan 不触碰 4 个「保留不动」文件的结构；`bundle_layout.mjs` / `style_master_plan.mjs` / `page_image_progressive_raw_owner.mjs` / `harness_architecture.mjs` 仅属于公共接缝补头注释的范围。

## 落地关联

规划 **2 个 OpenSpec change**（沿用最小 change 数、互不重叠文件原则）：

1. **`add-public-seam-contract-headers`**（W1 + W2）
   - delta：`harness-script-layout`（新 requirement：已注册 public interface 文件必须携带 Authority 指针契约头；guard 归属与 warn/strict 语义）
   - tasks：schema 定稿 → commands 16 → public seam 23 → stage index 6 → guard warn→strict → `ppt_flow.mjs:11` 措辞 + 回流断言
   - 验证：`npm test` + `npm run test:sweep` 全绿；`openspec strict validate`
2. **`delivery-requirement-coverage-matrix`**（W3）
   - delta：无 spec 行为变更，仅测试与簿记（如新增测试文件则同步 `source-test-ownership.json`）
   - 若矩阵暴露 spec 缺陷 → 独立小 change 修 spec，不混入本 change
   - 验证：`npm test`；交付边界 focused 测试

完成后本 plan 移入 `_done/_closed_plans/` 分配 **CLS-046**，按 `plans/README.md` 流程更新三处簿记。
