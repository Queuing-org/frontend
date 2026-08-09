import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PlaylistParticipant } from "@/src/features/playlist/model/types";
import { useFollowingRelationship } from "@/src/features/follow/following/hooks/useFollowingRelationship";
import RoomParticipantList from "./RoomParticipantList";

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}));
vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return { ...actual, useQueries: vi.fn(() => []) };
});
vi.mock("@/src/features/follow/following/hooks/useFollowingRelationship", () => ({
  useFollowingRelationship: vi.fn(),
}));
vi.mock("@/src/features/follow/follow/ui/FollowToggleButton", () => ({
  default: ({ initialRelationship }: { initialRelationship?: string }) => (
    <button type="button">
      {initialRelationship === "FOLLOWING" ? "언팔로우" : "팔로우"}
    </button>
  ),
}));

const participants: PlaylistParticipant[] = [
  {
    nickname: "방장",
    participantId: "participant-owner",
    participantType: "USER",
    profileImageUrl: null,
    userSlug: "owner",
  },
  {
    nickname: "회원",
    participantId: "participant-member",
    participantType: "USER",
    profileImageUrl: null,
    userSlug: "member",
  },
  {
    nickname: "게스트",
    participantId: "participant-guest",
    participantType: "GUEST",
    profileImageUrl: null,
    userSlug: null,
  },
];

const callbacks = {
  onBlockParticipant: vi.fn(),
  onKickParticipant: vi.fn(),
  onReportParticipant: vi.fn(),
  onTransferOwner: vi.fn(),
};

function renderList(showParticipantActions = true) {
  return render(
    <RoomParticipantList
      currentUser={{
        nickname: "방장",
        profileImageUrl: null,
        slug: "owner",
        userId: 1,
      }}
      isKickPending={false}
      isTransferPending={false}
      kickingParticipantKey={null}
      owner={{ nickname: "방장", profileImageUrl: null, slug: "owner" }}
      participants={participants}
      showParticipantActions={showParticipantActions}
      transferringUserSlug={null}
      {...callbacks}
    />,
  );
}

describe("RoomParticipantList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFollowingRelationship).mockReturnValue({
      data: false,
      isLoading: false,
    } as ReturnType<typeof useFollowingRelationship>);
  });

  it("방장은 회원 카드 전체를 눌러 요청한 관리 액션을 펼치고 다시 접는다", async () => {
    const user = userEvent.setup();
    renderList();
    const trigger = screen.getByRole("button", {
      name: "회원 참가자 관리 펼치기",
    });

    await user.click(trigger);

    expect(screen.getByRole("group", { name: "회원 참가자 관리" })).toBeVisible();
    expect(screen.getByRole("button", { name: "팔로우" })).toBeVisible();
    expect(screen.getByRole("button", { name: "신고" })).toBeVisible();
    expect(screen.getByRole("button", { name: "차단" })).toBeVisible();
    expect(screen.getByRole("button", { name: "내보내기" })).toBeVisible();
    expect(screen.getByRole("button", { name: "방장 위임" })).toBeVisible();

    await user.click(
      screen.getByRole("button", { name: "회원 참가자 관리 접기" }),
    );
    expect(screen.queryByRole("group", { name: "회원 참가자 관리" })).toBeNull();
  });

  it("다른 카드, 바깥 클릭, Escape로 하나의 메뉴만 관리한다", async () => {
    const user = userEvent.setup();
    renderList();
    const memberTrigger = screen.getByRole("button", {
      name: "회원 참가자 관리 펼치기",
    });

    await user.click(memberTrigger);
    await user.click(
      screen.getByRole("button", { name: "게스트 참가자 관리 펼치기" }),
    );
    expect(screen.queryByRole("group", { name: "회원 참가자 관리" })).toBeNull();
    expect(screen.getByRole("group", { name: "게스트 참가자 관리" })).toBeVisible();

    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("group", { name: "게스트 참가자 관리" })).toBeNull();

    await user.click(memberTrigger);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("group", { name: "회원 참가자 관리" })).toBeNull();
    expect(memberTrigger).toHaveFocus();
  });

  it("게스트에는 식별 가능한 내보내기만 표시한다", async () => {
    const user = userEvent.setup();
    renderList();

    await user.click(
      screen.getByRole("button", { name: "게스트 참가자 관리 펼치기" }),
    );

    expect(screen.getByRole("button", { name: "내보내기" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "팔로우" })).toBeNull();
    expect(screen.queryByRole("button", { name: "신고" })).toBeNull();
    expect(screen.queryByRole("button", { name: "차단" })).toBeNull();
    expect(screen.queryByRole("button", { name: "방장 위임" })).toBeNull();
  });

  it("방장이 아니면 참가자 카드를 거짓 클릭 영역으로 만들지 않는다", () => {
    renderList(false);

    expect(screen.queryByRole("button", { name: /참가자 관리/ })).toBeNull();
  });
});
