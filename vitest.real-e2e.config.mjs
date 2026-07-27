import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests_e2e/**/test_real_*.mjs"],
    testTimeout: 600_000,
    minWorkers: 1,
    maxWorkers: 1,
  },
});
