# Design: Remove retired plumbing and harden detectors

## 决策概览

| 决策 | 结论 | 拥有侧 |
|---|---|---|
| 修改面 | 3 个 main spec（MODIFIED）+ 4 个源码/测试文件 + 2 个 ledger JSON | 代码/测试/探测器（纯删除 + 检测扩面，无行为变化） |
| M-5 #1-5 | `ppt_flow.mjs` build/doctor 退役参数与空壳层删除 | 死代码删除 |
| M-5 #7 收尾 | `env_check.mjs` profile 展示名 `image2-raw` → `raw-generation`（4 处） | 命名统一 |
| M-7 | ledger source 死指针改指现行符号；`05-iteration/` 死分支修正 | 测试修正 |
| L-3 | `workflow-control-ledger.json:32` 退役词 `production-mode` → `production-workflow/identity` | 测试措辞 |
| D-1 | 探测器词表扩面（protected geometry/zone、build/doctor 参数、`--check-gates`、mode 短语）+ planted violation | 防回归 |
| D-2 | import 边校验静默跳过 → `stale-import-target` 告警 | 检测增强 |
| D-3 | ledger `source` 符号存在性 resolve | 检测增强 |
| D-4 | CONTEXT.md 纳入 coherence 语义扫描 + 「still uses」反向过期句式防回归 | 检测增强（低成本版） |
| 红线 | 无命令/flag/输出/退出码/行为变化；不动序列化字段 | 机器契约 |

## 1. 现状核实（2026-08-16 apply 前）

- **M-5 #1**:`commandPageImageBuild(route, {resolution, model, baseUrl, reuseImages,
  dryRun, force, reason, retiredControlsExplicit})` 仍在 `ppt_flow.mjs:964`;守卫检查
  `baseUrl||reuseImages||dryRun||force||reason!=null||retiredControlsExplicit`(永不触发,
  因为 build 命令未注册任何 `.option()`)。`resolution`/`model` 解构后未引用。
  `commandBuildWrapped(runDir, opts)`(:1564)空壳转发 → `commandBuild(runDir, opts)`
  (:999) → `commandPageImageBuild`。调用点(:3640)硬编码 8 个 null/false。
- **M-5 #2**:`validateResolution(where, resolution)`(:190)全仓零调用。
- **M-5 #3**:`commandDoctor({image2=false,...})`(:727)的 `--image2` 拒绝分支
  (`if (image2)`)永不可达——调用点(:3569)硬编码 `image2: false`,doctor 未注册该 flag,
  commander 先拒。对照:`env_check.mjs:1047/1058` 的 `argv.includes('--image2')` 是活拒绝
  (正确模式,保留)。
- **M-5 #5**:`commandBuild` JSDoc 列 7 个退役字段、漏 `retiredControlsExplicit`。
- **M-5 #7**:`PAGE_IMAGE_DOCTOR_PROFILES = ['framed-runtime', 'image2-raw']`(:55);
  `pageImageDoctorPlan` 的 unbound 分支 `deferredProfiles: ['image2-raw']`(:986)、
  raw-generation 分支 `activeProfiles: ['image2-raw']`(:993)、deferred 判断
  (:1101) 共 4 处。CLS-038 已移除 operation 层别名(`assembly-notes` 清零、
  OPERATIONS 现为 `['framed-local-refresh','raw-generation','full-build']`);
  profile 展示名是剩余收尾。
- **M-7#1**:`harness-governance-ledger.json:36` `source:
  "scripts/shared/state/state.mjs:validateProductionModeStructure"` —— 函数已删除,
  全仓仅此一处引用。
- **M-7#2**:`test_harness_architecture.mjs:61` `(path.startsWith("05-iteration/") ? ...)` —
  `EXECUTABLE_INVENTORY` 无 `05-iteration/` 路径,死分支。
- **L-3**:`workflow-control-ledger.json:32` `"invalidation": "state, index, or
  production-mode change"`。
- **D-1**:`harness_architecture.mjs:551-572` `RETIRED_CONTROL_SURFACE_RULES` 现含 5 类
  (agent prompts / workflow-inspection baseline|ledger / intent route catalog /
  controller metadata 键 / production_mode|image2-page-workflow);`harness_coherence.mjs`
  `STALE_RULES` 现含 4 条(external-image-skill / old-path / stage run-dir /
  complete-copy)。两者均不含 protected-geometry/zone、build/doctor 退役参数、
  `--check-gates`、mode 短语。
- **D-2**:`harness_architecture.mjs:1116` `if (!target || !files.has(target)) return;`
  静默跳过不存在的 import 目标。改为:当 `resolveLocalImport` 解析出相对目标
  (`.` 开头 specifier)且该目标不在 `files` 集合时,发出 `stale-import-target` 告警;
  裸包名(`yaml`/`node:*`/`vitest` 等)与 `resolveLocalImport` 返回 null 的 specifier
  照旧跳过(非本地相对导入,不属于 stale-import 语义)。实测当前仓库 0 个现存死 import,
  改动不会破坏既有 guard 通过;`canonicalSnapshot` 测试 fixture 的 import 均指向同时
  创建的 files,不触发新告警。
- **D-3**:`test_harness_governance_ledger.mjs:17-21` 只校验 source 非空字符串,
  不 resolve 符号存在性。
- **D-4**:CONTEXT.md 不在 `scanHarnessCoherence` 扫描范围(只扫 `ppt_maker_harness/` 下
  md + openspec/config.yaml + openspec/specs/);Change 1 已清掉 CONTEXT 的 "still uses"
  句式,但无防回归检查。

## 2. 各文件修改清单

### Spec（3 个 capability,均 MODIFIED）

| capability | requirement | 修改 |
|---|---|---|
| cli-surface | Public CLI exposes only declared current Page Image Workflow operations | build 只接受 `<run_dir>`、禁退役参数覆盖;doctor 禁 `--image2`;新增场景「Build help exposes no retired overrides」 |
| environment-check | Doctor operations are backed by real owner readiness | profile 标识 `image2-raw` → `raw-generation`;报告不得暴露退役 profile 名;新增场景「Readiness report uses only current profile names」 |
| harness-script-layout | Architecture guard rejects diagnostic owner bypass and second attributors | 检测项扩为 6 类:新增 (5) 退役词回流(protected-geometry/zone、build/doctor 参数、`--check-gates`、mode 短语)、(6) 不存在的本地 import 目标;新增场景「A planted stale import target is reported」 |

### 源码 / 测试（apply 阶段直接改）

- `ppt_maker_harness/scripts/ppt_flow.mjs`:
  - `commandPageImageBuild` → 签名收 `route` 仅;删拒绝守卫、JSDoc 退役字段;
    `commandBuild(runDir)` 直接调;`commandBuildWrapped` 删除,build action 直连。
  - `validateResolution` 删除。
  - `commandDoctor` 删 `image2` 参数与拒绝分支;调用点删 `image2: false`;JSDoc 同步。
- `ppt_maker_harness/scripts/00-setup/internal/env_check.mjs`:
  - `PAGE_IMAGE_DOCTOR_PROFILES` 的 `image2-raw` → `raw-generation`;
    `pageImageDoctorPlan` 3 处 profile 引用同步;deferred 判断同步。
- `ppt_maker_harness/scripts/contracts/harness_architecture.mjs`:
  - `RETIRED_CONTROL_SURFACE_RULES` 扩面(见 §3 词表);
  - `validateImportEdge` 静默跳过 → `stale-import-target` 告警(指向不存在目标)。
- `ppt_maker_harness/scripts/contracts/harness_coherence.mjs`:
  - `STALE_RULES` 扩面同词表(针对当前层散文);
  - `scanHarnessCoherence` 把 `CONTEXT.md` 纳入扫描(D-4);
  - 新增「still uses」反向过期句式规则(仅 CONTEXT.md,避免误伤普通散文)。
- `tests/contracts/harness-governance-ledger.json`:source 改指现存符号
  `scripts/shared/state/state.mjs:inspectRunProductionIdentity`(核实:state.mjs 现行
  校验/身份入口为 `inspectRunProductionIdentity`(:388),无 `validateState` 导出)。
- `tests/contracts/test_harness_architecture.mjs`:`05-iteration/` 死分支改 `06-iteration/`
  (或按 EXECUTABLE_INVENTORY 实际删除)。
- `tests/contracts/test_harness_governance_ledger.mjs`:resolve source 符号存在性
  (解析 `path:funcName`,检查函数在当前文件声明;不存在 → 报错)。
- `tests/contracts/workflow-control-ledger.json`:`production-mode` → `production-workflow/identity`。
- 新增 planted-violation 测试(与既有 guard 测试同构):喂入
  protected-geometry/zone、`--check-gates`、build 退役参数、mode 短语、不存在 import
  目标,断言 guard 抓到。

## 3. 探测器词表（D-1 扩面）

`harness_architecture.mjs` `RETIRED_CONTROL_SURFACE_RULES` 新增:

- `protected-geometry`(词形:`protected geometry` / `protected-geometry` /
  `protected_geometry`)
- `protected-zone`(词形:`protected zone` / `protected-zone` / `protected_zone`)
- `retired-build-param`:`--resolution` / `--model` / `--reuse-images` /
  `retiredControlsExplicit`(M-5 #1 删除后全仓零合法面)
- `retired-check-gates`:`--check-gates`(CLS-038 已清,spec 只剩拒绝句)
- `retired-mode-phrase`:`durable mode` / `source/mode pair` / `infer mode`

`harness_coherence.mjs` `STALE_RULES` 同步(用于当前层散文/文档扫描)。

**明确排除(有活拒绝/合法面,加词表会误报)**:
`--base-url`(image2 命令面活拒绝 + credentials 文档)、`--force`(progressiveUnsupported
活拒绝)、`--reason`(style-master abandon **现行合法参数**)、`--dry-run`(活拒绝)、
`--image2`(env_check 活拒绝,正确保留)、`--mode`(env_check/bundle_layout 活拒绝)。
这些 flag 的残留检测由「build/doctor 退役参数删除 + cli-surface 固定形式 spec」承载,
不进词表——否则 guard 会误报当前层活拒绝代码(实测 23 处误报,全部来自这 6 个 flag)。

应用原则(与 Change 1 一致):「拒绝/禁止退役输入」语境保留——规则带
`EXPLICIT_RETIRED_CONTROL_REJECTION` 前置判定(拒绝句不报);序列化字段
`protected_composition`/`reserved_header` 等是现行字面量,不在词表。

## 4. 验证策略

- **grep 清零断言**:
  - `image2-raw` 在 `ppt_maker_harness/scripts/` 清零(profile 展示名已统一);
  - `retiredControlsExplicit`、`validateResolution(`、`commandBuildWrapped` 清零;
  - `05-iteration/` 死分支修正;`production-mode change` 措辞清零;
  - `validateProductionModeStructure` 引用清零(ledger 改指现行符号)。
- **行为无变化**:`ppt_flow build --help` / `ppt_flow doctor --help` 输出对比(只去死参数,
  无新增/改名 flag);`npm test`(core:architecture/coherence guard)、`npm run test:sweep`、
  planted-violation 测试、`openspec validate --strict` + `--all --strict`、`git diff --check`。
- **防回归证明**:planted violation 测试喂入各退役词/死 import,guard 必抓;修复后必过
  (与既有 guard 测试同构,`test_harness_architecture.mjs` / coherence 测试内新增用例)。
- **不做**:process/e2e 重跑(无行为面变化;core + sweep 覆盖 guard/coherence)。

## 5. Policy 合规

- 死代码删除 = 净简化(`simple-reliable-control.md`):8 个退役参数、空壳层、
  死 helper、死分支全部移除,无新增控制层。
- 探测器扩面 = gate 层增强(能抓同类残留,正是 audit D-1 根因),不新增控制层复杂度;
  planted-violation 证明检测有效性与既有 guard 测试同构。
- 红线:无命令/flag/输出/退出码/行为变化;不动序列化字段
  (`header_region`/`protected_composition`/`reserved_header`/`body_safe`)。
