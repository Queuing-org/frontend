"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { playlistKeys } from "@/src/features/playlist/model/queryKeys";
import { publishNextTrack } from "@/src/features/playlist/api/websocket/publishNextTrack";

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
      void queryClient.invalidateQueries({
        queryKey: playlistKeys.roomQueuePrefix(slug),
      });
      void queryClient.invalidateQueries({
        queryKey: playlistKeys.roomStatePrefix(slug),
      });
      void queryClient.invalidateQueries({
        queryKey: playlistKeys.roomPlaybackPrefix(slug),
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
