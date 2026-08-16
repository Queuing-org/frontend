"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import DialogPortal from "@/src/shared/ui/dialog/DialogPortal";
import { useDialogA11y } from "@/src/shared/ui/dialog/useDialogA11y";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import styles from "./WithdrawalDialog.module.css";

const WITHDRAWAL_REASONS = [
  "자주 사용하지 않아요",
  "같이 즐길 장르/방이 없어요",
  "기능 오류 및 불편함이 있어요",
  "기타",
] as const;

type WithdrawalReason = (typeof WITHDRAWAL_REASONS)[number];
type WithdrawalStep = "reasons" | "confirm";

type Props = {
  errorMessage?: string | null;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
};

export default function WithdrawalDialog({
  errorMessage,
  isPending,
  onClose,
  onSubmit,
}: Props) {
  const [step, setStep] = useState<WithdrawalStep>("reasons");
  const [selectedReasons, setSelectedReasons] = useState<
    Set<WithdrawalReason>
  >(new Set());
  const [isConfirmReady, setIsConfirmReady] = useState(false);
  const firstCheckboxRef = useRef<HTMLInputElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const handleClose = useCallback(() => {
    if (!isPending) {
      onClose();
    }
  }, [isPending, onClose]);
  const { titleId } = useDialogA11y({ onClose: handleClose, open: true });

  useEffect(() => {
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    firstCheckboxRef.current?.focus();

    return () => {
      previousFocusRef.current?.focus();
    };
  }, []);

  useEffect(() => {
    if (step !== "confirm") {
      return;
    }

    cancelButtonRef.current?.focus();
    const timerId = window.setTimeout(() => {
      setIsConfirmReady(true);
    }, 2_000);

    return () => window.clearTimeout(timerId);
  }, [step]);

  const reason = WITHDRAWAL_REASONS.filter((item) =>
    selectedReasons.has(item),
  ).join("\n");

  function toggleReason(selectedReason: WithdrawalReason) {
    if (isPending) {
      return;
    }

    setSelectedReasons((currentReasons) => {
      const nextReasons = new Set(currentReasons);
      if (nextReasons.has(selectedReason)) {
        nextReasons.delete(selectedReason);
      } else {
        nextReasons.add(selectedReason);
      }
      return nextReasons;
    });
  }

  return (
    <DialogPortal open>
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
          className={styles.dialog}
          data-step={step}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-busy={isPending}
        >
          {step === "reasons" ? (
            <>
              <h2 id={titleId} className={styles.title}>
                탈퇴하시는 이유를 알려주세요
              </h2>
              <fieldset className={styles.reasons} disabled={isPending}>
                <legend className={styles.visuallyHidden}>탈퇴 사유</legend>
                {WITHDRAWAL_REASONS.map((withdrawalReason, index) => (
                  <label key={withdrawalReason} className={styles.reasonItem}>
                    <input
                      ref={index === 0 ? firstCheckboxRef : undefined}
                      className={styles.reasonInput}
                      type="checkbox"
                      checked={selectedReasons.has(withdrawalReason)}
                      onChange={() => toggleReason(withdrawalReason)}
                    />
                    <span className={styles.checkboxVisual} aria-hidden="true" />
                    <span>{withdrawalReason}</span>
                  </label>
                ))}
              </fieldset>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={handleClose}
                >
                  취소
                </button>
                <button
                  type="button"
                  className={styles.confirmButton}
                  disabled={!reason}
                  onClick={() => {
                    if (reason) {
                      setIsConfirmReady(false);
                      setStep("confirm");
                    }
                  }}
                >
                  탈퇴하기
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 id={titleId} className={styles.title}>
                탈퇴하기
              </h2>
              <p className={styles.description}>
                지금까지 서비스를 즐겨주신 시간에 감사드립니다.
                <br />
                고객님께서 공유해주신 점을 토대로 더욱 건강한
                <br />
                서비스를 제공할 수 있도록 노력하겠습니다.
              </p>
              {errorMessage ? (
                <p className={styles.error} role="alert">
                  회원탈퇴 실패: {errorMessage}
                </p>
              ) : null}
              <div className={styles.actions}>
                <button
                  ref={cancelButtonRef}
                  type="button"
                  className={styles.cancelButton}
                  disabled={isPending}
                  onClick={handleClose}
                >
                  취소
                </button>
                <button
                  type="button"
                  className={styles.confirmButton}
                  disabled={!isConfirmReady || isPending}
                  onClick={() => onSubmit(reason)}
                >
                  {isPending ? (
                    <LoadingSpinner
                      ariaLabel="회원 탈퇴 중"
                      color="#ff0000"
                      size={18}
                    />
                  ) : (
                    "탈퇴하기"
                  )}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </DialogPortal>
  );
}
