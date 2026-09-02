"use client";

import styles from "./AddTrackModal.module.css";
import type { AddTrackErrorField } from "../hooks/useAddTrackForm";
import type { YouTubeQueueMode } from "../model/parseYouTubeQueueSource";

type AddTrackFormFieldsProps = {
  errorMessage: string;
  errorField: AddTrackErrorField;
  playlistDetected: boolean;
  queueMode: YouTubeQueueMode | null;
  singleTrackAvailable: boolean;
  storyLength: number;
  storyMaxLength: number;
  storyValue: string;
  submitting: boolean;
  value: string;
  onChange: (value: string) => void;
  onQueueModeChange: (mode: YouTubeQueueMode) => void;
  onStoryChange: (value: string) => void;
};

export default function AddTrackFormFields({
  errorMessage,
  errorField,
  playlistDetected,
  queueMode,
  singleTrackAvailable,
  storyLength,
  storyMaxLength,
  storyValue,
  submitting,
  value,
  onChange,
  onQueueModeChange,
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
          placeholder="함께 듣고 싶은 영상 또는 재생목록 URL을 붙여넣으세요"
          className={styles.input}
          disabled={submitting}
          autoFocus
          aria-invalid={errorField === "url"}
          aria-describedby={errorField === "url" ? "add-track-error" : undefined}
        />
      </label>

      {playlistDetected ? (
        <fieldset
          className={styles.queueModeFieldset}
          disabled={submitting}
          aria-invalid={errorField === "queueMode"}
          aria-describedby={
            errorField === "queueMode" ? "add-track-error" : undefined
          }
        >
          <legend className={styles.queueModeLegend}>어떻게 추가할까요?</legend>
          <div className={styles.queueModeOptions}>
            <label
              className={`${styles.queueModeOption} ${
                !singleTrackAvailable ? styles.queueModeOptionDisabled : ""
              }`}
            >
              <input
                type="radio"
                name="add-track-queue-mode"
                value="single"
                checked={queueMode === "single"}
                disabled={!singleTrackAvailable || submitting}
                onChange={() => onQueueModeChange("single")}
                className={styles.queueModeRadio}
              />
              <span>
                현재 영상만 추가
                {!singleTrackAvailable ? (
                  <small className={styles.queueModeNote}>
                    현재 영상 정보가 없는 링크입니다.
                  </small>
                ) : null}
              </span>
            </label>
            <label className={styles.queueModeOption}>
              <input
                type="radio"
                name="add-track-queue-mode"
                value="playlist"
                checked={queueMode === "playlist"}
                disabled={submitting}
                onChange={() => onQueueModeChange("playlist")}
                className={styles.queueModeRadio}
              />
              <span>
                재생목록 노래도 함께 추가
                <small className={styles.queueModeNote}>
                  재생목록의 노래를 함께 추가합니다.
                </small>
              </span>
            </label>
          </div>
        </fieldset>
      ) : null}

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
