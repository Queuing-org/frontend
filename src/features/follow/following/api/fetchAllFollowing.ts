import type { FollowingUser } from "@/src/features/follow/model/types";
import { ApiError } from "@/src/shared/api/api-error";
import { fetchFollowing } from "./fetchFollowing";

const FOLLOWING_RELATIONSHIP_PAGE_SIZE = 200;

export async function fetchAllFollowing(
  signal?: AbortSignal,
): Promise<FollowingUser[]> {
  const users: FollowingUser[] = [];
  const seenCursors = new Set<number>();
  let lastId: number | undefined;

  while (true) {
    const page = await fetchFollowing(
      {
        ...(typeof lastId === "number" ? { lastId } : {}),
        size: FOLLOWING_RELATIONSHIP_PAGE_SIZE,
      },
      signal,
    );
    users.push(...page.items);

    if (!page.hasNext) {
      return users;
    }

    const nextCursor = page.nextCursor;
    if (
      typeof nextCursor !== "number" ||
      seenCursors.has(nextCursor)
    ) {
      throw new ApiError({
        status: 500,
        code: "invalid-response",
        message: "팔로잉 관계를 확인하지 못했어요.",
      });
    }

    seenCursors.add(nextCursor);
    lastId = nextCursor;
  }
}
