export type JoinRoomPayload = {
  password?: string | null;
};

export type JoinRoomResult = {
  roomSlug: string;
  timestamp: number;
  data: unknown;
};
