"use client";

import { useState } from "react";
import type { Room } from "@/src/features/room/model/types";
import { joinRoom } from "@/src/features/room/api/joinRoom";
import { writeStoredRoomJoinPassword } from "../lib/roomJoinPasswordStorage";
import RoomPasswordDialog from "./RoomPasswordDialog";

type Props = {
  room: Room | null;
  onClose: () => void;
  onJoined: (room: Room) => void;
};

type RoomJoinPasswordModalContentProps = Omit<Props, "room"> & {
  room: Room;
};

export default function RoomJoinPasswordModal({
  room,
  onClose,
  onJoined,
}: Props) {
  if (!room) {
    return null;
  }

  return (
    <RoomJoinPasswordModalContent
      key={room.slug}
      room={room}
      onClose={onClose}
      onJoined={onJoined}
    />
  );
}

function RoomJoinPasswordModalContent({
  room,
  onClose,
  onJoined,
}: RoomJoinPasswordModalContentProps) {
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(password: string) {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await joinRoom(room.slug, { password });
      writeStoredRoomJoinPassword(room.slug, password);
      onJoined(room);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "방에 입장할 수 없습니다.",
      );
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
      onSubmit={handleSubmit}
    />
  );
}
