"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_DURATION_MS = 2_000;

export function useTransientManagementError(
  durationMs = DEFAULT_DURATION_MS,
) {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const sequenceRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current === null) {
      return;
    }
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const clear = useCallback(() => {
    sequenceRef.current += 1;
    clearTimer();
    setMessage(null);
  }, [clearTimer]);

  const begin = useCallback(() => {
    sequenceRef.current += 1;
    clearTimer();
    setMessage(null);
    return sequenceRef.current;
  }, [clearTimer]);

  const show = useCallback(
    (sequence: number, nextMessage: string) => {
      if (sequenceRef.current !== sequence) {
        return;
      }

      clearTimer();
      setMessage(nextMessage);
      timerRef.current = window.setTimeout(() => {
        if (sequenceRef.current === sequence) {
          setMessage(null);
        }
        timerRef.current = null;
      }, durationMs);
    },
    [clearTimer, durationMs],
  );

  useEffect(() => clearTimer, [clearTimer]);

  return { begin, clear, message, show };
}
