# BUG-088: 全失败 Pilot 结束后 checkpoint 与 Controller node 冲突

> 严重级别: P1 | 发现: 2026-08-19 | 状态: 活跃

## 症状

Pure Pilot 的三项都进入 `known_failure` 后，第三次 `image2 generate` 已经写入对应
attempt，但 CLI 随后以内部错误退出：

`target_progressive_checkpoint_node_conflict`

此时 State 仍把 `generate-target-pure-pilot` 标记为 `in_progress`，而 workflow
inspection 已要求 `plan_progressive_pilot`，并说明应选择 successor Pilot scope。
Controller node 与 owner 的下一动作因此互相矛盾，正常的下一次 `generate` 也无法继续。

## 复现

1. 创建一个三页 partial Pure Pilot 并完成授权。
2. 让三次 provider submit 都得到确定的 `known_failure`。
3. 第三次 `ppt_flow image2 generate` 在 attempt 已记录后，以
   `target_progressive_checkpoint_node_conflict` 失败。
4. 运行 `ppt_flow state <run-dir> --json`：当前 node 仍是 generate，primary action
   却是重新 plan Pilot。

## 影响

- 用户没有得到任何 Pilot 图片。
- 当前批次已 terminal，但 Controller 没有进入可以规划 successor Pilot 的一致节点。
- 直接重跑生成会被 checkpoint 冲突拦截；Agent 无法只按一个 owner-issued action 恢复。

## 期望

当 partial Pilot 的所有 item 都 terminal 且无可 review 图片时，第三次 generate 应原子地：

- 记录最后一个 attempt；
- 将 Controller 推进到允许 successor Pilot planning 的节点；
- 返回唯一的 `plan_progressive_pilot` 恢复动作；
- 不把已经持久化的 provider 失败包装成另一个未知内部失败。

## 修复关联

与 BUG-087 的 item-level provider failure recovery 相关；BUG-088 是所有 Pilot item
terminal 后的 Controller/checkpoint 状态机冲突。
