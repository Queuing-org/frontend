const ROOM_JOIN_PASSWORD_PREFIX = "room-password:";

function getRoomJoinPasswordKey(slug: string) {
  return `${ROOM_JOIN_PASSWORD_PREFIX}${slug}`;
}

export function readStoredRoomJoinPassword(slug: string) {
  if (typeof window === "undefined") return null;

  try {
    return window.sessionStorage.getItem(getRoomJoinPasswordKey(slug));
  } catch {
    return null;
  }
}

export function writeStoredRoomJoinPassword(slug: string, password: string) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(getRoomJoinPasswordKey(slug), password);
  } catch {}
}

export function clearStoredRoomJoinPassword(slug: string) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(getRoomJoinPasswordKey(slug));
  } catch {}
}
