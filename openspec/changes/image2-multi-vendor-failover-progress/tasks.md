## 1. A — Runtime (`image-generation`)

- [x] 1.1 `resolveVendors` (D1) + thin compat wrappers in `image_api_client.mjs`
- [x] 1.2 Vendor-pair failover; `Mirror failed`; attempts summary; success trace (D2/D4)
- [x] 1.3 Submit+poll heartbeats; submit `MAX_WAIT_MS` abort (D3)
- [x] 1.4 Stage 2 `i/N` logs; envelope can carry attempts
- [x] 1.5 Tests in `tests/test_image_generation.mjs` for 1.1–1.3

## 2. B — Doctor (`environment-check`, `cli-surface`)

- [ ] 2.1 Static `api_key` / `image_base_url` ≡ VENDORS
- [ ] 2.2 `--smoke` first vendor; shared extract helpers (export if needed)
- [ ] 2.3 `--probe-vendors` full report + suggested order; mutual exclusion; no auto `.env`
- [ ] 2.4 `ppt_flow doctor` forwards both flags; help; still 12 commands
- [ ] 2.5 Tests in `tests/test_env_check.mjs`

## 3. C — Intent discovery (`playbook-execution`, docs)

- [ ] 3.1 `probe-image-channels.md` (intake → run-probe → show-report → confirm-write); report-only short path
- [ ] 3.2 `COMMANDS.md` **环境 / 画画通道** between 旁路/迁移 and 迭代打磨（直述+症状+选择）
- [ ] 3.3 BOOTSTRAP / `03-tool-selection`: VENDORS；smoke vs probe；症状时白话亮能力；长出图可观察注记
- [ ] 3.4 `.env.example` 三家行；style-master 不吞 client 进度日志

## 4. Regression

- [ ] 4.1 `npm test` green
- [ ] 4.2 Optional manual: symptom phrasing → probe；`doctor --probe-vendors` 人能读懂报告
