# Tasks: remove-retired-plumbing-and-harden-detectors

> 排序：spec（行为权威）→ 死代码删除 → 探测器扩面 + 测试修正 → 验证 → archive。
> 红线：无命令/flag/输出/退出码/行为变化；不动序列化字段
> （`header_region`/`protected_composition`/`reserved_header`/`body_safe`）。

## T1 Spec 措辞（3 个 capability 的 MODIFIED 落位）

- [x] **T1.1** `cli-surface`：`Public CLI exposes only declared current Page Image Workflow
  operations` MODIFIED——build 只接受 `<run_dir>`、禁退役参数覆盖；doctor 禁 `--image2`；
  新增场景「Build help exposes no retired overrides」。
  - 完成判据：`openspec validate remove-retired-plumbing-and-harden-detectors --strict` 通过；
    build/doctor 的退役参数约束在 delta 中有明确表述。
- [x] **T1.2** `environment-check`：`Doctor operations are backed by real owner readiness`
  MODIFIED——profile 标识 `image2-raw` → `raw-generation`；报告不得暴露退役 profile 名；
  新增场景「Readiness report uses only current profile names」。
  - 完成判据：delta 明确 profile 标识约束；场景标题与 main 一一对应（archive 不拒）。
- [x] **T1.3** `harness-script-layout`：`Architecture guard rejects diagnostic owner bypass
  and second attributors` MODIFIED——检测项扩为 6 类（新增退役词回流 + 不存在 import
  目标）；新增场景「A planted stale import target is reported」。
  - 完成判据：delta 检测项 (5)/(6) 明确；场景标题对应。

## T2 死代码删除与命名统一（apply 阶段）

- [x] **T2.1** `ppt_flow.mjs` M-5 #1-5：
  - `commandPageImageBuild` 签名收 `route` 仅，删 8 退役参数与拒绝守卫；
    `commandBuild(runDir)` 直接调；JSDoc 同步（删 7 退役字段）。
  - `commandBuildWrapped` 空壳层删除；build action 直连 `commandBuild(runDir)`。
  - `validateResolution` 函数删除。
  - `commandDoctor` 删 `image2` 参数与拒绝分支；调用点删 `image2: false`；JSDoc 同步。
  - 完成判据：`grep -n "commandBuildWrapped\|validateResolution(" ppt_maker_harness/scripts/ppt_flow.mjs` 清零；
    `ppt_flow build --help` / `ppt_flow doctor --help` 输出与修改前一致（只去死参数）。
- [x] **T2.2** `env_check.mjs` M-5 #7 收尾：`PAGE_IMAGE_DOCTOR_PROFILES` 的 `image2-raw`
  → `raw-generation`；`pageImageDoctorPlan` 的 unbound/raw-generation 分支 profile 引用
  与 deferred 判断同步（4 处）。
  - 完成判据：`grep -rn "image2-raw" ppt_maker_harness/scripts/` 清零；
    `--operation raw-generation` 的 doctor 报告 profile 名为 `raw-generation`。
- [x] **T2.3** M-7 测试修正：
  - `harness-governance-ledger.json:36` source →
    `scripts/shared/state/state.mjs:inspectRunProductionIdentity`。
  - `test_harness_architecture.mjs:61` `05-iteration/` → `06-iteration/`。
  - 完成判据：`grep -n "validateProductionModeStructure" .` 清零（仅归档/审计记录除外）；
    `05-iteration/` 死分支不再出现。

## T3 探测器扩面与测试增强（apply 阶段）

- [x] **T3.1** `harness_architecture.mjs` D-1 词表扩面：`RETIRED_CONTROL_SURFACE_RULES`
  新增 protected-geometry/zone 词形、build/doctor 退役参数、`--check-gates`、
  retired-mode-phrase（见 design §3）；保持 `EXPLICIT_RETIRED_CONTROL_REJECTION`
  前置判定（拒绝句不报）。
- [x] **T3.2** `harness_architecture.mjs` D-2：`validateImportEdge` 对
  `!target || !files.has(target)` 不再静默跳过——当目标是本地相对解析路径
  （`.` 开头 specifier）且不存在时发出 `stale-import-target` 告警；裸包名
  （`yaml`/`node:*`/`vitest` 等）与解析返回 null 的 specifier 照旧跳过。
  - 完成判据：喂入不存在的相对 import 目标 → 告警；裸包名 import → 不告警；
    既有 guard 测试全绿（当前仓库 0 个现存死 import）。
- [x] **T3.3** `harness_coherence.mjs` D-1 同步 + D-4：`STALE_RULES` 扩面同词表；
  `scanHarnessCoherence` 把 `CONTEXT.md` 纳入扫描；新增「still uses」反向过期句式规则
  （仅 CONTEXT.md）。
- [x] **T3.4** D-3：`test_harness_governance_ledger.mjs` resolve `source` 符号存在性——
  解析两种格式：`path:funcName`（文件存在 + 该函数名在当前文件声明）与纯 `path`
  （文件存在）。`validateProductionModeStructure` 死指针在修复后必须通过该 resolve。
  - 完成判据：ledger 全部 4 条 source resolve 成功；喂入不存在的函数名 → 测试失败。
- [x] **T3.5** L-3：`workflow-control-ledger.json:32` `"production-mode change"` →
  `"production-workflow/identity change"`。
- [x] **T3.6** 新增 planted-violation 测试（与既有 guard 测试同构）：喂入
  protected-geometry/zone、`--check-gates`、build 退役参数、mode 短语、不存在 import
  目标，断言 guard 抓到；修复后必过。
  - 完成判据：planted 用例全部被抓；`npm test` core 全绿。

## T4 验证与收尾

- [x] **T4.1** grep 清零矩阵（design §4）：`image2-raw`、
  `retiredControlsExplicit`、`validateResolution(`、`commandBuildWrapped`、
  `validateProductionModeStructure` 引用、`production-mode change` 措辞清零。
- [x] **T4.2** `npm test`、`npm run test:sweep`、`openspec validate --strict` +
  `openspec validate --all --strict`、`git diff --check` 全绿；
  `ppt_flow build --help` / `ppt_flow doctor --help` 行为不变抽查。
- [x] **T4.3** archive；更新 `_backlog/plans/current-layer-legacy-trace-audit.md` 的
  Progress Tracker（Change 2 → done，Change 3 → NEXT）+ 顶部状态行。
- [x] **T4.4** 豁免记录复核：D-4 低成本版（仅 CONTEXT 纳入扫描 + still-uses 句式）与
  audit 建议一致；如实现成本过高则记录豁免并说明。
