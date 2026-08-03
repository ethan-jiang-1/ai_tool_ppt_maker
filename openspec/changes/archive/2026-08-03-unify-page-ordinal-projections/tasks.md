## 1. Ordinal Image Projection

- [x] 1.1 Add one shared Page Authority ordinal text/filename formatter and
  route target-v2 final manifest creation and validation through it, preserving
  the existing `NN_slideID.png` production contract.
- [x] 1.2 Update rebuildable raw image read/write paths to derive their
  `NN_slideID.png` name from the current ordered raw plan while retaining
  stable-ID keys in raw byte maps and accepted evidence.
- [x] 1.3 Update Pure and Framed Pilot image publishers to use complete-plan
  positions for their human-facing outputs without changing Pilot evidence
  schemas or hashes.

## 2. PPTX Ordinal Footer

- [x] 2.1 Add one fixed delivery-internal Page Authority footer primitive that
  formats and renders a small readable right-bottom ordinal without a config
  or opt-out surface.
- [x] 2.2 Apply the shared footer to target-v2 delivery using manifest
  positions and to bounded CURRENT assembly using entry order, while preserving
  final image bytes and delivery lineage.

## 3. Regression Coverage

- [x] 3.1 Add formatter/final-manifest tests for positions 1, 10, and 100,
  invalid projection inputs, and stable evidence fields that remain free of
  ordinal identity prefixes.
- [x] 3.2 Extend Pure and Framed workflow coverage for ordinal raw/Pilot
  output paths, including a Pilot subset whose position comes from the full
  plan and an unchanged-evidence/reorder projection assertion.
- [x] 3.3 Add target-v2 and bounded CURRENT delivery tests that inspect the
  completed PPTX XML for matching footer text and retain full-page image and
  notes behavior; visually inspect a generated deck through an available local
  renderer when present.

## 4. Verification And Closeout

- [x] 4.1 Run focused Page Authority tests, the relevant delivery/process
  suites, full repository verification, `openspec validate --strict`, and
  `git diff --check`; record any unavailable visual-renderer check.
  - 2026-08-02: focused artifact/raw-owner/Pure/Framed/delivery/process checks
    and `npm test` passed; strict validation and diff check passed. PPTX XML
    checks passed; `soffice` and `libreoffice` are unavailable locally.
- [x] 4.2 Sync accepted delta specs, archive the completed change, and update
  the Page Authority production-repair plan plus BUG-040/043/045 status
  without touching an unspecified run bundle.
