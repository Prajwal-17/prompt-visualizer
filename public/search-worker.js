let index;
let href;
self.onmessage = async ({ data }) => {
  const { query, request, asset } = data;
  try {
    if (typeof query !== "string" || typeof asset !== "string") return;
    const url = new URL(asset, self.location.origin);
    if (
      url.origin !== self.location.origin ||
      !url.pathname.startsWith("/data/reader/")
    )
      throw new Error("Invalid search asset.");
    if (href !== asset) {
      href = asset;
      index = fetch(url).then((response) => {
        if (!response.ok) throw new Error("Could not load the search index.");
        return response.json();
      });
    }
    const records = await index;
    const term = query.trim().toLowerCase();
    const matches = records
      .filter((record) => record.text.includes(term))
      .map((record) => record.id);
    self.postMessage({ request, matches });
  } catch {
    index = undefined;
    href = undefined;
    self.postMessage({
      request,
      error: "Full-text search unavailable. Showing title matches.",
    });
  }
};
