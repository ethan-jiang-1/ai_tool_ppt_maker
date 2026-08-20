# Plan: Image2 Call Shape + 独立 Lab

> 类型: 设计 | 更新: 2026-08-20（评审后修订）
>
> **本文角色:** 落地前的设计权威。不要依赖聊天记录。
> 落地：**一个** OpenSpec change（§12）。本文不是 change 正文。
>
> **文件名** `image2-capability-tuple-and-lab.md` 只是 plan 标识。
> 规范词是 **Image2 Call Shape**。不要把文件名里的 `tuple` 当现行术语。
>
> **配套评审:** [`review-image2-call-shape-and-lab.md`](./review-image2-call-shape-and-lab.md)
> 本修订按「合理采纳、不合理忽略」吸收该评审；处置表见 §15。
>
> **触发证据:**
> `deck_ai_org_transform_keynote/_lessons/image2-vendor-experiments.md`
>
> **术语归属:** Call Shape / Lab / `_lab/` 的词先留在本文。
> **不要**写进现行 `CONTEXT.md`，等本 change 与 spec/CLI/layout/guard 一次 cutover 再写入。

---

## 0. 读法

先读 §1–§2（意图与词），再读 §6–§8（Call Shape、executor、trial），再读 §12（一个 OpenSpec change）。
代码「现在」以 `openspec/specs/` 和 `ppt_maker_harness/` 为准；「拟议」以本文为准。

不要：

- 把 `_scratch/pilot-*` PNG 拷进 `_generated/` 或当 PPTX 证据
- 复活 CLS-007 多 vendor failover
- 把 Lab trial 当成 `image2 authorize` / receipt / confirmed profile
- 让 Lab 单独实现一套生产还打不了的取图 dialect

---

## 1. 人要的工作方式

做 PPT 的 session 和调 Image2 的 session **可以是两个**。

1. Session A 走正常 PPT flow（create-deck / edit-visual / `image2 generate`）。
2. 画得慢、不对、或出不来时，Session B **只**探索「这个 vendor 的 GPT Image 2 到底该怎么打」。
3. Session B 调通后，把一次 **不可变 trial**（`trial_id` + `trial_sha256`）交给 Session A；需要时另写一篇 `_lessons/`。
4. Session A 打开那一次 trial，Deck Author 确认后把 Call Shape **value** 写入 profile 信封。正式 generate 只读 confirmed profile。两边打 API 必须是**同一条共享 executor**，包括取回并校验 PNG。

铁律：

- 独立 CLI、独立 playbook；Session B 不进 create-deck。
- Lab 只证明「这份 Call Shape 能拿到可通过生产 media inspector 的 PNG」。
- **唯一 schema 耦合**是 Call Shape value。不共用 Controller、State、授权、receipt。
- 线上 **model 字符串**是发现维度，不从「这是 GPT Image 2」推断。
- 实验环境在**这份** Run Bundle 的 `_lab/`。run bundle **一被操作就要有** 这份 scaffold；里面没 trial 时 PPT flow 仍走 **同一份默认 Call Shape**。

---

## 2. 术语（只在本 plan / 未来 change 里用）

| 词 | 是什么 | 不是什么 |
|---|---|---|
| **Image2 Call Shape** | 命名的、可 canonicalize 的 **value**：这一整份调用协议怎么打、图怎么取回来。口语 **Call Shape** | Image2 request（页面 compiled prompt）；provider profile（信封）；只含 HTTP 请求的 transport vector；元组 |
| **Call Shape value** | `validateCallShapeValue()` 校验并哈希的那一组字段 | 文件头、trial 信封、profile 的 `schema`/`profile_id` |
| **Call Shape envelope** | candidate/trial 文件的 discriminator + 内嵌 value + hash/上下文 | value 本身 |
| **Image2 Lab** | 独立 CLI + playbook：对候选 value 跑 immutable trial | `ppt_flow probe`；`image2 generate` |
| **Image2 Lab Workspace** | deck 根 `_lab/`：run bundle 一动就在的实验隔间；可以没有 trial | `_scratch/`；`_generated/`；生产输入；第二套 Run Bundle |
| **named default Call Shape** | 省略 transport/result_protocol 时归一化得到的那一份 canonical value；与现行默认打法 digest 相同 | `_lab/` 里的文件；Lab trial；confirmed 之后仍可被 Deck Author 换成别的 value |
| **trial** | `_lab/runs/vN/trials/<id>/` 一次不可变实验记录 | latest pointer；生产 attempt/receipt |
| **profile 信封** | `image2-provider-profile.yaml`：identity、人确认、两个 operation；page-image 操作 **嵌入** Call Shape value | Call Shape 本身 |
| **declared Call Shape connectivity** | `ppt_flow probe <run-dir>`：已确认 value 现在还能不能拿到 PNG | 发现候选；生产授权 |
| **tested measurement** | 这次 trial 实际送出的 prompt 在选定 unit 下的精确长度 | provider max；profile `prompt_budget.limit` |
| **共享 executor** | 无 State、无 profile、不写 run-bundle 的远端执行：credentials + 已校验 value + inputs → 校验过的 PNG + 消毒后的执行事实 | production wrapper；capability resolver seam |

---

## 3. 为什么要做（证据摘要）

本 deck lesson（2026-08-19）：Duckcoding 返 HTML；Micu 短 prompt 通、~20k 被约 4k 上限拒绝；Packy `generations` 403、`edits` 要 16 倍数、`2048x1152` + 21k 出 PNG；Packy `/models` 不列出 `gpt-image-2` 也能画；APIMART 接受长 prompt 但当时只有 async task、没取到图。

更早：CLS-007「多组 URL+key、model 都一样」已证伪，不复活 failover。CLS-036：`gpt-image-2` 可重定向别名。BUG-090 / `bind-image2-transport-capability-vector`：生产 **请求** 侧已能按 transport 矢量打；缺发现侧，且 probe 仍硬编码 generations。

本 deck `image2-provider-profile.yaml` 无 `transport` → 解析成默认 generations+`2000x1125`。Lesson 证明通的是 Packy edits+`2048x1152`。`.env` 指向 Packy ≠ generate 在打已证明的那一炮。

评审另外钉死的历史事实：

- `packy-edits-generate.mjs` 还能吃 **直出 PNG body** 和 **URL 下载**；现行生产只认 JSON inline `bytes_base64`/`b64_json`，async 固定 `GET ${base}/tasks/{id}`。请求对齐了、取回没对齐，仍是双重真相。
- profile/lesson 的 `prompt_budget.limit` 是 21,241；后来 scratch 成功项有 24,732。N 成功 ≠ provider max。
- Micu 实际输出 2048×1136，Packy 2048×1152。成功必须过**生产同一套** media inspector，不只是「能打开的图」。
- v1 `_scratch` 已约 168MB。`_lab/` 必须有 nested gitignore 和「不是生产证据」标识。

---

## 4. 现行代码锚点

| 声称 | 去哪看 |
|---|---|
| 生产 submit 按 transport 拼路径，json vs multipart | `command_support.mjs` `pageImageProviderSubmitCall`（**私有**） |
| 取图：JSON inline Base64；async 固定 `/tasks/{id}` | `imageBytesFromPageImageProvider`、`resolveImage2ProviderTask` |
| PNG 校验 | `inspectExactPageImagePng` / `PAGE_IMAGE_NATIVE_RAW_PNG` |
| 生产 factory 绑 plan、Style Master lineage、idempotency、failure 类型 | `targetPageImageSubmitFactory` |
| profile 闭集 transport；省略=默认 generations 矢量 | `provider_profile.mjs` |
| `ppt_flow probe` 匹配 profile 后 child 到 env-check 硬编码 POST | `commands/probe.mjs`；`00-setup/internal/env_check.mjs` `checkImageSmoke` / `checkProbeVendors`（写死 generations、`gpt-image-2`、`1024x1024`；`task_id` 算成功） |
| env-check 不得 import YAML/profile | `harness-script-layout`；architecture guard `image2-capability-preinstall-import` |
| `deckRoot()` 只是两次 `dirname` | `bundle_layout.mjs` |
| 真 binding 检查 | `verifyDeckHarnessBinding` |
| deck 根白名单无 `_lab/` | `DECK_ROOT_ALLOWED` |
| 生产 stage 恰好十九个 | `harness-directory-layout`；`schema/README.md` |
| 历史更宽的取图 | `3_versions/v1/_scratch/packy-edits-generate.mjs` |

---

## 5. 目标形状

```
Session B  Image2 Lab                         Session A  PPT flow
独立 playbook + standalone CLI                create-deck / edit-visual
--run-dir = 同一份 3_versions/vN             同一份 Run Bundle
admission 之后才 fetch / 写 _lab/             正式只写 _generated/ + state
immutable trial → stdout trial_id+hash        打开该 trial，人确认后写 profile
不自动写 _lessons_/profile/state              IMAGE2_PROVIDER_PROFILE_ID 对齐
                                              image2 plan → authorize → generate
                                              与 Lab 共用 executor（含取图+inspector）
```

```
deck_*/
├── _lab/                            一动 run bundle 就在；空 scaffold 不挡 PPT flow
│   ├── README.md                    ownership / 恢复；不复制 schema
│   ├── .gitignore                   默认忽略 prompt、PNG、raw trial 大文件
│   ├── fixtures/                    共享参考图；被哪个 trial、哪个 hash 使用要记在 trial 里
│   └── runs/
│       └── vN/
│           └── trials/
│               └── <trial-id>/      不可变；原子封存；可以一个都没有
├── _lessons/                        人读结论；Lab CLI 不写这里
├── .env
├── 2_backbone/.../image2-provider-profile.yaml   生产权威；空 _lab/ 时用默认 Call Shape
└── 3_versions/vN/                   --run-dir
    ├── overrides/...                可覆盖 profile
    ├── _generated/
    ├── _scratch/
    └── _polish/
```

### 5.1 `_lab/` 必在；空也不挡 PPT flow

两条一起锁，不要拆开：

1. **任何一个 Run Bundle 被动到，`_lab/` 就要初始化出来。**
   `ppt_flow init` 必建空 scaffold（README、`.gitignore`、`fixtures/`、`runs/`）。
   已有 bundle 缺 `_lab/`：下一次 current exact-run **mutating** owner 入口在继续业务前机械创建同一套 scaffold（guide 级 heal），不等人先跑 Lab。
   `--check` 把缺 `_lab/` 当成可修复 layout，不是「永远可选」。
   `new-version` 不复制、不删除已有 trial，也不把旧 trial 标成新版本 proven。

2. **`_lab/` 里没有 trial 时，PPT flow 照常能跑。**
   generate / probe **不读** `_lab/`。生产只读 confirmed profile。
   现在已经有默认打法：confirmed page-image 省略 `transport`（以及未来省略 `result_protocol`）→ 归一成那份 **named default Call Shape value**（今天就是 generations + json + `2000x1125` + multiple 1 + async-poll + 现行取图 dialect）。
   这份默认必须和 Lab 用 **同一个 value schema、同一个 validator、同一份 canonical default 常量**。digest 必须相同。Lab 的第一个候选可以就是这份默认；profile 省略字段归一化后也是它。
   因此 Lab 一旦有 proven trial，Deck Author 采用时只是把 profile 里的 Call Shape value **换成** trial 里那一份——不是换 schema、不是加新概念、不是从 `_scratch` 脚本迁协议。

空 `_lab/` ≠ 跳过 pending profile，也 ≠ 跳过授权。只是：**不需要先有实验内容才能画画**；默认 Call Shape 已经是和 Lab 有默契的那一份。

内部文件名是 Lab CLI 约定，**不**写入 `bundle_layout` 文件名白名单。layout 承认 `_lab/` **必在**（init 或 touch-heal）、按 `runs/vN/` 分区、不是生产 owner。

---

## 6. Call Shape

### 6.1 Value（唯一 `validateCallShapeValue()`）

page-image 的 canonical value：

```yaml
model: <non-empty string>
prompt_budget:
  limit: <positive safe integer>     # 生产准入政策，不是「已测出的 provider max」
  unit: unicode-code-points | utf16-code-units | utf8-bytes
transport:
  http_operation: generations | edits
  encoding: json | multipart
  width: <positive int>
  height: <positive int>
  dimension_multiple: 1 | 16
  completion: sync | async-poll
result_protocol: <closed dialect id> # 取回 PNG 的闭集；本 change 只登记现行生产已实现的那一种
```

请求闭集（已有）：

- pairing 只有 `generations`+`json` 与 `edits`+`multipart`
- 宽高能被 `dimension_multiple` 整除
- 未知 key、vendor 产品名当 key、非法 pairing → 零远端

**`result_protocol` 原则：**

- 必须进入 Call Shape。否则 Lab 可按 scratch 脚本取到图，生产 executor 却取不到。
- **小闭集、vendor-neutral dialect ID。** 禁止 JSONPath、URL template、用户解析脚本、三维正交开放字段。
- 本 change 只登记 **现行生产已实现的那一种**（JSON submit；async 则固定 `GET ${base}/tasks/{id}`；图只来自 inline Base64；redirect 拒绝），并给它一个稳定 ID。省略 `result_protocol` 的旧 confirmed profile 归一化到该默认 dialect。
- 直出 PNG body、result URL 下载 **不在本 change 范围**。那是后续 change：先把 dialect 做进同一 executor，Lab 才许记为 proven。本 change 的 Lab 遇到未登记 dialect 必须失败，不能标 proven。
- `completion: async-poll` 表示完整协议可含一次 POST 和若干 GET，不是「只有一个 HTTP call」。
- Authorization / Idempotency / deadline / 不二次 submit：executor **不变量**，不进 Call Shape。

**不在 value 里：** API key、base URL、`IMAGE2_PROVIDER_PROFILE_ID`、`profile_id`/`endpoint_profile`/`route_id`、`owner_declaration`、Style Master 操作的 transport（本 Lab 只证明 page-image）。

**Named default：** 省略 `transport` / `result_protocol` 时，归一化结果必须与代码里那份 default 常量 digest 相同。这就是今天已经在用的默认打法，只是改成和 Lab **同一份 value**。空 `_lab/` 时 PPT flow 走它；Lab 有 trial 时，采用 = 用 trial 的 value 换掉它。

### 6.2 Envelope vs value

- **Value：** 上面字段；唯一 validator + canonical hash。
- **Envelope：** candidate/trial 文件的 `schema` discriminator + 内嵌 value + hash/上下文。profile 的 page-image operation **只嵌入同一个 canonical value**（外加现有 `route_id` 等信封字段），不复制第二套字段校验。
- 独立 candidate 文件不能靠文件名猜 schema。
- discriminator 属于 envelope，不属于 value。具体 envelope schema 名留给本 change 的 design，不在本 plan 锁死。

`prompt_budget.limit` 留在 value 里，作为生产 admission。trial 另记 `tested_measurement`（见 §8）。Deck Author 确认写入 profile 的 limit 可以比某次成功更保守，也可以高于某次早期测量；**没有任何一次成功自动改写 confirmed limit。**

---

## 7. 共享 executor

「Lab 复用 generate 的 submit」按现代码做不到：builder 私有，factory 绑生产生命周期。改为：

```
candidate 或 profile 选出的 Call Shape value
        │
        ▼
call_shape.mjs                 纯解析、闭集、canonical hash
        │                      不碰 credentials / fetch / 磁盘（除读入的 bytes 由调用方给）
        ▼
provider_executor.mjs          credentials + validated value + prompt/reference bytes
        │                      + idempotency + 可注入 fetch/deadline
        │                      -> verified PNG + sanitized execution facts
        ├──────────────┬──────────────────┐
        ▼              ▼                  ▼
production wrapper    probe wrapper       Lab wrapper
plan/lineage/grant    confirmed value     immutable trial
attempt/receipt       connectivity only   只写 _lab/；不写 state
```

Executor 契约：

- **不接收 `runDir`**，不解析 profile，不读写 State，不创建 grant/attempt/receipt。
- 输入：已校验 value、runtime credentials、prompt bytes、edits 所需的 reference bytes、idempotency、injectable fetch/clock/deadline。
- 输出：通过**现行生产同一** PNG inspector 的 bytes + 消毒执行事实（status class、poll 次数、实际宽高等）。失败则 typed classification，无 PNG。
- 所有 dialect、poll、download（若闭集包含）、deadline、media validation **只在这里实现**。
- 诊断永不含 provider body、prompt、headers、API key、stack、redirect/download URL 中的 token。

Capability resolver seam **保持**「不拥有 credentials/submission」。新登记 **validator seam** 与 **executor seam**。architecture guard 禁止第二份 parser/submit/poll/result decoder。

模块位置：`ppt_maker_harness/scripts/shared/image2/`（例如 `call_shape.mjs`、`provider_executor.mjs`）。
Lab CLI 薄入口同目录（例如 `image2_lab_cli.mjs`），登记进 executable inventory。
**不要**顶层 `scripts/image2-lab/` 冒充第 20 个 method 阶段。

---

## 8. Trial 与交接

### 8.1 删除 `last-proven.json`

生产程序、probe、generate **都不读** latest pointer。
Session B → Session A 的机器交接是 stdout / playbook 里的 **`trial_id` + `trial_sha256`**。
Session A 打开该 exact trial，展示候选与证据；Deck Author 决定是否把 value 写入 profile。

不保留可变 latest。不为它设计 CAS。

### 8.2 不可变 trial

每个 trial 原子封存（临时目录 + rename，或同等级）。半写目录不得被读成 proven。

`trial.json` **最小**绑定（不要做成第二套 generation-profile 或「current proof」状态机）：

| 类别 | 必需 |
|---|---|
| identity | trial schema、trial ID、manifest hash |
| run | deck-relative `3_versions/vN`、Harness binding fingerprint |
| call | canonical value + Call Shape hash |
| runtime | 非密钥 endpoint/selector fingerprint（不是密钥） |
| prompt | locator、SHA-256、unit、`tested_measurement`；诊断不复制正文 |
| reference | 是否需要；来源类别；SHA-256；media type；宽高 |
| execution | submit 次数；poll 是否发生；消毒后的终端分类 |
| output | 成功则 PNG SHA-256、bytes 长度、inspector 通过的实际宽高；失败则无 output 文件 |

旧 trial 在环境变了之后仍可读，**不必**自动标成 current proof。是否仍适用于当前 run，由 Session A / playbook 对照 trial 与当前 profile/env/version，不新开生命周期 owner。

并发：不同 `vN` 不互相覆盖；同一 `vN` 新 trial 只追加新 id，不改已封存 manifest。

### 8.3 Lesson

Lab CLI **不写** `_lessons/`。
Playbook 在有跨 session 价值时，建议 Agent 用现有 `lessons.mjs add` 写一篇人读、非密钥结论，**只引用 trial id/hash**，不复制 prompt、provider body、整份 Call Shape 当第二权威。
不是每个 trial 都强制一篇 lesson。
因此默认 **不改** `lessons-management`。

---

## 9. Lab CLI、admission、fixture、gate

### 9.1 Admission（先于第一次 fetch 和第一次写 `_lab/`）

顺序：

1. `realpath` 后确认参数是 exact `3_versions/vN`，layout 形状成立。
2. `verifyDeckHarnessBinding`。
3. `_lab/` 每一层是 deck 根内普通目录，不是 symlink；scaffold 已在 init/touch-heal 建好。Lab 只在已验证目录下追加 trial，不把「有没有 `_lab/`」当成发现步骤。
4. candidate / prompt / reference 是 confined regular file；拒绝 symlink、FIFO、device、越界。
5. schema、budget 形状、fixture、credential 存在性、bounded-work 记录齐了，才允许 fetch。
6. 写 trial 用原子封存。

### 9.2 edits 的 reference

Executor **不自己找图**，也不默默用 deck 根碰巧存在的 `style_master.png`。

- Lab：显式 `--reference-file`。只接受 `_lab/fixtures/` 内普通 PNG，或经只读 resolver **导入**当前 exact version 已验证 Style Master 的 **bytes**（执行前固化并记 hash）。Lab fixture **没有** production selection / source receipt / lineage 身份。
- Probe（confirmed、且 Call Shape 是 edits）：必须用该 version **当前已选** immutable Style Master 的 bytes。没有 → hard-stop。不给 probe 另做一张「连通性专用空白图」。
- Production：维持现有 Style Master selection lineage。不读 `_lab/fixtures/`。

### 9.3 Gate

不采用「每一次 live submit 都是独立 confirm」。

- Lab playbook 先形成 **bounded trial plan**：exact run、Call Shape hash、候选数、每候选最多一次 submit、是否可能 poll。
- 用户明确要求执行这份 plan，就是该批次 Work Request。同批不逐候选再问。
- 扩大候选、换 endpoint/runtime、重跑失败项、没有这份 plan：才回到 human boundary。
- CLI **非交互**。不复制 `image2 authorize` 的 grant/attempt。需要的是：已声明的 bounded plan（hash + 次数上限）+ 明确执行（例如 `--execute` 对上 plan hash）。这是执行闸，不是生产授权。
- probe 的现行「live 必须先披露再确认」在本 change 的 `environment-check` / `cli-surface` / `playbook-execution` / `harness-charter` delta 里 **显式 cutover**，不得文案里偷偷改掉。

### 9.4 Lab 机器合同

Standalone CLI 成功/失败都走统一 envelope（`cli-surface`）：

- 成功 stdout：稳定 schema、`trial_id`、`trial_sha256`、Call Shape hash、PNG digest、inspector 宽高、`tested_measurement`、bounded next（例如「把该 trial 给 Deck Author 看是否写入 profile」）。
- 失败：owner-issued next；secret-safe。原始 provider body **不落盘**。

Playbook：独立 MD，不进 create-deck 节点图。Cursor skill 可选指针，不是运行时依赖。

---

## 10. 旧表面 cutover（同一 change 末段，一次切完）

Live Image2 离开 `00-setup`。env-check 零 npm，不可能诚实执行 Call Shape。

| 入口 | 目标 |
|---|---|
| `env-check` / `doctor` | 离线存在性。任何模式都 **不** live POST Image2 |
| `env-check --smoke` / `--probe-vendors` | 退休。返回 **usage 迁移诊断** 指向 `ppt_flow probe` 或 Lab，不是默默变离线 |
| `ppt_flow probe --smoke` / `--probe-vendors` | **退休**。一条 selector + 一份 confirmed profile 没有「遍历 vendors」的合法含义 |
| `ppt_flow probe <run-dir>` | 对当前 confirmed page-image Call Shape **恰好一次** submit，经共享 executor 取到并校验 PNG。pending/非法 → hard-stop，next 指向 Lab，零远端 |
| Lab CLI | 唯一允许在 **没有** confirmed Call Shape 时 live 打显式候选的入口 |

两问：

| 人想问 | 走哪 |
|---|---|
| 已确认的还能拿到 PNG 吗 | `probe-image-channels` → `ppt_flow probe <run-dir>` |
| 哪个候选能拿到 PNG | Lab |
| 正式出图 | `image2 generate`（不读 `_lab/`） |

pending 上 probe hard-stop **保留**。离线 env-check 可查 key/selector 语法，不能证明远端 credential。

Style Master generate 仍保持现行默认。Style Master 若要 edits，另开 change。

---

## 11. 权威

| 事实 | 唯一权威 | 非权威 |
|---|---|---|
| Call Shape 字段与闭集 | serialization + `validateCallShapeValue()` | trial 里嵌入的实例 |
| 生产采用哪一份 | exact version override 优先，否则 backbone confirmed profile | lesson、trial |
| 密钥与 base URL | `.env` + selector 精确匹配 | trial 的非密钥 fingerprint |
| 某次实验打了什么 / 是否拿到合法 PNG | 该次 immutable trial + 共享 executor 的 inspector 结果 | lesson |
| 生产授权与尝试 | 现有 mandate / plan / grant / attempt / receipt | Lab trial 不能替代 |
| 人类采用 | Deck Author 把 value 写入 confirmed profile | Lab 成功 ≠ confirmed |

---

## 12. OpenSpec 落地：一个 change

拟名：`add-image2-call-shape-and-lab`

**结论：用一个 change。** 评审建议拆成 A/B，是为了缩小审查面。对这个产品故事，拆开会留下一个 **不该合进 main 的中间态**：generate 已经按 Call Shape 打，probe 仍硬编码 generations，`_lab/` 还不存在。那正是本 plan 要消灭的双重真相。

一个 change **成立的前提**是把范围收死（见 §12.3）。直出 PNG / URL 下载 dialect **不要**塞进这一次——那才会把一个 change 撑破。

### 12.1 为什么一个就够，什么时候才该拆

| 拆成两个会怎样 | 为什么不好 |
|---|---|
| 先合 executor、后做 Lab | main 上 probe 继续撒谎；Agent 两问没有入口 |
| 先做 Lab、后抽 executor | Lab 再写一套 HTTP，scratch 断层重来 |
| 平行两个 change | 两套 schema / 两个 executor 窗口 |

**一个 change 有问题的信号（出现再拆，不预拆）：**

- apply 时发现必须同时做 Packy 的 URL/直出 PNG dialect，生产取图行为会变
- executor 抽取单独就大到无法审查，而 Lab 还没开始
- `_lab/` layout 与 CLI 诊断在 review 中反复推翻 Call Shape 字段

那时才拆：先合「named default + executor + 生产行为不变」，**但 probe 不得在那一刀单独合进 main**——probe cutover 必须跟 Lab 同一 PR/同一 archive。这是拆分时的硬约束，不是现在的计划。

### 12.2 一个 change 里的工作顺序（tasks，不是两个 change）

apply 按这个顺序。前一段测试不过，不准开始后一段。整 change 未完成不得 archive。

1. **Call Shape value + named default + 唯一 validator**  
   省略 transport/result_protocol 与 default 常量 digest 相同。
2. **抽出共享 executor；production wrapper 改走它**  
   只登记现行取图 dialect。generate 外部行为保持。
3. **`_lab/` layout：init 必建；touch-heal；`--check` 可修复；空目录不挡 generate**
4. **Lab CLI + playbook**  
   pending 可测候选；只写 `_lab/`；stdout `trial_id`+hash；不写 profile/state/lesson。
5. **一次切断旧 live 表面**  
   probe 走 executor；pending hard-stop 指向 Lab；退休 `--smoke`/`--probe-vendors`；env-check 零 Image2 网络。
6. **guard、COMMANDS/BOOTSTRAP/charter、CONTEXT.md 术语**  
   与实现同一 cutover 写入。

### 12.3 本 change 收什么、不收什么

**收**

- named default Call Shape；value/envelope；一个 `result_protocol` 成员（现行生产 dialect）
- 共享 executor；production / probe / Lab 三 wrapper
- `_lab/` 必在、可空；immutable trial 交接
- 独立 Lab CLI + playbook
- probe/env-check/playbook 两问分流
- 新 capability `image2-lab`（只拥有 Lab/workspace/trial）
- Call Shape 权威仍归 `run-bundle-management` + `production-schema-conformance`

**不收（后续 change）**

- 直出 PNG body、result URL 下载等新 dialect
- Style Master transport / edits
- scratch→PPTX（BUG-092）
- Lab 自动写 `_lessons/`
- failover 多 vendor 列表

### 12.4 Capability 合同（一份 proposal 里的 deltas）

| Capability | 角色 |
|---|---|
| 新 `image2-lab` | Lab CLI、`_lab/`、trial、playbook 过程 |
| `production-schema-conformance` | 点名 Call Shape value/envelope；named default |
| `run-bundle-management` | profile 嵌入 value；省略=default digest |
| `run-bundle-layout` | `_lab/` 必在、init、heal、`--check` |
| `image-generation` | generate 只消费 validated value + 共享 executor |
| `cli-surface` | Lab 入口与 envelope；probe 新语义；旧 flag 迁移诊断 |
| `environment-check` | 去掉 live Image2 POST |
| `playbook-execution` | 两问；新 lab playbook；probe-image-channels 收窄 |
| `harness-script-layout` | validator seam + executor seam；禁第二份 submit |
| `harness-directory-layout` | 模块 ownership + `_lab/` 在目录图 |
| `commands-reference` / `bootstrap-env-guidance` | 两问两入口 |
| `harness-charter` | **必改**：probe 不再被写成 capability 证明；Lab 语义一次写清 |
| `lessons-management` | 无 delta（只消费现有 `lessons.mjs add`） |
| `node-specification` | 仅当 MD 必须消费新 diagnostic 字段 |

### 12.5 OpenSpec 动作顺序

1. `openspec new change add-image2-call-shape-and-lab`
2. 按 schema 写 `proposal.md` → capability deltas → `design.md` → `tasks.md`（tasks 映射 §12.2）
3. `openspec validate --strict --change add-image2-call-shape-and-lab`
4. 人类确认后再 apply（实现）。apply 期间仍只这一条 change。
5. 测试绿、`openspec validate --strict` 再 archive；此时才写 `CONTEXT.md` 术语。

proposal 必须写清 WHY（双重真相、两 session、空 `_lab/` 不挡画、默认与 Lab 同 schema），以及 §12.3 的非目标。

### 12.6 完成标准（archive 前）

- 省略字段的旧 confirmed profile：行为与 named default 相同
- Lab / probe / generate 对同一 Call Shape 发出同一请求并经同一 inspector
- 空 `_lab/`：confirmed generate 仍可跑；生产不读 `_lab/`
- `init` 有 `_lab/` scaffold；旧 bundle 一 touch 就 heal
- pending probe 零 fetch，next 指向 Lab
- env-check 全模式无 Image2 网络；旧 live flag 有迁移诊断
- 无第二份 validator/executor；无 `last-proven.json`
- CONTEXT.md 在 archive 当次写入术语，不提前

---

## 13. 验证（给未来 design，不是现在写测试）

1. 同一 Call Shape 下 Lab / probe / production 的 mock：URL、method、encoding、model、size、reference bytes 相同。
2. 每个已登记 dialect：同一 decoder 产出 inspector 通过的 PNG。Lab 能成功的 dialect，production wrapper 必须也能。
3. async：一次 POST + GET 共用 deadline，不二次 submit。
4. 非法 value、pending probe、坏 exact-run、binding 冲突、symlink fixture、越界 `_lab`：第一次 fetch/write 前失败。
5. `v1`/`v2` trial 不互盖；已封存 manifest 不改。
6. 21,241 成功只报 `tested_measurement`，不报 provider max；不自动改 confirmed limit。
7. edits 缺 fixture / 非 PNG / symlink：远端前失败。
8. planted secret、prompt、stack、HTML body **不**出现在 stdout/stderr/envelope/trial/lesson。
9. 半写目录不可读成 proven。
10. guard 拒绝第二份 validator/executor 与未登记 executable。
11. 退休 flag 的迁移诊断 + 文案 residue。
12. 新 `_lab/.gitignore` 后大文件默认不进 Git；旧 bundle 根 `.gitignore` 不必先迁。

---

## 14. 锁定 vs 留给 change design

**锁定**

- Lab 剥出；两 session；同一 Run Bundle
- `_lab/`：run bundle 一动就初始化；按 `vN` 分区；空 scaffold 不挡 PPT flow；生产不读 `_lab/`
- 默认打法 = named default Call Shape value（与现行省略 transport 归一化相同）；Lab trial 与 profile 共用同一 value schema，采用时只换实例
- 规范词 Call Shape；value/envelope 分层；唯一 validator
- `result_protocol` 小闭集；Lab 成功必须可被同一 executor 重放
- 共享无状态 executor；生产/probe/Lab 三 wrapper
- 交接 = immutable `trial_id`+hash；无 `last-proven.json`
- model 字符串是发现维度；密钥/URL 不进 value
- `prompt_budget.limit` 是准入政策；trial 记 `tested_measurement`
- Lab 证明 ≠ 生产授权；pending probe hard-stop
- 显式 reference；executor 不找图
- 成功 = 生产同一 inspector（含实际尺寸）
- **一个** OpenSpec change；新能力 `image2-lab`；Call Shape 权威仍归 profile/serialization
- 本 change 只登记现行取图 dialect；更宽 dialect 后续 change
- Lab CLI 不自动写 lesson；CONTEXT.md 随本 change archive 写入，不提前
- 退休 `--probe-vendors` 与 `probe --smoke`

**留给 OpenSpec design（不推翻上面）**

- 现行 dialect 的稳定 ID 字符串
- envelope schema 字面量
- Lab CLI 文件名（同目录薄入口即可）
- `--execute` 对 plan hash 的准确 flag 名
- trial 目录内文件名约定
- probe live 确认的 exact cutover 句

---

## 15. 评审处置（相对 `review-image2-call-shape-and-lab.md`）

| ID | 处置 |
|---|---|
| B1 取回协议 / 同一取图函数 | **采纳。** 本 change 只锁现行 dialect；更宽 dialect 必须先做进同一 executor，另开 change |
| B2 删 last-proven；trial id+hash；按 vN 分区 | **采纳。** 不保留 latest，不为它做 CAS |
| B3 抽共享 executor；入口在 `shared/image2/` | **采纳** |
| B4 admission 先于 fetch/write | **采纳** |
| H1 tested_measurement vs limit | **采纳** |
| H2 value vs envelope | **采纳。** 不锁示例 enum 名 |
| H3 显式 reference | **采纳。** probe 缺 Style Master 则 hard-stop，不做第二张连通性空白图 |
| H4 Work Request / 同批不重复确认 | **采纳。** 不复制 authorize；只要 bounded plan + 非交互执行闸 |
| M1 `_lab/` 惰性、gitignore、harness-directory-layout | **部分改写。** gitignore + directory-layout 采纳。惰性/init 不建目录 **由人类改写**：run bundle 一动就初始化 `_lab/`；空目录不挡 PPT flow；默认 Call Shape 与 Lab 同 schema |
| M2 退休误导 flag；迁移诊断 | **采纳（比原稿更干净：直接退休 vendors/smoke）** |
| M3 planted secret 测试 | **采纳** |
| M4 撤回 CONTEXT.md 规划期术语 | **已做。** 术语随本 change archive 写入 |
| M5 Lab 不自动写 lesson | **采纳** |
| §11.4 pending probe hard-stop | **采纳：不过硬，保留** |
| §11.5 拆 A/B；能力名 `image2-lab` | **能力名采纳。拆两个 change 不采纳**（见 §12：一个 change，tasks 分序；probe 不得单独合进 main） |
| trial 做成 current-proof 状态机 | **忽略。** 存足够对照字段；不新开生命周期 owner |
| Lab 复制 grant/execute-token 生产授权 | **忽略。** bounded plan + `--execute` 即可 |
| 取回协议三维开放字段 / JSONPath | **忽略** |
| deadline/retry 进 Call Shape | **忽略。** executor 不变量 |
| trial 内文件名进 layout 宪法 | **忽略** |
| last-proven 的 CAS | **忽略（文件已删）** |

下一步：人类确认 §12 后，开 `openspec new change add-image2-call-shape-and-lab`，按 propose 工作流写 proposal/deltas/design/tasks。在此之前不写 Harness 实现。
