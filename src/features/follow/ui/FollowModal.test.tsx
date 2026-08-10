import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFollowModalState } from "@/src/features/follow/hooks/useFollowModalState";
import FollowModal from "./FollowModal";

vi.mock("@/src/features/follow/hooks/useFollowModalState", () => ({
  useFollowModalState: vi.fn(),
}));
vi.mock("./components/FollowTabPanel", () => ({
  default: ({
    onSelectUser,
  }: {
    onSelectUser: (
      user: {
        cursorId: number;
        nickname: string;
        online: boolean;
        presenceVersion: number;
        profileImageUrl: null;
        room: null;
        slug: string;
      },
      trigger: HTMLButtonElement,
    ) => void;
  }) => (
    <button
      type="button"
      onClick={(event) =>
        onSelectUser(
          {
            cursorId: 1,
            nickname: "민지",
            online: false,
            presenceVersion: 0,
            profileImageUrl: null,
            room: null,
            slug: "minji",
          },
          event.currentTarget,
        )
      }
    >
      민지 프로필 보기
    </button>
  ),
}));
vi.mock("./components/FollowTabs", () => ({
  default: () => <div>팔로우 탭</div>,
}));
vi.mock("./add-friend/AddFriendModal", () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <button type="button" onClick={onClose}>
      친구 추가 모달 닫기
    </button>
  ),
}));
vi.mock("./FollowProfileModal", () => ({
  default: ({ onClose, user }: { onClose: () => void; user: { nickname: string } }) => (
    <div role="dialog" aria-label={`${user.nickname} 프로필 상세`}>
      <button type="button" onClick={onClose}>프로필 상세 닫기</button>
    </div>
  ),
}));

const openAddFriend = vi.fn();
const closeAddFriend = vi.fn();
const closeModal = vi.fn();

describe("FollowModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFollowModalState).mockReturnValue({
      activeTab: "following",
      closeAddFriend,
      closeModal,
      isAddFriendOpen: false,
      openAddFriend,
      setActiveTab: vi.fn(),
      tabCounts: {},
    });
  });

  it("FRIEND 헤더에서 친구 추가 모달을 연다", async () => {
    const user = userEvent.setup();
    render(<FollowModal open onClose={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "FRIEND" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "친구 추가" }));
    expect(openAddFriend).toHaveBeenCalledOnce();
  });

  it("친구 추가 상태일 때 별도 모달을 렌더링한다", async () => {
    const user = userEvent.setup();
    vi.mocked(useFollowModalState).mockReturnValue({
      activeTab: "following",
      closeAddFriend,
      closeModal,
      isAddFriendOpen: true,
      openAddFriend,
      setActiveTab: vi.fn(),
      tabCounts: {},
    });

    render(<FollowModal open onClose={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "친구 추가 모달 닫기" }));
    expect(closeAddFriend).toHaveBeenCalledOnce();
  });

  it("같은 카드를 다시 누르면 중첩 프로필을 닫는다", async () => {
    const user = userEvent.setup();
    render(<FollowModal open onClose={vi.fn()} />);

    const trigger = screen.getByRole("button", { name: "민지 프로필 보기" });
    await user.click(trigger);
    expect(
      screen.getByRole("dialog", { name: "민지 프로필 상세" }),
    ).toBeInTheDocument();

    await user.click(trigger);
    expect(
      screen.queryByRole("dialog", { name: "민지 프로필 상세" }),
    ).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
