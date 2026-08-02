# BUG-043: Production 交付文件名缺 `NN_slideID` 前缀（框架强制 canonical-only）

> 严重级别: P1 | 发现: 2026-08-02 | 状态: 待真实 run 验收（本地框架回归保护完成：2026-08-02）

## 当前复核

`unify-page-ordinal-projections` 把 `position + slide_id -> NN_slideID.png`
收束为一个共享 formatter，target-v2 final manifest 的创建与校验都复用它。回归测试覆盖
`01`、`10`、`100`，防止 final path 从现有 `NN_slideID.png` production contract 回退为
裸 stable ID。

2026-08-03 的指定 deck 静态验收确认 v5 final 目录 25/25 个页面文件均为
`NN_slideID.png`。v7 仍没有 final 输出，故真实 rebuild 的 final 文件树仍待第 9 步验收。
bounded CURRENT v1 final filenames 仍是其受限兼容协议的一部分，本 change 不迁移或重命名
既有运行产物。

## 历史记录

### 症状

最终交付的 PNG 文件名是 `${slide_id}.png`（如 `InfoRev.png`），**没有 `NN_` 页序前缀**。而 `_backlog/_done/_closed_plans/production-conventions/slide-naming.md` 明确规定 production 交付物（最终导出 PNG/PDF）使用 `NN_slideID`（`01_InfoRev.png`）。对照：v4 的 raw 文件是 `01-GoRev.png` 风格（带序号），v5 的 final 却没有。

### 根因

框架 final manifest 生成只写 canonical 命名：

```js
// PPTMAKER_FRAMEWORK/scripts/shared/image2/page_authority_artifacts.mjs:222
items: ids.map((slide_id, index) => ({ slide_id, position: index + 1, final_sha256: ..., path: `${slide_id}.png` })),
```

且 `page_authority_artifacts.mjs:190` 校验 `item.path !== \`${item.slide_id}.png\`` 时**直接拒绝**——任何带 `NN_` 前缀的 path 都进不了 final manifest。即框架实现与 production-conventions 文档冲突：文档说生产交付物带 `NN_slideID`，框架强制 canonical-only 并拦截带前缀路径。`NN_slideID` 约定（commit b920a4d 只加了 docs）从未落地到框架。

### 复现

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs build <run-dir>
ls <run-dir>/_generated/page_authority_image2/final/
# InfoRev.png（无序号），非 01_InfoRev.png
```

### 修复关联

在 framework 侧：production 交付物导出时用 `NN_slideID`（`position` 已由 final manifest 携带），canonical artifact 仍保留 `${slide_id}.png` 供 receipt/rebuild。需放宽 final manifest path 校验或新增 production-export 命名层。与 BUG-040（页内页码）同属"序号"话题但不同机制（文件命名 vs 页脚）。
