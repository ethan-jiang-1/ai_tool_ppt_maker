## 1. Per-package walk-up deps resolution

- [x] 1.1 Add shared `walkUpDirs` + `findPackageInAncestorNodeModules` in `env-check.mjs` (export for tests); refactor `.env` loading to use `walkUpDirs` (behavior-preserving)
- [x] 1.2 Change `checkNpmPackages(start = cwd)` to per-package upward search (do **not** stop at first empty/incomplete `node_modules`); drop unused cwd-only `package.json` dead binding
- [x] 1.3 Optionally include resolved `node_modules` path in ok `detail`

## 2. Tests + backlog

- [x] 2.1 Unit tests: parent stubs → ok; isolated → fail; nm at start → ok; **empty local nm + parent packages → ok**
- [x] 2.2 `npm test` and `npm run test:e2e` both green
- [x] 2.3 `git mv` BUG-006 → `_done/_fixed_bugs/`; update the three README indexes (Next ID stays consistent with BUG-007 active numbering)
- [x] 2.4 Confirm design Acceptance; archive syncs `environment-check` (incl. Purpose wording if still says “all declared dependencies”)
