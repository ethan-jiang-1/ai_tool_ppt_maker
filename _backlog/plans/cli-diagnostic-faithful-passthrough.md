# Plan: CLI 诊断事实、恢复权威与相邻问题的串行修复路线

> 类型：优先级路线图 + OpenSpec change 队列
> 更新：2026-08-16
> 状态：研究已完成，等待启动 Change 1
> 当前 OpenSpec：`openspec list --json` 为 `changes: []`
> 总进度：研究里程碑 `2 / 2`；实施 change `0 / 6`

## 这份计划怎么用

本文件是总进度账本。研究证据保存在同名子目录：

- [`README.md`](cli-diagnostic-faithful-passthrough/README.md)：研究索引；
- [`09-synthesis.md`](cli-diagnostic-faithful-passthrough/09-synthesis.md)：问题综合；
- [`10-remediation-priority-and-order.md`](cli-diagnostic-faithful-passthrough/10-remediation-priority-and-order.md)：处置优先级与实施依赖顺序。

执行纪律：

1. 同一时间只允许一个本路线图下的 active OpenSpec change。
2. 当前 change 完成实现、验证、main spec 同步和 archive 后，才启动下一个。
3. 每个 change 必须有独立终态，不能依赖尚未发布的下一个 change 才保持系统安全。
4. 只有新的一手生产阻塞证据才能触发重排；重排先修改本文件并记录理由，不并行开 change。
5. 勾选框只有在对应证据存在时才从 `[ ]` 改为 `[x]`，不能按“基本做完”提前勾选。

## 为什么不是一个大 change

调查已经证明这不是一个 `PageImageVisualLanguageError` 少字段的问题，而是四层边界同时失配：

```text
source/config producer
  -> Page Source aggregation
  -> operation recovery owner
  -> public CLI envelope
```

上游会丢失或改错 owner、field 和 path；operation owner 多数尚未提供 machine next；internal
`issues[]` 与 public `issues[]` 又不是同一个 schema。把这些全部塞进一个 change，会同时决定 internal
contract、公开兼容、恢复动作、shared-source scope、测试路由和旧逻辑删除，难以判断哪一层真正正确。

因此路线图采用“一个 change 关闭一个清晰边界”的方式：

```text
Change 1 保护事实
    -> Change 2 绑定并公开正确恢复
        -> Change 3 关闭 shared-source scope / precedence
            -> Change 4 删除重复归因并加守卫
                -> Change 5 统一 Image2 runtime startup
                    -> Change 6 补 validate source/state observation
```

Change 1-4 是同一 diagnostic authority 链，默认连续完成后再进入相邻问题。Change 5 技术上独立；若它
重新成为当前生产 blocker，可以在一个 change 已 archive 后显式前移，但不得并行。

## 总进度清单

- [x] 完成问题复现、failure inventory、边界模型、public shape、scope、action authority 和历史测试审计。
- [x] 完成“控制面伤害”与“永久实施依赖”两轴排序。
- [ ] Change 1：`stabilize-page-image-diagnostic-facts`。
- [ ] Change 2：`publish-owner-issued-page-image-recovery`。
- [ ] Change 3：`bound-shared-page-image-diagnostic-scope`。
- [ ] Change 4：`guard-page-image-diagnostic-authority`。
- [ ] Change 5：`unify-image2-runtime-startup`。
- [ ] Change 6：`project-validate-source-state`。

当前下一步：启动 Change 1；在它 archive 前不创建 Change 2。

## 排序依据

| 顺序 | Change | 优先级理由 | 依赖 | 完成后解决什么 |
|---:|---|---|---|---|
| 1 | Stabilize diagnostic facts | 最基础：事实一旦在 producer/aggregation 边界丢失，下游无法恢复 | 研究结论 | 四类 source/config failure 到 operation 边界时保留正确 owner/origin/locator |
| 2 | Publish owner-issued recovery | 最重要的用户可见问题：停止 inspect 自循环和虚假 internal story | Change 1 | Style Master/Image2 获得正确 source repair envelope；评估关闭 BUG-067/068 |
| 3 | Bound shared-source scope | 防止一个 shared defect 被伪装成大量 slide-local defects或被 truncation 改变根因 | Change 2 | fan-out、aggregation、precedence、same-code/different-owner 语义稳定 |
| 4 | Guard diagnostic authority | 防止 code/prefix 第二归因器和不可执行 coverage metadata 回流 | Change 3 | 旧路径删除/收窄，architecture 与 process guards 可证伪 |
| 5 | Unify runtime startup | 独立但高影响：消除 doctor READY 与实际 provider entry 的环境来源分叉 | 默认在 Change 4 后；可显式前移 | 评估关闭 BUG-070 |
| 6 | Project validate observation | 重要但不应先于 source-invalid 语义稳定 | Change 2、3 | source-valid/state-stale 可机器观察；评估关闭 BUG-069 |

## Change 1：`stabilize-page-image-diagnostic-facts`

**状态：NEXT**

### 目标

在 facts 尚未丢失的位置建立一个稳定的 cross-module problem-fact contract，并让四类已确认 failure 在
到达 Style Master/Image2 operation boundary 时仍保留正确的 producer origin 和 locator。

这一步只解决 problem-fact fidelity，不生成 public CLI next，也不让低层 resolver 拥有 CLI schema。

### 预期 capability 范围

- `content-parsing`：Page Source field ownership 和 resolver-origin aggregation；
- `visual-config`：Visual Language 与 presentation source facts；
- `visual-asset-management`：reference registry/path/identity facts；
- 只有 operation boundary 的可观察 contract 确实变化时，才修改 `image-generation` 或
  `style-master-generation`。

### 必须解决

- `resolveVisualBrief()` 不再把 identity、visual language 和 presentation failure 无条件改写成
  `VISUAL BRIEF`。
- Page Source-owned failure定位到实际 field，例如 `VISUAL IDENTITY`、`SUBTITLE` 或真正的
  `VISUAL BRIEF`。
- Reference loader 在知道 exact registry path 时保留 bounded physical owner locator。
- Physical source、logical path、Page Source field和 producer owner 不再混成一个无类型 `path`。
- 不依赖 `Error.message` 解析 token、owner 或 recovery。
- 不公开 stack、任意 prose、完整 visual clause、parser/fs details 或其他未获准字段。

### 明确不做

- 不修改 public `pptmaker-cli-diagnostic` shape 或 next action。
- 不关闭 BUG-067/068；公开 fallback 要等 Change 2。
- 不处理 multi-page fan-out、issue cap 或 unselected registry record 的最终语义；这些进入 Change 3。
- 不修改 MD consumer。

### 完成判据

- [ ] 四个 producer family 的 authority/field/locator contract写入准确的 delta specs。
- [ ] `PageImageSourceError`、`PageImageVisualLanguageError`、`PageImagePresentationError` 和
  `PageImageReferenceMaterialError` 都能在 operation boundary 形成受支持、bounded 的 problem fact。
- [ ] Reference defect 不再被误定位为 `slide-specifications.md / VISUAL BRIEF`。
- [ ] Identity role failure定位到 `VISUAL IDENTITY`；Framed header conflict定位到真实 header/class field。
- [ ] 未知或 unsafe detail保持内部，且没有新增 raw Error passthrough。
- [ ] Module/integration negative tests证明 facts 未丢失、无 receipt/plan/state/provider side effect。
- [ ] Public CLI 在本 change 中没有未声明的 schema 或恢复行为变化。

### Change 生命周期

- [ ] 使用 OpenSpec CLI scaffold `stabilize-page-image-diagnostic-facts`。
- [ ] Proposal 完成并确认 WHY、范围、owner 和 run-bundle impact。
- [ ] Delta specs 完成。
- [ ] Design 完成 authority、surface grade、negative path 和兼容决策。
- [ ] Tasks 完成并按 source authority -> adapters -> tests -> validation 排序。
- [ ] Implementation 完成。
- [ ] Targeted unit/integration verification 通过。
- [ ] `openspec validate stabilize-page-image-diagnostic-facts --strict --no-interactive` 通过。
- [ ] Main specs 同步并 archive。

## Change 2：`publish-owner-issued-page-image-recovery`

**状态：BLOCKED BY CHANGE 1**

### 目标

由 Style Master/Image2 operation owner把 Change 1 的 problem fact 与当前 checkpoint 的 nearest legal
action 组合；direct CLI 只做 bounded、secret-safe 的 public projection。

这是最先改变用户恢复体验的 change：它必须消除 self-referential inspect 和已知 source defect 的
`internal/report_internal` 故事。

### 预期 capability 范围

- `cli-surface`：public category/reason/issues/source/subject/next 和兼容策略；
- `style-master-generation`、`image-generation`：operation owner action binding；
- `node-specification` 只在 consumer consumption contract确实变化时修改，不复制 producer schema。

### 必须解决

- `style-master inspect/plan` 与 `image2 plan` 消费同一个 producer fact，但各自绑定合法 operation next。
- 已登记 source/config fact进入 `source_validation` 和 owner repair，不再依赖 code prefix猜 category。
- `style-master inspect` 的 next不能回到具有相同失败前置条件的 inspect。
- Presentation 已有顶层 code 但未分类的问题必须与 issue-only family 一起解决。
- Public projection明确哪些 internal facts保留、转换或省略；raw `issues[]` 不能直接塞进 sanitizer。
- Unsupported、invalid、unsafe 或 oversized fact继续 fail closed，不猜 source/retry/action。
- Delegated child diagnostic passthrough语义保持不变，不与同进程 domain error混为一谈。

### 明确不做

- 不解决 shared source 对多页的完整 affected-subject表达；Change 3 负责。
- 不顺手改 `validate` observation 或 dotenv startup。
- 不在 MD Controller 解析 prose作为补偿。

### 完成判据

- [ ] Pure/Framed 的 Visual Language、Page Source、Presentation、Reference 代表性单根失败都有公开
  process assertion。
- [ ] 三个命令均 exit 1、stdout为空、恰好一个 final envelope、run-bundle完整 owner roots不变。
- [ ] Diagnostic保留受支持的 reason、owner locator/subject和一个 exact next。
- [ ] `style-master inspect/plan` 不再自循环；`image2 plan` 不再把已知 source defect称为 internal。
- [ ] Public schema兼容策略明确；如需 additive field，先写 spec、版本与 consumer行为。
- [ ] Secret-like、parser prose、absolute escape path、完整 clause和 oversized fixture均 fail closed。
- [ ] BUG-067、BUG-068 只在全部对应回归通过后评估关闭。

### Change 生命周期

- [ ] 使用 OpenSpec CLI scaffold `publish-owner-issued-page-image-recovery`。
- [ ] Proposal 完成。
- [ ] Delta specs 完成。
- [ ] Design 完成 problem fact + operation action + CLI projection 的组合边界。
- [ ] Tasks 完成。
- [ ] Implementation 完成。
- [ ] Pure/Framed process regression 通过。
- [ ] `openspec validate publish-owner-issued-page-image-recovery --strict --no-interactive` 通过。
- [ ] Main specs 同步并 archive。

## Change 3：`bound-shared-page-image-diagnostic-scope`

**状态：BLOCKED BY CHANGE 2**

### 目标

关闭 shared source、multi-slide fan-out、多 issue aggregation、truncation 和 precedence 的剩余语义，确保
diagnostic 的 root cause不因 slide数量、顺序或 public bounds而改变。

### 预期 capability 范围

- `visual-config`：whole-registry 与 full presentation package scope；
- `visual-asset-management`：selected reference source root与 affected selections；
- `content-parsing`：shared fact和 slide-local field fact的聚合边界；
- `cli-surface`：bounded root/affected-subject public表达（仅在需要时做兼容加法）。

### 必须解决

- 一个 malformed shared reference registry不再被复制成任意数量的 `VISUAL BRIEF` root defects。
- Root source、logical locator和 affected slides/selections保持不同语义。
- 多 issue超过 cap时，root owner/reason不能因 truncation或 slide order变化。
- 相同 reason code来自 Visual Language 与 Reference Material时仍能区分 owner和 repair source。
- 明确 whole-source validation 与 earliest independent failure 的 deterministic precedence。
- 裁决“unselected Visual Language invalid record”究竟是 registry-level source invalid，还是必须 selection
  isolated；在 spec 决定前不让当前实现自行成为规范。

### 完成判据

- [ ] 五页共享 malformed registry fixture产生一个稳定 root diagnosis，而不是 30 个伪 local roots。
- [ ] Affected subjects 如公开，必须 bounded、可截断且不改变 root reason/next。
- [ ] Presentation full-package blast radius与 selected workflow事实一致。
- [ ] Multi-source/multi-issue precedence在 Pure/Framed和三个命令间稳定。
- [ ] Same-code/different-owner process tests通过。
- [ ] Unselected-record语义写入 owner spec并有正反测试。
- [ ] 无 provider call、无 run-bundle写入、无历史成功 fallback。

### Change 生命周期

- [ ] 使用 OpenSpec CLI scaffold `bound-shared-page-image-diagnostic-scope`。
- [ ] Proposal 完成。
- [ ] Delta specs 完成。
- [ ] Design 完成 aggregation、precedence、bounds和兼容策略。
- [ ] Tasks 完成。
- [ ] Implementation 完成。
- [ ] Multi-page/multi-issue process regression通过。
- [ ] `openspec validate bound-shared-page-image-diagnostic-scope --strict --no-interactive` 通过。
- [ ] Main specs 同步并 archive。

## Change 4：`guard-page-image-diagnostic-authority`

**状态：BLOCKED BY CHANGE 3**

### 目标

在所有受支持 source/config families 已走 owner-issued路径后，删除或收窄重复归因，建立可证伪的
architecture/process guards，防止未来又回到 `error.code || fallback` + prefix taxonomy。

### 预期 capability 范围

- `cli-surface`：受支持 diagnostic的唯一公开投影入口；
- `harness-script-layout`：依赖方向与 architecture guard；
- 测试/验证资产只在确有 requirement-level行为变化时对应修改 capability。

### 必须解决

- 已迁移 source/config family不再由 `ppt_flow.mjs` code/prefix sets重新推导 owner/category/next。
- 保留 `attachCliDiagnostic()` 已有的 delivery-notes jurisdiction；不得因本问题把低层 source resolver
  变成 CLI diagnostic producer。
- `diagnosticFromError()` 目前没有调用者：要么在明确 jurisdiction 和 tests 下成为受支持 seam，要么
  retire，不能继续保留“看起来可用”的第二入口。
- Return-category audit不能只证明 probe文件存在；它必须可追溯到真实、可执行的代表性行为证据。
- Target diagnostic process suite进入一个不会被 core/sweep结果误解的受支持验证层级。
- Guard必须有 planted violation证明能抓到 owner bypass或第二归因器回流。

### 完成判据

- [ ] 重复 classifier branch/sets被删除或只保留其真正拥有的 lifecycle/public projection职责。
- [ ] Architecture guard检测直接从未登记 Error prose/code猜 recovery的新增路径。
- [ ] Coverage metadata指向可执行 test，而不只是存在的文件。
- [ ] Verification tier文案与实际执行范围一致。
- [ ] Negative control证明 guard有灵敏度。
- [ ] 无新 public schema、无 consumer-side schema复制、无 run-bundle migration。

### Change 生命周期

- [ ] 使用 OpenSpec CLI scaffold `guard-page-image-diagnostic-authority`。
- [ ] Proposal 完成。
- [ ] Delta specs 完成。
- [ ] Design 完成 retirement、guard和验证层级决策。
- [ ] Tasks 完成。
- [ ] Implementation / deletion 完成。
- [ ] Architecture、process和negative-control verification通过。
- [ ] `openspec validate guard-page-image-diagnostic-authority --strict --no-interactive` 通过。
- [ ] Main specs 同步并 archive。

## Change 5：`unify-image2-runtime-startup`

**状态：QUEUED；技术上独立**

### 目标

让 doctor 的 raw-generation readiness、Image2 authorize/generate 和相关 Style Master provider operations
使用同一个受限 startup loader和同一环境优先级，消除“doctor READY，但实际入口读不到同一配置”。

### 预期 capability 范围

- `environment-check`：readiness所使用的 runtime source；
- `image-generation`、`style-master-generation`：provider boundary startup；
- `cli-surface`：只在公开 diagnostic或命令行为变化时修改。

### 必须解决

- 显式 process environment优先；deck `.env` 只补缺；project/cwd `.env` 只补仍缺字段。
- Loader只读取已声明 runtime keys，不输出值或 secrets。
- 所有宣称 ready/executable 的相关入口共享同一来源和 precedence。
- 缺失、无效和 profile mismatch仍在 grant/attempt/provider request之前 hard-stop。
- 不相关 CLI不得因此隐式读取 dotenv或改变行为。

### 完成判据

- [ ] 无 shell export时，doctor READY 后 exact authorize/generate解析同一 matching profile。
- [ ] Shell > deck > project/cwd precedence有正反测试。
- [ ] Missing/invalid/mismatch保持现有 secret-safe hard-stop和零 provider side effect。
- [ ] Style Master provider operations与 Image2使用同一受限 startup source。
- [ ] BUG-070 只在真实公开入口回归通过后评估关闭。

### Change 生命周期

- [ ] 使用 OpenSpec CLI scaffold `unify-image2-runtime-startup`。
- [ ] Proposal 完成。
- [ ] Delta specs 完成。
- [ ] Design 完成 precedence、scope和secret边界。
- [ ] Tasks 完成。
- [ ] Implementation 完成。
- [ ] Doctor/Style Master/Image2 process regression通过。
- [ ] `openspec validate unify-image2-runtime-startup --strict --no-interactive` 通过。
- [ ] Main specs 同步并 archive。

## Change 6：`project-validate-source-state`

**状态：BLOCKED BY CHANGE 2 AND CHANGE 3**

### 目标

让 `validate` 在保留 source/state identity stale hard-stop 的同时，机器可消费地表达 source parsing已经
成功；source-invalid仍必须优先返回真正 source problem。

它排在 diagnostic contract之后，因为在 source-invalid owner/precedence尚不稳定时增加
`source_validation: valid`，会制造第二份相互矛盾的观察权威。

### 预期 capability 范围

- `cli-surface`：public validate output、exit和兼容；
- source validation / workflow inspection 的既有 owning capability，由 proposal按实际 evaluator确认；
- `node-specification` 只定义 consumer如何使用公开 observation，不复制 producer schema。

### 必须解决

- Source-invalid：source problem优先，不能被 state identity mismatch覆盖。
- Source-valid + state-stale：exit保持 nonzero，state owner hard-stop和 exact next保留，同时公开稳定的
  source-valid observation。
- 不授予 raw planning、provider work、state rebind或绕过 stale identity 的权限。
- 明确 human text、JSON/non-JSON compatibility和 MD consumer行为。

### 完成判据

- [ ] Source-invalid、source-valid/state-current、source-valid/state-stale三类矩阵有公开进程测试。
- [ ] Source-valid observation不能被解释为整条 validate成功或 provider授权。
- [ ] State stale hard-stop和 owner next保持唯一。
- [ ] 无 state/receipt/plan/provider side effect。
- [ ] BUG-069 只在 public observation和 consumer回归通过后评估关闭。

### Change 生命周期

- [ ] 使用 OpenSpec CLI scaffold `project-validate-source-state`。
- [ ] Proposal 完成。
- [ ] Delta specs 完成。
- [ ] Design 完成 observation surface、compatibility和authority决策。
- [ ] Tasks 完成。
- [ ] Implementation 完成。
- [ ] Validate/consumer process regression通过。
- [ ] `openspec validate project-validate-source-state --strict --no-interactive` 通过。
- [ ] Main specs 同步并 archive。

## Bug 对应关系

| Bug | 本路线图位置 | 关闭条件 |
|---|---|---|
| BUG-067 | Change 1 提供事实基础；Change 2 修公开恢复 | Style Master inspect/plan 的真实 Pure/Framed failure不再自循环，owner fact和 exact next通过进程回归 |
| BUG-068 | Change 1 提供事实基础；Change 2 修公开恢复 | `image2 plan` 不再把已知 source defect称为 internal，且 process/no-write/fail-closed回归通过 |
| BUG-069 | Change 6 | source-valid/state-stale observation、nonzero hard-stop和 consumer行为全部通过 |
| BUG-070 | Change 5 | doctor与实际 runtime入口使用同一 precedence，并在真实进程边界通过 |
| BUG-071 | 不纳入 | 仍需独立定义 live writer、submitted outcome与 reconcile时间语义 |
| BUG-072 | 不纳入 | 仍需独立处理 durable cursor与 owner projection |

## 全路线图共同约束

- 所有验证使用 isolated fixtures，不把 production `deck_*` 或 `dpt_*` 当测试资产。
- 不手改任何 `_generated/`、state、receipt、journal或 lock。
- Public CLI field、exit path、stdout JSON、stderr diagnostic先由 `cli-surface` spec拥有。
- MD consumer只消费 producer公开事实和 exact next，不解析 prose、不复制 producer schema。
- Unknown/unsafe fact始终 fail closed；不得用 force、retry、waiver或历史成功结果掩盖 source defect。
- 每个新增 contract或 seam必须说明它替代/删除的旧归因逻辑；不能只增加第四层 adapter。
- 每个 change必须包含 focused negative coverage，证明前置失败短路、无错误 owner写入、无 provider call。
- Run-bundle contract默认应为 `none` 或 compatible；若任何 change需要 migration，必须停止并单独取得决策。

## 每次更新进度时必须做什么

1. 更新文件顶部状态、当前 change和实施 change计数。
2. 更新“总进度清单”对应 checkbox。
3. 更新当前 change的生命周期与完成判据 checkbox。
4. 写明 OpenSpec change目录和最新 strict validation结果。
5. Change archive后才把下一项从 `BLOCKED/QUEUED` 改为 `NEXT`。
6. 若重排，记录新证据、决策者、原因和恢复默认顺序的条件。
