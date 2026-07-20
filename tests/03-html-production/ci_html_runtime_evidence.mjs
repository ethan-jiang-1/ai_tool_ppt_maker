import { discoverNpmPackages } from '../../PPTMAKER_FRAMEWORK/scripts/00-setup/internal/env_check.mjs';
import {
  inspectHtmlRuntime,
  runHtmlRuntimeSmoke,
} from '../../PPTMAKER_FRAMEWORK/scripts/00-setup/internal/html_runtime.mjs';

const discovered = discoverNpmPackages(process.cwd());
if (!discovered.playwright) throw new Error('Canonical Playwright package was not discovered');

const runtime = await inspectHtmlRuntime({
  playwrightRoot: discovered.playwright.root,
  playwrightVersion: discovered.playwright.version,
});
if (!runtime.ok) throw new Error(`HTML runtime is not ready: ${runtime.error}`);

const smoke = await runHtmlRuntimeSmoke({ runtimeEvidence: runtime });
if (!smoke.ok) throw new Error(`HTML runtime smoke failed during ${smoke.phase}`);

console.log(JSON.stringify({
  profile: runtime.profile,
  nodeMajor: runtime.node.major,
  playwrightVersion: runtime.playwright.version,
  chromium: runtime.chromium,
  viewport: smoke.viewport,
  geometry: smoke.geometry,
  networkRequests: smoke.networkRequests,
  serviceWorkers: smoke.serviceWorkers,
  fonts: smoke.fonts,
  fixedSentinelOnly: smoke.fixedSentinelOnly,
  actualDeckCoverage: smoke.actualDeckCoverage,
  pixelOverflowCoverage: smoke.pixelOverflowCoverage,
}, null, 2));
