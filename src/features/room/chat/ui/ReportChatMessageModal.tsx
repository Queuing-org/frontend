"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import DialogPortal from "@/src/shared/ui/dialog/DialogPortal";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import { useDialogA11y } from "@/src/shared/ui/dialog/useDialogA11y";
import {
  buildChatReportReason,
  CHAT_REPORT_REASONS,
  type ChatReportReason,
} from "../constants/reportReasons";
import { useReportChatMessage } from "../hooks/useReportChatMessage";
import { useActionFeedback } from "@/src/shared/ui/action-feedback/ActionFeedbackProvider";
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
  const [isReasonInvalid, setIsReasonInvalid] = useState(false);
  const firstCheckboxRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const reportMessage = useReportChatMessage();
  const { notify } = useActionFeedback();
  const resetReportMessage = reportMessage.reset;
  const open = Boolean(target);
  const handleClose = useCallback(() => {
    if (!reportMessage.isPending) {
      setSelectedReasons(new Set());
      setIsReasonInvalid(false);
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
    setIsReasonInvalid(false);
    reportMessage.reset();
  };
  const handleSubmit = () => {
    if (reportMessage.isPending) {
      return;
    }
    if (!reason) {
      setIsReasonInvalid(true);
      notify({
        dedupeKey: `report-reason:${target.slug}`,
        message: "신고 사유를 하나 이상 선택해 주세요.",
        tone: "error",
      });
      return;
    }

    reportMessage.mutate(
      {
        messageKey: target.messageKey,
        password: target.password,
        reason,
        slug: target.slug,
      },
      {
        onSuccess: () => {
          notify({
            dedupeKey: `report:${target.slug}:${target.messageKey}`,
            message: "신고가 접수되었습니다.",
            tone: "default",
          });
          setSelectedReasons(new Set());
          setIsReasonInvalid(false);
          resetReportMessage();
          onClose();
        },
        onError: (error) => {
          notify({
            dedupeKey: `report:${target.slug}:${target.messageKey}`,
            message: error.message || "신고를 접수하지 못했습니다.",
            tone: "error",
          });
        },
      },
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
          <fieldset
            className={styles.reasons}
            disabled={reportMessage.isPending}
            aria-invalid={isReasonInvalid}
            aria-describedby={isReasonInvalid ? `${titleId}-reason-error` : undefined}
          >
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
          <span id={`${titleId}-reason-error`} className={styles.visuallyHidden}>
            신고 사유를 하나 이상 선택해 주세요.
          </span>
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
              disabled={reportMessage.isPending}
            >
              {reportMessage.isPending ? (
                <LoadingSpinner
                  ariaLabel="신고 중"
                  color="#ffffff"
                  size={16}
                />
              ) : (
                "신고"
              )}
            </button>
          </div>
        </section>
      </div>
    </DialogPortal>
  );
}
