import type { ReactNode } from "react";
import type { RoomTag } from "@/src/entities/room/model/types";

type Props = {
  title: string;
  slug: string;
  tags?: RoomTag[];
  actions?: ReactNode;
  isPrivate: boolean;
};

export default function RoomCardTemp({
  title,
  slug,
  tags,
  actions,
  isPrivate,
}: Props) {
  return (
    <li className="border p-3 space-y-1">
      <div className="text-sm">
        <span className="font-semibold">제목:</span> {title}
      </div>

      <div className="text-sm">
        <span className="font-semibold">슬러그:</span> {slug}
      </div>

      <div className="text-sm">
        <span className="font-semibold">태그:</span>{" "}
        {tags?.length ? (
          tags.map((t) => t.name).join(", ")
        ) : (
          <span className="text-gray-600">없음</span>
        )}
      </div>

      <div className="text-sm">
        <span className="font-semibold">isPrivate: </span>
        {isPrivate ? "true" : "false"}
      </div>

      {actions}
    </li>
  );
}
