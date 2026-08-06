# BUG-063: 内容寻址目录名过长（64-hex），用户侧路径不可用

> 严重级别: P2（UX/导航，协议设计成本）| 发现: 2026-08-06 | 状态: 活跃

## 症状

生产产物目录用完整 64 位 SHA-256 命名，路径极长、用户无法导航/记忆/口头引用：

```
deck_dark_factory/1_upstream_raw_material/style-master-iterations/plans/96aeda5d345ec1aac49ac0186371a03c8a53caeaf8182e76d33168d37fbd25b8/candidates/candidate-001/image.png
deck_dark_factory/1_upstream_raw_material/page-production-iterations/plans/<64hex>/materializations/<64hex>/raw.png
```

用户反馈：太长了，没法用。

## 根因 / 现状

这是**内容寻址协议的设计**，不是缺陷：`plans/`、`batches/`、`materializations/`
目录以完整 digest 为路径键，store 校验 record digest 与目录名必须一致
（见 `_lessons/hash-id-research.md`；`page_authority_progressive_store.mjs`
拒绝任何非 64-hex 目录）。`6e8d0fb` 短引用只做了**显示层**（`p-<8hex>`），
明确「no storage migration or history rewrite is needed」。

## 影响

- Agent/用户口头引用、跨会话恢复、命令传参都暴露完整哈希。
- 路径过长增加误操作与复制出错概率。
- 用户已多次反馈，属持续性 UX 痛点。

## 修复方向（需协议/规格决策，非一行修复）

1. 保留完整 digest 作为**内容寻址的真实键**（不变），但提供短容器名层：例如
   `plans/<8hex>/` 下挂 `full=<64hex>` 映射，或 materialization 用符号链接/
   短别名目录。风险：store 扫描只认 64-hex 目录，需同步改校验。
2. 或引入 registry/视图层（如 `_lessons/hash-id-research.md` 推荐的
   `plan 671d4555` 短引用解析回完整 digest），路径仍全，但交互层隐藏。
3. 属于 **protocol/spec 级改动**（涉及 openspec `page-production` 与
   `run-bundle-layout`），应走 OpenSpec change，不在 run-bundle 内硬改。

## 关联

- BUG-062（CLI stdout 长哈希）同类；`6e8d0fb` 短引用；`_lessons/hash-id-research.md`。
- BUG-061（工作区重复 bundle）同属可读性/卫生。
