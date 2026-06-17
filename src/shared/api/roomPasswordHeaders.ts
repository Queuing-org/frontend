export type RoomPasswordHeaders = {
  "X-Room-Password": string;
};

export function buildRoomPasswordHeaders(
  password?: string | null,
): RoomPasswordHeaders | undefined {
  return password ? { "X-Room-Password": password } : undefined;
}
