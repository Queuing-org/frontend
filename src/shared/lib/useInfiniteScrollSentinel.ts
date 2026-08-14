"use client";

import { useEffect, useRef } from "react";

type Params = {
  enabled: boolean;
  onVisible: () => void;
};

export function useInfiniteScrollSentinel({ enabled, onVisible }: Params) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!enabled || !sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          onVisible();
        }
      },
      { rootMargin: "120px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [enabled, onVisible]);

  return sentinelRef;
}
