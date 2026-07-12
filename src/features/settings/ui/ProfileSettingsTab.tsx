"use client";

import { useMemo } from "react";
import Image from "next/image";
import {
  getBadgeCatalogItems,
  getBadgeSlug,
  getRepresentativeBadge,
  getUserBadgeItems,
  isCatalogBadgeAcquired,
} from "@/src/features/badge/model/badgeDisplay";
import { useBadgeCatalog } from "@/src/features/badge/hooks/useBadgeCatalog";
import { useMyBadges } from "@/src/features/badge/hooks/useMyBadges";
import { useSetRepresentativeBadge } from "@/src/features/badge/hooks/useSetRepresentativeBadge";
import { useProfileSettingsForm } from "../hooks/useProfileSettingsForm";
import ProfileSettingsForm from "./components/ProfileSettingsForm";
import ProfileStats from "./components/ProfileStats";
import styles from "./ProfileSettingsTab.module.css";

export default function ProfileSettingsTab() {
  const form = useProfileSettingsForm();
  const catalogQuery = useBadgeCatalog();
  const myBadgesQuery = useMyBadges(Boolean(form.me));
  const setRepresentativeBadge = useSetRepresentativeBadge();
  const catalogItems = useMemo(
    () => (catalogQuery.data ? getBadgeCatalogItems(catalogQuery.data) : []),
    [catalogQuery.data],
  );
  const acquiredBadgeSlugs = useMemo(() => {
    const slugs = getUserBadgeItems(myBadgesQuery.data)
      .map(getBadgeSlug)
      .filter((slug): slug is string => Boolean(slug));

    return new Set(slugs);
  }, [myBadgesQuery.data]);
  const badgeOptions = useMemo(
    () =>
      catalogItems
        .map((badge, index) => ({
          index,
          isAcquired: isCatalogBadgeAcquired(badge, acquiredBadgeSlugs),
          name: badge.name,
          slug: badge.slug,
        }))
        .sort((left, right) => {
          if (left.isAcquired === right.isAcquired) {
            return left.index - right.index;
          }

          return left.isAcquired ? -1 : 1;
        }),
    [acquiredBadgeSlugs, catalogItems],
  );
  const representativeBadge = getRepresentativeBadge(myBadgesQuery.data);
  const isBadgeLoading = catalogQuery.isLoading || myBadgesQuery.isLoading;
  const badgeStatusMessage = (() => {
    if (isBadgeLoading) {
      return "칭호 불러오는 중";
    }

    if (catalogQuery.isError || myBadgesQuery.isError) {
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
          hasProfile={form.hasProfile}
          isMeError={form.isMeError}
          isMeLoading={form.isMeLoading}
          isUpdatingProfile={form.isUpdatingProfile}
          nickname={form.nickname}
          successMessage={form.successMessage}
          updateError={form.updateError}
          badgeDisabled={
            !form.me ||
            isBadgeLoading ||
            catalogQuery.isError ||
            myBadgesQuery.isError ||
            setRepresentativeBadge.isPending ||
            badgeOptions.length === 0
          }
          badgeOptions={badgeOptions}
          badgeStatusMessage={badgeStatusMessage}
          badgeValue={representativeBadge?.slug ?? ""}
          isBadgeStatusError={Boolean(
            catalogQuery.isError ||
              myBadgesQuery.isError ||
              setRepresentativeBadge.error,
          )}
          onBadgeChange={(badgeSlug) => {
            if (!badgeSlug || badgeSlug === representativeBadge?.slug) {
              return;
            }

            setRepresentativeBadge.mutate({ badgeSlug });
          }}
          onNicknameChange={form.updateNicknameDraft}
          onSubmit={form.handleNicknameSubmit}
        />
      </div>
      <ProfileStats
        musicPower={form.me?.musicPower}
        queuingCount={form.me?.queuingCount}
      />
    </div>
  );
}
