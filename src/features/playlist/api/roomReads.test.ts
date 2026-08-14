import { beforeEach, describe, expect, it, vi } from "vitest";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import {
  fetchRoomParticipantsPage,
  getNextRoomParticipantsPageParam,
} from "./fetchRoomParticipants";
import { fetchRoomPlayback } from "./fetchRoomPlayback";
import { fetchRoomQueuePage } from "./fetchRoomQueue";

vi.mock("@/src/shared/api/axiosInstance", () => ({
  axiosInstance: { get: vi.fn() },
}));

vi.mock("@/src/shared/api/roomPasswordHeaders", () => ({
  buildRoomPasswordHeaders: vi.fn((password?: string | null) =>
    password ? { "X-Room-Password": password } : undefined,
  ),
}));

const queueEntry = (entryId: string) => ({
  order: 1,
  track: {
    title: entryId,
    videoId: entryId,
    provider: "YOUTUBE",
    durationMs: 1000,
    thumbnailUrl: "https://example.com/thumbnail.jpg",
  },
  status: {
    skipped: false,
    isActive: false,
    isPlayed: false,
    ownerOrderLocked: false,
  },
  addedBy: { nickname: "신청자", slug: "requester", avatarUrl: null },
  entryId,
  createdAtMs: 1,
  updatedAtMs: 1,
});

describe("v26.8.0 방 조회 API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("큐 첫 페이지는 size만, 다음 페이지는 opaque cursor만 보낸다", async () => {
    const abortController = new AbortController();
    vi.mocked(axiosInstance.get)
      .mockResolvedValueOnce({
        data: {
          result: {
            items: [queueEntry("entry-1")],
            hasNext: true,
            nextCursor: "entry-1",
            queueRevision: 12,
            totalPendingCount: 2,
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          result: {
            items: [queueEntry("entry-2")],
            hasNext: false,
            nextCursor: null,
            queueRevision: 12,
            totalPendingCount: 2,
          },
        },
      });

    await expect(
      fetchRoomQueuePage({
        slug: "room",
        password: "secret",
        signal: abortController.signal,
      }),
    ).resolves.toMatchObject({ totalPendingCount: 2 });
    await fetchRoomQueuePage({
      slug: "room",
      password: "secret",
      cursor: "entry-1",
    });

    expect(axiosInstance.get).toHaveBeenNthCalledWith(
      1,
      "/api/v1/rooms/room/queue-entries",
      {
        params: { size: 30 },
        headers: { "X-Room-Password": "secret" },
        signal: abortController.signal,
      },
    );
    expect(axiosInstance.get).toHaveBeenNthCalledWith(
      2,
      "/api/v1/rooms/room/queue-entries",
      {
        params: {
          cursor: "entry-1",
          size: 30,
        },
        headers: { "X-Room-Password": "secret" },
        signal: undefined,
      },
    );
  });

  it("playback 응답을 분리된 현재 재생 객체로 파싱한다", async () => {
    const playback = {
      currentEntryId: "entry-1",
      currentEntry: queueEntry("entry-1"),
      playbackStatus: {
        status: "PLAYING",
        videoId: "video",
        currentTime: 100,
        serverTimestamp: 200,
      },
      queueRevision: 12,
    };
    vi.mocked(axiosInstance.get).mockResolvedValue({
      data: { result: playback },
    });

    await expect(fetchRoomPlayback({ slug: "room" })).resolves.toEqual(
      playback,
    );
  });

  it("participant 첫 페이지와 명시적으로 요청한 cursor 페이지만 조회한다", async () => {
    const signal = new AbortController().signal;
    vi.mocked(axiosInstance.get)
      .mockResolvedValueOnce({
        data: {
          result: {
            items: [{
              nickname: "A",
              participantId: "a",
              participantType: "GUEST",
              userSlug: null,
              profileImageUrl: null,
            }],
            hasNext: true,
            nextCursor: "a",
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          result: {
            items: [{
              nickname: "B",
              participantId: "b",
              participantType: "GUEST",
              userSlug: null,
              profileImageUrl: null,
            }],
            hasNext: false,
            nextCursor: null,
          },
        },
      });

    await expect(
      fetchRoomParticipantsPage({
        slug: "room",
        password: "secret",
        signal,
      }),
    ).resolves.toMatchObject({ hasNext: true, nextCursor: "a" });
    expect(axiosInstance.get).toHaveBeenCalledTimes(1);
    expect(axiosInstance.get).toHaveBeenNthCalledWith(
      1,
      "/api/v1/rooms/room/participants",
      {
        params: { size: 100 },
        headers: { "X-Room-Password": "secret" },
        signal,
      },
    );

    await fetchRoomParticipantsPage({ slug: "room", cursor: "a" });

    expect(axiosInstance.get).toHaveBeenCalledTimes(2);
    expect(axiosInstance.get).toHaveBeenNthCalledWith(
      2,
      "/api/v1/rooms/room/participants",
      {
        params: { cursor: "a", size: 100 },
        headers: undefined,
        signal: undefined,
      },
    );
  });

  it("participant nextCursor가 이전 page에서 이미 노출됐으면 pagination을 종료한다", () => {
    const pages = [
      { hasNext: true, items: [], nextCursor: "cursor-a" },
      { hasNext: true, items: [], nextCursor: "cursor-b" },
      { hasNext: true, items: [], nextCursor: "cursor-a" },
    ];

    expect(
      getNextRoomParticipantsPageParam(pages[1], pages.slice(0, 2)),
    ).toBe("cursor-b");
    expect(getNextRoomParticipantsPageParam(pages[2], pages)).toBeUndefined();
  });
});
