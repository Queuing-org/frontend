import { useRoomTags } from "../../hooks/useRoomTags";
import QueryBoundary from "@/src/shared/ui/query-boundary/QueryBoundary";
import LoadingSpinner from "@/src/shared/ui/loading-spinner/LoadingSpinner";

function RoomTagsContent() {
  const { data: tags } = useRoomTags();

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

export default function RoomTags() {
  return (
    <QueryBoundary
      fallback={<LoadingSpinner ariaLabel="태그 로딩 중" />}
      errorTitle="태그 로딩 실패"
      errorDescription="다시 시도해 주세요."
    >
      <RoomTagsContent />
    </QueryBoundary>
  );
}
