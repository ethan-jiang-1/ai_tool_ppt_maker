# BUG-066: `ppt_flow build` 针对非 active run 会把 `execution_run_version_mismatch` 三键写进 `_state/state.yaml`

> 严重级别: P1 | 发现: 2026-08-09 | 状态: 已修复（2026-08-10）

## 症状

当一个 deck 的 state `run_version` 指向某版本（例如创建 v2 后 active 是 v2），对**另一个非 active 版本**跑 `ppt_flow build <run-dir>`（例如 `build .../3_versions/v1`），会在 `_state/state.yaml` 末尾追加：

```yaml
code: execution_run_version_mismatch
requested_run_version: v1
active_run_version: v2
```

之后 `readState` 报 `replacement_required: current state requires owner repair: unknown top-level state key code`，该 deck 所有版本（包括 active 的 v2）的 inspection 都变成 `hard-stop: validate-state` / `STATE_UNAVAILABLE`，直到手工清掉这三行。build 本身以 `STATE_UNAVAILABLE` 失败。

实测（`deck_dark_factory_current`，active=v2）：`validate v1` 不污染；`build v1` 污染。副本上验证稳定复现。

## 根因

`build` 的 delivery 写入路径在某处对**请求的 runVersion**（v1）调用 `readState`，得到 `selectedExecutionMismatch` 返回的 `{code: execution_run_version_mismatch, requested_run_version, active_run_version}` 合并对象；随后该调用方把这份**带 mismatch 键的 state 对象** clone 后 `writeState` 持久化。`prepareStateWrite` / `writeState` 只剔除 `_healed`/`_heal_pending`/`durable_state_present`，不剔除 `code`/`requested_run_version`/`active_run_version`，于是这三个键落盘，`validateState` 的 `STATE_TOP_LEVEL_KEYS` 白名单拒绝 `code` → 整个 state 被判损坏。

这属于 `readState` 把"mismatch 诊断键"合进返回对象 + 某个写路径直接持久化该对象的**契约级缺口**：诊断信息本不该成为可写回 state 的顶层键。与此前观察到的 `activateCleanPageImageTargetDraft` 偶发写坏 state 属同一根因族。

## 复现

1. 对任意多版本 deck，确保 state `run_version` = v2（`new-version v2` 即可）。
2. `node ppt_maker_harness/scripts/ppt_flow.mjs build <deck>/3_versions/v1` → `STATE_UNAVAILABLE`。
3. `tail _state/state.yaml` → 出现 `code: execution_run_version_mismatch` 三行。
4. 任何 `ppt_flow state` / `status` 后续全部 `STATE_CORRUPTED / replacement_required`。

## 修复关联

OpenSpec change `harden-inactive-run-state-writes` 已实现、同步主规格并归档于
`openspec/changes/archive/2026-08-10-harden-inactive-run-state-writes/`。

## 修复结果

已完成：

- `readState` 保持 durable state grammar；请求 run 与 active run 的差异改由独立、不可写回的 execution-resolution result 表达。
- CLI 与 Pure/Framed 的已盘点 Page Image mutation API 均在任何 source、`_generated`、state、history 或 provider side effect 之前验证 exact active execution；inactive run 返回受限的 `FAILED/gate` 回执。
- `writeState` 在创建临时文件前校验完整 candidate grammar 与身份语义，未知顶层键（包括 BUG-066 的诊断键）不能再落盘。
- 仅针对精确 BUG-066 三键签名提供 `ppt_flow state <active-run> --repair-known-execution-mismatch`：受 active run、source identity、journal 与 CAS 保护，成功后幂等并留下 history event。
- State、Pure、Framed 和 CLI mock E2E 回归已覆盖 inactive run 的零写入、精确修复与拒绝更宽损坏记录的边界。

### 未完成但不构成 BUG-066 未修复

- **不会自动扫描或批量修复既有 deck。** 这是有意的：只有 owner 显式对 active run 调用精确 repair，避免把未知损坏误判为可修复状态。
- **不会修复非精确三键签名。** 多余未知键、版本不一致、source/journal/CAS 冲突仍为 non-writing hard-stop；这比泛化“清字段”更安全。
- **未来新增的副作用 API 仍需维护 operation map 和 negative coverage。** JavaScript 无法可靠从 export 推断 side effect；当前 map 是受测试约束的维护清单，不应伪装成第二个自动权威。即使遗漏前置 guard，`writeState` 的完整 candidate 校验仍会阻止本 bug 的 state 污染，但遗漏 API 可能在到达 State 前创建派生产物或触达 provider。

### Follow-up 判断

当前**不建议**为最后一项单独 propose change。它是已接受的维护风险，不是已复现缺陷；强行自动化会新增一套容易漂移的“副作用分类”机制。

只有出现以下信号时才应提案：新增的 Page Image public mutation API 漏过 preflight、operation map 经常在 review 中遗漏，或 API surface 明显增长到人工清单不可审计。届时应设计一个由单一 guarded public-operation factory 导出的闭合 API surface，而不是再加静态 export 扫描或第二份名单。
