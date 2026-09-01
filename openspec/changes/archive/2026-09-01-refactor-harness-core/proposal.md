## Why

`scripts/` 目录 111 个 `.mjs` 文件合计 45,399 行，其中 **8 个文件占了 43%**（19,741 行）。三个最大的可拆文件（`03-framed-image/index.mjs` 2021 行、`shared/cli/command_support.mjs` 2493 行、`shared/state/state.mjs` 3583 行）各自混合了多个独立关切，导致：

- Coding Agent 上下文窗口压力大——修改一个函数需要理解 2000+ 行的文件
- 模块边界模糊——review 逻辑、delivery 逻辑、raw 编排混合在同一个 index.mjs 中
- 测试 import 路径依赖巨大单体，改动恐惧度高

本次 change 是纯代码重组，**不改变任何行为**。

## What Changes

1. **拆分 03-framed-image/index.mjs（2021 行）和 04-pure-image/index.mjs（1510 行）**：
   - 将逻辑从 index.mjs 移到 `internal/` 子模块，按职责拆分（raw_plan、review、final_manifest、progressive、refresh、orchestration、identity）
   - index.mjs 变为纯 re-export 层（与 01-content、02-visual 保持一致）
   - 04-pure-image 采用完全相同的镜像结构

2. **拆分 shared/cli/command_support.mjs（2493 行，98 exports）**：
   - 按 7 个独立关切拆分为 `cli_diagnostics.mjs`、`cli_image2_response.mjs`、`cli_style_master.mjs`、`cli_status.mjs`、`cli_artifact_view.mjs`、`cli_deadline.mjs`
   - command_support.mjs 保留核心 adapter 解析功能并设 compat re-export 过渡层

3. **拆分 shared/state/state.mjs（3583 行，95 exports）**：
   - 按 6 个独立关切拆分为 `state_execution.mjs`、`state_identity.mjs`、`state_evidence.mjs`、`state_progressive.mjs`
   - state.mjs 保留核心 I/O 并设 re-export 过渡层

## Capabilities

**纯重构，无 spec-level 行为变化。** 所有 export 签名不变，import 路径通过过渡层保持兼容。

此 change 设置 `skip_specs: true`。

## Impact

| 维度 | 影响 |
|------|------|
| 源码范围 | `ppt_maker_harness/scripts/03-framed-image/`、`04-pure-image/`、`shared/cli/`、`shared/state/` |
| 测试范围 | `tests/` 中引用上述文件的测试（~31 个文件需更新 import 路径） |
| 行为变化 | **无**。所有 export 签名不变，index.mjs/state.mjs/command_support.mjs 保留 re-export 过渡层 |
| Run-bundle contract | `none`——不改变任何 run-bundle 结构、state 格式、CLI 输出或诊断协议 |
| Control owner | JS——纯代码重组，不涉及 MD Controller 或 Agent 流程 |