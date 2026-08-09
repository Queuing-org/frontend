"use client";

import { useEffect } from "react";
import {
  requestComponentPreload,
  type ComponentPreloader,
} from "./preloadableDynamicComponent";

const IDLE_PRELOAD_TIMEOUT_MS = 1_500;
const FALLBACK_PRELOAD_DELAY_MS = 1_500;

export function useIdlePreload(
  preloaders: readonly ComponentPreloader[],
) {
  useEffect(() => {
    const preload = () => {
      preloaders.forEach(requestComponentPreload);
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleCallbackId = window.requestIdleCallback(preload, {
        timeout: IDLE_PRELOAD_TIMEOUT_MS,
      });

      return () => window.cancelIdleCallback(idleCallbackId);
    }

    const timeoutId = window.setTimeout(
      preload,
      FALLBACK_PRELOAD_DELAY_MS,
    );

    return () => window.clearTimeout(timeoutId);
  }, [preloaders]);
}
