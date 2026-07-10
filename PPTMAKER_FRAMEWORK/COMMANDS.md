# 命令路由表

> 你说一句话 → Agent 判断意图 → 加载对应 Playbook 执行.
> 每个 Playbook 是一个 MD Controller, 定义有序 Node 序列 + Entry/Exit Gate.

## 全量创建

| 用户说 | Playbook | 说明 |
|--------|----------|------|
| "帮我做一个PPT" | `full-creation` | 11 nodes, 从 instantiation → final |
| "我要做一个关于X的演示" | `full-creation` | 同上 |

## 迭代打磨

| 用户说 | Playbook | 入口参数 |
|--------|----------|---------|
| "第N页标题改一下" | `chain-a` | slide=N, field=title |
| "第N页标题不够有力" | `chain-a` | slide=N |
| "kicker 改成 XXX" | `chain-a` | slide=N, field=kicker |
| "第N页的图重新生成" | `chain-b` | slide=N |
| "换个配色试试" | `chain-b` | scope=all, pilot=true |
| "全部换成蓝色系" | `chain-b` | scope=all, pilot=true, force=true |
| "整体感觉不够高端" | `chain-b` | scope=direction (回 Phase 1, 重选 preset) |
| "备注改一下" | `chain-c` | — |
| "加一页案例在最后" | `structural` | action=add, position=end |
| "删掉第N页" | `structural` | action=delete, slide=N |
| "第N页和第M页换个顺序" | `structural` | action=reorder |

## 内容 & 方向变更

| 用户说 | Playbook | 说明 |
|--------|----------|------|
| "这段论证逻辑有问题" | `full-creation` | 回 hitl2 → rerun → seed-topics |
| "换个案例, 用X代替Y" | `chain-a` | 改内容, 不改图 |
| "每页的数据都更新一下" | `chain-a` | 批量文本, 所有页 |

## Agent 路由逻辑

```
用户说了一句话
  → 读 COMMANDS.md, 匹配意图
  → 确定 playbook 名 + 入口参数
  → 加载 playbook/<name>.md (MD Controller)
  → 从第一个 node 开始执行
  → State 写入 run-bundle-state.yaml
```
