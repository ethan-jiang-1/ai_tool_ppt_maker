---
stage: workflow/00-setup
---

# Local Runtime And Tools

Fresh HTML-first work requires the base doctor profile: supported Node/npm, project dependencies, exact Playwright and ECharts, paired Chromium, bundled Source Sans 3/Noto Sans SC fonts, and offline runtime smoke. Run `ppt_flow doctor` and repair the named local check before deck work.

Per-run source/config/catalog/overflow failures belong to `ppt_flow validate` or local preview, not credential setup. HTML create, preview, build, and local iteration never load provider credentials.

Image2 checks and live probes are optional legacy diagnostics only. Use them after a markerless deck has routed to `reference/legacy-image2-first-maintenance.md`; a successful probe is not page-generation authorization.

Before any live diagnostic, disclose the submit count and obtain explicit confirmation. `doctor --smoke` 提交 **1 次** to the first resolved vendor; `doctor --probe-vendors` 每家 **1 次**. Declining the probe leaves base HTML readiness unaffected.
