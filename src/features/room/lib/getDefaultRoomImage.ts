import type { ThumbnailUrls } from "../model/types";

const DEFAULT_ROOM_IMAGES = [
  "/room-defaults/queuing-default-thumbnail-citypop-night-drive.png",
  "/room-defaults/queuing-default-thumbnail-classical-library.png",
  "/room-defaults/queuing-default-thumbnail-hiphop-rnb-lounge.png",
  "/room-defaults/queuing-default-thumbnail-indie-sunset.png",
  "/room-defaults/queuing-default-thumbnail-jazz.png",
  "/room-defaults/queuing-default-thumbnail-live-rock.png",
  "/room-defaults/queuing-default-thumbnail-lofi-rain.png",
  "/room-defaults/queuing-default-thumbnail-retro-vinyl-funk.png",
  "/room-defaults/queuing-default-thumbnail-starlight-random.png",
  "/room-defaults/queuing-default-thumbnail-summer-pop-beach.png",
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
  fallbackRoomSlug: string;
  preferredVariants?: readonly (keyof ThumbnailUrls)[];
  thumbnailUrl?: string | null;
  thumbnailUrls?: ThumbnailUrls | null;
};

function getStableRoomImageIndex(roomSlug: string) {
  let hash = 0;

  for (let index = 0; index < roomSlug.length; index += 1) {
    hash += roomSlug.charCodeAt(index);
  }

  return hash;
}

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
  fallbackRoomSlug,
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
    getDefaultRoomImage(getStableRoomImageIndex(fallbackRoomSlug))
  );
}
