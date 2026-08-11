"use client";

import type { RoomTag } from "@/src/features/room/model/types";
import styles from "./CreateGenreStep.module.css";

type CreateGenreStepProps = {
  tags: RoomTag[];
  selectedTagSlugs: string[];
  maxTags: number;
  disabled: boolean;
  errorMessage?: string | null;
  onToggleTag: (slug: string) => void;
};

function isFreeTag(tag: RoomTag) {
  return (
    tag.slug.trim().toLowerCase() === "free" ||
    tag.name.trim().toUpperCase() === "FREE"
  );
}

export function orderRoomTags(tags: RoomTag[]) {
  return tags
    .map((tag, index) => ({ index, tag }))
    .sort((left, right) => {
      const freeOrder =
        Number(isFreeTag(right.tag)) - Number(isFreeTag(left.tag));
      return freeOrder || left.index - right.index;
    })
    .map(({ tag }) => tag);
}

export default function CreateGenreStep({
  tags,
  selectedTagSlugs,
  maxTags,
  disabled,
  errorMessage = null,
  onToggleTag,
}: CreateGenreStepProps) {
  if (tags.length === 0) {
    return (
      <div className={styles.stepContent}>
        <div className={styles.stateText}>장르가 없습니다.</div>
        <p
          className={styles.errorText}
          role={errorMessage ? "alert" : undefined}
        >
          {errorMessage ?? ""}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.stepContent}>
      <div className={styles.tagGrid}>
        {orderRoomTags(tags).map((tag) => {
          const selected = selectedTagSlugs.includes(tag.slug);
          const maxReached = selectedTagSlugs.length >= maxTags;
          const tagDisabled = disabled || (!selected && maxReached);

          return (
            <button
              key={tag.slug}
              type="button"
              className={styles.tagChip}
              data-selected={selected}
              disabled={tagDisabled}
              onClick={() => onToggleTag(tag.slug)}
              aria-pressed={selected}
            >
              {tag.name}
            </button>
          );
        })}
      </div>
      <p className={styles.errorText} role={errorMessage ? "alert" : undefined}>
        {errorMessage ?? ""}
      </p>
    </div>
  );
}
