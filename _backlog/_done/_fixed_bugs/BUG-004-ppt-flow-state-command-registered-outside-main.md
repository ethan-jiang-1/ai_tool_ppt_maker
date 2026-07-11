# BUG-004: `ppt_flow.mjs` 的 `state` 子命令在 `main()` 外注册，引用越界的局部 `program`

> 严重级别: P1（BUG-003 修复后立即升级为阻断） | 发现: 2026-07-11 | 状态: 已修复（fix-ppt-flow-cli-startup）

## 症状

当前被 [BUG-003](BUG-003-ppt-flow-frozen-style-presets-sort.md) 掩盖（进程在 933 行先崩、`process.exit(1)`，跑不到这里）。

一旦 BUG-003 修好，模块加载到文件尾部 `ppt_flow.mjs:1176` 会因引用未定义的 `program` 抛 `ReferenceError: program is not defined`（模块顶层求值失败 → 所有命令再次全崩）。即便不抛，`state` 子命令也**从未真正挂到 `parseAsync` 实际使用的那个 `Command` 实例上**——是死代码，`ppt_flow.mjs state …` 不会生效。

## 根因

- `ppt_flow.mjs:890`：`async function main()` **内部**声明 `const program = new Command()`——函数作用域局部变量。
- `ppt_flow.mjs:1176` 起的 `program.command('state')…`：位于 **`main()` 之外的模块顶层**（在 `if (isMain) main().catch(...)` 之后）。此处 `program` 不在作用域内（全文件再无第二个 `program` / `new Command` 声明，已 grep 确认）。

两个结构问题叠加：

1. **作用域**：模块顶层引用 `main()` 的局部 `program` → 越界。
2. **时序**：即便 `program` 可见，这次 `.command()` 注册也发生在 `main()` 已调用、`program.parseAsync`（1153 行）已开跑**之后**——注册太晚，`state` 永不生效。

**正确做法**：把 `state` 命令定义**移进 `main()` 内**、与其余 11 个命令并列、在 `program.parseAsync` **之前**注册。

## 复现

当前被 BUG-003 掩盖。需先本地临时修掉 933/522/945 三处冻结 `.sort()` 后：

```
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor
# → ReferenceError: program is not defined   (ppt_flow.mjs:1176)
```

## 修复关联

待排期，本卡**只报不修**。建议与 BUG-003 放同一个 OpenSpec change 一并修（都是 `ppt_flow.mjs` 入口结构问题），或紧随其后。见 BUG-003。
