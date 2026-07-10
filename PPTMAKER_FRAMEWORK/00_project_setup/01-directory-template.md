---
title: 01 — Project Directory Template
stage: 00_project_setup
position: "02 of 05"
type: methodology
summary: 方法论文件。Agent 理解其中原理并应用于对话引导。目录结构的机器权威源是 06_reference_scripts/bundle_layout.py。
depends_on:
- 00_project_setup/README.md
- 00_project_setup/00-run-bundle-concept.md
feeds_into:
- "00_project_setup/02-python-environment.md"
agent_action: internalize
---

# 01 — Project Directory Template

← [00](00-run-bundle-concept.md) | [Next →](02-python-environment.md)

## 唯一事实源（SSOT）：`bundle_layout.py`

> **目录结构的唯一事实源是代码，不是本文。** 机器可读定义在
> [`06_reference_scripts/bundle_layout.py`](../06_reference_scripts/bundle_layout.py)——所有管线脚本从它
> import 路径，本文的目录树也应与它一致。想看权威树，直接跑：
>
> ```bash
> python _ppt_framework_v1/06_reference_scripts/bundle_layout.py
> ```
>
> 改目录结构 → 只改 `bundle_layout.py`，别在任何脚本里硬编码路径、别在任何文档里另画一棵树。
> 这条纪律就是为了根除"结构信息散在各处、各自漂移"的碎片化问题。下面这棵树是它的人类可读镜像。

## Run Bundle 的精确目录结构

一个 run bundle 是一个 **deck**——一个持续演进的整体。它的结构遵循一条**信息分化梯度**：越上游越稳定、越共享；越下游变动越多、才切版本。

```
deck_{NAME}/                       ← 一个 deck（run bundle）。"deck_" 前缀必须保留：
│                                     Stage 4 从 deck 根目录名推导 PPTX 文件名。
├── deck-guide.md                  ← 进目录先读：结构 + 工作流 + 编辑链（人和 agent 都看得懂）
├── CLAUDE.md                      ← 一行指针，指向 deck-guide.md（保 Claude Code 自动加载）
├── project-metadata.yaml          ← topic / 听众 / 语言 / 北极星 + content/visual gate 状态
│
│  ═══ 上游 UPSTREAM · 原始素材 · 全版本共享 · 只增不改 · 无版本 ═══
├── 1_upstream_raw_material/       ← research / 调研 / 参考；写着发现缺了就往里补
│
│  ═══ 中游 BACKBONE · 主干 / 默认事实源 · 全版本共享 · 相对稳定 ═══
├── 2_backbone/
│   ├── core-metaphor.md           ← 核心隐喻
│   ├── core-formula.md            ← 核心公式（A + B = C，可证伪）
│   ├── design-constraints.md      ← 设计约束（语言/禁用元素/文字密度…）
│   ├── outline.md                 ← 大纲主干
│   ├── manuscript/                ← 讲稿主干（part0-3）
│   └── visual-style/              ← 视觉主干（全 deck 长一样的根源）
│       ├── style-master-prompt.md ←   生成 style_master 的 prompt（源文件，别丢）
│       ├── style_master.jpg       ←   image-2 照上面 prompt 画出来的视觉锚（必须 .jpg）
│       ├── deck_system.txt        ←   文字约束（Stage 1 读取）
│       └── color_palette.json     ←   配色 + header lock 字号（Stage 3 读取）
│
│  ═══ 下游 DOWNSTREAM · 微调 + 生产 · 版本只切这一层 ═══
└── 3_versions/
    ├── v1/                        ← 一次设计迭代（= --run-dir）。版本只由目录名承载。
    │   ├── slide-specifications.md ←  每页四层规格 + 每页声明 render mode（管线入口）
    │   ├── overrides/             ←  只放这一版偏离 backbone 的东西；空 = 全部继承
    │   │   ├── visual-style/      ←    （可选）这版的视觉微调
    │   │   └── manuscript/        ←    （可选）这版的讲稿微调
    │   └── _generated/            ←  【派生】脚本生成的一切。绝不手改。可 rm -rf 后重跑重建。
    │       ├── slide_plan.json                      ← Stage 1
    │       ├── page_prompts/                        ← Stage 1（每页 prompt 各一个文件）
    │       │   ├── 01_slide_id.prompt.md            ←   人可读
    │       │   └── _prompts.json                    ←   机器格式（Stage 2 吃这个）
    │       ├── page_images_full/                    ← Stage 2：image-2 原始图
    │       │   ├── 01_slide_id.png
    │       │   └── 01_slide_id.apimart-task.json    ←   trace（实发 prompt + model + mirror）
    │       ├── header_locked/                       ← Stage 3：Python 叠标题后的最终图
    │       ├── ppt/                                 ← Stage 4-5：最终交付物
    │       │   ├── {NAME}.pptx
    │       │   └── {NAME}.backup.pptx
    │       ├── qa/                                  ← QA（可选）
    │       └── preview/contact_sheet.jpg            ← 联系表（Python 拼的，无 prompt）
    └── v2/                        ← --new-version 创建：只复制 slide-specifications.md + overrides/
        └── ...                       backbone 和 upstream 引用共享，不复制
```

## 三层分化梯度：这是整个结构的灵魂

| 层 | 目录 | 是什么 | 变动特征 | 版本？ |
|----|------|--------|---------|--------|
| **上游** | `1_upstream_raw_material/` | 原始素材、调研 | 主要往里"补"，写着发现缺了就加 | 无版本，一份，共享 |
| **中游** | `2_backbone/` | 主干：隐喻/公式/约束/大纲/讲稿/视觉 = 默认事实源 | 骨架，相对稳定 | 无版本，一份，共享 |
| **下游** | `3_versions/v{n}/` | 微调 + 生产：每页规格、多一条少一条、渲染产物 | 反复打磨，分化最多 | **版本只切这里** |

**为什么这样切**：做 PPT 反复打磨时，V2 相对 V1 大概率只是"多两页、砍一页、某页换个说法"——一个**下游增量**，压在一个**稳定的上游底座**上。如果 `cp -r` 把整个 deck（含 research、视觉）都复制，共性就分叉了（这正是框架 bug 0007 的病）。所以版本只切下游，上游中游共享一份。

## 下游从 backbone 汲取，但可以局部覆盖（override）

`2_backbone/` 是**默认事实源**。某一版要微调视觉或讲稿时，在这版的 `overrides/` 里放对应文件即可。管线取任何 backbone 资产时的规则（由 `bundle_layout.resolve_backbone_asset` 实现）：

```
版本的 overrides/<X> 存在？ ── 是 ──→ 用版本的
        │
        否
        ↓
   用 2_backbone/<X>
```

- 版本 `overrides/` 里**只放这版真正改过的东西**——没改的不放，自动继承 backbone。
- 这就是"给下游灵活度"又"不拷贝分叉"：共性留 backbone 一份，版本只存差异。

## 打开一个 deck，你只看到清晰的三段

顶层 `1_ / 2_ / 3_` 前缀让 `ls` 天然按 上游→中游→下游 排列，信息流一眼可见。判断某一版进度：`ls 3_versions/v{n}/_generated/`——有 `slide_plan.json` = Stage 1 完成，有 `page_images_full/` = Stage 2 完成，有 `ppt/*.pptx` = 生产完成。

## 源文件 vs 派生品（下游版本内部）

```
源文件（人类写 + 改）                          派生品（脚本生成，进 _generated/，可重跑覆盖）
─────────────────────────                     ─────────────────────────
3_versions/v1/slide-specifications.md     →   _generated/slide_plan.json
2_backbone/（隐喻/公式/大纲/讲稿）           →   _generated/page_prompts/*
2_backbone/visual-style/                  →   _generated/page_images_full/*.png
（或 v1/overrides/ 覆盖）                    →   _generated/header_locked/*.png
                                              _generated/ppt/{NAME}.pptx
```

**纪律**：只改源文件（`2_backbone/`、`1_upstream_raw_material/`、版本的 `slide-specifications.md` 与 `overrides/`）。**绝不直接改 `_generated/`**——下次重跑会覆盖，且丢失上游 traceability。物理分离让这条纪律不可能违反：你不会去改一个明确标着"别碰、可删"的目录。

## 版本策略：`--new-version`

```bash
uv run python _ppt_framework_v1/06_reference_scripts/bundle_layout.py \
  --new-version deck_X/3_versions/v1
```

- 只复制 `slide-specifications.md` + `overrides/`；新版本 `_generated/` 是干净的。
- `diff -r 3_versions/v1 3_versions/v2` 只显示设计真正变了什么，不被 research/视觉的噪音淹没。
- v2 崩了 v1 完整可用；旧版本的 `_generated/` 可删掉只留源，需要时重建。

> **命名纪律**：版本只由目录名 `v{n}/` 承载，`v{n}/` 内部文件名**不带版本后缀**（是 `slide-specifications.md` 不是 `slide-specifications-v1.md`）。同一信息不要编码两次。

## 脚本不放在 run bundle 里

管线通过 `unified_pipeline.py --run-dir deck_{NAME}/3_versions/v1` 从
`_ppt_framework_v1/06_reference_scripts/` **就地运行**。run bundle 里**没有** `scripts/` 目录。

---

> **Next**: `04-conventions.md` — 命名约定、版本快照策略、Git 管理、工作纪律。
