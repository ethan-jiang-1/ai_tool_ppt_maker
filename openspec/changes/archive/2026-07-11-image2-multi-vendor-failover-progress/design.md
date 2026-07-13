## Context

一路塞进来的诉求，收成 **一条脊柱、三截**：

```text
A 运行时          resolveVendors → failover → 心跳 / i/N → 失败可见
        ↓
B Doctor 仪器     静态 ≡ resolve │ --smoke 门禁 │ --probe-vendors 逐家报告
        ↓
C 意图可发现      COMMANDS 同义词 → playbook 编排 │ 症状亮能力 │ 短路径直跑 doctor
```

实验结论（勿再推翻）：vendor 参数面无真差异；真差异 = sync/async + url/b64，一个薄分支 + `extractImageRef` 即可。推荐顺序 LCON → Zenmux → apib。

```bash
IMAGE2_BASE_URL=https://s.lconai.com/v1|CODEX_API_KEY_LCONAI,https://zenmux.ai/api/v1|CODEX_API_KEY_ZENMUX,https://api.apib.ai/v1|IMAGE2_API_KEY
```

约束：Node ESM；CLI JSON envelope；不新增顶层子命令；不造 watch daemon。

## Goals / Non-Goals

**Goals:** 上图 A+B+C 全部落地且自洽。  
**Non-Goals:** registry/strategy；新子命令；探针自动写 `.env`；考用户背旗标；`/edits`；删 async；改 `Mirror failed` 前缀。

## Decisions

### A — 运行时

**D1 `resolveVendors`：** `--base-url`（仅共享 key）→ `IMAGE2_BASE_URL` → legacy BASE_URL(S)+共享 key。VENDORS 非空忽略 legacy URL。缺 KEY_ENV → 整表失败点名。多 vendor 不靠 `bridgeCredentials`。

**D2 一层循环：** submit → 有图则存 → 否则 poll → 否则下一 vendor。

**D3 可观察等待：** 单图 `phase=submit|poll` 心跳（≥30s）；Stage2 `i/N`；probe `probing i/N`。submit/poll 同受 `MAX_WAIT_MS`。

**D4 失败可见：** `Mirror failed`；全挂 attempts≤5；成功 trace：`base_url` + `attempts`（可为 `[]`）；全挂不强制写 trace。

### B — Doctor

**D5 两档 live + 静态 ≡ resolve：**

| | 范围 | 角色 |
|--|------|------|
| 静态 | key/url/VENDORS | READY / NOT READY |
| `--smoke` | 第一家 | 门禁 |
| `--probe-vendors` | 全部 | 每家 ok/fail/mode/elapsed + Suggested `IMAGE2_BASE_URL`（通的按耗时升序，不通附末） |

成功判定一律：图 ref **或** task id（共用 extract helpers；缺则 export）。不写 `.env`。两旗标互斥。`ppt_flow doctor` 转发；仍 12 命令。  
`api_key`：共享 key **或** VENDORS 各项均可解析。

### C — 意图可发现

**D6 双表面：** 仪器 = `doctor --probe-vendors`；对话 = playbook `probe-image-channels`（intake → run-probe → show-report → confirm-write）。写 `.env`/lesson 必须确认。

**D7 不会念咒语也能到：**

1. `COMMANDS.md` 增 **环境 / 画画通道** 节（放在「旁路 / 迁移」与「迭代打磨」之间），直述+症状+选择说法 → `probe-image-channels`。
2. 症状时刻白话亮能力（doctor 图像红 / smoke 败 / 出图 API·502·全挂 / 用户抱怨画不出，且本 session 未 probe）：「要不要我逐家试一下你配的画画通道？」
3. 只要报告 → 可直跑 doctor；要写配置 → confirm-write。

**D8 长出图：** 后台 + 转述；失败 envelope+attempts 原样。

**D9 文档：** `.env.example`；`03-tool-selection`/BOOTSTRAP：VENDORS 优先、smoke vs probe、指向 COMMANDS；lesson `via` 含 `vendors`。

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 探针耗时 | submit-only；进度；intake 告知 |
| 顺序偏好 | confirm-write |
| 走不到 | D7 同义词 + 亮能力 |
| 只丢命令名 | 白话候选 |
| smoke+probe | USAGE 互斥 |

## Migration Plan

1. A（client）→ B（env-check + ppt_flow）→ C（playbook + COMMANDS + 入口文案）。
2. legacy `.env` 零改动。
3. Rollback：revert。

## Open Questions

无。
