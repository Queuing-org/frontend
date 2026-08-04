"use client";

import { useState, type FormEvent } from "react";
import { useMe } from "@/src/features/user/session/hooks/useMe";
import { useUpdateMe } from "@/src/features/user/profile/hooks/useUpdateMe";
import type { UpdateMePayload } from "@/src/features/user/profile/model/types";

export const STATUS_MESSAGE_MAX_LENGTH = 255;

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
  const canUpdateProfile =
    Boolean(me) &&
    trimmedNickname.length > 0 &&
    (trimmedNickname !== currentNickname ||
      (statusMessageDraft !== null &&
        statusMessage !== currentStatusMessage)) &&
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

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!me || !trimmedNickname) {
      return;
    }

    const payload: UpdateMePayload = {};
    if (trimmedNickname !== currentNickname) {
      payload.nickname = trimmedNickname;
    }
    if (
      statusMessageDraft !== null &&
      statusMessage !== currentStatusMessage
    ) {
      payload.statusMessage = statusMessage;
    }

    if (Object.keys(payload).length === 0) {
      return;
    }

    updateMe(
      payload,
      {
        onSuccess: () => {
          setNicknameDraft(null);
          setStatusMessageDraft(null);
          setSuccessMessage("프로필이 변경되었습니다.");
        },
      },
    );
  };

  return {
    canUpdateProfile,
    handleProfileSubmit,
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
