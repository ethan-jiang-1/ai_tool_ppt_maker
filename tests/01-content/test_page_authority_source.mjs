import { describe, expect, it } from "vitest";
import {
  PAGE_AUTHORITY_SOURCE_V2_RECEIPT_SCHEMA,
  PageAuthoritySourceError,
  parsePageAuthoritySource,
} from "../../PPTMAKER_FRAMEWORK/scripts/01-content/index.mjs";

const registry = Object.freeze({
  resolveSelection: () => Object.freeze({}),
});

function source({ workflow = "framed", extra = "" } = {}) {
  return `---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v2
  workflow: ${workflow}
---

## Slide 01: \`DeckGo\`

**TITLE**: A current source
${extra}
**VISUAL BRIEF**:
\`\`\`yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
\`\`\`
`;
}

describe("v2 Page Authority source", () => {
  it("publishes one workflow-bound receipt", () => {
    const receipt = parsePageAuthoritySource(source({ workflow: "pure" }), { registry });
    expect(receipt).toMatchObject({
      schema: PAGE_AUTHORITY_SOURCE_V2_RECEIPT_SCHEMA,
      pipeline: "page-authority-image2-v2",
      workflow: "pure",
      slides: [{ slide_id: "DeckGo", workflow: "pure" }],
    });
  });

  it("rejects retired per-slide authority before a receipt exists", () => {
    expect(() => parsePageAuthoritySource(source({ extra: "**PAGE AUTHORITY**: framed-image2\n" })))
      .toThrow(PageAuthoritySourceError);
  });

  it("rejects a non-v2 marker", () => {
    expect(() => parsePageAuthoritySource(source().replace("page-authority-image2-v2", "unsupported-pipeline")))
      .toThrow(PageAuthoritySourceError);
  });

  it("parses VISUAL SCENE as an optional inline field", () => {
    const receipt = parsePageAuthoritySource(source({ workflow: "pure", extra: "**VISUAL SCENE**: a calm shared work setting\n" }), { registry });
    expect(receipt.slides[0].visual_scene).toBe("a calm shared work setting");
  });

  it("defaults visual_scene to null when VISUAL SCENE is absent", () => {
    const receipt = parsePageAuthoritySource(source({ workflow: "pure" }), { registry });
    expect(receipt.slides[0].visual_scene).toBeNull();
  });

  it("rejects an empty VISUAL SCENE field", () => {
    expect(() => parsePageAuthoritySource(source({ workflow: "pure", extra: "**VISUAL SCENE**:\n" }), { registry }))
      .toThrow(PageAuthoritySourceError);
  });

  it("rejects duplicate VISUAL SCENE fields", () => {
    expect(() => parsePageAuthoritySource(source({ workflow: "pure", extra: "**VISUAL SCENE**: first scene\n**VISUAL SCENE**: second scene\n" }), { registry }))
      .toThrow(PageAuthoritySourceError);
  });

  it("parses BODY as an optional inline field and defaults to null", () => {
    const withBody = parsePageAuthoritySource(source({ workflow: "pure", extra: "**BODY**: 两个东西让 AI 学编程比别的都快\n" }), { registry });
    expect(withBody.slides[0].body).toBe("两个东西让 AI 学编程比别的都快");
    const without = parsePageAuthoritySource(source({ workflow: "pure" }), { registry });
    expect(without.slides[0].body).toBeNull();
  });
});
