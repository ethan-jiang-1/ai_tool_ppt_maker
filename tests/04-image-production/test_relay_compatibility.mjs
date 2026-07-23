import { describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createRefinementTransport,
  createRelayCompatibilityTransport,
  materializeRelaySubmitRequest,
} from "../../PPTMAKER_FRAMEWORK/scripts/04-image-production/visual-slot/internal/transport.mjs";
import {
  createModernRefinementTransport,
  refinementRequestFingerprint,
} from "../../PPTMAKER_FRAMEWORK/scripts/04-image-production/visual-slot/index.mjs";

const fixture = (name) => JSON.parse(readFileSync(join("tests", "fixtures", "image2-relay", name), "utf8"));

function attempt(kind) {
  return {
    attempt_id: `attempt-${kind}`,
    authorization_id: "auth-relay-fixture",
    plan_hash: "a".repeat(64),
    kind,
    ...(kind === "slot" ? { slide_id: "AlphaGo", slot: "primary_visual" } : {}),
  };
}

function materialize(value) {
  return materializeRelaySubmitRequest({
    request: value,
    material: {
      request_contract_version: "fixture-relay-material-v1",
      kind: value.kind,
      slide_id: value.slide_id || null,
      slot: value.slot || null,
      profile: { mode: "visual-slot", fingerprint: "b".repeat(64) },
      references: [{ role: "style-reference", sha256: "c".repeat(64) }],
    },
  });
}

function jsonResponse(value, { status = 200 } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async text() { return JSON.stringify(value); },
  };
}

function modernRequest() {
  const bytes = Buffer.from("reference-bytes");
  const material = {
    request_contract_version: "pptmaker-refinement-submit-request-v1",
    kind: "slot",
    slide_id: "AlphaGo",
    slot: "primary_visual",
    visual_brief: "A no-text conceptual visual",
    concept: { must_communicate: "A clear relationship", must_not: "No labels" },
    geometry: { x: 1, y: 2, width: 3, height: 4 },
    profile_contract: {
      schema: "pptmaker-image2-visual-slot-profile-v1",
      mode: "visual-slot",
      profile_fingerprint: "b".repeat(64),
    },
    references: [{
      role: "fallback-asset",
      kind: "asset",
      media: "image/png",
      sha256: createHash("sha256").update(bytes).digest("hex"),
      bytes,
    }],
  };
  return {
    attempt_id: "attempt-modern",
    authorization_id: "auth-modern",
    plan_hash: "a".repeat(64),
    request_fingerprint: refinementRequestFingerprint(material),
    ...material,
  };
}

describe("public modern transport factory", () => {
  it("uses resolved credentials only at the transport boundary and submits fixed visual-slot material", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({
      status: "completed",
      provider_request_id: "request-modern-sync-001",
      bytes_base64: Buffer.from("modern-bytes").toString("base64"),
      media: "image/png",
    }));
    const transport = await createModernRefinementTransport({
      credentials: { base_url: "https://relay.example.test/v1", api_key: "test-secret" },
      config: { fetchImpl },
    });

    const output = await transport.submitAttempt(modernRequest());
    expect(output).toMatchObject({ status: "submitted", provider_request_id: "request-modern-sync-001" });
    expect(output.bytes.toString("utf8")).toBe("modern-bytes");
    expect(output.receipt).toEqual({ provider_request_id: "request-modern-sync-001", transport_phase: "submit" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][0]).toBe("https://relay.example.test/v1/images/generations");
    expect(fetchImpl.mock.calls[0][1]).toMatchObject({
      method: "POST",
      headers: expect.objectContaining({ Authorization: "Bearer test-secret" }),
    });
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(body).toMatchObject({
      model: "gpt-image-2",
      n: 1,
      response_format: "b64_json",
      refinement: {
        request_contract_version: "pptmaker-refinement-submit-request-v1",
        kind: "slot",
        slide_id: "AlphaGo",
        slot: "primary_visual",
      },
    });
    expect(body.refinement.references).toEqual([expect.objectContaining({
      role: "fallback-asset",
      bytes_base64: Buffer.from("reference-bytes").toString("base64"),
    })]);
    expect(JSON.stringify(body)).not.toContain("test-secret");
  });

  it("keeps accepted-without-ID unknown and reconciles from the persisted provider ID without rematerializing", async () => {
    const unknownFetch = vi.fn(async () => jsonResponse({ status: "accepted" }));
    const unknownTransport = await createModernRefinementTransport({
      credentials: { base_url: "https://relay.example.test/v1", api_key: "test-secret" },
      config: { fetchImpl: unknownFetch },
    });
    await expect(unknownTransport.submitAttempt(modernRequest())).resolves.toMatchObject({ status: "unknown-submit" });
    expect(unknownFetch).toHaveBeenCalledTimes(1);

    const reconcileFetch = vi.fn(async () => jsonResponse({
      status: "completed",
      provider_request_id: "request-persisted-001",
      bytes_base64: Buffer.from("reconciled-bytes").toString("base64"),
    }));
    const reconcileTransport = await createModernRefinementTransport({
      credentials: { base_url: "https://relay.example.test/v1", api_key: "test-secret" },
      config: { fetchImpl: reconcileFetch },
    });
    const result = await reconcileTransport.reconcileAttempt({
      attempt_id: "attempt-modern",
      authorization_id: "auth-modern",
      provider_request_id: "request-persisted-001",
    });
    expect(result).toMatchObject({ status: "submitted", provider_request_id: "request-persisted-001" });
    expect(reconcileFetch).toHaveBeenCalledWith(
      "https://relay.example.test/v1/tasks/request-persisted-001",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("rejects unavailable credentials before any provider call", async () => {
    await expect(createModernRefinementTransport({
      credentials: { base_url: "https://relay.example.test/v1", api_key: "" },
    })).rejects.toMatchObject({ code: "provider_configuration_unavailable" });
  });

  it("keeps provider failures bounded when an adapter reports sensitive text", async () => {
    const transport = createRefinementTransport({
      submit: async () => {
        throw new Error("API_KEY_SENTINEL response_body=PROVIDER_BODY_SENTINEL");
      },
      reconcile: async () => null,
    });

    const error = await transport.submitAttempt(modernRequest()).catch((value) => value);
    expect(error).toMatchObject({ code: "provider_failure", message: "Image2 provider submit failed" });
    expect(String(error.message)).not.toContain("API_KEY_SENTINEL");
    expect(String(error.message)).not.toContain("PROVIDER_BODY_SENTINEL");
  });
});

describe.each(["style-reference", "slot"])("relay compatibility spike (%s)", (kind) => {
  it("materializes the same provider-neutral request deterministically", () => {
    expect(materialize(attempt(kind))).toEqual(materialize(attempt(kind)));
  });

  it("treats synchronous bytes as terminal and retains a provider request ID", async () => {
    const submit = vi.fn(async () => fixture("sync-submit.json"));
    const transport = createRelayCompatibilityTransport({
      materialize,
      submit,
      reconcile: async () => null,
    });

    const output = await transport.submitAttempt(attempt(kind));
    expect(output).toMatchObject({ status: "submitted", provider_request_id: "request-sync-001" });
    expect(output.bytes.toString("utf8")).toBe("sync-bytes");
    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit.mock.calls[0][0]).toEqual(materialize(attempt(kind)));
  });

  it("follows one stable async task through poll and result", async () => {
    const poll = vi.fn(async () => fixture("async-poll-completed.json"));
    const result = vi.fn(async () => fixture("async-result.json"));
    const transport = createRelayCompatibilityTransport({
      materialize,
      submit: async () => fixture("async-submit.json"),
      poll,
      result,
      reconcile: async () => null,
    });

    const output = await transport.submitAttempt(attempt(kind));
    expect(output).toMatchObject({ status: "submitted", provider_request_id: "request-async-001" });
    expect(output.bytes.toString("utf8")).toBe("async-bytes");
    expect(poll).toHaveBeenCalledWith(expect.objectContaining({ provider_request_id: "request-async-001", task_id: "task-async-001" }));
    expect(result).toHaveBeenCalledTimes(1);
  });

  it("returns a typed failed submit without polling or retrying", async () => {
    const poll = vi.fn();
    const transport = createRelayCompatibilityTransport({
      materialize,
      submit: async () => fixture("failed-submit.json"),
      poll,
      reconcile: async () => null,
    });

    await expect(transport.submitAttempt(attempt(kind))).resolves.toMatchObject({
      status: "failed",
      provider_request_id: "request-failed-001",
      failure_code: "relay_rejected",
    });
    expect(poll).not.toHaveBeenCalled();
  });

  it("marks accepted-without-ID and timeout outcomes unknown without retrying", async () => {
    const noIdSubmit = vi.fn(async () => fixture("accepted-without-id.json"));
    const noIdTransport = createRelayCompatibilityTransport({
      materialize,
      submit: noIdSubmit,
      reconcile: async () => null,
    });
    await expect(noIdTransport.submitAttempt(attempt(kind))).resolves.toMatchObject({ status: "unknown-submit" });
    expect(noIdSubmit).toHaveBeenCalledTimes(1);

    const timeoutPoll = vi.fn(async () => { throw Object.assign(new Error("timeout"), { code: "ETIMEDOUT" }); });
    const timeoutTransport = createRelayCompatibilityTransport({
      materialize,
      submit: async () => fixture("async-submit.json"),
      poll: timeoutPoll,
      result: vi.fn(),
      reconcile: async () => null,
    });
    await expect(timeoutTransport.submitAttempt(attempt(kind))).resolves.toMatchObject({
      status: "unknown-submit",
      provider_request_id: "request-async-001",
    });
    expect(timeoutPoll).toHaveBeenCalledTimes(1);
  });

  it("reconciles from the persisted provider identity without rematerializing or submitting", async () => {
    const submit = vi.fn();
    const materializer = vi.fn(materialize);
    const reconcile = vi.fn(async () => fixture("async-submit.json"));
    const transport = createRelayCompatibilityTransport({
      materialize: materializer,
      submit,
      poll: async () => fixture("async-poll-completed.json"),
      result: async () => fixture("async-result.json"),
      reconcile,
    });

    const output = await transport.reconcileAttempt({ ...attempt(kind), provider_request_id: "request-persisted-001" });
    expect(output).toMatchObject({ status: "submitted", provider_request_id: "request-async-001" });
    expect(reconcile).toHaveBeenCalledWith(expect.objectContaining({ provider_request_id: "request-persisted-001" }));
    expect(materializer).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();
  });
});
