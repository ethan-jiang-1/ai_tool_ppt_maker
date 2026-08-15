function digest(token) {
  if (!/^[0-9a-f]$/.test(token || "")) {
    throw new TypeError("test provider-input digest token must be one hexadecimal character");
  }
  return token.repeat(64);
}

/** Build a minimal, opaque current provider-input lineage record for tests. */
export function pageImageProviderInputBinding({ workflow = "pure", compiled = "1", pageDesignSystem = null } = {}) {
  if (!['framed', 'pure'].includes(workflow)) {
    throw new TypeError("test provider-input binding workflow must be framed | pure");
  }
  if (pageDesignSystem !== null && !/^[0-9a-f]$/.test(pageDesignSystem || "")) {
    throw new TypeError("test Page Design System digest token must be one hexadecimal character or null");
  }
  return Object.freeze({
    compiled_provider_input_sha256: digest(compiled),
    provider_content_sha256: digest("2"),
    visual_selection_sha256: digest("3"),
    style_master_selection_sha256: digest("4"),
    generation_profile_sha256: digest("5"),
    header_policy_sha256: digest("6"),
    page_presentation_sha256: digest("9"),
    page_design_system_sha256: pageDesignSystem === null ? null : digest(pageDesignSystem),
    local_header_profile_sha256: workflow === "framed" ? digest("7") : null,
    protected_composition_sha256: workflow === "framed" ? digest("8") : null,
  });
}
