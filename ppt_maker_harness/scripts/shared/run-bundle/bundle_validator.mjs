/**
 * bundle_validator.mjs — re-export hub for run-bundle constitution validation.
 *
 * Re-exports validator functions from bundle_layout.mjs. Consumers that only
 * need validation can import from this file instead of the larger SSOT module.
 *
 * Authority: openspec/specs/run-bundle-layout/spec.md
 * Authority: openspec/specs/run-bundle-management/spec.md
 */

export {
    normalizeCheckMode,
    checkStyleMasterLocalPng,
    checkStyleMasterHistoryLayout,
    checkProgressivePageProductionHistoryLayout,
    checkDeckRootControls,
    checkBundle,
    checkStagedVersion,
    selfCheck,
} from "./bundle_layout.mjs";