"use client";

import { useState } from "react";
import Image from "next/image";
import { publishAddTrack } from "@/src/entities/playlist/api/websocket/publishAddTrack";
import { useMe } from "@/src/entities/user/hooks/useMe";
import { redirectToGoogleLogin } from "@/src/features/auth/login-with-google/api/login";
import { extractYouTubeVideoId } from "../model/extractYouTubeVideoId";
import AddTrackModal from "./AddTrackModal";
import styles from "./AddTrackAction.module.css";

type AddTrackActionProps = {
  className?: string;
  slug: string;
  variant?: "default" | "queueDock";
};

export default function AddTrackAction({
  className,
  slug,
  variant = "default",
}: AddTrackActionProps) {
  const { data: me, isError, isLoading } = useMe();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [reasonValue, setReasonValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLoggedIn = Boolean(me) && !isError;
  const isQueueDock = variant === "queueDock";
  const canSubmit = Boolean(extractYouTubeVideoId(inputValue));

  function resetModalState() {
    setInputValue("");
    setReasonValue("");
    setErrorMessage("");
    setIsSubmitting(false);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    resetModalState();
  }

  function handleOpenModal() {
    setIsModalOpen(true);
    setErrorMessage("");
  }

  function handleInputChange(value: string) {
    setInputValue(value);
    if (errorMessage) {
      setErrorMessage("");
    }
  }

  function handleReasonChange(value: string) {
    setReasonValue(value);
  }

  async function handleSubmit() {
    const videoId = extractYouTubeVideoId(inputValue);
    if (!videoId) {
      setErrorMessage("올바른 유튜브 링크를 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      publishAddTrack(slug, { videoId });
      handleCloseModal();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "곡 신청 요청을 보내지 못했습니다.",
      );
      setIsSubmitting(false);
    }
  }

  function renderQueueDockButton() {
    let label = "큐잉하기";
    let disabled = false;
    let onClick = handleOpenModal;

    if (isLoading) {
      label = "확인 중";
      disabled = true;
    } else if (!isLoggedIn) {
      label = "로그인 후 큐잉";
      onClick = redirectToGoogleLogin;
    }

    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={[styles.queueDockButton, className]
          .filter(Boolean)
          .join(" ")}
      >
        <Image
          src="/icons/add.svg"
          alt=""
          width={18}
          height={18}
          draggable={false}
          className={styles.queueDockIcon}
        />
        <span>{label}</span>
      </button>
    );
  }

  if (isQueueDock) {
    return (
      <>
        {renderQueueDockButton()}
        <AddTrackModal
          disabled={!canSubmit}
          open={isModalOpen}
          reason={reasonValue}
          submitting={isSubmitting}
          value={inputValue}
          errorMessage={errorMessage}
          onChange={handleInputChange}
          onClose={handleCloseModal}
          onReasonChange={handleReasonChange}
          onSubmit={handleSubmit}
        />
      </>
    );
  }

  if (isLoading) {
    return (
      <button
        type="button"
        disabled
        className={[
          "rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-500",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        로그인 확인 중...
      </button>
    );
  }

  if (!isLoggedIn) {
    return (
      <button
        type="button"
        onClick={redirectToGoogleLogin}
        className={[
          "rounded-lg border border-black px-4 py-2 text-sm font-medium text-black",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        로그인후 곡 신청하기
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpenModal}
        className={[
          "rounded-lg bg-black px-4 py-2 text-sm font-medium text-white",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        곡 추가
      </button>
      <AddTrackModal
        disabled={!canSubmit}
        open={isModalOpen}
        reason={reasonValue}
        submitting={isSubmitting}
        value={inputValue}
        errorMessage={errorMessage}
        onChange={handleInputChange}
        onClose={handleCloseModal}
        onReasonChange={handleReasonChange}
        onSubmit={handleSubmit}
      />
    </>
  );
}
