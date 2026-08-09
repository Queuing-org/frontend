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
  default: ({
    initialRelationship,
    role,
  }: {
    initialRelationship?: string;
    role?: "menuitem";
  }) => (
    <button type="button" role={role}>
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

  it("방장은 회원의 더보기 버튼으로 채팅과 같은 관리 메뉴를 열고 다시 닫는다", async () => {
    const user = userEvent.setup();
    renderList();
    const trigger = screen.getByRole("button", {
      name: "회원 참가자 관리 메뉴",
    });
    expect(screen.getByText("회원").closest("button")).toBeNull();

    await user.click(trigger);

    expect(screen.getByRole("menu", { name: "회원 참가자 관리" })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: "팔로우" })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: "신고" })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: "차단" })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: "내보내기" })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: "방장 위임" })).toBeVisible();

    await user.click(trigger);
    expect(screen.queryByRole("menu", { name: "회원 참가자 관리" })).toBeNull();
  });

  it("다른 카드, 바깥 클릭, Escape로 하나의 메뉴만 관리한다", async () => {
    const user = userEvent.setup();
    renderList();
    const memberTrigger = screen.getByRole("button", {
      name: "회원 참가자 관리 메뉴",
    });

    await user.click(memberTrigger);
    await user.click(
      screen.getByRole("button", { name: "게스트 참가자 관리 메뉴" }),
    );
    expect(screen.queryByRole("menu", { name: "회원 참가자 관리" })).toBeNull();
    expect(screen.getByRole("menu", { name: "게스트 참가자 관리" })).toBeVisible();

    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("menu", { name: "게스트 참가자 관리" })).toBeNull();

    await user.click(memberTrigger);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu", { name: "회원 참가자 관리" })).toBeNull();
    expect(memberTrigger).toHaveFocus();
  });

  it("게스트에는 식별 가능한 내보내기만 표시한다", async () => {
    const user = userEvent.setup();
    renderList();

    await user.click(
      screen.getByRole("button", { name: "게스트 참가자 관리 메뉴" }),
    );

    expect(screen.getByRole("menuitem", { name: "내보내기" })).toBeVisible();
    expect(screen.queryByRole("menuitem", { name: "팔로우" })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: "신고" })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: "차단" })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: "방장 위임" })).toBeNull();
  });

  it("방장이 아니면 참가자 카드에 더보기 버튼을 만들지 않는다", () => {
    renderList(false);

    expect(screen.queryByRole("button", { name: /참가자 관리 메뉴/ })).toBeNull();
  });

  it("하단 공간이 부족하면 참가자 메뉴를 위로 연다", async () => {
    const user = userEvent.setup();
    renderList();
    const list = screen.getByLabelText("참가자 목록");
    const trigger = screen.getByRole("button", {
      name: "회원 참가자 관리 메뉴",
    });
    vi.spyOn(list, "getBoundingClientRect").mockReturnValue({
      bottom: 400,
      height: 400,
      left: 0,
      right: 300,
      top: 0,
      width: 300,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue({
      bottom: 390,
      height: 28,
      left: 250,
      right: 278,
      top: 362,
      width: 28,
      x: 250,
      y: 362,
      toJSON: () => ({}),
    });

    await user.click(trigger);

    expect(screen.getByRole("menu")).toHaveAttribute("data-placement", "up");
  });
});
