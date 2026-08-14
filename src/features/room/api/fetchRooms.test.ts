import { beforeEach, describe, expect, it, vi } from "vitest";
import { axiosInstance } from "@/src/shared/api/axiosInstance";
import { fetchRooms } from "./fetchRooms";

vi.mock("@/src/shared/api/axiosInstance", () => ({
  axiosInstance: { get: vi.fn() },
}));

describe("fetchRooms v26.8 cursor", () => {
  beforeEach(() => vi.clearAllMocks());

  it("opaque cursor 하나만 보내고 legacy cursor 필드는 보내지 않는다", async () => {
    vi.mocked(axiosInstance.get).mockResolvedValue({
      data: { result: { rooms: [], hasNext: false } },
    });

    await fetchRooms({
      cursor: "opaque-next",
      size: 30,
      ...({ lastId: 99 } as Record<string, number>),
    });

    expect(axiosInstance.get).toHaveBeenCalledWith("/api/v1/rooms", {
      params: {
        cursor: "opaque-next",
        size: 30,
      },
      signal: undefined,
    });
  });

  it("태그를 정규화해 쉼표로 연결하고 커서 요청에도 함께 보낸다", async () => {
    vi.mocked(axiosInstance.get).mockResolvedValue({
      data: { result: { rooms: [], hasNext: false } },
    });

    await fetchRooms({
      cursor: "next-room",
      tags: [" kpop ", "anime", "kpop"],
    });

    expect(axiosInstance.get).toHaveBeenCalledWith("/api/v1/rooms", {
      params: {
        cursor: "next-room",
        tags: "anime,kpop",
      },
      signal: undefined,
    });
  });

  it("React Query의 AbortSignal을 방 탐색 요청에 전달한다", async () => {
    vi.mocked(axiosInstance.get).mockResolvedValue({
      data: { result: { rooms: [], hasNext: false } },
    });
    const abortController = new AbortController();

    await fetchRooms({ keyword: "재즈" }, abortController.signal);

    expect(axiosInstance.get).toHaveBeenCalledWith("/api/v1/rooms", {
      params: { keyword: "재즈" },
      signal: abortController.signal,
    });
  });
});
