import { useEffect, useRef, type RefObject } from "react";

const DEFAULT_WHEEL_SELECT_THRESHOLD = 24;
const DEFAULT_WHEEL_COOLDOWN_MS = 50;

type Params = {
  viewportRef: RefObject<HTMLElement | null>;
  previousRoomSlug?: string | null;
  nextRoomSlug?: string | null;
  onSelectRoom: (roomSlug: string) => void;
  threshold?: number;
  cooldownMs?: number;
};

export function useRoomWheelNavigation({
  viewportRef,
  previousRoomSlug,
  nextRoomSlug,
  onSelectRoom,
  threshold = DEFAULT_WHEEL_SELECT_THRESHOLD,
  cooldownMs = DEFAULT_WHEEL_COOLDOWN_MS,
}: Params) {
  const lastWheelAtRef = useRef(0);

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    function handleWheel(event: WheelEvent) {
      const primaryDelta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;

      if (Math.abs(primaryDelta) < threshold) {
        return;
      }

      const now = Date.now();

      if (now - lastWheelAtRef.current < cooldownMs) {
        event.preventDefault();
        return;
      }

      if (primaryDelta > 0 && nextRoomSlug) {
        event.preventDefault();
        lastWheelAtRef.current = now;
        onSelectRoom(nextRoomSlug);
        return;
      }

      if (primaryDelta < 0 && previousRoomSlug) {
        event.preventDefault();
        lastWheelAtRef.current = now;
        onSelectRoom(previousRoomSlug);
      }
    }

    viewport.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      viewport.removeEventListener("wheel", handleWheel);
    };
  }, [
    viewportRef,
    previousRoomSlug,
    nextRoomSlug,
    onSelectRoom,
    threshold,
    cooldownMs,
  ]);
}
