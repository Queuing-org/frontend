"use client";

import Link from "next/link";
import styles from "./RoomControlBar.module.css";

type IconProps = {
  className?: string;
};

type Props = {
  isChatOpen: boolean;
  isParticipantsOpen: boolean;
  isProfileOpen: boolean;
  isQueueOpen: boolean;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onToggleProfile: () => void;
  onToggleQueue: () => void;
};

function ProfileIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={className}
      aria-hidden="true"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 0C8.67392 0 7.40215 0.526784 6.46447 1.46447C5.52678 2.40215 5 3.67392 5 5C5 6.32608 5.52678 7.59785 6.46447 8.53553C7.40215 9.47322 8.67392 10 10 10C11.3261 10 12.5979 9.47322 13.5355 8.53553C14.4732 7.59785 15 6.32608 15 5C15 3.67392 14.4732 2.40215 13.5355 1.46447C12.5979 0.526784 11.3261 0 10 0ZM10 12.5C4.475 12.5 0 14.7375 0 17.5V20H20V17.5C20 14.7375 15.525 12.5 10 12.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function QueueIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={className}
      aria-hidden="true"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6.73077 3.75V15.5C6.20769 15.25 5.55385 15 4.76923 15C2.93846 15 1.5 16.125 1.5 17.5C1.5 18.875 2.93846 20 4.76923 20C6.6 20 8.03846 18.875 8.03846 17.5V8.375L17.1923 5.5V11.875C16.6692 11.5 16.0154 11.25 15.2308 11.25C13.4 11.25 11.9615 12.375 11.9615 13.75C11.9615 15.125 13.4 16.25 15.2308 16.25C17.0615 16.25 18.5 15.125 18.5 13.75V0L6.73077 3.75Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ExitIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 17"
      className={className}
      aria-hidden="true"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.33333 5.175L5.50833 4L10.1667 8.65833L14.825 4L16 5.175L11.3417 9.83333L16 14.4917L14.825 15.6667L10.1667 11.0083L5.50833 15.6667L4.33333 14.4917L8.99167 9.83333L4.33333 5.175Z"
        fill="currentColor"
      />
    </svg>
  );
}

function HamburgerIcon({ className }: IconProps) {
  return (
    <span
      className={[styles.hamburgerIcon, className].filter(Boolean).join(" ")}
      aria-hidden="true"
    />
  );
}

function ChatIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={className}
      aria-hidden="true"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M0 0H20V15.4559H5.12L0 20V0Z" fill="currentColor" />
    </svg>
  );
}

export default function RoomButtonControlBar({
  isChatOpen,
  isParticipantsOpen,
  isProfileOpen,
  isQueueOpen,
  onToggleChat,
  onToggleParticipants,
  onToggleProfile,
  onToggleQueue,
}: Props) {
  return (
    <div className={styles.outerBar}>
      <button
        type="button"
        className={styles.iconButton}
        aria-label="프로필"
        aria-pressed={isProfileOpen}
        data-selected={isProfileOpen}
        onClick={onToggleProfile}
      >
        <ProfileIcon className={styles.icon} />
      </button>
      <button
        type="button"
        className={styles.iconButton}
        aria-label="큐"
        aria-pressed={isQueueOpen}
        data-selected={isQueueOpen}
        onClick={onToggleQueue}
      >
        <QueueIcon className={styles.icon} />
      </button>
      <Link
        href="/home"
        replace
        className={styles.iconButton}
        aria-label="나가기"
      >
        <ExitIcon className={styles.icon} />
      </Link>
      <button
        type="button"
        className={styles.iconButton}
        aria-label="참가자 목록"
        aria-pressed={isParticipantsOpen}
        data-selected={isParticipantsOpen}
        onClick={onToggleParticipants}
      >
        <HamburgerIcon className={styles.icon} />
      </button>
      <button
        type="button"
        className={styles.iconButton}
        aria-label="채팅"
        aria-pressed={isChatOpen}
        data-selected={isChatOpen}
        onClick={onToggleChat}
      >
        <ChatIcon className={styles.icon} />
      </button>
    </div>
  );
}
