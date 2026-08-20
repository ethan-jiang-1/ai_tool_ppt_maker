# Plan: Image2 Call Shape + 独立 Lab

> 类型: 设计 | 更新: 2026-08-20
>
> **本文角色:** 给后续 coding / review agent 的自包含设计包。
> 不要依赖聊天记录。落地仍走 `openspec/changes/`；本文不是 change、不是任务清单的替代。
>
> **文件名** `image2-capability-tuple-and-lab.md` 是 plan 标识（创建时用的工作名）。
> 规范词已经改成 **Image2 Call Shape**。不要把文件名里的 `tuple` 当成现行术语。
>
> **触发证据:**
> `deck_ai_org_transform_keynote/_lessons/image2-vendor-experiments.md`

---

## 0. 给评审 agent 的说明

**请评什么**

- 架构边界是否自洽（Lab / PPT flow / Call Shape / `_lab/` / profile / `.env`）
- 旧表面（probe、env-check、playbook）的对齐会不会留下第二条「怎么打 Image2」的真相
- 有没有把不该进 schema 的东西（密钥、base URL、vendor 名、生产授权）塞进来
- deck 根新增 `_lab/` 是否值得（上严下松）；有没有更便宜且不撒谎的位置
- OpenSpec 能力切分是否过粗或过碎

**请不要**

- 此刻写生产代码或开 change（除非人类另下指令）
- 把 `_scratch/pilot-*` 的 PNG 拷进 `_generated/` 或当 PPTX 证据
- 复活 CLS-007 的多 vendor failover 列表
- 把 Lab 证当成 `image2 authorize` / receipt

**规划期已改、代码未改**

根 `CONTEXT.md` 已写入 **Image2 Call Shape** 与 **Image2 Lab Workspace**。
这是为了评审用同一套词，**不是** Harness 运行时已经有 Lab。评代码时以现行
`openspec/specs/` 和 `ppt_maker_harness/` 为准；评本 plan 时以本文 + 那两个术语为准。

**建议先读（按这个顺序）**

1. 本文 §1–§3（意图、术语、证据）
2. `CONTEXT.md` 里 Image2 Call Shape / Image2 Lab Workspace / Run Bundle Lesson
3. 现行代码锚点（§4）
4. 本文 §5–§8（方案与旧表面）
5. 本文 §12 评审问题

**相关政策（不要复制进实现，只用来打分）**

- `openspec/policies/human-centered-gates.md`
- `openspec/policies/simple-reliable-control.md`
- `openspec/policies/agent-assistance-and-control.md`
- `openspec/config.yaml`：统一生产入口是 `ppt_flow.mjs`；独立工具入口可以存在
  （已有先例：`lessons.mjs`、直接 `env-check.mjs`）。外部 skill 不得成为
  Harness 冷启动或生产运行时依赖。

---

## 1. 人要的工作方式（意图，不是实现）

做 PPT 的 session 和调 Image2 的 session **可以是两个**。

1. Session A 在正常 PPT flow 里画画（create-deck / edit-visual / `image2 generate`）。
2. 画得慢、不对、或根本出不来时，Session B **只**探索「这个 vendor 的 GPT Image 2
   到底该怎么打」。
3. Session B 调通以后，把 **同一份可机器识别的 Call Shape** 交给 Session A
   （外加一篇给人读的 `_lessons/`）。
4. Session A 人确认后写入 profile，正式 PPT flow 就能用——因为两边打 API 的代码是同一条。

人原话压缩成三条铁律：

- 底下要有专门能力；playbook 有独立 MD；scripts 有独立入口。
- Lab 的 skill/playbook **只关心把这个 API 调通**，证明这份 config 能 work。
- Lab 和 PPT flow 的 **唯一 schema 耦合** 是 Call Shape；不是共用流程、state、授权。

后来补的两点，同样锁定：

- 线上 **model 字符串** 也是发现维度；产品上只知道是 GPT Image 2，vendor 可能换名、
  换别名、换 backend。
- 实验环境要搭在 **这份 Run Bundle 里**（`_lab/`），才能读正在做的 PPT 的
  `.env` / Style Master / 真 prompt；不是另起一个 lab 目录，也不是扔进 `_scratch/`。

---

## 2. 术语（评审必须用这些词）

| 词 | 是什么 | 不是什么 |
|---|---|---|
| **Image2 Call Shape** | 命名 schema：这一炮怎么打。口语 **Call Shape**。字面量拟为 `pptmaker-image2-call-shape` | Image2 request（页面 compiled prompt）；provider profile（信封）；transport vector（只有 HTTP 那段）；元组 / capability tuple（已废工作名） |
| **Image2 Lab** | 独立工具：证明一份 Call Shape 能拿到 PNG | `ppt_flow probe`；`image2 generate`；create-deck 节点 |
| **Image2 Lab Workspace** | 该 Deck 的 `_lab/`：实验隔间 | `_scratch/`（PPT bak）；`_generated/`（正式产物）；第二套 Run Bundle；Harness 源码 |
| **profile 信封** | `image2-provider-profile.yaml`：identity、人确认、两个 operation；page-image 操作 **嵌入** Call Shape | Call Shape 本身 |
| **declared Call Shape connectivity** | `ppt_flow probe` 的窄含义：已确认的那份能不能连上 | 发现 Call Shape；生产授权 |
| **Run Bundle Lesson** | `_lessons/` 给人读的非密钥结论 | Call Shape 权威；lab 工作副本 |

Call Shape 恰好这些字段（page-image）：

```yaml
model: <non-empty string>          # 线上要 POST 的字符串
prompt_budget:
  limit: <positive safe integer>
  unit: unicode-code-points | utf16-code-units | utf8-bytes
transport:
  http_operation: generations | edits
  encoding: json | multipart
  width: <positive int>
  height: <positive int>
  dimension_multiple: 1 | 16
  completion: sync | async-poll
```

闭集（与现行生产 transport 相同，见 `isLegalPageImageTransport`）：

- pairing 只有 `generations`+`json` 与 `edits`+`multipart`
- 宽高必须能被 `dimension_multiple`（`1` | `16`）整除
- `completion` 只有 `sync` | `async-poll`
- 未知 key、vendor 产品名当 schema key、非法 pairing → **零远端** 拒绝

**故意不在 Call Shape 里**

| 事实 | 归属 |
|---|---|
| API key、base URL | `.env`（`IMAGE2_API_KEY` / `IMAGE2_BASE_URL`） |
| `IMAGE2_PROVIDER_PROFILE_ID` | `.env` selector，必须精确匹配 confirmed `profile_id` |
| `profile_id` / `endpoint_profile` / `route_id` | 信封上的命名，不是线上字段 |
| `owner_declaration` | Deck Author 确认 |
| Style Master 那条 operation 的 transport | 现行 change 的 non-goal；本 Lab 只证明 page-image Call Shape |

两层耦合，不要混：

1. **Schema 耦合（唯一契约）：** Call Shape。Lab 生产实例；PPT flow 消费确认后的实例。
2. **运行时结合（同一次实验怎么碰到真 PPT）：** 同一个 Run Bundle + 同一个 `--run-dir` + `_lab/`。
   Lab 可读这份 deck 的材料，但不能写生产权威。

---

## 3. 为什么要做（证据）

### 3.1 本 deck 的 live 实验

来源：`deck_ai_org_transform_keynote/_lessons/image2-vendor-experiments.md`（2026-08-19）。
统一模型名尝试 `gpt-image-2`；短 prompt ~1.3k；长 compiled prompt ~20k–21k code points。

| Vendor | 发生了什么 | 对 Harness 的含义 |
|---|---|---|
| Duckcoding | `/v1/images/generations` 和 `/v1/models` 返回 HTML | 「有 key 和 URL」≠ Image2 JSON API |
| Micu | 短 prompt + data URL 成功；20k prompt HTTP 400（上限约 4k） | 同一产品名，预算不够本 deck 完整 prompt |
| Packy | `generations` 地区 403；`edits` 要 16 倍数尺寸；`2048x1152` + 最长 21k prompt 成功出 PNG | 已证明的打法不是默认 `generations`+`2000x1125` |
| Packy `/v1/models` | 不公开列出 `gpt-image-2`，但 edits 用这个字符串能画 | **模型列表不是证明** |
| APIMART | 接受长 prompt，返回异步 task；当时脚本没取到最终 PNG | HTTP 200 / `task_id` ≠ 拿到图 |

Lesson 自己的结论：Packy edits 是视觉预览首选，但 **不是** 当时 Harness 标准 generate 的即插即用替换；
不能把 `_scratch` 图冒充 raw receipt。

### 3.2 更早的调查（不要回到「model 都一样」）

- CLS-007 `image2-multi-vendor-architecture.md`（2026-07）：曾认为多 vendor = 多组
  `(base_url, key)`，model 都是 `gpt-image-2`。**本 plan 视为已被后来实验证伪，不复活 failover 列表。**
- CLS-036 / CLS-037：micu 上 `gpt-image-2` 是可重定向别名，不能硬编码单一 prompt 上限；
  已吸收进 capability-aware profile。Call Shape 把 **model 字符串 + budget** 当作要证明的事实，
  而不是从产品名推断。
- BUG-090 + 归档 change `bind-image2-transport-capability-vector`（2026-08-20）：
  生产 generate **已经能**按 profile 里的 transport 矢量打。缺的是 **发现** 和 **旧 probe 还在用另一套硬编码**。

### 3.3 本 deck 现在的配置错位（评审可当场打开）

`deck_ai_org_transform_keynote/2_backbone/visual-style/image2-provider-profile.yaml`
声明了 `packy-gpt-image-2` 和 `model: gpt-image-2`，**没有 `transport` 块**。
按现行 resolver，省略 transport = 默认 `generations`+`json`+`2000x1125`+`async-poll`。
Lesson 证明通的是 Packy **edits** + multipart + `2048x1152`。
所以「.env 已经指向 Packy」≠「正式 generate 在打已证明的那一炮」。

---

## 4. 现行代码锚点（声称必须能对上这些文件）

评审请核对这些「现在」事实，再决定本文的「应该」是否过头。

| 声称 | 去哪看 |
|---|---|
| 生产 submit 已按 transport 拼 `/images/${http_operation}`，json vs multipart | `ppt_maker_harness/scripts/shared/cli/command_support.mjs` `pageImageProviderSubmitCall` / `boundPageImageTransport` |
| profile 校验闭集 transport；省略则默认 generations 矢量 | `ppt_maker_harness/scripts/shared/image2/provider_profile.mjs` `DEFAULT_PAGE_IMAGE_TRANSPORT`、`isLegalPageImageTransport`、`validateOperation` |
| profile source 契约（含 transport 可选） | `openspec/specs/run-bundle-management/spec.md` 「Current Image2 provider profile source…」 |
| 序列化层已有 `image2_provider_capability`，但还没点名 Call Shape | `ppt_maker_harness/schema/serialization-contracts.yaml` |
| `ppt_flow probe` 先要求 exact-run profile 匹配，再 **child** 到 env-check | `ppt_maker_harness/scripts/shared/cli/commands/probe.mjs` |
| env-check live POST **写死** `/images/generations`、`model: 'gpt-image-2'`、`1024x1024`；`task_id` 算成功 | `ppt_maker_harness/scripts/00-setup/internal/env_check.mjs` `inspect()`/`defaults()`、`checkImageSmoke`、`checkProbeVendors` |
| env-check **不得**静态 import YAML/profile | `openspec/specs/harness-script-layout/spec.md`；guard：`ppt_maker_harness/scripts/contracts/harness_architecture.mjs` `image2-capability-preinstall-import` |
| 通道体检 playbook 只做连通性，且声称成功 ≠ 授权 | `ppt_maker_harness/playbook/probe-image-channels.md`；`openspec/specs/playbook-execution/spec.md` probe 条（文案仍混有已退休的 `doctor --probe-vendors`） |
| probe **不是** create-deck 控制器 | `ppt_maker_harness/playbook/controller-manifest.json` 无 probe |
| deck 根白名单没有 `_lab/` | `bundle_layout.mjs` `DECK_ROOT_ALLOWED`（有 `_lessons/`、`_state/`，无 `_lab/`） |
| 上严下松：临时文件应下沉，根最严 | `openspec/specs/run-bundle-layout/spec.md` |
| 生产 stage 恰好十九个，Call Shape 不应变成第二十个 stage | `openspec/specs/harness-directory-layout/spec.md`；`ppt_maker_harness/schema/README.md` |
| 独立 CLI 先例 | `ppt_maker_harness/scripts/shared/run-bundle/lessons.mjs`；`00-setup/env-check.mjs` |
| 本 deck 实验原型（不要当目标布局） | `3_versions/v1/_scratch/pilot-packy/`、`pilot-preview-micu/`、`packy-edits-generate.mjs` |

---

## 5. 目标形状

```
Session B  Image2 Lab                         Session A  PPT flow
独立 playbook + 独立 CLI                      create-deck / edit-visual
--run-dir = 同一份 3_versions/vN             同一份 Run Bundle
读写 deck 根 _lab/                            正式只写 _generated/ + state
证明 Call Shape → last-proven.json            读 last-proven.json + _lessons/
写一篇非密钥 lesson                           人确认 → 写入 profile 信封
                                              IMAGE2_PROVIDER_PROFILE_ID 对齐
                                              image2 plan → authorize → generate
                                              （submit 与 Lab 同一条 transport）
```

```
deck_*/                                  一个 Run Bundle
├── _lab/                                Image2 Lab Workspace
│   ├── README.md
│   ├── fixtures/                        prompt blob、edits 参考 PNG
│   ├── trials/<id>/                     一次 live：candidate + 产出 PNG
│   └── last-proven.json                 最近证明成功的工作副本（非权威）
├── _lessons/                            给人读的结论
├── .env                                 密钥与 base URL（永不进 Call Shape / _lab 正文）
├── 2_backbone/visual-style/
│   └── image2-provider-profile.yaml     人确认后的 Call Shape 权威
└── 3_versions/vN/                       --run-dir
    ├── _generated/                      只有正式 generate / delivery
    ├── _scratch/                        PPT temp/bak
    └── _polish/
```

Harness（`ppt_maker_harness/`，soft bundle）在做 PPT 时仍是只读方法论 + 工具。
Lab CLI 是 harness 里的工具；实验**数据**属于这份 deck 的 `_lab/`。

---

## 6. 决策（含为什么不是别的）

### 6.1 唯一 schema 耦合是 Call Shape

Lab 和 PPT flow 不共用 Controller、`_state/`、grant、receipt。
「告诉 PPT flow」= 交出一份通过同一 validator 的 Call Shape 实例。
人把它嵌进信封并确认之后，generate 才看得见。

Call Shape **不是**第 20 个 production stage。点名放在
`serialization-contracts.yaml` 的 `image2_provider_capability` 下。
运行时 **一个** JS validator（现 `provider_profile.mjs` 或从它抽出的纯函数）。
Lab 与 profile resolver import 同一份。禁止第二套 combo 表。

省略 `transport` 的已确认 profile 仍解析为今天的默认 Call Shape，避免已有 source 大迁移。

### 6.2 独立 Lab，不进 `ppt_flow image2 *`

| 层 | 位置 | 职责 |
|---|---|---|
| CLI | `ppt_maker_harness/scripts/` 独立入口 | 候选 Call Shape → 生产同一条 submit/poll → PNG + stdout JSON |
| Playbook | `ppt_maker_harness/playbook/` 独立 MD | 披露次数 → 人确认 live → 调 CLI → 写 lesson；不进 create-deck 节点图 |
| Skill | playbook 即过程；Cursor `SKILL.md` 可选指针 | Session B 不加载 BOOTSTRAP / 不写幻灯片 |

Rejected：做成 `ppt_flow image2 lab`——和 receipt-bound `image2` 动词（plan/authorize/generate/review/accept）混在一起，探索 session 容易误走生产。

Lab 行为：

- 输入是 **候选 Call Shape 实例**（文件或等价 flag），不是 vendor 名字。
- **不要求** confirmed profile（相对 probe 的翻转）。
- **要求** `--run-dir`；经 `deckRoot()` 找 `_lab/`。
- 不编译 page source。prompt 是不透明字节。
- `edits` 用 `_lab/fixtures/` 或人指出的 Style Master 文件；不发明生产空白画布。
- 成功 = 合法 PNG。`sync` 无图失败；`async-poll` 必须 poll 到图。
- `prompt_budget.limit` = 已成功 prompt 的保守可观察上限，不是营销数字，不是 `/models` 列表。
- 不写 profile、`_state/`、`_generated/`、`_scratch/`。
- 失败：现有 CLI envelope，secret-safe，不回显 key/body/prompt。

### 6.3 Image2 Lab Workspace = deck 根 `_lab/`

实验必须在 **这份** Run Bundle，才能结合正在做的 PPT，同时和正式出图隔开。

| 备选 | 拒绝原因 |
|---|---|
| `vN/_scratch/` | PPT 可删 bak；`--new-version` 不拷；不是「实验环境」 |
| `vN/_lab/` | 换版本实验区没了；Call Shape / profile 是 deck 级 |
| 仓库另开 `lab_*` | 第二套 bundle；读不到这份 `.env` / Style Master / 真 prompt |
| 写进 harness 源码树 | 做 PPT 时 harness 只读；实验数据属于 deck |

`--run-dir` 仍然指向活的 `vN`，所以 Lab 可以：

- 读：dotenv、当前 version 解析到的 Style Master、已有信封（若有）、拷进 `fixtures/` 的 compiled prompt
- 写：只写 `_lab/`
- 不写：生产权威

`last-proven.json` **不是**第二权威。generate 只读 confirmed profile。

布局：deck 根白名单增长（先例 `_lessons/`）。出现则承认；内部不白名单文件名（像 `_polish/`）。
`init` 只种子 README。缺目录不修已有 bundle 拓扑；lab 入口按需创建。
`--new-version` 不碰 `_lab/`。`.gitignore`：`trials/` 可忽略；禁止密钥。
本 deck `_scratch/pilot-*` **不迁文件**；新实验进 `_lab/`。

### 6.4 旧表面必须改到同一份 Call Shape（引入 Lab 的另一半）

否则 Packy 会再次出现：lab/scratch 通了，probe/generate 还在打 generations。

**Live Image2 离开 `00-setup`。** env-check 零 npm、禁 profile import，不可能诚实执行 Call Shape。

| 入口 | 目标 |
|---|---|
| 直接 `env-check` | 离线存在性 only。不再 live POST Image2 |
| `ppt_flow doctor` | 全局离线（已无 `--smoke` / `--probe-vendors`） |
| `ppt_flow probe` | 有 confirmed profile：同一生产 transport，对绑定 Call Shape **1 次**；成功 = PNG。pending → hard-stop 指向 Lab，零远端 |
| Lab CLI | 唯一允许在 **没有** confirmed Call Shape 时 live 打候选的入口 |

`--probe-vendors` 与「一条凭证对 + 一份 Call Shape」冲突。推荐收成对当前 resolved credential **恰好 1 次**绑定探测。不复活 failover。是否完全退休该 flag 留给 OpenSpec design（退休需要 cli-surface 迁移句）。

意图拆两问：

| 人想问 | 走哪 |
|---|---|
| 已确认的 Call Shape 还能连吗 | `probe-image-channels` → `ppt_flow probe` |
| 还不知道该怎么打 / 换 vendor | Lab playbook + Lab CLI |
| 正式出图 | `image2 generate`（看不见未确认的 lab 产物） |

`playbook-execution` 里「provider 失败就 offer `doctor --probe-vendors`」要改掉已退休命令，并按上面两问分流。
`COMMANDS.md`、`BOOTSTRAP.md`、`workflow/00-setup/03-runtime-and-tools.md` 同步。

Style Master generate 仍保持现行默认（generations JSON `2000x1125`）。Style Master 若也要 edits，**另开 change**。

架构 guard 加：Lab / generate / 新 probe **不得**第二份 submit/poll；Lab 入口必须登记。

---

## 7. 权威、gate、负路径

### 权威

| 事实 | 权威 | 谁写 |
|---|---|---|
| Call Shape 字段与合法值 | 点名后的 schema + 单一 validator | Harness 维护（OpenSpec） |
| 「这份实例已确认，本 deck 用它画画」 | `image2-provider-profile.yaml` + `owner_declaration: confirmed` | 人（Agent 可代填，人确认） |
| 密钥与 base URL | `.env` | 人 / 环境 |
| 「lab 刚刚证明过」 | `_lab/last-proven.json` + trials | Lab CLI（工作副本） |
| 给人下次读的叙事 | `_lessons/` | Agent 在试通后写 |
| 生产授权、receipt、PPTX | 现有 `image2` / delivery owner | 正式 PPT flow |

### Gate（human-centered-gates）

| 动作 | 结果 | 保护 |
|---|---|---|
| Lab 或 probe 的 live submit | `confirm`：披露本批次数；目标已是「找到能用的 Call Shape」时不每个候选再问目标 | 无授权远端花费 |
| 写入 confirmed profile | 已有 Deck Author declaration | lab 不能自封能力事实 |
| Lab 成功 | 不是 gate | 不得变成 grant/receipt |
| 非法 Call Shape 或未确认 profile 就 generate | 已有 hard-stop | 零远端 |
| pending 上跑 probe | hard-stop → Lab | probe 不猜默认 generations |

Hard-stop 不可 waive。Lab PNG 在 `_lab/`，**不能**当 delivery 证据。BUG-092 B（scratch→PPTX）仍悬挂，本 plan 不打开。

### 控制面变短（simple-reliable-control）

删：env-check 与 production 两套 live POST；「probe 成功 ≈ 会画」；scratch 脚本当发现手段；从 vendor 名或 `/models` 推断。

留：非法 combo 零远端；generate 仍要 grant；profile 仍要人确认。

---

## 8. 风险

| 风险 | 缓解 |
|---|---|
| Lab 另写 HTTP → 再次 lab 通、flow 不通 | 强制复用 `pageImageProviderSubmitCall` 一类；guard 种负例 |
| Call Shape 做成第 20 个 stage | 只进 `serialization-contracts.yaml` |
| Lab 自动写 confirmed profile | 禁止 |
| `last-proven.json` 被当成 binding | generate 只读 profile |
| 人把 `_lab/` PNG 拷进 `_generated/` | playbook 写明；不交付该路径 |
| pending deck 不能「先 probe」 | 故意：发现走 Lab |
| Session B 误入 create-deck | 独立入口 + 独立 playbook |
| deck 根新增目录违反上严下松精神 | 有 `_lessons/` 先例；内部保持松；评委应明确同意或改位置 |
| 长 prompt 花费 | 短 prompt 证明矢量；长 blob 另批披露 |
| Framed overlay 仍 2000x1125 | 不改 overlay；request size 与 final overlay 分离保持 BUG-090 change |
| 闭集不够 | 扩闭集是另一次边界 change，不是 vendor SDK |
| Cursor skill 变运行时 | 指针 only |

Rejected 备选：只扩 probe-image-channels；`ppt_flow image2 lab`；Call Shape 含 base URL；CLS-007 failover；`/v1/models` 当证明。

---

## 9. 落地（还不算开 change）

plan 无编号；关闭后才进 `_closed_plans/` 领 CLS-044+。

建议一个 OpenSpec change，名拟 `extract-image2-capability-lab`，任务串行。

| Capability | 改什么 |
|---|---|
| **新** `image2-capability-lab` | 独立 CLI、playbook、`_lab/`、候选 live 证明、stdout / last-proven。accepted = 证明，不是授权 |
| `run-bundle-layout` | `DECK_ROOT_ALLOWED` + `_lab/`；init README；`--check`；`--new-version` 不碰 |
| `run-bundle-management` | page-image 操作嵌入点名 Call Shape；lab 不写 profile |
| `production-schema-conformance` | `image2_provider_capability` 下点名 Call Shape |
| `image-generation` | generate 消费点名 Call Shape；不读 `_lab/` |
| `cli-surface` | 登记 lab 入口；probe 改绑 Call Shape + 生产 transport；env-check 去掉 live Image2 POST 语义 |
| `environment-check` | Image2 范围回到离线存在性 |
| `playbook-execution` | 两问路由；新 lab playbook；改写 probe-image-channels |
| `harness-script-layout` | 登记入口；单 submit；env-check 仍不得 import profile |
| `commands-reference` / `bootstrap-env-guidance` | 两问两入口；lab 不是新 deck bootstrap 必经 |
| `harness-charter` | 仅当 BOOTSTRAP / AGENT_CONTRACT 必须点名时 |

不改除非任务证明必须：`node-specification`、`lessons-management`、Framed overlay size、Style Master transport、BUG-092。

建议任务顺序：

1. 点名 Call Shape + 单一 validator + 负例
2. profile / generate 钉死消费该 schema（行为应保持）
3. live POST 移出 env-check；`ppt_flow probe` 改绑 Call Shape
4. Lab CLI：`--run-dir` → `_lab/`
5. `bundle_layout` 白名单 + lab playbook + 文档路由
6. 架构 guard + 回归 + `openspec validate --strict`

验证（change 的 design 再评估，这里先记账）：

- unit：validator；lab 不写 profile；非法 combo 零 fetch；env-check 无 live POST；`_lab/` 白名单
- integration：mock 上 lab 与 generate 对同一 Call Shape 发出同一 URL/encoding/size/model；async 必须取到 PNG
- e2e：用现有 mock Image2。真实 Packy 不是 CI 必过；那是 deck-local、人授权的 live

---

## 10. 锁定 vs 留给 change / 评审

**已锁定（人类在本设计对话里同意）**

- Lab 从 PPT flow 剥出；两 session；同一 Run Bundle；实验在 `_lab/`
- 规范词是 Image2 Call Shape，不是元组
- Schema 唯一耦合是 Call Shape；运行时结合是 `--run-dir` + `_lab/`
- `last-proven.json` 不是第二权威
- 线上 model 字符串是发现维度
- 密钥 / base URL 不进 Call Shape
- Lab 证明 ≠ 生产授权
- 闭集 transport，不写 vendor SDK
- 成功以 PNG 为准
- live Image2 离开 env-check；probe 不再硬编码 `gpt-image-2`+generations
- 不迁本 deck `_scratch/pilot-*` 当正式布局

**留给 OpenSpec design 或本次评审拍板（不推翻上面）**

- Lab CLI 文件路径（`scripts/image2-lab/…` vs `scripts/shared/image2/` 加薄入口）
- 候选输入：`--call-shape-file` vs 显式 flag
- `_lab/trials/<id>/` 的 id 规则要不要进 layout 宪法（倾向：不进，内部保持松）
- Cursor `SKILL.md` 做不做（不做不阻塞 playbook）
- `--probe-vendors` 收成单次 vs 退休 flag
- 新 OpenSpec capability 的最终 kebab 名
- `CONTEXT.md` 术语是规划期写入：archive 时是否保持、或等 change 落地再算「现行」——评审可建议

---

## 11. 评审请回答的问题

1. deck 根 `_lab/` 是否接受？若否，替代位置如何仍让两 session 共用一份 deck、且不污染 `_generated/`？
2. Call Shape 字段集是否刚好？有没有漏掉线上必须、或把信封字段误收进来？
3. 「Lab 复用 generate 的 submit」是否足够，还是 submit 还要再抽一层公共模块才守得住？
4. probe 在 pending profile 上 hard-stop 是否过硬？有没有人会把「先探一下钥匙」和「发现 Call Shape」再次混在 env-check？
5. 一个 OpenSpec change 是否太大？若要拆，哪条缝切开而不产生两套 schema？
6. 规划期改 `CONTEXT.md` 是否应撤回，等 change 再写术语？

反馈请针对本文条款（§ 编号 + 文件锚点），不要只凭聊天印象。
