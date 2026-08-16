"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import styles from "./CreateSettingsStep.module.css";

export type ParticipationMode = "public" | "password";

type CreateSettingsStepProps = {
  participationMode: ParticipationMode;
  password: string;
  maxParticipants: string;
  trackLimitMinutes: string;
  disabled: boolean;
  maxParticipantsError?: string | null;
  showPasswordError: boolean;
  maxParticipantOptions: readonly number[];
  onMaxParticipantsChange: (value: string) => void;
  onParticipationModeChange: (mode: ParticipationMode) => void;
  onPasswordChange: (password: string) => void;
  onTrackLimitMinutesChange: (value: string) => void;
  trackLimitMinuteOptions: readonly number[];
};

const participationOptions: Array<{
  label: string;
  value: ParticipationMode;
}> = [
  { label: "누구나 참여", value: "public" },
  { label: "비밀번호 입력", value: "password" },
];

export default function CreateSettingsStep({
  participationMode,
  password,
  maxParticipants,
  trackLimitMinutes,
  disabled,
  maxParticipantsError,
  showPasswordError,
  maxParticipantOptions,
  onMaxParticipantsChange,
  onParticipationModeChange,
  onPasswordChange,
  onTrackLimitMinutesChange,
  trackLimitMinuteOptions,
}: CreateSettingsStepProps) {
  const [isParticipationMenuOpen, setIsParticipationMenuOpen] = useState(false);
  const participationControlRef = useRef<HTMLDivElement>(null);
  const participationToggleRef = useRef<HTMLButtonElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const focusAfterCloseRef = useRef<"password" | "toggle" | null>(null);
  const isPasswordMode = participationMode === "password";
  const passwordErrorId = "create-room-password-error";

  useEffect(() => {
    if (!isParticipationMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !participationControlRef.current?.contains(event.target)
      ) {
        setIsParticipationMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      setIsParticipationMenuOpen(false);
      focusAfterCloseRef.current = isPasswordMode ? "password" : "toggle";
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPasswordMode, isParticipationMenuOpen]);

  useEffect(() => {
    if (isParticipationMenuOpen || focusAfterCloseRef.current === null) {
      return;
    }

    if (focusAfterCloseRef.current === "password" && isPasswordMode) {
      passwordInputRef.current?.focus();
    } else {
      participationToggleRef.current?.focus();
    }
    focusAfterCloseRef.current = null;
  }, [isPasswordMode, isParticipationMenuOpen]);

  const selectParticipationMode = (mode: ParticipationMode) => {
    focusAfterCloseRef.current = mode === "password" ? "password" : "toggle";
    onParticipationModeChange(mode);
    setIsParticipationMenuOpen(false);
  };

  const handleParticipationControlClick = (
    event: ReactMouseEvent<HTMLDivElement>,
  ) => {
    if (disabled) {
      return;
    }

    const target = event.target;
    if (
      target instanceof Element &&
      target.closest(`.${styles.participationOption}`)
    ) {
      return;
    }

    setIsParticipationMenuOpen((isOpen) => !isOpen);
  };

  return (
    <div className={styles.stack}>
      <div className={styles.row}>
        <label className={styles.label} htmlFor="create-room-max-participants">
          최대 인원 수
        </label>
        <div className={styles.controlColumn}>
          <select
            id="create-room-max-participants"
            className={styles.control}
            value={maxParticipants}
            onChange={(event) => onMaxParticipantsChange(event.target.value)}
            disabled={disabled}
            aria-invalid={Boolean(maxParticipantsError)}
            aria-describedby={
              maxParticipantsError
                ? "create-room-max-participants-error"
                : undefined
            }
            data-invalid={Boolean(maxParticipantsError)}
            required
            aria-required="true"
          >
            {maxParticipantOptions.map((participants) => (
              <option key={participants} value={String(participants)}>
                {participants}명
              </option>
            ))}
          </select>
          {maxParticipantsError ? (
            <p
              id="create-room-max-participants-error"
              className={styles.visuallyHidden}
            >
              {maxParticipantsError}
            </p>
          ) : null}
        </div>
      </div>

      <div className={styles.row}>
        <label className={styles.label} htmlFor="create-room-track-limit">
          곡 당 제한 시간
        </label>
        <select
          id="create-room-track-limit"
          className={styles.control}
          value={trackLimitMinutes}
          onChange={(event) => onTrackLimitMinutesChange(event.target.value)}
          disabled={disabled}
        >
          <option value="">제한 없음</option>
          {trackLimitMinuteOptions.map((minutes) => (
            <option key={minutes} value={String(minutes)}>
              {minutes}분
            </option>
          ))}
        </select>
      </div>

      <div className={styles.row}>
        <label className={styles.label} htmlFor="create-room-participation">
          참여 제한
        </label>
        <div className={styles.controlColumn}>
          <div
            ref={participationControlRef}
            className={styles.participationControl}
            onClick={handleParticipationControlClick}
          >
            {isPasswordMode ? (
              <input
                ref={passwordInputRef}
                id="create-room-participation"
                className={styles.passwordInput}
                data-invalid={showPasswordError}
                type="password"
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                placeholder="비밀번호 입력"
                disabled={disabled}
                aria-invalid={showPasswordError}
                aria-describedby={showPasswordError ? passwordErrorId : undefined}
              />
            ) : (
              <input
                id="create-room-participation"
                className={styles.participationValue}
                type="text"
                value="누구나 참여"
                readOnly
                disabled={disabled}
              />
            )}
            <button
              ref={participationToggleRef}
              type="button"
              className={styles.participationToggle}
              disabled={disabled}
              aria-label="참여 제한 옵션 열기"
              aria-expanded={isParticipationMenuOpen}
              aria-controls="create-room-participation-options"
            >
              <span
                className={styles.participationChevron}
                data-open={isParticipationMenuOpen}
                aria-hidden="true"
              />
            </button>
            {isParticipationMenuOpen ? (
              <div
                id="create-room-participation-options"
                className={styles.participationMenu}
                role="group"
                aria-label="참여 제한 옵션"
              >
                {participationOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={styles.participationOption}
                    aria-pressed={participationMode === option.value}
                    onClick={() => selectParticipationMode(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          {showPasswordError ? (
            <p id={passwordErrorId} className={styles.visuallyHidden}>
              입장할 때 입력할 비밀번호를 설정해주세요.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
