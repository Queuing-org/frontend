export type RoomTag = {
  slug: string;
  name: string;
}; // 웹소켓 호출 가이드 범위 외(기존 REST 태그 응답)

export type Room = {
  id: number;
  slug: string;
  title: string;
  isPrivate: boolean;
  createdAt: string;
  tags: RoomTag[];
}; // 웹소켓 호출 가이드 범위 외(기존 REST 방 응답)

export type RoomMeta = {
  slug: string;
  owner?: unknown | null;
  title: string;
  isPublic: boolean;
  hasPassword: boolean;
  activeUsersCount: number;
};

export type RoomsResponse = {
  rooms: Room[];
  hasNext: boolean;
}; // 웹소켓 호출 가이드 범위 외(기존 REST 목록 응답)

// ---- WebSocket(STOMP) minimal types ----
export type WsEvent = {
  type: string;
  roomSlug: string;
  timestamp: number;
  data: unknown;
}; // 문서 5, 5-1, 5-2, 6 (이벤트 공통 형태)

export type WsErrorData = {
  statusCode: number;
  code: string;
  message: string;
}; // 문서 6 (ERROR data)

export type PlaybackStatus = "PLAYING" | "PAUSED" | "BUFFERING" | "ENDED"; // 문서 4-1, 5-1

export type PlaybackSyncData = {
  videoId: string;
  status: PlaybackStatus;
  currentTime: number;
  serverTimestamp: number;
}; // 문서 5-1 (PLAYBACK_SYNC data)
