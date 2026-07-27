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
      // A sweep is pure, fast feedback. Process-level checks are explicitly
      // named and must be selected deliberately while their broad setup is
      // replaced by direct seam tests.
      'tests/**/test_process_*.mjs',
    ],
    testTimeout: 30_000,
    minWorkers: 1,
    maxWorkers: 2,
  },
});
