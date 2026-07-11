## Context

标准布局：

```text
repo/                     ← package.json + node_modules（npm install 一次）
├── PPTMAKER_FRAMEWORK/
└── deck_foo/
    └── .env              ← OPENAI_API_KEY
```

今日 `env-check.mjs`：

| 检查 | 起点 | 向上？ |
|------|------|--------|
| `.env` | `cwd` | 是 |
| deps | `cwd` | **否** |
| fonts / stage2 | `__dirname` | n/a |

真实管线 `import` 会从加载文件向上解析到 repo 根 `node_modules`，故从 deck 跑时 deps ✗ 是 **误报**。

`pkgPath = join(cwd, 'package.json')` 已计算但 **未使用**；包列表是硬编码三件套（`@napi-rs/canvas` / `pptxgenjs` / `commander`），与现网一致——本 change 不改为「读 package.json 全量 deps」。

## Goals / Non-Goals

**Goals:**

1. 从 `deck_*/` cwd 跑 doctor：在 repo 根已 `npm install` 且 deck `.env` 有 key 时，deps 与 api_key 可同时 ✓
2. deps 与 `.env` 共用 `walkUpDirs`；deps 按包向上（空本地 nm 不挡父级）
3. 真缺包时仍 fail，fix 仍指向在 **project root** `npm install`

**Non-Goals:**

- 从 repo 根向下搜索多个 deck 的 `.env`
- 把依赖检查改成动态读取 `package.json` dependencies 全表
- 放宽 api_key / stage2 等其它硬门
- playbook / COMMANDS 探索入口（另 change）

## Decisions

### D1 — 修复面：按包向上 walk-up（对齐 Node，而非「停在第一个 node_modules」）

`checkNpmPackages` 从 `process.cwd()`（可注入 `start`）向上遍历祖先。对**每一个**硬依赖包，在某一祖先下若存在：

`join(ancestor, 'node_modules', ...pkg.split('/'))`

则该包为 `ok`。

**禁止**「找到第一个 `node_modules` 目录就停、缺包就整组 fail」——那与 Node 解析不一致：本地若有空/残缺 `node_modules`，Node 仍会继续向父级找包；停在第一层会制造新的 false negative。

标准 BUG-006 布局（deck 无 nm、根有完整 nm）是该算法的特例，自然通过。

### D2 — 共享 `walkUpDirs(start)` 辅助

```text
function* walkUpDirs(start = process.cwd()) {
  for (let p = resolve(start); ; p = dirname(p)) {
    yield p;
    const parent = dirname(p);
    if (parent === p) break;
  }
}
```

- `.env` 加载：对 `walkUpDirs()` 找首个含 `.env` 的目录（行为与今日等价）
- deps：对每个包在 `walkUpDirs()` 上找首个命中的 `node_modules/<pkg>`

禁止两处各写一套 for 循环。

### D3 — 不用 `createRequire` 作为主路径（可作补充说明）

`createRequire(import.meta.url).resolve(pkg)` 从 **脚本文件**（`PPTMAKER_FRAMEWORK/scripts/`）向上解析，对「框架脚本能否 import」很准，且不依赖 cwd。

但：

- 与 `.env` 的 cwd 基准仍不一致（doctor 文档强调「从 deck 或根跑、cwd 向上找 .env」）
- 本 bug 的契约探针是「同一 doctor 内基准一致」

故 **主修复 = cwd 按包 walk-up**。detail 可选记录命中的 `node_modules` 绝对路径。

### D4 — `package.json` 未使用变量

删除死变量，或仅在 fail 的 `fix` 中提示「在含 package.json 的项目根执行 npm install」。不引入「必须先找到 package.json 才查 deps」——避免「有 node_modules 无 package.json」的边角误伤；标准布局两者同目录。

### D5 — 报告文案

成功时 `detail` 可为 `installed` 或 `installed (via …/node_modules)`（可选，不强制冗长）。  
失败时 `fix` 保持：`Run npm install in the project root.`（可注明「向上未找到该包」）。

### D6 — Spec 边界

只改 `environment-check`。不改 `cli-surface`（doctor 只是委托）。  
archive sync 时顺带把 main Purpose 里「all declared dependencies」收成与硬编码三件套一致（今日实现本就不是读 `package.json` 全表）。

### D7 — 测试与可测性

已有 `export { loadDotenv }` 先例。本 change 再导出（或等价可测）：

- `walkUpDirs(start)`
- `findPackageInAncestorNodeModules(pkg, start = process.cwd())` → 命中的 `node_modules` 绝对路径或 `null`
- `checkNpmPackages(start = process.cwd())` 接受可选 start，便于单测不 spawn 整进程

| 用例 | 断言 |
|------|------|
| parent 有三包桩 + start=child | 三包 `ok` |
| 孤立目录无祖先命中 | 三包 `fail` |
| start 自身有完整 nm | 三包 `ok` |
| start 有**空** `node_modules`、parent 有完整三包 | 三包仍 `ok`（不因空 nm 停步） |
| 现有 text/json/nodejs/stage2 | 仍绿 |

`npm test` **与** `npm run test:e2e` 均跑（e2e 无直接耦合，作回归卫生）。

### D8 — Acceptance

1. Fixture：repo 根有三包目录桩，deck 子目录为 start → 三包 `ok`
2. 无任何祖先命中包路径 → 三包 `fail`
3. 空本地 `node_modules` + 父级完整包 → 仍 `ok`
4. `.env` 加载行为与改前等价（仍向上找）
5. `npm test` + `test:e2e` 绿；BUG-006 归档

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 误命中无关祖先的同名包目录 | 与 Node 一致；标准布局足够；不扩大到真 `import` |
| 只建空目录桩、不验证包可 import | 与今日 `existsSync` 语义一致；不扩大范围 |
| 有人期望从根自动读 deck `.env` | Non-Goal；BOOTSTRAP 已要求从 deck 跑或放好 `.env` |

## Migration Plan

纯逻辑修复，无数据迁移。Rollback = 还原 `env-check.mjs`。

## Open Questions

_无（D1–D8 已关闭）。_
