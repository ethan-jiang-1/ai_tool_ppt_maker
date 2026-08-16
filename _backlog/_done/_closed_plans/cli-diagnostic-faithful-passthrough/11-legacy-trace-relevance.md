# Current-layer legacy trace relevance

## 目的

本文评估 [`../../../plans/current-layer-legacy-trace-audit.md`](../../../plans/current-layer-legacy-trace-audit.md) 中哪些 finding 会
改变本 diagnostic/runtime/validate 路线图，哪些必须继续留在原 legacy cleanup 边界。

吸收标准只有四个：finding 必须直接改变同一个 fact authority、public entry、MD consumer control，或
防止本 change修复后的旧路径回流。仅仅位于同一文件、同样“看起来旧”，不足以并入。

## 结论

Legacy audit 不增加新的 OpenSpec change。相关 finding 吸收到现有 3 个 change：

| Audit finding | 与本问题的关系 | 吸收位置 |
|---|---|---|
| H-1：`node-specification` 使用退役 Visual Language 路径 | 直接制造错误 source authority，影响 readiness/diagnostic locator | Change 1 |
| M-4：MD consumer 按顶层 `code` + `hint` 分支 | 直接复制第二归因器，与 `diagnostic.next` 合同冲突 | Change 1 |
| D-1 中与 H-1/M-4 对应的探测缺口 | 若不加 guard，同一 current-layer旧合同可再次回流 | Change 1 |
| M-5 #6：`assembly-notes` accepted但没有针对性 doctor checks | READY 结论与真实 operation capability不一致 | Change 2 |
| M-5 #7：隐藏 `image2-raw` alias | Doctor operation registry、help和实际入口不一致 | Change 2 |
| H-2：不存在的 `--check-gates` 被写成现行 state入口 | 直接污染 Change 3 所修改的 state/validate observation surface | Change 3 |
| M-3 中 Change 3 触及的 `mode` 表述 | 会让 source/workflow/state observation继续使用退役 authority vocabulary | Change 3，限触及范围 |

## Change 1 吸收项

### H-1：错误的 current Visual Language source path

`node-specification` 把退役的 `page-authority-visual-language.yaml` 写成 readiness source；当前 source是
`page-image-visual-language.yaml`，路径应由 run-bundle owner提供。

这不是纯文档 typo。`node-specification` 是 MD consumer/state contract；错误路径会让开发 Agent或运行
Agent在 source failure后检查一个不存在的 owner。Change 1 正在定义 source fact和 public locator，必须
同时移除这份 competing path mirror。

验收要求：

- main spec只引用当前 canonical source/owner；
- 不在 consumer spec重新拼路径字符串；
- negative guard能检测退役 source path回流到 current-layer specs/guidance。

### M-4：旧 consumer envelope

`node-specification` 一处仍要求 MD Controller按顶层 `code` 和 `hint` 决定 repair action，而同一 spec后文
已经把它们定义成 legacy summary。这个冲突与当前 CLI第二归因器属于同一控制问题：即使 producer修好，
consumer仍可能绕过 `diagnostic.next` 再作一次判断。

Change 1 应明确：

- producer字段与发射规则仍由 `cli-surface` 拥有；
- consumer只使用 bounded `diagnostic.category/reason/next` 和既有 recovery handoff；
- 顶层 summary不能成为 recovery authority；
- 不在 `node-specification` 复制 public diagnostic schema。

### 与 guards 的关系

Legacy audit 的 D-1 说明 current-layer词表/探测器没有覆盖这些旧合同。Change 1 不需要吸收整份 legacy
detector backlog，但必须为自己修复的两类回流增加 falsifiable checks：

- retired Page Authority visual-language path；
- consumer `branch on code/hint` recovery合同。

Guard证据需要 planted violation、修复后原状态重新通过，以及无法通过移动文件逃逸 scope。

## Change 2 吸收项

### Hidden `image2-raw` alias

`image2-raw` 被 `env_check.mjs` 接受并等同 `raw-generation`，但 help不公开。Change 2
`align-doctor-operation-readiness` 要统一 doctor与实际 operation source，因此不能继续保留一个不在
public registry里的隐藏 operation alias。

默认处理是移除 alias并保留唯一 current名 `raw-generation`；若 proposal发现真实 current consumer，
则必须先记录兼容/cutover authority，不能静默保留双名。

### Empty `assembly-notes` readiness

`assembly-notes` 出现在 accepted set和 help，却落到 common fallback，没有验证它所声称的装配/notes
readiness。它与 BUG-070 共享同一个更基础的不变量：**READY 必须来自该 operation真正会使用的 startup
facts，而不是 generic成功。**

Change 2 的 design必须二选一：

- 为 `assembly-notes` 建立真实、bounded、无 secret 的 readiness checks；或
- 从 accepted/help surface移除，直到有 owner实现。

不能继续保留“公开 operation存在，但 READY不检查其能力”的中间状态。

## Change 3 吸收项

### H-2：不存在的 `--check-gates`

Change 3 修改 `validate` 与 state observation合同；此时必须同时修正 `node-specification` 和实现注释中
不存在的 `--check-gates`，与实际 help和 `--validate-state` / owner operations对齐。

这项不应提前放进 Change 1，因为它不影响 Page Image source failure envelope；放进 Change 3 可以在同一
public observation cutover中验证 help、spec、实现和 consumer。

### M-3：retired `mode` vocabulary

Change 3 只清理它实际修改的 requirement中的 `mode` / `source-mode pair`，统一为 selected workflow、
production identity或准确 owner term。全仓其他 `mode` finding仍由 legacy audit拥有，避免本 change变成
术语扫荡。

## 明确延期，不并入本路线图

以下 finding重要，但与当前三个 terminal invariants不同：

- M-1/M-2：`protected geometry` / `protected zone` 全仓术语统一；
- M-5 #1-#5：retired build plumbing、`validateResolution()`、空壳 wrapper和不可达 doctor branch；
- M-6/L-1：serialization schema/code mirror漂移；
- M-7、D-2、D-3、D-4：通用 ledger/import/CONTEXT探测器增强，除非 Change 1 design证明它们是本 guard的
  必要依赖；
- M-8/M-9/L-2/L-3：无关文档、spec重复定义和测试措辞；
- H-3/L-4/L-5：production deck内容、导航和孤儿产物。

这些项目不能以“顺手清理”为理由进入 Change 1-3。若实施时触及同一行，只允许做当前 requirement所需的
最小修改；其余仍回到 [`../../../plans/current-layer-legacy-trace-audit.md`](../../../plans/current-layer-legacy-trace-audit.md)。

## 对 change 数量的影响

没有新增 change。最终仍是 3 个：

1. Change 1 同时关闭 source fact、consumer recovery合同和对应 current-layer guards；
2. Change 2 同时关闭 runtime startup source与 doctor operation registry真实性；
3. Change 3 同时关闭 validate observation、错误 state flag和触及范围内的 retired authority vocabulary。

这个合并减少 OpenSpec开销，同时维持三个不同 terminal invariants，不把 legacy cleanup变成无边界的大扫除。
