"use client";

import { useQueryClient } from "@tanstack/react-query";
import { playlistKeys } from "@/src/features/playlist/model/queryKeys";
import { publishNextTrack } from "@/src/features/playlist/api/websocket/publishNextTrack";
import { scheduleQueryInvalidation } from "@/src/shared/api/query/scheduleQueryInvalidation";
import { getRoomReadInvalidationScope } from "@/src/features/room/model/roomReadInvalidationScope";
import { useActionFeedback } from "@/src/shared/ui/action-feedback/ActionFeedbackProvider";

export function useSkipTrackAction(slug: string | null) {
  const queryClient = useQueryClient();
  const { notify } = useActionFeedback();

  const skipTrack = () => {
    if (!slug) {
      return;
    }

    try {
      publishNextTrack(slug);
      void queryClient.resetQueries({
        queryKey: playlistKeys.roomQueueHistoryPrefix(slug),
        exact: true,
      });
      scheduleQueryInvalidation({
        queryClient,
        queryKeys: [
          playlistKeys.roomQueuePrefix(slug),
          playlistKeys.roomPlaybackPrefix(slug),
        ],
        scopeKey: getRoomReadInvalidationScope(slug),
      });
    } catch (error) {
      notify({
        dedupeKey: `skip-track:${slug}`,
        message:
          error instanceof Error && error.message
            ? error.message
            : "다음 곡으로 넘기지 못했습니다.",
        tone: "error",
      });
    }
  };

  return {
    skipTrack,
  };
}
