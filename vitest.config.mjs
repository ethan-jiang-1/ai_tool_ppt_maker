import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/test_*.mjs', 'tests/**/test-*.mjs'],
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
