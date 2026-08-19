# BUG-078: style-master inspect has inconsistent JSON CLI behavior

> Severity: P3 | Found: 2026-08-19 | Status: active

## Symptoms

`ppt_flow style-master inspect <run-dir>` emits a JSON object directly, but the
same command rejects the otherwise expected `--json` option with a usage error.
This makes the command surface inconsistent with `status`, `state`, and other
machine-readable CLI paths.

## Root cause

The style-master inspect command has a fixed JSON-like renderer but no declared
JSON output option in its Commander surface or command contract.

## Reproduction

```text
node ppt_maker_harness/scripts/ppt_flow.mjs style-master inspect deck_x/3_versions/v1 --json
```

The command exits with `USAGE`, while omitting `--json` prints a JSON object.

## Fix association

Choose one explicit contract: add `--json` and the shared command envelope, or
switch the default to human-readable output and reserve JSON for `--json`.
Document the selected behavior and add a direct CLI regression test.
