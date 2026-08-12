"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import styles from "./OverflowMarquee.module.css";

const COPY_GAP_PX = 32;
const PIXELS_PER_SECOND = 36;

const resizeCallbacks = new WeakMap<Element, () => void>();
let sharedResizeObserver: ResizeObserver | null = null;

function observeMarqueeResize(element: Element, callback: () => void) {
  if (typeof ResizeObserver === "undefined") {
    window.addEventListener("resize", callback);
    return () => window.removeEventListener("resize", callback);
  }

  if (!sharedResizeObserver) {
    sharedResizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => resizeCallbacks.get(entry.target)?.());
    });
  }

  resizeCallbacks.set(element, callback);
  sharedResizeObserver.observe(element);

  return () => {
    if (resizeCallbacks.get(element) !== callback) {
      return;
    }

    resizeCallbacks.delete(element);
    sharedResizeObserver?.unobserve(element);
  };
}

type Props = {
  activation?: "auto" | "group-hover" | "hover";
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  text: string;
};

type MarqueeMetrics = {
  distance: number;
  duration: number;
  overflowing: boolean;
};

type MarqueeStyle = CSSProperties & {
  "--marquee-offset": string;
  "--marquee-duration": string;
};

export function getMarqueeMetrics(
  viewportWidth: number,
  contentWidth: number,
): MarqueeMetrics {
  const overflowing = contentWidth > viewportWidth + 1;
  const distance = contentWidth + COPY_GAP_PX;

  return {
    distance,
    duration: Math.min(
      36,
      Math.max(8, distance / PIXELS_PER_SECOND),
    ),
    overflowing,
  };
}

export default function OverflowMarquee({
  activation = "hover",
  children,
  className,
  contentClassName,
  text,
}: Props) {
  const viewportRef = useRef<HTMLSpanElement>(null);
  const copyRef = useRef<HTMLSpanElement>(null);
  const [metrics, setMetrics] = useState<MarqueeMetrics>(() =>
    getMarqueeMetrics(0, 0),
  );

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const copy = copyRef.current;
    if (!viewport || !copy) {
      return;
    }

    const update = () => {
      const next = getMarqueeMetrics(viewport.clientWidth, copy.scrollWidth);
      setMetrics((current) =>
        current.distance === next.distance &&
        current.duration === next.duration &&
        current.overflowing === next.overflowing
          ? current
          : next,
      );
    };

    update();

    return observeMarqueeResize(viewport, update);
  }, [text]);

  const marqueeStyle: MarqueeStyle = {
    "--marquee-offset": `-${metrics.distance}px`,
    "--marquee-duration": `${metrics.duration}s`,
  };

  return (
    <span
      ref={viewportRef}
      className={[styles.viewport, className].filter(Boolean).join(" ")}
      data-activation={activation}
      data-overflowing={metrics.overflowing}
      tabIndex={metrics.overflowing ? 0 : undefined}
      title={metrics.overflowing ? text : undefined}
    >
      <span className={styles.track} style={marqueeStyle}>
        <span
          ref={copyRef}
          className={[styles.copy, contentClassName].filter(Boolean).join(" ")}
        >
          {children ?? text}
        </span>
        {metrics.overflowing ? (
          <span
            className={[styles.copy, contentClassName]
              .filter(Boolean)
              .join(" ")}
            aria-hidden="true"
          >
            {children ?? text}
          </span>
        ) : null}
      </span>
    </span>
  );
}
