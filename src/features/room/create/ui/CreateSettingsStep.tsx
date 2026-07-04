"use client";

import styles from "./CreateSettingsStep.module.css";

export type ParticipationMode = "public" | "password";

type TrackLimitMinuteOption = number;

type CreateSettingsStepProps = {
  participationMode: ParticipationMode;
  password: string;
  maxParticipants: string;
  trackLimitMinutes: string;
  disabled: boolean;
  maxParticipantsError?: string | null;
  showPasswordError: boolean;
  onClearMaxParticipants: () => void;
  onMaxParticipantsChange: (value: string) => void;
  onParticipationModeChange: (mode: ParticipationMode) => void;
  onPasswordChange: (password: string) => void;
  onTrackLimitMinutesChange: (value: string) => void;
  trackLimitMinuteOptions: readonly TrackLimitMinuteOption[];
};

export default function CreateSettingsStep({
  participationMode,
  password,
  maxParticipants,
  trackLimitMinutes,
  disabled,
  maxParticipantsError,
  showPasswordError,
  onClearMaxParticipants,
  onMaxParticipantsChange,
  onParticipationModeChange,
  onPasswordChange,
  onTrackLimitMinutesChange,
  trackLimitMinuteOptions,
}: CreateSettingsStepProps) {
  const isPasswordMode = participationMode === "password";

  return (
    <div className={styles.stack}>
      <MaxParticipantsControl
        id="create-room-max-participants"
        label="최대 인원 수"
        max={250}
        value={maxParticipants}
        errorMessage={maxParticipantsError}
        disabled={disabled}
        onChange={onMaxParticipantsChange}
        onClear={onClearMaxParticipants}
      />

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
        <div className={styles.participationColumn}>
          <select
            id="create-room-participation"
            className={styles.control}
            value={participationMode}
            onChange={(event) =>
              onParticipationModeChange(event.target.value as ParticipationMode)
            }
            disabled={disabled}
          >
            <option value="public">누구나 참여</option>
            <option value="password">비밀번호 입력</option>
          </select>

          {isPasswordMode ? (
            <input
              className={styles.passwordInput}
              data-invalid={showPasswordError}
              type="password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              placeholder="비밀번호"
              disabled={disabled}
              aria-invalid={showPasswordError}
              aria-describedby={
                showPasswordError ? "create-room-password-error" : undefined
              }
            />
          ) : null}

          {showPasswordError ? (
            <p id="create-room-password-error" className={styles.errorText}>
              입장할 때 입력할 비밀번호를 설정해주세요.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

type LimitNumberControlProps = {
  id: string;
  label: string;
  max: number;
  value: string;
  disabled: boolean;
  errorMessage?: string | null;
  onChange: (value: string) => void;
  onClear: () => void;
};

function MaxParticipantsControl({
  id,
  label,
  max,
  value,
  disabled,
  errorMessage,
  onChange,
  onClear,
}: LimitNumberControlProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <div className={styles.row}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <div className={styles.limitColumn}>
        <div className={styles.limitControlGroup}>
          <input
            id={id}
            className={styles.numberInput}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={3}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="제한 없음"
            disabled={disabled}
            aria-invalid={Boolean(errorMessage)}
            aria-describedby={errorMessage ? errorId : hintId}
            data-invalid={Boolean(errorMessage)}
          />
          <button
            type="button"
            className={styles.unlimitedButton}
            disabled={disabled || value.length === 0}
            onClick={onClear}
          >
            제한 없음
          </button>
          <span id={hintId} className={styles.limitHint}>
            최대 {max}명
          </span>
        </div>
        {errorMessage ? (
          <p id={errorId} className={styles.errorText}>
            {errorMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}
