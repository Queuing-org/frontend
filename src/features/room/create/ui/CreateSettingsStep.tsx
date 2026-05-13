"use client";

import styles from "./CreateSettingsStep.module.css";

export type ParticipationMode = "public" | "password";

type CreateSettingsStepProps = {
  participationMode: ParticipationMode;
  password: string;
  disabled: boolean;
  showPasswordError: boolean;
  onParticipationModeChange: (mode: ParticipationMode) => void;
  onPasswordChange: (password: string) => void;
};

export default function CreateSettingsStep({
  participationMode,
  password,
  disabled,
  showPasswordError,
  onParticipationModeChange,
  onPasswordChange,
}: CreateSettingsStepProps) {
  const isPasswordMode = participationMode === "password";

  return (
    <div className={styles.stack}>
      <div className={styles.row}>
        <span className={styles.label}>최대 인원 수</span>
        <button type="button" className={styles.control} disabled>
          개발중입니다
        </button>
      </div>

      <div className={styles.row}>
        <span className={styles.label}>곡 당 제한 시간</span>
        <button type="button" className={styles.control} disabled>
          개발중입니다
        </button>
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
