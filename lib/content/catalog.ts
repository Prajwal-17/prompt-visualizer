import data from "@/content/generated/catalog.json";
import type { Capture } from "./types";

export const catalog = data as Capture[];
export const providers = [
  ...new Set(catalog.map((capture) => capture.provider)),
];
export const featured = catalog.filter((capture) => capture.featured);

export function familyKey(capture: Capture) {
  return `${capture.provider}/${capture.product}/${capture.title}`;
}
export function captureVariants(capture: Capture) {
  return catalog.filter((item) => familyKey(item) === familyKey(capture));
}
export const families = [
  ...new Map(catalog.map((capture) => [familyKey(capture), capture])).values(),
].map((capture) => {
  const variants = captureVariants(capture);
  return {
    key: familyKey(capture),
    variants,
    primary: variants.find((item) => item.variant === "runtime") ?? variants[0],
  };
});

export function findCapture(provider: string, slug: string) {
  return catalog.find(
    (capture) => capture.providerSlug === provider && capture.slug === slug,
  );
}
