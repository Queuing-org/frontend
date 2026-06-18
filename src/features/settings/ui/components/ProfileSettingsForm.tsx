"use client";

import type { FormEvent } from "react";
import type { ApiError } from "@/src/shared/api/api-error";
import styles from "../ProfileSettingsTab.module.css";

type ProfileSettingsFormProps = {
  canUpdateNickname: boolean;
  hasProfile: boolean;
  isMeError: boolean;
  isMeLoading: boolean;
  isUpdatingProfile: boolean;
  nickname: string;
  successMessage: string | null;
  updateError: ApiError | null;
  onNicknameChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function ProfileSettingsForm({
  canUpdateNickname,
  hasProfile,
  isMeError,
  isMeLoading,
  isUpdatingProfile,
  nickname,
  successMessage,
  updateError,
  onNicknameChange,
  onSubmit,
}: ProfileSettingsFormProps) {
  const nicknameInputValue = isMeLoading
    ? "프로필 확인 중"
    : hasProfile
      ? nickname
      : "로그인이 필요합니다";

  return (
    <form className={styles.profileForm} onSubmit={onSubmit}>
      <div className={styles.formRow}>
        <label className={styles.fieldLabel} htmlFor="settings-nickname">
          사용자 이름
        </label>
        <div className={styles.nicknameControl}>
          <input
            id="settings-nickname"
            className={styles.textInput}
            value={nicknameInputValue}
            onChange={(event) => onNicknameChange(event.target.value)}
            placeholder="사용자 이름"
            disabled={!hasProfile || isUpdatingProfile || isMeLoading}
            autoComplete="nickname"
          />
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={!canUpdateNickname}
          >
            {isUpdatingProfile ? "변경 중" : "저장"}
          </button>
        </div>
      </div>
      <div className={styles.formRow}>
        <span className={styles.fieldLabel}>최애 곡</span>
        <div className={styles.readonlyField}>개발중입니다.</div>
      </div>
      <div className={styles.formRow}>
        <span className={styles.fieldLabel}>칭호</span>
        <div className={styles.readonlyField}>
          개발중입니다.
          <span className={styles.chevron} aria-hidden="true" />
        </div>
      </div>
      {successMessage ? (
        <p className={styles.successText}>{successMessage}</p>
      ) : null}
      {updateError ? (
        <p className={styles.errorText}>
          사용자 이름 변경 실패: ({updateError.status}) {updateError.message}
        </p>
      ) : null}
      {isMeError ? (
        <p className={styles.errorText}>로그인 정보를 확인하지 못했습니다.</p>
      ) : null}
    </form>
  );
}
