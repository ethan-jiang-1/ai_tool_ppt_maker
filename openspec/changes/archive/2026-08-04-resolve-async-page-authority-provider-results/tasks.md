## 1. Async Provider Result Resolution

- [x] 1.1 Extend the selected Page Authority provider-result adapter to detect
  a stable async task identifier while preserving the synchronous inline-PNG
  path. Capability: `image-generation`.
- [x] 1.2 Implement bounded same-credential task polling and normalize the
  verified completed nested inline-byte result into the existing exact PNG
  validation path. Do not add durable task state, a CLI flag, a background
  worker, a retry path, or provider failover.
- [x] 1.3 Map terminal task failures and poll HTTP failures to existing
  secret-safe `known_failure` facts; map poll interruption and timeout to the
  existing unresolved/unknown lifecycle without exposing task or response data.
- [x] 1.4 At the direct `image2 generate` remote boundary, load deck-root then
  cwd dotenv sources as fill-only defaults and resolve credentials before
  invoking the progressive raw owner. Pass the one resolved pair to the
  submit/poll factory; unavailable credentials must leave no new claim or
  submitted attempt. Capability: `image-generation`.

## 2. Regression Coverage

- [x] 2.1 Add focused adapter tests for nested task-ID submit, pending-to-
  completed async PNG success, and unchanged synchronous inline-PNG success.
  Capability: `image-generation`.
- [x] 2.2 Add focused negative tests for terminal async failure, missing or
  invalid completed media, poll HTTP failure, and interrupted/timeout polling;
  assert the progressive owner preserves the correct known/unknown outcome and
  does not create a replacement authorization or wrong-owner state write.
- [x] 2.3 Exercise the direct CLI surface with async fixtures and assert it
  keeps prompts, credentials, task IDs, response bodies, headers, image bytes,
  and data URLs out of normal and failure output.
- [x] 2.4 Add direct-process coverage that a cwd dotenv enables an authorized
  generate with no inherited Image2 values, and that absent credentials fail
  secret-safely with zero provider calls and no owner-record mutation.
  Capability: `image-generation`.

## 3. Verification And Recovery

- [x] 3.1 Run the focused Page Authority and CLI suites, then `npm test`,
  `openspec validate resolve-async-page-authority-provider-results --strict`,
  and `git diff --check`.
- [x] 3.2 Re-run the focused Page Authority and direct CLI suites, then
  `npm test`, strict OpenSpec validation, and `git diff --check` after the
  credential-preflight implementation.
- [x] 3.3 After framework verification, resume the user-specified v7 only
  through its current owner-issued successor Pilot action; do not alter
  `_generated/`, state, receipts, grants, or past attempts by hand.
  Status 2026-08-03: the separate immutable-history owner repair now permits
  legal recovery. Generation 8 and the first generation 9 item reached
  credential resolution only after a submitted record had been persisted, so
  their exact reconciliation records do not evidence a provider POST. The
  owner now requires the current successor scope and grant. On 2026-08-03 the
  repaired direct g9 `NewPart` invocation reached the provider and received a
  PNG, but its `2048x1136` media was terminalized against an obsolete
  `2000x1125` response-size assumption; it created no raw materialization.
  The separate active `align-page-authority-native-media-contract` change now
  retains the proven request parameter while establishing the native response
  contract. Its framework verification is complete (focused suites, process
  diagnostics 12/12, sweep 362/362, core verifier, strict validations, and
  whitespace check). On 2026-08-03 the owner created fresh Pure plan
  `a905c2ffd916b25f308ed6764c43eecdbbdda568cd14f7374e4154c6a15a0f5a`,
  with 25 unsubmitted items and inspection projection
  `a2550f077deb2e572cd07288ba059c8faf4af4771cdd91d739d83cd1143009a3`.
  Its owner-created Pilot batch is
  `271616afcb1b9889ec251d02b75cc49c75f5dd5c4f41e63c702082db9792f9b2`
  for `InfoRev`, `NewPart`, and `TwinChn`, with a maximum of 3 submissions,
  and issued new grant
  `e70588fb8f7ba6ddc94f1da087f3add32ac08e6faed8f31eab1ebb6aef7f2ccd`.
  Its first single-item generate, `InfoRev`, succeeded and materialized with
  provenance `247dfedcb3248677d2ed7244959941e7effd4362ab50a7ca2438fbf83e450880`.
  Its second, `NewPart`, also succeeded and materialized with provenance
  `8e12043b91c7ddb7ab30b3210d253d0ad405d13af04f0b51881d188f96876ff9`.
  `TwinChn` then succeeded as the third Pilot item, completing the batch with
  3/25 materialized and no unresolved outcome. Pilot review evidence
  `9635c5e0032eb8fd85a9eb2f8bd348ad881a20d5b2cd32b5a49430df6c56fd34` is current.
  Owner-published Pilot PNGs were visually checked as complete and readable.
  The Pilot was accepted with `proceed` as
  `8f0556716cea04adbbc0e045de095aae83f2ae97aa6e360f875cd22e0a7f795e`.
  The owner then created exact 22-item expansion batch
  `8b17d792f3d9d1762b0f4f594a77847d23e660941d4d230fb5bee78a7f6c5ef2`.
  Its new grant is
  `702b355374da8412789ee2ae3941d2d93ce060f70f417b81e13abb71df98bf15`.
  That batch and the accepted Pilot now total 25/25 materialized with no
  `known_failure` or `unknown`. Complete raw review evidence is
  `f426bd07295b6763ac8fe1d86c5eda7dc7db28abf67166ae5bed0c158b160a69`.
  Native-resolution visual review of dense pages `03_WhyCode`, `19_FourLyr`,
  `21_MaerAI`, and `23_MeasNot` found complete canvases, readable content, and
  no crop, blank-media, or obvious distortion defect. Owner `proceed` then
  accepted the raw review (receipt
  `d7853817fb86d0c7e7c721f1ea1e67911d337894bcedffe96b63877fccb08464`,
  accepted raw evidence
  `c0bd7393e4c70f061cff3916bcebb10862eb96b44ae225f6532c19eca27d206e`).
  Official `build` completed Pure finalization and delivery assembly at
  `_generated/page_authority_image2/final/deck.pptx`. Final verification then
  confirmed 25/25 accepted raw-to-final byte equality, 25/25 ordered PPTX-media
  equality, 25 notes, ZIP/layout validity, and a complete final contact-sheet
  visual review. Task 3.3 is complete and this change is ready to archive.
  The old g9 grant is immutable evidence and must not be reused.
