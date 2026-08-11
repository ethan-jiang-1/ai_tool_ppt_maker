import { describe, expect, it } from "vitest";
import {
  PAGE_IMAGE_WORKFLOW_SOURCE_RECEIPT_SCHEMA,
  PageImageSourceError,
  parsePageImageSource,
} from "../../ppt_maker_harness/scripts/01-content/index.mjs";

const registry = Object.freeze({
  resolveSelection: (context) => Object.freeze({
    projection: Object.freeze({ workflow: context.workflow }),
    provider_clauses: Object.freeze({}),
  }),
});

const DEFAULT_BODY = `items:
  - role: metric
    literal: "92%"
  - role: supporting_copy
    literal: "A practical service promise"
    copy_policy: presentation_adaptable`;

const DEFAULT_VISUAL = `recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo`;

function slide({
  id = "DeckGo",
  number = 1,
  title = "A current source",
  workflow = "framed",
  bodyYaml = DEFAULT_BODY,
  visualYaml = DEFAULT_VISUAL,
  extra = "",
} = {}) {
  return `## Slide ${String(number).padStart(2, "0")}: \`${id}\`

**KICKER**: Operations
**TITLE**: ${title}
**SUBTITLE**: A concise premise
${extra}${bodyYaml === null ? "" : `**SLIDE BODY**:
\`\`\`yaml
${bodyYaml}
\`\`\`
`}**VISUAL BRIEF**:
\`\`\`yaml
${visualYaml}
\`\`\`
`;
}

function source({ workflow = "framed", slides = null } = {}) {
  const slideSpecs = slides || [slide({ workflow })];
  return `---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: ${workflow}
---

${slideSpecs.join("\n")}`;
}

function issueCodes(error) {
  return error.issues.map((issue) => issue.code);
}

function parseError(value) {
  try {
    parsePageImageSource(value, { registry });
  } catch (error) {
    expect(error).toBeInstanceOf(PageImageSourceError);
    return error;
  }
  throw new Error("expected PageImageSourceError");
}

describe("Page Image Workflow source", () => {
  it("publishes one homogeneous workflow-bound receipt with ordered stable IDs", () => {
    const receipt = parsePageImageSource(source({
      slides: [
        slide({ id: "DeckGo", number: 1, workflow: "framed" }),
        slide({ id: "LineUp", number: 2, workflow: "framed", title: "A second source" }),
      ],
    }), { registry });

    expect(receipt).toMatchObject({
      schema: PAGE_IMAGE_WORKFLOW_SOURCE_RECEIPT_SCHEMA,
      pipeline: "page-image-workflow",
      workflow: "framed",
      slides: [
        { slide_id: "DeckGo", position: 1, page_class: "standard" },
        { slide_id: "LineUp", position: 2, page_class: "standard" },
      ],
    });
    for (const item of receipt.slides) {
      expect(item).not.toHaveProperty("workflow");
      expect(item).not.toHaveProperty("display");
      expect(item).not.toHaveProperty("text_frame");
    }
  });

  it("requires the current mnemonic identity before receipt creation", () => {
    const withoutIdentity = source().replace("identity:\n  scheme: mnemonic\n", "");
    const nonMnemonicId = source({ slides: [slide({ id: "s01_problem" })] });

    expect(issueCodes(parseError(withoutIdentity))).toContain("current_identity_required");
    expect(issueCodes(parseError(nonMnemonicId))).toContain("invalid_mnemonic_id");
  });

  it("normalizes the closed Provider Content Schema without changing literals", () => {
    const receipt = parsePageImageSource(source(), { registry });
    expect(receipt.slides[0].provider_content).toEqual({
      items: [
        { role: "metric", literal: "92%", copy_policy: "exact" },
        {
          role: "supporting_copy",
          literal: "A practical service promise",
          copy_policy: "presentation_adaptable",
        },
      ],
    });
    expect(Object.isFrozen(receipt.slides[0].provider_content.items[0])).toBe(true);
  });

  it("keeps Framed header literals local and provider context-not-to-render", () => {
    const receipt = parsePageImageSource(source(), { registry });
    expect(receipt.slides[0].header_policy).toEqual({
      local_header: {
        kicker: "Operations",
        title: "A current source",
        subtitle: "A concise premise",
      },
      context_not_to_render: {
        kicker: "Operations",
        title: "A current source",
        subtitle: "A concise premise",
      },
    });
  });

  it("keeps Pure header literals provider-visible and rejects the retired Framed selector", () => {
    const pureReceipt = parsePageImageSource(source({ workflow: "pure" }), { registry });
    expect(pureReceipt.slides[0].header_policy).toEqual({
      provider_visible: {
        kicker: "Operations",
        title: "A current source",
        subtitle: "A concise premise",
      },
    });

    const error = parseError(source({
      workflow: "pure",
      slides: [slide({ workflow: "pure", extra: "**FRAME PRESET**: standard\n" })],
    }));
    expect(issueCodes(error)).toContain("unsupported_page_image_field");
    expect(error.issues.find((issue) => issue.code === "unsupported_page_image_field").subject.field).toBe("FRAME PRESET");
  });

  it("requires an explicit Framed title but no obsolete preset", () => {
    const withoutTitle = source().replace("**TITLE**: A current source\n", "");
    expect(issueCodes(parseError(withoutTitle))).toContain("missing_framed_title");
  });

  it("normalizes an omitted PAGE CLASS to standard and passes an explicit class to the resolver", () => {
    const contexts = [];
    const receipt = parsePageImageSource(source({
      slides: [slide({ extra: "**PAGE CLASS**: opening\n" })],
    }), {
      registry: {
        resolveSelection(context) {
          contexts.push(context);
          return registry.resolveSelection(context);
        },
      },
    });

    expect(receipt.slides[0].page_class).toBe("opening");
    expect(contexts[0]).toMatchObject({ workflow: "framed", page_class: "opening" });
    expect(parsePageImageSource(source(), { registry }).slides[0].page_class).toBe("standard");
  });

  it("rejects invalid or repeated PAGE CLASS before receipt creation", () => {
    const unknown = source({ slides: [slide({ extra: "**PAGE CLASS**: hero\n" })] });
    const repeated = source({ slides: [slide({ extra: "**PAGE CLASS**: opening\n**PAGE CLASS**: closing\n" })] });

    expect(issueCodes(parseError(unknown))).toContain("invalid_page_image_enum");
    expect(issueCodes(parseError(repeated))).toContain("duplicate_page_image_field");
  });

  it("rejects invalid Provider Content roles, policies, sizes, and item counts", () => {
    const invalidRole = source({ slides: [slide({ bodyYaml: "items:\n  - role: unbounded\n    literal: hello" })] });
    const adaptableMetric = source({ slides: [slide({ bodyYaml: "items:\n  - role: metric\n    literal: 92%\n    copy_policy: presentation_adaptable" })] });
    const tooManyItems = source({ slides: [slide({ bodyYaml: `items:\n${Array.from({ length: 9 }, (_, index) => `  - role: body\n    literal: item ${index + 1}`).join("\n")}` })] });
    const longLiteral = source({ slides: [slide({ bodyYaml: `items:\n  - role: body\n    literal: "${"a".repeat(241)}"` })] });

    expect(issueCodes(parseError(invalidRole))).toContain("invalid_provider_content_role");
    expect(issueCodes(parseError(adaptableMetric))).toContain("provider_content_adaptation_role_forbidden");
    expect(issueCodes(parseError(tooManyItems))).toContain("slide_body_item_limit_exceeded");
    expect(issueCodes(parseError(longLiteral))).toContain("invalid_provider_content_literal");
  });

  it("limits adaptable supporting copy to two items", () => {
    const bodyYaml = `items:
  - role: supporting_copy
    literal: one
    copy_policy: presentation_adaptable
  - role: supporting_copy
    literal: two
    copy_policy: presentation_adaptable
  - role: supporting_copy
    literal: three
    copy_policy: presentation_adaptable`;
    expect(issueCodes(parseError(source({ slides: [slide({ bodyYaml })] })))).toContain("provider_content_adaptation_limit_exceeded");
  });

  it("rejects free-form, local-layout, and YAML-indirection ingress before receipt creation", () => {
    const inlineBody = source({ slides: [slide({ extra: "**BODY**: A free-form escape hatch\n" })] });
    const displayCallout = source({ slides: [slide({ extra: "**CALLOUT**: A local display field\n" })] });
    const prompt = source({ slides: [slide({ extra: "**IMAGE PROMPT**: Draw whatever is needed\n" })] });
    const coordinate = source({ slides: [slide({ extra: "**X**: 12\n" })] });
    const alias = source({ slides: [slide({ bodyYaml: "items: &items\n  - role: body\n    literal: hello" })] });
    const unknownItemKey = source({ slides: [slide({ bodyYaml: "items:\n  - role: body\n    literal: hello\n    render: local" })] });

    for (const [value, code] of [
      [inlineBody, "prohibited_page_image_ingress"],
      [displayCallout, "prohibited_page_image_ingress"],
      [prompt, "prohibited_page_image_ingress"],
      [coordinate, "prohibited_page_image_ingress"],
      [alias, "invalid_slide_body_mapping"],
      [unknownItemKey, "unknown_slide_body_item_key"],
    ]) {
      expect(issueCodes(parseError(value))).toContain(code);
    }
  });

  it("rejects per-slide policy, hybrid, and undeclared protocol ingress before a receipt exists", () => {
    const perSlide = source({ slides: [slide({ extra: "**WORKFLOW**: pure\n" })] });
    const hybrid = source().replace("workflow: framed", "workflow: hybrid");
    const undeclared = source().replace("page-image-workflow", "unrecognized-image2");

    expect(issueCodes(parseError(perSlide))).toContain("prohibited_page_image_ingress");
    expect(parseError(hybrid).issues[0].code).toBe("invalid_page_image_workflow");
    expect(parseError(undeclared).issues[0]).toMatchObject({
      code: "unsupported_pipeline_marker",
      actual: "unrecognized-image2",
      expected: "page-image-workflow",
    });
  });

  it("rejects visual clauses that make an integrated page text-free", () => {
    const textFreeVisual = source({
      slides: [slide({ visualYaml: DEFAULT_VISUAL.replace("  - no-logo", "  - no-readable-text") })],
    });
    const error = parseError(textFreeVisual);
    expect(issueCodes(error)).toContain("forbidden_text_free_visual_clause");
    expect(error.issues.find((issue) => issue.code === "forbidden_text_free_visual_clause").subject.field).toBe("VISUAL BRIEF");
  });
});
