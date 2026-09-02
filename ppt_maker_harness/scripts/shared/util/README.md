# shared/util — 通用工具函数

**这里放什么:** 跨模块共享的纯工具函数，消除重复定义。只放无副作用的纯函数——不导入业务模块，不使用 `node:fs`/`node:path` 等 I/O 模块。

**放什么:**
- `state_helpers.mjs` — 状态模块间的通用工具函数（`deepClone`, `nowIso`, `stableStringify` 等）
- `byte_helpers.mjs` — 字节级工具（`sha256` 等，或直接使用 `../identity/byte_hash.mjs`）

**不放什么:**
- 业务逻辑（→ 对应 capability 目录）
- 状态管理（→ `shared/state/`）
- CLI 工具（→ `shared/cli/`）