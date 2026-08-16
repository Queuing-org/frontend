import { describe, expect, it } from "vitest";
import {
  getDesktopViewportDensity,
  MOBILE_VIEWPORT_MEDIA_QUERY,
} from "./viewportDensity";

describe("viewportDensity", () => {
  it.each([
    [1366, 768],
    [1440, 900],
    [1536, 864],
    [1600, 900],
    [1920, 800],
  ])("%d×%d 노트북 viewport를 compact로 분류한다", (width, height) => {
    expect(getDesktopViewportDensity({ height, width })).toBe("compact");
  });

  it.each([
    [480, 900],
    [1536, 960],
    [1601, 901],
    [1920, 1080],
    [3840, 2160],
  ])("%d×%d viewport는 compact로 분류하지 않는다", (width, height) => {
    expect(getDesktopViewportDensity({ height, width })).toBe("normal");
  });

  it.each([
    [481, 900],
    [600, 900],
    [760, 900],
  ])("%dpx 너비부터 짧은 화면은 desktop compact로 분류한다", (width, height) => {
    expect(getDesktopViewportDensity({ height, width })).toBe("compact");
  });

  it("공용 모바일 media query를 480px로 고정한다", () => {
    expect(MOBILE_VIEWPORT_MEDIA_QUERY).toBe("(max-width: 480px)");
  });

  it("desktop 너비와 짧은 높이 기준을 모두 충족할 때만 compact로 분류한다", () => {
    expect(getDesktopViewportDensity({ height: 901, width: 1600 })).toBe(
      "normal",
    );
    expect(getDesktopViewportDensity({ height: 900, width: 1920 })).toBe(
      "compact",
    );
  });
});
