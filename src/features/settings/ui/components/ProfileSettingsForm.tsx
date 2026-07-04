"use client";

import type { FormEvent } from "react";
import type { ApiError } from "@/src/shared/api/api-error";
import styles from "../ProfileSettingsTab.module.css";

type ProfileSettingsFormProps = {
  badgeDisabled: boolean;
  badgeOptions: Array<{
    isAcquired: boolean;
    name: string;
    slug: string;
  }>;
  badgeStatusMessage: string | null;
  badgeValue: string;
  canUpdateNickname: boolean;
  hasProfile: boolean;
  isBadgeStatusError: boolean;
  isMeError: boolean;
  isMeLoading: boolean;
  isUpdatingProfile: boolean;
  nickname: string;
  successMessage: string | null;
  updateError: ApiError | null;
  onBadgeChange: (badgeSlug: string) => void;
  onNicknameChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function ProfileSettingsForm({
  badgeDisabled,
  badgeOptions,
  badgeStatusMessage,
  badgeValue,
  canUpdateNickname,
  hasProfile,
  isBadgeStatusError,
  isMeError,
  isMeLoading,
  isUpdatingProfile,
  nickname,
  successMessage,
  updateError,
  onBadgeChange,
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
                key={badge.slug}
                value={badge.slug}
                disabled={!badge.isAcquired}
                className={
                  badge.isAcquired
                    ? styles.badgeOptionOwned
                    : styles.badgeOptionLocked
                }
                data-owned={badge.isAcquired}
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
          사용자 이름 변경 실패: ({updateError.status}) {updateError.message}
        </p>
      ) : null}
      {isMeError ? (
        <p className={styles.errorText}>로그인 정보를 확인하지 못했습니다.</p>
      ) : null}
    </form>
  );
}
