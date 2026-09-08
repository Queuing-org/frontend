import type {
  InfiniteData,
  QueryClient,
  QueryKey,
} from "@tanstack/react-query";
import type {
  PlaylistEntry,
  PlaylistParticipant,
  RoomParticipantsPage,
  RoomPlayback,
  RoomQueuePage,
} from "@/src/features/playlist/model/types";
import type {
  ChatMessage,
  RoomMeta,
  WsEvent,
} from "@/src/features/room/model/types";
import type { User } from "@/src/features/user/model/types";
import type { UserProfile } from "@/src/features/user/profile/model/types";

export type NicknameChange = { nickname: string; timestamp: number };
export type RoomNicknames = ReadonlyMap<string, NicknameChange>;
export const EMPTY_ROOM_NICKNAMES: RoomNicknames = new Map();

export function applyNickname<T extends { nickname: string }>(
  value: T,
  slug: string | null | undefined,
  names: RoomNicknames,
): T {
  const name = slug ? names.get(slug)?.nickname : undefined;
  return name && name !== value.nickname ? { ...value, nickname: name } : value;
}
export function applyChatNicknames(
  messages: ChatMessage[],
  names: RoomNicknames,
) {
  return messages.map((message) => {
    const nickname = message.senderSlug
      ? names.get(message.senderSlug)?.nickname
      : undefined;
    return nickname && message.senderNickname !== nickname
      ? { ...message, senderNickname: nickname }
      : message;
  });
}
function mapPageItems<T, P extends { items: T[] }>(
  data: InfiniteData<P>,
  update: (item: T) => T,
) {
  let changed = false;
  const pages = data.pages.map((page) => {
    const items = page.items.map(update);
    if (items.every((item, index) => item === page.items[index])) return page;
    changed = true;
    return { ...page, items };
  });
  return changed ? { ...data, pages } : data;
}
function applyEntry(entry: PlaylistEntry, names: RoomNicknames) {
  const addedBy = applyNickname(entry.addedBy, entry.addedBy.slug, names);
  return addedBy === entry.addedBy ? entry : { ...entry, addedBy };
}
export function reconcileNicknameCache(
  key: QueryKey,
  data: unknown,
  roomSlug: string,
  names: RoomNicknames,
): unknown {
  if (!data || names.size === 0) return data;
  if (key[0] === "me" || key[0] === "userProfile") {
    const user = data as User | UserProfile;
    return applyNickname(user, user.slug, names);
  }
  if (key[1] !== roomSlug) return data;
  switch (key[0]) {
    case "roomParticipants":
      return mapPageItems<PlaylistParticipant, RoomParticipantsPage>(
        data as InfiniteData<RoomParticipantsPage>,
        (item) => applyNickname(item, item.userSlug, names),
      );
    case "roomQueue":
      return mapPageItems<PlaylistEntry, RoomQueuePage>(
        data as InfiniteData<RoomQueuePage>,
        (entry) => applyEntry(entry, names),
      );
    case "roomPlayback": {
      const playback = data as RoomPlayback;
      if (!playback.currentEntry) return data;
      const currentEntry = applyEntry(playback.currentEntry, names);
      return currentEntry === playback.currentEntry
        ? data
        : { ...playback, currentEntry };
    }
    case "roomMeta": {
      const meta = data as RoomMeta;
      if (!meta.owner) return data;
      const owner = applyNickname(meta.owner, meta.owner.slug, names);
      return owner === meta.owner ? data : { ...meta, owner };
    }
    default:
      return data;
  }
}

// Room-session projection. REST has no nickname version, so received events win
// until an explicit leave. Never rewrite the stored chat history.
export function createRoomNicknameSession(
  queryClient: QueryClient,
  roomSlug: string,
) {
  let names: RoomNicknames = EMPTY_ROOM_NICKNAMES;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  const relevant = (key: QueryKey) =>
    (key[1] === roomSlug &&
      ["roomParticipants", "roomQueue", "roomPlayback", "roomMeta"].includes(
        String(key[0]),
      )) ||
    key[0] === "me" ||
    (key[0] === "userProfile" &&
      typeof key[1] === "string" &&
      names.has(key[1]));
  const patch = (key: QueryKey, data: unknown) => {
    if (!relevant(key)) return;
    const next = reconcileNicknameCache(key, data, roomSlug, names);
    if (next !== data) queryClient.setQueryData(key, next);
  };
  return {
    getSnapshot: () => names,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    attach: () =>
      queryClient.getQueryCache().subscribe((event) => {
        if (event.type === "updated" && event.action.type === "success")
          patch(event.query.queryKey, event.query.state.data);
      }),
    clear: () => {
      if (names.size) {
        names = EMPTY_ROOM_NICKNAMES;
        notify();
      }
    },
    accept: (event: WsEvent) => {
      if (
        event.type !== "ROOM_PARTICIPANT_NICKNAME_CHANGED" ||
        event.roomSlug !== roomSlug ||
        !Number.isFinite(event.timestamp) ||
        event.timestamp <= 0 ||
        !event.data ||
        typeof event.data !== "object"
      )
        return false;
      const data = event.data as { userSlug?: unknown; nickname?: unknown };
      if (
        typeof data.userSlug !== "string" ||
        !data.userSlug.trim() ||
        data.userSlug !== data.userSlug.trim() ||
        typeof data.nickname !== "string" ||
        !data.nickname.trim()
      )
        return false;
      if ((names.get(data.userSlug)?.timestamp ?? -Infinity) >= event.timestamp)
        return false;
      names = new Map(names).set(data.userSlug, {
        nickname: data.nickname,
        timestamp: event.timestamp,
      });
      const queries = queryClient
        .getQueryCache()
        .findAll({ predicate: (query) => relevant(query.queryKey) });
      for (const query of queries) {
        void queryClient.cancelQueries({
          queryKey: query.queryKey,
          exact: true,
        });
        patch(query.queryKey, query.state.data);
        void queryClient.invalidateQueries({
          queryKey: query.queryKey,
          exact: true,
        });
      }
      notify();
      return true;
    },
  };
}
