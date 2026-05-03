const DEFAULT_ROOM_IMAGES = [
  "/room-defaults/pl.jpg",
  "/room-defaults/qss.jpg",
  "/room-defaults/jz.jpg",
  "/room-defaults/chii.webp",
  "/room-defaults/jjh.jpg",
  "/room-defaults/nohong.png",
] as const;

export function getDefaultRoomImage(roomIndex: number) {
  // TODO: 서버 방 응답에 대표 이미지 URL이 추가되면 이 임시 fallback을 제거한다.
  const imageIndex =
    ((roomIndex % DEFAULT_ROOM_IMAGES.length) + DEFAULT_ROOM_IMAGES.length) %
    DEFAULT_ROOM_IMAGES.length;

  return DEFAULT_ROOM_IMAGES[imageIndex];
}
