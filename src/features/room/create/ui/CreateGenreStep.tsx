"use client";

import type { RoomTag } from "@/src/features/room/model/types";
import styles from "./CreateGenreStep.module.css";

type CreateGenreStepProps = {
  tags: RoomTag[];
  selectedTagSlugs: string[];
  maxTags: number;
  disabled: boolean;
  onToggleTag: (slug: string) => void;
};

export default function CreateGenreStep({
  tags,
  selectedTagSlugs,
  maxTags,
  disabled,
  onToggleTag,
}: CreateGenreStepProps) {
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
