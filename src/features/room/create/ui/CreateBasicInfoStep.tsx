"use client";

import styles from "./CreateBasicInfoStep.module.css";

type CreateBasicInfoStepProps = {
  title: string;
  maxTitleLength: number;
  disabled: boolean;
  onTitleChange: (title: string) => void;
};

export default function CreateBasicInfoStep({
  title,
  maxTitleLength,
  disabled,
  onTitleChange,
}: CreateBasicInfoStepProps) {
  return (
    <div className={styles.stack}>
      <div className={styles.row}>
        <span className={styles.label}>썸네일</span>
        <button
          type="button"
          className={styles.thumbnailButton}
          aria-label="방 썸네일 업로드"
          disabled={disabled}
        >
          <span className={styles.cameraIcon} aria-hidden="true" />
          <span className={styles.thumbnailText}>UPLOAD</span>
        </button>
      </div>

      <label className={styles.row} htmlFor="create-room-title">
        <span className={styles.label}>방 제목</span>
        <input
          id="create-room-title"
          className={styles.input}
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          maxLength={maxTitleLength}
          placeholder="방의 주제나 성격을 잘 나타내는 제목을 입력해주세요"
          disabled={disabled}
        />
      </label>
    </div>
  );
}
