"use client";

import { useState, type FormEvent } from "react";
import { useMe } from "@/src/features/user/session/hooks/useMe";
import { useUpdateMe } from "@/src/features/user/profile/hooks/useUpdateMe";

export function useProfileSettingsForm() {
  const [nicknameDraft, setNicknameDraft] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { data: me, isLoading: isMeLoading, isError: isMeError } = useMe();
  const {
    mutate: updateMe,
    isPending: isUpdatingProfile,
    error: updateError,
    reset: resetUpdateMe,
  } = useUpdateMe();

  const currentNickname = me?.nickname ?? "";
  const nickname = nicknameDraft ?? currentNickname;
  const trimmedNickname = nickname.trim();
  const canUpdateNickname =
    Boolean(me) &&
    trimmedNickname.length > 0 &&
    trimmedNickname !== currentNickname &&
    !isUpdatingProfile;

  const updateNicknameDraft = (value: string) => {
    setNicknameDraft(value);
    setSuccessMessage(null);
    resetUpdateMe();
  };

  const handleNicknameSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!me || !trimmedNickname) {
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

  return {
    canUpdateNickname,
    handleNicknameSubmit,
    hasProfile: Boolean(me),
    isMeError,
    isMeLoading,
    isUpdatingProfile,
    me,
    nickname,
    profileImageSrc: me?.profileImageUrl || "/Basic_Profile.png",
    successMessage,
    updateError,
    updateNicknameDraft,
  };
}
