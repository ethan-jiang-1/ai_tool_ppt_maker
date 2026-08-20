# BUG-093: Image2 Lab self-heal 被 Harness binding 阻断，且 scaffold 在 symlink 检查前写入

> 严重级别: P1 | 发现: 2026-08-20 | 状态: 待修复 | 角色: bug

## 症状

更新前创建的 run bundle 可能没有 deck-root `_lab/`。现行规范要求下一次操作机械补齐
Lab scaffold，但 standalone Lab CLI 无法完成这个恢复：

1. `lab_cli.mjs` 先调用 `verifyDeckHarnessBinding()`；
2. binding 内的 `checkDeckRootControls()` 把缺失 `_lab/` 判为
   `deck_root_unverified`；
3. `ensureLabScaffold()` 位于 binding 之后，因此永远不可达。

在 `deck_ai_org_transform_keynote` 上，只能先从 run-bundle 数据侧补齐 canonical
`_lab/` scaffold，之后 Lab plan 才能运行。这个绕行说明旧 bundle 的 touch-heal 合同
没有由 Harness 自己闭合。

另有同一路径上的写入顺序问题：`lab_cli.mjs` 当前先执行
`ensureLabScaffold(root)`，之后才用 `confinedDirectoryComponents()` 检查 `_lab/`。
如果 deck-root `_lab` 是指向 deck 外部目录的 symlink，scaffold 可能先在外部目标写入
`README.md`、`.gitignore`、`fixtures/` 或 `runs/`，然后 CLI 才拒绝该路径。

## 影响

- 历史 run bundle 缺 `_lab/` 时，规范声明的 guide-level self-heal 不可达。
- Deck Author 必须手工或由外部 Agent 先建目录，才能进入 Lab，形成双重恢复路径。
- 恶意或误配置的 `_lab` symlink 可能使 Harness 在完成 confinement admission 前写到
  deck 外部。
- 普通 PPT flow 不应读取 Lab trial；本 bug 只涉及 run-bundle binding、Lab scaffold
  恢复与写入边界。

## 可重复信号

### A. 缺失 scaffold

1. 用 `initBundle` 创建合法 deck/run。
2. 删除 deck-root `_lab/`。
3. 对 exact run 执行 Lab `plan`，使用合法 candidate 与 prompt。
4. 当前结果：非零退出，binding 报 `deck_root_unverified`；scaffold 未创建。
5. 期望结果：binding 只容忍“完整缺失且可修复”的 `_lab/`，Lab 在业务写入前创建
   canonical scaffold，然后继续 plan。

### B. symlink workspace

1. 用 `initBundle` 创建合法 deck/run。
2. 将 deck-root `_lab` 替换为指向 deck 外普通目录的 symlink。
3. 对 exact run 执行 Lab `plan`。
4. 当前风险：`ensureLabScaffold()` 可能先在 symlink 目标写入，再报告路径不安全。
5. 期望结果：第一次 scaffold 写入前拒绝，外部目录保持字节不变。

## 期望

- Binding 仍拒绝 `_lab` 为文件、symlink、部分损坏目录或其他不可安全修复形态。
- Binding 可以把“仅 `_lab/` 完整缺失”识别为 repairable absence，使声明的
  touch-heal 路径可达；不要把缺失 Lab 当成整个 deck 身份不可验证。
- Lab owner 在任何 scaffold 写入前验证现存 `_lab` 路径组件；创建后再复核最终目录。
- 修复不得让 production generate/probe 读取 `_lab/`，不得把 Lab 变成生产权威。
- 增加回归测试，分别锁定 missing-scaffold self-heal 与 symlink target 零写入。

## 当前绕行

只在用户指定的 run bundle 数据目录内创建 canonical `_lab/` scaffold，再运行 Lab。
不得手改 `_generated/`、State、receipt 或 Harness 源码；不得把历史 `_scratch` 结果提升
为当前 Lab trial。

## 现场关联

- Run bundle: `deck_ai_org_transform_keynote/3_versions/v1`
- 已补数据: `deck_ai_org_transform_keynote/_lab/`
- 历史经验: `deck_ai_org_transform_keynote/_lessons/image2-vendor-experiments.md`
- 设计来源: `_backlog/_done/_closed_plans/image2-capability-tuple-and-lab.md`

