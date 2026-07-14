---
title: "05 — 迁移/导入已有 deck（旁路护栏）"
stage: workflow/00-setup
position: migrate
type: playbook
summary: 旁路流程：把已有 deck/旧布局/散装素材迁进宪法树；强制 show、心跳与闸门重申。对应 playbook migrate-import。
depends_on:
- BOOTSTRAP.md
- charter/AGENT_CONTRACT.md
feeds_into:
- playbook/migrate-import.md
agent_action: follow_with_playbook
---

# 05 — 迁移 / 导入已有 deck

> 对应 playbook：[`playbook/migrate-import.md`](../../playbook/migrate-import.md)  
> 路由：[`COMMANDS.md`](../../COMMANDS.md)「旁路 / 迁移」  
> 铁律：[`AGENT_CONTRACT.md`](../../charter/AGENT_CONTRACT.md) §11

## 1. 何时用 / 何时不用

| 用 `migrate-import` | 不用（改走别的） |
|---------------------|------------------|
| 把已有 deck / 旧 run bundle 迁进本框架三层树 | 从零做 PPT → `create-deck` |
| 导入以前的 PPT、图、markdown 碎片 | 只打磨视觉 → `iterate-style` |
| 扁平 `v{n}/` 或 `_build/` 升到现行宪法布局 | 3 页快览 → `quick-preview` |
| | 已交付 PPTX 上改字/图 → `edit-*` |

**禁止**把迁移当成「特殊通道」：跳过 show、跳过 gate、静默长跑。

## 2. 迁法 A / B / C

| 代号 | 策略 | 适用 |
|------|------|------|
| **A 新 init + 迁入** | `ppt_flow init deck_NEW …`，再映射/拷贝源资产 | 源很乱、非 `deck_*` |
| **B 原地升三层** | 已有 `deck_*`，按下方旧→新表升级 | 旧框架 run bundle |
| **C 素材导入** | 只有碎片 → init 后进 `1_upstream`，再补内容/视觉 | 无完整旧 bundle |

Agent 必须在 intake 给出 A/B/C + 推荐 + 理由，让用户**认**，不得默认闷头选一种。

## 3. 六节点与 §11 对照

| Node | §11 要点 |
|------|----------|
| `intake-source` | 可认候选（A/B/C）；默认可逆 |
| `align-bundle` | 长任务心跳 |
| `inventory-map` | 映射表先认再搬；分段 checkpoint |
| `early-show` | Show don't tell；第一步看得见的赢 |
| `reaffirm-gates` | Checkpoint=方向对不对；gate 前 open 内容+视觉 |
| `handoff` | 相关时刻亮能力（`quick-preview` / `build`）；禁止静默 Stage 2 |

## 4. 旧路径 → 新路径

权威细节见 [`VERSION_LOG.md`](../../../VERSION_LOG.md)（v1.1 扁平 → v1.2 三层）。常用对照：

| 旧（示意） | 新（宪法） |
|------------|------------|
| `v{n}/style/`、散落 style 资产 | `2_backbone/visual-style/`（`style-master-prompt.md`、`style_master.jpg`、`deck_system.txt`、`color_palette.json`） |
| session / slide 源 markdown | `2_backbone/` 主干 + `3_versions/v1/slide-specifications.md` |
| `_build/` 或版本根下的生成物 | `3_versions/v1/_generated/`（**派生**，勿当源手改） |
| 管线调用 | `--run-dir deck_{NAME}/3_versions/v1` |

## 5. 禁止清单

1. 静默长跑（无心跳 / 无 checkpoint）  
2. 有图却只文字描述（不 `open`）  
3. 「以前做过了」就跳过 content/visual gate  
4. 手改 `_generated/` 当源  
5. 自创目录名绕开 `bundle_layout.mjs`  
6. 把迁移当成可以跳过 §11 的 `create-deck` 重做  

## 6. 完成后

gates 重申通过后：优先 [`quick-preview`](../../playbook/quick-preview.md) → 再 `ppt_flow build`。  
视觉方向不满意：`switchPlaybook` → `iterate-style`，完后 `resumePlaybook`。
