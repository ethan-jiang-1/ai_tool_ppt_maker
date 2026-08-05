---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: pure
---

# The AI Dark Factory

**Speaker**: Patrick Debois · AI Native Dev keynote (2026-07-13)
**Formula**: Fewer Human Touches + One-to-Many Sharing = The Dark Factory

## Block Map

| Block | Purpose | Slides |
| --- | --- | --- |
| B1: Déjà Vu | Why now — the 2009 repeat | `DkfGo` `DejaVu` `CommGo` |
| B2: Enabling the team | Who does the work | `OrchGo` `SysGo` `RitGo` |
| B3: Measure | How to know it works | `TwoMet` |
| B4: Scale | Platform and organization | `PlatGo` `CostGo` `VpEng` |
| B5: Hiring · Risk · Close | Risk and next step | `HireGo` `DimGo` `ContGo` |

## Slide 01: `DkfGo`

**KICKER**: AI NATIVE DEV · KEYNOTE
**TITLE**: The AI Dark Factory
**SUBTITLE**: Rebuilding teams, platforms, and organizations around autonomous agents
**BODY**: Patrick Debois — the godfather of DevOps
**VISUAL SCENE**: A vast dark factory floor at night. Most stations run unattended, machines turning under dim electric-blue light, a few glowing control consoles where humans audit and decide.
**VISUAL BRIEF**:
```yaml
recipe: industrial-night
composition: centered-constellation
motifs: [gear-cogs]
negative_constraints: [no-logo, no-watermark]
```

> **SPEAKER NOTE**: In 2009 people told me continuous delivery was crazy. I feel we are in the same moment now with the dark factory. Over and over I hear "it will not work here" — what they are really saying is "we are not ready yet." The technology can work; the organization is not set up for it. Today is not about the technical side; it is about the organizational side.

## Slide 02: `DejaVu`

**KICKER**: 2009 DÉJÀ VU
**TITLE**: "It will not work here." means "We're not ready yet."
**BODY**: Continuous delivery was "crazy" in 2009. / The dark factory is "crazy" today. / Not the technology — the organization.
**VISUAL SCENE**: Two eras side by side in one dim industrial space -- left, 2009 server racks with a skeptical crowd in shadow; right, the agent control room of today. Same posture, different machines.
**VISUAL BRIEF**:
```yaml
recipe: industrial-night
composition: split-panel
motifs: [glowing-wireframe]
negative_constraints: [no-logo, no-watermark]
```

> **SPEAKER NOTE**: I keep hearing "it will not work here" — and that is exactly what people said about continuous delivery in 2009. That sentence signals readiness, not feasibility. The loops, harnesses, and agent optimization talks are all great, but eventually they become commodity, maybe even offered as a service by a frontier lab. That will not be your organization's differentiator.

## Slide 03: `CommGo`

**KICKER**: THE REAL DIFFERENTIATOR
**TITLE**: Loops and harnesses become commodity. Organization is the edge.
**BODY**: Better prompts? Not the edge. / Bigger models? Not the edge. / How teams, platforms, and orgs are structured around agents.
**VISUAL SCENE**: A glowing pipeline of agent tooling fades into plain uniform commodity toward the distance, while a distinct organizational floor plan stays sharp and brightly lit in the foreground.
**VISUAL BRIEF**:
```yaml
recipe: pipeline-flows
composition: diagonal-flow
motifs: [connected-nodes]
negative_constraints: [no-logo, no-watermark]
```

> **SPEAKER NOTE**: There is a lot of great work on optimizing agents with loops and harnesses — and it is not rocket science. Eventually we all get there, and that becomes commodity. Starting from that assumption — that we are heading toward some form of autonomous work inside an organization — what I have seen, including at Tessl, is that it changes the dynamic of how you collaborate. That is Conway's Law: how you organize and the tools interact.

## Slide 04: `OrchGo`

**KICKER**: ENABLING THE TEAM
**TITLE**: From coder to conductor — and a new technical craft
**BODY**: "We didn't sign up for better prompting." / Building tooling for the agent rekindles the craft. / Abstraction made room for more engineering.
**VISUAL SCENE**: A developer at a glowing control console, conducting a constellation of agent nodes with tools and schematics floating around, the dark factory floor behind.
**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: centered-constellation
motifs: [connected-nodes]
negative_constraints: [no-logo, no-watermark]
```

> **SPEAKER NOTE**: The narrative I hear a lot: the developer becomes a conductor, an orchestrator of agents. Many developers tell me "we didn't sign up for better prompting and writing better specs — we are engineers." That creates friction. But when we introduced harnesses, loops, and more autonomous work, a new technical path opened: building tooling for the agent. That reignited engineers who felt prompting wasn't for them. The abstraction created a new place for real engineering.

## Slide 05: `SysGo`

**KICKER**: THE MENTALITY SHIFT
**TITLE**: Stop fixing the agent's code. Improve the system.
**BODY**: Build the thing that builds the thing. / Channel skeptic energy into context and harness. / Engineering practices still matter — tests, docs, no YOLO.
**VISUAL SCENE**: A luminous feedback loop where output is routed back into the machine itself -- the machine being upgraded rather than the parts it produces, with test and documentation nodes glowing along the path.
**VISUAL BRIEF**:
```yaml
recipe: pipeline-flows
composition: diagonal-flow
motifs: [glowing-wireframe]
negative_constraints: [no-logo, no-watermark]
```

> **SPEAKER NOTE**: When asked about skeptical people, I say: these are great people to engage in creating better context for the agent. Channel that skepticism into improving the system. The big mentality shift: stop fixing the code the agent produced, and improve the system. As someone said here — stop building the thing, build the thing that builds the thing. We are elevating from prompting to system thinking. Minimize human touches — but still with good engineering practices. Tests, documentation: everything we asked of good engineers, we now ask the agent. If people YOLO their way in, tell them to stop.

## Slide 06: `RitGo`

**KICKER**: TEAM RITUALS
**TITLE**: Retro: "Can we fix the system?" Planning: split the work.
**BODY**: Retro — the agent hit this wall again; fix the system. / Planning — well-defined → agents; conversational → humans. / Team leads set the pace: make context reusable.
**VISUAL SCENE**: Two industrial control rooms joined by a seam -- left, a retro review board glowing with system issues; right, a planning board sorting work into machine-ready and human-decision lanes.
**VISUAL BRIEF**:
```yaml
recipe: industrial-night
composition: split-panel
motifs: [glowing-wireframe]
negative_constraints: [no-logo, no-watermark]
```

> **SPEAKER NOTE**: Advanced teams run rituals where planning and retro are not about code issues but about system issues. In the retro: "the agent went over and over, hit this problem — can we fix the system?" In planning: things well scoped enough are easy for agents to pick up; what is left for humans is the conversational, under-scoped work. Team leads set the pace as a constraint — "stop prompting, make the context reusable," then jump to the next level. And as teams produce more, downstream GTM and users struggle to keep up — your harness must extend beyond coding, into requirements and automation for them.

## Slide 07: `TwoMet`

**KICKER**: WHAT MATTERS
**TITLE**: Two metrics that actually measure agentic productivity
**BODY**: 1 — Human touches ↓: better harness, context, guidelines. / 2 — One fix, everyone benefits: solo → shared → multiplayer.
**VISUAL SCENE**: Two glowing instrument dials on a dark control panel -- the first dial reading human touches trending down, the second dial radiating a multiplier outward to many connected nodes.
**VISUAL BRIEF**:
```yaml
recipe: pipeline-flows
composition: diagonal-flow
motifs: [connected-nodes]
negative_constraints: [no-logo, no-watermark]
```

> **SPEAKER NOTE**: People ask about token spend and all that. I have come to believe in two metrics. One: measure how many human touches remain to make the agent do the right thing — that should go down as your harness, context, and guidelines improve. Two: going from solo to a shared system becomes a multiplier — not one person becoming a 10x person, but one change that optimizes the agents having impact on everyone. You can start that in a team working together in one repo, sharing context, working on a harness — and then you scale it out.

## Slide 08: `PlatGo`

**KICKER**: SCALING UP
**TITLE**: The platform team owns the paved roads
**BODY**: New tools: skill registries, eval systems, guardrails, identities. / One owner → no sprawl. / A catalog of 3-4 paved roads, not one.
**VISUAL SCENE**: A central platform control core with clearly marked paved roads branching out to many teams, each road registered and maintained, the whole network under the glow of one owner.
**VISUAL BRIEF**:
```yaml
recipe: industrial-night
composition: split-panel
motifs: [gear-cogs]
negative_constraints: [no-logo, no-watermark]
```

> **SPEAKER NOTE**: This is where the platform people come in — the typical shared organization. New things bubble up: skill registries, eval systems for context, guardrails for coding agents, identities. It is hard — you need an owner to drive that centralized program, or you won't get paved roads. Reusable context across teams: why is everyone reinventing the authentication system? Put the shared component in the registry. But if everybody can push to the registry it becomes sprawl — which skill do I pick, who maintains it? So there is an owner per area who also cares about testability and modularity. Consensus is hard, but you end up with a catalog of three or four paved roads teams can pick from — the centralized pieces maintained, the easy way of adoption.

## Slide 09: `CostGo`

**KICKER**: MAKING IT VISIBLE
**TITLE**: Show the cost. Then optimize — don't limit.
**BODY**: Tokens. Iterations. Spend. / Visible cost → people optimize. / Cut iterations, not ambition.
**VISUAL SCENE**: A translucent accounting panel over the dark floor, spend and iteration counters glowing, a hand adjusting a dial downward while the factory keeps running.
**VISUAL BRIEF**:
```yaml
recipe: pipeline-flows
composition: diagonal-flow
motifs: [glowing-wireframe]
negative_constraints: [no-logo, no-watermark]
```

> **SPEAKER NOTE**: If teams adopt this blindly, they need to know what it costs. When the platform team makes the cost visible — how much is it spending, how much is it helping — people get eager to optimize. If I can reduce the number of iterations the agent runs, that is an optimization I can run; if I do not visualize it and only see the end result, we do not know. And when someone says spend is going crazy and we should limit it — your reflex should not be "limit the spend," it should be "optimize the spend": pick the right model, educate people, give better context and harnesses. That is how cost goes down.

## Slide 10: `VpEng`

**KICKER**: ONE LAYER HIGHER
**TITLE**: The VP Engineering playbook
**BODY**: Share successes — champions, hackathons, one Slack. / Mandate the leads and platform, not "a thousand flowers." / Defend with turns, improvement, reuse.
**VISUAL SCENE**: A high control balcony overlooking the factory, a broadcast glow spreading success stories across the floor, while a mandate signal radiates to the team leads and platform core.
**VISUAL BRIEF**:
```yaml
recipe: industrial-night
composition: centered-constellation
motifs: [gear-cogs]
negative_constraints: [no-logo, no-watermark]
```

> **SPEAKER NOTE**: One layer higher, the VP Engineering asks: how do I enable the organization? Share the successes — hackathons, lunch-and-learns, a shared Slack channel, a champions program. That is generic transformation; it could have been agile or DevOps. And we know the strategy of just licensing and educating people — "let a thousand flowers bloom" — does not work. So the organizational answer is: give the team leads and the platform the mandate to do that work. It is not a solo developer piece. And to defend it — licenses bought, faster delivery, quality — hard to prove — but you can show the turns and the improvement over that journey, and the reuse. That is easier than comparing productivity with and without agent coding.

## Slide 11: `HireGo`

**KICKER**: HIRING FOR THE AGENTIC ERA
**TITLE**: Titles don't prove maturity. The interview does.
**BODY**: 1 — Exercise: let them go nuts with AI. / 2 — Walkthrough: explain why — engineering. / 3 — Collaboration: will they share?
**VISUAL SCENE**: A three-stage evaluation hall: first a workbench where candidates build freely with AI, then a walkthrough stage where they explain their reasoning, then a discussion circle testing whether they share and reuse.
**VISUAL BRIEF**:
```yaml
recipe: pipeline-flows
composition: diagonal-flow
motifs: [connected-nodes]
negative_constraints: [no-logo, no-watermark]
```

> **SPEAKER NOTE**: Finding help externally is a mess — all the new titles: AI product engineer, forward deployed engineer, agentic engineer, AI engineer. A title does not validate skills or maturity; nobody is really mature yet. What I hear from most companies: first, give them an exercise and tell them to really go nuts with the AI — that shows how much they can leverage it. Then a walkthrough: explain what happened, why is this a good idea — that tests engineering. Third: how do you collaborate — are you open, will you share, or are you a solo player? You are looking for people who make things shareable, reusable, engineering-grade — not people who studied ML, not experts at decoding. And don't collapse the three skills into one junior/senior label; each person may need mentoring in the others.

## Slide 12: `DimGo`

**KICKER**: HONEST RISK
**TITLE**: It's a dim factory. Choose your risk per feature.
**BODY**: Provenance — who changed the code? / Verifiers — was it useful? / Micromanager → autonomous approval.
**VISUAL SCENE**: A factory floor where only some lines run fully dark-autonomous while others stay brightly lit and human-staffed, each line tagged with a risk dial, an audit beam scanning the code changes.
**VISUAL BRIEF**:
```yaml
recipe: industrial-night
composition: centered-constellation
motifs: [gear-cogs]
negative_constraints: [no-logo, no-watermark]
```

> **SPEAKER NOTE**: One of the five things: the dark factory is probably a dim factory. You have to see what risk you are willing to take for what features. Not all features become autonomous. You can invest more in auditing — provenance, who changed the code — and verifiers that check whether that code was useful. When it fails, invest in situational awareness. There is a whole spectrum from being a micromanager to autonomous approval where everything is correct — you make the decision based on your risk level.

## Slide 13: `ContGo`

**KICKER**: THE TAKEAWAY
**TITLE**: From continuous delivery to continuous learning
**BODY**: Capture knowledge in skills, context, harness. / Can you keep it reliable while changing more? / Not the solo player wins.
**VISUAL SCENE**: The dark factory floor at dawn, learning circuits feeding new knowledge back into the machine, a single bright node radiating out to many, the factory humming as it keeps changing.
**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: centered-constellation
motifs: [connected-nodes]
negative_constraints: [no-logo, no-watermark]
```

> **SPEAKER NOTE**: The dark factory is about capturing the knowledge — the knowledge you are putting into skills, into your context, into your harness, restraining your business context. For me, that brings continuous delivery to continuous learning. Ask: how fast can we swap in something new? That is your reactive mode. Ultimately it is not about making the whole system more reliable — it is: can I keep it reliable while changing more of the system? I am building a website listing agent enablement patterns; tell me what I am missing, share your stories. If there is one takeaway: it is not the solo player that will win the game. It is how we improve organizations at the different levels.
