# 命令路由表（附录）

> **日常入口是 [BOOTSTRAP.md](BOOTSTRAP.md) + `scripts/ppt_flow.mjs`。**
> 本文件是自然语言 → playbook 的意图路由附录——用户说一句话时，Agent 可用来匹配改动类型；
> **不要**把本文件当成启动手册，也不要跳过 BOOTSTRAP / AGENT_CONTRACT。

> 你说一句话 → Agent 判断意图 → 加载对应 Playbook 执行.
> 每个 Playbook 是一个 MD Controller, 定义有序 Node 序列 + Entry/Exit Gate.

## 全量创建

| 用户说 | Playbook | 说明 |
|--------|----------|------|
| "帮我做一个PPT" | `create-deck` | 11 nodes, 从 instantiation → final |
| "我要做一个关于X的演示" | `create-deck` | 同上 |

## 探索 & 预览

> 还没全量交付、也不是改已有 PPTX——pre-commitment 试探。
> 推荐顺序：视觉 LOCK（可用 `iterate-style`）→ `quick-preview` → `build`。
> 不要把「打磨 style master」路由到 post-PPTX 的 `edit-visual`。

| 用户说 | Playbook | 说明 |
|--------|----------|------|
| "先定视觉方向，反复打磨 style master" | `iterate-style` | 1k loop → LOCK 升 2k |
| "视觉风格不满意，再调一版" | `iterate-style` | review-gate RETRY / 锁后反悔模式 C |
| "内容有了，先出 3 页典型页看看效果" | `quick-preview` | 须 gates 已批；contact sheet |
| "先预览一下再决定要不要全量" | `quick-preview` | PROCEED 再 build |

## 迭代打磨

| 用户说 | Playbook | 入口参数 |
|--------|----------|---------|
| "第N页标题改一下" | `edit-text` | slide=N, field=title |
| "第N页标题不够有力" | `edit-text` | slide=N |
| "kicker 改成 XXX" | `edit-text` | slide=N, field=kicker |
| "第N页的图重新生成" | `edit-visual` | slide=N |
| "换个配色试试" | `edit-visual` | scope=all, pilot=true |
| "全部换成蓝色系" | `edit-visual` | scope=all, pilot=true, force=true |
| "整体感觉不够高端" | `edit-visual` | scope=direction (回 Phase 1, 重选 preset) |
| "备注改一下" | `edit-notes` | — |
| "加一页案例在最后" | `restructure-slides` | action=add, position=end |
| "删掉第N页" | `restructure-slides` | action=delete, slide=N |
| "第N页和第M页换个顺序" | `restructure-slides` | action=reorder |

## 内容 & 方向变更

| 用户说 | Playbook | 说明 |
|--------|----------|------|
| "这段论证逻辑有问题" | `create-deck` | 回 hitl2 → rerun → seed-topics |
| "换个案例, 用X代替Y" | `edit-text` | 改内容, 不改图 |
| "每页的数据都更新一下" | `edit-text` | 批量文本, 所有页 |

## Agent 路由逻辑

```
用户说了一句话
  → 读 COMMANDS.md, 匹配意图
  → 确定 playbook 名 + 入口参数
  → 加载 playbook/<name>.md (MD Controller)
  → 从第一个 node 开始执行
  → State 写入 _state/state.yaml
```
