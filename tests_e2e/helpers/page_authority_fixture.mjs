import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { createCanvas } from "@napi-rs/canvas";

export const PPT_FLOW = "PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs";

export function flow(args, { env = {}, timeout = 120_000 } = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn("node", [PPT_FLOW, ...args], {
      cwd: process.cwd(),
      env: { ...process.env, ...env },
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

export function parseJson(stdout) {
  return JSON.parse(stdout);
}

export function lastError(stderr) {
  return JSON.parse(String(stderr).trim().split("\n").filter(Boolean).at(-1));
}

export function mixedPageAuthoritySource({
  framedTitle = "Frame-owned title",
  pureTitle = "Pure-owned display title",
} = {}) {
  return `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v1
  page_authority_default: framed-image2
---

## Slide 01: \`PageGo\`

**KICKER**: LOCAL FRAME
**TITLE**: ${framedTitle}
**SUBTITLE**: The underlay remains text-free.
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-readable-text
  - no-labels
\`\`\`

> **SPEAKER NOTE**: Explain why the local frame owns readable text.

## Slide 02: \`PureMap\`

**PAGE AUTHORITY**: pure-image2
**TITLE**: ${pureTitle}
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`

> **SPEAKER NOTE**: Explain why Image2 owns the full pure page.
`;
}

export async function startRawRelay() {
  const canvas = createCanvas(2000, 1125);
  const context = canvas.getContext("2d");
  context.fillStyle = "#174b6d";
  context.fillRect(0, 0, 2000, 1125);
  context.fillStyle = "#d9a441";
  context.fillRect(120, 120, 1760, 885);
  const png = canvas.toBuffer("image/png").toString("base64");
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
      response.end(JSON.stringify({ data: [{ bytes_base64: png }] }));
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
