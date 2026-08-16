import { describe, expect, it } from "vitest";
import {
  getRoomChatDensity,
  getRoomChatLayout,
  ROOM_CHAT_SUPPORTED_MIN_HEIGHT,
} from "./roomChatLayout";

const representativeViewports = [
  { height: 2160, width: 3840 },
  { height: 1440, width: 2560 },
  { height: 1080, width: 1920 },
  { height: 960, width: 1536 },
  { height: 864, width: 1536 },
  { height: 768, width: 1366 },
  { height: 768, width: 1024 },
  { height: 720, width: 1280 },
  { height: 600, width: 1024 },
] as const;

describe("roomChatLayout", () => {
  it.each(representativeViewports)(
    "$width×$height에서 신청자 카드가 있어도 채팅 6행 높이를 확보한다",
    (viewportSize) => {
      const layout = getRoomChatLayout(viewportSize, true);

      expect(layout.availableChatHeight).toBeGreaterThanOrEqual(
        layout.chatMinHeight - 0.01,
      );
      expect(layout.songStackWidth).toBeGreaterThanOrEqual(160);
      expect(layout.songStackWidth).toBeLessThanOrEqual(640);
    },
  );

  it.each(representativeViewports)(
    "$width×$height에서 신청자 카드가 없을 때도 채팅 6행 높이를 확보한다",
    (viewportSize) => {
      const layout = getRoomChatLayout(viewportSize, false);

      expect(layout.availableChatHeight).toBeGreaterThanOrEqual(
        layout.chatMinHeight - 0.01,
      );
      expect(layout.songStackWidth).toBeGreaterThanOrEqual(240);
      expect(layout.songStackWidth).toBeLessThanOrEqual(640);
    },
  );

  it("600~1100px 구간에서 채팅 density가 단조 증가한다", () => {
    const densities = Array.from({ length: 501 }, (_, index) =>
      getRoomChatDensity(ROOM_CHAT_SUPPORTED_MIN_HEIGHT + index),
    );

    densities.forEach((density, index) => {
      if (index === 0) return;
      expect(density).toBeGreaterThanOrEqual(densities[index - 1]);
    });
    expect(densities[0]).toBe(0.64);
    expect(densities.at(-1)).toBe(1);
  });

  it("지원 높이 600~2160px의 모든 정수 구간에서 6행 높이를 유지한다", () => {
    for (let height = ROOM_CHAT_SUPPORTED_MIN_HEIGHT; height <= 2160; height += 1) {
      [false, true].forEach((hasRequester) => {
        const layout = getRoomChatLayout(
          { height, width: height <= 900 ? 1024 : 1920 },
          hasRequester,
        );

        expect(layout.availableChatHeight).toBeGreaterThanOrEqual(
          layout.chatMinHeight - 0.01,
        );
      });
    }
  });

  it("모바일 전용 레이아웃에는 desktop 6행 예약을 적용하지 않는다", () => {
    expect(getRoomChatLayout({ height: 640, width: 480 }, true)).toMatchObject({
      chatDensity: 1,
      chatMinHeight: 0,
      songStackWidth: 640,
    });
  });

  it.each([481, 600, 760])("%dpx는 desktop 채팅 레이아웃을 사용한다", (width) => {
    expect(getRoomChatLayout({ height: 640, width }, true).chatMinHeight).toBeGreaterThan(0);
  });
});
