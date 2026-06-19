"use client";

import { useState, type FormEvent } from "react";
import type { Room } from "@/src/features/room/model/types";
import { joinRoom } from "@/src/features/room/api/joinRoom";
import { writeStoredRoomJoinPassword } from "../lib/roomJoinPasswordStorage";
import styles from "./RoomJoinPasswordModal.module.css";

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
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedPassword = password.trim();
  const canSubmit = trimmedPassword.length > 0 && !isSubmitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!trimmedPassword) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await joinRoom(room.slug, { password: trimmedPassword });
      writeStoredRoomJoinPassword(room.slug, trimmedPassword);
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
    <div
      className={styles.overlay}
      onClick={() => {
        if (!isSubmitting) {
          onClose();
        }
      }}
      role="presentation"
    >
      <form
        className={styles.modal}
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="room-join-password-title"
        aria-describedby="room-join-password-description"
      >
        <div className={styles.header}>
          <h2 id="room-join-password-title" className={styles.title}>
            방 비밀번호
          </h2>
          <p
            id="room-join-password-description"
            className={styles.description}
          >
            비밀번호 입력이 필요한 방입니다. 방장이 알려준 비밀번호를
            입력해주세요.
          </p>
        </div>

        <div className={styles.field}>
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="비밀번호 입력"
            disabled={isSubmitting}
            aria-label="방 비밀번호"
            autoFocus
          />
          {errorMessage ? (
            <p className={styles.errorText}>{errorMessage}</p>
          ) : null}
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
            disabled={isSubmitting}
          >
            취소
          </button>
          <button
            type="submit"
            className={styles.confirmButton}
            disabled={!canSubmit}
          >
            {isSubmitting ? "확인 중" : "확인"}
          </button>
        </div>
      </form>
    </div>
  );
}
