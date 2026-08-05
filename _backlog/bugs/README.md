# Active Bugs — 活跃 bug 列表

> 最后更新: 2026-08-05 | `_backlog/bugs/` — 活跃 bug 在此
>
> **bug 编号权威在 `_done/_fixed_bugs/`，新 bug = 最大编号 + 1。** 本文件只列活跃 bug。

## 修完一个 bug 的步骤

1. `git mv bugs/BUG-<NNN>-<slug>.md _done/_fixed_bugs/BUG-<NNN>-<slug>.md`
2. 更新 `_done/_fixed_bugs/README.md`（加表格行 + 更新 Next available bug ID）
3. 更新本文件（删掉该 bug）
4. 更新 `../_done/README.md`（计数 +1）

---

## 活跃列表

### P1（重要 — 3 个）

- **[BUG-055](BUG-055-page-raw-invalid-json-no-response-visibility.md)** — page raw generate 报 invalid_json 但 provider 实际返回合法 JSON：无响应可见性，瞬时 provider 抖动被当确定性失败烧掉整批提交
- **[BUG-057](BUG-057-pure-pages-lack-visual-system-consistency.md)** — Pure workflow 各页视觉系统不一致：字体/字号/色调/layout 每页自由发挥，缺全 deck 锁定视觉系统
- **[BUG-058](BUG-058-candidate-selection-prompt-unusable-no-path-long-ids.md)** — Style Master 候选选择提示无法使用：不展示候选图文件路径，且截断 SHA256 哈希对人类无辨识度

### P2（次要 — 2 个）

- **[BUG-056](BUG-056-artifacts-need-full-paths-for-user-viewing.md)** — Agent 要求用户查看产物（中间图/PPT）时不提供完整路径，用户无从定位
- **[BUG-059](BUG-059-style-master-compat-jpeg-fails-16bit-png.md)** — Style Master 兼容 JPEG 投影对 16-bit provider PNG 失败（loadImage 无法解码）

---

**Next available bug ID: BUG-060**

## 类别分布

无活跃 bug。

---

## 卡片模板

新建 bug 文件 `BUG-<NNN>-<slug>.md`，`<NNN>` 取 `_done/_fixed_bugs/README.md` 的 Next available ID：

```markdown
# BUG-<NNN>: <一句话标题>

> 严重级别: P0 / P1 / P2 | 发现: 2026-MM-DD | 状态: 活跃

## 症状
观察到什么错误行为（现场、报错、复现路径）。

## 根因
定位到的机制层原因（越到"契约/结构"层越好，避免只描述表象）。

## 复现
最小复现步骤 / 命令 / 输入。

## 修复关联
落地的 OpenSpec change 名称 + 版本；或说明为何拆成更窄的 follow-up。
```

> 约定：严重级别用 `P0`（阻断）/ `P1`（重要）/ `P2`（次要）。把每个 bug 当作**契约探针**——一个具体缺陷往往牵出一整类失败，值得顺藤摸瓜做横切排查，而不是只打一个孤立补丁。
