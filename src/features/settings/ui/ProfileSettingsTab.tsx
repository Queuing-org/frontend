"use client";

import Image from "next/image";
import { useProfileSettingsForm } from "../hooks/useProfileSettingsForm";
import ProfileSettingsForm from "./components/ProfileSettingsForm";
import ProfileStats from "./components/ProfileStats";
import styles from "./ProfileSettingsTab.module.css";

export default function ProfileSettingsTab() {
  const form = useProfileSettingsForm();

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
          onNicknameChange={form.updateNicknameDraft}
          onSubmit={form.handleNicknameSubmit}
        />
      </div>
      <ProfileStats />
    </div>
  );
}
