"use client";

import { useState } from "react";
import type { Room } from "@/src/features/room/model/types";
import RoomPasswordDialog from "./RoomPasswordDialog";
import { useActionFeedback } from "@/src/shared/ui/action-feedback/ActionFeedbackProvider";

type Props = {
  room: Room | null;
  onClose: () => void;
  onSubmit: (room: Room, password: string) => Promise<void>;
};

type RoomJoinPasswordModalContentProps = Omit<Props, "room"> & {
  room: Room;
};

export default function RoomJoinPasswordModal({
  room,
  onClose,
  onSubmit,
}: Props) {
  if (!room) {
    return null;
  }

  return (
    <RoomJoinPasswordModalContent
      key={room.slug}
      room={room}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

function RoomJoinPasswordModalContent({
  room,
  onClose,
  onSubmit,
}: RoomJoinPasswordModalContentProps) {
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { notify } = useActionFeedback();

  async function handleSubmit(password: string) {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await onSubmit(room, password);
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "방에 입장할 수 없습니다.";
      setErrorMessage(message);
      notify({
        dedupeKey: `room-join:${room.slug}:password`,
        message,
        tone: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <RoomPasswordDialog
      errorMessage={errorMessage}
      open
      submitting={isSubmitting}
      onClose={onClose}
      onPasswordChange={() => setErrorMessage("")}
      onSubmit={handleSubmit}
    />
  );
}
