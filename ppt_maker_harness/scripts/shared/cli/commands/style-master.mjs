import { emitCliError } from "../cli_error.mjs";
import {
  STYLE_MASTER_OPERATIONS,
  STYLE_MASTER_PLAN_HASH_RE,
  emitUsage,
  hasExplicitCliOption,
  initializeStyleMasterImage2Transport,
  requestedStyleMasterCandidateCount,
  requiredStyleMasterPlanHash,
  resolveRunAdapter,
  styleMasterFailure,
  styleMasterSubmitFactory,
  styleMasterUnexpectedOption,
  targetImage2Operations,
} from "../command_support.mjs";
export async function commandStyleMaster(operation, runDir, opts = {}) {
  if (!STYLE_MASTER_OPERATIONS.has(operation)) {
    return emitUsage("ppt_flow.style-master.operation", `Style Master operation ${JSON.stringify(operation)} is not supported`, "Use inspect, plan, authorize, generate, review, accept, or abandon.");
  }
  const unexpected = styleMasterUnexpectedOption(operation);
  if (unexpected) {
    return emitUsage(`ppt_flow.style-master.${operation}`, `${unexpected} is not accepted for Style Master ${operation}`, "Use only the fixed arguments for this current Style Master operation.");
  }

  let planHash = null;
  let candidateCount = null;
  if (["authorize", "generate", "review", "accept", "abandon"].includes(operation)) {
    planHash = requiredStyleMasterPlanHash(operation, opts);
    if (planHash === null) return 1;
  } else if (operation === "inspect" && hasExplicitCliOption("--plan-hash")) {
    if (!STYLE_MASTER_PLAN_HASH_RE.test(opts.planHash || "")) {
      return emitUsage("ppt_flow.style-master.inspect", "--plan-hash must be one lowercase SHA-256", "Pass the exact current Style Master plan SHA-256.");
    }
    planHash = opts.planHash;
  } else if (operation === "plan") {
    candidateCount = requestedStyleMasterCandidateCount(opts);
    if (candidateCount === null) return 1;
  }

  if (operation === "accept") {
    if (!["proceed", "repair", "redirect"].includes(opts.decision)) {
      return emitUsage("ppt_flow.style-master.accept", "--decision must be proceed, repair, or redirect", "Record one explicit current Style Master visual-direction decision.");
    }
    if (opts.decision === "proceed" && !opts.candidateId) {
      return emitUsage("ppt_flow.style-master.accept", "--candidate-id is required when --decision proceed", "Name one eligible candidate from the exact reviewed plan.");
    }
    if (opts.decision !== "proceed" && opts.candidateId) {
      return emitUsage("ppt_flow.style-master.accept", "--candidate-id is allowed only when --decision proceed", "Remove --candidate-id for repair or redirect.");
    }
  }
  if (operation === "abandon" && !opts.reason) {
    return emitUsage("ppt_flow.style-master.abandon", "--reason is required", "Provide one bounded human reason for abandoning the exact unknown plan.");
  }

  const route = await resolveRunAdapter(runDir, `ppt_flow.style-master.${operation}.identity`);
  if (!route) return 1;
  if (operation === "authorize" || operation === "generate") {
    const { applyImage2StartupEnv } = await import("../../../shared/image2/startup_env.mjs");
    applyImage2StartupEnv({ runDir: route.run_dir });
  }
  try {
    const workflowOperations = await targetImage2Operations(route.workflow);
    const scope = await workflowOperations.resolveStyleMasterScope(route.run_dir);
    const owner = await import("../../../shared/image2/style_master_plan.mjs");
    const common = { scope, refreshScope: workflowOperations.resolveStyleMasterScope };
    let output;
    if (operation === "inspect") {
      output = await owner.inspectStyleMasterCandidates({ ...common, planSha256: planHash });
    } else if (operation === "plan") {
      output = await owner.planStyleMasterCandidates({ ...common, candidateCount });
    } else if (operation === "authorize") {
      output = await owner.authorizeStyleMasterCandidates({ ...common, planSha256: planHash });
      const { recordStyleMasterAuthorizeCliHandoff } = await import("../../../shared/state/state.mjs");
      const controllerHandoff = recordStyleMasterAuthorizeCliHandoff(route.deck_dir, {
        runDir: route.run_dir,
        planHash: output.plan_sha256,
        grantHash: output.candidate_grant_sha256,
        workflow: output.workflow,
      });
      output = Object.freeze({ ...output, controller_handoff: controllerHandoff });
    } else if (operation === "generate") {
      output = await owner.generateStyleMasterCandidates({
        ...common,
        planSha256: planHash,
        initialize: initializeStyleMasterImage2Transport,
        submit: styleMasterSubmitFactory(),
      });
    } else if (operation === "review") {
      output = owner.projectStyleMasterCandidateReview(await owner.prepareStyleMasterCandidateReview({
        ...common,
        planSha256: planHash,
      }));
    } else if (operation === "accept") {
      output = await owner.acceptStyleMasterCandidateReview({
        ...common,
        planSha256: planHash,
        decision: opts.decision,
        candidateId: opts.candidateId || null,
      });
    } else {
      output = await owner.abandonStyleMasterCandidates({ ...common, planSha256: planHash, reason: opts.reason });
    }
    console.log(JSON.stringify(output, null, 2));
    return 0;
  } catch (error) {
    const failure = styleMasterFailure(operation, route, error);
    emitCliError({
      code: failure.code,
      message: failure.message,
      hint: failure.hint,
      where: `ppt_flow.style-master.${operation}`,
      diagnostic: failure.diagnostic,
    });
    return 1;
  }
}
// ---------------------------------------------------------------------------
