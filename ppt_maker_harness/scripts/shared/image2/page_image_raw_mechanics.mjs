import { canonicalJsonSha256 } from "../identity/canonical_json.mjs";
import {
  createAcceptedRawEvidence,
  validateRawWorkPlanProviderInputBindings,
} from "./page_image_artifacts.mjs";
import { inspectPageImageRawProviderAuthorization } from "../state/state.mjs";

const SHA256_RE = /^[0-9a-f]{64}$/;

export class PageImageRawMechanicsError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "PageImageRawMechanicsError";
    this.code = code;
  }
}

function checkedPlan(rawWorkPlan) {
  const checked = validateRawWorkPlanProviderInputBindings(rawWorkPlan);
  if (!checked.ok) throw new PageImageRawMechanicsError(checked.code, checked.message);
  return checked;
}

function currentAuthorization({ deckDir, runVersion, runDir, rawWorkPlan }) {
  const authorization = inspectPageImageRawProviderAuthorization(deckDir, {
    runVersion,
    runDir,
    rawWorkPlan,
    maxSubmissions: rawWorkPlan.items.length,
  });
  if (!authorization.ok) {
    throw new PageImageRawMechanicsError("provider_authorization_required", `Page Image provider authorization failed: ${authorization.code}`);
  }
  return authorization;
}

/** Submit opaque typed-plan items only after the state owner confirms scope. */
export async function submitAuthorizedRawWorkPlan({ deckDir, runVersion, runDir, rawWorkPlan, submit } = {}) {
  checkedPlan(rawWorkPlan);
  if (typeof submit !== "function") throw new PageImageRawMechanicsError("provider_submit_required", "a provider submit function is required");
  const authorization = currentAuthorization({ deckDir, runVersion, runDir, rawWorkPlan });
  const results = [];
  for (const item of rawWorkPlan.items) {
    results.push(await submit(Object.freeze({
      authorization: authorization.record,
      raw_work_plan_sha256: canonicalJsonSha256(rawWorkPlan),
      item: Object.freeze({ ...item }),
    })));
  }
  return Object.freeze({
    submitted: rawWorkPlan.items.length,
    authorization: authorization.record,
    authorization_sha256: canonicalJsonSha256(authorization.record),
    results: Object.freeze(results),
  });
}

/** Publish only plan-bound bytes whose current authorization and review digest exist. */
export function publishAcceptedRawEvidence({ deckDir, runVersion, runDir, rawWorkPlan, raw_review_sha256, raw_bytes_by_slide } = {}) {
  checkedPlan(rawWorkPlan);
  if (!SHA256_RE.test(raw_review_sha256 || "")) {
    throw new PageImageRawMechanicsError("raw_review_required", "a current raw review SHA-256 is required");
  }
  const authorization = currentAuthorization({ deckDir, runVersion, runDir, rawWorkPlan });
  return createAcceptedRawEvidence({
    plan: rawWorkPlan,
    provider_authorization_sha256: canonicalJsonSha256(authorization.record),
    raw_review_sha256,
    raw_bytes_by_slide,
  });
}
