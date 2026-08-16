# Proposal: Remove retired plumbing and harden detectors

## Why

`current-layer-legacy-trace-audit`(`_backlog/plans/`)Change 2(串行纪律:Change 1 已
archive)。审计发现:当前层代码与探测器之间存在两类未清理的退役残留与检测盲区。

**代码侧(退役 plumbing)**:`ppt_flow.mjs` 的 `build` 命令携带 8 个不可达退役参数
(`resolution`/`model`/`baseUrl`/`reuseImages`/`dryRun`/`force`/`reason`/
`retiredControlsExplicit`)——唯一调用链硬编码 null/false、命令未注册任何 `.option()`,
其中 `resolution`/`model` 解构后从未被引用;`validateResolution()` 全仓零调用;
`commandDoctor` 的 `--image2` 拒绝分支不可达(调用方硬编码 `image2: false`);
`commandBuildWrapped` 是仅承载退役 8 字段的空壳转发层;`commandBuild` JSDoc 列 7 个退役
字段且漏第 8 个。这些残留让 Agent 读到「build 可接受 resolution/model/force 覆盖」的假象。

**测试侧**:`harness-governance-ledger.json:36` 的 `source` 指向已删除的
`state.mjs:validateProductionModeStructure`(死指针,漏网因 ledger 测试只校验 source
非空、从不 resolve 符号存在性);`test_harness_architecture.mjs:61` 的 `05-iteration/`
分支是重编号后的死分支;`workflow-control-ledger.json:32` 失效条件描述仍用退役词
`production-mode`。

**探测器盲区(audit 根因)**:现有探测器(`harness_architecture.mjs` +
`harness_coherence.mjs`)词表不含 `protected geometry`/`protected zone`、build/doctor
退役参数词、`--check-gates`、`mode` 短语——这正是 M-1/M-2/M-3/H-2 对探测器不可见的
原因;import 边校验对指向不存在文件的本地 import 静默跳过;ledger `source` 不 resolve。

CLS-038 已吸收 M-5#6(`assembly-notes` 从操作注册表移除)与 M-5#7 的 operation 别名部分;
`image2-raw` 仍作为 profile 展示名残留在 env-check 4 处。本 change 处理剩余全部。

## What Changes

- **M-5 #1-5 死代码删除**(`ppt_flow.mjs`):
  - `commandPageImageBuild` 删除 8 个退役参数与拒绝守卫 → 只收 `route`;
    `commandBuild` 不再透传 opts;`commandBuildWrapped` 空壳层删除;
    build 命令 action 直接调用 `commandBuild(runDir)`;JSDoc 同步。
  - `validateResolution()` 函数删除(全仓零调用)。
  - `commandDoctor` 删除 `image2` 参数与 `--image2` 拒绝分支;调用方不再传
    `image2: false`;JSDoc 同步。
  - 行为不变:build 仍只接受 `<run_dir>`,doctor 仍只接受现行 flags;命令/输出/退出码不变。
- **M-5 #7 收尾**(`env_check.mjs`):`PAGE_IMAGE_DOCTOR_PROFILES` 的 `image2-raw`
  profile 展示名统一为 `raw-generation`(4 处:profile 列表 + plan 的 active/
  deferredProfiles + deferred 判断),消除重构前命名残留的静默别名。
- **M-7 测试死指针/死分支**:
  - `harness-governance-ledger.json:36` `source` 改指现存符号
    `scripts/shared/state/state.mjs:inspectRunProductionIdentity`(现行校验/身份入口)。
  - `test_harness_architecture.mjs:61` `05-iteration/` 死分支改 `06-iteration/`(与
    `EXECUTABLE_INVENTORY` 的 `06-iteration/index.mjs` 对齐)。
- **L-3 测试措辞**:`workflow-control-ledger.json:32` `"production-mode change"` →
  `"production-workflow/identity change"`。
- **D-1 探测器词表扩面**(`harness_architecture.mjs` `RETIRED_CONTROL_SURFACE_RULES` +
  `harness_coherence.mjs` `STALE_RULES`):
  - `protected geometry`/`protected-geometry`/`protected_geometry`、
    `protected zone`/`protected-zone`/`protected_zone`;
  - build 退役参数(`--resolution`、`--model`、`--reuse-images`、
    `retiredControlsExplicit`)、`--check-gates`;`mode` 短语
    (`durable mode`/`source/mode pair`/`infer mode`)。
  - **明确排除**:`--base-url`/`--force`/`--reason`/`--dry-run`/`--image2`/`--mode`
    有现行活拒绝/合法面(style-master abandon 的 `--reason` 是合法参数;image2 命令面
    活拒绝这些覆盖;env-check/bundle-layout 活拒绝 `--image2`/`--mode`),加入词表会
    误报当前层活拒绝代码(实测 23 处误报),故不进词表——其残留检测由 build/doctor
    死参数删除 + cli-surface 固定形式 spec 承载。
  - 新增 planted-violation 测试证明词表能抓上述残留(与既有 guard 测试同构)。
- **D-2 import 边校验**:`validateImportEdge` 对 `!target || !files.has(target)` 的
  静默跳过改为发出 `stale-import-target` 告警(指向不存在的本地 import 目标)。
- **D-3 ledger source resolve**:`test_harness_governance_ledger.mjs` 增加对
  `source` 指向符号存在性的 resolve 校验(否则死指针永远静默通过)。
- **D-4(可选,若验证成本低)**:对 CONTEXT.md「实现仍在使用」反向过期句式做实现侧
  grep 复核断言。若实现复杂则记录豁免,不强行扩面。

无 **BREAKING**:无命令/flag/输出/退出码行为变化;纯死代码删除 + 探测器扩面 +
测试修正。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `cli-surface`:`build`/`doctor` 命令面删除不可达退役参数与守卫;文档/JSDoc 同步。
- `environment-check`:profile 展示名 `image2-raw` → `raw-generation`(无 CLI 行为变化)。
- `harness-script-layout`:import 边校验对不存在目标的静默跳过 → `stale-import-target`
  告警;探测器词表扩面 + planted-violation 防回归。
- `harness-directory-layout`(或既有 guard 归属 capability):若 D-2/D-3 的断言归属
  该 spec,则同步其 requirement(实施时按 guard 实际归属落位)。

(测试修正 `harness-governance-ledger.json`/`test_harness_architecture.mjs`/
`workflow-control-ledger.json` 随 guard/测试 capability 落地,不新增 capability。)

## Impact

- **Harness 源码**:`ppt_maker_harness/scripts/ppt_flow.mjs`、
  `ppt_maker_harness/scripts/00-setup/internal/env_check.mjs`、
  `ppt_maker_harness/scripts/contracts/harness_architecture.mjs`、
  `ppt_maker_harness/scripts/contracts/harness_coherence.mjs`。
- **测试**:`tests/contracts/harness-governance-ledger.json`、
  `tests/contracts/test_harness_architecture.mjs`、
  `tests/contracts/test_harness_governance_ledger.mjs`、
  `tests/contracts/workflow-control-ledger.json`;新增 planted-violation 测试。
- **OpenSpec**:main specs 3-4 个 capability(上述 Modified)。
- **验证**:`npm test`(core:architecture/coherence guard)、`npm run test:sweep`、
  planted-violation 测试、`openspec validate --strict` + `--all --strict`、
  `git diff --check`;`ppt_flow build/doctor --help` 抽查(输出不变)。
- **Run-bundle contract impact**:`none`。
- **Policy 引用**:死代码删除 = 净简化(`simple-reliable-control.md`);探测器扩面是
  gate 层增强(能抓同类残留,正是 audit D-1 的根因修复),不新增控制层复杂度。
