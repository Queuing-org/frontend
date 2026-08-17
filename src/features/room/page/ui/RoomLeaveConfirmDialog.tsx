"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import RoomActionConfirmDialog from "@/src/features/room/management/ui/RoomActionConfirmDialog";
import { useActionFeedback } from "@/src/shared/ui/action-feedback/ActionFeedbackProvider";

type Props = {
  onCancel: () => void;
  onLeaveRoom: () => boolean;
  onSuccess: () => void;
  open: boolean;
  roomSlug: string;
  roomTitle: string;
};

export default function RoomLeaveConfirmDialog({
  onCancel,
  onLeaveRoom,
  onSuccess,
  open,
  roomSlug,
  roomTitle,
}: Props) {
  const router = useRouter();
  const { notify } = useActionFeedback();
  const [isPending, setIsPending] = useState(false);
  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(
    () => () => {
      if (navigationTimeoutRef.current !== null) {
        clearTimeout(navigationTimeoutRef.current);
      }
    },
    [],
  );

  return (
    <RoomActionConfirmDialog
      confirmLabel="나가기"
      description={
        <>
          해당 큐에서 나가시겠어요?
          <br />
          신청한 노래가 모두 삭제되고 복원할 수 없습니다.
        </>
      }
      isPending={isPending}
      open={open}
      title={roomTitle}
      onCancel={onCancel}
      onConfirm={() => {
        if (isPending) {
          return;
        }
        if (!onLeaveRoom()) {
          notify({
            dedupeKey: `room-leave:${roomSlug}`,
            message: "방에서 나가지 못했습니다.",
            tone: "error",
          });
          return;
        }

        setIsPending(true);
        notify({
          dedupeKey: `room-leave:${roomSlug}`,
          message: `'${roomTitle}' 방에서 나갔습니다.`,
          tone: "default",
        });
        navigationTimeoutRef.current = setTimeout(() => {
          navigationTimeoutRef.current = null;
          onSuccess();
          router.replace("/");
        }, 500);
      }}
    />
  );
}
