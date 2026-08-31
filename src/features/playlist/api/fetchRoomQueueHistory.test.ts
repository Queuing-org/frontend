import { beforeEach, describe, expect, it, vi } from "vitest";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import {
  fetchRoomQueueHistoryPage,
  getNextRoomQueueHistoryPageParam,
  QUEUE_HISTORY_PAGE_SIZE,
} from "./fetchRoomQueueHistory";
import type { RoomQueueHistoryPage } from "../model/types";

vi.mock("@/src/shared/api/axiosInstance", () => ({
  axiosInstance: { get: vi.fn() },
}));

vi.mock("@/src/shared/api/roomAccessTokenHeaders", () => ({
  buildRoomAccessTokenHeaders: vi.fn((accessToken?: string | null) =>
    accessToken ? { "X-Room-Access-Token": accessToken } : undefined,
  ),
}));

function page(
  hasNext: boolean,
  nextCursor: number | null,
): RoomQueueHistoryPage {
  return { items: [], hasNext, nextCursor };
}

describe("fetchRoomQueueHistoryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(axiosInstance.get).mockResolvedValue({
      data: { result: page(false, null) },
    });
  });

  it("slug, access token, cursorId=0, size=100, AbortSignal 계약을 지킨다", async () => {
    const signal = new AbortController().signal;

    await fetchRoomQueueHistoryPage({
      slug: " my%20room ",
      accessToken: "secret",
      cursorId: 0,
      signal,
    });

    expect(axiosInstance.get).toHaveBeenCalledWith(
      "/api/v1/rooms/my%20room/queue-history",
      {
        params: { cursorId: 0, size: QUEUE_HISTORY_PAGE_SIZE },
        headers: { "X-Room-Access-Token": "secret" },
        signal,
      },
    );
  });

  it("첫 페이지 응답의 result를 unwrap한다", async () => {
    const result = page(true, 41);
    vi.mocked(axiosInstance.get).mockResolvedValue({
      data: { result },
    });

    await expect(
      fetchRoomQueueHistoryPage({ slug: "room", accessToken: "secret" }),
    ).resolves.toBe(result);
    expect(vi.mocked(axiosInstance.get).mock.calls[0]?.[1]).toMatchObject({
      params: { size: 100 },
    });
  });
});

describe("getNextRoomQueueHistoryPageParam", () => {
  it("hasNext여도 cursor가 누락되면 pagination을 중단한다", () => {
    expect(
      getNextRoomQueueHistoryPageParam(page(true, null), [], null, [null]),
    ).toBeUndefined();
  });

  it("이미 요청한 cursor가 반복되면 pagination을 중단한다", () => {
    expect(
      getNextRoomQueueHistoryPageParam(
        page(true, 41),
        [page(true, 41)],
        7,
        [null, 41],
      ),
    ).toBeUndefined();
  });

  it("새 숫자 cursor는 다음 page param으로 사용한다", () => {
    expect(
      getNextRoomQueueHistoryPageParam(
        page(true, 0),
        [page(true, 0)],
        null,
        [null],
      ),
    ).toBe(0);
  });
});
