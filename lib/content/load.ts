import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { documentSchema, dataHref, type Capture } from "./types";

export async function loadDocument(capture: Capture) {
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
      new Request(`https://assets.internal${dataHref(capture)}`),
    );
    if (!response.ok)
      throw new Error(
        `Document asset unavailable: ${capture.id} (${response.status})`,
      );
    payload = await response.json();
  } else {
    payload = JSON.parse(
      await readFile(
        path.join(process.cwd(), "public", dataHref(capture)),
        "utf8",
      ),
    );
  }
  const document = documentSchema.parse(payload);
  if (document.id !== capture.id || document.sha256 !== capture.sha256)
    throw new Error(`Document identity mismatch: ${capture.id}`);
  return document;
}
