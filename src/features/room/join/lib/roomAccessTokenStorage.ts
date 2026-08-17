import { normalizeRoomSlug } from "@/src/shared/lib/normalizeRoomSlug";

const ROOM_ACCESS_TOKEN_PREFIX = "room-access-token:";
const LEGACY_ROOM_PASSWORD_PREFIX = "room-password:";

function getRoomAccessTokenKey(slug: string) {
  return `${ROOM_ACCESS_TOKEN_PREFIX}${normalizeRoomSlug(slug)}`;
}

export function readStoredRoomAccessToken(slug: string) {
  const normalizedSlug = normalizeRoomSlug(slug);
  if (typeof window === "undefined" || !normalizedSlug) {
    return null;
  }

  try {
    const accessToken =
      window.sessionStorage
        .getItem(getRoomAccessTokenKey(normalizedSlug))
        ?.trim() || null;
    window.sessionStorage.removeItem(
      `${LEGACY_ROOM_PASSWORD_PREFIX}${normalizedSlug}`,
    );
    return accessToken;
  } catch {
    return null;
  }
}

export function writeStoredRoomAccessToken(slug: string, accessToken: string) {
  const normalizedSlug = normalizeRoomSlug(slug);
  const normalizedToken = accessToken.trim();
  if (typeof window === "undefined" || !normalizedSlug || !normalizedToken) {
    return;
  }

  try {
    window.sessionStorage.setItem(
      getRoomAccessTokenKey(normalizedSlug),
      normalizedToken,
    );
    window.sessionStorage.removeItem(
      `${LEGACY_ROOM_PASSWORD_PREFIX}${normalizedSlug}`,
    );
  } catch {}
}

export function clearStoredRoomAccessToken(slug: string) {
  if (typeof window === "undefined" || !normalizeRoomSlug(slug)) {
    return;
  }

  try {
    const normalizedSlug = normalizeRoomSlug(slug);
    window.sessionStorage.removeItem(getRoomAccessTokenKey(normalizedSlug));
    window.sessionStorage.removeItem(
      `${LEGACY_ROOM_PASSWORD_PREFIX}${normalizedSlug}`,
    );
  } catch {}
}
