import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Room, RoomOwner } from "@/src/features/room/model/types";
import HomeRoomStage from "./HomeRoomStage";

vi.mock("next/image", () => ({
  default: ({ alt = "", ...props }: { alt?: string }) => (
    <span aria-label={alt || undefined} {...props} />
  ),
}));

const room: Room = {
  id: 1,
  slug: "late-night-jazz",
  title: "새벽 재즈",
  isPrivate: false,
  createdAt: "2026-08-05T00:00:00.000Z",
  tags: [],
};

const owner: RoomOwner = {
  slug: "minji",
  nickname: "민지",
  profileImageUrl: null,
};

describe("HomeRoomStage", () => {
  it("방이 없으면 생성 안내와 방 만들기 액션을 표시한다", async () => {
    const user = userEvent.setup();
    const onCreateRoom = vi.fn();

    render(
      <HomeRoomStage
        rooms={[]}
        currentRoomSlug={null}
        onCreateRoom={onCreateRoom}
        onRequestRoomEntry={vi.fn()}
        onSelectRoom={vi.fn()}
      />,
    );

    expect(screen.getByText("현재 생성된 방이 없어요.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "방 만들기" }));
    expect(onCreateRoom).toHaveBeenCalledOnce();
  });

  it("선택된 방에만 방장 정보를 표시한다", () => {
    render(
      <HomeRoomStage
        rooms={[room]}
        currentRoomSlug={room.slug}
        selectedRoomOwner={owner}
        onCreateRoom={vi.fn()}
        onRequestRoomEntry={vi.fn()}
        onSelectRoom={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("방장 민지")).toBeInTheDocument();
    expect(screen.getByText("민지")).toBeInTheDocument();
  });
});
