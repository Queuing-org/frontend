import { describe, expect, it } from "vitest";
import {
  getDefaultRoomImage,
  getRoomImageSrc,
  ROOM_CARD_IMAGE_VARIANTS,
  ROOM_HERO_IMAGE_VARIANTS,
} from "./getDefaultRoomImage";

const DEFAULT_ROOM_IMAGES = [
  "/room-defaults/queuing-default-thumbnail-coastal-tram-citypop-v2.png",
  "/room-defaults/queuing-default-thumbnail-conservatory-classical-v2.png",
  "/room-defaults/queuing-default-thumbnail-forest-rock-v2.png",
  "/room-defaults/queuing-default-thumbnail-jazz-cafe-v2.png",
  "/room-defaults/queuing-default-thumbnail-meadow-acoustic-v2.png",
  "/room-defaults/queuing-default-thumbnail-pastel-neon-rnb-v2.png",
  "/room-defaults/queuing-default-thumbnail-rainy-lofi-v2.png",
  "/room-defaults/queuing-default-thumbnail-retro-vinyl-cafe-v2.png",
  "/room-defaults/queuing-default-thumbnail-seaside-summer-pop-v2.png",
  "/room-defaults/queuing-default-thumbnail-starlight-animals-v2.png",
] as const;

describe("getDefaultRoomImage", () => {
  it("새 기본 방 썸네일 10장을 순서대로 반환한다", () => {
    expect(DEFAULT_ROOM_IMAGES.map((_, index) => getDefaultRoomImage(index))).toEqual(
      DEFAULT_ROOM_IMAGES,
    );
  });

  it("범위를 벗어난 seed를 10장 안에서 순환한다", () => {
    expect(getDefaultRoomImage(DEFAULT_ROOM_IMAGES.length)).toBe(
      DEFAULT_ROOM_IMAGES[0],
    );
    expect(getDefaultRoomImage(-1)).toBe(DEFAULT_ROOM_IMAGES.at(-1));
  });

  it("방 이미지가 없을 때 새 기본 썸네일을 사용한다", () => {
    expect(
      getRoomImageSrc({
        fallbackRoomSlug: "room-9f3a2b",
        thumbnailUrl: null,
        thumbnailUrls: null,
      }),
    ).toBe(DEFAULT_ROOM_IMAGES[5]);
  });

  it("같은 방 slug는 화면과 목록 위치에 관계없이 같은 기본 썸네일을 사용한다", () => {
    const lobbyImage = getRoomImageSrc({
      fallbackRoomSlug: "stable-room",
      preferredVariants: ROOM_CARD_IMAGE_VARIANTS,
      thumbnailUrl: null,
      thumbnailUrls: null,
    });
    const roomImage = getRoomImageSrc({
      fallbackRoomSlug: "stable-room",
      preferredVariants: ROOM_HERO_IMAGE_VARIANTS,
      thumbnailUrl: null,
      thumbnailUrls: null,
    });

    expect(lobbyImage).toBe(roomImage);
  });

  it("서버가 제공한 방 이미지를 기본 썸네일보다 우선한다", () => {
    expect(
      getRoomImageSrc({
        fallbackRoomSlug: "room-with-thumbnail",
        thumbnailUrl: "https://cdn.example.com/original.png",
        thumbnailUrls: {
          thumb256: "https://cdn.example.com/256.png",
          thumb384: "https://cdn.example.com/384.png",
          thumb640: "https://cdn.example.com/640.png",
          thumb828: "https://cdn.example.com/828.png",
          thumb1200: "https://cdn.example.com/1200.png",
        },
      }),
    ).toBe("https://cdn.example.com/640.png");
  });
});
