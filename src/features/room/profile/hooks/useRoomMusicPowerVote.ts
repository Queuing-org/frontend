"use client";

import { useRef } from "react";
import { useMusicPower } from "@/src/features/user/profile/hooks/useMusicPower";
import type { MusicPowerVote } from "@/src/features/user/profile/model/types";
import { useActionFeedback } from "@/src/shared/ui/action-feedback/ActionFeedbackProvider";
import { useCurrentTrackMusicPowerVote } from "./useCurrentTrackMusicPowerVote";

const LOGIN_NOTICE = "로그인 후 음악력을 평가할 수 있습니다.";
const ALREADY_EVALUATED_NOTICE =
  "같은 곡에는 한 번만 음악력을 평가할 수 있습니다.";

type UseRoomMusicPowerVoteParams = {
  currentEntryId?: string | null;
  displayNickname: string;
  hasCurrentUser: boolean;
  isCurrentUserLoading: boolean;
  isSelf: boolean;
  roomAccessToken: string;
  roomSlug: string;
  targetSlug: string | null;
};

export type RoomMusicPowerVoteControl = {
  disabled: boolean;
  disabledLabel: string | null;
  loginNotice: string | null;
  musicPower: number | undefined;
  onVote: (vote: MusicPowerVote) => void;
  selectedVote: MusicPowerVote | null;
};

export function useRoomMusicPowerVote({
  currentEntryId,
  displayNickname,
  hasCurrentUser,
  isCurrentUserLoading,
  isSelf,
  roomAccessToken,
  roomSlug,
  targetSlug,
}: UseRoomMusicPowerVoteParams): RoomMusicPowerVoteControl {
  const requestKeyRef = useRef<string | null>(null);
  const { notify } = useActionFeedback();
  const shouldLoad = Boolean(
    hasCurrentUser && targetSlug && currentEntryId && !isSelf,
  );
  const query = useMusicPower(
    shouldLoad ? targetSlug : null,
    shouldLoad ? { entryId: currentEntryId!, roomSlug } : undefined,
    shouldLoad ? roomAccessToken : undefined,
  );
  const mutation = useCurrentTrackMusicPowerVote();
  const pendingVote = mutation.variables;
  const selectedVote =
    query.data?.myVote ??
    (mutation.isPending &&
    pendingVote?.roomSlug === roomSlug &&
    pendingVote.entryId === currentEntryId &&
    pendingVote.targetUserSlug === targetSlug
      ? pendingVote.vote
      : null);
  const disabled =
    isCurrentUserLoading || isSelf || !targetSlug || !currentEntryId;

  let disabledLabel: string | null = null;
  if (isCurrentUserLoading) {
    disabledLabel = "로그인 상태를 확인하고 있습니다";
  } else if (isSelf) {
    disabledLabel = "본인의 음악력에는 투표할 수 없습니다";
  } else if (!targetSlug) {
    disabledLabel = "투표 대상은 회원 신청자만 가능합니다";
  } else if (!currentEntryId) {
    disabledLabel = "현재 재생 곡을 확인할 수 없습니다";
  }

  const onVote = (vote: MusicPowerVote) => {
    if (!targetSlug || !currentEntryId || isCurrentUserLoading) {
      return;
    }

    const requestKey = `${roomSlug}:${currentEntryId}:${targetSlug}`;
    if (!hasCurrentUser) {
      notify({
        dedupeKey: `music-power:${requestKey}`,
        message: LOGIN_NOTICE,
        tone: "default",
      });
      return;
    }

    if (disabled || mutation.isPending || requestKeyRef.current === requestKey) {
      return;
    }

    if (query.data?.myVote) {
      notify({
        dedupeKey: `music-power:${requestKey}`,
        message: ALREADY_EVALUATED_NOTICE,
        tone: "default",
      });
      return;
    }

    requestKeyRef.current = requestKey;
    mutation.mutate(
      {
        accessToken: roomAccessToken,
        entryId: currentEntryId,
        roomSlug,
        targetUserSlug: targetSlug,
        vote,
      },
      {
        onSuccess: () => {
          if (requestKeyRef.current === requestKey) {
            requestKeyRef.current = null;
          }
          notify({
            dedupeKey: `music-power:${requestKey}`,
            message:
              vote === "UPVOTE"
                ? `'${displayNickname}'님의 음악력을 올렸습니다!`
                : `'${displayNickname}'님의 음악력을 내렸습니다.`,
            tone: "default",
          });
        },
        onError: (error) => {
          if (requestKeyRef.current === requestKey) {
            requestKeyRef.current = null;
          }
          const isAlreadyEvaluated =
            error.code === "music-power.already-evaluated";
          notify({
            dedupeKey: `music-power:${requestKey}`,
            message: isAlreadyEvaluated
              ? ALREADY_EVALUATED_NOTICE
              : error.message || "음악력을 변경하지 못했습니다.",
            tone: isAlreadyEvaluated ? "default" : "error",
          });
        },
      },
    );
  };

  return {
    disabled,
    disabledLabel,
    loginNotice:
      !hasCurrentUser && !isCurrentUserLoading ? LOGIN_NOTICE : null,
    musicPower: query.data?.musicPower,
    onVote,
    selectedVote,
  };
}
