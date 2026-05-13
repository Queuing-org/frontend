"use client";

import type { RoomTag } from "@/src/entities/room/model/types";
import styles from "./CreateGenreStep.module.css";

type CreateGenreStepProps = {
  tags: RoomTag[];
  selectedTagSlugs: string[];
  maxTags: number;
  tagsLoading: boolean;
  tagsError: boolean;
  disabled: boolean;
  onToggleTag: (slug: string) => void;
};

export default function CreateGenreStep({
  tags,
  selectedTagSlugs,
  maxTags,
  tagsLoading,
  tagsError,
  disabled,
  onToggleTag,
}: CreateGenreStepProps) {
  if (tagsLoading) {
    return <div className={styles.stateText}>장르 불러오는 중...</div>;
  }

  if (tagsError) {
    return <div className={styles.errorText}>장르를 불러오지 못했어요.</div>;
  }

  if (tags.length === 0) {
    return <div className={styles.stateText}>장르가 없습니다.</div>;
  }

  return (
    <div className={styles.tagGrid}>
      {tags.map((tag) => {
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
  );
}
