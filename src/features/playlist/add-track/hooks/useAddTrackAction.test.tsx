import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { publishAddTrack } from "@/src/features/playlist/api/websocket/publishAddTrack";
import { subscribeRoomEvents } from "@/src/features/room/api/websocket/subscribeRoomEvents";
import { subscribeUserRoomEvents } from "@/src/features/room/api/websocket/subscribeUserRoomEvents";
import { useAddTrackForm } from "./useAddTrackForm";
import { useAddTrackAction } from "./useAddTrackAction";

const mocks = vi.hoisted(() => ({
  notify: vi.fn(),
  reset: vi.fn(),
  setError: vi.fn(),
  setErrorMessage: vi.fn(),
  setIsSubmitting: vi.fn(),
}));

vi.mock("@/src/features/playlist/api/websocket/publishAddTrack", () => ({
  publishAddTrack: vi.fn(),
}));
vi.mock("@/src/features/playlist/api/fetchRoomQueue", () => ({
  fetchRoomQueuePage: vi.fn().mockResolvedValue({
    hasNext: false,
    items: [],
    nextCursor: null,
    queueRevision: 1,
    totalPendingCount: 0,
  }),
}));
vi.mock("@/src/features/room/api/websocket/subscribeRoomEvents", () => ({
  subscribeRoomEvents: vi.fn(),
}));
vi.mock("@/src/features/room/api/websocket/subscribeUserRoomEvents", () => ({
  subscribeUserRoomEvents: vi.fn(),
}));
vi.mock("@/src/features/user/session/hooks/useMe", () => ({
  useMe: () => ({
    data: { nickname: "사용자", slug: "user" },
    isError: false,
    isLoading: false,
  }),
}));
vi.mock("@/src/shared/api/query/scheduleQueryInvalidation", () => ({
  scheduleQueryInvalidation: vi.fn(),
}));
vi.mock("@/src/shared/ui/action-feedback/ActionFeedbackProvider", () => ({
  useActionFeedback: () => ({ notify: mocks.notify }),
}));
vi.mock("./useAddTrackForm", () => ({
  ADD_TRACK_STORY_MAX_LENGTH: 30,
  useAddTrackForm: vi.fn(),
}));

function renderAddTrackAction() {
  const queryClient = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useAddTrackAction("room", "secret"), { wrapper });
}

describe("useAddTrackAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAddTrackForm).mockReturnValue({
      reset: mocks.reset,
      setError: mocks.setError,
      setErrorMessage: mocks.setErrorMessage,
      setIsSubmitting: mocks.setIsSubmitting,
      storyValue: "사연",
      queueSource: {
        kind: "video",
        videoId: "video-id",
      },
      queueRequest: {
        videoId: "video-id",
        youtubePlaylist: false,
      },
    } as unknown as ReturnType<typeof useAddTrackForm>);
    vi.mocked(subscribeRoomEvents).mockReturnValue({
      id: "room-events",
      unsubscribe: vi.fn(),
    });
    vi.mocked(subscribeUserRoomEvents).mockReturnValue({
      id: "user-events",
      unsubscribe: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("곡 신청 성공은 모달과 폼만 정리하고 알림을 표시하지 않는다", () => {
    let roomEventHandler: ((message: { body: string }) => void) | undefined;
    vi.mocked(subscribeRoomEvents).mockImplementation((_slug, handler) => {
      roomEventHandler = handler;
      return { id: "room-events", unsubscribe: vi.fn() };
    });
    const { result } = renderAddTrackAction();

    act(() => result.current.openModal());
    act(() => result.current.submit());
    act(() =>
      roomEventHandler?.({
        body: JSON.stringify({
          data: {},
          roomSlug: "room",
          timestamp: 1,
          type: "QUEUE_ADDED",
        }),
      }),
    );

    expect(publishAddTrack).toHaveBeenCalledWith("room", {
      story: "사연",
      videoId: "video-id",
      youtubePlaylist: false,
    });
    expect(result.current.isModalOpen).toBe(false);
    expect(mocks.reset).toHaveBeenCalled();
    expect(mocks.notify).not.toHaveBeenCalled();
  });

  it("곡 신청 요청 실패는 폼 오류와 빨간 공통 알림을 함께 표시한다", () => {
    vi.mocked(publishAddTrack).mockImplementationOnce(() => {
      throw new Error("신청 실패");
    });
    const { result } = renderAddTrackAction();

    act(() => result.current.submit());

    expect(mocks.setError).toHaveBeenCalledWith("form", "신청 실패");
    expect(mocks.notify).toHaveBeenCalledWith({
      dedupeKey: "add-track:room:form",
      message: "신청 실패",
      tone: "error",
    });
  });

  it("WebSocket 확인 timeout도 빨간 공통 알림으로 표시한다", () => {
    vi.useFakeTimers();
    const { result } = renderAddTrackAction();

    act(() => result.current.submit());
    act(() => vi.advanceTimersByTime(15_000));

    expect(mocks.notify).toHaveBeenCalledWith({
      dedupeKey: "add-track:room:form",
      message: "큐잉 결과 확인이 지연되었습니다. 잠시 후 큐 목록을 확인해주세요.",
      tone: "error",
    });
  });

  it("잘못된 YouTube URL은 URL 필드 오류와 빨간 알림으로 표시한다", () => {
    vi.mocked(useAddTrackForm).mockReturnValue({
      reset: mocks.reset,
      setError: mocks.setError,
      setErrorMessage: mocks.setErrorMessage,
      setIsSubmitting: mocks.setIsSubmitting,
      storyValue: "",
      queueSource: null,
      queueRequest: null,
    } as unknown as ReturnType<typeof useAddTrackForm>);
    const { result } = renderAddTrackAction();

    act(() => result.current.submit());

    expect(mocks.setError).toHaveBeenCalledWith(
      "url",
      "올바른 유튜브 영상 또는 재생목록 링크를 입력해주세요.",
    );
    expect(mocks.notify).toHaveBeenCalledWith({
      dedupeKey: "add-track:room:url",
      message: "올바른 유튜브 영상 또는 재생목록 링크를 입력해주세요.",
      tone: "error",
    });
  });

  it("30자를 넘긴 사연은 사연 필드 오류와 빨간 알림으로 표시한다", () => {
    vi.mocked(useAddTrackForm).mockReturnValue({
      reset: mocks.reset,
      setError: mocks.setError,
      setErrorMessage: mocks.setErrorMessage,
      setIsSubmitting: mocks.setIsSubmitting,
      storyValue: "가".repeat(31),
      queueSource: {
        kind: "video",
        videoId: "video-id",
      },
      queueRequest: {
        videoId: "video-id",
        youtubePlaylist: false,
      },
    } as unknown as ReturnType<typeof useAddTrackForm>);
    const { result } = renderAddTrackAction();

    act(() => result.current.submit());

    expect(mocks.setError).toHaveBeenCalledWith(
      "story",
      "노래 선정 이유는 30자 이하로 입력해주세요.",
    );
    expect(mocks.notify).toHaveBeenCalledWith({
      dedupeKey: "add-track:room:story",
      message: "노래 선정 이유는 30자 이하로 입력해주세요.",
      tone: "error",
    });
  });

  it("재생목록 URL은 원본 URL과 youtubePlaylist 옵션을 함께 보낸다", () => {
    const playlistUrl =
      "https://www.youtube.com/watch?v=current&list=PL_playlist-1";
    vi.mocked(useAddTrackForm).mockReturnValue({
      reset: mocks.reset,
      setError: mocks.setError,
      setErrorMessage: mocks.setErrorMessage,
      setIsSubmitting: mocks.setIsSubmitting,
      storyValue: "사연",
      queueSource: {
        currentVideoId: "current",
        kind: "playlist",
        playlistUrl,
      },
      queueRequest: {
        videoId: playlistUrl,
        youtubePlaylist: true,
      },
    } as unknown as ReturnType<typeof useAddTrackForm>);
    const { result } = renderAddTrackAction();

    act(() => result.current.submit());

    expect(publishAddTrack).toHaveBeenCalledWith("room", {
      story: "사연",
      videoId: playlistUrl,
      youtubePlaylist: true,
    });
  });

  it("재생목록 추가 범위를 선택하지 않으면 요청하지 않고 선택 오류를 표시한다", () => {
    const playlistUrl =
      "https://www.youtube.com/watch?v=current&list=PL_playlist-1";
    vi.mocked(useAddTrackForm).mockReturnValue({
      reset: mocks.reset,
      setError: mocks.setError,
      setErrorMessage: mocks.setErrorMessage,
      setIsSubmitting: mocks.setIsSubmitting,
      storyValue: "",
      queueSource: {
        currentVideoId: "current",
        kind: "playlist",
        playlistUrl,
      },
      queueRequest: null,
    } as unknown as ReturnType<typeof useAddTrackForm>);
    const { result } = renderAddTrackAction();

    act(() => result.current.submit());

    expect(publishAddTrack).not.toHaveBeenCalled();
    expect(mocks.setError).toHaveBeenCalledWith(
      "queueMode",
      "현재 영상만 추가할지 재생목록 노래도 함께 추가할지 선택해주세요.",
    );
  });

  it("현재 영상이 없는 재생목록은 전체 추가 선택을 요구한다", () => {
    const playlistUrl =
      "https://www.youtube.com/playlist?list=PL_playlist-1";
    vi.mocked(useAddTrackForm).mockReturnValue({
      reset: mocks.reset,
      setError: mocks.setError,
      setErrorMessage: mocks.setErrorMessage,
      setIsSubmitting: mocks.setIsSubmitting,
      storyValue: "",
      queueSource: {
        currentVideoId: null,
        kind: "playlist",
        playlistUrl,
      },
      queueRequest: null,
    } as unknown as ReturnType<typeof useAddTrackForm>);
    const { result } = renderAddTrackAction();

    act(() => result.current.submit());

    expect(publishAddTrack).not.toHaveBeenCalled();
    expect(mocks.setError).toHaveBeenCalledWith(
      "queueMode",
      "재생목록 노래 추가 여부를 선택해주세요.",
    );
  });

  it("곡 길이 제한 WebSocket 오류는 URL 필드와 빨간 알림에 연결한다", () => {
    let userEventHandler: ((message: { body: string }) => void) | undefined;
    vi.mocked(subscribeUserRoomEvents).mockImplementation((handler) => {
      userEventHandler = handler;
      return { id: "user-events", unsubscribe: vi.fn() };
    });
    const { result } = renderAddTrackAction();

    act(() => result.current.submit());
    act(() =>
      userEventHandler?.({
        body: JSON.stringify({
          data: {
            code: "room.track-duration-limit-exceeded",
            message: "영상이 너무 깁니다.",
            statusCode: 400,
          },
          roomSlug: "room",
          timestamp: 1,
          type: "ERROR",
        }),
      }),
    );

    expect(mocks.setError).toHaveBeenCalledWith("url", "영상이 너무 깁니다.");
    expect(mocks.notify).toHaveBeenCalledWith({
      dedupeKey: "add-track:room:url",
      message: "영상이 너무 깁니다.",
      tone: "error",
    });
  });
});
