"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import DialogPortal from "@/src/shared/ui/dialog/DialogPortal";
import { useDialogA11y } from "@/src/shared/ui/dialog/useDialogA11y";
import {
  buildChatReportReason,
  CHAT_REPORT_REASONS,
  type ChatReportReason,
} from "../constants/reportReasons";
import { useReportChatMessage } from "../hooks/useReportChatMessage";
import styles from "./ReportChatMessageModal.module.css";

export type ReportChatMessageTarget = {
  messageKey: string;
  password?: string | null;
  slug: string;
};

type Props = {
  onClose: () => void;
  target: ReportChatMessageTarget | null;
};

export default function ReportChatMessageModal({ onClose, target }: Props) {
  const [selectedReasons, setSelectedReasons] = useState<
    Set<ChatReportReason>
  >(new Set());
  const firstCheckboxRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const reportMessage = useReportChatMessage();
  const resetReportMessage = reportMessage.reset;
  const open = Boolean(target);
  const handleClose = useCallback(() => {
    if (!reportMessage.isPending) {
      setSelectedReasons(new Set());
      resetReportMessage();
      onClose();
    }
  }, [onClose, reportMessage.isPending, resetReportMessage]);
  const { titleId } = useDialogA11y({ onClose: handleClose, open });

  useEffect(() => {
    if (!open) {
      return;
    }

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    firstCheckboxRef.current?.focus();

    return () => {
      previousFocusRef.current?.focus();
    };
  }, [open]);

  if (!target) {
    return null;
  }

  const reason = buildChatReportReason(selectedReasons);
  const toggleReason = (selectedReason: ChatReportReason) => {
    setSelectedReasons((currentReasons) => {
      const nextReasons = new Set(currentReasons);
      if (nextReasons.has(selectedReason)) {
        nextReasons.delete(selectedReason);
      } else {
        nextReasons.add(selectedReason);
      }
      return nextReasons;
    });
    reportMessage.reset();
  };
  const handleSubmit = () => {
    if (!reason || reportMessage.isPending) {
      return;
    }

    reportMessage.mutate(
      {
        messageKey: target.messageKey,
        password: target.password,
        reason,
        slug: target.slug,
      },
      { onSuccess: handleClose },
    );
  };

  return (
    <DialogPortal open={open}>
      <div
        className={styles.overlay}
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            handleClose();
          }
        }}
      >
        <section
          className={styles.modal}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-busy={reportMessage.isPending}
        >
          <h2 id={titleId} className={styles.title}>
            채팅 메시지 신고
          </h2>
          <p className={styles.description}>
            신고할 사유를 모두 선택해주세요.
          </p>
          <fieldset className={styles.reasons} disabled={reportMessage.isPending}>
            <legend className={styles.visuallyHidden}>신고 사유</legend>
            {CHAT_REPORT_REASONS.map((reportReason, index) => (
              <label key={reportReason} className={styles.reasonItem}>
                <input
                  ref={index === 0 ? firstCheckboxRef : undefined}
                  type="checkbox"
                  checked={selectedReasons.has(reportReason)}
                  onChange={() => toggleReason(reportReason)}
                />
                <span>{reportReason}</span>
              </label>
            ))}
          </fieldset>
          {reportMessage.error ? (
            <p className={styles.error} role="alert">
              {reportMessage.error.message}
            </p>
          ) : null}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleClose}
              disabled={reportMessage.isPending}
            >
              취소
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleSubmit}
              disabled={!reason || reportMessage.isPending}
            >
              {reportMessage.isPending ? "신고 중..." : "신고"}
            </button>
          </div>
        </section>
      </div>
    </DialogPortal>
  );
}
