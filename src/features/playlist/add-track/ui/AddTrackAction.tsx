"use client";

import { redirectToGoogleLogin } from "@/src/features/auth/login-with-google/api/login";
import { useAddTrackAction } from "../hooks/useAddTrackAction";
import AddTrackButton from "./AddTrackButton";
import AddTrackModalView from "./AddTrackModalView";

type AddTrackActionProps = {
  className?: string;
  label?: string;
  loginLabel?: string;
  roomPassword?: string | null;
  slug: string;
  variant?: "default" | "queueDock";
};

export default function AddTrackAction({
  className,
  label: labelOverride,
  loginLabel,
  roomPassword,
  slug,
  variant = "default",
}: AddTrackActionProps) {
  const action = useAddTrackAction(slug, roomPassword);
  const isQueueDock = variant === "queueDock";
  const form = action.form;
  let appearance: "loading" | "login" | "primary" = "primary";
  let buttonDisabled = false;
  let buttonLabel = isQueueDock ? (labelOverride ?? "큐잉하기") : "곡 추가";
  let buttonAction = action.openModal;

  if (action.isLoading) {
    appearance = "loading";
    buttonDisabled = true;
    buttonLabel = isQueueDock ? "확인 중" : "로그인 확인 중...";
  } else if (!action.isLoggedIn) {
    appearance = "login";
    buttonLabel = isQueueDock
      ? (loginLabel ?? "로그인 후 큐잉")
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
        disabled={!form.canSubmit}
        open={action.isModalOpen}
        submitting={form.isSubmitting}
        value={form.inputValue}
        storyLength={form.storyLength}
        storyMaxLength={form.storyMaxLength}
        storyValue={form.storyValue}
        errorMessage={form.errorMessage}
        onChange={form.updateInputValue}
        onClose={action.closeModal}
        onStoryChange={form.updateStoryValue}
        onSubmit={action.submit}
      />
    </>
  );
}
