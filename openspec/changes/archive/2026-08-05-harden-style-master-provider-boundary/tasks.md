## 1. Shared Provider Boundary

- [x] 1.1 Update the shared Image2 credential resolution and doctor `image_base_url` check so Style Master, Page Authority raw generation, and normal Image2 readiness reject comma-separated `IMAGE2_BASE_URL` values before network work, while preserving one-endpoint normalization and existing exported-environment precedence. [style-master-generation, cli-surface, environment-check]
- [x] 1.2 Extract or extend the current Image2 response/task helpers so sync inline media and async task completion share bounded response classification without exposing provider bodies or credentials. [cli-surface]
- [x] 1.3 Apply one fixed 600,000 ms total deadline to current-v2 Style Master and Page Authority POST/task-poll operations, passing remaining-budget abort signals, preserving Page Authority idempotency/reconciliation, and preserving Style Master's no-durable-reconciliation boundary. [cli-surface]

## 2. Style Master Lifecycle

- [x] 2.1 Replace full-projection prompt serialization with a deterministic 4,000-byte provider brief built from authored intent and compact global visual semantics; retain full canonical projection hashing for plan identity and fail before plan/grant/provider work when the brief cannot fit. [style-master-generation]
- [x] 2.2 Change generated Style Master candidate validation to accept CRC-valid PNG bytes with positive native dimensions, preserve original bytes and dimensions in provenance, and classify received malformed/invalid media as a known failed attempt. [style-master-generation]
- [x] 2.3 Wire `style-master generate` to the same ordered scoped dotenv resolution as page raw and to the shared sync-or-async provider completion path, without persisting task IDs or adding retry/reconcile commands. [style-master-generation]
- [x] 2.4 Preserve the exact attempt CAS boundary: definite response failures terminalize as `failed`; response loss, abort, or exhausted deadline retain `submitted`/`unknown` and only the existing reasoned-abandonment hard-stop. [style-master-generation]

## 3. Public Diagnostics And Smoke Scope

- [x] 3.1 Update current Style Master and Page Authority producer diagnostics so malformed endpoint configuration, known received-response failures, and uncertain deadlines expose the existing bounded owner action without raw provider details or implicit retry/failover guidance. [cli-surface]
- [x] 3.2 Update `doctor --smoke` check evidence and successful global human conclusion to state connectivity-only evidence while preserving one minimal POST, the existing READY/JSON schema, and offline default behavior. [environment-check]

## 4. Focused Coverage

- [x] 4.1 Add Style Master unit coverage for bounded brief determinism, exclusion of projection digests, pre-grant overflow failure, native PNG acceptance, invalid PNG known failure, and preservation of the unknown attempt boundary. [style-master-generation]
- [x] 4.2 Add mock transport integration coverage for inline success, async task completion, terminal task failure, malformed response, submit abort, and shared total-deadline behavior; assert provider call counts and persisted lifecycle outcomes for both Style Master and page raw. [style-master-generation, cli-surface]
- [x] 4.3 Add CLI process coverage for deck-root/current-directory dotenv loading, comma-list endpoint rejection before Style Master and Page Authority fetches, and secret-safe diagnostic output. [style-master-generation, cli-surface]
- [x] 4.4 Add environment-check coverage proving a comma-list endpoint fails before any live probe and that successful smoke keeps one submit with qualified connectivity-only human and JSON evidence rather than Style Master production compatibility. [environment-check]

## 5. Validation

- [x] 5.1 Run the focused Style Master, provider-transport, CLI-process, and environment-check test files under their required Vitest configurations; fix regressions without real provider calls.
- [x] 5.2 Run the relevant regression suite and `openspec validate harden-style-master-provider-boundary --strict`; confirm no `deck_*` production artifact or `_generated/` file was used as a fixture or edited.
