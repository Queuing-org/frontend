import { describe, expect, it } from "vitest";
import { getDefaultRoomImage, getRoomImageSrc } from "./getDefaultRoomImage";

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
        fallbackSeed: 3,
        thumbnailUrl: null,
        thumbnailUrls: null,
      }),
    ).toBe(DEFAULT_ROOM_IMAGES[3]);
  });

  it("서버가 제공한 방 이미지를 기본 썸네일보다 우선한다", () => {
    expect(
      getRoomImageSrc({
        fallbackSeed: 0,
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
