"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import styles from "./OverflowMarquee.module.css";

const COPY_GAP_PX = 32;
const PIXELS_PER_SECOND = 36;

type Props = {
  className?: string;
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

export default function OverflowMarquee({ className, text }: Props) {
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

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }

    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    observer.observe(copy);
    return () => observer.disconnect();
  }, [text]);

  const marqueeStyle: MarqueeStyle = {
    "--marquee-offset": `-${metrics.distance}px`,
    "--marquee-duration": `${metrics.duration}s`,
  };

  return (
    <span
      ref={viewportRef}
      className={[styles.viewport, className].filter(Boolean).join(" ")}
      data-overflowing={metrics.overflowing}
      tabIndex={metrics.overflowing ? 0 : undefined}
      title={metrics.overflowing ? text : undefined}
    >
      <span className={styles.track} style={marqueeStyle}>
        <span ref={copyRef} className={styles.copy}>
          {text}
        </span>
        {metrics.overflowing ? (
          <span className={styles.copy} aria-hidden="true">
            {text}
          </span>
        ) : null}
      </span>
    </span>
  );
}
