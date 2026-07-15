type PublicGalleryPage<T> = {
  success?: boolean;
  items?: T[];
  hasNextPage?: boolean;
  totalPages?: number;
};

/** Load the complete public catalogue without weakening the API's per-request cap. */
export async function fetchAllPublicGallery<T>(
  parameters: Record<string, string> = {},
): Promise<{ items: T[] }> {
  const collected = new Map<string, T>();
  for (let page = 1; page <= 100; page += 1) {
    const query = new URLSearchParams({
      ...parameters,
      limit: "50",
      page: String(page),
    });
    const response = await fetch(`/api/gallery?${query.toString()}`);
    if (!response.ok) throw new Error("The photographic catalogue is unavailable.");
    const data = (await response.json()) as PublicGalleryPage<T>;
    const items = Array.isArray(data.items) ? data.items : [];
    for (const item of items) {
      const id = (item as { id?: unknown }).id;
      if (typeof id === "string") collected.set(id, item);
    }
    if (!data.hasNextPage || page >= (data.totalPages || page)) {
      return { items: Array.from(collected.values()) };
    }
  }
  throw new Error("The catalogue is larger than the safe client retrieval window.");
}
