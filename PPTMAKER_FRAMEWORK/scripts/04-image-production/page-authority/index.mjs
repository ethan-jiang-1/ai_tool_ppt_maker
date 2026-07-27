import { finalizePage } from "./finalizer.mjs";

export const PAGE_AUTHORITY_IMAGE2_ADAPTER = "page-authority-image2";

/** Closed adapter surface. No header-lock, HTML, visual-slot, or renderer selector leaks through it. */
export function createPageAuthorityImage2Adapter() {
  return Object.freeze({ id: PAGE_AUTHORITY_IMAGE2_ADAPTER, finalizePage });
}

export { finalizePage };
