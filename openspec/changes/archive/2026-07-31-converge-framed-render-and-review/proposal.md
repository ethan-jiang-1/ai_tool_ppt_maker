## Why

当前 Framed Page Authority 的 lifecycle 已经能从 source 走到交付，但它在 provider 授权前使用估算式 Text Frame preflight，最终 Chromium 又使用另一套深色 Arial compositor；raw review 同时缺少 accepted contract 已要求的 safe-zone、完整页面标签和 profile coverage。结果是系统可能授权一份无法按声明 frame 正确合成的 raw plan，也无法让人基于完整、可归属的 underlay 证据作出既有 raw-review 决定。

这是后续 Style Master 与 Pilot Run 的完整性前置。若不先收敛 renderer、plan materialization 与 review evidence，所谓 production-equivalent pilot 只会提前展示一套并非最终权威的像素。本 change 因此把原来相邻的“Framed 渲染收敛”和“raw-review 证据恢复”合并为一个可独立归档的纵向闭环，同时把 Style Master、scoped generation 与 Pilot/Expansion 留给后续串行 change。

## What Changes

- 把规范化后的浅色 `standard-v1` preset 指定为唯一视觉事实，并引入稳定的 `render_profile_digest`，覆盖 preset、compiler、checked-in font render inventory、font selection、pinned runtime 与 capture identity；Text Frame literals 和逐页 font shard selection 不进入该 profile。
- 用一个私有 Framed render-contract owner 统一 deterministic description、bounded browser layout verification 与 final composition。删除 heuristic fit 的授权权威、竞争性 hard-coded compositor CSS、caller-trusted `preflight` 以及 production-facing arbitrary `compose` 注入。
- 把 `image2 plan` 拆为只读 candidate source/contract compilation、一次有界 browser batch proof、以及全部成功后的 source receipt/state/raw-plan materialization。后续 authorize/generate/review/accept 只验证已物化 plan，不重写 plan，也不重新启动 browser proof。
- 让 Framed raw contract 传递性绑定 render profile；profile 漂移通过既有 owner 使 raw plan、authorization、review、accepted raw、final 与 delivery derivatives 陈旧。合法 Text Frame-only refresh 只在已接受 raw-review 的 coverage-bound underlay facts 完全一致时复用该 review reference 并保持 provider-free；notes-only refresh 继续 browser-free。
- 恢复 shared target raw-review owner 的 typed workflow contribution：Framed 提供 generic safe-zone guides 与 render-profile contribution，shared owner 展示 `position + formal slide_id + title`，并把 coverage 同时绑定精确 raw bytes、workflow contribution 和 projection/capture profile。Pure 只贡献通用 evidence，不获得 Framed 语义。
- 让 source validation、environment readiness、internal invariant 与 stale-evidence failures 在最早 prerequisite 处 fail closed，并通过既有 producer-owned CLI diagnostic envelope 返回有界 root cause 和唯一最近合法动作。`node-specification` 继续只消费 producer envelope，不复制 schema。
- 不新增人类决定、waiver、OCR、retry/fallback、持久化 layout proof、第二份 state ledger、额外 preset、per-slide workflow mixing 或跨 profile underlay reuse。

Gate 行为应用 `openspec/policies/human-centered-gates.md`：doctor 中可确定的本地修复是 `guide`；完整、当前 raw projection 等待既有人类质量判断是 `confirm`；source/profile/layout/runtime/authorization/evidence identity 或 completeness 不确定时是不可绕过的 `hard-stop`。人只判断 underlay 的视觉与内容质量，不承担 browser geometry、font readiness、hash 或 state repair。

控制路径应用 `openspec/policies/agent-assistance-and-control.md` 与 `openspec/policies/simple-reliable-control.md`：直接 facts 进入一个 evaluator，失败返回一个 owner action，repair 后重跑同一 checkpoint。新增 browser proof 同时删除 heuristic authorization、重复 CSS、caller bypass 和 lifecycle command 的重复 plan writes，形成净简化；任何更早 prerequisite 失败都短路 browser、provider 与 wrong-owner writes。

## Capabilities

### New Capabilities

- None. 本 change 收敛既有 Page Authority owners，不建立新的顶层 capability 或并行 renderer/review authority。

### Modified Capabilities

- `visual-config`: 规范化唯一 `standard-v1` facts，定义 Framed render-profile identity，并把真实 browser evaluator 设为唯一 fit authority。
- `html-render-runtime`: 让 checked-in font selection、pinned browser 与 capture primitives 同时服务 plan-time proof 和 final composition，而不成为 workflow controller。
- `image-production`: 以一个私有 render-contract compiler/evaluator/compositor 取代 caller preflight、竞争性 CSS 与任意 composition 注入。
- `image-generation`: 规定 proof-before-materialization 的 Framed plan transaction、stored-plan lifecycle、render-profile binding，以及 typed raw-review contribution/coverage。
- `pipeline-orchestration`: 修正 homogeneous v2 workflow lifecycle，规定 Framed profile-aware refresh/invalidation，并移除陈旧 mixed-workflow scenario。
- `run-bundle-layout`: 区分 raw-review projection/capture profile 与 workflow render-profile contribution，并让 rebuildable coverage 绑定二者及精确 raw bytes。
- `environment-check`: 让 operation-scoped readiness 在保持 zero-static-dependency startup 的同时报告 plan/final 所需的同一 Framed runtime/font profile。
- `cli-surface`: 规定 render-contract 与 review failures 由 producer 按最早 owner 分类，并只发出一个 secret-safe 最近合法动作。

## Impact

- **Framework source:** `PPTMAKER_FRAMEWORK/scripts/03-framed-image/`、shared Page Authority source/plan/raw-review mechanics、Framed runtime/font helpers、environment check、CLI routing/diagnostics，以及必要的 Controller/contract wording。
- **OpenSpec:** 上述八个 capability delta；`node-specification`、`playbook-execution` 与现有 run-bundle contracts 需要做兼容性审计，但只有 requirement-level consumer behavior 实际变化时才追加 delta，不能复制 `cli-surface` schema。
- **Tests:** Framed preset/profile/font unit tests，private browser evaluator tests，plan transaction 与 failure-write integration tests，raw-review contribution/coverage tests，CLI/readiness tests，target mock E2E 与完整 regression。
- **Dependencies:** 不新增 production dependency；复用已声明的 pinned Playwright Chromium、checked-in WOFF2 inventory 与现有 Node ESM owners。
- **Control owner:** JS/CLI 拥有 deterministic profile/layout checks、exact writes、evidence invalidation 与 diagnostics；MD Controller/Agent 展示 owner facts 并执行合法机械恢复；人继续拥有既有 raw visual/content decision。
- **Run-bundle contract:** `compatible`。不扫描、迁移或改写任何未指定 `deck_*`；新的 render-profile identity 会有意使旧 Framed derived evidence 陈旧，选定 run 只能通过既有 Generated Image Rebuild owner 恢复。`_generated/` 不得手工编辑或成为 fixture。
- **Out of scope:** Style Master candidate/review/promotion、exact batch grants、provider attempt/materialization progress、Pilot/Expansion 与 task projection；它们由后续串行 change 承接。
