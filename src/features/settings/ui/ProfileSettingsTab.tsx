"use client";

import Image from "next/image";
import { type FormEvent, useState } from "react";
import { useMe } from "@/src/entities/user/hooks/useMe";
import { useUpdateMe } from "@/src/features/user/profile/hooks/useUpdateMe";
import styles from "./ProfileSettingsTab.module.css";

export default function ProfileSettingsTab() {
  const [nicknameDraft, setNicknameDraft] = useState<string | null>(null);
  const [savedNickname, setSavedNickname] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { data: me, isLoading: isMeLoading, isError: isMeError } = useMe();
  const {
    mutate: updateMe,
    isPending: isUpdatingProfile,
    error: updateError,
    reset: resetUpdateMe,
  } = useUpdateMe();

  const currentNickname = savedNickname ?? me?.nickname ?? "";
  const nickname = nicknameDraft ?? currentNickname;
  const profileImageSrc = me?.profileImageUrl || "/Basic_Profile.png";
  const trimmedNickname = nickname.trim();
  const canUpdateNickname =
    Boolean(me) &&
    trimmedNickname.length > 0 &&
    trimmedNickname !== currentNickname &&
    !isUpdatingProfile;

  function handleNicknameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!me || !trimmedNickname) {
      return;
    }

    updateMe(
      { nickname: trimmedNickname },
      {
        onSuccess: (updatedUser) => {
          setNicknameDraft(null);
          setSavedNickname(updatedUser.nickname);
          setSuccessMessage("사용자 이름이 변경되었습니다.");
        },
      },
    );
  }

  return (
    <div className={styles.profilePanel}>
      <div className={styles.profileCard}>
        <div className={styles.profileImageColumn}>
          <span className={styles.profileImageWrap}>
            <Image
              src={profileImageSrc}
              alt=""
              fill
              sizes="220px"
              unoptimized={Boolean(me?.profileImageUrl)}
              className={styles.profileImage}
            />
          </span>
        </div>
        <form className={styles.profileForm} onSubmit={handleNicknameSubmit}>
          <div className={styles.formRow}>
            <label className={styles.fieldLabel} htmlFor="settings-nickname">
              사용자 이름
            </label>
            <div className={styles.nicknameControl}>
              <input
                id="settings-nickname"
                className={styles.textInput}
                value={
                  isMeLoading
                    ? "프로필 확인 중"
                    : nickname || "로그인이 필요합니다"
                }
                onChange={(event) => {
                  setNicknameDraft(event.target.value);
                  setSuccessMessage(null);
                  resetUpdateMe();
                }}
                placeholder="사용자 이름"
                disabled={!me || isUpdatingProfile || isMeLoading}
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
              사용자 이름 변경 실패: ({updateError.status}){" "}
              {updateError.message}
            </p>
          ) : null}
          {isMeError ? (
            <p className={styles.errorText}>
              로그인 정보를 확인하지 못했습니다.
            </p>
          ) : null}
        </form>
      </div>
      <dl className={styles.profileStats}>
        <div className={styles.statItem}>
          <dt>큐잉 횟수</dt>
          <dd>개발중입니다.</dd>
        </div>
        <div className={styles.statItem}>
          <dt>이용 시간</dt>
          <dd>개발중입니다.</dd>
        </div>
        <div className={styles.statItem}>
          <dt>음악력</dt>
          <dd>개발중입니다.</dd>
        </div>
      </dl>
    </div>
  );
}
