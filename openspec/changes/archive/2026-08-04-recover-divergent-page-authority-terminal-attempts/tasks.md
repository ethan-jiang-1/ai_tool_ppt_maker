## 1. Direct-Record Regression Coverage

- [x] 1.1 Add a focused progressive raw-owner fixture for one submitted parent with exactly one childless `known_failure` and one childless `unknown`, followed by a newer unresolved attempt; assert read-only evaluation exposes only the newer exact reconciliation action and leaves immutable records unchanged. Capability: `image-generation`.
- [x] 1.2 Add a focused unsafe-neighbor regression for a divergent branch containing `succeeded` plus `unknown` (or another forbidden descendant); assert the existing attempt-history hard-stop remains in force with no provider submission or wrong-owner mutation. Capability: `image-generation`.
- [x] 1.3 Exercise the workflow-inspection projection for the accepted pair and assert it reports the same owner-issued reconciliation action without a provider call. Capability: `image-generation`.

## 2. Effective Terminal Projection

- [x] 2.1 Update the progressive raw direct-record evaluator to normalize only the validated direct sibling pair of `known_failure` and `unknown`, retaining the `known_failure` record as the sole effective terminal outcome while preserving all immutable records. Capability: `image-generation`.
- [x] 2.2 Preserve strict rejection for every other branch, including success conflicts, nonterminal children, descendants, malformed bindings, cycles, and additional siblings; do not add a CLI repair route, retry, lookup, durable state, or migration. Capability: `image-generation`.

## 3. Verification And v7 Recovery

- [x] 3.1 Run the focused raw-owner and workflow-inspection regressions, repository test suite, strict OpenSpec validation, and diff whitespace check.
- [x] 3.2 Re-run the user-specified v7 only through the existing owner: reconcile the persisted generation-8 unresolved attempt, then perform only the resulting owner-issued action; do not hand-edit `_generated/`, state, receipts, grants, or attempts.
  Status 2026-08-03: reconciliation and the narrow read-time projection are complete. A later real provider
  result established that the active `align-page-authority-native-media-contract` repair must first replace
  the obsolete v7 media profile. Its framework verification is complete, and
  its zero-remote owner replan issued Pure plan
  `a905c2ffd916b25f308ed6764c43eecdbbdda568cd14f7374e4154c6a15a0f5a`
  with all 25 items unsubmitted. That owner then created Pilot batch
  `271616afcb1b9889ec251d02b75cc49c75f5dd5c4f41e63c702082db9792f9b2`
  for `InfoRev`, `NewPart`, and `TwinChn`, then issued grant
  `e70588fb8f7ba6ddc94f1da087f3add32ac08e6faed8f31eab1ebb6aef7f2ccd`.
  Its three new generations, `InfoRev`, `NewPart`, and `TwinChn`, all succeeded
  and materialized. The historical `TwinChn` terminal pair remains immutable;
  Pilot review evidence
  `9635c5e0032eb8fd85a9eb2f8bd348ad881a20d5b2cd32b5a49430df6c56fd34` is current.
  The `TwinChn` review PNG was visually checked as complete, readable, and
  structurally intact. The batch was accepted with `proceed` as
  `8f0556716cea04adbbc0e045de095aae83f2ae97aa6e360f875cd22e0a7f795e`.
  The owner then created 22-item expansion batch
  `8b17d792f3d9d1762b0f4f594a77847d23e660941d4d230fb5bee78a7f6c5ef2`.
  Its new grant is
  `702b355374da8412789ee2ae3941d2d93ce060f70f417b81e13abb71df98bf15`.
  Its new one-at-a-time generation completed all 25 v7 items successfully.
  Complete raw review evidence is
  `f426bd07295b6763ac8fe1d86c5eda7dc7db28abf67166ae5bed0c158b160a69`.
  Dense raw pages `03_WhyCode`, `19_FourLyr`, `21_MaerAI`, and `23_MeasNot`
  were visually inspected at native resolution and are complete/readable with
  no crop, blank-media, or obvious distortion defect. Owner `proceed` formally
  accepted the raw review (receipt
  `d7853817fb86d0c7e7c721f1ea1e67911d337894bcedffe96b63877fccb08464`,
  accepted raw evidence
  `c0bd7393e4c70f061cff3916bcebb10862eb96b44ae225f6532c19eca27d206e`).
  Official `build` completed Pure finalization and delivery assembly at
  `_generated/page_authority_image2/final/deck.pptx`. Final verification
  confirmed 25/25 accepted raw-to-final byte equality, 25/25 ordered PPTX-media
  equality, 25 notes, ZIP/layout validity, and a complete final contact-sheet
  visual review. This task is complete; the old g9 grant remains immutable
  evidence only.
- [x] 3.3 Synchronize the specified Page Authority backlog plan with the new repair's status, real v7 recovery facts, verification evidence, and final closure state.
  Status 2026-08-03: synchronized through the native-media evidence, the
  separate active repair, fresh owner plan, Pilot batch, its three-submit grant,
  its three successful materializations, Pilot review evidence, accepted Pilot,
  successful 22-item expansion, complete raw review evidence, and the
  four-page native-resolution visual review, formal `proceed` acceptance,
  successful Pure final/delivery assembly, and all final receipt/PPTX/visual
  verification. The backlog records the final closure evidence; this change is
  ready to archive.
