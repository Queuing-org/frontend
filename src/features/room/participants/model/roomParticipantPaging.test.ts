import { describe, expect, it, vi } from "vitest";
import type {
  PlaylistParticipant,
  RoomParticipantsPage,
} from "@/src/features/playlist/model/types";
import { createRoomParticipantPageCoordinator } from "./roomParticipantPaging";

function participant(userSlug: string): PlaylistParticipant {
  return {
    nickname: userSlug,
    participantId: `participant-${userSlug}`,
    participantType: "USER",
    profileImageUrl: null,
    userSlug,
  };
}

function page(
  items: PlaylistParticipant[],
  nextCursor: string | null,
): RoomParticipantsPage {
  return {
    hasNext: Boolean(nextCursor),
    items,
    nextCursor,
  };
}

describe("room participant page coordinator", () => {
  it("이미 로드된 회원은 추가 page GET 없이 반환한다", async () => {
    const fetchNextPage = vi.fn();
    const coordinator = createRoomParticipantPageCoordinator();
    coordinator.update(
      { hasNextPage: true, pages: [page([participant("loaded")], "next")] },
      fetchNextPage,
    );

    await expect(
      coordinator.resolveParticipantByUserSlug("loaded"),
    ).resolves.toMatchObject({ userSlug: "loaded" });
    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it("동시 lookup은 다음 cursor GET을 single-flight로 공유하고 찾은 page에서 멈춘다", async () => {
    const firstPage = page([], "cursor-1");
    const secondPage = page(
      [participant("target-a"), participant("target-b")],
      "cursor-2",
    );
    let releaseFetch: ((snapshot: {
      hasNextPage: boolean;
      pages: RoomParticipantsPage[];
    }) => void) | null = null;
    const fetchNextPage = vi.fn(
      () =>
        new Promise<{
          hasNextPage: boolean;
          pages: RoomParticipantsPage[];
        }>((resolve) => {
          releaseFetch = resolve;
        }),
    );
    const coordinator = createRoomParticipantPageCoordinator();
    coordinator.update(
      { hasNextPage: true, pages: [firstPage] },
      fetchNextPage,
    );

    const firstLookup = coordinator.resolveParticipantByUserSlug("target-a");
    const secondLookup = coordinator.resolveParticipantByUserSlug("target-b");
    await Promise.resolve();
    expect(fetchNextPage).toHaveBeenCalledTimes(1);

    releaseFetch?.({
      hasNextPage: true,
      pages: [firstPage, secondPage],
    });

    await expect(firstLookup).resolves.toMatchObject({ userSlug: "target-a" });
    await expect(secondLookup).resolves.toMatchObject({ userSlug: "target-b" });
    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it("마지막 cursor까지 없으면 null을 반환하고 진행 없는 cursor는 중단한다", async () => {
    const firstPage = page([], "cursor-1");
    const fetchNextPage = vi.fn().mockResolvedValue({
      hasNextPage: false,
      pages: [firstPage, page([], null)],
    });
    const coordinator = createRoomParticipantPageCoordinator();
    coordinator.update(
      { hasNextPage: true, pages: [firstPage] },
      fetchNextPage,
    );

    await expect(
      coordinator.resolveParticipantByUserSlug("missing"),
    ).resolves.toBeNull();
    expect(fetchNextPage).toHaveBeenCalledTimes(1);

    const stuckCoordinator = createRoomParticipantPageCoordinator();
    stuckCoordinator.update(
      { hasNextPage: true, pages: [firstPage] },
      vi.fn().mockResolvedValue({ hasNextPage: true, pages: [firstPage] }),
    );
    await expect(
      stuckCoordinator.resolveParticipantByUserSlug("missing"),
    ).rejects.toThrow("cursor가 진행되지 않았습니다");
  });

  it("동일 cursor/page가 새 배열 원소로 append돼도 추가 GET 없이 중단한다", async () => {
    const firstPage = page([participant("existing")], "cursor-1");
    const repeatedPage = page([participant("existing")], "cursor-1");
    const fetchNextPage = vi.fn().mockResolvedValue({
      hasNextPage: true,
      pages: [firstPage, repeatedPage],
    });
    const coordinator = createRoomParticipantPageCoordinator();
    coordinator.update(
      { hasNextPage: true, pages: [firstPage] },
      fetchNextPage,
    );

    await expect(
      coordinator.resolveParticipantByUserSlug("missing"),
    ).rejects.toThrow("cursor가 진행되지 않았습니다");
    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });
});
