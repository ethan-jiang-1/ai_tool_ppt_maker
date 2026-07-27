import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/test_*.mjs', 'tests/**/test-*.mjs'],
    // These are static-import fixtures consumed by the development-verification
    // admission tests. They deliberately contain no Vitest cases.
    exclude: [
      'tests/contracts/fixtures/development-verification/test_mock_out_of_root.mjs',
      'tests/contracts/fixtures/development-verification/test_mock_prohibited_direct.mjs',
      'tests/contracts/fixtures/development-verification/test_mock_prohibited_transitive.mjs',
    ],
    // Local PPTX/render integration cases can exceed Vitest's 5s default
    // under normal parallel suite load; longer end-to-end cases set their
    // own explicit limits.
    testTimeout: 30_000,
    // Canvas, Chromium, and PPTX integration tests contend heavily when all
    // files run at once. Keep enough parallelism for feedback while avoiding
    // worker RPC and child-process starvation in the full suite.
    minWorkers: 1,
    maxWorkers: 2,
  },
});
