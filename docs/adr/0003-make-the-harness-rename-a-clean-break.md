# Make The Harness Rename A Clean Break

## Status: Accepted

The repository is pre-release, so the replacement of `PPTMAKER_FRAMEWORK/` with `ppt_maker_harness/` makes a clean break. The renamed Harness emits only `pptmaker-run-bundle-v2`; it provides no old-root alias or symlink, v1 manifest reader, or automatic Run Bundle migration. Existing production data remains untouched, but it is not a supported input to the renamed Harness.

The v2 Run Bundle handoff has exactly `schema`, `deck_root`, `harness_root`, and `harness_relation`. It does not add a separate `harness_id`.

The source contents move to `ppt_maker_harness/`; that directory is the only Harness source root after the change. The former pathname does not remain as a duplicate tree, empty shell, or symlink.

An active schema identifier that names the former Framework becomes a `harness` identifier with an incremented version. The `pptmaker` project namespace stays unchanged.
