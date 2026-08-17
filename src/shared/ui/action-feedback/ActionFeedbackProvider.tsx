"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import styles from "./ActionFeedbackProvider.module.css";

export type ActionFeedbackTone = "default" | "error";

export type ActionFeedbackInput = {
  dedupeKey: string;
  message: string;
  tone: ActionFeedbackTone;
};

type ActionFeedbackItem = ActionFeedbackInput & {
  createdAt: number;
  expiresAt: number;
  removeAt?: number;
  phase: "visible" | "exiting";
};

type ActionFeedbackContextValue = {
  notify: (feedback: ActionFeedbackInput) => void;
};

const DISPLAY_DURATION_MS = 1_500;
const EXIT_DURATION_MS = 160;
const DUPLICATE_WINDOW_MS = 300;
const MAX_FEEDBACK_ITEMS = 5;

const ActionFeedbackContext = createContext<ActionFeedbackContextValue>({
  notify: () => {},
});

export function useActionFeedback() {
  return useContext(ActionFeedbackContext);
}

export default function ActionFeedbackProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [items, setItems] = useState<ActionFeedbackItem[]>([]);
  const lastCallRef = useRef(
    new Map<string, { message: string; notifiedAt: number }>(),
  );

  const notify = useCallback((feedback: ActionFeedbackInput) => {
    const notifiedAt = Date.now();
    const lastCall = lastCallRef.current.get(feedback.dedupeKey);

    if (
      lastCall?.message === feedback.message &&
      notifiedAt - lastCall.notifiedAt <= DUPLICATE_WINDOW_MS
    ) {
      return;
    }

    lastCallRef.current.set(feedback.dedupeKey, {
      message: feedback.message,
      notifiedAt,
    });

    setItems((currentItems) => {
      const existingIndex = currentItems.findIndex(
        (item) => item.dedupeKey === feedback.dedupeKey,
      );

      if (existingIndex >= 0) {
        const existingItem = currentItems[existingIndex];
        const updatedItem: ActionFeedbackItem = {
          ...existingItem,
          message: feedback.message,
          tone: feedback.tone,
          createdAt: notifiedAt,
          expiresAt: notifiedAt + DISPLAY_DURATION_MS,
          removeAt: undefined,
          phase: "visible",
        };

        return [
          updatedItem,
          ...currentItems.filter((_, index) => index !== existingIndex),
        ].slice(0, MAX_FEEDBACK_ITEMS);
      }

      return [
        {
          ...feedback,
          createdAt: notifiedAt,
          expiresAt: notifiedAt + DISPLAY_DURATION_MS,
          phase: "visible" as const,
        },
        ...currentItems,
      ].slice(0, MAX_FEEDBACK_ITEMS);
    });
  }, []);

  useEffect(() => {
    if (items.length === 0) {
      return;
    }

    const now = Date.now();
    const timers = items.map((item) => {
      if (item.phase === "visible") {
        return setTimeout(() => {
          setItems((currentItems) =>
            currentItems.map((currentItem) =>
              currentItem.dedupeKey === item.dedupeKey &&
              currentItem.expiresAt === item.expiresAt
                ? {
                    ...currentItem,
                    phase: "exiting",
                    removeAt: Date.now() + EXIT_DURATION_MS,
                  }
                : currentItem,
            ),
          );
        }, Math.max(0, item.expiresAt - now));
      }

      return setTimeout(() => {
        setItems((currentItems) =>
          currentItems.filter(
            (currentItem) => currentItem.dedupeKey !== item.dedupeKey,
          ),
        );
        lastCallRef.current.delete(item.dedupeKey);
      }, Math.max(0, (item.removeAt ?? now + EXIT_DURATION_MS) - now));
    });

    return () => timers.forEach(clearTimeout);
  }, [items]);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ActionFeedbackContext.Provider value={value}>
      {children}
      <div className={styles.stack} aria-label="작업 알림">
        {items.map((item) => (
          <div
            key={item.dedupeKey}
            className={styles.item}
            data-phase={item.phase}
            data-tone={item.tone}
            role={item.tone === "error" ? "alert" : "status"}
          >
            <span className={styles.icon} aria-hidden="true">
              !
            </span>
            <span className={styles.message}>{item.message}</span>
          </div>
        ))}
      </div>
    </ActionFeedbackContext.Provider>
  );
}
