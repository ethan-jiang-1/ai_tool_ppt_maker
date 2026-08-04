import { appendFileSync } from 'node:fs';

globalThis.fetch = async (_url, options = {}) => {
  if (process.env.PPTMAKER_IMAGE_PROBE_MARKER) {
    appendFileSync(process.env.PPTMAKER_IMAGE_PROBE_MARKER, 'fetch\n');
  }
  if (options.method !== 'POST' || options.redirect !== 'error') {
    throw new Error('diagnostic fetch contract mismatch');
  }
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ task_id: 'task_test_only' }),
  };
};
