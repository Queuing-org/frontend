"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useMe } from "@/src/features/user/session/hooks/useMe";
import { useUpdateMe } from "@/src/features/user/profile/hooks/useUpdateMe";
import type { UpdateMePayload } from "@/src/features/user/profile/model/types";

export const STATUS_MESSAGE_MAX_LENGTH = 255;
export const NICKNAME_MIN_LENGTH = 2;
export const NICKNAME_MAX_LENGTH = 20;
export const PROFILE_FIELD_FEEDBACK_DURATION_MS = 2_000;

export type ProfileFieldFeedback = "success" | "error" | null;

type ProfileField = "nickname" | "statusMessage";
type ProfileFieldFeedbackState = Partial<
  Record<ProfileField, Exclude<ProfileFieldFeedback, null>>
>;

export function useProfileSettingsForm() {
  const [nicknameDraft, setNicknameDraft] = useState<string | null>(null);
  const [statusMessageDraft, setStatusMessageDraft] = useState<string | null>(
    null,
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldFeedback, setFieldFeedback] =
    useState<ProfileFieldFeedbackState>({});
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  const hasNicknameChange =
    nicknameDraft !== null && trimmedNickname !== currentNickname;
  const hasStatusMessageChange =
    statusMessageDraft !== null && statusMessage !== currentStatusMessage;
  const isNicknameValid =
    trimmedNickname.length >= NICKNAME_MIN_LENGTH &&
    trimmedNickname.length <= NICKNAME_MAX_LENGTH;
  const hasProfileChanges = hasNicknameChange || hasStatusMessageChange;
  const canUpdateProfile =
    Boolean(me) &&
    hasProfileChanges &&
    (!hasNicknameChange || isNicknameValid) &&
    !isUpdatingProfile;

  const clearFieldFeedback = useCallback(() => {
    if (feedbackTimerRef.current !== null) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }

    setFieldFeedback({});
  }, []);

  const showFieldFeedback = useCallback(
    (
      fields: readonly ProfileField[],
      feedback: Exclude<ProfileFieldFeedback, null>,
    ) => {
      clearFieldFeedback();
      setFieldFeedback(
        Object.fromEntries(fields.map((field) => [field, feedback])),
      );
      feedbackTimerRef.current = setTimeout(() => {
        feedbackTimerRef.current = null;
        setFieldFeedback({});
      }, PROFILE_FIELD_FEEDBACK_DURATION_MS);
    },
    [clearFieldFeedback],
  );

  useEffect(
    () => () => {
      if (feedbackTimerRef.current !== null) {
        clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = null;
      }
    },
    [],
  );

  const clearProfileStatusMessage = () => {
    setSuccessMessage(null);
    resetUpdateMe();
  };

  const resetProfileFeedback = () => {
    clearFieldFeedback();
    clearProfileStatusMessage();
  };

  const updateNicknameDraft = (value: string) => {
    setNicknameDraft(value);
    resetProfileFeedback();
  };

  const updateStatusMessageDraft = (value: string) => {
    setStatusMessageDraft(
      value.replace(/[\r\n]+/g, " ").slice(0, STATUS_MESSAGE_MAX_LENGTH),
    );
    resetProfileFeedback();
  };

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!me || !canUpdateProfile) {
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

        showFieldFeedback(submittedFields, "success");
        setSuccessMessage(
          submittedFields.length === 2
            ? "프로필이 변경되었습니다."
            : submittedFields[0] === "nickname"
              ? "사용자 이름이 변경되었습니다."
              : "한 줄 메시지가 변경되었습니다.",
        );
      },
      onError: () => {
        showFieldFeedback(submittedFields, "error");
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
    successMessage,
    updateError,
    updateNicknameDraft,
    updateStatusMessageDraft,
  };
}
