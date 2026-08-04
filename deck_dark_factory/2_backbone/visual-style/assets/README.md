# 视觉资产 (assets)

**这里放什么:**
- `asset-manifest.yaml` — 资产目录（SSOT），定义每个资产的 id、路径、类型、描述
- `svg/` — SVG 矢量资产
- `reference/` — PNG/JPG 参考图
- `icons/` — 图标集

**你做什么:** 添加资产文件到此目录，在 `asset-manifest.yaml` 注册，然后从 Page Authority Visual Brief 的已注册引用语义使用。
**这是可选基础设施:** 不需要资产时忽略此目录即可，管线在无 assets/ 时正常运作。
