# BUG-003: `ppt_flow.mjs` 对冻结的 `STYLE_PRESETS` 调 `.sort()`，所有子命令启动即崩

> 严重级别: P0（阻断） | 发现: 2026-07-11 | 状态: 已修复（fix-ppt-flow-cli-startup）

## 症状

`node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs <任意子命令>`（`doctor` / `init` / `status`，甚至不带子命令裸跑）**全部**立即报：

```
✗ Fatal error: Cannot assign to read only property '0' of object '[object Array]'
```

而且不给任何堆栈（`main().catch` 只打印 `err.message`）。BOOTSTRAP / AGENTS 里作为**唯一统一入口**的 `ppt_flow.mjs` 完全不可用——环境检测(doctor)、脚手架(init)、状态(status)、构建(build) 全线阻断。

真实堆栈（临时把 catch 的 `err.message` 换成 `err.stack` 才看得到）：

```
TypeError: Cannot assign to read only property '0' of object '[object Array]'
    at Array.sort (<anonymous>)
    at main (PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs:933:38)
    at file://…/ppt_flow.mjs:1169:3
```

## 根因

`bundle_layout.mjs:166` 定义 `export const STYLE_PRESETS = Object.freeze([...])`——**冻结数组**。

`ppt_flow.mjs:933`（`init` 命令 `--style` requiredOption 的描述串）写成：

```js
`Style preset: ${STYLE_PRESETS.sort().join(", ")}`
```

`Array.prototype.sort()` 是**原地**排序（会写 `arr[0]=…`）。对 `Object.freeze` 的数组，在 ESM 严格模式下写元素直接抛 `TypeError: Cannot assign to read only property '0'`。

要命的是这一行在**命令定义阶段**执行（`main()` 同步体，早于 `program.parseAsync`）——所以无论跑哪个子命令、甚至不带子命令，`main()` 都在 933 行同步抛出 → 返回 rejected promise → `main().catch` 打印 message 后 `process.exit(1)`。这就解释了"每个命令都崩、且看不到堆栈"。

对比：`bundle_layout.mjs:574` 用的是正确写法 `[...STYLE_PRESETS].sort()`（先浅拷贝再排序）。**正确范式在同一个仓库里本来就有**，`ppt_flow.mjs` 只是漏了展开。

## 复现

```
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor
# → ✗ Fatal error: Cannot assign to read only property '0' of object '[object Array]'
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs
# → 裸跑同样崩
```

## 契约探针 · 横切（同类缺陷全量清点）

把这条 bug 当契约探针，横切"对导入的冻结常量数组用原地变异方法（`.sort` / `.reverse` / `.splice`）"这一整类。`ppt_flow.mjs` 中共 **3 处**，全部作用于冻结的 `STYLE_PRESETS`：

| 位置 | 上下文 | 影响 |
|------|--------|------|
| `ppt_flow.mjs:933` | `--style` 选项描述串 | **定义期执行 → 当前 P0 崩溃点** |
| `ppt_flow.mjs:522` | `commandInit` 前置校验 "Unknown style" 提示 | 潜伏（走到才炸） |
| `ppt_flow.mjs:945` | `init` action 内 "Unknown style" 提示 | 潜伏（走到才炸） |

（各处 `Object.keys(DECK_TYPE_TEMPLATES).sort()` **安全**——`Object.keys` 每次返回全新数组。）

**修复范式**：三处一律改为 `[...STYLE_PRESETS].sort()`，与 `bundle_layout.mjs:574` 对齐。可选加固：在 `bundle_layout.mjs --self-check` 或 CI 加一条静态检查——"禁止对导出的 `Object.freeze` 数组直接 `.sort/.reverse/.splice`"。

## 相邻发现

见 **BUG-004**（`state` 子命令在 `main()` 外注册、引用越界的局部 `program`）——修完 BUG-003 后会立即浮现。

## 修复关联

待排期，本卡**只报不修**。建议一个窄 OpenSpec change（如 `fix-ppt-flow-frozen-preset-sort`）一并处理 933/522/945 三处 + 自检加固，并与 BUG-004 合并考虑（同为 `ppt_flow.mjs` 入口结构问题）。
