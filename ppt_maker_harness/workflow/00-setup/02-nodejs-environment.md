# Node.js 与本地 Framed Capture Runtime 环境

> **首次安装？** 请走 [BOOTSTRAP.md](../../BOOTSTRAP.md) Step 1。本文是 Node、Chromium、缓存和本地字体的详细参考。

> 替代 `02-python-environment.md`。ppt_maker_harness 生产管线只需要 Node.js。

## 你需要什么

| 组件 | 用途 | 安装责任 |
|------|------|----------|
| **Node.js 22.x / 24.x / 26.x** | 运行时；新安装推荐当前 LTS 24.x | 用户安装一次 |
| **npm** | 包管理，随 Node.js 提供 | 用户安装一次 |
| **Playwright 1.61.1** | Harness 固定的浏览器库 | repo 根运行 `npm install` |
| **配对 Chromium** | 本地 Framed capture 与离线 smoke | repo 根运行 `npm run setup:chromium` |
| **Source Sans 3 / Noto Sans SC WOFF2** | 固定 Latin 与简体中文 smoke 字体 | 已随 Harness 放在 `scripts/fonts/`，用户不安装 |

`package.json` 的 `>=22` 是最低版本表达；可执行 runtime 只支持 22、24、26 这三个 major。23、25 或其它未验证 major 不属于本 profile。

## 首次安装

在 repo 根（`package.json` 所在目录）运行：

```bash
npm install
npm run setup:chromium
```

第一条命令一次安装 `@napi-rs/canvas`、`pptxgenjs`、`commander` 和固定的 `playwright@1.61.1`。第二条命令调用这个 repo 内固定的 Playwright CLI，只安装与它配对的 Chromium。

Linux 或 CI 在明确允许安装系统依赖时可改用：

```bash
npm run setup:chromium:with-deps
```

`--with-deps` 可能调用系统包管理器并需要相应权限，不是普通 macOS/Windows 用户的默认命令。

## 浏览器缓存

默认安装和运行都使用 Playwright 的标准浏览器缓存。若机器或 CI 需要自定义位置，安装与之后每次 doctor/runtime 调用必须使用同一个 `PLAYWRIGHT_BROWSERS_PATH`：

```bash
PLAYWRIGHT_BROWSERS_PATH=/absolute/shared/cache npm run setup:chromium
PLAYWRIGHT_BROWSERS_PATH=/absolute/shared/cache node ppt_maker_harness/scripts/ppt_flow.mjs doctor
```

Windows PowerShell：

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = "D:\playwright-cache"
npm run setup:chromium
node ppt_maker_harness/scripts/ppt_flow.mjs doctor
```

CI 缓存 key 至少包含 Playwright 版本、操作系统和 CPU 架构。恢复浏览器缓存不能替代 Linux 系统依赖的安装或验证。

受限网络环境可以只在 `setup:chromium` 安装阶段按 Playwright 官方方式提供 `HTTPS_PROXY`、`PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT` 或 `PLAYWRIGHT_DOWNLOAD_HOST`。这些变量控制浏览器获取，不是 doctor/runtime 的联网配置。不要依赖它们让运行阶段临时下载缺失文件。

## 本地字体

Framed capture runtime 需要的 WOFF2 字体、CSS、完整 inventory、来源与许可证都随 Harness 位于：

```text
ppt_maker_harness/scripts/fonts/
```

用户不需要把字体安装到操作系统，也不需要在运行时联网下载。`doctor` 直接验证 Harness 内字体的文件完整性、固定双语字符覆盖和 Chromium 实际使用证据。若 Framed font diagnostic 失败，应恢复完整的 `ppt_maker_harness` 包，而不是安装系统字体。

## 统一验证入口

```bash
node ppt_maker_harness/scripts/ppt_flow.mjs doctor
```

默认 doctor 检查本地 base readiness，包括 Node、npm、依赖、配对 Chromium、Harness 内置字体及零网络 Framed capture smoke。它只检查和启动已经安装好的 Chromium，绝不运行 installer、下载浏览器或下载字体，也不回退到系统 Chrome/Edge 或系统字体。

如果 `chromium` 失败，运行 `npm run setup:chromium` 后再执行同一个 doctor。若输出 READY，即本地 runtime 可以开始使用。

## 可选 Image2 配置

Image2 不是默认 doctor 的要求。只有选择会远程生成图片的路径时，才在 repo 根或 deck 根的 `.env` 中配置：

```dotenv
IMAGE2_API_KEY=sk-你的key
IMAGE2_BASE_URL=https://你的-relay/v1
```

先用离线 presence 检查，不产生 provider submit：

```bash
node ppt_maker_harness/scripts/ppt_flow.mjs doctor --run-dir <run-dir> --operation raw-generation
```

任何 `--smoke` 或 `--probe-vendors` live probe 都会产生 provider submit，必须先披露次数并取得用户确认。完整契约见 `03-runtime-and-tools.md`。

管线会从调用目录向上寻找 `.env`；不需要每次重复设置。
