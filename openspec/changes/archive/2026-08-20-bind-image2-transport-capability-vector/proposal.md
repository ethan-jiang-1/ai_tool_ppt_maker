## Why

The confirmed Image2 provider profile binds route, model, and prompt budget.
It does not bind the HTTP transport vector, so `image2 generate` always POSTs
JSON to `/images/generations` at `2000x1125`. Vendors that require `edits`,
multipart, or another native size never reach a legal receipt chain. Scratch
PNG previews cannot become PPTX. That is a missing capability, not a restore.

Maintainer 2026-08-20 locked this as an enhancement: keep the existing
generations + JSON + `2000x1125` combo valid; add an explicit transport vector;
reject undeclared combos with zero remote calls; never name a vendor in schema;
never copy `_scratch/` into `_generated/` or delivery.

## What Changes

- `page-image-reference-generation` may declare a closed transport vector:
  `http_operation` (`generations` | `edits`), `encoding` (`json` | `multipart`),
  `width`/`height`/`dimension_multiple`, and `completion` (`sync` | `async-poll`).
  Omitted transport resolves to the current generations + JSON + `2000x1125` +
  `async-poll` default. Style Master text generation is unchanged.
- Only two declared combos are legal: `generations`+`json`, and `edits`+`multipart`.
  Any other pairing, unknown field, or size not divisible by `dimension_multiple`
  is a profile-source hard-stop before plan, grant, attempt, or fetch.
- Compiler, preflight, authorize, and generate bind the same resolved vector
  into the existing generation-profile digest. Changing the vector invalidates
  exact work through the existing rebuild path.
- Submit uses `${IMAGE2_BASE_URL}/images/${http_operation}`, the declared
  encoding and size, and the existing one-credential pair. `sync` does not poll;
  `async-poll` keeps today's same-invocation poll. Still one base URL, no
  failover list, no vendor name in schema.
- `_scratch/` PNG remains non-delivery. This change does not add a scratch-to-PPTX
  path (BUG-092 B stays suspended). Official generate → receipt → build is the
  A path.

Not in this change: prompt-budget metering (BUG-089), cursor rewind, v1 reset,
Packy-named fields, Style Master transport, changing Framed final 2000x1125
overlay contract.

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `run-bundle-management`: confirmed page-image operation may include the
  closed transport vector; pending seed stays null operations.
- `image-generation`: generation profile and submit bind that vector; undeclared
  combos never reach the network.
- `cli-surface`: Image2 generate still one credential/base-URL pair; the path
  suffix and encoding come from the bound vector, not a second endpoint.

## Impact

- Harness source: `provider_profile.mjs`, architecture capability snapshot,
  `command_support.mjs` Image2 submit, generation-profile projection, tests.
- Control owner: JS. MD Controllers unchanged.
- Run-bundle: additive optional YAML field; omitted transport stays compatible.
- Policies: `simple-reliable-control.md` (one vector, no second transport owner).
