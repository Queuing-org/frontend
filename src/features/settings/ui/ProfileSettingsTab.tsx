"use client";

import { useMemo } from "react";
import Image from "next/image";
import {
  getRepresentativeBadge,
  getUserBadgeItems,
} from "@/src/features/badge/model/badgeDisplay";
import { useMyBadges } from "@/src/features/badge/hooks/useMyBadges";
import { useSetRepresentativeBadge } from "@/src/features/badge/hooks/useSetRepresentativeBadge";
import { useProfileSettingsForm } from "../hooks/useProfileSettingsForm";
import ProfileSettingsForm from "./components/ProfileSettingsForm";
import ProfileStats from "./components/ProfileStats";
import styles from "./ProfileSettingsTab.module.css";

export default function ProfileSettingsTab() {
  const form = useProfileSettingsForm();
  const myBadgesQuery = useMyBadges(Boolean(form.me));
  const setRepresentativeBadge = useSetRepresentativeBadge();
  const badgeOptions = useMemo(
    () =>
      getUserBadgeItems(myBadgesQuery.data).map((badge) => ({
        badgeCode: badge.badgeCode,
        name: badge.name,
      })),
    [myBadgesQuery.data],
  );
  const representativeBadge = getRepresentativeBadge(myBadgesQuery.data);
  const isBadgeLoading = myBadgesQuery.isLoading;
  const badgeStatusMessage = (() => {
    if (isBadgeLoading) {
      return "칭호 불러오는 중";
    }

    if (myBadgesQuery.isError) {
      return "칭호를 불러오지 못했습니다.";
    }

    if (setRepresentativeBadge.isPending) {
      return "대표 칭호 저장 중";
    }

    if (setRepresentativeBadge.error) {
      return `대표 칭호 저장 실패: ${setRepresentativeBadge.error.message}`;
    }

    return null;
  })();

  return (
    <div className={styles.profilePanel}>
      <div className={styles.profileCard}>
        <div className={styles.profileImageColumn}>
          <span className={styles.profileImageWrap}>
            <Image
              src={form.profileImageSrc}
              alt=""
              fill
              sizes="220px"
              unoptimized={Boolean(form.me?.profileImageUrl)}
              className={styles.profileImage}
            />
          </span>
          <p className={styles.profileImageCredit}>
            프로필 사진은{" "}
            <a
              className={styles.profileImageCreditLink}
              href="https://gravatar.com/profile/avatars"
              rel="noreferrer"
              target="_blank"
            >
              Gravatar
            </a>
            가 제공합니다.
          </p>
        </div>
        <ProfileSettingsForm
          canUpdateNickname={form.canUpdateNickname}
          canUpdateStatusMessage={form.canUpdateStatusMessage}
          hasProfile={form.hasProfile}
          isMeError={form.isMeError}
          isMeLoading={form.isMeLoading}
          isUpdatingProfile={form.isUpdatingProfile}
          nickname={form.nickname}
          statusMessage={form.statusMessage}
          successMessage={form.successMessage}
          updateError={form.updateError}
          badgeDisabled={
            !form.me ||
            isBadgeLoading ||
            myBadgesQuery.isError ||
            setRepresentativeBadge.isPending ||
            badgeOptions.length === 0
          }
          badgeOptions={badgeOptions}
          badgeStatusMessage={badgeStatusMessage}
          badgeValue={representativeBadge?.badgeCode ?? ""}
          isBadgeStatusError={Boolean(
            myBadgesQuery.isError || setRepresentativeBadge.error,
          )}
          onBadgeChange={(badgeCode) => {
            if (
              !badgeCode ||
              badgeCode === representativeBadge?.badgeCode
            ) {
              return;
            }

            setRepresentativeBadge.mutate({ badgeCode });
          }}
          onNicknameChange={form.updateNicknameDraft}
          onNicknameSubmit={form.handleNicknameSubmit}
          onStatusMessageChange={form.updateStatusMessageDraft}
          onStatusMessageSubmit={form.handleStatusMessageSubmit}
        />
      </div>
      <ProfileStats
        musicPower={form.me?.musicPower}
        queuingCount={form.me?.queuingCount}
      />
    </div>
  );
}
