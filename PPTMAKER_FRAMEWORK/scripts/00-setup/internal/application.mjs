export async function inspectBaseEnvironment(options = {}) {
  const module = await import("./env_check.mjs");
  return module.runChecks(options);
}

export async function runEnvironmentCheckCli(argv, options) {
  const module = await import("./env_check.mjs");
  return module.runEnvCheckCli(argv, options);
}
