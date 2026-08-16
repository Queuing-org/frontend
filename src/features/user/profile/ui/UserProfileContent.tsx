import Image from "next/image";
import type { ReactNode } from "react";
import { formatOptionalStat } from "@/src/shared/lib/formatOptionalStat";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";
import { formatListeningDuration } from "../model/formatListeningDuration";
import styles from "./UserProfileContent.module.css";

type Props = {
  actions?: ReactNode;
  activityLabel?: string | null;
  avatarUrl: string | null;
  badgeLabel: string;
  feedback?: ReactNode;
  isBadgeLoading: boolean;
  isOwner?: boolean;
  listeningDurationSeconds?: number;
  musicPower?: number;
  musicPowerActions?: ReactNode;
  musicPowerNotice?: ReactNode;
  nickname: string;
  online?: boolean;
  primaryStatus?: ReactNode;
  queuingCount?: number;
  statusMessage: string;
  textLineClamp?: 1 | 2;
};

export default function UserProfileContent({
  actions,
  activityLabel = "공개 프로필",
  avatarUrl,
  badgeLabel,
  feedback,
  isBadgeLoading,
  isOwner = false,
  listeningDurationSeconds,
  musicPower,
  musicPowerActions,
  musicPowerNotice,
  nickname,
  online,
  primaryStatus,
  queuingCount,
  statusMessage,
  textLineClamp = 1,
}: Props) {
  return (
    <>
      <div className={styles.hero}>
        <div className={styles.avatarWrap}>
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={`${nickname} avatar`}
              fill
              sizes="56px"
              unoptimized
              className={styles.avatar}
            />
          ) : (
            <div className={styles.avatarFallback} aria-hidden="true">
              {nickname.slice(0, 1)}
            </div>
          )}
          {online !== undefined ? (
            <span
              className={styles.presenceDot}
              data-online={online}
              role="img"
              aria-label={online ? "온라인" : "오프라인"}
            />
          ) : null}
        </div>
        <div className={styles.nameBlock}>
          <div className={styles.nameRow}>
            <div className={styles.name} data-line-clamp={textLineClamp}>
              {nickname}
            </div>
            {isOwner ? (
              <Image
                src="/icons/onwer_black.svg"
                alt="방장"
                width={11}
                height={11}
                className={styles.ownerIcon}
              />
            ) : null}
          </div>
          {activityLabel ? (
            <div className={styles.activity}>{activityLabel}</div>
          ) : null}
        </div>
      </div>
      {primaryStatus}
      {actions}
      {feedback}
      <div className={styles.grid}>
        <div className={styles.statsColumn}>
          <div className={styles.card}>
            <div className={styles.cardTitle}>칭호</div>
            <div className={styles.cardValue}>
              {isBadgeLoading ? (
                <LoadingSpinner ariaLabel="칭호 로딩 중" size={18} />
              ) : (
                badgeLabel
              )}
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardTitle}>큐잉 횟수</div>
            <div className={styles.cardValue}>
              {formatOptionalStat(queuingCount)}
            </div>
          </div>
          <div className={styles.musicPowerRow}>
            <div className={styles.card}>
              <div className={styles.musicPowerHeading}>
                <div className={styles.cardTitle}>음악력</div>
                {musicPowerNotice}
              </div>
              <div className={styles.musicPowerValue}>
                <span>{formatOptionalStat(musicPower)}</span>
              </div>
            </div>
            {musicPowerActions}
          </div>
        </div>
        <div className={styles.statsColumn}>
          <div className={styles.card}>
            <div className={styles.cardTitle}>최애곡</div>
            <div
              className={`${styles.cardValue} ${styles.statusCardValue}`}
              data-line-clamp={textLineClamp}
              title={statusMessage || undefined}
            >
              {statusMessage || "-"}
            </div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardTitle}>이용 시간</div>
            <div className={styles.cardValue}>
              {formatListeningDuration(listeningDurationSeconds)}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
