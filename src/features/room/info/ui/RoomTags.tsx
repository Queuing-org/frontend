import { useRoomTags } from "../hooks/useRoomTags";

export default function RoomTags() {
  const { data, isLoading, isError } = useRoomTags();

  if (isLoading) return <div>태그 로딩중...</div>;
  if (isError) return <div>태그 로딩 실패</div>;

  const tags = data ?? [];

  console.log("roomTags data:", data);

  return (
    <div className="flex flex-wrap gap-2 text-black">
      {tags.map((tag) => (
        <span key={tag.slug} className="px-2 py-1 rounded-md border text-sm">
          {tag.name}
        </span>
      ))}
    </div>
  );
}
