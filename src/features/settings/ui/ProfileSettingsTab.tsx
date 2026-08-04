"use client";

import { useMemo } from "react";
import Image from "next/image";
import { getBadgeCatalogItems } from "@/src/features/badge/model/badgeDisplay";
import { useBadgeCatalog } from "@/src/features/badge/hooks/useBadgeCatalog";
import { useSetRepresentativeBadge } from "@/src/features/badge/hooks/useSetRepresentativeBadge";
import { useProfileSettingsForm } from "../hooks/useProfileSettingsForm";
import ProfileSettingsForm from "./components/ProfileSettingsForm";
import ProfileStats from "./components/ProfileStats";
import styles from "./ProfileSettingsTab.module.css";

export default function ProfileSettingsTab() {
  const form = useProfileSettingsForm();
  const catalogQuery = useBadgeCatalog();
  const setRepresentativeBadge = useSetRepresentativeBadge();
  const catalogItems = useMemo(
    () => (catalogQuery.data ? getBadgeCatalogItems(catalogQuery.data) : []),
    [catalogQuery.data],
  );
  const badgeOptions = useMemo(
    () =>
      catalogItems
        .map((badge, index) => ({
          index,
          badgeCode: badge.badgeCode,
          isAcquired: badge.acquired,
          name: badge.name,
        }))
        .sort((left, right) => {
          if (left.isAcquired === right.isAcquired) {
            return left.index - right.index;
          }

          return left.isAcquired ? -1 : 1;
        }),
    [catalogItems],
  );
  const representativeBadge = form.me?.representativeBadge ?? null;
  const isBadgeLoading = catalogQuery.isLoading;
  const badgeStatusMessage = (() => {
    if (isBadgeLoading) {
      return "칭호 불러오는 중";
    }

    if (catalogQuery.isError) {
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
          canUpdateProfile={form.canUpdateProfile}
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
            catalogQuery.isError ||
            setRepresentativeBadge.isPending ||
            badgeOptions.length === 0
          }
          badgeOptions={badgeOptions}
          badgeStatusMessage={badgeStatusMessage}
          badgeValue={representativeBadge?.badgeCode ?? ""}
          isBadgeStatusError={Boolean(
            catalogQuery.isError || setRepresentativeBadge.error,
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
          onStatusMessageChange={form.updateStatusMessageDraft}
          onSubmit={form.handleProfileSubmit}
        />
      </div>
      <ProfileStats
        musicPower={form.me?.musicPower}
        queuingCount={form.me?.queuingCount}
      />
    </div>
  );
}
