# Runtime And Tools

Run `ppt_flow doctor --run-dir <run-dir> --operation framed-local-refresh`
before local Framed composition. This checks the local browser and font runtime
without requiring provider credentials.

Run `ppt_flow doctor --run-dir <run-dir> --operation raw-generation`
only when Page Authority raw work is planned. Readiness does not authorize a
provider submission; raw generation still requires the user-approved scope.

Use `npm test` for the bounded core tier. Select focused provider-free tests
for changed seams. Broad E2E, real-provider work, and image-aesthetic checks
are not routine verification.
