import { existsSync, readFileSync, writeFileSync } from "node:fs";

import {
  acceptStyleMasterCandidateReview,
  planStyleMasterCandidates,
} from "../../ppt_maker_harness/scripts/shared/image2/style_master_plan.mjs";
import {
  Image2ProviderProfileError,
  resolveImage2ProviderProfile,
} from "../../ppt_maker_harness/scripts/shared/image2/provider_profile.mjs";
import { writeConfirmedImage2ProviderProfile } from "./image2_provider_profile.mjs";

const DEFAULT_STYLE_INTENT = "Use a calm editorial visual system with material depth.\n";

/** Establish one real local-existing candidate plan and accepted selection for a raw test fixture. */
export async function acceptLocalStyleMasterFixture(scope, { intent = DEFAULT_STYLE_INTENT } = {}) {
  if (!scope || typeof scope !== "object" || typeof scope.style_intent_source_path !== "string") {
    throw new TypeError("a resolved Style Master scope is required");
  }
  if (!existsSync(scope.style_intent_source_path) || !readFileSync(scope.style_intent_source_path, "utf8").trim()) {
    writeFileSync(scope.style_intent_source_path, intent, "utf8");
  }
  try {
    resolveImage2ProviderProfile(scope.run_dir);
  } catch (error) {
    if (!(error instanceof Image2ProviderProfileError) ||
      !["image2_provider_profile_missing", "image2_provider_profile_pending"].includes(error.code)) {
      throw error;
    }
    writeConfirmedImage2ProviderProfile(scope.run_dir);
  }
  const plan = await planStyleMasterCandidates({ scope, candidateCount: 0 });
  const accepted = await acceptStyleMasterCandidateReview({
    scope,
    planSha256: plan.plan_sha256,
    decision: "proceed",
    candidateId: "local-existing",
  });
  if (!accepted.promoted) throw new Error("Style Master fixture selection was not promoted");
  return Object.freeze({ plan, accepted });
}
