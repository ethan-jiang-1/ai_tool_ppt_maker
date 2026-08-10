## Why

BUG-065: 内容寻址的**物理落盘**目录/文件名使用完整 64 位 SHA（Style Master plan 根、progressive raw plans/batches/materializations/attempts/complete-reviews、以及 `review/complete-page`/`review/pilot` 根），导致磁盘路径又长又难读。人类导航已用 `_generated/nav/` 的 8 字符短引用解决（BUG-058/063），但**物理存储层的长目录名原样保留**——那是 BUG-063 明确 defer 的部分。用户明确要求：内部身份保留全哈希，**磁盘上的文件名/目录名一律只保留前 8 个字符**，pure 与 framed 都要覆盖。

## What Changes

- 内容寻址存储层（progressive raw store + style master store）的**物理目录/文件名**改为哈希前 8 字符；完整 SHA 仍作为内部身份（state / receipt / JSON / 内存不变）。
- 引入确定性短名推导：`hash.slice(0, 8)`；同一父目录发生 8 字符前缀碰撞时失败并保留两份记录，绝不静默覆盖、延长名称或扫描猜测。
- lookup 按完整 SHA 先解析 8 位短名并验证记录；仅在短名缺失或不匹配时回退至既有 64-hex 名称并同样验证，兼容逐 bundle 迁移。
- 新增既有受支持 `page-image-workflow-v1` bundle 的迁移路径：把已存在的 64-hex 目录/文件重命名为短名，不破坏 Pure/Framed 的既有收据链与 evidence 字节定位；不为历史 v2 建立转换、兼容或迁移路径。
- 迁移是 Agent-owned 的非公开 owner operation：`migrateCurrentRunContentAddresses({ runDir })` 只接受一个 exact run，并在读取 owner artifact 前复用 current-workflow inspection 进行身份判定；它不是 `ppt_flow` 或既有 `image2` / `style-master` 的 CLI 子命令。
- 覆盖 `plans/`、`batches/`、`materializations/`、`attempts/`、`accepted-evidence/`、`complete-reviews/`、`review/complete-page/`、`review/pilot/` 与内容寻址 `.lock` 文件等所有 `<hash>` 命名点，Pure/Framed 共用同一路径层。固定 `candidate-NNN`、slide ID 和语义锁名不是 SHA 名称，不在本 change 中改写。

## Capabilities

### New Capabilities
- （无新能力）

### Modified Capabilities
- `run-bundle-layout`: 内容寻址不可变 owner 根（Style Master / progressive page-production 迭代存储）的物理目录/文件名从完整 64 位 SHA 改为前 8 字符短名；完整 SHA 仍是内容身份与记录主键。规范中 "SHA-256 directory" 的表述相应更新为"短名目录 + 内部全哈希身份"。

## Impact

- 代码：`scripts/shared/image2/page_image_progressive_store.mjs`、`scripts/shared/image2/style_master_store.mjs`、`scripts/shared/image2/page_image_complete_page_review.mjs` 的路径 builder、writer 与 lookup；相关枚举/扫描读取点（`plans_root` 目录遍历）。
- 兼容：新增仅适用于一个 exact current v1 run 的迁移 owner 重命名既有 64-hex 路径；一个 deck 含有多个 current v1 version 时，Agent 必须对每个 exact run 显式调用。lookup 兼容两种命名，避免破坏已交付 bundle 的收据链。历史 v2 保持 `unsupported-protocol/export` hard-stop。
- 影响面：所有使用 content-addressed 存储的 deck（pure + framed），以及 `_generated/nav/` 短引用的物理一致化。
