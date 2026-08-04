"use client";

import type { FormEvent, KeyboardEvent } from "react";
import type { ApiError } from "@/src/shared/api/api-error";
import styles from "../ProfileSettingsTab.module.css";

type ProfileSettingsFormProps = {
  badgeDisabled: boolean;
  badgeOptions: Array<{
    badgeCode: string;
    name: string;
  }>;
  badgeStatusMessage: string | null;
  badgeValue: string;
  canUpdateNickname: boolean;
  canUpdateStatusMessage: boolean;
  hasProfile: boolean;
  isBadgeStatusError: boolean;
  isMeError: boolean;
  isMeLoading: boolean;
  isUpdatingProfile: boolean;
  nickname: string;
  statusMessage: string;
  successMessage: string | null;
  updateError: ApiError | null;
  onBadgeChange: (badgeCode: string) => void;
  onNicknameChange: (value: string) => void;
  onNicknameSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onStatusMessageChange: (value: string) => void;
  onStatusMessageSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function preventSubmitWhileComposing(event: KeyboardEvent<HTMLInputElement>) {
  if (
    event.key === "Enter" &&
    (event.nativeEvent.isComposing || event.keyCode === 229)
  ) {
    event.preventDefault();
  }
}

export default function ProfileSettingsForm({
  badgeDisabled,
  badgeOptions,
  badgeStatusMessage,
  badgeValue,
  canUpdateNickname,
  canUpdateStatusMessage,
  hasProfile,
  isBadgeStatusError,
  isMeError,
  isMeLoading,
  isUpdatingProfile,
  nickname,
  statusMessage,
  successMessage,
  updateError,
  onBadgeChange,
  onNicknameChange,
  onNicknameSubmit,
  onStatusMessageChange,
  onStatusMessageSubmit,
}: ProfileSettingsFormProps) {
  const nicknameInputValue = isMeLoading
    ? "프로필 확인 중"
    : hasProfile
      ? nickname
      : "로그인이 필요합니다";

  return (
    <div className={styles.profileForm}>
      <form className={styles.formRow} onSubmit={onNicknameSubmit}>
        <label className={styles.fieldLabel} htmlFor="settings-nickname">
          사용자 이름
        </label>
        <div className={styles.editableControl}>
          <input
            id="settings-nickname"
            className={styles.textInput}
            value={nicknameInputValue}
            onChange={(event) => onNicknameChange(event.target.value)}
            onKeyDown={preventSubmitWhileComposing}
            placeholder="사용자 이름"
            minLength={2}
            maxLength={20}
            disabled={!hasProfile || isUpdatingProfile || isMeLoading}
            autoComplete="nickname"
          />
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={!canUpdateNickname}
            aria-label="사용자 이름 수정"
          >
            {isUpdatingProfile ? "변경 중" : "수정"}
          </button>
        </div>
      </form>
      <form className={styles.formRow} onSubmit={onStatusMessageSubmit}>
        <label className={styles.fieldLabel} htmlFor="settings-status-message">
          한 줄 메시지
        </label>
        <div className={styles.editableControl}>
          <input
            id="settings-status-message"
            className={styles.textInput}
            value={isMeLoading ? "" : statusMessage}
            onChange={(event) => onStatusMessageChange(event.target.value)}
            onKeyDown={preventSubmitWhileComposing}
            placeholder="한 줄 메시지를 입력하세요"
            maxLength={255}
            disabled={!hasProfile || isUpdatingProfile || isMeLoading}
            aria-describedby="settings-status-message-hint"
          />
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={!canUpdateStatusMessage}
            aria-label="한 줄 메시지 수정"
          >
            {isUpdatingProfile ? "변경 중" : "수정"}
          </button>
        </div>
        <span id="settings-status-message-hint" className={styles.srOnly}>
          최대 255자, 빈 문자열로 저장하면 삭제됩니다.
        </span>
      </form>
      <div className={styles.formRow}>
        <span className={styles.fieldLabel}>최애 곡</span>
        <div className={styles.readonlyField}>개발중입니다.</div>
      </div>
      <div className={styles.formRow}>
        <label className={styles.fieldLabel} htmlFor="settings-badge">
          칭호
        </label>
        <div className={styles.selectControl}>
          <select
            id="settings-badge"
            className={styles.selectField}
            value={badgeValue}
            onChange={(event) => onBadgeChange(event.target.value)}
            disabled={badgeDisabled}
          >
            <option value="">
              {hasProfile ? "대표 칭호 선택" : "로그인이 필요합니다"}
            </option>
            {badgeOptions.map((badge) => (
              <option
                key={badge.badgeCode}
                value={badge.badgeCode}
                className={styles.badgeOptionOwned}
              >
                {badge.name}
              </option>
            ))}
          </select>
          <span className={styles.chevron} aria-hidden="true" />
        </div>
      </div>
      {badgeStatusMessage ? (
        <p
          className={
            isBadgeStatusError ? styles.badgeStatusError : styles.badgeStatusText
          }
          role={isBadgeStatusError ? "alert" : undefined}
        >
          {badgeStatusMessage}
        </p>
      ) : null}
      {successMessage ? (
        <p className={styles.successText}>{successMessage}</p>
      ) : null}
      {updateError ? (
        <p className={styles.errorText}>
          프로필 변경 실패: ({updateError.status}) {updateError.message}
        </p>
      ) : null}
      {isMeError ? (
        <p className={styles.errorText}>로그인 정보를 확인하지 못했습니다.</p>
      ) : null}
    </div>
  );
}
