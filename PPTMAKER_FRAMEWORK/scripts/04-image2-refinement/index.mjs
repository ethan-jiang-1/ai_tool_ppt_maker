export {
  ATTEMPT_STATES,
  REFINEMENT_AUTHORIZATION_SCHEMA,
  REFINEMENT_ATTEMPT_SCHEMA,
  REFINEMENT_CANDIDATE_SCHEMA,
  REFINEMENT_PLAN_SCHEMA,
  REFINEMENT_PROVENANCE_SCHEMA,
  REFINEMENT_REVIEW_SCHEMA,
  REFINEMENT_STATE_SCHEMA,
  REVIEW_DECISIONS,
  RefinementContractError,
  authorizePlan,
  buildPlan,
  canonicalPlanPayload,
  createCandidateRecord,
  createReviewRecord,
  isSha256,
  isSafeRefinementId,
  recommendRefinementSlides,
  safeProfileFingerprint,
  sha256,
  transitionAttempt,
  validateAttempt,
  validatePlanInput,
  validateRefinementEligibility,
} from "./internal/contracts.mjs";
export async function loadRefinementOperations() {
  return import("./internal/application.mjs");
}

async function operations() { return loadRefinementOperations(); }
export async function recommendRefinement(...args) { return (await operations()).recommendRefinement(...args); }
export async function createRefinementPlan(...args) { return (await operations()).createRefinementPlan(...args); }
export async function authorizeRefinement(...args) { return (await operations()).authorizeRefinement(...args); }
export async function generateRefinement(...args) { return (await operations()).generateRefinement(...args); }
export async function reconcileRefinementAttempt(...args) { return (await operations()).reconcileRefinementAttempt(...args); }
export async function resolveUnknownSubmit(...args) { return (await operations()).resolveUnknownSubmit(...args); }
export async function composeCandidateReview(...args) { return (await operations()).composeCandidateReview(...args); }
export async function acceptRefinementCandidate(...args) { return (await operations()).acceptRefinementCandidate(...args); }
export async function useHtmlRefinement(...args) { return (await operations()).useHtmlRefinement(...args); }
export async function cleanupRefinementEvidence(...args) { return (await operations()).cleanupRefinementEvidence(...args); }
export async function declineRefinement(...args) { return (await operations()).declineRefinement(...args); }
export async function recoverRefinementPromotion(...args) { return (await operations()).recoverRefinementPromotion(...args); }
export async function enterRefinementController(...args) { return (await operations()).enterRefinementController(...args); }
export async function completeRefinementController(...args) { return (await operations()).completeRefinementController(...args); }

// Descriptive aliases retained for MD-controller adapters and integrations.
export const buildRefinementPlan = createRefinementPlan;
export const authorizeRefinementPlan = authorizeRefinement;
export const executeRefinementAttempt = generateRefinement;
export const reconcileAttempt = reconcileRefinementAttempt;
export const reviewCandidate = composeCandidateReview;
export const acceptCandidate = acceptRefinementCandidate;
export const keepHtml = useHtmlRefinement;
export const cleanup = cleanupRefinementEvidence;
