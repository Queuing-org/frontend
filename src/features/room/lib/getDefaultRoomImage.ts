import type { ThumbnailUrls } from "../model/types";

const DEFAULT_ROOM_IMAGE =
  "/room-defaults/queuing-empty-room-thumbnail.jpg";

export function getDefaultRoomImage() {
  return DEFAULT_ROOM_IMAGE;
}

export function isQueuingDefaultRoomImage(
  imageSrc: string | null | undefined,
) {
  return normalizeImageUrl(imageSrc) === DEFAULT_ROOM_IMAGE;
}

export const ROOM_CARD_IMAGE_VARIANTS = [
  "thumb256",
  "thumb384",
  "thumb640",
] as const;

export const ROOM_STAGE_IMAGE_VARIANTS = [
  "thumb828",
  "thumb1200",
  "thumb640",
  "thumb384",
] as const;

export const ROOM_HERO_IMAGE_VARIANTS = [
  "thumb1200",
  "thumb828",
  "thumb640",
] as const;

const DEFAULT_ROOM_IMAGE_VARIANTS = [
  "thumb640",
  "thumb828",
  "thumb384",
  "thumb1200",
  "thumb256",
] as const;

type GetRoomImageSrcParams = {
  preferredVariants?: readonly (keyof ThumbnailUrls)[];
  thumbnailUrl?: string | null;
  thumbnailUrls?: ThumbnailUrls | null;
};

function normalizeImageUrl(imageUrl: string | null | undefined) {
  const normalizedImageUrl = imageUrl?.trim();

  return normalizedImageUrl ? normalizedImageUrl : null;
}

function getRoomThumbnailVariantUrl(
  thumbnailUrls: ThumbnailUrls | null | undefined,
  preferredVariants: readonly (keyof ThumbnailUrls)[],
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
    variantImageUrl ??
    normalizedThumbnailUrl ??
    getDefaultRoomImage()
  );
}
