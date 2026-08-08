import { formatPageImageOrdinal } from "../../shared/image2/page_image_artifacts.mjs";

function footerOptions() {
  // pptxgenjs normalizes this object in place, so each footer needs a fresh one.
  return {
    x: 12.4,
    y: 7.06,
    w: 0.68,
    h: 0.26,
    align: "center",
    valign: "mid",
    margin: 0,
    fit: "shrink",
    fontFace: "Arial",
    fontSize: 9,
    bold: true,
    color: "FFFFFF",
    fill: { color: "111827", transparency: 35 },
    line: { color: "111827", transparency: 100 },
  };
}

/** Add the fixed current-position annotation after a Page Image slide image. */
export function addPageImageOrdinalFooter(slide, position) {
  if (!slide || typeof slide.addText !== "function") {
    throw new Error("Page Image footer requires a PPTX slide");
  }
  slide.addText(formatPageImageOrdinal(position), footerOptions());
}
