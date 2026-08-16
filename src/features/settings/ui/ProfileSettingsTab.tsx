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
import { useActionFeedback } from "@/src/shared/ui/action-feedback/ActionFeedbackProvider";

export default function ProfileSettingsTab() {
  const form = useProfileSettingsForm();
  const { notify } = useActionFeedback();
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
          badgeDisabled={
            !form.me ||
            isBadgeLoading ||
            myBadgesQuery.isError ||
            form.isUpdatingProfile ||
            setRepresentativeBadge.isPending ||
            clearRepresentativeBadge.isPending
          }
          badgeInvalid={Boolean(
            setRepresentativeBadge.error || clearRepresentativeBadge.error,
          )}
          badgeOptions={badgeOptions}
          badgeStatusMessage={badgeStatusMessage}
          isBadgePending={isBadgePending}
          badgeValue={representativeBadge?.badgeCode ?? ""}
          isBadgeStatusError={myBadgesQuery.isError}
          onBadgeChange={(badgeCode) => {
            if (badgeCode === representativeBadge?.badgeCode) {
              return;
            }

            form.clearProfileStatusMessage();
            setRepresentativeBadge.reset();
            clearRepresentativeBadge.reset();

            if (!badgeCode) {
              if (representativeBadge) {
                clearRepresentativeBadge.mutate(undefined, {
                  onSuccess: () => {
                    notify({
                      dedupeKey: "profile:representative-badge",
                      message: "대표 칭호를 해제했습니다.",
                      tone: "default",
                    });
                  },
                  onError: (error) => {
                    notify({
                      dedupeKey: "profile:representative-badge",
                      message:
                        error.message || "대표 칭호를 해제하지 못했습니다.",
                      tone: "error",
                    });
                  },
                });
              }
              return;
            }

            const badgeName =
              badgeOptions.find((badge) => badge.badgeCode === badgeCode)
                ?.name ?? "칭호";
            setRepresentativeBadge.mutate(
              { badgeCode },
              {
                onSuccess: () => {
                  notify({
                    dedupeKey: "profile:representative-badge",
                    message: `'${badgeName}'을 대표 칭호로 설정했습니다.`,
                    tone: "default",
                  });
                },
                onError: (error) => {
                  notify({
                    dedupeKey: "profile:representative-badge",
                    message:
                      error.message || "대표 칭호를 설정하지 못했습니다.",
                    tone: "error",
                  });
                },
              },
            );
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
