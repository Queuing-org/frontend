export type ViewportSize = {
  height: number;
  width: number;
};

export const MOBILE_VIEWPORT_MAX_WIDTH = 760;
export const LAPTOP_COMPACT_MAX_WIDTH = 1600;
export const LAPTOP_COMPACT_MAX_HEIGHT = 900;

export type DesktopViewportDensity = "compact" | "normal";

export function getDesktopViewportDensity(
  viewportSize: ViewportSize,
): DesktopViewportDensity {
  const isDesktop = viewportSize.width > MOBILE_VIEWPORT_MAX_WIDTH;
  const isLaptopWidth = viewportSize.width <= LAPTOP_COMPACT_MAX_WIDTH;
  const isLaptopHeight = viewportSize.height <= LAPTOP_COMPACT_MAX_HEIGHT;

  return isDesktop && isLaptopWidth && isLaptopHeight ? "compact" : "normal";
}
