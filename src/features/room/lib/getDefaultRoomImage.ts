const DEFAULT_ROOM_IMAGES = [
  "/room-defaults/pl.jpg",
  "/room-defaults/qss.jpg",
  "/room-defaults/jz.jpg",
  "/room-defaults/chii.webp",
  "/room-defaults/jjh.jpg",
  "/room-defaults/nohong.png",
] as const;

export function getDefaultRoomImage(roomIndex: number) {
  const imageIndex =
    ((roomIndex % DEFAULT_ROOM_IMAGES.length) + DEFAULT_ROOM_IMAGES.length) %
    DEFAULT_ROOM_IMAGES.length;

  return DEFAULT_ROOM_IMAGES[imageIndex];
}

export function getRoomImageSrc(
  thumbnailUrl: string | null | undefined,
  fallbackSeed: number,
) {
  const normalizedThumbnailUrl = thumbnailUrl?.trim();

  return normalizedThumbnailUrl
    ? normalizedThumbnailUrl
    : getDefaultRoomImage(fallbackSeed);
}
