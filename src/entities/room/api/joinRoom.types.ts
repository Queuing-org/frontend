import type { RoomJoinedData } from "../model/types";

export type JoinRoomPayload = {
  password?: string | null;
};

export type JoinRoomResult = {
  roomSlug: string;
  timestamp: number;
  data: RoomJoinedData | null;
};
