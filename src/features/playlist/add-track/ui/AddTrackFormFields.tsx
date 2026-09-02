"use client";

import styles from "./AddTrackModal.module.css";
import type { AddTrackErrorField } from "../hooks/useAddTrackForm";

type AddTrackFormFieldsProps = {
  errorMessage: string;
  errorField: AddTrackErrorField;
  storyLength: number;
  storyMaxLength: number;
  storyValue: string;
  submitting: boolean;
  value: string;
  onChange: (value: string) => void;
  onStoryChange: (value: string) => void;
};

export default function AddTrackFormFields({
  errorMessage,
  errorField,
  storyLength,
  storyMaxLength,
  storyValue,
  submitting,
  value,
  onChange,
  onStoryChange,
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
          aria-invalid={errorField === "url"}
          aria-describedby={errorField === "url" ? "add-track-error" : undefined}
        />
      </label>

      <label className={styles.fieldGroup}>
        <div className={styles.labelRow}>
          <span className={styles.label}>노래 선정 이유 (선택)</span>
          <span className={styles.characterCount}>
            {storyLength}/{storyMaxLength}
          </span>
        </div>
        <textarea
          value={storyValue}
          onChange={(event) => onStoryChange(event.target.value)}
          placeholder="이 노래를 선정한 이유나 전하고 싶은 말을 적어주세요"
          className={styles.textarea}
          disabled={submitting}
          rows={4}
          aria-invalid={errorField === "story"}
          aria-describedby={errorField === "story" ? "add-track-error" : undefined}
        />
      </label>

      <div id="add-track-error" className={styles.visuallyHidden}>
        {errorMessage}
      </div>
    </>
  );
}
