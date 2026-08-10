# BUG-066: `ppt_flow build` 针对非 active run 会把 `execution_run_version_mismatch` 三键写进 `_state/state.yaml`

> 严重级别: P1 | 发现: 2026-08-09 | 状态: 活跃

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

需一个 OpenSpec change：让 `readState` 的 mismatch 返回对象（`code`/`requested_run_version`/`active_run_version`）永不进入可写回 state 的路径——写路径要么先对这份对象做"剔除诊断键"的规范化，要么在 `initializeTargetPageImageState` 等入口对非 active run 直接走 `TARGET_SOURCE_EXECUTION_MISMATCH` 并抛错、不写盘。同时给 `writeState`/`prepareStateWrite` 加防御：顶层出现未知键（尤其 `code`）时拒绝写入而非静默持久化。修完按 `_backlog/bugs/README.md` 归档步骤移到 `_done/_fixed_bugs/`。
