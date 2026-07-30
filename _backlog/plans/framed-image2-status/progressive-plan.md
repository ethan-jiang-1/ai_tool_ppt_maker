# 渐进式计划：渲染完整性与前置人工反馈

> [README.md](README.md) 配套文档 | 状态：已对齐 policy 的推进顺序 | 更新：2026-07-30

## 如何使用本计划

进度以可观察 Gate 衡量，而不是以修改了多少文件衡量。每个 phase（阶段）结束时，repository 必须保持 green、只保留一条权威路径，并建立下一阶段所需契约。

未来四个 OpenSpec change 必须严格串行：

```text
converge-framed-render-contract
  Phase 0 -> Phase 1 -> Phase 2 -> Phase 3 -> Phase 4 -> Phase 5
                                                            |
                                                validate + archive
                                                            |
                                                            v
restore-target-raw-review-evidence
                                      Phase 6 -> Phase 7 -> validate + archive
                                                                      |
                                                                      v
establish-target-style-master-feedback
                                      Phase 8 -> Phase 9 -> validate + archive
                                                                      |
                                                                      v
introduce-target-pilot-runs
                         Phase 10 -> Phase 11 -> Phase 12 -> Phase 13
                                                                      |
                                                          validate + archive
```

这个顺序属于 administrative sequencing（管理顺序），不是新的 runtime Gate。它防止共享 raw-review 工作依赖尚未接受的 profile identity；在渐进提交前先建立已接受视觉参考；并让 Pilot Run 在不引入并行依赖的情况下，消费生产等价的 render/review contracts。

所有阶段都必须：

- 应用 [README.md](README.md) 链接的三项 policy；
- 优先删除或复用，不优先增加 validator、state field、retry 或 recovery branch；
- 在最早失效的 authority/prerequisite 处停止；
- 返回一个有界 root cause 和唯一最近合法动作；
- 通过 owner 修复，再重跑同一个 checkpoint；
- 绝不要求人重复执行 Agent 合法可做的常规机械工作；
- 绝不把人类决定变成绕过 integrity 或 authorization 的手段。

## Phase 0：冻结 Policy、权威与规格

**目标：** 在修改代码前，把本计划转化为 policy 完整、可执行的契约。

工作：

- 创建 OpenSpec change `converge-framed-render-contract`；
- 引用 `human-centered-gates.md`，为每个可见结果分类，并为每个 `hard-stop` 指明 protected invariant 与合法恢复路径；
- 引用 `agent-assistance-and-control.md`，记录直接 Source of Record（事实源），以及 human/Agent/runtime handoff；
- 引用 `simple-reliable-control.md`，回答全部五个 blocking-rule admission 问题，并证明 net simplification（净简化）；
- 记录四个领域词汇：preset、render profile、layout proof 和 derived output；
- 把规范化的浅色 `standard-v1` frame 指定为视觉权威；
- 规定 `render_profile_digest`、其精确输入/排除项，以及它与 raw contract 的传递性绑定；
- 按 owner 和用途区分 Framed render profile、provider generation profile 与 raw review projection/capture profile；
- 规定最短控制闭环：

```text
直接 source/profile/runtime 事实
  -> 一个 layout evaluator
  -> 一个 repair action，或成功后的 materialization
  -> 修复后重跑同一 checkpoint
```

- 在列出 Modified Capabilities 前审计既有 capabilities；只纳入 requirement-level 行为变化，绝不把纯实现/测试列入；
- 记录 framework source scope、JS 与 MD/Agent 的 control ownership，以及 `compatible` 的 run-bundle 影响：通过 owner rebuild 恢复，但不迁移 deck；
- 明确移除陈旧的 mixed-workflow 解释；
- 保留既有 raw-review 和 provider-authorization 决定，不发明新的 confirmation 或 waiver。

退出 Gate：

- `openspec validate converge-framed-render-contract --strict` 通过；
- proposal、specs、design、tasks 遵守 `openspec/config.yaml` 中各自规则；
- 每个确定性失败都有一个 owner、一个 outcome、一个 invariant、唯一最近动作和一个 focused negative scenario；
- 没有 delta 引入另一套 controller、approval、waiver、retry、fallback、持久化 layout proof 或 source-grammar field；
- compatibility 与 raw-rebuild policy 没有未决问题。

## Phase 1：规范事实并建立身份

**目标：** 在引入浏览器控制前建立确定性 identities。

工作：

- 规范化 `standard-v1`：移除重复 opacity、未使用 border 和非权威 padding，同时保留预期浅色 frame geometry；
- 引入规范 render-profile construction 与 digesting；
- 通过既有 plan hash，把 profile digest 绑定进 Framed raw-contract contribution 和 authorization scope；
- 定义与像素相关的 font render-inventory identity，以及稳定的 compiler、runtime 和 capture identities；
- 更新 refresh classification，使 profile drift 成为 raw-rebuild debt；
- 不把 source text、page measurements 和所选 per-page shard lists 纳入 profile identity；
- 不增加 parallel profile registry 或 state record。

Focused tests：

- canonical identity 不受 object insertion order 和 host paths 影响；
- 仅涉及 legal/provenance 的 font metadata 不触发 pixel invalidation；
- 每个与像素相关的 profile input 变化都会改变 digest；
- text-only 变化不改变 profile 或 underlay contract；
- preset/profile 漂移通过既有 owner 使旧 raw evidence 失效；
- 缺少 profile digest 的 Framed raw contract 不能物化 plan。

退出 Gate：

- identity 与 invalidation tests 在不启动 Chromium 的情况下通过；
- 直接 preset/font/runtime owners 保持权威；
- 既有 evidence 走已记录的 owner rebuild path，不存在静默 compatibility fallback。

## Phase 2：用一个 Renderer 替代竞争性检查

**目标：** 让一个私有 evaluator 同时拥有 proof 与 pixels。

工作：

- 引入私有 `framed_render_contract` 职责：`describeFrame`、`verifyFrames`、`composePages`；
- 实现一个内部 browser layout evaluator，由 plan verification 与 final composition 共同复用；
- HTML/CSS 只能从规范化 preset facts 派生；
- 为 inventory 与 code-point shard selection 增加窄接口 font-owner helper；
- 只嵌入所需 checked-in WOFF2 assets，禁止把 system fallback 或 network loading 当作成功；
- 检查精确 panel/field rectangles、scroll bounds、按 y 分组的 line counts、leaf markers，以及条件式 custom-font evidence；
- 移除 heuristic authorization authority、相互竞争的 hard-coded frame CSS、调用方可信的 `preflight`，以及公共任意 `compose` 注入；
- substitution 只保留在私有 runtime owner 之下。

前置条件顺序：

```text
source schema/identity
  -> preset + font inventory 完整性
  -> pinned runtime 就绪
  -> browser layout evaluation
```

更早的失败必须短路所有依赖症状。前置条件全部通过后，可以收集相互独立的 page/field failures，但只能形成有界集合，且只有一个动作：修复 source，并重跑同一 plan checkpoint。

Focused tests：

- 两种 callout variants 都精确复现 preset geometry 与浅色 palette；
- 可适配且被 Latin、Simplified Chinese 或混合 code points 覆盖的文字通过；
- 不支持的 code points 返回有界 source root cause；
- 已知 28 个 `W` 的 false acceptance 被拒绝；
- long tokens、额外 title lines、scroll overflow、错误 panels、缺失 markers、noncustom fallback、被禁止的 network access 和错误 capture size，都在各自所属 prerequisite/invariant 处失败；
- 一个 browser process 验证一个有界 multi-slide batch；
- 公共 Framed workflow 恰好只有一个 compositor/evaluator owner。

退出 Gate：

- 不再存在竞争性 fit authority 或 compositor CSS；
- 失败为 fail-closed，且无 fallback/retry；
- 所有 negative cases 都证明 provider submission 为零，且没有 wrong-owner write。

## Phase 3：先证明，后物化计划

**目标：** 防止未经证明的 frame 改变 state 或成为可授权计划。

工作：

- 把 planning 拆成只读 candidate source/contract compilation、一次有界 batch verification，以及成功后的 materialization；
- 引入只读 candidate source resolver，不在 proof 前调用当前会写入的 `resolveTargetSourceContext()`；
- 仅在整个 batch 通过后物化 source state/receipt 与 raw plan；
- partial write failure 时保留精确 source epoch 与 plan-hash ownership；绝不暴露绑定不一致的可授权计划；
- 让 authorize/generate/review/accept 通过只读 current-source context 加载并验证持久化 plan；
- 这些后续命令不重建/重写 plan，也不启动 Chromium；
- 最终合成使用同一内部 evaluator；任意页面失败时都不发布部分 final manifest。

Focused tests：

- 非法 source identity/schema 在 font/runtime/browser 症状之前停止；
- runtime 不可用时，在 browser 工作和 state writes 前停止；
- layout 失败时，不写 source receipt、state、raw plan 或下游 raw/final artifact；
- 成功 plan 只有在一次 batch proof 后才发出一个 exact hash；
- partial materialization 不能暴露绑定到另一 receipt/epoch 的 plan；
- 后续 raw commands 的 browser launch 为零，且不重写 plan；
- 陈旧 source/profile/plan hash 在 provider 工作前 `hard-stop`；
- repair 后重跑 `image2 plan`，通过同一路径成功；
- final composition 重跑 evaluator，失败时不发布任何内容。

退出 Gate：

- 可见闭环严格是 `direct facts -> evaluator -> one action -> same checkpoint rerun`；
- 不适配或结果未知的 layout 不能进入 provider authorization；
- 在 public boundary 断言 browser launch count、provider submission count 和 owner writes。

## Phase 4：加固 Refresh、Diagnostics 与 Readiness

**目标：** 保留低成本合法路径，同时让每条失败路径都有界且 owner 归属正确。

工作：

- 当 raw、safe-zone、provider 和 render-profile identity 不变时，为 Text Frame-only edits 保留 provider-free local composition；
- 在最终本地合成时证明刷新后的文字；
- notes-only refresh 保持 browser-free，并拒绝 pixel/profile drift；
- profile drift 走 Generated Image Rebuild，structural change 走 exact-hash Structural Versioning；
- 非法 literal/code-point/text fit 映射为 `source_validation`；
- 缺失/损坏 font 或 pinned runtime 未就绪映射为 `environment`；
- preset/compiler invariant contradiction 映射为 `internal`；
- 每项独立 diagnostic 只暴露最小 root set 与唯一最近合法动作，绝不提供 recovery routes 菜单；
- 保留 direct `env-check.mjs` 的 zero-static-dependency startup；只有 package prerequisites 通过后，才动态加载已安装 runtime/font checks；
- 在 `cli-surface` 更新 CLI producer 行为；验证 MD Controller 无需复制 schema 就能消费既有 envelope；
- 只有 consumer behavior 确实变化时，才增加 `node-specification` delta；
- 让 Agent 执行合法授权的机械修复并重跑同一 checkpoint；只有内容含义、provider authorization 或缺失 external power 才停下来交给人。

Focused tests：

- title-only refresh 复用精确 accepted raw bytes，不调用 provider；
- 不再适配的文字在最终发布前 `hard-stop`，且只有一个 source-repair action；
- notes-only refresh 不调用 browser 或 provider；
- profile drift 不能使用 local rebind，且只有一个 owner rebuild action；
- environment failure 只有一个 environment-repair action，绝不归因于 provider；
- internal invariant failure 绝不归因于 source/provider；
- 缺少 `node_modules` 时直接运行 env-check，仍输出正常 structured `guide`；
- producer diagnostics 有界、secret-safe、prerequisite-first，并能在不匹配散文文本的情况下被成功消费。

退出 Gate：

- refresh paths 继续匹配 final-pixel ownership；
- doctor 与 production 对 readiness facts 判断一致；
- 不要求人手工执行确定性 state/artifact repair；
- 不存在新的 CLI override、force flag、continuation、retry loop 或 fallback。

## Phase 5：验证并归档渲染收敛

**目标：** 在共享 raw-review 工作开始前完成第一个 change。

验证阶梯：

1. preset/profile/font-selection unit tests；
2. private compiler/evaluator/browser tests；
3. `tests/03-framed-image/test_framed_workflow.mjs`;
4. shared Image2 artifact/state 与 CLI integration tests；
5. target workflow mock E2E；
6. full `npm test`;
7. strict OpenSpec validation 与 spec/code terminology scan。

归档前：

- 确认陈旧的 `Mixed deck` scenario 不再与 homogeneous version workflow ownership 矛盾；
- 确认每条 blocking rule 都有 admission answers 与 focused negative test；
- 确认合法工作不会被仅涉及 presentation 的差异阻挡；
- 确认没有生产 `deck_*` 数据被用作 fixture/migration target；
- 通过正常 OpenSpec ownership 执行 sync/archive。

退出 Gate：

- `converge-framed-render-contract` 已验证并归档；
- accepted main specs 现已拥有规范 profile 与 control behavior；
- 该 change 没有遗留必需工作。

## Phase 6：恢复既有 Raw-Review 证据

**目标：** 恢复已经接受的人类审查证据，不增加新决定或另一权威。

只能在 Phase 5 完成后开始。

工作：

- 针对现已接受的 profile identity 创建 `restore-target-raw-review-evidence`；
- 引用全部三项 policy，并对当前 review behavior 分类：当前 projection 完整但无决定是 `confirm`；coverage 缺失/不完整/陈旧是 `hard-stop`；
- 在声明 capability changes 前，审计已接受的 `image-generation`、`run-bundle-layout`、`pipeline-orchestration` 和相关 specs；
- 若任务只是恢复既有 accepted behavior，不得虚构 Modified Capability；
- 让每个已选 workflow adapter 产生 ephemeral typed generic review contribution，同时共享 raw mechanics 保持 semantics-blind；
- Framed 提供 safe-zone rectangles 与 `render_profile_digest`；
- 在共享 contact sheet 渲染 guides 与 `position + formal slide_id + title`；
- 把既有 review coverage owner 绑定到精确 raw PNG hashes、workflow contribution digest 和 projection/capture-profile digest；
- raw bytes、safe zones、order 或 profile 漂移时，使 review 失效并重建；
- 保留既有人类 raw-review decision 语义和显式 provider authorization；
- 不增加 OCR、auto-pass、reason schema、waiver、approval、持久化 parallel contribution artifact 或新 state ledger。

在这里，人面对 complete/current review evidence 作出的 `proceed`，是 human content evaluator 的决定，不是对失败确定性检查的 waiver。若未来 proposal 增加 known-risk continuation，它必须绑定版本并记录规范化 human reason；该行为不属于这次恢复范围。

Focused tests：

- complete/current projection 进入既有人类 `confirm`；
- missing/stale coverage 在人类决定能代替检查之前 `hard-stop`；
- 两种 Framed variants 都展示精确 guides 和完整 labels；
- 除 generic evidence correctness 外，Pure 保持不变；
- shared raw mechanics 渲染 generic primitives，但不解释 Text Frame literals；
- repair 通过所属 owner 重建 projection，并返回同一 review checkpoint；
- 复制的 review/final artifact 不能满足当前 evidence。

退出 Gate：

- proposal/design 清楚区分 existing-spec conformance 与真实 requirement change；
- review 继续归人所有且 evidence-complete；
- 不引入额外 visible Gate 或 runtime authority。

## Phase 7：验证并归档 Raw Review

运行共享 raw-review、bundle-layout、orchestration、CLI、mock-E2E 和完整 regression suites。执行 strict OpenSpec validation，再通过正常 workflow sync/archive。

Raw-review Gate：

- 证明 [README.md](README.md) 成功定义中的 render/raw-review 部分；
- 每项 policy admission answer 在可执行行为中继续成立；
- 每次 repair 都通过所属接口返回同一 checkpoint；
- 不存在 production-facing test-only bypass；
- generated artifacts 只通过所属 owner 重建；
- 没有生产 `deck_*` 目录被用作 fixture 或 migration target。

## Phase 8：规定前置 Style Master 反馈

**目标：** 在页面级生成前，让视觉方向尽早成为基于真实图片的决定。

只能在 Phase 7 完成后开始。

工作：

- 创建 `establish-target-style-master-feedback`，并引用全部三项 policy；
- 在声明 deltas 前，审计 `style-master-generation`、`image-generation`、`visual-config`、`visual-asset-management`、`playbook-execution`、`pipeline-orchestration`、`cli-surface`、`node-specification`、`workflow-inspection`、`run-bundle-layout`、`run-bundle-management`、`environment-check`、`framework-charter`、`commands-reference` 及相关 accepted specs；
- 把 Style Master 交互放在 workflow 选择完成、内容上下文足以判断方向之后，但在完整 raw plan 之前；
- 直接在两条已选 workflow Controller 路径内暴露该交互，任何分支都不需要跳到 sibling branch；
- 保留一个 deck-level Style Master owner 和一份 accepted asset，不按 workflow 重复 bytes/state；
- 规定 provider-free candidate planning、精确 one-submit authorization、candidate provenance、真实图片 review，以及仅在 `proceed` 后提升 canonical bytes；
- 因此时尚无 raw plan，把该授权作为同一 state authority 下独立、带类型的 `style-master` operation；防止它授权 raw pages，也防止 raw grants 授权 Style Master；
- 把 owner-written acceptance receipt 绑定到精确 candidate bytes、style intent 和 generation profile；
- 被拒绝 iterations 继续由既有 `1_upstream_raw_material/style-master-iterations/` owner 保留；
- 允许展示和采用已有 confined Style Master 而不调用 provider，但不得做虚假的 historical-provenance claim；
- 区分等待授权的 ready scope（`confirm`），与尝试未经授权 submit（`hard-stop`）；
- 把真实当前 candidate review 分类为 `confirm`，把缺失/陈旧 candidate identity 或 provenance 分类为 `hard-stop`；
- 通过有意修改 CLI contract 和 retired-surface tests，把清晰公共名称 `style-master` 恢复为当前 Page Authority surface；不复用已移除 whole-page adapter 或 state 语义。

新持久 acceptance fact 的 policy admission：

1. Direct source：精确 candidate bytes，加 owner-written candidate/profile provenance 和当前人类决定。
2. 未覆盖失败：文件存在不能证明人审查了这些精确字节。
3. 避免的复杂度：不增加 metadata visual Gate、chat-memory approval、复制文件或彼此分开的 workflow-specific acceptance stores。
4. 唯一恢复：通过 Style Master owner 重建或重新展示，再重跑同一 review。
5. Negative proof：陈旧 bytes/profile 不能 promotion；不能路由到错误 workflow；candidate 被拒绝后，后续 provider calls 为零。

退出 Gate：

- `openspec validate establish-target-style-master-feedback --strict` 通过；
- proposal/design 指明唯一 owner、writer、readers、freshness rule、lazy existing-byte adoption 和 removal/invalidation path；
- Style Master review 既不是 waiver，也不替代 Pilot Run；
- raw generation 不能消费尚未审查的新生成 candidate。

## Phase 9：交付并归档 Style Master 反馈

**目标：** 在增加 scoped page production 前，完成前置视觉环路。

实现与 focused tests：

- 使用保留在 framework 内的 Image2 credential/transport owner；
- 授权前发布 provider-free exact candidate scope；
- 证明 decline、current reuse 和 local adoption 的 provider calls 为零；
- 把 generated candidates 写入 iteration history，不覆盖 canonical accepted bytes；
- 展示真实 candidate artifact，并把 `proceed|repair|redirect` 与之绑定；
- 通过 owner 原子化提升精确 bytes 与 acceptance evidence；
- accepted Style Master bytes 改变时，使 raw generation profile、raw plan、review 和 downstream evidence 失效；不要只为 profile drift 人为制造 source epoch；
- 验证 Framed 和 Pure Controller journey 都直接进入同一个 owner，且绝不展示另一 workflow 分支；
- 测试 missing/partial/stale provenance、wrong scope、wrong workflow、unauthorized submit、interrupted promotion 和 same-check repair；
- 运行 focused CLI/Controller tests、target mock E2E、完整 `npm test` 和 strict OpenSpec validation。

退出 Gate：

- 人可以在页面级生产前建立、检查、修复、重定向并接受 Style Master；
- accepted current bytes 只有一个 direct receipt 与一条 invalidation path；
- `establish-target-style-master-feedback` 已 validate、sync 并 archive。

## Phase 10：规定精确 Pilot Run 批次

**目标：** 为两种模式定义同一个安全渐进生产契约，但不创建共享的用户可见 workflow。

工作：

- 以三项已接受 prerequisite contracts 为基础创建 `introduce-target-pilot-runs`；
- 引用全部三项 policy，并针对 exact batch authorization、raw materialization provenance 和 pilot review 回答五个 admission questions；
- 编译一份规范、完整且 provider-free 的 raw plan，再从中投影精确 pilot batch 与 remaining batch；
- 把 batch identity 定义为 full plan hash，加精确有序 selected IDs、所选 raw-contract digests、provider profile、source/execution identity 和 maximum submissions；
- 把 3-5 页设为 Agent 提议的正常 UX，而不是 validator 硬限制；
- 要求 Agent 展示 `position + formal slide_id + title + reason`、当前 profile、精确最大提交次数和剩余数量；
- 允许人在同一次精确授权交互中调整代表页，不增加 selection approval；
- 定义彼此独立的 Framed/Pure Controller nodes 和 review questions；
- 把 Pilot Run `proceed` 定义为“可进入 expansion authorization”，绝不等同于 expansion authorization 或 partial raw acceptance；
- 只对当前剩余 IDs 定义第二次精确授权；
- 要求精确当前 pilot bytes 原样进入完整 raw review 与最终生产；
- 不超过 5 页的 complete scope 使用一份 pilot/full review artifact 和一次决定，避免重复 confirmations；
- 保留 provider-free Framed Text Frame-only 和 notes-only refresh；
- 通过有意更新 `cli-surface`、help、command-count/retirement contracts、non-v2 fences 和 producer diagnostics，把清晰公共名称 `pilot` 恢复为当前 Page Authority operation。

持久 pilot facts 的 policy admission：

1. Direct sources：完整 raw plan、唯一 authorization owner、精确 raw bytes、owner-written materialization provenance，以及有界 pilot decision。
2. 未覆盖失败：当前 all-or-nothing 路径不能约束更小花费范围，也不能证明保留 pilot bytes 来自对应精确 grant。
3. 删除/避免的复杂度：不增加 full-plan preauthorization、count-only grant、filename-based reuse、重复 small-deck review、cross-workflow Controller 或第二 raw success authority。
4. 唯一恢复：修复具名 owner，并重跑同一 plan、authorization、materialization 或 review checkpoint。
5. Negative proof：未选择 item 不能 submit；部分证据不能 finalization；pilot `proceed` 前请求 expansion，会返回当前 pilot `confirm` 且 submit 为零；合法 pilot bytes 不会重新生成。

退出 Gate：

- `openspec validate introduce-target-pilot-runs --strict` 通过；
- 每个新增 durable fact 都有唯一 owner/writer/read set/freshness/removal path；
- state migration 与 in-progress full-batch authorization behavior 显式且由 owner 控制，不批量重写 production deck；
- Framed/Pure path independence 与 semantics-blind shared mechanics 是可测试 requirements，而非仅有文档约定。

## Phase 11：构建限定范围的授权与物化

**目标：** 在任一 workflow 发布 Pilot Run evidence 前，建立机械基础。

工作：

- 演进既有唯一 Page Authority authorization owner，为一份当前完整计划保留精确、不可变 batch grants；
- 让 owner 记录一份规范 cumulative grant set，同时让每个 materialized item 绑定实际生成它的单独 grant；
- grant 绑定精确 selected IDs 与 raw-contract digests，而不只是 count；
- 每次 provider submit 都在调用前立即重检精确当前 grant；
- 增加一份 owner-written current raw-materialization record，把每份付费 byte 绑定到 plan、source、workflow、contract、profile 和 authorization grant；
- 让该记录取代 raw-file existence，成为 pre-review provenance，而不是与 accepted raw evidence 竞争；
- 只生成精确 authorized batch；对不确定或部分无法归属的字节不发布成功；
- remaining scope 计算为 complete plan 减去 validated current materializations；
- expansion 时保留当前 pilot items，拒绝 copied/stale bytes；
- accepted raw evidence 继续作为 complete-review finalization 的唯一输入；
- 完整 accepted evidence 绑定 cumulative authorization-record digest，绝不只绑定最新 expansion grant；
- 不增加 inferred authorization、automatic retry、hidden fallback、watcher 或第二 state writer。

Focused tests：

- 只授权 IDs A/B/C 的 pilot authorization 不能 submit D 或全部 plan items；
- count 相同但 IDs 不同，scope validation 失败；
- expansion authorization 不能追溯扩大 pilot grant；
- 只绑定 latest grant 的 evidence 不能覆盖早期 pilot bytes；
- plan/profile/source/execution 漂移在 submit 前失败；
- current materialization 能跨 invocation 证明其精确 bytes 与 grant；
- copied filename、wrong hash、foreign workflow 或 missing provenance 失败；
- expansion 期间不再次 submit 合法 pilot bytes；
- interruption 返回一个 owner-issued exact regeneration action，不制造成功；
- focused negative tests 防止 wrong-owner 与 stale-state writes。

退出 Gate：

- public integration tests 证明 pilot 与 expansion 的精确 provider-call IDs 和 counts；
- authorization/materialization state 比它保护的付费工作更简单，且无 parallel pass/fail authority；
- shared raw mechanics 中没有进入 workflow-specific semantics。

## Phase 12：交付彼此独立的 Framed 与 Pure Pilot 路径

**目标：** 尽早暴露真实输出，同时让每条已选 workflow 保持直线、独立完整。

Framed 工作：

- Agent 按 Text Frame、callout、safe-zone、identity、narrative-position 和 composition risk 提出 Framed 代表页；
- 只生成已授权的无文字 underlays；
- 通过已接受的私有 Framed compiler、fonts、layout evaluator 和 capture profile 合成 preview-only pages；
- 在一次人类 Pilot Run 决定中，同时展示 underlay safe-zone evidence 和生产等价合成页面；
- 防止 preview composition 写入 accepted raw evidence、final manifest、PPTX、notes 或 delivery state；
- `repair` 路由到最近 Framed source/visual owner，`redirect` 路由到 Style Master；workflow 切换继续走 Structural Versioning。

Pure 工作：

- Agent 按 text density、complex composition、identity、narrative-position 和 legibility risk 提出 Pure 代表页；
- 展示精确 generated full-page bytes，以及完整 identity/profile labels 与 coverage；
- 绝不导入 Framed renderer、Text Frame 或 safe-zone 语义；
- `repair` 路由到最近 Pure source/visual owner，`redirect` 路由到 Style Master；workflow 切换继续走 Structural Versioning。

共享 handoff 工作：

- 当前 Pilot Run `proceed` 后，展示但不推断精确 remaining authorization；
- 已授权 expansion 后，从所有精确当前 tuples 构建完整 raw review，包括未变化 pilot bytes；
- 若 pilot scope 等于 complete scope，复用 complete projection 与 decision 作为 accepted raw review，不重复询问；
- complete review 与 delivery review 继续归人所有，并绑定 current evidence。

Focused tests：

- 两条 Controller journey 都只暴露已选分支；
- Agent proposal 覆盖风险且人可调整，同时 runtime exact IDs 保持权威；
- Framed pilot 与 final composition 使用同一个 renderer/evaluator；
- Pure pilot bytes 等于 raw/final page bytes，且不调用 Framed code；
- pilot `repair`/`redirect` 使正确 evidence 失效，并返回唯一最近动作；
- `proceed` 前请求 expansion，返回同一份当前 Pilot Run `confirm`，submit 为零；
- 没有精确授权的 expansion submit，以及用部分 pilot finalization，都会 `hard-stop`；
- 1-5 页 scope 的 remaining submits 为零，且只有一次视觉决定；
- provider-free local refresh 不进入 Pilot Run。

退出 Gate：

- 真实 user-facing artifacts 出现在 Style Master 与 Pilot Run checkpoints；
- 较大批次在取得当前 pilot 反馈前不能 submit 剩余页面；
- 每种模式都可以独立理解且流程完整。

## Phase 13：验证并归档 Pilot Run

验证阶梯：

1. exact batch/authorization/materialization unit tests；
2. Style Master/Pilot evidence 与 invalidation integration tests；
3. Framed production-equivalent pilot browser tests；
4. Pure exact-byte pilot tests；
5. independent Controller/CLI contract tests，包括恢复公共名称后更新的 command-count、retirement 和 non-v2 fences；
6. 两条 target mock E2E journeys，包括 repair 与 small-scope paths；
7. 完整 `npm test` 与适当 E2E tier；
8. strict OpenSpec validation 与 framework terminology/ownership scans。

最终 Gate：

- 完整证明 [README.md](README.md) 与 [pilot-run-plan.md](pilot-run-plan.md) 中的成功定义；
- 四个 change 已按顺序 validate、sync 并 archive；
- 每个可见 outcome 都严格按规格映射到 `guide`、`confirm` 或 `hard-stop`；
- 每个确定性失败都有一个 direct owner 与 same-check recovery；
- 没有生产 `deck_*` 数据被用作 source、fixture 或 migration target；
- 没有剩余 implementation 或 contract task 被隐式延期。

## 停止条件

若任何阶段要求以下任一项，必须停止并修改设计：

- 为 browser fit 增加另一套 pass/fail authority；
- 把 Text Frame literals 放入 `render_profile_digest`；
- 在每个 lifecycle command 或每个 field 都启动一次 browser；
- 增加第二份持久 layout approval/evidence state；
- 在 plan-time browser proof 前修改 source state/receipt；
- 让 shared raw mechanics 解释 Framed Text Frame 语义；
- 要求人手工修复确定性 state/artifacts；
- 同一 root cause 有多个 recovery action；
- 用 force/waiver 跨过 identity、integrity、authorization 或 evidence completeness；
- 引入 hidden fallback、retry loop、watcher、daemon、inferred intent 或 parallel success store；
- 把 system font fallback 当作成功；
- profile drift 后静默复用 accepted underlay；
- 把 OCR 作为 prerequisite；
- 同一版本混用 Framed/Pure slides；
- 当前人类 `proceed` 前覆盖 canonical Style Master bytes；
- 把 first-N 或固定 pilot 数量当作 creative selection authority；
- pilot grant 只记录 count 或授权完整计划；
- 在当前 pilot `proceed` 和单独精确 expansion authorization 前 submit 剩余页面；
- expansion 时静默重新生成当前 pilot bytes；
- 把部分 pilot evidence 接受为完整 raw/final evidence；
- 建立共享 user-facing pilot branch，迫使一种 workflow 理解另一种；
- 增加第二 authorization ledger，或依据 filename 推断 raw success。

出现任何一项，都说明 quality-control layer 已比它验证的工作更复杂。
