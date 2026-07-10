## Why

PPT 打磨是循环往复的——Agent 试了 3 次才过 wave0，用户改了 2 次主意才 approve visual gate，rerun 走了 2 轮才到 final。但当前 `run-bundle-state.yaml` 单文件只记录"现在是什么"，不记录"怎么变成这样的"。单文件还有单点故障——损坏则全丢。

同时，playbook 体系定义了 Node 的 entry/exit gate，但 gate 条件只存在于 frontmatter 的人读字符串中——没有可执行的校验逻辑。测试只能验数据存取，不能验流程正确。

测试倒逼设计：要写出有意义的 state machine 测试，必须先定义 gate 条件如何被检查、state 如何健壮地持久化。

## What Changes

**1. State 从单文件 → 文件系统分片 + Append-Only Trace**

```
之前: run-bundle-state.yaml (单文件, 覆写, 坏了全丢)
之后: _state/
      ├── trace.jsonl     ← 只追加事件流, 永不覆写 (崩溃安全)
      ├── nodes.yaml      ← 当前快照, 可从 trace 重建
      ├── gates.yaml      ← gate 状态, 可从 trace 恢复
      └── session.yaml    ← 当前 session, 可丢
```

四层防护: trace 几乎不可损坏; nodes/gates 坏了从 trace 重建; session 丢了从 nodes 推断; _state/ 全删才不可恢复。

Trace 记录完整轨迹——试了多少次、改了几次主意、rerun 绕了几圈——全在 append-only JSONL 里。

**2. charter/NODE-SPEC.md 补全 Gate Conditions Catalog + State API spec**

可执行的条件词汇表: FILESYSTEM (8 条件, 精确到 run bundle 路径)、STATE (6 参数化条件, 精确到 `_state/nodes.yaml` 字段)、USER (3 条件)。不在 catalog 中的 → `unknown`，Agent 人工判断。

**3. state.mjs 实现完整 State API**

READ/QUERY/VALIDATE/WRITE + CONDITIONS 注册表 + checkEntry/checkExit + 原子写 + corruption 检测 + trace 追加 + nodes 重建。

**4. CLI: ppt_flow state 命令**

`state <runDir> [--json|--check-gates]`——人类可读摘要、JSON 输出、gate 验证。

**5. Playbook frontmatter 对齐 + 测试**

31 个条件名从 prose 映射到 catalog 标准名。e2e 测试覆盖 gate 校验、node_done、playbook 栈、原子写、corruption 恢复、rerun 循环。

## Capabilities

### Modified Capabilities

- `node-specification`: charter/NODE-SPEC.md 新增 Gate Conditions Catalog + State API + Trace 格式
- `playbook-execution`: state 从单文件→多文件分片; state.mjs 完整 API; ppt_flow state 命令
- `state-simulation-tests`: tests_e2e/ 扩展到 16 tests
