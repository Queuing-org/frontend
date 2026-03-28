export function normalizeRoomSlug(slug: string) {
  const trimmedSlug = slug.trim();

  if (!trimmedSlug.includes("%")) {
    return trimmedSlug;
  }

  try {
    return decodeURIComponent(trimmedSlug).trim();
  } catch {
    return trimmedSlug;
  }
}
