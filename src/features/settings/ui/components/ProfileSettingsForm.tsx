"use client";

import type { FormEvent, KeyboardEvent } from "react";
import type { ProfileFieldFeedback } from "../../hooks/useProfileSettingsForm";
import type { ApiError } from "@/src/shared/api/api-error";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import styles from "../ProfileSettingsTab.module.css";

type ProfileSettingsFormProps = {
  badgeDisabled: boolean;
  badgeOptions: Array<{
    badgeCode: string;
    name: string;
  }>;
  badgeStatusMessage: string | null;
  badgeValue: string;
  canUpdateProfile: boolean;
  hasProfile: boolean;
  isBadgeStatusError: boolean;
  isBadgePending: boolean;
  isMeError: boolean;
  isMeLoading: boolean;
  isUpdatingProfile: boolean;
  nickname: string;
  nicknameFeedback: ProfileFieldFeedback;
  statusMessage: string;
  statusMessageFeedback: ProfileFieldFeedback;
  successMessage: string | null;
  updateError: ApiError | null;
  onBadgeChange: (badgeCode: string) => void;
  onNicknameChange: (value: string) => void;
  onProfileSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onStatusMessageChange: (value: string) => void;
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
  canUpdateProfile,
  hasProfile,
  isBadgeStatusError,
  isBadgePending,
  isMeError,
  isMeLoading,
  isUpdatingProfile,
  nickname,
  nicknameFeedback,
  statusMessage,
  statusMessageFeedback,
  successMessage,
  updateError,
  onBadgeChange,
  onNicknameChange,
  onProfileSubmit,
  onStatusMessageChange,
}: ProfileSettingsFormProps) {
  const nicknameInputValue = hasProfile ? nickname : "로그인이 필요합니다";
  const feedback = isMeError
    ? { message: "로그인 정보를 확인하지 못했습니다.", tone: "error" }
    : badgeStatusMessage
      ? {
          message: badgeStatusMessage,
          tone: isBadgeStatusError ? "error" : "neutral",
        }
      : isBadgePending
        ? { message: "칭호 정보 처리 중", tone: "neutral" }
        : updateError
          ? { message: `프로필 변경 실패: ${updateError.message}`, tone: "error" }
          : successMessage
            ? { message: successMessage, tone: "success" }
            : null;

  if (isMeLoading) {
    return (
      <div className={styles.profileFormLoading}>
        <LoadingSpinner ariaLabel="프로필 로딩 중" size={28} />
      </div>
    );
  }

  return (
    <form className={styles.profileForm} onSubmit={onProfileSubmit}>
      <div className={styles.formRow}>
        <label className={styles.fieldLabel} htmlFor="settings-nickname">
          사용자 이름
        </label>
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
          data-feedback={nicknameFeedback ?? undefined}
        />
      </div>
      <div className={styles.formRow}>
        <label className={styles.fieldLabel} htmlFor="settings-status-message">
          한 줄 메시지
        </label>
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
          data-feedback={statusMessageFeedback ?? undefined}
        />
        <span id="settings-status-message-hint" className={styles.srOnly}>
          최대 255자, 빈 문자열로 저장하면 삭제됩니다.
        </span>
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
              {hasProfile ? "칭호 없음" : "로그인이 필요합니다"}
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
      <div className={styles.formActions}>
        <button
          type="submit"
          className={styles.completeButton}
          disabled={!canUpdateProfile}
          aria-busy={isUpdatingProfile}
        >
          {isUpdatingProfile ? (
            <LoadingSpinner ariaLabel="프로필 변경 중" color="#ffffff" size={16} />
          ) : (
            "완료"
          )}
        </button>
      </div>
      <div
        className={styles.feedbackArea}
        data-tone={feedback?.tone}
        role={feedback?.tone === "error" ? "alert" : "status"}
        aria-live="polite"
      >
        {isBadgePending && !updateError && !successMessage && !isMeError ? (
          <LoadingSpinner
            announce={false}
            ariaLabel="칭호 정보 처리 중"
            size={14}
          />
        ) : null}
        {feedback?.message ?? ""}
      </div>
    </form>
  );
}
