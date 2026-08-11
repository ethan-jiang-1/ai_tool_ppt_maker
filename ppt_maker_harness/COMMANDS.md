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
| "Which image channel is working?" | Whether you want an offline check or a live diagnostic | A channel-health report in plain language | Live diagnostics require an exact disclosed submit count and your confirmation | Local check or provider-variable work |
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

The [discovery catalog](playbook/intent-routes.json) is static validation
for the first safe handoff, not an execution mechanism. Interpret the user's
language conversationally, then follow these existing owners:

- For a known exact run, an explicit change enters the current
  [change classifier](scripts/06-iteration/change-classifier.md). Otherwise,
  resume from `state --json.workflow_inspection.primary_action`.
- If no exact run is known, use the `RUN_BUNDLE.md` / exact-path locator in
  [the Agent contract](charter/AGENT_CONTRACT.md). Never scan production
  folders or infer a latest run.
- New work hands off from local foundation and initialization to the existing
  [create-deck controller](playbook/create-deck.md). The controller retains
  lifecycle, evidence, and authorization decisions.
- Channel diagnostics use
  [probe-image-channels](playbook/probe-image-channels.md). Direct environment
  recovery is only for a pre-install or unavailable main entry.
- For a current failure or a stuck request, follow the shared
  [Diagnostic Recovery Handoff](charter/AGENT_CONTRACT.md#diagnostic-recovery-handoff).
  It preserves the current producer action before any inspection, location, or
  recovery choice.
- A Route Gap is conversational and non-persistent. Name the smallest missing
  catalog route, playbook, or owner capability, then wait for an explicit
  maintenance request.

## Agent Verification Scope

- `core`: `npm test` and the compatible `ppt_flow test` command run the bounded
  protected core inventory; they are not full regression or release
  certification.
- `focused`: run one deliberately selected seam or process test while changing
  that boundary.
- `sweep`: run broader pure unit/integration sampling when a public change
  warrants it; it does not include process-level or live-provider work.
- `mock E2E`: run one selected journey through a fake external adapter when a
  public journey changed.
- `real E2E`: run only a selected live journey after separate explicit human
  authorization. It is never implied by core, focused, sweep, or mock E2E.
