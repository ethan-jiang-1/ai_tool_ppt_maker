# 宪法: Run Bundle 目录结构 + 运行时

> **目录权威源**: `ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs`
>
> **运行时权威源**: 本节「运行时宪法」+ `openspec/config.yaml` 技术栈条款 + `charter/AGENT_CONTRACT.md` 铁律。
>
> 所有脚本从 `bundle_layout.mjs` import 路径常量. **人读的树是下面这样——但它只是快照**.
> 结构以 `bundle_layout.mjs` 为准. 命令行跑 `node bundle_layout.mjs` 看权威树.
>
> **改目录结构 → 只改 bundle_layout.mjs**. 别在任何脚本里硬编码路径, 别在任何文档里另画一棵树.

## 运行时宪法（不可违反）

**唯一允许的可执行代码形态：Node.js ESM（`.mjs` / 必要的 `.js`）。**

| 禁止 | 原因 |
|------|------|
| Python（`.py`）、Pillow、uv、`pyproject.toml` | 目标环境不保证有 Python |
| bash / shell 脚本（`.sh`）、POSIX-only 管线 | Windows 移植会断 |
| 外部 agent skill（「拜师」：`.claude/skills` / `.agents/skills` 作为生产依赖） | 跨平台 / 跨 agent 发现路径不一致，冷启动不可复现 |
| 任何非 Node 子进程作为生产官方路径 | 破坏单一运行时 |

**允许**：`node scripts/*.mjs`、Node 内置 `fetch`、npm 依赖（运行时核心如 `@napi-rs/canvas`、`pptxgenjs`、`commander`、`yaml`；完整清单以 `package.json` 为唯一权威）。文档里的 ` ```bash ` 代码块只是**命令示例**（给人/agent 复制 `node …`），不是可执行资产。

Page Image raw generation、visual-language compilation 和 raw review **全部在**
`ppt_maker_harness/scripts/` 内实现，不发现、不依赖外部 skill。

## CLI 失败回执宪法（不可违反）

**消费者不只是人。** MD Controller、coding agent、未来更多自动化编排器都会跑 CLI。  
**exit code ≠ 0 不够**——没有结构化回执，消费者无法立刻知道「犯了什么错」，也就没有机会修。

| 要求 | 说明 |
|------|------|
| **失败必出 JSON** | 任何 CLI 硬失败（含未捕获异常、闸门拒绝、参数非法）除非零 exit 外，**必须**向 **stderr 最后一个非空行**写出一条单行、机器可解析的 JSON 回执 |
| **人机双读** | 失败通道先输出由 sanitized envelope 确定性渲染的人读摘要，再以唯一 JSON envelope 收尾；原始失败 prose、stack、provider body、prompt、`.env` 内容和 child output 不得释放 |
| **禁止只抛散文** | 禁止仅打印 `✗ Fatal error: …` 就 `process.exit(1)` 且无 JSON——那是对 MD Controller 的致盲 |
| **解析约定** | 按行 split → 取最后一个非空行 → `JSON.parse`（不要假定整段 stderr 都是 JSON） |

回执必须保留稳定 top-level summary，并携带受版本约束的 `diagnostic`，把 JS 当刻知道的 category、source/subject、reason、ordered lineage、aggregate issues 与 `next` 交给 MD/人。`review` / `approve` 等人类决定必须显式停下；恢复命令使用 `{program,args}`，不得拼 shell。字段、enum、bounds、transaction、delegation 与 provider safety 的唯一 producer 权威是 capability `cli-surface`；本宪法不复制详细 schema。

权威交叉引用：`openspec/specs/cli-surface/spec.md`（producer）· `charter/NODE-SPEC.md` / capability `node-specification`（consumer）。

## MD↔JS 互补健壮性（Agentic 双轨 · 不可违反）

**MD/Agent 聪明但糊糊实实；JS/CLI 精准但笨。** 理想配合：模糊侧推进意图，精准侧修格式与契约。

| 要求 | 说明 |
|------|------|
| **读容错** | 状态/压模上的小格式瑕疵（缺标点、类型不对、空 mapping 当数组等）优先由精准侧确定性自愈 |
| **写洗净** | 自愈或成功读写后，磁盘上的 YAML/JSON 须是规范输出，避免 MD 在脏文件上越改越错 |
| **先修后问** | MD/Agent 发现坏 state / 坏压模 → 先 heal 或重写合法文件再继续；禁止把「去修语法」当作小白的下一步 |
| **真不可恢复才回执** | 仍走 CLI JSON envelope（见上节）；可恢复的格式问题应先修再走 |

样板实现：`scripts/shared/state/state.mjs` 对 `_state/state.yaml`。同一原则可扩到其他压模，但不要求一次做完。

权威交叉引用：`charter/NODE-SPEC.md`（SAFETY）· `charter/AGENT_CONTRACT.md` §7 · capability `node-specification` / `harness-charter`。

## Run bundle 自留教训面（`_lessons/` · Agent workflow 闭环 · 不可空挂目录名）

这是 **Agent workflow** 的暗示与约定：编排器会自我琢磨、自我试探、**自己克服困难**；修好之后必须把**非密钥**教训留在本 run bundle，下次**先读再猜**——禁止只留在聊天里导致失忆。

**闭环：**

```
遇事 → 琢磨/试探 → 自己克服 → 写入 _lessons/ → 下次先读再猜
```

| 面 | 放什么 | 不放什么 |
|----|--------|----------|
| `.env` | 密钥与生效凭据（机器加载） | 教训笔记 |
| `_lessons/` | 克服困难后留下的非密钥教训（按 README 规矩一题一文；例：`image2-proven.yaml`） | 密钥、playbook 进度、素材、生成物 |
| `_state/` | playbook 执行进度 | 教训笔记 |

**PPT Maker Harness 只约定**路径、闭环、写条目规矩、禁止项；**每个 run bundle 自己积累**内容。写条目规矩见 init 种子 `_lessons/README.md`（与 `LESSONS_DIR_README` 同源）。

## 目录严格度（上严下松 · 宪章原则）

像组织层级一样：**越往上越严，越往下越松。**

| 层 | 例子 | 严格度 |
|----|------|--------|
| 最严 | `deck_*` 根 | 只许宪法级 control 与一级目录；禁止散落 `.bak` / `_tmp` |
| 中 | `1_upstream` / `2_backbone` | 白名单；共享稳定 |
| 松 | `3_versions/v{n}/` 源 + `_generated/` | 本版源与管线产物 |
| 最松 | `3_versions/v{n}/_scratch/` | 本版临时/备份官方出口；内部不抠文件名；可删 |
| 最松 | `3_versions/v{n}/_polish/` | 本版持久打磨轨迹（人读 Markdown）；非管线；不跨版本；内部不抠文件名 |

临时东西**往下沉**进 `_scratch/`，**禁止往上逃**到 deck 根。

## 权威树 (快照)

```
deck_{NAME}/
├── RUN_BUNDLE.md                     ← portable local locator for a new Agent session
├── deck-guide.md                     ← operating guide after the bundle is located
├── AGENTS.md                         ← pointer: locator then guide
├── CLAUDE.md                         ← pointer: locator then guide (auto-load)
├── project-metadata.yaml
├── _state/                           ← playbook execution progress (not material)
│   ├── state.yaml                    ← truth source (atomic write)
│   └── history.jsonl                 ← append-only reference log (created on demand)
├── _lessons/                         ← retained lessons after probe/overcome (read-before-guess; not secrets / not progress)
│   ├── README.md                     ← 这里放什么 / 闭环 / 怎么写
│   └── *.md | *.yaml                 ← one lesson per file (e.g. image2-proven.yaml)
│
├── 1_upstream_raw_material/          ← 上游 UPSTREAM · raw material · shared · append-mostly · no versions
│   └── page-image-style-master-iterations/
│       ├── plans/<plan-sha256>/       ← immutable Style Master candidate history
│       └── scopes/vN/{framed,pure}/head.json ← one mutable current-plan pointer per scope
│
├── 2_backbone/                       ← 中游 BACKBONE · 主干/default source-of-truth · shared · stable
│   ├── core-metaphor.md
│   ├── core-formula.md
│   ├── design-constraints.md
│   ├── story-outline.md
│   ├── manuscript/
│   └── visual-style/
│       ├── style-master-prompt.md      ← current Style Master intent source
│       ├── style_master.png      ← optional local Style Master source
│       ├── page-image-visual-language.yaml ← current shared Page Image visual-language source
│       ├── image2-provider-profile.yaml ← Deck Author's non-secret route-capability declaration; never credential, State, or authorization
│       └── page-image-presentation/
│           └── pure-deck-visual-system.yaml ← Pure-only source; version override mirrors this relative path
│
└── 3_versions/                       ← 下游 DOWNSTREAM · 微调+生产 · versions live here
    ├── v1/                               ← --run-dir (one design iteration = downstream delta)
    │   ├── slide-specifications.md       ← Page Image source; stable IDs + one current version workflow
    │   ├── overrides/                    ← only what THIS version changes vs backbone; empty = inherit
    │   │   ├── visual-style/           ←   (optional) this version's visual tweaks, including matching image2-provider-profile.yaml override
    │   │   └── manuscript/               ←   (optional) this version's script tweaks
    │   ├── _generated/                    ← GENERATED · rm -rf & rerun · never hand-edit
    │   │   ├── page_image_workflow/receipts/source-receipt.json
    │   │   ├── page_image_workflow/raw/plan-manifest.json
    │   │   ├── page_image_workflow/review/
    │   │   ├── page_image_workflow/final/final-slide-manifest.json
    │   │   └── ppt/{NAME}.pptx (+ notes receipt)
    │   ├── _scratch/                      ← THIS version temp/bak · not SSOT · deletable
    │   └── _polish/                       ← THIS version human-readable polish trail · non-pipeline · not copied
    └── v2/  (--new-version v1 → copies source delta only; clean _generated/ + _scratch/; _polish/ not copied; backbone referenced)
```

## 三层梯度

| 层 | 目录 | 性质 | 是否版本化 |
|----|------|------|-----------|
| 上游 | `1_upstream_raw_material/` | 原始素材, 调研资料 | 否, 全版本共享 |
| 中游 | `2_backbone/` | 隐喻/公式/视觉风格主干 | 否, 全版本共享 |
| 下游 | `3_versions/v{n}/` | slide 规格 + 覆盖 + 生成产物 | **是**, 只版本这一层 |

## 覆盖规则

```
版本 overrides/<relpath> 存在 → 用覆盖版
版本 overrides/<relpath> 不存在 → 回退 backbone
```

## 初始化

Deck Author 的支持 public entry 是：

```
node ppt_maker_harness/scripts/ppt_flow.mjs init deck_<name> \
  --deck-type keynote --style dark-executive
```

`bundle_layout.mjs --init` 是 layout owner 维持同一初始化契约的 lower-level
interface，不是另一条 public startup route：

```
node ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs --init deck_<name> \
  [--deck-type keynote|pitch|report|training] \
  [--style dark-executive|clean-clinical|corporate-safe|tech-startup|warm-editorial]
```

## 校验

```
# 校验一个版本目录是否符合宪法
node bundle_layout.mjs --check deck_<name>/3_versions/v1

# 校验宪法内部自洽 (CI drift alarm)
node bundle_layout.mjs --self-check
```
