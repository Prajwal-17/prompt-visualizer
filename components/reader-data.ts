import { readerAssetHref } from "@/lib/content/reader-assets";
import { rawHref, type Capture, type SectionBatch } from "@/lib/content/types";

const batches = new Map<string, Promise<SectionBatch>>();
const originals = new Map<string, Promise<string>>();
function cached<T>(
  cache: Map<string, Promise<T>>,
  key: string,
  load: () => Promise<T>,
  limit: number,
) {
  const existing = cache.get(key);
  if (existing) return existing;
  const promise = load().catch((error) => {
    if (cache.get(key) === promise) cache.delete(key);
    throw error;
  });
  cache.set(key, promise);
  if (cache.size > limit) cache.delete(cache.keys().next().value!);
  return promise;
}
export function loadSectionBatch(capture: Capture, asset: string) {
  const href = readerAssetHref(capture, asset);
  return cached(
    batches,
    href,
    async () => {
      const response = await fetch(href);
      if (!response.ok)
        throw new Error(`Section unavailable (${response.status}).`);
      const payload: unknown = await response.json();
      // Schemas live in a separate chunk and are loaded only when an asset is read.
      const { sectionBatchSchema } = await import("@/lib/content/schema");
      const batch = sectionBatchSchema.parse(payload);
      if (batch.id !== capture.id || batch.sha256 !== capture.sha256)
        throw new Error("Section identity mismatch.");
      return batch;
    },
    24,
  );
}
export function loadOriginal(capture: Capture) {
  return cached(
    originals,
    rawHref(capture),
    async () => {
      const response = await fetch(rawHref(capture));
      if (!response.ok)
        throw new Error(`Original source unavailable (${response.status}).`);
      return response.text();
    },
    3,
  );
}
