import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useQueries } from "@tanstack/react-query";
import type { PlaylistParticipant } from "@/src/features/playlist/model/types";
import { useFollowingRelationship } from "@/src/features/follow/following/hooks/useFollowingRelationship";
import RoomParticipantList, {
  PARTICIPANT_CARD_DOM_LIMIT,
} from "./RoomParticipantList";

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

class IntersectionObserverMock {
  static callback: IntersectionObserverCallback | null = null;
  static options: IntersectionObserverInit | undefined;
  static observed: Element[] = [];

  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    IntersectionObserverMock.callback = callback;
    IntersectionObserverMock.options = options;
  }

  disconnect = vi.fn();
  observe = vi.fn((element: Element) => {
    IntersectionObserverMock.observed.push(element);
  });
  takeRecords = vi.fn(() => []);
  unobserve = vi.fn();
  root = null;
  rootMargin = "0px";
  thresholds = [0];
}

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

function getLatestBadgeQueries() {
  const useQueriesMock = useQueries as unknown as {
    mock: { calls: Array<[{ queries: readonly unknown[] }]> };
  };

  return useQueriesMock.mock.calls.at(-1)?.[0].queries;
}

function renderList({
  canModerateParticipants = true,
  currentUser = {
    nickname: "방장",
    profileImageUrl: null,
    slug: "owner",
    userId: 1,
  },
  items = participants,
}: {
  canModerateParticipants?: boolean;
  currentUser?: {
    nickname: string;
    profileImageUrl: null;
    slug: string;
    userId: number;
  } | null;
  items?: PlaylistParticipant[];
} = {}) {
  return render(
    <RoomParticipantList
      canModerateParticipants={canModerateParticipants}
      currentUser={currentUser}
      isKickPending={false}
      isTransferPending={false}
      kickingParticipantKey={null}
      owner={{ nickname: "방장", profileImageUrl: null, slug: "owner" }}
      participants={items}
      transferringUserSlug={null}
      {...callbacks}
    />,
  );
}

describe("RoomParticipantList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    IntersectionObserverMock.callback = null;
    IntersectionObserverMock.options = undefined;
    IntersectionObserverMock.observed = [];
    vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
    vi.mocked(useFollowingRelationship).mockReturnValue({
      data: false,
      isLoading: false,
    } as ReturnType<typeof useFollowingRelationship>);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("화면 근처 회원 카드의 칭호만 query observer를 만든다", () => {
    renderList();

    expect(screen.getByLabelText("참가자 목록")).toHaveAttribute(
      "tabindex",
      "0",
    );
    expect(IntersectionObserverMock.observed).toHaveLength(2);
    expect(IntersectionObserverMock.options?.root).toBe(
      screen.getByLabelText("참가자 목록"),
    );
    expect(getLatestBadgeQueries()).toHaveLength(0);

    const memberCard = IntersectionObserverMock.observed.find(
      (element) =>
        (element as HTMLElement).dataset.badgeUserSlug === "member",
    );
    expect(memberCard).toBeDefined();

    act(() => {
      IntersectionObserverMock.callback?.(
        [
          {
            isIntersecting: true,
            target: memberCard,
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
    });

    const visibleQueries = getLatestBadgeQueries();
    expect(visibleQueries).toHaveLength(1);
    expect(visibleQueries?.[0]).toMatchObject({ staleTime: 300_000 });
  });

  it("로드된 참가자가 250명이어도 mount card 상한을 유지하고 scroll window만 교체한다", () => {
    const manyParticipants = Array.from(
      { length: 250 },
      (_, index): PlaylistParticipant => ({
        nickname: `회원 ${index}`,
        participantId: `participant-${index}`,
        participantType: "USER",
        profileImageUrl: null,
        userSlug: `member-${index}`,
      }),
    );
    renderList({ items: manyParticipants });
    const list = screen.getByLabelText("참가자 목록");

    expect(list.querySelectorAll("[data-participant-key]")).toHaveLength(
      PARTICIPANT_CARD_DOM_LIMIT,
    );
    expect(screen.getByText("회원 0")).toBeVisible();
    expect(screen.queryByText("회원 100")).toBeNull();

    Object.defineProperty(list, "scrollTop", {
      configurable: true,
      value: 100 * 68,
    });
    fireEvent.scroll(list);

    expect(list.querySelectorAll("[data-participant-key]")).toHaveLength(
      PARTICIPANT_CARD_DOM_LIMIT,
    );
    expect(screen.queryByText("회원 0")).toBeNull();
    expect(screen.getByText("회원 100")).toBeVisible();
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
    expect(trigger.closest("[data-participant-key]")).toHaveAttribute(
      "data-expanded",
      "true",
    );
    expect(screen.getByRole("menuitem", { name: "팔로우" })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: "신고" })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: "차단" })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: "내보내기" })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: "방장 위임" })).toBeVisible();

    await user.click(trigger);
    expect(screen.queryByRole("menu", { name: "회원 참가자 관리" })).toBeNull();
    expect(trigger.closest("[data-participant-key]")).not.toHaveAttribute(
      "data-expanded",
    );
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

  it("작은 scroll에서도 열린 참가자 메뉴를 유지한다", async () => {
    const user = userEvent.setup();
    renderList();
    const list = screen.getByLabelText("참가자 목록");

    await user.click(
      screen.getByRole("button", { name: "회원 참가자 관리 메뉴" }),
    );
    expect(screen.getByRole("menu", { name: "회원 참가자 관리" })).toBeVisible();

    fireEvent.scroll(list);

    expect(screen.getByRole("menu", { name: "회원 참가자 관리" })).toBeVisible();
  });

  it("가상 window 밖으로 이동한 참가자의 메뉴는 닫는다", async () => {
    const user = userEvent.setup();
    const manyParticipants = Array.from(
      { length: 250 },
      (_, index): PlaylistParticipant => ({
        nickname: `회원 ${index}`,
        participantId: `participant-${index}`,
        participantType: "USER",
        profileImageUrl: null,
        userSlug: `member-${index}`,
      }),
    );
    renderList({ items: manyParticipants });
    const list = screen.getByLabelText("참가자 목록");

    await user.click(
      screen.getByRole("button", { name: "회원 0 참가자 관리 메뉴" }),
    );
    Object.defineProperty(list, "scrollTop", {
      configurable: true,
      value: 100 * 68,
    });
    fireEvent.scroll(list);

    expect(screen.queryByRole("menu", { name: "회원 0 참가자 관리" })).toBeNull();
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

  it("일반 로그인 사용자도 다른 회원의 사회 액션 메뉴를 열 수 있다", async () => {
    const user = userEvent.setup();
    renderList({
      canModerateParticipants: false,
      currentUser: {
        nickname: "회원",
        profileImageUrl: null,
        slug: "member",
        userId: 2,
      },
    });

    const ownerTrigger = screen.getByRole("button", {
      name: "방장 참가자 관리 메뉴",
    });
    expect(
      screen.queryByRole("button", { name: "회원 참가자 관리 메뉴" }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "게스트 참가자 관리 메뉴" }),
    ).toBeNull();

    await user.click(ownerTrigger);

    expect(screen.getByRole("menuitem", { name: "팔로우" })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: "신고" })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: "차단" })).toBeVisible();
    expect(screen.queryByRole("menuitem", { name: "내보내기" })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: "방장 위임" })).toBeNull();
  });

  it("비로그인 사용자는 참가자 관리 메뉴를 열 수 없다", () => {
    renderList({ canModerateParticipants: false, currentUser: null });

    expect(screen.queryByRole("button", { name: /참가자 관리 메뉴/ })).toBeNull();
  });

  it("참가자 메뉴를 overflow 경계 밖 body portal에 연다", async () => {
    const user = userEvent.setup();
    renderList();
    const trigger = screen.getByRole("button", {
      name: "회원 참가자 관리 메뉴",
    });

    await user.click(trigger);

    const menu = screen.getByRole("menu");
    expect(menu).toHaveAttribute("data-positioning", "viewport");
    expect(menu.parentElement).toBe(document.body);
  });
});
