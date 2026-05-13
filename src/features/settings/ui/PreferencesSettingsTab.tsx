"use client";

import { useMe } from "@/src/entities/user/hooks/useMe";
import { useLogout } from "@/src/features/auth/logout/model/useLogout";
import styles from "./PreferencesSettingsTab.module.css";

type PreferencesSettingsTabProps = {
  onLoggedOut: () => void;
};

export default function PreferencesSettingsTab({
  onLoggedOut,
}: PreferencesSettingsTabProps) {
  const { data: me } = useMe();
  const {
    mutate: logout,
    isPending: isLoggingOut,
    error: logoutError,
  } = useLogout();

  function handleLogout() {
    logout(undefined, {
      onSuccess: onLoggedOut,
    });
  }

  return (
    <div className={styles.preferencesPanel}>
      <div className={styles.placeholderCard}>
        <button
          type="button"
          className={styles.logoutButton}
          onClick={handleLogout}
          disabled={!me || isLoggingOut}
        >
          {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
        </button>
        {logoutError ? (
          <p className={styles.errorText}>{logoutError.message}</p>
        ) : null}
        <p className={styles.developmentText}>개발중입니다.</p>
      </div>
    </div>
  );
}
