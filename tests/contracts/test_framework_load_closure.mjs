import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("focused framework load-closure diagnostics", () => {
  it("keeps base, HTML-local, and markerless-provider help closures selective", () => {
    const trace = (script, args) => {
      const result = spawnSync(process.execPath, [script, ...args], {
        cwd: process.cwd(), encoding: "utf8", env: { ...process.env, NODE_DEBUG: "esm" }, timeout: 30_000,
      });
      expect(result.status, result.stderr).toBe(0);
      return result.stderr;
    };
    const base = trace("PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs", ["doctor", "--help"]);
    expect(base).not.toMatch(/scripts\/(?:01-content|02-visual-system|03-html-production|04-image-production|05-iteration)\//);
    expect(base).not.toMatch(/(?:image_api_client|html_slide_renderer|@napi-rs\/canvas|fast-png)/);
    const html = trace("PPTMAKER_FRAMEWORK/scripts/03-html-production/stage2_render_html.mjs", ["--help"]);
    expect(html).not.toMatch(/scripts\/(?:04-image-production|05-iteration\/legacy-image2)|image_api_client/);
    const markerless = trace("PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page/stage2_generate_images.mjs", ["--help"]);
    expect(markerless).not.toMatch(/visual-slot|html_slide_renderer|html_render_runtime/);
  }, 60_000);
});
