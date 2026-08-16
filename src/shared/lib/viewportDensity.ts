export type ViewportSize = {
  height: number;
  width: number;
};

export const MOBILE_VIEWPORT_MAX_WIDTH = 480;
export const MOBILE_VIEWPORT_MEDIA_QUERY = `(max-width: ${MOBILE_VIEWPORT_MAX_WIDTH}px)`;
export const LAPTOP_COMPACT_MAX_HEIGHT = 900;

export type DesktopViewportDensity = "compact" | "normal";

export function getDesktopViewportDensity(
  viewportSize: ViewportSize,
): DesktopViewportDensity {
  const isDesktop = viewportSize.width > MOBILE_VIEWPORT_MAX_WIDTH;
  const hasCompactHeight =
    viewportSize.height <= LAPTOP_COMPACT_MAX_HEIGHT;

  return isDesktop && hasCompactHeight ? "compact" : "normal";
}
