import { describe, expect, it } from "vitest";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createCanvas } from "@napi-rs/canvas";
import {
  image2AuthorizationProfileFingerprint,
  readState,
  recordImage2ProviderAuthorization,
  writeState,
} from "../../PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs";
import { sha256File } from "../../PPTMAKER_FRAMEWORK/scripts/shared/identity/byte_hash.mjs";

const FLOW = "PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs";

function flow(args, { env = {}, timeout = 120_000 } = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn("node", [FLOW, ...args], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        IMAGE2_API_KEY: "e2e-image2-key",
        OPENAI_API_KEY: "",
        GEMINI_API_KEY: "",
        ...env,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => child.kill("SIGKILL"), timeout);
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (status, signal) => {
      clearTimeout(timer);
      resolvePromise({ status, signal, stdout, stderr });
    });
  });
}

async function startImageRelay() {
  const canvas = createCanvas(32, 18);
  const context = canvas.getContext("2d");
  context.fillStyle = "#1f6b8d";
  context.fillRect(0, 0, 32, 18);
  const image = canvas.toBuffer("image/png").toString("base64");
  const calls = [];
  const server = createServer((request, response) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => {
      calls.push({ method: request.method, url: request.url, body });
      if (request.method !== "POST" || request.url !== "/v1/images/generations") {
        response.writeHead(404, { "content-type": "application/json" });
        response.end(JSON.stringify({ error: "unexpected local relay request" }));
        return;
      }
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ data: [{ b64_json: image }] }));
    });
  });
  await new Promise((resolvePromise) => server.listen(0, "127.0.0.1", resolvePromise));
  const address = server.address();
  return {
    calls,
    baseUrl: `http://127.0.0.1:${address.port}/v1`,
    close: () => new Promise((resolvePromise) => server.close(resolvePromise)),
  };
}

function setActiveNode(deck, node) {
  const state = readState(deck, { purpose: "execute", heal: false });
  state.playbook = "create-deck";
  state.execution_id = "exec-image2-primary-e2e";
  state.execution_started_at = "2026-07-22T00:00:00.000Z";
  state.run_version = "v1";
  state.current_node = node;
  state.nodes ||= {};
  for (const record of Object.values(state.nodes)) {
    if (record && typeof record === "object" && !record.by_version) {
      record.execution_id = state.execution_id;
      record.run_version = state.run_version;
    }
  }
  state.nodes[node] = {
    ...state.nodes[node],
    status: "in_progress",
    execution_id: state.execution_id,
    run_version: state.run_version,
  };
  writeState(deck, state);
}

function wholePageProfile({ operation, styleMaster, resolution = "2k" }) {
  return image2AuthorizationProfileFingerprint({
    operation,
    profile: {
      model: "gpt-image-2",
      resolution,
      size: "16:9",
      n: 1,
      ...(styleMaster ? { style_reference_sha256: sha256File(styleMaster) } : {}),
    },
  });
}

function authorize(deck, runDir, { operation, scope, profileFingerprint, maxSubmissions }) {
  return recordImage2ProviderAuthorization(deck, {
    runDir,
    operation,
    scope,
    profileFingerprint,
    maxSubmissions,
  });
}

describe("default Image2-primary delivery E2E", () => {
  it("uses the first-class whole-page route with scoped local-relay submits and no HTML authority", async () => {
    const root = mkdtempSync(join(tmpdir(), "image2-primary-e2e-"));
    const deck = join(root, "deck_image2_primary");
    const runDir = join(deck, "3_versions", "v1");
    const relay = await startImageRelay();
    const relayEnv = { IMAGE2_BASE_URL: relay.baseUrl };
    try {
      const init = await flow(["init", deck, "--deck-type", "keynote", "--style", "dark-executive"], { env: relayEnv, timeout: 30_000 });
      expect(init.status, init.stderr || init.stdout).toBe(0);
      expect(readState(deck, { purpose: "execute", heal: false }).production_mode.by_version["3_versions/v1"])
        .toEqual({ mode: "image2-only" });

      const sourcePath = join(runDir, "slide-specifications.md");
      writeFileSync(sourcePath, `---
production:
  pipeline: whole-page-image2-v1
identity:
  scheme: mnemonic-v1
render:
  default: full-page
  header-lock: []
---

## Slide 01: ViewGo

**VISUAL TYPE**: Framework
**RENDER MODE**: full-page
**KICKER**: PRIMARY
**TITLE**: A first-class Image2 delivery
**IMAGE PROMPT**: Create a clear full-page framework with one central idea and readable labels.
> **SPEAKER NOTE**: Explain the framework in one concise sentence.
`, "utf8");
      const stylePrompt = join(deck, "2_backbone", "visual-style", "style-master-prompt.md");
      writeFileSync(stylePrompt, "Create a clear restrained executive visual system.", "utf8");

      const validate = await flow(["validate", runDir], { env: relayEnv });
      expect(validate.status, validate.stderr || validate.stdout).toBe(0);

      setActiveNode(deck, "generate-image2-style-master");
      const deckSystem = join(deck, "2_backbone", "visual-style", "deck_system.txt");
      authorize(deck, runDir, {
        operation: "style-master",
        scope: { role: "style-master" },
        profileFingerprint: image2AuthorizationProfileFingerprint({
          operation: "style-master",
          profile: {
            model: "gpt-image-2",
            resolution: "2k",
            style_prompt_sha256: sha256File(stylePrompt),
            deck_system_sha256: existsSync(deckSystem) ? sha256File(deckSystem) : null,
          },
        }),
        maxSubmissions: 1,
      });
      const style = await flow(["style-master", runDir], { env: relayEnv });
      expect(style.status, style.stderr || style.stdout).toBe(0);
      const styleMaster = join(deck, "2_backbone", "visual-style", "style_master.jpg");
      expect(existsSync(styleMaster)).toBe(true);

      setActiveNode(deck, "pilot-image2-pages");
      authorize(deck, runDir, {
        operation: "pilot",
        scope: { slide_ids: ["ViewGo"] },
        profileFingerprint: wholePageProfile({ operation: "pilot", styleMaster, resolution: "1k" }),
        maxSubmissions: 1,
      });
      const pilot = await flow(["pilot", runDir, "--only", "ViewGo"], { env: relayEnv });
      expect(pilot.status, pilot.stderr || pilot.stdout).toBe(0);
      expect(existsSync(join(runDir, "_generated", "preview", "pilot_final_contact_sheet.jpg"))).toBe(true);

      for (const gate of ["content", "visual", "header"]) {
        const approval = await flow(["approve", runDir, gate], { env: relayEnv });
        expect(approval.status, approval.stderr || approval.stdout).toBe(0);
      }

      setActiveNode(deck, "produce-image2-deck");
      authorize(deck, runDir, {
        operation: "build",
        scope: { slide_ids: ["ViewGo"] },
        profileFingerprint: wholePageProfile({ operation: "build", styleMaster }),
        maxSubmissions: 1,
      });
      const build = await flow(["build", runDir], { env: relayEnv });
      expect(build.status, build.stderr || build.stdout).toBe(0);
      expect(readdirSync(join(runDir, "_generated", "ppt")).some((name) => name.endsWith(".pptx"))).toBe(true);
      expect(existsSync(join(runDir, "_generated", "qa", "notes_injection.json"))).toBe(true);

      const titleRefresh = await flow(["refresh", runDir, "--kind", "title", "--only", "ViewGo", "--dry-run"], { env: relayEnv });
      expect(titleRefresh.status, titleRefresh.stderr || titleRefresh.stdout).toBe(0);
      const visualRefresh = await flow(["refresh", runDir, "--kind", "visual", "--only", "ViewGo", "--dry-run"], { env: relayEnv });
      expect(visualRefresh.status, visualRefresh.stderr || visualRefresh.stdout).toBe(0);
      expect(relay.calls).toHaveLength(3);

      setActiveNode(deck, "checkpoint-image2-final-review");
      const finalReview = await flow(["state", runDir, "--record-image2-delivery-review", "proceed"], { env: relayEnv, timeout: 30_000 });
      expect(finalReview.status, finalReview.stderr || finalReview.stdout).toBe(0);
      const status = await flow(["status", runDir, "--json"], { env: relayEnv, timeout: 30_000 });
      expect(status.status, status.stderr || status.stdout).toBe(0);
      expect(JSON.parse(status.stdout)).toMatchObject({
        production_mode: { mode: "image2-only" },
        pipeline: "whole-page-image2-v1",
      });

      const state = readState(deck, { purpose: "execute", heal: false });
      expect(state.nodes["checkpoint-image2-final-review"]).toMatchObject({
        status: "completed",
        decision: { value: "proceed", kind: "user" },
      });
      expect(state.nodes["html-delivery-review"] ?? null).toBeNull();
      expect(state.nodes["image2-refinement"] ?? null).toBeNull();
      expect(existsSync(join(runDir, "_generated", "html_production"))).toBe(false);
      expect(existsSync(join(runDir, "_generated", "image2_refinement"))).toBe(false);
      expect(relay.calls).toHaveLength(3);
      expect(relay.calls.every((call) => call.url === "/v1/images/generations")).toBe(true);
    } finally {
      await relay.close();
      rmSync(root, { recursive: true, force: true });
    }
  }, 180_000);
});
