"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { playlistKeys } from "@/src/features/playlist/model/queryKeys";
import { publishNextTrack } from "@/src/features/playlist/api/websocket/publishNextTrack";
import { scheduleQueryInvalidation } from "@/src/shared/api/query/scheduleQueryInvalidation";
import { getRoomReadInvalidationScope } from "@/src/features/room/model/roomReadInvalidationScope";

export function useSkipTrackAction(slug: string | null) {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState("");

  const skipTrack = () => {
    if (!slug) {
      return;
    }

    try {
      publishNextTrack(slug);
      setErrorMessage("");
      scheduleQueryInvalidation({
        queryClient,
        queryKeys: [
          playlistKeys.roomQueuePrefix(slug),
          playlistKeys.roomPlaybackPrefix(slug),
        ],
        scopeKey: getRoomReadInvalidationScope(slug),
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "다음 곡으로 넘기지 못했습니다.",
      );
    }
  };

  return {
    errorMessage,
    skipTrack,
  };
}
