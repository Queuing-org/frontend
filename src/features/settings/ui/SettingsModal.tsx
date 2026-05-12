"use client";

import { type ReactNode, useState } from "react";
import AccountSettingsTab from "./AccountSettingsTab";
import PreferencesSettingsTab from "./PreferencesSettingsTab";
import ProfileSettingsTab from "./ProfileSettingsTab";
import styles from "./SettingsModal.module.css";

type SettingsModalProps = {
  open: boolean;
  onClose: () => void;
};

type SettingsTab = "profile" | "preferences" | "account";

const settingsTabs: Array<{
  key: SettingsTab;
  label: string;
}> = [
  { key: "profile", label: "프로필" },
  { key: "preferences", label: "환경 설정" },
  { key: "account", label: "계정 관리" },
];

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  if (!open) {
    return null;
  }

  const tabPanels: Record<SettingsTab, ReactNode> = {
    profile: <ProfileSettingsTab />,
    preferences: <PreferencesSettingsTab onLoggedOut={closeModal} />,
    account: <AccountSettingsTab />,
  };

  function closeModal() {
    setActiveTab("profile");
    onClose();
  }

  return (
    <div className={styles.overlay} onClick={closeModal} role="presentation">
      <section
        className={styles.modal}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
      >
        <header className={styles.header}>
          <h2 id="settings-modal-title" className={styles.title}>
            SETTING
          </h2>
        </header>
        <div className={styles.content}>
          <nav className={styles.tabBar} aria-label="세팅 탭">
            {settingsTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={styles.tabButton}
                data-active={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <div className={styles.tabPanel}>{tabPanels[activeTab]}</div>
        </div>
      </section>
    </div>
  );
}
