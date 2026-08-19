# BUG-079: 新 deck 上级"下一步"文案缺失且互相矛盾，跳过上游素材与全流程预告

> 严重级别: P1 | 发现: 2026-08-19 | 状态: 活跃

## 症状

`ppt_flow init` 完成后，给小白用户展示的"下一步"没有任何引导性、且两条入口文案互相矛盾，既不提"先把素材丢进上游"，也不预告全流程有多长：

- 走 `ppt_flow init`：`ppt_maker_harness/scripts/shared/cli/commands/init.mjs:17` 打印
  `Next: ppt_flow.mjs status <v1Path>`——只让去看状态，没说该干嘛。
- 走 `bundle_layout.mjs --init`（底层）：`ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs:2046` 打印
  `Next: fill 2_backbone/ + 3_versions/v1/slide-specifications.md, then run the pipeline.`——**直接跳到中游+下游，全程没提上游素材收集**。

两条说的事不一样，小白看完不知道自己在第几步、第一步该做什么。

## 根因

`init` 的人类可读"下一步"没有单一、面向流程的文案源。走哪个入口由调用决定，两条路径各自硬编码了互不相同的 next，都漏掉了上游(1)素材收集这一前置步，也没有"你已完成 N 步中的第 1 步、接下来…"的进度意识。

## 复现

1. 在仓库根跑 `node ppt_maker_harness/scripts/ppt_flow.mjs init deck_xxx --deck-type keynote --style dark-executive`，看 `Next:` 行。
2. 跑 `node ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs --init deck_xxx ...`，看 `Next:` 行。
3. 对比两条，均无"丢素材进 `1_upstream_raw_material/`"也无全流程步骤数。

## 修复关联

待后续 findings 汇齐后统一进 OpenSpec change（onboarding 面向小白的全旅程引导：统一/收敛 `init` 的 next 单源；把"先喂上游素材"作为第一步写进文案；给出"你已完成第 N / M 步"的进度锚；文案统一为"术语 → 白话 → 下一步"格式——但保留术语，见记忆 novice-guidance-terminology-plus-plain-language）。