export const MAX_ROOM_TAG_FILTERS = 3;

export function normalizeRoomTagSlugs(tags: readonly string[] | undefined) {
  if (!tags) {
    return [];
  }

  return Array.from(
    new Set(tags.map((tag) => tag.trim()).filter(Boolean)),
  )
    .slice(0, MAX_ROOM_TAG_FILTERS)
    .sort((left, right) => left.localeCompare(right));
}
