# Plan: 可切换的三模式生产系统

> 类型: 设计 / 发行路线 | 更新: 2026-07-21 | 状态: 活跃 | 建议: 2 个 OpenSpec change，严格串行

## 目标

先发行一条真正可用的 Image2 主生产路径，同时保留 HTML 走向高质量确定性渲染的空间。

当前 HTML-first 能完成本地生产，但视觉质量不足，不能继续作为所有新 deck 的强制前置。现有
whole-page Image2 已能承担主渲染，却只被归类为 markerless legacy maintenance；modern Image2
又只能在 HTML delivery 后做 visual-slot refinement。结果是用户为了使用 Image2，必须先经过当前
质量不够的 HTML 流程。

本计划把“用户对某个 run version 想走哪种生产方式”提升为可变、version-scoped 的 deck-state
权威记录，并让统一 `ppt_flow`
根据该状态选择 production adapter。首个发行重点是 `image2-only`；HTML 两种模式继续存在，
但 HTML 视觉质量由后续独立计划治理。

## 三个模式

| `production_mode` | 最终页面权威 | Image2 角色 | 对应 pipeline |
|---|---|---|---|
| `html-only` | HTML compositor | 可提供普通图片资产，但不是必需 refinement | `html-first-v1` |
| `html-then-image2` | HTML compositor | HTML delivery 后必须完成 bounded visual-slot refinement | `html-first-v1` |
| `image2-only` | Whole-page Image2 | 主渲染器 | `legacy-image2-first` |

这里的关键不是“HTML 有没有视觉效果”，而是谁拥有最终页面像素：

- HTML 应最终成为语义驱动、确定性、高质量的 composition engine；它可以使用图片、图标、图形、
  图表、关系图、纹理和生成式资产，不等于“只有文字”。
- `html-then-image2` 仍由 HTML 掌控结构和最终 composition，Image2 只增强受控视觉槽。
- `image2-only` 由 Image2 生成整页视觉，确定性 header/assembly/notes 作为后处理。

## 权威模型

### `production_mode` 是唯一 SSOT

权威值存放在 deck-root `_state/state.yaml`，按 canonical run-version key 记录：

```yaml
production_mode:
  by_version:
    3_versions/v1:
      mode: image2-only   # html-only | html-then-image2 | image2-only
```

`production_mode` 与 `pipeline`、`playbook`、`current_node` 同级，由 state owner 通过 CAS/atomic
write 修改。每个 command 已经接收明确 `run_dir`，因此只能读取该 version 的 mode record；不能用
一个 deck-global scalar 把历史版本重新解释成当前 mode。用户可在工作过程中改变目标 version 的
mode；它不是只在 init 时写一次的静态配置。

`project-metadata.yaml` 只保存人类可读镜像：

```yaml
production_mode: image2-only
production_mode_run_version: v1
```

镜像表示最近一次面向人展示的 version/mode，不是完整历史。它不得参与 command 路由或 recovery
决策。镜像缺失/漂移由 status 报告，并由 state-owned
写事务修复；不能反过来覆盖 state。

### Pipeline 是版本事实，不是 mode 的第二份 SSOT

`slide-specifications.md` 的 `production.pipeline` marker 描述某个具体 run version 的实际
renderer contract。它与 mode 是两个维度：

- mode 是该 run version 当前生产意图，可改变；
- pipeline 是该版本 source/artifact 的实际技术契约；
- `derivePipelineFromMode(mode)` 给出两者必须满足的一致性关系。

State 中该 run version 的 mode 与其 source marker 不一致时，普通生产 command 必须返回 typed
`transition_required|state_drift`，不能任选一边继续。

### 只允许一次性旧状态迁移，不允许运行时猜测

旧 deck 第一次升级 state schema 时，缺失 mode 可以对每个 visible version 按 canonical marker
一次性迁移：

- markerless / `legacy-image2-first` -> `image2-only`
- `html-first-v1` -> `html-only`

不得根据“是否曾有 Image2 refinement state”推断 `html-then-image2`，因为 optional refinement
历史不等于用户选择了 required refinement mode。一旦 mode 被迁移或显式写入，所有 command
只读 state；state 缺失、损坏或含非法 mode 时 fail closed，不 fallback 到 metadata、generated
artifacts 或 source marker 猜用户意图。

## Production Mode Module

新增一个深 module，集中 mode 词汇、派生规则和 routing policy；`ppt_flow`、state、bundle init、
playbook validator 不得各自复制三套条件表。

建议 module interface 只暴露：

```js
inspectProductionMode({ deckDir, runDir })
classifyProductionModeTransition({ fromMode, toMode, sourcePipeline })
productionPolicyForMode(mode)
```

`inspectProductionMode` 必须使用调用方的 exact `runDir` 读取 canonical version record。State owner
继续独占持久化和 CAS transaction；module 不成为第二个状态 owner。它返回的 policy
至少包含：

```js
{
  mode,
  pipeline,
  page_authority: "html" | "image2",
  refinement_policy: "disabled" | "required" | "not-applicable",
  style_master_policy: "current" | "reserved-html-adapter",
}
```

Command router 只消费这一个 policy 并委托现有 HTML 或 whole-page Image2 adapter。删除这个 module
时，mode 判断会重新散落到所有 caller，因此它应真正集中复杂度，而不是做 pass-through。

## Init 与默认发行姿态

`ppt_flow init` 增加：

```bash
ppt_flow init deck_xxx --deck-type pitch --style tech-startup --mode image2-only
```

首版默认值建议改为 `image2-only`。这是有意的产品默认变更：不传 `--mode` 的新用户应进入当前
更可用的 Image2 主生产路径，而不是被迫先完成 HTML。帮助和 init stdout 必须明确显示实际 mode、
pipeline 和下一步；Agent 仍可在 init 时根据用户选择显式传入其他 mode。

Init 行为：

- `image2-only`：复用现有 whole-page Image2 renderer implementation，但进入第一等的新 deck
  controller，不把用户降级到“legacy maintenance”。
- `html-only`：使用现有 HTML-first seed 和 delivery controller。
- `html-then-image2`：使用 HTML-first seed，最终 completion 额外要求 current refinement + final review。

## Command 路由

| Command | `html-only` | `html-then-image2` | `image2-only` |
|---|---|---|---|
| `init` | HTML seed | HTML seed + required refinement policy | Image2-primary seed |
| `doctor` | base/local HTML checks | base + optional Image2 readiness guidance | Image2 readiness guidance |
| `validate` | HTML validation | HTML validation | whole-page Image2 validation |
| `pilot` | HTML local preview | HTML local preview | Image2 pilot generation |
| `approve content/visual` | HTML review gates | HTML review gates | whole-page content/visual gates |
| `approve header` | 当前不适用 | 当前不适用 | current header review |
| `style-master` | reserved HTML adapter | reserved HTML adapter | current Image2 style master |
| `build` | HTML delivery | HTML delivery，之后 refinement 仍为 required | whole-page Image2 delivery |
| `refresh` | HTML refresh | HTML refresh + refinement freshness | whole-page Image2 refresh |
| `image2 *` | disabled by mode | modern visual-slot refinement | 不适用；主出图走 pilot/build |
| `migrate-html` | 已是 HTML，不适用 | 已是 HTML，不适用 | 作为跨 pipeline transition 的现有一侧 |
| `status/state` | mode + HTML completion | mode + refinement required/current | mode + Image2 completion |
| `slides/new-version/test` | 共用结构与测试 interface | 共用结构与测试 interface | 共用结构与测试 interface |

### Style master 留出未来入口

HTML mode 下当前实现可以返回 typed `capability_not_available` guidance，但 mode model 不得把
style master 定义为永久 forbidden。未来 HTML 极致渲染可能需要一个 HTML visual-system adapter，
将视觉方向转为结构化 tokens、layout rhythm、icon/diagram language、image language、texture 和
reference board。它可以复用 `style-master` command seam，但不必复用 legacy `style_master.jpg` 的
文件形态或 provider 语义。

因此，本计划只保留 interface 和 policy 入口；HTML style-master 的实际实现归未来 HTML 质量计划。

## Mode 切换

用户的切换请求永远不能只得到“禁止切换”。系统按影响选择最近的安全路径。

### 同 pipeline 切换

`html-only <-> html-then-image2` 不改变 source contract，可由 state owner 原子切换：

- `html-only -> html-then-image2`：启用 required refinement；已有 current candidate/evidence 重新校验。
- `html-then-image2 -> html-only`：取消 completion debt，但保留 refinement state、candidate 和已接受
  source asset，不删除用户工作；切回时可继续或重新判 stale。

所有切换追加 audit history，但 `history.jsonl` 只做审计，不参与恢复或路由。

### 跨 pipeline 切换

`html-* <-> image2-only` 改变 source/artifact contract，不能原地改当前 version，也不能通过
`--force` 删除 source、state 和 generated tree。它必须走 previewed versioned transition：

```text
request target mode
  -> prepare/author target source
  -> preview exact target + impact
  -> human confirms exact plan hash
  -> publish clean vNext
  -> atomically commit target production_mode record
```

旧 version 和旧模式产物保留。Target version 的 mode record 只有在 clean target visible 且 source
marker/receipts 验证完成后才提交；source version record 始终不变。失败时 source/target mode 均不改变。

- `image2-only -> html-*` 复用现有 markerless-to-HTML migration preparation/preview/apply interface，
  在成功 handoff 时提交 target mode。
- `html-* -> image2-only` 增加对称的 projected candidate/Agent authoring/version publication；不从
  structured HTML 自动猜 whole-page IMAGE PROMPT，不复制 HTML generated bytes 充当 Image2 source。

## 向后兼容

- 现有 markerless deck 一次性迁移为 `image2-only`，原 production 行为不变。
- 现有 HTML-first deck 一次性迁移为 `html-only`；曾经做过 optional refinement 不会自动变成
  `html-then-image2`。
- `production_mode` 写入后，不再运行 inference。
- 现有 source marker、version identity、provider authorization、journal/CAS 和 no-replace publication
  边界继续生效。

## OpenSpec Change 划分

建议只做 **2 个 change**。一个 change 会让首版 Image2 发行被双向 source conversion 拖住；拆成
三个以上又会把同一个 mode SSOT 和 routing interface 拆成多个临时协议，增加同步、测试与归档成本。

### Change 1: `add-production-mode-and-image2-primary`

**目标**：交付可发行的 Image2-primary 新 flow，并建立完整 mode SSOT/interface。

**范围**：

- state schema 增加 authoritative mutable、version-scoped `production_mode.by_version`，实现一次性旧状态 migration；
- metadata 仅镜像，status 报告 drift，普通 routing 禁止 fallback 推断；
- 建立 production-mode module 和三模式 policy；
- `init --mode`，默认 `image2-only`；
- 把 whole-page Image2 adapter 接入第一等 create-deck controller，不再只允许 legacy maintenance；
- 统一 validate/pilot/approve/build/refresh/status 路由和 command return audit；
- `html-only <-> html-then-image2` 原子切换且不删除 refinement work；
- style-master 保留 HTML adapter seam，当前返回明确的 capability guidance；
- HTML 两种模式保持现有实现，`html-then-image2` completion 要求 refinement；
- 单元、CLI、playbook simulation 和 Image2-primary E2E。

**主要 capability**：`node-specification`、`playbook-execution`、`cli-surface`、
`run-bundle-management`、`pipeline-orchestration`、`image-generation`，必要时触及
`commands-reference` 与 `bootstrap-env-guidance`。Proposal 必须逐项核对 main specs 后确认。

**退出条件**：新用户不经过 HTML 即可从 init -> intake/authoring -> style master -> pilot/review ->
build/PPTX/notes/final review；mode/status/state 一致，未授权 provider submit 仍 hard stop。

### Change 2: `add-versioned-production-mode-transitions`

**目标**：允许用户在任何阶段改变 page authority，同时保留旧版本和所有可归属工作。

**范围**：

- state-owned transition preview/confirm/apply interface 与 exact plan hash；
- active playbook 安全 handoff，不伪造 controller completion；
- `image2-only -> html-only|html-then-image2` 复用现有 HTML migration；
- `html-* -> image2-only` 新增对称 candidate authoring 和 clean-vNext publication；
- target publish 成功后才提交 mode；失败/decline 保持 current mode/version；
- 不删除旧 source、generated、refinement candidate 或 review history；
- transition recovery、collision、drift、cross-host ownership 和 idempotency 测试。

**主要 capability**：`node-specification`、`playbook-execution`、`cli-surface`、
`run-bundle-management`、`pipeline-orchestration`、`run-bundle-layout`，并复用现有 migration contract。

**退出条件**：三种 mode 两两切换均有明确、安全、可恢复的用户路径；跨 pipeline 从不原地改 source，
也不以“模式不兼容”为最终拒绝。

## 为什么不合成一个 Change

Change 1 是发行闭环，Change 2 是双向 source/version transition。两者共享 mode interface，但失败面不同：

- Change 1 的风险是 command routing、state migration 和第一等 Image2 create flow；
- Change 2 的风险是跨 pipeline authoring、version publication、recovery 和 no-data-loss。

合并会让首版必须等待最复杂的 HTML -> Image2 转换；拆成两项则 Change 1 归档后即可发行，Change 2
建立在稳定 main specs 上。继续拆分 SSOT、init、routing、playbook 或 style-master 只会产生临时状态，
不建议。

## 验证矩阵

### Change 1

1. 新 init 默认在 `3_versions/v1` 记录 `image2-only`；state version record 是唯一 mode authority，metadata 只是镜像。
2. 显式三个 mode 分别生成匹配 source marker 和 controller。
3. Image2-only 在新 flow 中完成 whole-page deck，不经过 HTML production/refinement。
4. HTML-only 完成不产生 Image2 debt；HTML-then-Image2 未完成 refinement 时 status 明确未完成。
5. HTML 两模式可往返切换，现有 refinement work 不删除。
6. state 缺失/损坏/非法 mode 时不根据 metadata 或 generated artifacts 偷偷路由。
7. style-master 在 Image2 mode 正常；HTML mode 返回未来 adapter guidance，而非永久禁止声明。
8. CLI return audit、targeted tests、`npm test`、`npm run test:e2e` 与 strict OpenSpec validation 通过。

### Change 2

1. Image2 -> HTML 复用准备、Agent authoring、preview、exact confirmation、clean vNext。
2. HTML -> Image2 生成新的 authored whole-page candidate，不从 HTML bytes/source 猜 prompt。
3. 切换前失败或 decline 不改变 mode/current version。
4. 切换成功后 target version mode record、target marker、playbook 与 metadata mirror 一致，source record 不变。
5. 旧 version、旧 generated work、accepted source assets 和 audit history 均保留。
6. journal/CAS/target collision/drift/recovery 不变量与全量测试通过。

## 非目标

- 本计划不解决 BUG-014/015，也不声称当前 HTML 已达到发行质量。
- 本计划不实现 HTML style-master adapter，只保留可扩展 interface。
- 不把 modern visual-slot refinement 改造成 whole-page renderer。
- 不允许 metadata、source marker、generated artifacts 或 history log 成为 mode 的第二事实源。
- 不通过删除 `_generated/`、state 或当前 source 来完成 mode 切换。

## 下一步

先对本计划做一次 proposal 前 scope review，随后用一个 OpenSpec proposal 创建 Change 1
`add-production-mode-and-image2-primary`。Change 1 完成、strict validation、main-spec sync 和归档后，
再创建 Change 2；不并行维护两套尚未成为 main spec 的 mode 契约。
