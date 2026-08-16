"use client";

import { useMemo } from "react";
import Image from "next/image";
import {
  getRepresentativeBadge,
  getUserBadgeItems,
} from "@/src/features/badge/model/badgeDisplay";
import { useMyBadges } from "@/src/features/badge/hooks/useMyBadges";
import { useClearRepresentativeBadge } from "@/src/features/badge/hooks/useClearRepresentativeBadge";
import { useSetRepresentativeBadge } from "@/src/features/badge/hooks/useSetRepresentativeBadge";
import { useProfileSettingsForm } from "../hooks/useProfileSettingsForm";
import ProfileSettingsForm from "./components/ProfileSettingsForm";
import ProfileStats from "./components/ProfileStats";
import styles from "./ProfileSettingsTab.module.css";

export default function ProfileSettingsTab() {
  const form = useProfileSettingsForm();
  const myBadgesQuery = useMyBadges(Boolean(form.me));
  const clearRepresentativeBadge = useClearRepresentativeBadge();
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
  const isBadgePending =
    isBadgeLoading ||
    setRepresentativeBadge.isPending ||
    clearRepresentativeBadge.isPending;
  const badgeStatusMessage = (() => {
    if (myBadgesQuery.isError) {
      return "칭호를 불러오지 못했습니다.";
    }

    const badgeMutationError =
      setRepresentativeBadge.error ?? clearRepresentativeBadge.error;
    if (badgeMutationError) {
      return `대표 칭호 저장 실패: ${badgeMutationError.message}`;
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
          canUpdateProfile={form.canUpdateProfile}
          hasProfile={form.hasProfile}
          hasProfileChanges={form.hasProfileChanges}
          isMeError={form.isMeError}
          isMeLoading={form.isMeLoading}
          isUpdatingProfile={form.isUpdatingProfile}
          nickname={form.nickname}
          nicknameFeedback={form.nicknameFeedback}
          statusMessage={form.statusMessage}
          statusMessageFeedback={form.statusMessageFeedback}
          successMessage={form.successMessage}
          updateError={form.updateError}
          badgeDisabled={
            !form.me ||
            isBadgeLoading ||
            myBadgesQuery.isError ||
            form.isUpdatingProfile ||
            setRepresentativeBadge.isPending ||
            clearRepresentativeBadge.isPending
          }
          badgeOptions={badgeOptions}
          badgeStatusMessage={badgeStatusMessage}
          isBadgePending={isBadgePending}
          badgeValue={representativeBadge?.badgeCode ?? ""}
          isBadgeStatusError={Boolean(
            myBadgesQuery.isError ||
              setRepresentativeBadge.error ||
              clearRepresentativeBadge.error,
          )}
          onBadgeChange={(badgeCode) => {
            if (badgeCode === representativeBadge?.badgeCode) {
              return;
            }

            form.clearProfileStatusMessage();

            if (!badgeCode) {
              if (representativeBadge) {
                setRepresentativeBadge.reset();
                clearRepresentativeBadge.mutate();
              }
              return;
            }

            clearRepresentativeBadge.reset();
            setRepresentativeBadge.mutate({ badgeCode });
          }}
          onNicknameChange={form.updateNicknameDraft}
          onProfileSubmit={form.handleProfileSubmit}
          onStatusMessageChange={form.updateStatusMessageDraft}
        />
      </div>
      <ProfileStats
        listeningDurationSeconds={form.me?.listeningDurationSeconds}
        musicPower={form.me?.musicPower}
        queuingCount={form.me?.queuingCount}
      />
    </div>
  );
}
