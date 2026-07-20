# BUG-017: `ppt_flow build` html-first 被 gate approval 死锁，无法到达 Phase 4 Image2

> 严重级别: P0 | 发现: 2026-07-21 | 状态: 活跃

## 症状
html-first-v1 deck 要进入 Phase 4 Image2 refinement，必须先完成 delivery review。
但 delivery review 要求 build（PPTX+contact sheet+notes）。
build 又要求先 approve content + visual gates。
approve 命令因 BUG-016 始终失败。
结果：html-first deck 被锁在 "pilot 完成但无法前进" 的状态，
Image2 refinement 永远不可达。

## 根因
gate 审批链存在单点阻塞：BUG-016 导致 approve 不可用 → build 被拒 → delivery review 不可达
→ Phase 4 image2 plan 被拒。整个 html-first → image2 路径在 approve 节点被卡死。

## 复现
1. 完成 html-first-v1 deck 的 slide-specifications.md
2. pilot 成功，拿到 plan hash
3. approve 失败（BUG-016）
4. build 被拒（requires content/visual review）
5. image2 plan 被拒（requires delivery review: proceed）

## 修复关联
依赖 BUG-016 修复。
