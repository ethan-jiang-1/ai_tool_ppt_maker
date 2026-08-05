# BUG-058: Style Master 候选选择提示无法使用：无文件路径 + 标识符过长

> 严重级别: P1 | 发现: 2026-08-05 | 状态: 活跃

## 症状

在 deck_dark_factory 的 v2 framed Style Master 网关，Agent 弹出候选选择提示让用户审阅
candidate-001 和 candidate-002，但提示中只显示：

```
candidate-001（1a26256c…）
candidate-002（96a80ecf…）
```

两个致命问题导致用户无法做出选择：

1. **无文件路径** — 用户不知道候选图在哪个目录、什么文件名，无法打开查看。
   尽管产物实际存在于：
   `deck_dark_factory/1_upstream_raw_material/style-master-iterations/plans/<plan-sha256>/candidates/candidate-00X/image.png`
   但提示中完全没有给出这个路径。

2. **标识符过长且无信息量** — 提示中展示的是 64 字符的 SHA256 哈希（如
   `1a26256c3a53e16216fc0a0175d5d09271cb9aa23ecc0d60713ae5ed17cdc5c1`），
   截断为 `1a26256c…` 后仍然毫无辨识度。在项目这个规模下（每种候选只需区分几
   十个实体），根本不需要完整 SHA256，用短 ID（如 `cand-001` / plan 级别的短
   标识）或内容摘要就足够。

用户原话：『我选，我也不知道怎么选，我又看不到你路径，又不说出来。我觉得这反
正是个 UX 问题』『咱们有那个 ID 能不能截短一点…对一个项目而言，它需要这么个
uuid 吗？』

## 根因

候选选择提示的生成逻辑只输出 `candidate_id` + `candidate_sha256`（截断），没有
附带：
- 候选图文件的**完整路径**（或至少 repo 相对路径）
- 任何**人类可辨识的标识符**（计划名、生成序号、缩略描述等）

更深一层：整个框架默认用 SHA256 作为实体标识（plan 目录名、candidate ID、
state 中的各种 `*_sha256` 字段），这在内容寻址场景下合理，但**泄露到了
human-facing UI 层**。对人类用户来说，SHA256 就是一段不可读的随机字符串。

## 复现

1. 进入 v2 framed workflow 的 Style Master 网关
2. 候选生成完成后，Agent 弹出选择提示
3. 观察提示内容：只有 `candidate-001 (xxxxxxxx…)` 和 `candidate-002 (xxxxxxxx…)` 两个选项
4. 用户无法从提示中得知候选图的文件位置，截断哈希也无法区分

## 修复方向

两处改动：

1. **候选选择提示增加文件路径**（与 BUG-056 同类）：
   每次列出候选选项时，附带候选图文件的完整绝对路径或 repo 相对路径，
   让用户可以直接 `open` 或 Finder 定位查看。

2. **缩短 human-facing 标识符**：
   - 候选选择提示中，用 `candidate-001`（已够）或加上简短上下文
     （如 `candidate-001 (2048×1136 PNG)`），不再展示截断 SHA256
   - 如果未来需要人类引用某个实体（plan、candidate），可以考虑短序号/
     短 slug，只内部保留 SHA256 用于内容寻址
   - 或者至少在展示哈希时用 **前 7-8 位** 而非 `…` 截断（git 的 7 位短
     hash 惯例），让截断后的标识仍然有区分力

## 关联

- 直接关联 **[BUG-056](BUG-056-artifacts-need-full-paths-for-user-viewing.md)** — 同一类"不给全路径"问题
- 触发于 deck_dark_factory v2 framed Style Master 候选选择网关
