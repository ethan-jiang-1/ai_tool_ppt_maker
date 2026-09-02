# ai_tool_ppt_maker

AI-driven PPT generation system. The Agent reads the PPT Maker Harness guidance, makes
creative and process decisions with you, runs the deterministic production
steps, and produces a PPTX.

## Quick Start

Use a supported Node.js line: Node.js 22.x, 24.x, or 26.x.

```bash
npm install
node ppt_maker_harness/scripts/ppt_flow.mjs doctor
```

Then tell the Agent what you need, for example: "I want to make a
presentation" or "Please continue this presentation." For new work, the Agent
establishes local foundation, initializes the requested workspace, gathers your
content and necessary choices, then follows the current creation owner. It does
not treat setup or a diagnostic as permission for later remote work.

For an existing presentation, provide its exact local run directory or its
`RUN_BUNDLE.md` handoff card. The Agent does not guess a deck from a nearby
folder, rendered file, or timestamp. Raw-generation readiness is checked only
when the exact run exists and the current owner selects that operation.

## Development Verification

| Tier | What it covers | When to use it |
| --- | --- | --- |
| `core` | `npm test` and the compatible `ppt_flow test` command run the bounded protected core inventory | Every normal Harness change |
| `focused` | One deliberately selected seam or process test | While working on that exact boundary |
| `sweep` | Broad pure unit/integration sampling | When changed public code warrants a wider local check |
| `mock E2E` | One selected journey with a fake external adapter | When a public journey changed |
| `real E2E` | A selected live journey | Only with separate explicit authorization |

```bash
npm test
npm run test:focused -- tests/contracts/test_harness_architecture.mjs
npm run test:sweep
npm run test:mock-e2e -- tests_e2e/shared/workflow/test_mock_selected_journey.mjs
PPTMAKER_RUN_REAL_E2E=1 npm run test:real-e2e -- tests_e2e/.../test_real_*.mjs
```

The core tier is not full regression or release certification. Sweep excludes
process-level and live-provider work. Mock E2E uses a fake external adapter;
real E2E requires the selected real test plus its existing authorization
boundary. Do not use a broad E2E command.

The checked-in live acceptance probe is deliberately one synthetic Pure page.
Use a non-production Image2-compatible endpoint and explicit credentials; it
performs at most one chargeable submission, removes its OS-temporary test
bundle, and stops after native raw PNG materialization. A returned PNG is not
visual acceptance, permission to proceed, finalization, delivery, or a reason
to retry an uncertain provider outcome. The selected test reads missing
`IMAGE2_API_KEY` and `IMAGE2_BASE_URL` values from the project-root `.env`;
already exported environment values retain precedence.

```bash
PPTMAKER_RUN_REAL_E2E=1 IMAGE2_API_KEY=... IMAGE2_BASE_URL=https://non-production.example/v1 \
  npm run test:real-e2e -- tests_e2e/shared/real-provider/test_real_provider_e2e_acceptance.mjs
```

## Project Structure

| Directory | Purpose |
| --- | --- |
| `ppt_maker_harness/` | Methodology knowledge base and production scripts |
| `tests/` | Unit and integration tests |
| `tests_e2e/` | End-to-end tests |
| `openspec/` | Spec-driven development |
| `_backlog/` | Backlog, bugs, and plans |
| `deck_*/` | Generated run bundles, not Harness source |
| `dpt_*/` | Deep-research input; do not read unless it is named |

`deck_*` is created for presentation work and is production data, not Harness
source. PPT Maker Harness maintenance changes the Harness, specs, and tests; deck
work changes only the named run bundle.

## Technology

Node.js ESM (`.mjs`); runtime-core dependencies `@napi-rs/canvas`, `pptxgenjs`,
`jszip`, `commander`, `yaml`, and `playwright`. The complete dependency list is
owned solely by `package.json`.
