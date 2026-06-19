import type { ThumbnailUrls } from "../model/types";

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

export const ROOM_CARD_IMAGE_VARIANTS = [
  "thumb256",
  "thumb384",
  "thumb640",
  "small",
  "medium",
] as const;

export const ROOM_STAGE_IMAGE_VARIANTS = [
  "thumb828",
  "thumb1200",
  "thumb640",
  "thumb384",
  "large",
  "medium",
] as const;

export const ROOM_HERO_IMAGE_VARIANTS = [
  "thumb1200",
  "thumb828",
  "thumb640",
  "large",
  "medium",
] as const;

const DEFAULT_ROOM_IMAGE_VARIANTS = [
  "thumb640",
  "thumb828",
  "thumb384",
  "thumb1200",
  "thumb256",
  "medium",
  "large",
  "small",
  "original",
] as const;

type GetRoomImageSrcParams = {
  fallbackSeed: number;
  preferredVariants?: readonly string[];
  thumbnailUrl?: string | null;
  thumbnailUrls?: ThumbnailUrls | null;
};

function normalizeImageUrl(imageUrl: string | null | undefined) {
  const normalizedImageUrl = imageUrl?.trim();

  return normalizedImageUrl ? normalizedImageUrl : null;
}

function getRoomThumbnailVariantUrl(
  thumbnailUrls: ThumbnailUrls | null | undefined,
  preferredVariants: readonly string[],
) {
  if (!thumbnailUrls) {
    return null;
  }

  for (const variant of preferredVariants) {
    const imageUrl = normalizeImageUrl(thumbnailUrls[variant]);

    if (imageUrl) {
      return imageUrl;
    }
  }

  return null;
}

export function getRoomImageSrc({
  fallbackSeed,
  preferredVariants = DEFAULT_ROOM_IMAGE_VARIANTS,
  thumbnailUrl,
  thumbnailUrls,
}: GetRoomImageSrcParams) {
  const variantImageUrl = getRoomThumbnailVariantUrl(
    thumbnailUrls,
    preferredVariants,
  );
  const normalizedThumbnailUrl = normalizeImageUrl(thumbnailUrl);

  return (
    variantImageUrl ?? normalizedThumbnailUrl ?? getDefaultRoomImage(fallbackSeed)
  );
}
