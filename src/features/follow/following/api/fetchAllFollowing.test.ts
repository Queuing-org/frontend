import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAllFollowing } from "./fetchAllFollowing";
import { fetchFollowing } from "./fetchFollowing";

vi.mock("./fetchFollowing", () => ({ fetchFollowing: vi.fn() }));

const user = (slug: string, cursorId: number) => ({
  cursorId,
  nickname: slug,
  online: false,
  presenceVersion: 1,
  profileImageUrl: null,
  room: null,
  slug,
});

describe("fetchAllFollowing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("nextCursor를 lastId로 전달해 모든 팔로잉 page를 합친다", async () => {
    vi.mocked(fetchFollowing)
      .mockResolvedValueOnce({
        hasNext: true,
        items: [user("first", 100)],
        nextCursor: 90,
      })
      .mockResolvedValueOnce({
        hasNext: false,
        items: [user("target", 90)],
        nextCursor: null,
      });
    const signal = new AbortController().signal;

    await expect(fetchAllFollowing(signal)).resolves.toEqual([
      user("first", 100),
      user("target", 90),
    ]);
    expect(fetchFollowing).toHaveBeenNthCalledWith(
      1,
      { size: 200 },
      signal,
    );
    expect(fetchFollowing).toHaveBeenNthCalledWith(
      2,
      { lastId: 90, size: 200 },
      signal,
    );
  });

  it("hasNext cursor가 없거나 반복되면 false 관계 대신 오류를 반환한다", async () => {
    vi.mocked(fetchFollowing).mockResolvedValue({
      hasNext: true,
      items: [],
      nextCursor: null,
    });

    await expect(fetchAllFollowing()).rejects.toMatchObject({
      code: "invalid-response",
      status: 500,
    });
  });
});
