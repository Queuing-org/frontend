"use client";

import styles from "./AddTrackModal.module.css";

type AddTrackFormFieldsProps = {
  errorMessage: string;
  submitting: boolean;
  value: string;
  onChange: (value: string) => void;
};

export default function AddTrackFormFields({
  errorMessage,
  submitting,
  value,
  onChange,
}: AddTrackFormFieldsProps) {
  return (
    <>
      <label className={styles.fieldGroup}>
        <div className={styles.labelRow}>
          <span className={styles.label}>유튜브 링크 (https://...)</span>
          <a
            href="https://www.youtube.com/"
            target="_blank"
            rel="noreferrer"
            className={styles.youtubeLink}
          >
            찾으러 가기
          </a>
        </div>
        <input
          type="url"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="함께 듣고 싶은 영상의 URL을 붙여넣으세요"
          className={styles.input}
          disabled={submitting}
          autoFocus
        />
      </label>

      {errorMessage ? (
        <div className={styles.error}>{errorMessage}</div>
      ) : null}
    </>
  );
}
