import { writeFileSync } from "node:fs";

import { image2ProviderProfileAsset } from "../../ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs";
import {
  createStyleMasterGenerationProfile,
  styleMasterGenerationProfileSha256,
} from "../../ppt_maker_harness/scripts/shared/image2/style_master_schema.mjs";

const TEST_PROFILE_SHA256 = "a".repeat(64);

export function confirmedImage2ProviderProfileSource({
  profileId = "test-image2-profile",
  endpointProfile = "test-image2-endpoint",
  styleMasterRouteId = "test-style-master-route",
  styleMasterModel = "test-style-master-model",
  pageImageRouteId = "test-page-image-route",
  pageImageModel = "test-page-image-model",
  styleMasterBudget = { limit: 32768, unit: "utf8-bytes" },
  pageImageBudget = { limit: 32768, unit: "utf8-bytes" },
  pageImageTransport = null,
} = {}) {
  const transportYaml = pageImageTransport
    ? [
        "    transport:",
        `      http_operation: ${pageImageTransport.http_operation}`,
        `      encoding: ${pageImageTransport.encoding}`,
        `      width: ${pageImageTransport.width}`,
        `      height: ${pageImageTransport.height}`,
        `      dimension_multiple: ${pageImageTransport.dimension_multiple}`,
        `      completion: ${pageImageTransport.completion}`,
      ]
    : [];
  return [
    "schema: pptmaker-image2-provider-profile",
    `profile_id: ${profileId}`,
    `endpoint_profile: ${endpointProfile}`,
    "owner_declaration:",
    "  authority: deck-author",
    "  status: confirmed",
    "operations:",
    "  style-master-text-generation:",
    `    route_id: ${styleMasterRouteId}`,
    `    model: ${styleMasterModel}`,
    "    prompt_budget:",
    `      limit: ${styleMasterBudget.limit}`,
    `      unit: ${styleMasterBudget.unit}`,
    "  page-image-reference-generation:",
    `    route_id: ${pageImageRouteId}`,
    `    model: ${pageImageModel}`,
    "    prompt_budget:",
    `      limit: ${pageImageBudget.limit}`,
    `      unit: ${pageImageBudget.unit}`,
    ...transportYaml,
    "",
  ].join("\n");
}

export function writeConfirmedImage2ProviderProfile(runDir, options = {}) {
  const path = image2ProviderProfileAsset(runDir);
  writeFileSync(path, confirmedImage2ProviderProfileSource(options), "utf8");
  return path;
}

export function testStyleMasterGenerationProfile({
  profileId = "test-image2-profile",
  profileSha256 = TEST_PROFILE_SHA256,
  endpointProfile = "test-image2-endpoint",
  model = "test-style-master-model",
  routeId = "test-style-master-route",
  promptBudget = { limit: 32768, unit: "utf8-bytes" },
} = {}) {
  return createStyleMasterGenerationProfile({
    profile_id: profileId,
    profile_sha256: profileSha256,
    endpoint_profile: endpointProfile,
    route_id: routeId,
    operation: "style-master-text-generation",
    model,
    prompt_budget: promptBudget,
  });
}

export function testStyleMasterGenerationProfileSha256(options = {}) {
  return styleMasterGenerationProfileSha256(testStyleMasterGenerationProfile(options));
}
