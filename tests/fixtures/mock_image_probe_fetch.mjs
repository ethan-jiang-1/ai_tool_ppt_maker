globalThis.fetch = async (_url, options = {}) => {
  if (options.method !== 'POST' || options.redirect !== 'error') {
    throw new Error('diagnostic fetch contract mismatch');
  }
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ task_id: 'task_test_only' }),
  };
};
