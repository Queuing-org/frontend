"use client";

import { useState } from "react";
import Image from "next/image";
import { useLogout } from "@/src/features/auth/logout/model/useLogout";
import { useMe } from "@/src/features/user/session/hooks/useMe";
import { useWithdrawMe } from "@/src/features/user/profile/hooks/useWithdrawMe";
import styles from "./AccountSettingsTab.module.css";

const OPEN_KAKAO_URL = "https://open.kakao.com/o/s3wsw7zi";
const PRIVACY_POLICY_URL = "https://queuing.patulus.com/privacy";

type AccountSettingsTabProps = {
  onLoggedOut: () => void;
};

export default function AccountSettingsTab({
  onLoggedOut,
}: AccountSettingsTabProps) {
  const [isConfirmingWithdraw, setIsConfirmingWithdraw] = useState(false);
  const { data: me } = useMe();
  const {
    mutate: logout,
    isPending: isLoggingOut,
    error: logoutError,
  } = useLogout();
  const {
    mutate: withdraw,
    isPending: isWithdrawing,
    error: withdrawError,
    reset: resetWithdraw,
  } = useWithdrawMe();
  const isAccountActionPending = isLoggingOut || isWithdrawing;

  function handleLogout() {
    setIsConfirmingWithdraw(false);
    logout(undefined, {
      onSuccess: onLoggedOut,
    });
  }

  function handleWithdraw() {
    if (!isConfirmingWithdraw) {
      resetWithdraw();
      setIsConfirmingWithdraw(true);
      return;
    }

    withdraw(undefined, {
      onSuccess: onLoggedOut,
    });
  }

  return (
    <div className={styles.accountPanel}>
      <div className={styles.contactCard}>
        <div className={styles.contactCopy}>
          <div className={styles.contactTitleRow}>
            <span className={styles.contactIcon} aria-hidden="true">
              <Image src="/icons/errorchat.svg" alt="" width={30} height={30} />
            </span>
            <h3 className={styles.contactTitle}>오류 제보 및 건의 사항</h3>
          </div>
          <p className={styles.contactDescription}>
            서비스 이용 중 불편한 점이나 오류, 건의사항이 있다면 언제든
            알려주세요.
            <br />
            여러분의 소중한 의견으로 더 나은 큐잉을 만들어갑니다.
          </p>
          <a
            className={styles.policyText}
            href={PRIVACY_POLICY_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            개인정보처리방침
          </a>
        </div>

        <a
          className={styles.qrCard}
          href={OPEN_KAKAO_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="오류 제보 및 건의 사항 오픈카톡 열기"
        >
          <span className={styles.qrImageFrame}>
            <Image
              src="/settings/open-kakao-qr.svg"
              alt="오픈카톡 문의방 QR 코드"
              width={208}
              height={208}
              unoptimized
              className={styles.qrImage}
            />
          </span>
          <span className={styles.qrLabel}>QR SCAN</span>
          <span className={styles.openHint}>클릭해서 오픈카톡 열기</span>
          <span className={styles.visuallyHidden}>
            QR 코드는 {OPEN_KAKAO_URL} 주소로 연결됩니다.
          </span>
        </a>
      </div>

      <div className={styles.accountActions}>
        <button
          type="button"
          className={`${styles.actionButton} ${styles.logoutButton}`}
          onClick={handleLogout}
          disabled={!me || isAccountActionPending}
        >
          {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
        </button>
        <span className={styles.actionDivider} aria-hidden="true" />
        <button
          type="button"
          className={`${styles.actionButton} ${styles.withdrawButton}`}
          onClick={handleWithdraw}
          disabled={!me || isAccountActionPending}
        >
          {isWithdrawing
            ? "탈퇴 중..."
            : isConfirmingWithdraw
              ? "탈퇴 확인"
              : "회원탈퇴"}
        </button>
        {isConfirmingWithdraw && !isWithdrawing ? (
          <button
            type="button"
            className={`${styles.actionButton} ${styles.cancelWithdrawButton}`}
            onClick={() => setIsConfirmingWithdraw(false)}
          >
            취소
          </button>
        ) : null}
      </div>

      {isConfirmingWithdraw ? (
        <p className={styles.confirmText}>
          탈퇴하려면 한 번 더 눌러주세요.
        </p>
      ) : null}

      {logoutError ? (
        <p className={styles.errorText} role="alert">
          로그아웃 실패: {logoutError.message}
        </p>
      ) : null}
      {withdrawError ? (
        <p className={styles.errorText} role="alert">
          회원탈퇴 실패: {withdrawError.message}
        </p>
      ) : null}
    </div>
  );
}
