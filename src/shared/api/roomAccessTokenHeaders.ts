export type RoomAccessTokenHeaders = {
  "X-Room-Access-Token": string;
};

export function buildRoomAccessTokenHeaders(
  accessToken?: string | null,
): RoomAccessTokenHeaders | undefined {
  const normalizedToken = accessToken?.trim();

  return normalizedToken
    ? { "X-Room-Access-Token": normalizedToken }
    : undefined;
}
