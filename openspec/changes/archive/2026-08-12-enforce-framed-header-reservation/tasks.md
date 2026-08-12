## 1. Framed Contract Authority

- [x] 1.1 Clarify the declared `image2-request` Framed composition boundary so its `reserved_header` is exclusively local-overlay space and all provider-readable content, labels, and focal subjects belong in `body_safe`.
- [x] 1.2 Centralize the exact Framed-exclusive reservation instruction in the Framed adapter and validate its canonical compiled input, selected composition, workflow isolation, and absence of local-header transport fields before a raw plan can publish.
- [x] 1.3 Preserve the existing Complete Page Review as the only quality decision and state in the Framed playbook that visible provider encroachment into `reserved_header` requires its existing `repair` decision.

## 2. Regression Coverage

- [x] 2.1 Extend focused Framed lifecycle tests to prove the exact input binds the selected composition, reserves the header exclusively, preserves independently source-owned content, and changes the compiled-input digest.
- [x] 2.2 Add a negative Framed compiler-path test proving a weakened reservation clause fails before source/plan publication or provider submission, plus direct malformed compiled-input checks.
- [x] 2.3 Extend focused Pure and public CLI mock coverage to prove Pure receives no Framed reservation facts and the normal Framed plan/authorize/review control path remains intact without a provider call.
- [x] 2.4 Extend Complete Page Review lifecycle coverage to prove the existing `repair` decision withholds accepted evidence and returns the normal raw-rebuild action; no automated image-quality decision is introduced.

## 3. Verification And Specification Sync

- [x] 3.1 Run `openspec validate enforce-framed-header-reservation --strict --type change`, targeted Framed/Pure/review/CLI tests, `npm test`, and `git diff --check`; resolve failures.
- [x] 3.2 Sync the accepted `image-generation` delta to the main specification and rerun strict OpenSpec validation before archival.
