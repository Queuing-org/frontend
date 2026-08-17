"use client";

import type { ReactNode } from "react";
import { redirectToGoogleLogin } from "@/src/features/auth/login-with-google/api/login";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import { useAddTrackAction } from "../hooks/useAddTrackAction";
import AddTrackButton from "./AddTrackButton";
import AddTrackModalView from "./AddTrackModalView";

type AddTrackActionProps = {
  className?: string;
  label?: string;
  loginLabel?: string;
  roomAccessToken: string;
  slug: string;
  variant?: "default" | "queueDock";
};

export default function AddTrackAction({
  className,
  label: labelOverride,
  loginLabel,
  roomAccessToken,
  slug,
  variant = "default",
}: AddTrackActionProps) {
  const action = useAddTrackAction(slug, roomAccessToken);
  const isQueueDock = variant === "queueDock";
  const form = action.form;
  let appearance: "loading" | "login" | "primary" = "primary";
  let buttonDisabled = false;
  let buttonLabel: ReactNode = isQueueDock
    ? (labelOverride ?? "노래신청")
    : "곡 추가";
  let buttonAction = action.openModal;

  if (action.isLoading) {
    appearance = "loading";
    buttonDisabled = true;
    buttonLabel = (
      <LoadingSpinner ariaLabel="로그인 상태 확인 중" size={16} />
    );
  } else if (!action.isLoggedIn) {
    appearance = "login";
    buttonLabel = isQueueDock
      ? (loginLabel ?? "로그인 후 노래신청")
      : "로그인후 곡 신청하기";
    buttonAction = redirectToGoogleLogin;
  }

  return (
    <>
      <AddTrackButton
        appearance={appearance}
        className={className}
        disabled={buttonDisabled}
        label={buttonLabel}
        onClick={buttonAction}
        variant={variant}
      />
      <AddTrackModalView
        disabled={false}
        open={action.isModalOpen}
        submitting={form.isSubmitting}
        value={form.inputValue}
        storyLength={form.storyLength}
        storyMaxLength={form.storyMaxLength}
        storyValue={form.storyValue}
        errorMessage={form.errorMessage}
        errorField={form.errorField}
        onChange={form.updateInputValue}
        onClose={action.closeModal}
        onStoryChange={form.updateStoryValue}
        onSubmit={action.submit}
      />
    </>
  );
}
