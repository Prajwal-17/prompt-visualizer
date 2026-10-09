"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener("prompt-url-change", callback);
  window.addEventListener("hashchange", callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener("prompt-url-change", callback);
    window.removeEventListener("hashchange", callback);
  };
}

export function useSectionHash() {
  return useSyncExternalStore(
    subscribe,
    () => window.location.hash.slice(1),
    () => "",
  );
}

export function useQueryParam(key: string, fallback = "") {
  const search = useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => "",
  );
  return new URLSearchParams(search).get(key) ?? fallback;
}

export function updateQuery(
  values: Record<string, string | null>,
  hash?: string,
) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(values)) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  if (hash !== undefined) url.hash = hash;
  window.history.replaceState(null, "", url);
  window.dispatchEvent(new Event("prompt-url-change"));
  if (hash !== undefined) window.dispatchEvent(new Event("hashchange"));
}
