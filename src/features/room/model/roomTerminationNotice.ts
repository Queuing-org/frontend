export const ROOM_DELETED_NOTICE = "방이 삭제되어 홈으로 이동했어요.";
const ROOM_TERMINATION_NOTICE_KEY = "room-termination-notice";

export function storeRoomDeletedNotice() {
  try {
    window.sessionStorage.setItem(ROOM_TERMINATION_NOTICE_KEY, ROOM_DELETED_NOTICE);
  } catch {}
}

export function consumeRoomTerminationNotice() {
  if (typeof window === "undefined") return null;
  try {
    const notice = window.sessionStorage.getItem(ROOM_TERMINATION_NOTICE_KEY);
    window.sessionStorage.removeItem(ROOM_TERMINATION_NOTICE_KEY);
    return notice;
  } catch {
    return null;
  }
}
