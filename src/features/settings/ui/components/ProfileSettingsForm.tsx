"use client";

import type { FormEvent, KeyboardEvent } from "react";
import {
  NICKNAME_MAX_LENGTH,
  STATUS_MESSAGE_MAX_LENGTH,
} from "../../model/profileSettingsLimits";
import type { ProfileFieldFeedback } from "../../hooks/useProfileSettingsForm";
import type { UserBadge } from "@/src/features/badge/model/types";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import BadgeSelect from "./BadgeSelect";
import styles from "../ProfileSettingsTab.module.css";

type ProfileSettingsFormProps = {
  badgeDisabled: boolean;
  badgeInvalid: boolean;
  badgeOptions: UserBadge[];
  badgeStatusMessage: string | null;
  badgeValue: string;
  canUpdateProfile: boolean;
  hasProfile: boolean;
  hasProfileChanges: boolean;
  isBadgeStatusError: boolean;
  isBadgePending: boolean;
  isMeError: boolean;
  isMeLoading: boolean;
  isUpdatingProfile: boolean;
  nickname: string;
  nicknameFeedback: ProfileFieldFeedback;
  statusMessage: string;
  statusMessageFeedback: ProfileFieldFeedback;
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
  badgeInvalid,
  badgeOptions,
  badgeStatusMessage,
  badgeValue,
  canUpdateProfile,
  hasProfile,
  hasProfileChanges,
  isBadgeStatusError,
  isBadgePending,
  isMeError,
  isMeLoading,
  isUpdatingProfile,
  nickname,
  nicknameFeedback,
  statusMessage,
  statusMessageFeedback,
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
        : null;

  if (isMeLoading) {
    return (
      <div className={styles.profileFormLoading}>
        <LoadingSpinner ariaLabel="프로필 로딩 중" size={28} />
      </div>
    );
  }

  return (
    <form className={styles.profileForm} onSubmit={onProfileSubmit} noValidate>
      <div className={styles.formRow}>
        <label className={styles.fieldLabel} htmlFor="settings-nickname">
          사용자 이름
        </label>
        <div className={styles.textInputControl}>
          <input
            id="settings-nickname"
            className={`${styles.textInput} ${styles.textInputWithCounter}`}
            value={nicknameInputValue}
            onChange={(event) => onNicknameChange(event.target.value)}
            onKeyDown={preventSubmitWhileComposing}
            placeholder="사용자 이름"
            minLength={2}
            maxLength={NICKNAME_MAX_LENGTH}
            disabled={!hasProfile || isUpdatingProfile || isMeLoading}
            autoComplete="nickname"
            data-feedback={nicknameFeedback ?? undefined}
            aria-invalid={nicknameFeedback === "error"}
            aria-describedby={`settings-nickname-count settings-nickname-hint${
              nicknameFeedback === "error" ? " settings-nickname-error" : ""
            }`}
          />
          <span id="settings-nickname-count" className={styles.characterCount}>
            {hasProfile ? nickname.length : 0}/{NICKNAME_MAX_LENGTH}
          </span>
        </div>
        <span id="settings-nickname-hint" className={styles.srOnly}>
          최대 {NICKNAME_MAX_LENGTH}자입니다.
        </span>
        <span id="settings-nickname-error" className={styles.srOnly}>
          사용자 이름 입력을 확인해 주세요.
        </span>
      </div>
      <div className={styles.formRow}>
        <label className={styles.fieldLabel} htmlFor="settings-status-message">
          최애곡
        </label>
        <div className={styles.textInputControl}>
          <input
            id="settings-status-message"
            className={`${styles.textInput} ${styles.textInputWithCounter}`}
            value={isMeLoading ? "" : statusMessage}
            onChange={(event) => onStatusMessageChange(event.target.value)}
            onKeyDown={preventSubmitWhileComposing}
            placeholder="최애곡을 입력하세요"
            maxLength={STATUS_MESSAGE_MAX_LENGTH}
            disabled={!hasProfile || isUpdatingProfile || isMeLoading}
            aria-describedby={`settings-status-message-count settings-status-message-hint${
              statusMessageFeedback === "error"
                ? " settings-status-message-error"
                : ""
            }`}
            data-feedback={statusMessageFeedback ?? undefined}
            aria-invalid={statusMessageFeedback === "error"}
          />
          <span
            id="settings-status-message-count"
            className={styles.characterCount}
          >
            {statusMessage.length}/{STATUS_MESSAGE_MAX_LENGTH}
          </span>
        </div>
        <span id="settings-status-message-hint" className={styles.srOnly}>
          최대 20자, 빈 문자열로 저장하면 삭제됩니다.
        </span>
        <span id="settings-status-message-error" className={styles.srOnly}>
          최애곡 입력을 확인해 주세요.
        </span>
      </div>
      <div className={styles.formRow}>
        <label className={styles.fieldLabel} htmlFor="settings-badge">
          칭호
        </label>
        <BadgeSelect
          disabled={badgeDisabled}
          emptyLabel={hasProfile ? "칭호 없음" : "로그인이 필요합니다"}
          invalid={badgeInvalid}
          options={badgeOptions}
          value={badgeValue}
          onChange={onBadgeChange}
        />
        <span id="settings-badge-error" className={styles.srOnly}>
          대표 칭호 저장에 실패했습니다.
        </span>
      </div>
      <div className={styles.formFooter}>
        <div
          className={styles.feedbackArea}
          data-tone={feedback?.tone}
          role={feedback?.tone === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {isBadgePending && !isMeError ? (
            <LoadingSpinner
              announce={false}
              ariaLabel="칭호 정보 처리 중"
              size={14}
            />
          ) : null}
          {feedback?.message ?? ""}
        </div>
        {hasProfileChanges ? (
          <button
            type="submit"
            className={styles.completeButton}
            disabled={!canUpdateProfile}
            aria-busy={isUpdatingProfile}
          >
            {isUpdatingProfile ? (
              <LoadingSpinner
                ariaLabel="프로필 변경 중"
                color="#ffffff"
                size={16}
              />
            ) : (
              "완료"
            )}
          </button>
        ) : null}
      </div>
    </form>
  );
}
