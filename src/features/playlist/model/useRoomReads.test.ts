import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchRoomParticipantsPage } from "../api/fetchRoomParticipants";
import { fetchRoomPlayback } from "../api/fetchRoomPlayback";
import { useRoomParticipants } from "./useRoomParticipants";
import { useRoomPlayback } from "./useRoomPlayback";

const { useInfiniteQuery, useQuery } = vi.hoisted(() => ({
  useInfiniteQuery: vi.fn(),
  useQuery: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({ useInfiniteQuery, useQuery }));
vi.mock("../api/fetchRoomParticipants", () => ({
  fetchRoomParticipantsPage: vi.fn(),
  getNextRoomParticipantsPageParam: vi.fn((page) => page.nextCursor),
}));
vi.mock("../api/fetchRoomPlayback", () => ({
  fetchRoomPlayback: vi.fn(),
}));

describe("room read query hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("React Query AbortSignal을 playback GET에 전달한다", async () => {
    useRoomPlayback("room", "secret", true);
    const options = useQuery.mock.calls[0]?.[0];
    const signal = new AbortController().signal;

    expect(options.queryKey).toEqual(["roomPlayback", "room"]);
    expect(options.queryKey).not.toContain("secret");
    await options.queryFn({ signal });

    expect(fetchRoomPlayback).toHaveBeenCalledWith({
      slug: "room",
      accessToken: "secret",
      signal,
    });
  });

  it("participant infinite query가 요청한 cursor page에 AbortSignal을 전달한다", async () => {
    useRoomParticipants("room", "secret", true);
    const options = useInfiniteQuery.mock.calls[0]?.[0];
    const signal = new AbortController().signal;

    expect(options.queryKey).toEqual(["roomParticipants", "room"]);
    expect(options.queryKey).not.toContain("secret");
    await options.queryFn({ pageParam: "next", signal });

    expect(fetchRoomParticipantsPage).toHaveBeenCalledWith({
      cursor: "next",
      slug: "room",
      accessToken: "secret",
      signal,
    });
    expect(options.initialPageParam).toBeNull();
  });
});
