## 1. Framework fix

- [x] 1.1 Add `console.log` in `generateOneImage` when `styleReferencePath` is falsy, per design.md decision 2. Target: `PPTMAKER_FRAMEWORK/scripts/image_api_client.mjs`, line 530. Replace the closing `}` of the `if (styleReferencePath)` block with an `} else {` branch containing the log line. Exact edit: change line 530 from `  }` to `  } else {\n    console.log(\`  No style reference — generating without visual style anchoring\`);\n  }`. Capability: `image-generation`. No pipeline re-run needed — purely additive log line, no API contract change.
- [x] 1.2 Run `npm test` to verify no regressions. All existing tests must pass. The new log line is captured by vitest stdout suppression; no test assertions should need updating.

## 2. Bug report archive

- [x] 2.1 Edit `_backlog/bugs/BUG-003-model-sheet-pollutes-style-master.md`: append a `## 解决` section with date 2026-07-13, noting (a) items 1–3 were already resolved in `_gen_agent.mjs` before this change, (b) item 4 is resolved by this change `fix-bug003-style-ref-silent-fallback`. Then `git mv` to `_backlog/_done/_fixed_bugs/BUG-013-model-sheet-pollutes-style-master.md`. **Must rename to BUG-013** — `_done/_fixed_bugs/` already contains an unrelated BUG-003 (`ppt-flow-frozen-style-presets-sort`), and the next available ID in that directory is BUG-013 (BUG-001 through BUG-012 are occupied).
- [x] 2.2 Update README indices per `_backlog/bugs/README.md` ritual: (a) `_backlog/_done/_fixed_bugs/README.md` — add BUG-013 row to table, update "Next available bug ID" to BUG-014; (b) `_backlog/bugs/README.md` — update "Next available bug ID" to BUG-014; (c) `_backlog/_done/README.md` — update `_fixed_bugs/` row: count 7→13, Next ID BUG-008→BUG-014 (this count was stale before our change; fix it now).
