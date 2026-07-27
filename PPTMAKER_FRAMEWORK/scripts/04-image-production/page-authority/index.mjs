import { finalizePage } from "./finalizer.mjs";

export const PAGE_AUTHORITY_IMAGE2_ADAPTER = "page-authority-image2";

/** Closed adapter surface: Page Authority finalization only. */
export function createPageAuthorityImage2Adapter() {
  return Object.freeze({ id: PAGE_AUTHORITY_IMAGE2_ADAPTER, finalizePage });
}

export { finalizePage };
