"use client";

import { useState } from "react";
import { publishAddTrack } from "@/src/features/playlist/api/websocket/publishAddTrack";
import { useMe } from "@/src/features/user/session/hooks/useMe";
import { useAddTrackForm } from "./useAddTrackForm";

export function useAddTrackAction(slug: string) {
  const { data: me, isError, isLoading } = useMe();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const form = useAddTrackForm();
  const isLoggedIn = Boolean(me) && !isError;

  const closeModal = () => {
    setIsModalOpen(false);
    form.reset();
  };

  const openModal = () => {
    setIsModalOpen(true);
    form.setErrorMessage("");
  };

  const submit = () => {
    if (!form.videoId) {
      form.setErrorMessage("올바른 유튜브 링크를 입력해주세요.");
      return;
    }

    form.setIsSubmitting(true);
    form.setErrorMessage("");

    try {
      publishAddTrack(slug, { videoId: form.videoId });
      closeModal();
    } catch (error) {
      form.setErrorMessage(
        error instanceof Error
          ? error.message
          : "곡 신청 요청을 보내지 못했습니다.",
      );
      form.setIsSubmitting(false);
    }
  };

  return {
    closeModal,
    form,
    isLoading,
    isLoggedIn,
    isModalOpen,
    openModal,
    submit,
  };
}
