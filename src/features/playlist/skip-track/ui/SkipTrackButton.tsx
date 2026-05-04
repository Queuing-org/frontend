"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { publishNextTrack } from "@/src/entities/playlist/api/websocket/publishNextTrack";
import { useRoomMeta } from "@/src/entities/room/hooks/useRoomMeta";
import { isRoomOwner } from "@/src/entities/room/lib/isRoomOwner";
import { useMe } from "@/src/entities/user/hooks/useMe";
import styles from "./SkipTrackButton.module.css";

type SkipTrackButtonProps = {
  className?: string;
  slug: string | null;
};

export default function SkipTrackButton({
  className,
  slug,
}: SkipTrackButtonProps) {
  const queryClient = useQueryClient();
  const { data: roomMeta } = useRoomMeta(slug);
  const { data: me } = useMe();
  const [errorMessage, setErrorMessage] = useState("");

  if (!isRoomOwner(roomMeta?.owner, me)) {
    return null;
  }

  function handleClick() {
    if (!slug) {
      return;
    }

    try {
      publishNextTrack(slug);
      setErrorMessage("");
      void queryClient.invalidateQueries({ queryKey: ["roomQueue", slug] });
      void queryClient.invalidateQueries({ queryKey: ["roomState", slug] });
      void queryClient.invalidateQueries({ queryKey: ["roomPlayback", slug] });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "다음 곡으로 넘기지 못했습니다.",
      );
    }
  }

  return (
    <button
      type="button"
      className={[styles.button, className].filter(Boolean).join(" ")}
      onClick={handleClick}
      aria-label="다음 곡으로 넘기기"
      title={errorMessage || "다음 곡으로 넘기기"}
    >
      스킵
    </button>
  );
}
