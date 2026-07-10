# BUG-001: 15/16 主 spec 存成 delta 格式，`openspec validate --specs` 系统性失败

> 严重级别: P1 | 发现: 2026-07-11 | 状态: 活跃

## 症状

`openspec/specs/` 下 16 个主 spec 中 **15 个**以 `## ADDED Requirements` 开头，缺规范的 `## Purpose` + `## Requirements` 结构。后果:

- `openspec validate --specs` → 15/16 失败（"Spec must have a Purpose section"）
- `openspec list --specs` → 这 15 个显示 `requirements 0`（工具解析不出需求）
- 仅 `framework-directory-layout/spec.md` 格式正确（唯一可用模板）

失败清单: cli-surface, commands-reference, content-parsing, environment-check, framework-charter, header-lock, image-generation, node-specification, notes-injection, pipeline-orchestration, playbook-execution, pptx-assembly, run-bundle-management, style-master-generation, visual-config。

## 根因

契约层原因: 一个 capability 首次由某个 change 的 delta 创建主 spec 时，sync/archive 把 delta 文件**逐字**拷进主 spec（保留 `## ADDED Requirements` 头），而没有规范成主 spec 的 `## Purpose` + `## Requirements` 结构。`framework-directory-layout` 是唯一正确的，说明这个规范化步骤在流程里**不一致/缺失**——只改 15 个文件（治标）而不修根因，下次归档还会再写坏。

## 复现

```bash
openspec validate --specs        # 1 passed, 15 failed
openspec list --specs            # 15 个 requirements 0
for f in openspec/specs/*/spec.md; do head -1 "$f" | grep -q '## Purpose' || echo "$f"; done  # 15 行
```

## 修复关联

拆成两步（本 bug 追踪，纯格式/流程，非 requirement 变更，故不走 OpenSpec change）:

1. **数据修复**: 把 15 个 spec 从 `## ADDED Requirements` 规范成 `## Purpose` + `## Requirements`；需求文本/scenario **逐字不变**，但每个 spec 的 `## Purpose` 需据其能力语义**手写**（模板见 `framework-directory-layout/spec.md`）。
2. **根因修复**: 定位 sync/archive 为何写 delta 头（agent-driven sync skill 的 checklist，或 openspec CLI 归档行为），补规范化步骤防复发。

注: `framework-directory-layout` 的 content 问题（子目录 4→5、reference 大小写）是 requirement 变更，已单独走 OpenSpec change `align-framework-directory-layout`，**不在本 bug 内**。
