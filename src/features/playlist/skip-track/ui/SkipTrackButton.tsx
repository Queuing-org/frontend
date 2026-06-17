"use client";

import { useRoomMeta } from "@/src/features/room/hooks/useRoomMeta";
import { isRoomOwner } from "@/src/features/room/lib/isRoomOwner";
import { useMe } from "@/src/features/user/session/hooks/useMe";
import { useSkipTrackAction } from "../hooks/useSkipTrackAction";
import styles from "./SkipTrackButton.module.css";

type SkipTrackButtonProps = {
  className?: string;
  slug: string | null;
};

export default function SkipTrackButton({
  className,
  slug,
}: SkipTrackButtonProps) {
  const { data: roomMeta } = useRoomMeta(slug);
  const { data: me } = useMe();
  const { errorMessage, skipTrack } = useSkipTrackAction(slug);

  if (!isRoomOwner(roomMeta?.owner, me)) {
    return null;
  }

  return (
    <button
      type="button"
      className={[styles.button, className].filter(Boolean).join(" ")}
      onClick={skipTrack}
      aria-label="다음 곡으로 넘기기"
      title={errorMessage || "다음 곡으로 넘기기"}
    >
      SKIP
    </button>
  );
}
