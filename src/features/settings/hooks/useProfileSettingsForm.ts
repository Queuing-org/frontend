"use client";

import { useCallback, useState, type FormEvent } from "react";
import { useMe } from "@/src/features/user/session/hooks/useMe";
import { useUpdateMe } from "@/src/features/user/profile/hooks/useUpdateMe";
import type { UpdateMePayload } from "@/src/features/user/profile/model/types";
import { useActionFeedback } from "@/src/shared/ui/action-feedback/ActionFeedbackProvider";

export const STATUS_MESSAGE_MAX_LENGTH = 20;
export const NICKNAME_MIN_LENGTH = 2;
export const NICKNAME_MAX_LENGTH = 20;

export type ProfileFieldFeedback = "error" | null;

type ProfileField = "nickname" | "statusMessage";
type ProfileFieldFeedbackState = Partial<Record<ProfileField, "error">>;

export function useProfileSettingsForm() {
  const [nicknameDraft, setNicknameDraft] = useState<string | null>(null);
  const [statusMessageDraft, setStatusMessageDraft] = useState<string | null>(
    null,
  );
  const [fieldFeedback, setFieldFeedback] =
    useState<ProfileFieldFeedbackState>({});
  const { notify } = useActionFeedback();
  const { data: me, isLoading: isMeLoading, isError: isMeError } = useMe();
  const {
    mutate: updateMe,
    isPending: isUpdatingProfile,
    error: updateError,
    reset: resetUpdateMe,
  } = useUpdateMe();

  const currentNickname = me?.nickname ?? "";
  const currentStatusMessage = (me?.statusMessage ?? "")
    .replace(/[\r\n]+/g, " ")
    .slice(0, STATUS_MESSAGE_MAX_LENGTH);
  const nickname = nicknameDraft ?? currentNickname;
  const statusMessage = statusMessageDraft ?? currentStatusMessage;
  const trimmedNickname = nickname.trim();
  const hasNicknameChange =
    nicknameDraft !== null && trimmedNickname !== currentNickname;
  const hasStatusMessageChange =
    statusMessageDraft !== null && statusMessage !== currentStatusMessage;
  const isNicknameValid =
    trimmedNickname.length >= NICKNAME_MIN_LENGTH &&
    trimmedNickname.length <= NICKNAME_MAX_LENGTH;
  const hasProfileChanges = hasNicknameChange || hasStatusMessageChange;
  const canUpdateProfile =
    Boolean(me) && hasProfileChanges && !isUpdatingProfile;

  const clearFieldFeedback = useCallback(() => setFieldFeedback({}), []);
  const clearSingleFieldFeedback = useCallback((field: ProfileField) => {
    setFieldFeedback((currentFeedback) => {
      if (!currentFeedback[field]) {
        return currentFeedback;
      }

      const nextFeedback = { ...currentFeedback };
      delete nextFeedback[field];
      return nextFeedback;
    });
  }, []);
  const showFieldErrors = useCallback((fields: readonly ProfileField[]) => {
    setFieldFeedback(
      Object.fromEntries(fields.map((field) => [field, "error"])),
    );
  }, []);

  const clearProfileStatusMessage = () => {
    resetUpdateMe();
  };

  const resetProfileFeedback = () => {
    clearFieldFeedback();
    clearProfileStatusMessage();
  };

  const updateNicknameDraft = (value: string) => {
    setNicknameDraft(value);
    clearSingleFieldFeedback("nickname");
    clearProfileStatusMessage();
  };

  const updateStatusMessageDraft = (value: string) => {
    setStatusMessageDraft(
      value.replace(/[\r\n]+/g, " ").slice(0, STATUS_MESSAGE_MAX_LENGTH),
    );
    clearSingleFieldFeedback("statusMessage");
    clearProfileStatusMessage();
  };

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!me || !hasProfileChanges || isUpdatingProfile) {
      return;
    }

    if (hasNicknameChange && !isNicknameValid) {
      showFieldErrors(["nickname"]);
      notify({
        dedupeKey: "profile:nickname:validation",
        message: `사용자 이름은 ${NICKNAME_MIN_LENGTH}자 이상 ${NICKNAME_MAX_LENGTH}자 이하로 입력해 주세요.`,
        tone: "error",
      });
      return;
    }

    const submittedFields: ProfileField[] = [];
    const payload: UpdateMePayload = {};

    if (hasNicknameChange) {
      payload.nickname = trimmedNickname;
      submittedFields.push("nickname");
    }

    if (hasStatusMessageChange) {
      payload.statusMessage = statusMessage;
      submittedFields.push("statusMessage");
    }

    resetProfileFeedback();
    updateMe(payload, {
      onSuccess: () => {
        if (hasNicknameChange) {
          setNicknameDraft(null);
        }
        if (hasStatusMessageChange) {
          setStatusMessageDraft(null);
        }

        clearFieldFeedback();
        notify({
          dedupeKey: "profile:update",
          message:
            submittedFields.length === 2
              ? "프로필을 변경했습니다."
              : submittedFields[0] === "nickname"
                ? "사용자 이름을 변경했습니다."
                : "최애곡을 변경했습니다.",
          tone: "default",
        });
      },
      onError: (error) => {
        showFieldErrors(submittedFields);
        notify({
          dedupeKey: "profile:update",
          message: error?.message || "프로필을 변경하지 못했습니다.",
          tone: "error",
        });
      },
    });
  };

  return {
    canUpdateProfile,
    clearProfileStatusMessage,
    handleProfileSubmit,
    hasProfile: Boolean(me),
    hasProfileChanges,
    isMeError,
    isMeLoading,
    isUpdatingProfile,
    me,
    nickname,
    nicknameFeedback: fieldFeedback.nickname ?? null,
    statusMessage,
    statusMessageFeedback: fieldFeedback.statusMessage ?? null,
    profileImageSrc: me?.profileImageUrl || "/Basic_Profile.png",
    updateError,
    updateNicknameDraft,
    updateStatusMessageDraft,
  };
}
