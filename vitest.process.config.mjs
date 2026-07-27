import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/test_process_*.mjs"],
    testTimeout: 30_000,
    minWorkers: 1,
    maxWorkers: 2,
  },
});
