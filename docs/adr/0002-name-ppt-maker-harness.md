# Name The Reusable PPT Production System PPT Maker Harness

Status: Accepted

The reusable methodology, control surfaces, and production tools are named PPT Maker Harness, with `ppt_maker_harness/` as the canonical root. A Run Bundle remains a separately owned workspace for one Deck. The name describes a controlled Agent production environment rather than a generic framework; `PPTMAKER_FRAMEWORK/` is the former pathname.

The naming decision applies to every active source, test, CLI, main-spec, and current-document reference that names the reusable production system. The migration is a semantic replacement of those owner references, not a blind replacement of unrelated generic language.

`ppt_flow`, `PPTMAKER_*`, and `pptmaker-*` remain the project and protocol namespace. They do not change merely because the reusable system is now called a Harness.

The npm package name is `pptmaker-harness`.

Archived OpenSpec changes are outside this rename. Active `openspec/specs/` is the normative Harness-maintenance contract and migrates with the Harness vocabulary; guidance, implementation, and tests conform to it.

The active Harness-owned OpenSpec capabilities are `harness-charter`, `harness-directory-layout`, and `harness-script-layout`; their former `framework-*` capability IDs are retired with the rename.
