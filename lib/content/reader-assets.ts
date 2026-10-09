import type { Capture } from "./types";

export const sectionBatchSize = 8;
export function readerAssetHref(
  capture: Pick<Capture, "id" | "readerHash">,
  asset = "index",
) {
  return `/data/reader/${capture.id}.${capture.readerHash.slice(0, 12)}/${asset}.json`;
}
