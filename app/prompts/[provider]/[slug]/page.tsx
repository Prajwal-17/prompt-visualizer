import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Reader } from "@/components/reader";
import { catalog, findCapture } from "@/lib/content/catalog";
import { loadReader } from "@/lib/content/load";

type Props = { params: Promise<{ provider: string; slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return catalog.map((capture) => ({
    provider: capture.providerSlug,
    slug: capture.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { provider, slug } = await params;
  const capture = findCapture(provider, slug);
  return {
    title: capture?.title ?? "Capture not found",
    description: capture?.summary,
  };
}

export default async function PromptPage({ params }: Props) {
  const { provider, slug } = await params;
  const capture = findCapture(provider, slug);
  if (!capture) notFound();
  if (process.env.NEXT_PUBLIC_DEPLOY_TARGET !== "pages") await connection();
  const { document, initialBatch } = await loadReader(capture);
  return (
    <Reader
      key={capture.id}
      capture={capture}
      document={document}
      initialBatch={initialBatch}
    />
  );
}
