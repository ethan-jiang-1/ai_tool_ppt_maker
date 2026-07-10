# 命令速查

> 你说什么 → Agent 做什么. 30 秒扫完.

## 全量创建

| 你说 | Agent 走 |
|------|---------|
| "帮我做一个PPT" / "我要做一个关于X的演示" | BOOTSTRAP 三步启动 → Phase 0→1→2→3→4 |

## 迭代打磨

| 你说 | 链 | 执行 | 耗时 |
|------|----|------|------|
| "第5页标题不够有力" | A | Stage 1,3,4,5 --only 5 | ~5 min |
| "第8页的图重新生成一张" | B | Stage all --only 8 | ~5 min |
| "换个配色试试" | B | pilot 3 页 1k → 确认 → 全量 2k | ~15 min |
| "所有页面的颜色都换成蓝色系" | B | --force-images 2k | ~N×5 min |
| "备注改一下" | C | Stage 5 | ~30 sec |
| "加一页案例在最后" | Structural | --new-version + 新页 | ~5 min |
| "删掉第3页" | Structural | --new-version | ~5 min |
| "第2页和第5页换个顺序" | Structural | --new-version | ~5 min |

## 内容 & 结构变更

| 你说 | 走什么 |
|------|--------|
| "这段论证逻辑有问题" | 回 Phase 2, 改 backbone 的 formula/block map |
| "每页的数据都更新一下" | Chain A, 所有页 (批量文本) |
| "换个案例, 用特斯拉代替苹果" | Chain A, 单页或几页 |

## 视觉 & 风格变更

| 你说 | 走什么 |
|------|--------|
| "整体感觉不够高端" | 回 Phase 1, Agent 推荐 2-3 个替代 preset |
| "这个红色太刺眼了" | 改 color_palette.json → regenerate style_master → pilot |

## Agent 怎么判断

```
1. 改了什么?   title/text → Chain A   visual → Chain B   notes → C   structure → Structural
2. 几页?       1 → --only   几页 → rerun affected   全部 → --force-images
3. pilot?      颜色/风格变更 → 先试 3 页   文本变更 → 直接跑
```
