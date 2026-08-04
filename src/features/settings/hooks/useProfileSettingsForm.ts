"use client";

import { useState, type FormEvent } from "react";
import { useMe } from "@/src/features/user/session/hooks/useMe";
import { useUpdateMe } from "@/src/features/user/profile/hooks/useUpdateMe";
import type { UpdateMePayload } from "@/src/features/user/profile/model/types";

export const STATUS_MESSAGE_MAX_LENGTH = 255;
export const NICKNAME_MIN_LENGTH = 2;
export const NICKNAME_MAX_LENGTH = 20;

export function useProfileSettingsForm() {
  const [nicknameDraft, setNicknameDraft] = useState<string | null>(null);
  const [statusMessageDraft, setStatusMessageDraft] = useState<string | null>(
    null,
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { data: me, isLoading: isMeLoading, isError: isMeError } = useMe();
  const {
    mutate: updateMe,
    isPending: isUpdatingProfile,
    error: updateError,
    reset: resetUpdateMe,
  } = useUpdateMe();

  const currentNickname = me?.nickname ?? "";
  const currentStatusMessage = me?.statusMessage ?? "";
  const nickname = nicknameDraft ?? currentNickname;
  const statusMessage = statusMessageDraft ?? currentStatusMessage;
  const trimmedNickname = nickname.trim();
  const isNicknameValid =
    trimmedNickname.length >= NICKNAME_MIN_LENGTH &&
    trimmedNickname.length <= NICKNAME_MAX_LENGTH;
  const canUpdateNickname =
    Boolean(me) &&
    isNicknameValid &&
    trimmedNickname !== currentNickname &&
    !isUpdatingProfile;
  const canUpdateStatusMessage =
    Boolean(me) &&
    statusMessageDraft !== null &&
    statusMessage !== currentStatusMessage &&
    !isUpdatingProfile;

  const updateNicknameDraft = (value: string) => {
    setNicknameDraft(value);
    setSuccessMessage(null);
    resetUpdateMe();
  };

  const updateStatusMessageDraft = (value: string) => {
    setStatusMessageDraft(
      value.replace(/[\r\n]+/g, " ").slice(0, STATUS_MESSAGE_MAX_LENGTH),
    );
    setSuccessMessage(null);
    resetUpdateMe();
  };

  const handleNicknameSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!me || !canUpdateNickname) {
      return;
    }

    updateMe(
      { nickname: trimmedNickname },
      {
        onSuccess: () => {
          setNicknameDraft(null);
          setSuccessMessage("사용자 이름이 변경되었습니다.");
        },
      },
    );
  };

  const handleStatusMessageSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!me || !canUpdateStatusMessage) {
      return;
    }

    const payload: UpdateMePayload = {
      nickname: currentNickname,
      statusMessage,
    };

    updateMe(
      payload,
      {
        onSuccess: () => {
          setStatusMessageDraft(null);
          setSuccessMessage("한 줄 메시지가 변경되었습니다.");
        },
      },
    );
  };

  return {
    canUpdateNickname,
    canUpdateStatusMessage,
    handleNicknameSubmit,
    handleStatusMessageSubmit,
    hasProfile: Boolean(me),
    isMeError,
    isMeLoading,
    isUpdatingProfile,
    me,
    nickname,
    statusMessage,
    profileImageSrc: me?.profileImageUrl || "/Basic_Profile.png",
    successMessage,
    updateError,
    updateNicknameDraft,
    updateStatusMessageDraft,
  };
}
