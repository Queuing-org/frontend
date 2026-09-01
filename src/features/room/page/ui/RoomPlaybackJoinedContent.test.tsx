import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import RoomPlaybackJoinedContent from "./RoomPlaybackJoinedContent";

vi.mock("next/image", () => ({
  default: ({ alt }: { alt?: string }) => <span aria-label={alt || undefined} />,
}));
vi.mock("@/src/features/room/hooks/useRoomMeta", () => ({
  useRoomMeta: () => ({
    data: {
      activeUsersCount: 2,
      hasPassword: false,
      isPublic: true,
      maxParticipants: 10,
      owner: {
        nickname: "방장",
        profileImageUrl: null,
        slug: "owner",
      },
      slug: "room",
      tags: [],
      title: "테스트 방",
    },
  }),
}));
vi.mock("../hooks/useRoomPlaybackViewModel", () => ({
  useRoomPlaybackViewModel: () => ({
    backgroundImageSrc: "/images/default-room.png",
    currentRequester: null,
    currentTrackDurationMs: null,
    currentTrackStory: null,
    currentTrackTitle: null,
    currentVideoId: null,
    isCurrentRequesterRoomOwner: false,
    isCurrentUserRoomOwner: false,
    isQueuingDefaultRoomImage: false,
    playbackStatus: null,
  }),
}));
vi.mock("../hooks/useRoomOwnerSuccessionFeedback", () => ({
  useRoomOwnerSuccessionFeedback: vi.fn(),
}));
vi.mock("../model/roomChatLayout", () => ({
  getRoomChatLayout: () => ({ chatMinHeight: 320, songStackWidth: 400 }),
}));
vi.mock("@/src/features/playlist/add-track/ui/AddTrackAction", () => ({
  default: () => null,
}));
vi.mock("@/src/features/playlist/player/ui/YouTubePlayer", () => ({
  default: () => null,
}));
vi.mock("@/src/features/room/chat/ui/ChatArea", () => ({
  default: () => null,
}));
vi.mock("@/src/features/room/info/ui/RoomInfo", () => ({
  default: () => null,
}));
vi.mock("@/src/features/room/control-bar/ui/RoomControlBar", () => ({
  default: () => null,
}));
vi.mock("@/src/features/room/page/ui/RoomLeaveConfirmDialog", () => ({
  default: () => null,
}));
vi.mock("@/src/features/room/participants/ui/RoomParticipantsPanel", () => ({
  default: ({
    onOpenFriends,
    onOpenSettings,
  }: {
    onOpenFriends: () => void;
    onOpenSettings: () => void;
  }) => (
    <>
      <button type="button" onClick={onOpenSettings}>
        모바일 Setting 열기
      </button>
      <button type="button" onClick={onOpenFriends}>
        모바일 Friends 열기
      </button>
    </>
  ),
}));
vi.mock("@/src/features/room/floating/ui/RoomFloatingWidgets", () => ({
  default: ({
    onOpenFriends,
    onOpenSettings,
  }: {
    onOpenFriends: () => void;
    onOpenSettings: () => void;
  }) => (
    <>
      <button type="button" onClick={onOpenSettings}>
        데스크톱 Setting 열기
      </button>
      <button type="button" onClick={onOpenFriends}>
        데스크톱 Friends 열기
      </button>
    </>
  ),
}));
vi.mock("@/src/features/settings/ui/SettingsModal", () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div role="dialog" aria-label="Setting modal">
      <button type="button" onClick={onClose}>
        Setting 닫기
      </button>
    </div>
  ),
}));
vi.mock("@/src/features/follow/ui/FollowModal", () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div role="dialog" aria-label="Friends modal">
      <button type="button" onClick={onClose}>
        Friends 닫기
      </button>
    </div>
  ),
}));

const currentUser = {
  nickname: "나",
  profileImageUrl: null,
  slug: "me",
  userId: 1,
};

const roomChat = {
  hasOlderMessages: false,
  historyErrorMessage: null,
  isLoadingOlderMessages: false,
  isSending: false,
  loadOlderMessages: vi.fn(),
  messages: [],
  scrollToLatestKey: 0,
  sendMessage: vi.fn(() => true),
};

const floatingWidgets = {
  activateWidget: vi.fn(),
  closeAllWidgets: vi.fn(),
  handleWidgetStop: vi.fn(),
  isViewportReady: false,
  resetWidgetPositions: vi.fn(),
  toggleWidget: vi.fn(),
  viewportSize: { height: 900, width: 1440 },
  widgets: {
    chat: { isOpen: false },
    participants: { isOpen: true },
    profile: { isOpen: false },
    queue: { isOpen: false },
  },
};

function renderContent({ isMobileLayout }: { isMobileLayout: boolean }) {
  return render(
    <RoomPlaybackJoinedContent
      currentUser={currentUser}
      floatingWidgets={floatingWidgets as never}
      hasNextParticipantsPage={false}
      isCurrentUserLoading={false}
      isFetchingNextParticipantsPage={false}
      isMobileLayout={isMobileLayout}
      isParticipantsLoadMoreError={false}
      livePlaybackStatus={null}
      mobileTab="participants"
      onLeaveRoom={() => true}
      onLoadMoreParticipants={() => Promise.resolve()}
      participants={[]}
      resolveParticipantByUserSlug={() => Promise.resolve(null)}
      roomAccessToken="access-token"
      roomChat={roomChat as never}
      setMobileTab={vi.fn()}
      slug="room"
    />,
  );
}

describe("RoomPlaybackJoinedContent self modals", () => {
  it("모바일 참가자 패널의 내 메뉴 요청으로 기존 modal layer를 전환한다", async () => {
    const user = userEvent.setup();
    renderContent({ isMobileLayout: true });

    await user.click(screen.getByRole("button", { name: "모바일 Setting 열기" }));
    expect(screen.getByRole("dialog", { name: "Setting modal" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Setting 닫기" }));
    expect(screen.queryByRole("dialog", { name: "Setting modal" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "모바일 Friends 열기" }));
    expect(screen.getByRole("dialog", { name: "Friends modal" })).toBeVisible();
  });

  it("데스크톱 draggable widget의 요청도 화면 최상위 modal layer로 전달한다", async () => {
    const user = userEvent.setup();
    renderContent({ isMobileLayout: false });

    await user.click(
      screen.getByRole("button", { name: "데스크톱 Setting 열기" }),
    );
    expect(screen.getByRole("dialog", { name: "Setting modal" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Setting 닫기" }));
    await user.click(
      screen.getByRole("button", { name: "데스크톱 Friends 열기" }),
    );
    expect(screen.getByRole("dialog", { name: "Friends modal" })).toBeVisible();
  });
});
