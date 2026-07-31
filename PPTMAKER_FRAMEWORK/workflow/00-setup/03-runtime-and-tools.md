# Runtime And Tools

Run `ppt_flow doctor --run-dir <run-dir> --operation framed-local-refresh`
before local Framed composition. This checks the local browser and font runtime
without requiring provider credentials.

Run `ppt_flow doctor --run-dir <run-dir> --operation raw-generation`
only when Page Authority raw work is planned. Readiness does not authorize a
provider submission; raw generation still requires the user-approved scope.

`doctor --smoke` 向第一个 resolved provider 提交 **1 次**；`doctor --probe-vendors` 每家 **1 次**提交到 resolved provider。先披露总 submit 数和可能成本，再取得明确确认，才可运行任一 live diagnostic。成功的 probe 不产生生产授权。

Use `npm test` for the bounded core tier. Select focused provider-free tests
for changed seams. Broad E2E, real-provider work, and image-aesthetic checks
are not routine verification.
