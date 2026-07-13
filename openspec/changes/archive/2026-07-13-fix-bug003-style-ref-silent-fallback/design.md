## Context

`generateOneImage` in `image_api_client.mjs` accepts an optional `styleReferencePath`. When provided, it attaches the style reference image as a base64 data URL in the API request body. When omitted (either `null` or `undefined`), the function proceeds without any visual style anchoring — and without any indication to the caller that this is happening.

This silent fallback was identified by BUG-003 as a framework-level gap (item 4 of 4): while the script-level fixes (items 1–3) were already applied to `_gen_agent.mjs`, the framework itself should make the absence of a style reference visible so that both production pipelines and scratch experiments have clear output about what's happening.

Existing callers and their style ref usage:

| Caller | `styleReferencePath` | Expected behavior after change |
|--------|---------------------|-------------------------------|
| `stage2_generate_images.mjs:167` | `style_master.jpg` path | No new log (ref IS provided) |
| `generate_style_master.mjs:131` | `null` (explicit) | Sees "no style reference" log |
| `_gen_agent.mjs` (scratch) | not passed (`undefined`) | Sees "no style reference" log |

## Goals / Non-Goals

**Goals:**
- Make the absence of a style reference visible in `generateOneImage` output
- Use the existing logging conventions of the function

**Non-Goals:**
- Change the API contract — `styleReferencePath` remains optional
- Warn or error — this is informational, not a warning
- Add a new parameter or configuration option
- Change behavior for callers that DO provide a style ref

## Decisions

### Decision 1: Log level — informational, not warning

**Rationale**: Omitting a style reference is legitimate in multiple scenarios (generating the style master itself, scratch experiments, testing). A warning would be noisy and imply the caller made a mistake. An informational log is transparent without being prescriptive.

### Decision 2: Placement — after the `if (styleReferencePath)` block, before the vendor loop

The function structure is:
```
1. skip-if-exists check (log: "Skip (exists)")
2. resolve vendors
3. build request body ← style ref is attached here if provided
4. vendor loop (logs: "Submit →", "Done:")
```

The new log belongs at step 3, in an `else` branch of the style ref check:
```js
if (styleReferencePath) {
  // ... existing ref attachment
} else {
  console.log(`  No style reference — generating without visual style anchoring`);
}
```

**Rationale**: Placing it here keeps the log close to the decision point and ensures it appears once per `generateOneImage` call, before any vendor-specific output.

### Decision 3: Message text

`"No style reference — generating without visual style anchoring"`

**Alternatives considered**:
- `"No style reference provided"` — too terse, doesn't explain the consequence
- `"WARNING: No style reference"` — implies a problem when there may not be one
- `"Generating without style_master anchoring"` — too specific to the deck use case; the function is general-purpose

### Decision 4: No new parameter — log unconditionally

**Alternatives considered**:
- Add a `quiet: true` option to suppress the log — over-engineering for a single line; the log is informational and harmless
- Gate the log behind an env var (e.g., `IMAGE2_VERBOSE`) — introduces hidden configuration surface; inconsistent with the rest of the function which logs unconditionally

**Rationale**: The function already logs unconditionally for skip, submit, retry, done, and failure. A single additional informational line follows the established pattern. Callers that don't want log output should redirect stdout, not configure individual log lines.

## Risks / Trade-offs

- **Extra log noise**: Callers that intentionally omit a style ref (e.g., `generate_style_master.mjs`) will see one extra line per call. Mitigation: the log is a single line, consistent with the existing logging density of the function, and carries useful information.
- **Test output**: Existing tests in `tests/test_image_generation.mjs` that call `generateOneImage` without a style ref will capture one additional stdout line. Vitest suppresses stdout for passing tests by default; no assertion changes needed. If any test asserts on exact stdout content, it will need updating — but current tests do not assert on log output.
