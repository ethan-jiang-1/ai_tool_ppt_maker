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

**允许**：`node scripts/*.mjs`、Node 内置 `fetch`、npm 依赖（`@napi-rs/canvas`、`pptxgenjs`、`commander`）。文档里的 ` ```bash ` 代码块只是**命令示例**（给人/agent 复制 `node …`），不是可执行资产。

Stage 2 / style-master / contact sheet **全部在** `PPTMAKER_FRAMEWORK/scripts/` 内实现，不发现、不依赖外部 skill。

## 权威树 (快照)

```
deck_{NAME}/
├── deck-guide.md                     ← read first: structure + workflow + edit chains
├── CLAUDE.md                         ← 1-line pointer to deck-guide.md (auto-load)
├── project-metadata.yaml
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
