## 1. Constitution + bundle layout（`_learning/` 必须指定这件事儿）

- [x] 1.1 `CONSTITUTION.md`：声明 `_learning/` **唯一职责**（本 deck 操作中试出的非密钥经验 / 先读再猜）；与 `.env` / `_state` 对照；树快照旁注不得只写目录名
- [x] 1.2 `bundle_layout.mjs`：`LEARNING_DIR` + `LEARNING_DIR_README` 常量（仿 `STATE_DIR_README`：这里放什么 / 不放什么 / 谁读写 / `image2-proven.yaml`）；`renderTree` 旁注职责；init 种子 README；structure 允许；legacy 缺席不单独 fail；`selfCheck` 要求树含 `_learning`
- [x] 1.3 deck 根 README 模板列出 `_learning/` **并写职责**；`deck-guide` / `template-deck-guide` 若提及，放在「操作经验」语境，**禁止**塞进 `_state` 进度段

## 2. Image2 凭据 + BUG-008

- [x] 2.1 `image_api_client.mjs`：IMAGE2 resolve/bridge；文件头
- [x] 2.2 BUG-008：`unwrapDataRecord`；submit/poll 数组包络
- [x] 2.3 `unified_pipeline.mjs`：合并重复 bridge
- [x] 2.4 `env-check.mjs`：key + fail URL；IMAGE2 文案
- [x] 2.5 `.env.example` = IMAGE2_* Copy Deck

## 3. MD 冒烟 + 落点（写清：密钥→`.env`；经验→`_learning/`）

- [x] 3.1 `03-tool-selection.md` = SSOT（变量 + 多组合冒烟 + 落点时**点名** `_learning/` 职责 + `image2-proven.yaml` 字段）
- [x] 3.2 `BOOTSTRAP.md`：凭据 + 冒烟 + 先读 `_learning`（写明是操作经验面）；链 SSOT
- [x] 3.3 扫清 OPENAI 假象 / URL「可选」：`00-zero-to-ready`、`02-nodejs-environment`、`AGENTS`、`scripts/README`、根 `README`；`openspec/config.yaml` 仅当仍写死旧凭据名时改
- [x] 3.4 `_state` README 一句：操作经验在 `_learning/`（点名职责；不把 learning 塞进 state）

## 4. Tests + backlog

- [x] 4.1 IMAGE2 resolve + 别名 + 无 URL 抛错
- [x] 4.2 BUG-008 数组 submit + 对象回归
- [x] 4.3 env-check 无 URL fail；init 后 `_learning/README.md` **含「这里放什么」**（或等价目的句）
- [x] 4.4 `npm test`；D11 Acceptance
- [x] 4.5 归档 BUG-008
- [x] 4.6 archive 时 sync：framework-charter、run-bundle-management、environment-check、image-generation、style-master-generation
