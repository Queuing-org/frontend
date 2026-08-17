import { describe, expect, it } from "vitest";
import {
  getDefaultRoomImage,
  getRoomImageSrc,
  getRoomThumbnailSrc,
  ROOM_CARD_IMAGE_VARIANTS,
  ROOM_HERO_IMAGE_VARIANTS,
} from "./getDefaultRoomImage";

const DEFAULT_ROOM_IMAGE =
  "/room-defaults/queuing-empty-room-thumbnail.jpg";

describe("getDefaultRoomImage", () => {
  it("빈 방용 단일 기본 이미지를 반환한다", () => {
    expect(getDefaultRoomImage()).toBe(DEFAULT_ROOM_IMAGE);
  });

  it("현재 곡 이미지가 없을 때 빈 방 기본 썸네일을 사용한다", () => {
    expect(
      getRoomImageSrc({
        thumbnailUrl: null,
        thumbnailUrls: null,
      }),
    ).toBe(DEFAULT_ROOM_IMAGE);
    expect(
      getRoomThumbnailSrc({ thumbnailUrl: null, thumbnailUrls: null }),
    ).toBeNull();
  });

  it("목록과 방 내부에서 같은 빈 방 기본 썸네일을 사용한다", () => {
    const lobbyImage = getRoomImageSrc({
      preferredVariants: ROOM_CARD_IMAGE_VARIANTS,
      thumbnailUrl: null,
      thumbnailUrls: null,
    });
    const roomImage = getRoomImageSrc({
      preferredVariants: ROOM_HERO_IMAGE_VARIANTS,
      thumbnailUrl: null,
      thumbnailUrls: null,
    });

    expect(lobbyImage).toBe(roomImage);
  });

  it("서버가 제공한 방 이미지를 기본 썸네일보다 우선한다", () => {
    expect(
      getRoomImageSrc({
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
