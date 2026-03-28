"use client";

import { useState } from "react";
import { publishAddTrack } from "@/src/entities/playlist/api/websocket/publishAddTrack";
import { useMe } from "@/src/entities/user/hooks/useMe";
import { redirectToGoogleLogin } from "@/src/features/auth/login-with-google/api/login";
import { extractYouTubeVideoId } from "../model/extractYouTubeVideoId";
import AddTrackModal from "./AddTrackModal";

type AddTrackActionProps = {
  slug: string;
};

export default function AddTrackAction({ slug }: AddTrackActionProps) {
  const { data: me, isError, isLoading } = useMe();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLoggedIn = Boolean(me) && !isError;

  function resetModalState() {
    setInputValue("");
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

  if (isLoading) {
    return (
      <button
        type="button"
        disabled
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-500"
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
        className="rounded-lg border border-black px-4 py-2 text-sm font-medium text-black"
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
        className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
      >
        곡 추가
      </button>
      <AddTrackModal
        open={isModalOpen}
        submitting={isSubmitting}
        value={inputValue}
        errorMessage={errorMessage}
        onChange={handleInputChange}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
      />
    </>
  );
}
