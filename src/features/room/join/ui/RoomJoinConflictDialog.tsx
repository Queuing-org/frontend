"use client";

import { useEffect, useId, useRef } from "react";
import type { RoomJoinConflict } from "../model/useRoomJoinTransition";
import DialogPortal from "@/src/shared/ui/dialog/DialogPortal";
import { useDialogA11y } from "@/src/shared/ui/dialog/useDialogA11y";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import styles from "./RoomJoinConflictDialog.module.css";

type Props = {
  conflict: RoomJoinConflict | null;
  isPending: boolean;
  onConfirm: () => void;
  onReturn: () => void;
};

export default function RoomJoinConflictDialog({
  conflict,
  isPending,
  onConfirm,
  onReturn,
}: Props) {
  const returnButtonRef = useRef<HTMLButtonElement>(null);
  const descriptionId = useId();
  const { titleId } = useDialogA11y({
    onClose: isPending ? () => undefined : onReturn,
    open: Boolean(conflict),
  });

  useEffect(() => {
    if (conflict) {
      returnButtonRef.current?.focus();
    }
  }, [conflict]);

  return (
    <DialogPortal open={Boolean(conflict)}>
      <div
        className={styles.overlay}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isPending) {
            onReturn();
          }
        }}
        role="presentation"
      >
        <section
          className={styles.dialog}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
        >
          <h2 id={titleId} className={styles.title}>
            이미 참여중인 방이 있습니다
          </h2>
          <p id={descriptionId} className={styles.description}>
            현재 ‘{conflict?.currentRoom.title}’ 방에 참여 중입니다.
            <br />
            {" "}
            기존 방에서 나가고 새 방에 참여하시겠습니까?
          </p>
          <div className={styles.actions}>
            <button
              ref={returnButtonRef}
              type="button"
              className={styles.returnButton}
              disabled={isPending}
              onClick={onReturn}
            >
              돌아가기
            </button>
            <button
              type="button"
              className={styles.confirmButton}
              disabled={isPending}
              onClick={onConfirm}
            >
              {isPending ? (
                <LoadingSpinner
                  ariaLabel="새 방 참여 처리 중"
                  color="#ff0000"
                  size={18}
                />
              ) : (
                "참여하기"
              )}
            </button>
          </div>
        </section>
      </div>
    </DialogPortal>
  );
}
