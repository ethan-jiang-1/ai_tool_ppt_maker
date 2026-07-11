# 操作经验 (_learning)

**这里放什么:** 本 deck 在操作中试出来的、可复用的**非密钥**经验。下次 Agent/人进 deck：**先读这里再猜**，禁止只把经验留在聊天里。

**不放什么:** 密钥与生效凭据（→ `.env`）、playbook 执行进度（→ `_state/`）、上游素材、`_generated/` 产物。

**谁读写:** Agent（代表本 run bundle）；Framework 只约定目录与禁止项，不替各 deck 存经验内容。

**约定文件:**
- `image2-proven.yaml` — Image2 冒烟试通回执（`proven_at` / `base_url` / `via` / 可选 `notes`；**无 API key 字段**）

**禁止**把 API key 写入本目录。
