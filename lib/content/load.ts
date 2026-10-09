import { readerIndexSchema, sectionBatchSchema } from "./schema";
import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { type Capture } from "./types";
import { readerAssetHref } from "./reader-assets";

async function loadAsset(capture: Capture, asset: string) {
  let assets: { fetch(request: Request): Promise<Response> } | undefined;
  if (process.env.NEXT_PUBLIC_DEPLOY_TARGET !== "pages") {
    try {
      const context = getCloudflareContext();
      assets = (context.env as unknown as { ASSETS?: typeof assets }).ASSETS;
    } catch {
      // Plain Next.js development/production servers read local generated assets.
      // A Cloudflare context, if present, must use its asset binding successfully.
    }
  }
  let payload: unknown;
  if (assets) {
    const response = await assets.fetch(
      new Request(`https://assets.internal${readerAssetHref(capture, asset)}`),
    );
    if (!response.ok)
      throw new Error(
        `Document asset unavailable: ${capture.id} (${response.status})`,
      );
    payload = await response.json();
  } else {
    payload = JSON.parse(
      await readFile(
        path.join(process.cwd(), "public", readerAssetHref(capture, asset)),
        "utf8",
      ),
    );
  }
  return payload;
}
export async function loadReader(capture: Capture) {
  const [index, batch] = await Promise.all([
    loadAsset(capture, "index"),
    loadAsset(capture, "batch-0"),
  ]);
  const document = readerIndexSchema.parse(index);
  const initialBatch = sectionBatchSchema.parse(batch);
  if (
    document.id !== capture.id ||
    document.sha256 !== capture.sha256 ||
    initialBatch.id !== capture.id ||
    initialBatch.sha256 !== capture.sha256
  )
    throw new Error(`Document identity mismatch: ${capture.id}`);
  return { document, initialBatch };
}
