# 宪法: Run Bundle 目录结构 + 运行时

> **目录权威源**: `PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs`
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
| 任何非 Node 子进程作为 Stage 官方路径 | 破坏单一运行时 |

**允许**：`node scripts/*.mjs`、Node 内置 `fetch`、npm 依赖（`@napi-rs/canvas`、`pptxgenjs`、`commander`、`yaml`）。文档里的 ` ```bash ` 代码块只是**命令示例**（给人/agent 复制 `node …`），不是可执行资产。

Stage 2 / style-master / contact sheet **全部在** `PPTMAKER_FRAMEWORK/scripts/` 内实现，不发现、不依赖外部 skill。

## CLI 失败回执宪法（不可违反）

**消费者不只是人。** MD Controller、coding agent、未来更多自动化编排器都会跑 CLI。  
**exit code ≠ 0 不够**——没有结构化回执，消费者无法立刻知道「犯了什么错」，也就没有机会修。

| 要求 | 说明 |
|------|------|
| **失败必出 JSON** | 任何 CLI 硬失败（含未捕获异常、闸门拒绝、参数非法）除非零 exit 外，**必须**向 **stderr 最后一个非空行**写出一条单行、机器可解析的 JSON 回执 |
| **人机双读** | JSON 同时含稳定机器字段（`ok` / `code` / `where`）与人读字段（`message` / `hint`）；人话 `✗ …` 可写在 JSON **之前**，禁止写在 JSON 之后 |
| **禁止只抛散文** | 禁止仅打印 `✗ Fatal error: …` 就 `process.exit(1)` 且无 JSON——那是对 MD Controller 的致盲 |
| **解析约定** | 按行 split → 取最后一个非空行 → `JSON.parse`（不要假定整段 stderr 都是 JSON） |

最小 envelope（字段名稳定，可扩展）：

```json
{
  "ok": false,
  "code": "STABLE_ERROR_CODE",
  "message": "what failed (human + agent readable)",
  "hint": "what to do next",
  "where": "script#command or module path"
}
```

权威交叉引用：`openspec/config.yaml`（运行时铁律）· `charter/NODE-SPEC.md`（CLI ⇔ MD 协议）· capability `cli-surface`。

## MD↔JS 互补健壮性（Agentic 双轨 · 不可违反）

**MD/Agent 聪明但糊糊实实；JS/CLI 精准但笨。** 理想配合：模糊侧推进意图，精准侧修格式与契约。

| 要求 | 说明 |
|------|------|
| **读容错** | 状态/压模上的小格式瑕疵（缺标点、类型不对、空 mapping 当数组等）优先由精准侧确定性自愈 |
| **写洗净** | 自愈或成功读写后，磁盘上的 YAML/JSON 须是规范输出，避免 MD 在脏文件上越改越错 |
| **先修后问** | MD/Agent 发现坏 state / 坏压模 → 先 heal 或重写合法文件再继续；禁止把「去修语法」当作小白的下一步 |
| **真不可恢复才回执** | 仍走 CLI JSON envelope（见上节）；可恢复的格式问题应先修再走 |

样板实现：`scripts/lib/state.mjs` 对 `_state/state.yaml`。同一原则可扩到其他压模，但不要求一次做完。

权威交叉引用：`charter/NODE-SPEC.md`（SAFETY）· `charter/AGENT_CONTRACT.md` §7 · capability `node-specification` / `framework-charter`。

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

**Framework 只约定**路径、闭环、写条目规矩、禁止项；**每个 run bundle 自己积累**内容。写条目规矩见 init 种子 `_lessons/README.md`（与 `LESSONS_DIR_README` 同源）。

## 权威树 (快照)

```
deck_{NAME}/
├── deck-guide.md                     ← read first: structure + workflow + edit chains
├── CLAUDE.md                         ← 1-line pointer to deck-guide.md (auto-load)
├── project-metadata.yaml
├── _state/                           ← playbook execution progress (not material)
│   ├── state.yaml                    ← truth source (atomic write)
│   └── history.jsonl                 ← append-only reference log (created on demand)
├── _lessons/                         ← retained lessons after probe/overcome (read-before-guess; not secrets / not progress)
│   ├── README.md                     ← 这里放什么 / 闭环 / 怎么写
│   └── *.md | *.yaml                 ← one lesson per file (e.g. image2-proven.yaml)
│
├── 1_upstream_raw_material/          ← 上游 UPSTREAM · raw material · shared · append-mostly · no versions
│
├── 2_backbone/                       ← 中游 BACKBONE · 主干/default source-of-truth · shared · stable
│   ├── core-metaphor.md
│   ├── core-formula.md
│   ├── design-constraints.md
│   ├── outline.md
│   ├── manuscript/
│   └── visual-style/
│       ├── style-master-prompt.md
│       ├── style_master.jpg
│       ├── deck_system.txt
│       └── color_palette.json
│
└── 3_versions/                       ← 下游 DOWNSTREAM · 微调+生产 · versions live here
    ├── v1/                               ← --run-dir (one design iteration = downstream delta)
    │   ├── slide-specifications.md       ← per-slide 4-layer specs; each slide declares render mode
    │   ├── overrides/                    ← only what THIS version changes vs backbone; empty = inherit
    │   │   ├── visual-style/           ←   (optional) this version's visual tweaks
    │   │   └── manuscript/               ←   (optional) this version's script tweaks
    │   └── _generated/                    ← GENERATED · rm -rf & rerun · never hand-edit
    │       ├── slide_plan.json
    │       ├── page_prompts/{NN_id.prompt.md, _prompts.json}
    │       ├── page_images_full/{NN_id.png, NN_id.apimart-task.json}
    │       ├── header_locked/NN_id.png
    │       ├── ppt/{NAME}.pptx (+ .backup.pptx)
    │       ├── qa/
    │       └── preview/contact_sheet.jpg
    └── v2/  (--new-version v1 → copies source delta only; clean _generated/; backbone referenced)
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

```
node PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs --init deck_<name> \
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
