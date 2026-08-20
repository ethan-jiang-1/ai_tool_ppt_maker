# How To Ask For Help

You do not need to know the PPT Maker Harness commands. Say what you are trying to
achieve, what you already have, and what feels wrong. The Agent chooses the
smallest safe next step; you retain ownership of content and important
decisions.

## Common Requests

| You can ask | The Agent first clarifies or checks | What you get | Your meaningful decision | Typical timing |
| --- | --- | --- | --- | --- |
| "Can you help me get set up?" | Local runtime and the part of the work you plan to do | A plain-language readiness result and the next repair, if needed | None for local checks | Short local work |
| "I want to make a presentation." | Topic, audience, source material, visual direction, and local foundation | A new workspace and the current creation handoff | Content and necessary creative choices | Your decision, then local work |
| "Please continue this presentation." | The exact local deck folder or its handoff card, then its current status | The one current next step | Only if the next step has a real review or remote cost boundary | Short inspection, then depends on the next step |
| "Change this wording." | The exact deck and what text should change | The smallest valid text-change path | Review of the changed content | Local work or a later owner decision |
| "Change how this page looks." | The exact deck, the visible goal, and which pages are affected | The appropriate visual-change path and a reviewable result | Any disclosed remote work and visual acceptance | Local work or provider-variable work |
| "Update the speaker notes." | The exact deck and the note changes | Updated notes and their normal delivery check | Review of the notes | Short local work |
| "Add, remove, reorder, or rethink pages." | The exact deck and the intended new structure | A preview of a clean next version before changes are published | Approval of the proposed structure | Human decision, then local work |
| "Keep this unpublished first version and redo the pages." | Confirm the folder is still only v1 and that no provider images or PPTX exist | The first version restored to an unpublished draft, then a new page plan as v1 | Confirm abandoning the current unpublished structure | Short local work |
| "Which image channel is working?" | Whether the Call Shape is already confirmed or still a candidate | Confirmed: `probe-image-channels` / `ppt_flow probe <run-dir>` connectivity report. Candidate: Image2 Lab playbook / Lab CLI. Empty `_lab/` does not block drawing when a confirmed Call Shape exists. | Live work needs an exact disclosed submit count and confirmation. Probe success is not generate authorization. | Local check or provider-variable work |
| "I am stuck" or "this failed." | The current error report or the symptom you can describe | A four-part plain-language answer: what happened, what it affects, what the Agent can mechanically do, and the one decision or confirmation needed from you | None unless that one action reaches a real decision or cost boundary | Short inspection |
| "I cannot find the presentation to continue." | A handoff card or an exact local path | The supported way to locate the intended run | Supply the exact local locator; the Agent will not guess | Short human/Agent exchange |
| "Can this system do something else?" | Whether the request fits an existing path | A clear answer, or a small named gap to discuss | Whether to start Harness-maintenance work | Conversation first |

## What Stays Safe

- An offline readiness result or a successful channel diagnostic does not grant
  permission to create paid work.
- For an existing presentation, the Agent asks for the exact local run rather
  than guessing from a name, timestamp, or a nearby rendered file.
- If the request is unclear or unsupported, the Agent explains the smallest
  missing extension and waits. It does not silently create maintenance work.
- A presentation's content, examples, claims, and final visual judgment remain
  yours. The Agent owns the bounded process needed to move the work forward.

## Agent Routing Reference

`playbook/` is the home of MD Controllers and their normative controller manifest.
Interpret the user's language conversationally, then hand it directly
to the current Controller or CLI owner:

- For a known exact run, obtain `state --json.workflow_inspection.primary_action`
  before selecting a Controller. When it reports the `production-protocol`
  `current-protocol-invalid` hard-stop, present the owner-issued
  `repair-current-protocol-identity` repair and stop; do not inspect dependent
  source content, choose a workflow, or offer an alternate owner. Otherwise,
  an explicit change enters the current
  [`classify-change` Controller](playbook/classify-change.md), which uses the
  current [change classifier](scripts/06-iteration/change-classifier.md); resume
  follows the reported primary action.
- If no exact run is known, use the `RUN_BUNDLE.md` / exact-path locator in
  [the Agent contract](charter/AGENT_CONTRACT.md). Never scan production
  folders or infer a latest run.
- New work hands off from local foundation and initialization to the existing
  [create-deck controller](playbook/create-deck.md). The controller retains
  lifecycle, evidence, and authorization decisions.
- New-deck authoring records Story Outline and Design Constraints before the
  version workflow is selected. The Agent then uses the current Visual Language
  registry to prepare and preview one page plan; canonical Page Source is written
  only after the Deck Author confirms that content and structure recommendation.
  This confirmation is not provider authorization or a persisted approval.
- Channel diagnostics: if the Call Shape is already confirmed, use
  [probe-image-channels](playbook/probe-image-channels.md) /
  `ppt_flow probe <run-dir>` (connectivity only, not generate authorization).
  If the question is which candidate Call Shape can retrieve a PNG, use
  [image2-lab](playbook/image2-lab.md) and
  `scripts/shared/image2/lab_cli.mjs`. Direct environment recovery is only for
  a pre-install or unavailable main entry. Empty `_lab/` does not block drawing
  when a confirmed or named-default Call Shape exists. Official page images
  stay on `image2 generate`, which does not read `_lab/`.
- Use a direct CLI owner only for its declared deterministic operation, such as
  `ppt_flow doctor` for exact-run readiness or `ppt_flow state` / `status` for
  observation. A direct CLI does not select a Controller path.
- An unpublished unique v1 that has never received provider grant, attempt,
  raw/final images, PPTX, or delivery may be abandoned through owner-issued
  `ppt_flow reset-unproduced-v1 <v1> --confirm-abandon`, then paginated again as
  v1. Any irreversible record still requires the existing vNext path.
- Shared verbs stay owner-scoped, never merged: `plan`, `authorize`, `generate`,
  `review`, and `accept` each belong to a distinct command owner — `image2` owns
  the receipt-bound raw lifecycle occurrence, `style-master` owns the candidate
  lifecycle occurrence. Each occurrence keeps its own effect class; the
  registered verb-collision table is the drift guard.
- For a current failure or a stuck request, follow the shared
  [Diagnostic Recovery Handoff](charter/AGENT_CONTRACT.md#diagnostic-recovery-handoff).
  It preserves the current producer action before any inspection, location, or
  recovery choice.
- A Route Gap is conversational and non-persistent. Name the smallest missing
  Controller or owner capability, then wait for an explicit maintenance request.

## Agent Verification Scope

- `core`: `npm test` and the compatible `ppt_flow test` command run the bounded
  protected core inventory; they are not full regression or release
  certification.
- `focused`: run one deliberately selected seam or process test while changing
  that boundary.
- `process`: run one selected real public-binary suite (`test_process_*`) under
  the process config; it is a distinct supported tier — a passing `core`,
  `focused`, or `sweep` run is never read as process coverage.
- `sweep`: run broader pure unit/integration sampling when a public change
  warrants it; it does not include process-level or live-provider work.
- `mock E2E`: run one selected journey through a fake external adapter when a
  public journey changed.
- `real E2E`: run only a selected live journey after separate explicit human
  authorization. It is never implied by core, focused, process, sweep, or
  mock E2E.
