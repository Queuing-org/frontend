import type {
  PlaylistParticipant,
  RoomParticipantsPage,
} from "@/src/features/playlist/model/types";

export type RoomParticipantPageSnapshot = {
  hasNextPage: boolean;
  pages: readonly RoomParticipantsPage[];
};

export type ResolveRoomParticipantByUserSlug = (
  userSlug: string,
) => Promise<PlaylistParticipant | null>;

type FetchNextParticipantPage = () => Promise<RoomParticipantPageSnapshot>;

const EMPTY_SNAPSHOT: RoomParticipantPageSnapshot = {
  hasNextPage: false,
  pages: [],
};

function normalizeUserSlug(userSlug: string) {
  return userSlug.trim();
}

function findUserParticipant(
  pages: readonly RoomParticipantsPage[],
  userSlug: string,
) {
  for (const page of pages) {
    const participant = page.items.find(
      (candidate) =>
        candidate.participantType === "USER" &&
        candidate.userSlug?.trim() === userSlug,
    );
    if (participant) {
      return participant;
    }
  }

  return null;
}

function getPendingCursor(snapshot: RoomParticipantPageSnapshot) {
  if (!snapshot.hasNextPage) {
    return null;
  }

  return snapshot.pages.at(-1)?.nextCursor || null;
}

function getParticipantIdentityKeys(snapshot: RoomParticipantPageSnapshot) {
  return new Set(
    snapshot.pages.flatMap((page) =>
      page.items.map((participant) => participant.participantId),
    ),
  );
}

function hasUniqueParticipantProgress(
  previousKeys: ReadonlySet<string>,
  nextSnapshot: RoomParticipantPageSnapshot,
) {
  return nextSnapshot.pages.some((page) =>
    page.items.some(
      (participant) => !previousKeys.has(participant.participantId),
    ),
  );
}

function getPreviouslyExposedCursors(
  pages: readonly RoomParticipantsPage[],
) {
  const seenCursors = new Set<string>();

  pages.slice(0, -1).forEach((page) => {
    if (page.nextCursor) {
      seenCursors.add(page.nextCursor);
    }
  });

  return seenCursors;
}

export function createRoomParticipantPageCoordinator(scopeKey = "") {
  let snapshot = EMPTY_SNAPSHOT;
  let fetchNextPage: FetchNextParticipantPage | null = null;
  let nextPageRequest: Promise<RoomParticipantPageSnapshot> | null = null;

  const update = (
    nextSnapshot: RoomParticipantPageSnapshot,
    nextFetchPage: FetchNextParticipantPage,
  ) => {
    snapshot = nextSnapshot;
    fetchNextPage = nextFetchPage;
  };

  const loadNextPage = async () => {
    if (!snapshot.hasNextPage) {
      return snapshot;
    }
    if (nextPageRequest) {
      return nextPageRequest;
    }
    if (!fetchNextPage) {
      throw new Error("참가자 다음 페이지 요청이 준비되지 않았습니다.");
    }

    const request = Promise.resolve()
      .then(() => fetchNextPage?.() ?? snapshot)
      .then((nextSnapshot) => {
        snapshot = nextSnapshot;
        return nextSnapshot;
      });
    nextPageRequest = request;

    try {
      return await request;
    } finally {
      if (nextPageRequest === request) {
        nextPageRequest = null;
      }
    }
  };

  const resolveParticipantByUserSlug: ResolveRoomParticipantByUserSlug =
    async (rawUserSlug) => {
      const userSlug = normalizeUserSlug(rawUserSlug);
      if (!userSlug) {
        return null;
      }
      const seenCursors = getPreviouslyExposedCursors(snapshot.pages);

      while (true) {
        const participant = findUserParticipant(snapshot.pages, userSlug);
        if (participant) {
          return participant;
        }
        if (!snapshot.hasNextPage) {
          return null;
        }

        const requestCursor = getPendingCursor(snapshot);
        if (!requestCursor || seenCursors.has(requestCursor)) {
          throw new Error("참가자 cursor가 진행되지 않았습니다.");
        }
        seenCursors.add(requestCursor);
        const previousParticipantKeys =
          getParticipantIdentityKeys(snapshot);
        const nextSnapshot = await loadNextPage();
        const resolvedParticipant = findUserParticipant(
          nextSnapshot.pages,
          userSlug,
        );
        if (resolvedParticipant) {
          return resolvedParticipant;
        }
        if (!nextSnapshot.hasNextPage) {
          continue;
        }

        const nextCursor = getPendingCursor(nextSnapshot);
        const participantProgressed = hasUniqueParticipantProgress(
          previousParticipantKeys,
          nextSnapshot,
        );
        const nextCursorWasSeen =
          !nextCursor || seenCursors.has(nextCursor);
        const hasCursorOrParticipantProgress =
          nextCursor !== requestCursor || participantProgressed;
        if (nextCursorWasSeen || !hasCursorOrParticipantProgress) {
          throw new Error("참가자 cursor가 진행되지 않았습니다.");
        }
      }
    };

  return {
    loadNextPage,
    resolveParticipantByUserSlug,
    scopeKey,
    update,
  };
}
