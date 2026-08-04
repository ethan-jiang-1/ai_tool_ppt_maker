# BUG-051: `doctor --smoke` 假阳性 —— 测不出"尺寸不符"和"prompt 超限"两类生产失败

> 严重级别: P2 | 发现: 2026-08-04 | 状态: 活跃

## 症状

`ppt_flow doctor --run-dir <run-dir> --operation raw-generation --smoke` 返回 `✓ READY`，但真实
生产 generate 立刻失败。本次生产流程里，doctor smoke 对 DUCK 显示
`submit ok (sync image from www.duckcoding.ai)`，随后 Style Master generate 全部失败。

doctor 只验证了"provider 可达 + 能返回一个图片引用"，没有验证生产路径的真实约束，给了错误的
"可以开工"信号。

## 根因

`00-setup/internal/env_check.mjs` 的 `checkImageSmoke`（658-737 行）：

- 请求用 `size: '1024x1024'`（**不是生产用的 2000x1125 / page raw 的 2000x1125**）。
- 只检查响应里是否有 `image_ref`（url）或 `task_id`（`diagnostics.classify`），**不解析实际 PNG 尺寸**。
- prompt 用的是 31 字符的 `'env-check smoke: solid mid-gray square, no text'`（**不是生产长 prompt**）。

因此它测不到本次生产的两个真实失败：
1. **provider 忽略请求尺寸** —— DUCK 对 `size: 2000x1125` 返回 1536x1024，smoke 用 1024x1024 且
   不看尺寸，测不出来（见 [[BUG-046]]）。
2. **prompt 超 provider 上限** —— micuapi 对 10931 字符 prompt 返回 400 "too long"，smoke 用短
   prompt，测不出来（见 [[BUG-048]]）。

## 复现

```bash
# 对 DUCK / micuapi 分别
node --env-file=.env PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor --run-dir <run-dir> --operation raw-generation --smoke
# 都显示 READY，但真实 Style Master/page raw generate 失败
```

## 影响面 / 修复方向

- doctor smoke 应反映生产路径的真实约束：用生产尺寸（2000x1125）与生产级 prompt 长度（或至少一个
  超过 provider 典型上限的代表 prompt），并解析返回 PNG 的宽高校验与请求尺寸一致。
- 关联 [[BUG-046]]、[[BUG-048]]。
