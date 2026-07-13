---
id: BUG-005
title: Image2 出图 vendor 切换体验极差——key 不互通、单 vendor 无 fallback、环境变量隔离
severity: medium
status: open
found_at: 2026-07-13
found_in: deck_ai_sdlc_keynote, Phase 3 production
reproduced: yes (全程)
---

## 症状

实际出图体验极其痛苦：

1. **默认 IMAGE2 三链频繁 mirror fail。** apib/aiuxu/aishuch 三个 vendor 在生成完成后 mirror download 阶段大量失败（"Mirror failed: fetch failed"），浪费大量等待时间。
2. **指定 `--base-url` 后只试一家，无 fallback。** 用 `--base-url https://api.aishuch.com/v1` 时若该 vendor mirror fail，不会尝试下一家——直接报错退出。
3. **环境变量里的 key（`CODEX_API_KEY_*`）pipeline 不认。** Shell 里已 export 的 `CODEX_API_KEY_LCONAI`、`CODEX_API_KEY_ZENMUX` 完全不被 pipeline 识别——它只读 `.env` 文件里的 `IMAGE2_*` / `OPENAI_*` / `IMAGE2_*` 前缀。必须手动编辑 `.env` 才能切换 vendor。
4. **手动编辑 `.env` 切 key 极其脆弱。** 要试另一个 vendor 就得改 `.env`，用完了还得改回来。而且不同 vendor 的 key 前缀不同（`CODEX_API_KEY_*` vs `IMAGE2_API_KEY` vs `IMAGE2_API_KEY`），不知道 pipeline 到底认哪个。
5. **没有 channel 探测/自愈能力。** 用户有其他可用 vendor（LCON、Zenmux）且有已验证的 key，但 pipeline 不知道——不会自动 `probe-vendors`、不会 fallback 到 `IMAGE2_BASE_URL` 里的其他家。

## 复现

1. 用 IMAGE2 默认链出图 → 多张 mirror fail
2. 换 `--base-url aishuch` → 仍 mirror fail → 无 fallback → 报错
3. 换 `--base-url lconai` → 401 Invalid token（key 在 shell 环境但 `.env` 没有）
4. 手动加 key 到 `.env` → 401（key 格式不对）
5. 换 Zenmux → 403 access denied
6. 换回默认链 → 时好时坏

全程 1-2 小时浪费在 vendor 切换上。

## 建议修复

1. **`--base-url` 支持多个 URL（逗号分隔）并自动 fallback。** 当前 `--base-url` 只接受单值——应接受逗号分隔列表，按序尝试。
2. **读取 `CODEX_API_KEY_*` 系列环境变量。** `LCONAI`/`ZENMUX` 等常见 vendor 的 key 前缀应被 pipeline 识别，或提供 `IMAGE2_BASE_URL` 更简单的单行配置方式。
3. **环境变量优先级高于 `.env` 文件。** Shell export 的 key 应被 pipeline 直接使用，不需要非得写 `.env`。
4. **Mirror fail 自动重试 + 退避。** 当前 mirror download 失败立即放弃——应重试 2-3 次，间隔递增。
5. **`--probe-vendors` 集成到出图前。** 出图前自动快速探测可用 vendor（调用 /models endpoint），自动选择最快的一家，失败再 fallback。用户只需配好 `IMAGE2_BASE_URL`，其余由 pipeline 处理。
