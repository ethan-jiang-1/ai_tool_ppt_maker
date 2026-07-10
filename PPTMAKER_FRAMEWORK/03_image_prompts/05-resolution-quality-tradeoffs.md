---
title: 05 — Resolution, Quality, and Speed Tradeoffs
stage: 03_image_prompts
position: 06 of 06
type: methodology
summary: 方法论文件。Agent 理解其中原理并应用于对话引导。
depends_on:
- 03_image_prompts/README.md
- 03_image_prompts/04-iteration-and-debugging.md
feeds_into: []
agent_action: internalize
---

# 05 — Resolution, Quality, and Speed Tradeoffs

← [04](04-iteration-and-debugging.md) | [README](README.md)

## 三角权衡

你永远在三个变量之间做 tradeoff。没有一个设置能同时最大化三者。

```
          QUALITY
            /\
           /  \
          /    \
         /      \
        /________\
    SPEED ------ COST
```

| | 1K | 2K | 4K |
|---|-----|-----|-----|
| **Speed** | 15-25s | 30-60s | 60-120s |
| **画质** | Good——适合检查 layout 和颜色 | Great——细节锐利，全屏使用 | Excellent——可用于印刷 |
| **细节** | 小文字可能 blur | 所有文字清晰 | Overkill for screen |
| **Color fidelity** | 稍低 | 正常 | 最高 |
| **API cost** | 最低 | 标准 | 最高 |

## 什么时候用什么分辨率

### 1K — Pilot/迭代阶段

用于：
- 测试新 prompt 的 layout 和颜色
- 快速迭代（2-3 轮诊断修复）
- 给客户/team 看 "大方向对不对"

不用来交付最终 deck。1K 在 16:9 全屏上稍显模糊——文字边缘不够锐利。

### 2K — 最终生产

用于：
- 最终交付的每一张 slide
- 全屏投影/显示
- 99% 的 deck 场景

**这是 sweet spot。** 画质足够好，速度可接受（30-60s/page），成本合理。

### 4K — 特殊场景

用于：
- 超大屏幕（LED wall、影院屏幕）
- 印刷（是的，有人会把 keynote slides 印出来）
- 需要极致细节的图表

通常**不需要**。4K 耗时 2x-3x，文件更大，但全屏 16:9 显示上肉眼几乎看不出和 2K 的差别。

## 比例选择

GPT Image 2 支持多种 aspect ratio：

| 比例 | 适用场景 |
|------|---------|
| `16:9` | 标准 slides（**最常用**） |
| `4:3` | 老式投影仪（越来越少） |
| `1:1` | 社交媒体/头像 |
| `21:9` | 超宽 keynote opener（cinematic effect） |

对于幻灯片：**16:9 是标准答案**。只有在你确定客户的投影仪是其他比例时才改。

---

> **Next**: 拿 `template-image-prompt-builder.md`，用它来确保每个 IMAGE PROMPT 都不漏维度。
