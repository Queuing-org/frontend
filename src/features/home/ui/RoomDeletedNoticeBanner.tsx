"use client";

import { useEffect, useState } from "react";
import { consumeRoomTerminationNotice } from "@/src/features/room/model/roomTerminationNotice";
import styles from "./HomeScreen.module.css";

export default function RoomDeletedNoticeBanner() {
  const [message, setMessage] = useState<string | null>(() =>
    consumeRoomTerminationNotice(),
  );

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 5_000);
    return () => window.clearTimeout(timer);
  }, [message]);

  return message ? (
    <div className={styles.roomDeletedNotice} role="status">
      <span>{message}</span>
      <button type="button" onClick={() => setMessage(null)} aria-label="알림 닫기">×</button>
    </div>
  ) : null;
}
