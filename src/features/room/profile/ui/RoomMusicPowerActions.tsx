"use client";

import Image from "next/image";
import type { MusicPowerVote } from "@/src/features/user/profile/model/types";
import type { RoomMusicPowerVoteControl } from "../hooks/useRoomMusicPowerVote";
import styles from "./RoomProfilePanel.module.css";

type RoomMusicPowerActionsProps = Pick<
  RoomMusicPowerVoteControl,
  | "disabled"
  | "disabledLabel"
  | "loginNotice"
  | "onVote"
  | "selectedVote"
>;

const ACTIONS: Array<{
  iconSrc: string;
  label: string;
  vote: MusicPowerVote;
}> = [
  {
    iconSrc: "/icons/music-power-up.svg",
    label: "음악력 올리기",
    vote: "UPVOTE",
  },
  {
    iconSrc: "/icons/music-power-down.svg",
    label: "음악력 내리기",
    vote: "DOWNVOTE",
  },
];

export default function RoomMusicPowerActions({
  disabled,
  disabledLabel,
  loginNotice,
  onVote,
  selectedVote,
}: RoomMusicPowerActionsProps) {
  return (
    <div className={styles.musicPowerActions}>
      {ACTIONS.map((action) => {
        const accessibleLabel = disabledLabel ?? action.label;

        return (
          <button
            key={action.vote}
            type="button"
            className={styles.musicPowerButton}
            aria-pressed={selectedVote === action.vote}
            aria-label={accessibleLabel}
            title={loginNotice ?? accessibleLabel}
            disabled={disabled}
            onClick={() => onVote(action.vote)}
          >
            <Image
              src={action.iconSrc}
              alt=""
              aria-hidden="true"
              className={styles.musicPowerIcon}
              width={8}
              height={8}
            />
          </button>
        );
      })}
    </div>
  );
}
