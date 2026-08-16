# Plan: CLI 诊断层应忠实透传 producer 语义，而非重建第二归因器

> 类型: 复盘（postmortem）+ 设计 | 更新: 2026-08-16 | 状态: 待 OpenSpec change 实施

## 一句话

活跃 BUG-067 / 068 / 069 / 070 不是四个孤立缺陷，而是同一个架构病灶的四个症状：
`ppt_flow.mjs` 的 CLI 归因层在 workflow producer 之上**重新推导了一遍 producer 已经算好的
语义**（错误分类、source/state 判定、环境加载），而这份第二实现是有损、会漂移的副本。
它违反了 `cli-surface` spec 里已经写死的两条铁律——「CLI routing does not duplicate
workflow evaluation」和「Delegated diagnostics preserve a trustworthy producer action」。
修复方向不是「设计出新的 CLI」，而是**让 CLI 层收缩成「消费 producer-issued typed 结果 +
忠实转发」的薄壳**，使 Agent 拿到的 `path / token / owner / next action` 不再被降级、吞并
或伪造。

## 触发这份 plan 的 owner 判断（上下文，原话保留）

> 「如果这个地方确实是 C（CLI 层），I（owner/设计者）要重新思考，让 A（Agent）更容易
> 使用这一块，它可能就是个比较重要的事情了。」

展开为明确术语：**问题若真的位于 CLI 这一层，owner 需要重新审视 CLI 的设计，目标是让
Agent 更容易消费 CLI 的回执。这不是四个 bug 的修补，而是一个层级设计问题。**

本 plan 的结论支持这个判断，并把它精化为：**spec 已经对了（cli-surface 早就写明了
producer-owns / consumer-不复制 的原则），错的是实现长出了一个和 spec 打架的第二归因器。**

## 为什么需要 / 意义 / 目的

### 1. 四个 bug 共享一个根因，逐个修会漏

| Bug | 症状 | 共同根因 |
|---|---|---|
| BUG-067 | Style Master 把 `PageImageVisualLanguageError` 改写为「lifecycle inspect」自循环 | CLI 归因不认 producer 的 typed error |
| BUG-068 | `image2 plan` 把同一 typed error 降级为 `internal` / `report_internal` | 同上，fallback 分支不同而已 |
| BUG-069 | `validate` 把「source 已通过 parse」吞并进「state stale」的 hard-stop | CLI 把 producer 的两个阶段投影成一个布尔 |
| BUG-070 | `doctor` 说 READY，但 `image2 authorize` 读不到同一 `.env` | CLI 的 readiness 判断与 consumer 的 env 边界不一致 |

根因都是同一个模式：**CLI 层在 producer 边界之上重新「翻译/归类/准备」了一遍，翻译得
不忠实。** 修任何一个而不修这个模式，其余三个（以及未来新入口）会继续以新形式复发。

### 2. spec 已对，实现偏离，这是 spec-vs-impl gap，不是 spec 缺失

`openspec/specs/cli-surface/spec.md` 早已声明：

- **「CLI routing does not duplicate workflow evaluation」**（~L28–38）：
  > Shared command routing SHALL consume the state/workflow owner result rather than
  > reconstructing mode, gate, authorization, recovery, or completion rules … it does not
  > synthesize a parallel route.
- **「Delegated diagnostics preserve a trustworthy producer action」**（~L46–75）：
  > the parent SHALL preserve the child's `category`, `operation`, `subject`, `reason`,
  > `issues`, and exact `next` action. … It SHALL not copy child prose, invent a child
  > category, or expose a speculative fallback.
- **「Style Master diagnostics remain owner-issued and bounded」**（~L95）：
  > consumers SHALL NOT derive a …（后文禁止 consumer 自行推导）

而 `ppt_flow.mjs` 的归因层恰恰是「reconstruct / invent a category / speculative fallback」
的实现。所以这份 plan 的定位是**纠偏，不是重新发明**。

### 3. 直接决定 Agent 是否可用这一块

Agent 靠 CLI 回执里的 `category / reason / path / next action` 决定下一步。当前行为对 Agent
的危害是三种：

- **自循环**（067）：`next action` 指向刚失败的那个 `style-master inspect`，Agent 无法前进。
- **假 internal**（068）：已知的 source 错误被说成 `report_internal`，Agent 会去报告 harness
  缺陷，而不是去修 clause。
- **假 READY / 假 validate**（070 / 069）：CLI 说 READY 但 consumer 不 READY；CLI 说 validate
  失败却不说「source 其实已通过 parse」。

这些都是「CLI 的结论与 producer 的真实状态脱节」直接导致的 Agent 可用性损伤。

## 背景 / 现状（三个降级点 + 代码证据）

### 降级点 1：归因降级 —— BUG-067 / BUG-068

`ppt_flow.mjs` 的归因入口是：

```js
// ppt_flow.mjs ~L1529
function pageImageDiagnosticReasonKind(value, fallback = "page_image_operation_failed") {
  const normalized = String(value || fallback).trim().toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")...;
  return /^[a-z][a-z0-9_-]{0,63}$/.test(normalized) ? normalized : fallback;
}
```

它只消费一个扁平的 `error.code` 字符串。但 producer 抛的 typed error 长这样：

```js
// page_image_visual_language.mjs ~L34
export class PageImageVisualLanguageError extends Error {
  constructor(issues) {
    const list = Array.isArray(issues) ? issues : [issues];
    super(list.map((i) => i.message).join("; "));
    this.name = "PageImageVisualLanguageError";
    this.issues = Object.freeze([...list]);   // ← 可消费信息在这里，没有顶层 code
  }
}
```

`error.code` 是 `undefined` → fallback 成 `style_master_operation_failed`（经
`styleMasterFailure()` ~L3159）→ 再被 `reason.startsWith("style_master_")` 归到泛化
「inspect」分支（~L3304）→ `next action` 回指 `style-master inspect` 自己（自循环）。
同一条错误走 `targetPageImageFailure()`（~L1697）则 fallback 成 `page_image_operation_failed`
→ `category: internal` + `next: report_internal`（068）。

**本质**：CLI 的「code → category」映射不认识 producer 的 typed error 结构（它假设错误一定
带一个扁平的 `code` 字符串），于是把已知的 deterministic source error 降级成泛化 lifecycle
或 internal。`issues[].path` / 违规 token / owner 全部丢失。

### 降级点 2：语义合并 —— BUG-069

```js
// ppt_flow.mjs ~L888
async function commandValidate(runDir) {
  ...
  const source = operations.resolveSource(route.run_dir);   // 内部有两个阶段
  console.log(`✓ ... ${source.receipt.slides.length} slide(s)`);
  ...
  } catch (error) {
    emitFailed("ppt_flow.validate.page-image", error.message ...);  // 两个阶段失败合并成一个
  }
}
```

`operations.resolveSource()` 同时做：① source/visual-language parsing（成功的事实）；②
source/state identity resolution（会因历史 stale evidence 失败）。CLI 一个 catch 只吐
`TARGET_SOURCE_STATE_IDENTITY_MISMATCH`，把「source 本身已通过 parse」这个可消费的中间
结论吞掉了。命令名叫 `validate`，却回答不了「我刚改的 source 本身有效吗」。

**本质**：CLI 把 producer 内部两个不同阶段的结局投影成一个布尔，丢失了中间事实。

### 降级点 3：准备边界不一致 —— BUG-070

```js
// commandDoctor() ~L742 —— doctor 自己 loadDotenv 后判 READY
loadDotenv(route.deck_dir);
loadDotenv(process.cwd());
requireMatchingImage2RuntimeProfileId({ expectedProfileId: profile.profile_id });
```

而 doctor 宣称 READY 的 consumer 是 `image2 authorize` → `operations.authorize` →
`preflightTargetRawProviderWork`：

```js
// page_image_target_runtime.mjs ~L1177 —— 只读 process.env，不 loadDotenv
requireMatchingImage2RuntimeProfileId({ expectedProfileId: profileId });
```

```js
// runtime_profile_id.mjs —— resolveImage2RuntimeProfileId 只读 process.env
export function resolveImage2RuntimeProfileId({ env = process.env } = {}) { ... }
```

对比 `generate` 路径：它走了 `targetPageImageGenerateCredentials()`（~L2484），那个函数
自己 `loadDotenv(deckRoot(runDir)) + loadDotenv(process.cwd())`，所以没暴露；`authorize` 的
preflight 没有这份 loader。

**本质**：「加载 deck/project .env」这件准备动作被复制了多份（doctor 一份、generate
credentials 一份、style-master transport 一份），authorize 那份漏了。doctor 的 READY 和
consumer 的实际执行边界不一致。

## 决策 / 方案（修复方向，供接手 agent 参考）

### 核心原则（来自 cli-surface spec，作为验收的北极星）

**CLI 层是 producer-issued typed 事实的忠实转发器，不是第二归因器。** 三句可执行的话：

1. **分类来自 producer**：`category / reason / issues / next` 由 producer（workflow resolver /
   owner）发出，CLI 只做规范化呈现 + bounded lineage，不做 `error.code → category` 的重新
   推导，也不发明 speculative fallback。
2. **typed error 的桥接在 producer 侧一处定义**：像 `PageImageVisualLanguageError` 这样
   「信息在 `issues[]`、没有顶层 `code`」的 typed error，需要一个 producer 侧的
   `toDiagnostic()` 映射（把 typed error 翻译成 cli-surface 的 diagnostic envelope），
   CLI 消费这个映射的结果，而不是去 `String(error.code || fallback)`。
3. **环境/准备走单一 shared startup boundary**：deck/project `.env` 的加载收敛到一处，
   doctor 的 READY 判断和 authorize/generate 的实际执行读同一个来源。

### 需要落地的改动面（初判，最终以 OpenSpec change design 为准）

| 区域 | 改动 |
|---|---|
| producer 侧（`04-pure-image/`、`02-visual-system/`、`shared/image2/*`） | typed error 增加 producer-owned `toDiagnostic()`（或等价）——把 `issues[]`、`code`、`path`、`owner` 映射成 cli-surface diagnostic 字段；`PageImageVisualLanguageError` 是首要对象 |
| `ppt_flow.mjs` 归因层 | 删除/收缩 `pageImageDiagnosticReasonKind(error?.code, fallback)` 的降级链与各 command 的 `startsWith(...)`/fallback 分支；改为「若 producer 提供 typed diagnostic → 忠实透传 + bounded lineage；若不可信 → fail closed 为 `report_internal`，不得发明 category」 |
| `commandValidate()` | 把 `resolveSource()` 的两阶段结局拆开投影：`source_valid` 与 `state_binding_stale` 分开呈现（或新增 source-only preflight projection），保住 source 已通过 parse 的事实；state identity hard-stop 不放松 |
| env 加载 | 把 deck/project `.env` 加载收敛到单一 shared boundary，doctor / authorize / generate / style-master 全部消费同一来源；`runtime_profile_id` 的 env 来源由该 boundary 提供，而非各处自行 `loadDotenv` |
| `openspec/specs/cli-surface/spec.md` | 若现有条款已覆盖（「no duplicate workflow evaluation」「delegated diagnostics preserve」），补 typed-error→diagnostic 的 scenario；若「prepare/env boundary」尚无条款，新增 |
| 测试 | 每条入口一个 regression：Style Master inspect/plan 的 typed visual-language failure（非自循环、有 path/token/owner）、`image2 plan` 的 typed source failure（非 internal）、`validate` 的 source-valid/state-stale 与 source-invalid 两分、doctor READY → exact authorize/generate 同源 env |

### 备选（已否决）

- **逐个 bug 在 fallback 分支里加 case**：继续在 CLI 层堆「code → category」的 case，等于继续
  维护第二归因器，四个之外还会冒出第五个。违反 spec 的「no duplicate evaluation」。
- **只给 `PageImageVisualLanguageError` 补一个 `code` 字段**：能解 067/068 的表面，但
  `code` 是字符串、`issues[]` 是结构化（多 issue、多 path），压成字符串仍会丢失 token/owner，
  且没有解决 069/070 的「合并/边界不一致」模式。治标不治本。
- **让 doctor 的 READY 不再宣称 consumer READY**：可以缓解 070，但把「准备与执行同源」这个
  真正的责任推给了人（要人手动 export .env），是把边界不一致固化，不是消除。

## 风险 / 取舍

- [改动面横跨 producer 与 CLI 两层，体积不小] → 用一个 OpenSpec change 承载，proposal/design
  阶段把 typed-error→diagnostic 的映射边界定死（谁 owns 映射、CLI 允许加什么 lineage），再写
  tasks；不直接改代码。
- [「忠实透传」可能被误读为「把 producer 内部异常原样喷给 Agent」] → 用 spec 的
  fail-closed 语义兜底：只有「可信任的 producer-issued diagnostic」才透传，否则
  `report_internal`。透传的是**结构化 envelope**，不是内部堆栈/prose。
- [069 的「拆两阶段投影」可能碰 state lifecycle 权威] → `state_binding_stale` 的 hard-stop
  必须保留，只允许**新增可消费的 source-valid 事实**，不允许绕过 rebind authority。
- [070 的 env 收敛可能影响已有 deck 的 dotenv 行为] → 收敛到 shared boundary 后，加载顺序
  （deck `.env` vs project `.env` vs shell env）必须与现状兼容或有明确迁移说明，回归测试覆盖
  缺失/无效/不匹配 profile 的既有 hard-stop。
- [四个 bug 已被 owner 明确「本轮不修复、仅登记」] → 本 plan 是分析/设计文档，不是实施令；
  实施走独立 OpenSpec change，由其他 coding agent 接手，不在本 plan 内动 Harness 源码。

## 落地关联

- **capability**：`cli-surface`（`openspec/specs/cli-surface/spec.md`，已有两条铁律作为依据），
  连带 `node-specification`（MD Controller/state 消费 CLI 回执侧）与 `style-master-generation`、
  `image-production`（producer 侧 typed error 出处）。
- **机器权威**：`ppt_maker_harness/scripts/ppt_flow.mjs`（归因层、command 层）、
  `ppt_maker_harness/scripts/shared/image2/runtime_profile_id.mjs`、`page_image_target_runtime.mjs`、
  `02-visual-system/internal/page_image_visual_language.mjs`、`04-pure-image/index.mjs`。
- **上游 bug 关联**：BUG-067、BUG-068、BUG-069、BUG-070（同一个 change 内一起闭合，保留
  各自入口的 regression test）；另注意 BUG-071（`pilot-review` 掩盖 reconcile）可能属于同族，
  change design 阶段应扫一遍是否还有第 5 个同模式入口。
- **实施路径**：OpenSpec change（建议名 `cli-diagnostic-faithful-passthrough`），按
  proposal → design → delta specs → tasks → 实施 → strict validation；不直接改代码，不在
  consumer 侧复制 schema（呼应 AGENTS.md cli-surface 维护路由）。

### 验收标准（可执行，供接手 agent 与 reviewer 使用）

1. `style-master inspect` / `style-master plan` 遇到 `PageImageVisualLanguageError` 时，输出
   保留 `category: source_validation`、`issues[].path`、违规 token 与 owner-issued 修复动作；
   `next action` **不是**指向 `style-master inspect` 自己（无自循环），且不出现
   `style_master_operation_failed` 泛化改写。
2. `image2 plan` 遇到同一 typed error 时，输出**不是** `category: internal` /
   `next.action: report_internal`，而是可定位的 source repair / same-check rerun。
3. `validate` 在「source 合法 + state stale」时，输出可消费的 `source_valid` 事实与
   `state_binding_stale` 硬停，两者区分呈现；在「source 非法」时优先给出 source 错误而非
   先报 identity mismatch。
4. `doctor --operation raw-generation` 报 READY 后，紧接的 exact `image2 authorize` /
   `image2 generate` 在**不手动 export .env** 的情况下读到同一 deck/project `.env`；或 doctor
   不再对无法被 consumer 读到的 profile 宣称 READY。缺失/无效/不匹配 profile 的既有
   hard-stop 保持不变。
5. 所有新 diagnostics 走 `schema: pptmaker-cli-diagnostic`，producer 与 consumer 双侧校验
   通过；不存在从 `String(error.code || fallback)` 重新推导 category 的新增路径。
6. 不修改任何 `deck_*` 生产数据；`deck_ai_sdlc_keynote/3_versions/v8` 仅作为验证样本；四份
   bug 文档在各自被闭合时按 `_backlog` 规矩移入 `_done/_fixed_bugs/`。
