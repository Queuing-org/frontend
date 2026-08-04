import { beforeEach, describe, expect, it, vi } from "vitest";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { fetchRoomHistory } from "./fetchRoomHistory";
import { fetchRoomParticipants } from "./fetchRoomParticipants";
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

  it("큐 첫 페이지는 size만, 다음 페이지는 cursor와 queueRevision을 함께 보낸다", async () => {
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
      fetchRoomQueuePage({ slug: "room", password: "secret" }),
    ).resolves.toMatchObject({ totalPendingCount: 2 });
    await fetchRoomQueuePage({
      slug: "room",
      password: "secret",
      cursor: "entry-1",
      queueRevision: 12,
    });

    expect(axiosInstance.get).toHaveBeenNthCalledWith(
      1,
      "/api/v1/rooms/room/playlist",
      {
        params: { size: 100 },
        headers: { "X-Room-Password": "secret" },
      },
    );
    expect(axiosInstance.get).toHaveBeenNthCalledWith(
      2,
      "/api/v1/rooms/room/playlist",
      {
        params: {
          cursor: "entry-1",
          queueRevision: 12,
          size: 100,
        },
        headers: { "X-Room-Password": "secret" },
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

  it("participant cursor 페이지를 모두 합친다", async () => {
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

    await expect(fetchRoomParticipants({ slug: "room" })).resolves.toHaveLength(
      2,
    );
    expect(vi.mocked(axiosInstance.get).mock.calls[1]?.[1]).toMatchObject({
      params: { cursor: "a", size: 100 },
    });
  });

  it("history 다음 페이지 요청에 cursorId를 사용한다", async () => {
    vi.mocked(axiosInstance.get).mockResolvedValue({
      data: {
        result: { items: [], hasNext: false, nextCursor: null },
      },
    });

    await fetchRoomHistory({
      slug: "room",
      password: "secret",
      cursorId: 41,
      size: 100,
    });

    expect(axiosInstance.get).toHaveBeenCalledWith(
      "/api/v1/rooms/room/queue-history",
      {
        params: { cursorId: 41, size: 100 },
        headers: { "X-Room-Password": "secret" },
      },
    );
  });
});
