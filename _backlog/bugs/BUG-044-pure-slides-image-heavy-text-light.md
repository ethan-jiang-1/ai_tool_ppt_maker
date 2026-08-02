# BUG-044: Pure 页面图多字少（BODY 正文从未送达模型，图文比例先天失衡）

> 严重级别: P0 | 发现: 2026-08-02 | 状态: 活跃

## 症状

pure 生成的图**图多字少**：只有标题（display）+ 场景，几乎没有正文文字。像画展不像 PPT。对照 V1：每页文字为主（命题、数据、引语、领域标注全画在图上），图作比喻支撑。用户判断：图和文的比例是 PPT 的初始要求，当前比例错误，是**先天 bug**（不是内容没写，是通道没有）。

## 根因

pure 只把 `display`（KICKER/TITLE/SUBTITLE/CALLOUT）放进 raw contract 送给模型：

```js
// PPTMAKER_FRAMEWORK/scripts/04-pure-image/index.mjs pureRawContract
display: { ...slide.display },
```

`BODY` 字段在 `page_authority_source.mjs` 的 `PAGE_AUTHORITY_FIELDS` 里被 `scanSlideFields` 捕获（仅 framed 被禁，pure 允许），但**从未加进 slide receipt，也未进 `pureRawContract`**——正文文字从解析到出图全程被丢弃。框架没有"图文比例"的任何机制：pure 的 text 交付能力先天不足。

## 复现

```bash
# pure 出图（source 里写 **BODY**: ...）
# final PNG 只有标题+场景，BODY 文字不出现
```

## 修复关联

1. `page_authority_source.mjs`：pure 解析 `BODY` 进 receipt（`body` 字段）。
2. `pureRawContract`：把 `body` 文本纳入 contract → 模型收到正文可画。
3. 注册表 provider_clauses：指示"display 标题 + BODY 正文画出来、场景作背景隐喻"（text_guard 安全措辞）。
4. source 每页补 BODY（从 V1 的命题/数据/引语迁移）。

与 BUG-041（"no lettering" 压制文字）同族：041 是"字被禁"，044 是"正文通道缺失"。修复后 v5 需重生成。
