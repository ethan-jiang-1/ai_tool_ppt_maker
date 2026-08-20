# Runtime And Tools

Run `ppt_flow preflight <run-dir> --operation framed-local-refresh`
before local Framed composition. This checks the local browser and font runtime
without requiring provider credentials.

Run `ppt_flow preflight <run-dir> --operation raw-generation`
only when Page Image raw work is planned. Readiness does not authorize a
provider submission; raw generation still requires the user-approved scope.

`ppt_flow probe <run-dir>` 对已确认 Call Shape 恰好提交 **1 次**。未确认的候选发现走 Image2 Lab，不是 vendor walk。先披露 submit 数和可能成本，再取得明确确认，才可运行 live diagnostic。成功的 probe 或 Lab trial 不产生生产授权。

Use `npm test` or the compatible `ppt_flow test` command for the bounded
`core` tier; it is not full regression or release certification. Use `focused`
tests for one changed seam, `sweep` for broader pure unit/integration sampling,
and `mock E2E` for one selected journey through a fake external adapter. `real
E2E` is a selected live journey and requires separate explicit human
authorization. Core, focused, sweep, and mock E2E never imply provider work.
