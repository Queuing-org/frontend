"use client";

import { useState } from "react";
import { useCreateRoom } from "@/src/features/room/create/model/useCreateRoom";
import { useRoomTags } from "@/src/entities/room/hooks/useRoomTags";

const MAX_TAGS = 5;

export default function CreateRoomTest() {
  const { mutate, isPending, error, data } = useCreateRoom();
  const {
    data: roomTags,
    isLoading: tagsLoading,
    isError: tagsError,
  } = useRoomTags();

  const [title, setTitle] = useState("");
  const [password, setPassword] = useState("");
  const [selectedTagSlugs, setSelectedTagSlugs] = useState<string[]>([]);

  const toggleTag = (slug: string) => {
    setSelectedTagSlugs((prev) => {
      const exists = prev.includes(slug);

      if (exists) return prev.filter((s) => s !== slug);

      if (prev.length >= MAX_TAGS) return prev;

      return [...prev, slug];
    });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const t = title.trim();
    if (!t) return;

    mutate({
      title: t,
      password: password.trim() ? password.trim() : undefined,
      tags: selectedTagSlugs,
    });
  };

  const tags = roomTags ?? [];

  return (
    <div className="border p-4 space-y-3 text-black">
      <div className="text-sm font-semibold">방 생성 테스트</div>

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1">
          <label className="block text-xs">title</label>
          <input
            className="border px-2 py-1 w-full"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="새벽 코딩 달리실 분"
            disabled={isPending}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs">password (optional)</label>
          <input
            className="border px-2 py-1 w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="1234"
            disabled={isPending}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs">tags (0~5)</label>

          {tagsLoading && <div className="text-sm">태그 로딩중...</div>}
          {tagsError && <div className="text-sm">태그 로딩 실패</div>}

          {!tagsLoading && !tagsError && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const selected = selectedTagSlugs.includes(tag.slug);
                const disabled =
                  !selected && selectedTagSlugs.length >= MAX_TAGS;

                return (
                  <button
                    key={tag.slug}
                    type="button"
                    className={`px-2 py-1 rounded-md border text-sm ${
                      selected ? "bg-black text-white" : ""
                    } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                    onClick={() => toggleTag(tag.slug)}
                    disabled={isPending || disabled}
                  >
                    {tag.name}
                  </button>
                );
              })}

              {tags.length === 0 && (
                <div className="text-sm">태그가 없습니다.</div>
              )}
            </div>
          )}

          <div className="text-xs text-gray-600">
            선택됨 ({selectedTagSlugs.length}/{MAX_TAGS}):{" "}
            {selectedTagSlugs.length ? selectedTagSlugs.join(", ") : "없음"}
          </div>
        </div>

        <button
          type="submit"
          className="border px-3 py-1 cursor-pointer"
          disabled={isPending}
        >
          {isPending ? "생성 중..." : "방 생성"}
        </button>
      </form>

      {error && (
        <div className="text-sm text-red-600">
          생성 실패: ({error.status}) {error.message}
        </div>
      )}

      {data !== undefined && (
        <div className="text-sm">결과: {JSON.stringify(data)}</div>
      )}
    </div>
  );
}
