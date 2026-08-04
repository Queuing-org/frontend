import type {
  FollowListResponse,
  FollowPresenceEvent,
  FollowUser,
} from "../../model/types";

export function applyPresenceToUser(
  user: FollowUser,
  event: FollowPresenceEvent,
): FollowUser {
  if (
    user.slug !== event.data.userSlug ||
    event.data.version <= user.presenceVersion
  ) {
    return user;
  }

  return {
    ...user,
    online: event.data.online,
    room: event.data.room,
    presenceVersion: event.data.version,
  };
}

export function applyPresenceToList(
  list: FollowListResponse | undefined,
  event: FollowPresenceEvent,
) {
  if (!list) {
    return list;
  }

  return {
    ...list,
    items: list.items.map((user) => applyPresenceToUser(user, event)),
  };
}

export function parseFollowPresenceEvent(
  body: string,
): FollowPresenceEvent | null {
  let value: unknown;
  try {
    value = JSON.parse(body);
  } catch {
    return null;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<FollowPresenceEvent>;
  const data = candidate.data;
  if (
    candidate.type !== "USER_PRESENCE_CHANGED" ||
    !data ||
    typeof data.userSlug !== "string" ||
    typeof data.online !== "boolean" ||
    typeof data.version !== "number" ||
    !(
      data.room === null ||
      (typeof data.room === "object" &&
        typeof data.room.slug === "string" &&
        typeof data.room.title === "string")
    )
  ) {
    return null;
  }

  return candidate as FollowPresenceEvent;
}
